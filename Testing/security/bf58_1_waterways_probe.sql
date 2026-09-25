-- BF-58.1: Working in Waterways schema, backfill and RLS probe.
--
-- Non-destructive by construction: one DO block ending in RAISE EXCEPTION
-- (SQLSTATE P0999), so every insert and update it makes rolls back. The result
-- table is the exception message. Safe on production once the BF-58.1
-- migration is applied. Rehearsal: the migration body is placed at the top of
-- the same DO block (see the story's validation section), so the rehearsal
-- rolls back the DDL too.
--
-- Impersonates two real Q&D users via request.jwt.claims + SET LOCAL ROLE:
--   member  213ccf96-4059-47e1-869b-9570f2d4eb87 (org role member)
--   admin   284ff2a0-2ce2-4d19-8b71-6b59d35f0db2 (org role admin)
-- plus an outsider: a random UUID with no organization membership.
-- Project d80cdc1c-6199-4f58-a3bc-33b6f7c5caaf (17254 NDOT 4541 7 Bridges),
-- which carries a Waterway permit.

DO $probe$
DECLARE
  proj     constant uuid := 'd80cdc1c-6199-4f58-a3bc-33b6f7c5caaf';
  member   constant uuid := '213ccf96-4059-47e1-869b-9570f2d4eb87';
  admin    constant uuid := '284ff2a0-2ce2-4d19-8b71-6b59d35f0db2';
  outsider constant uuid := gen_random_uuid();
  sites    constant jsonb := '[{"name":"Western Drainage","descriptor":""},{"name":"Eastern Drainage","descriptor":""}]';
  payload  constant jsonb := '{"site_name":"Western Drainage","site_descriptor":"","photos":[]}';
  r        text := E'\n';
  fails    int  := 0;
  n        int;
  expected int;
  st       text;
  member_sub uuid;
  admin_sub  uuid;
BEGIN
  -- ------------------------------------------------------- schema + backfill
  SELECT count(DISTINCT project_id) INTO expected FROM public.project_permits WHERE permit_type = 'waterway';
  SELECT count(*) INTO n FROM public.project_form_requirements pfr
  WHERE pfr.form_type = 'working_in_waterways'
    AND pfr.project_id IN (SELECT project_id FROM public.project_permits WHERE permit_type = 'waterway');
  IF expected > 0 AND n = expected THEN r := r || format('PASS T1 backfill: %s of %s waterway projects have the requirement row', n, expected) || E'\n';
  ELSE r := r || format('FAIL T1 backfill: %s rows for %s waterway projects', n, expected) || E'\n'; fails := fails + 1; END IF;

  INSERT INTO public.project_form_requirements (project_id, form_type, added_by)
  SELECT DISTINCT project_id, 'working_in_waterways', 'auto_permit'
  FROM public.project_permits WHERE permit_type = 'waterway'
  ON CONFLICT (project_id, form_type) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN r := r || 'PASS T2 re-running the backfill inserts 0 rows' || E'\n';
  ELSE r := r || format('FAIL T2 re-run inserted %s rows', n) || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM public.projects WHERE waterway_sites IS DISTINCT FROM '[]'::jsonb;
  IF n = 0 THEN r := r || 'PASS T3 every existing project defaults to an empty site list' || E'\n';
  ELSE r := r || format('INFO T3 %s projects already have sites', n) || E'\n'; END IF;

  st := 'ok';
  BEGIN
    UPDATE public.projects SET waterway_sites = '{"name":"x"}'::jsonb WHERE id = proj;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '23514' THEN r := r || 'PASS T4 non-array waterway_sites rejected (23514)' || E'\n';
  ELSE r := r || 'FAIL T4 non-array waterway_sites result ' || st || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by)
    VALUES (proj, 'working_in_waterway', payload, current_date, 'submitted', admin);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '23514' THEN r := r || 'PASS T5 misspelled form type still rejected (23514)' || E'\n';
  ELSE r := r || 'FAIL T5 misspelled form type result ' || st || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.project_form_requirements (project_id, form_type, added_by)
    VALUES (proj, 'bogus_form', 'manual');
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '23514' THEN r := r || 'PASS T6 requirement CHECK still rejects unknown types (23514)' || E'\n';
  ELSE r := r || 'FAIL T6 requirement CHECK result ' || st || E'\n'; fails := fails + 1; END IF;

  -- ---------------------------------------------------------------- member
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  st := 'ok';
  BEGIN
    INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at)
    VALUES (proj, 'working_in_waterways', payload, current_date, 'submitted', member, now())
    RETURNING id INTO member_sub;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = 'ok' AND member_sub IS NOT NULL THEN r := r || 'PASS T7 member can submit a Working in Waterways form' || E'\n';
  ELSE r := r || 'FAIL T7 member submit result ' || st || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM public.form_submissions WHERE id = member_sub;
  IF n = 1 THEN r := r || 'PASS T8 member reads the submission back' || E'\n';
  ELSE r := r || 'FAIL T8 member cannot read own submission' || E'\n'; fails := fails + 1; END IF;

  UPDATE public.projects SET waterway_sites = sites WHERE id = proj;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN r := r || 'PASS T9 member cannot change the project site list (0 rows)' || E'\n';
  ELSE r := r || format('FAIL T9 member UPDATE of projects.waterway_sites affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- ----------------------------------------------------------------- admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  UPDATE public.projects SET waterway_sites = sites WHERE id = proj;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN r := r || 'PASS T10 org admin sets the project site list' || E'\n';
  ELSE r := r || format('FAIL T10 admin site-list UPDATE affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  UPDATE public.form_submissions SET data = data || '{"initials":"ADM"}'::jsonb WHERE id = member_sub;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN r := r || 'PASS T11 org admin can edit a member''s submission (BF-43)' || E'\n';
  ELSE r := r || format('FAIL T11 admin edit of member submission affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at)
  VALUES (proj, 'working_in_waterways', payload, current_date, 'submitted', admin, now())
  RETURNING id INTO admin_sub;

  RESET ROLE;

  -- ------------------------------------------- member vs admin's submission
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.form_submissions WHERE id = admin_sub;
  IF n = 1 THEN r := r || 'PASS T12 member can see the admin''s submission (org-wide viewing, sentinel for T13)' || E'\n';
  ELSE r := r || 'FAIL T12 member cannot see admin submission (T13 would be vacuous)' || E'\n'; fails := fails + 1; END IF;

  UPDATE public.form_submissions SET data = data || '{"initials":"MEM"}'::jsonb WHERE id = admin_sub;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN r := r || 'PASS T13 member cannot edit someone else''s submission (0 rows)' || E'\n';
  ELSE r := r || format('FAIL T13 member edit of admin submission affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- -------------------------------------------------------------- outsider
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', outsider, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.form_submissions WHERE id IN (member_sub, admin_sub);
  IF n = 0 THEN r := r || 'PASS T14 a user outside the organization sees neither submission' || E'\n';
  ELSE r := r || format('FAIL T14 outsider sees %s submissions', n) || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at)
    VALUES (proj, 'working_in_waterways', payload, current_date, 'submitted', outsider, now());
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T15 outsider INSERT refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T15 outsider INSERT result ' || st || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  r := r || format('%s failures', fails);
  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = 'BF58.1 PROBE (rolled back)' || r;
END
$probe$;
