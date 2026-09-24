-- BF-56: qr_tokens write policy + inspector_sessions lockdown probe.
--
-- Non-destructive by construction: the whole probe is one DO block that ends
-- in RAISE EXCEPTION (SQLSTATE P0999), so every insert/update it makes rolls
-- back. The result table is the exception message. Safe on production after
-- the BF-56 migration is applied. Rehearsal: prepend the migration body inside
-- the same DO block (see the story's validation section).
--
-- Impersonates two real Q&D users via request.jwt.claims + SET LOCAL ROLE:
--   member  213ccf96-4059-47e1-869b-9570f2d4eb87 (org role member)
--   admin   284ff2a0-2ce2-4d19-8b71-6b59d35f0db2 (org role admin)
-- Project d80cdc1c-6199-4f58-a3bc-33b6f7c5caaf (17254 NDOT 4541 7 Bridges),
-- which carries legacy tokens, so a 0-row member UPDATE proves the policy
-- refused visible rows rather than finding nothing to change.

DO $probe$
DECLARE
  proj   constant uuid := 'd80cdc1c-6199-4f58-a3bc-33b6f7c5caaf';
  member constant uuid := '213ccf96-4059-47e1-869b-9570f2d4eb87';
  admin  constant uuid := '284ff2a0-2ce2-4d19-8b71-6b59d35f0db2';
  r      text := E'\n';
  fails  int  := 0;
  n      int;
  st     text;
  new_id uuid;
BEGIN
  -- ---------------------------------------------------------------- member
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.qr_tokens WHERE project_id = proj;
  IF n > 0 THEN r := r || format('PASS T1 member can read project tokens (%s rows)', n) || E'\n';
  ELSE r := r || 'FAIL T1 member sees no tokens (sentinel missing, T3/T4 would be vacuous)' || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.qr_tokens (project_id, expires_at, created_by)
    VALUES (proj, now() + interval '30 days', member);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T2 member INSERT refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T2 member INSERT result ' || st || E'\n'; fails := fails + 1; END IF;

  UPDATE public.qr_tokens SET revoked_at = now() WHERE project_id = proj;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN r := r || 'PASS T3 member UPDATE affected 0 visible rows' || E'\n';
  ELSE r := r || format('FAIL T3 member UPDATE affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  DELETE FROM public.qr_tokens WHERE project_id = proj;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN r := r || 'PASS T4 member DELETE affected 0 visible rows' || E'\n';
  ELSE r := r || format('FAIL T4 member DELETE affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    PERFORM 1 FROM public.inspector_sessions LIMIT 1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T5 authenticated cannot read inspector_sessions (42501)' || E'\n';
  ELSE r := r || 'FAIL T5 authenticated inspector_sessions read result ' || st || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- ----------------------------------------------------------------- admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- Clear any real active stable token inside this rolled-back probe so the
  -- insert below exercises the policy, not the unique index.
  UPDATE public.qr_tokens SET revoked_at = now()
   WHERE project_id = proj AND expires_at IS NULL AND revoked_at IS NULL;

  st := 'ok';
  BEGIN
    INSERT INTO public.qr_tokens (project_id, expires_at, created_by)
    VALUES (proj, NULL, admin) RETURNING id INTO new_id;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = 'ok' AND new_id IS NOT NULL THEN r := r || 'PASS T6 org admin INSERT stable token allowed' || E'\n';
  ELSE r := r || 'FAIL T6 org admin INSERT result ' || st || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.qr_tokens (project_id, expires_at, created_by) VALUES (proj, NULL, admin);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '23505' THEN r := r || 'PASS T7 second active stable token refused by unique index (23505)' || E'\n';
  ELSE r := r || 'FAIL T7 second stable insert result ' || st || E'\n'; fails := fails + 1; END IF;

  UPDATE public.qr_tokens SET revoked_at = now() WHERE id = new_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN r := r || 'PASS T8 org admin UPDATE (revoke) affected exactly its row' || E'\n';
  ELSE r := r || format('FAIL T8 org admin UPDATE affected %s rows', n) || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.qr_tokens (project_id, expires_at, created_by) VALUES (proj, NULL, admin);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = 'ok' THEN r := r || 'PASS T9 after revoke a new stable token is allowed (reissue)' || E'\n';
  ELSE r := r || 'FAIL T9 reissue insert result ' || st || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- ------------------------------------------------------------------ anon
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  SET LOCAL ROLE anon;
  st := 'ok';
  BEGIN
    PERFORM 1 FROM public.inspector_sessions LIMIT 1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T10 anon cannot read inspector_sessions (42501)' || E'\n';
  ELSE r := r || 'FAIL T10 anon inspector_sessions read result ' || st || E'\n'; fails := fails + 1; END IF;
  RESET ROLE;

  r := r || format('RESULT: %s of 10 failed', fails);
  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = 'BF56 PROBE (rolled back)' || r;
END
$probe$;
