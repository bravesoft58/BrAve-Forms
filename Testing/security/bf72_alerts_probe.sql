-- BF-72: submission_alerts access probe. Non-destructive by construction: one
-- DO block ending in RAISE EXCEPTION (P0999), so everything it creates rolls
-- back; the result is the exception message. Safe on production once the
-- migration is applied. For a rehearsal before applying, paste the migration
-- body at the @@MIGRATION@@ marker (as BF-74's bf74_rehearsal.py does).
--
-- Proves the effect, not the catalog (BF-60): the service role claims once and
-- only once; a member of the inspection's organization can read the alert but
-- not create or change it; a user of another organization sees nothing; anon
-- is refused; and alert writes leave the inspection's revision history alone.
--
-- Run on production 2026-10-08 (rehearsal, migration spliced in): 12/12 PASS.

DO $probe$
DECLARE
  sub uuid; org_a uuid; member uuid; outsider uuid; org_b uuid;
  r text := E'\n'; fails int := 0; st text; n int; who text;
BEGIN
  -- @@MIGRATION@@

  -- a real Waterways inspection and a real member of its organization
  SELECT s.id, p.organization_id INTO sub, org_a
  FROM public.form_submissions s JOIN public.projects p ON p.id = s.project_id
  WHERE s.form_type = 'working_in_waterways' ORDER BY s.created_at LIMIT 1;
  SELECT m.user_id INTO member FROM public.organization_members m WHERE m.org_id = org_a ORDER BY m.joined_at LIMIT 1;

  -- an outsider: a new org and user that cannot see the inspection
  outsider := gen_random_uuid();
  INSERT INTO auth.users (id, email) VALUES (outsider, 'bf72-outsider@probe.invalid');
  INSERT INTO public.profiles (id, email, full_name) VALUES (outsider, 'bf72-outsider@probe.invalid', 'BF-72 outsider') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.organizations (name, slug) VALUES ('BF-72 probe', 'bf72-probe-' || substr(gen_random_uuid()::text, 1, 8)) RETURNING id INTO org_b;
  INSERT INTO public.organization_members (org_id, user_id, role) VALUES (org_b, outsider, 'admin');

  -- service role: claim, claim again (no row), record
  SET LOCAL ROLE service_role;
  INSERT INTO public.submission_alerts (submission_id, kind, status) VALUES (sub, 'sheen_plume', 'sending') ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN r := r || 'PASS S1 service_role claims the alert row' || E'\n'; ELSE r := r || 'FAIL S1' || E'\n'; fails := fails + 1; END IF;
  INSERT INTO public.submission_alerts (submission_id, kind, status) VALUES (sub, 'sheen_plume', 'sending') ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN r := r || 'PASS S2 a second claim inserts nothing' || E'\n'; ELSE r := r || 'FAIL S2' || E'\n'; fails := fails + 1; END IF;
  UPDATE public.submission_alerts SET status = 'sent', recipient = 'x@probe.invalid' WHERE submission_id = sub;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN r := r || 'PASS S3 service_role records the result' || E'\n'; ELSE r := r || 'FAIL S3' || E'\n'; fails := fails + 1; END IF;
  st := 'ok';
  BEGIN INSERT INTO public.submission_alerts (submission_id, kind, status) VALUES (sub, 'other', 'sent'); EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
  IF st = '23514' THEN r := r || 'PASS S4 unknown kind refused (23514)' || E'\n'; ELSE r := r || 'FAIL S4 ' || st || E'\n'; fails := fails + 1; END IF;
  RESET ROLE;

  FOREACH who IN ARRAY ARRAY['member', 'outsider'] LOOP
    PERFORM set_config('request.jwt.claims', json_build_object('sub', CASE who WHEN 'member' THEN member ELSE outsider END, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO n FROM public.submission_alerts WHERE submission_id = sub;
    IF (who = 'member' AND n = 1) OR (who = 'outsider' AND n = 0) THEN
      r := r || format('PASS A1 %s sees %s alert row(s) for the inspection', who, n) || E'\n';
    ELSE r := r || format('FAIL A1 %s sees %s', who, n) || E'\n'; fails := fails + 1; END IF;
    st := 'ok';
    BEGIN UPDATE public.submission_alerts SET status = 'sent' WHERE submission_id = sub; EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
    IF st = '42501' THEN r := r || format('PASS A2 %s cannot change an alert: 42501', who) || E'\n';
    ELSE r := r || format('FAIL A2 %s update gave %s', who, st) || E'\n'; fails := fails + 1; END IF;
    st := 'ok';
    BEGIN INSERT INTO public.submission_alerts (submission_id, kind, status) VALUES (sub, 'sheen_plume', 'sent'); EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
    IF st = '42501' THEN r := r || format('PASS A3 %s cannot create an alert: 42501', who) || E'\n';
    ELSE r := r || format('FAIL A3 %s insert gave %s', who, st) || E'\n'; fails := fails + 1; END IF;
    RESET ROLE;
  END LOOP;

  SET LOCAL ROLE anon;
  st := 'ok';
  BEGIN PERFORM 1 FROM public.submission_alerts; EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
  RESET ROLE;
  IF st = '42501' THEN r := r || 'PASS A4 anon cannot read alerts: 42501' || E'\n'; ELSE r := r || 'FAIL A4 ' || st || E'\n'; fails := fails + 1; END IF;

  -- the inspection itself is untouched by alert writes
  SELECT count(*) INTO n FROM public.form_submission_revisions WHERE submission_id = sub AND changed_at > now() - interval '1 minute';
  IF n = 0 THEN r := r || 'PASS R1 no revision row written for the inspection' || E'\n'; ELSE r := r || 'FAIL R1 ' || n || E'\n'; fails := fails + 1; END IF;

  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = format('BF-72 probe (sub %s): %s failure(s), everything rolled back%s', left(sub::text, 8), fails, r);
END
$probe$;
