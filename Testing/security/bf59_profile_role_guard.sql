-- BF-59 negative suite (SQL level). Run as postgres via psql or the Supabase MCP execute_sql.
-- Every mutating probe runs inside a nested block that measures the outcome and then raises,
-- so NOTHING persists: safe to run on production. The final SELECT is the report.
--
-- What it proves (each row expects PASS):
--   T01-T04  an ordinary authenticated user cannot UPDATE role / platform_role / id / email on their own row (42501)
--   T05      the same user CAN update full_name on their own row (policy still works for allowed columns)
--   T06      the same user cannot touch another user's row (0 rows under RLS)
--   T07      guard trigger fires on the JWT-claim branch even when the DB role is postgres (SECURITY DEFINER path)
--   T08      a service_role request can still change role to a DIFFERENT value (user-management actions keep working)
--   T09      a super admin impersonation still passes is_super_admin()
--   T10-T12  catalog state: column grants, trigger present, policy has WITH CHECK
--   T13      anon holds no write privileges on profiles

CREATE TEMP TABLE IF NOT EXISTS bf59_results (id text, description text, outcome text, detail text);
TRUNCATE bf59_results;

DO $$
DECLARE
  v_user   uuid;   -- ordinary member
  v_other  uuid;   -- some other profile
  v_super  uuid;   -- platform super admin
  v_claims text;
  v_n      int;
  v_sqlstate text;
  v_msg    text;
  v_sets   text[];
  i        int;
BEGIN
  SELECT id INTO v_user FROM public.profiles WHERE role = 'user' AND platform_role = 'member' ORDER BY email LIMIT 1;
  SELECT id INTO v_other FROM public.profiles WHERE id <> v_user ORDER BY email LIMIT 1;
  SELECT id INTO v_super FROM public.profiles WHERE platform_role = 'super_admin' ORDER BY email LIMIT 1;
  IF v_user IS NULL OR v_other IS NULL OR v_super IS NULL THEN
    RAISE EXCEPTION 'fixture users missing (user=%, other=%, super=%)', v_user, v_other, v_super;
  END IF;
  v_claims := json_build_object('sub', v_user, 'role', 'authenticated', 'aud', 'authenticated')::text;

  -- ---- T01..T04: forbidden columns as the ordinary user ------------------
  -- Each probe runs in its own nested block. If the UPDATE goes through we raise our
  -- marker P0999 so the change is rolled back, and the handler records the FAIL
  -- (anything inserted before the raise would be rolled back with it).
  v_sets := ARRAY['platform_role = ''super_admin''', 'role = ''admin''', 'id = ' || quote_literal(v_other) || '::uuid', 'email = ''bf59@example.invalid'''];
  FOR i IN 1..4 LOOP
    v_msg := v_sets[i];
    BEGIN
      PERFORM set_config('request.jwt.claims', v_claims, true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      EXECUTE format('UPDATE public.profiles SET %s WHERE id = %L', v_msg, v_user);
      GET DIAGNOSTICS v_n = ROW_COUNT;
      EXECUTE 'RESET ROLE';
      RAISE EXCEPTION 'probe:%', v_n USING ERRCODE = 'P0999';
    EXCEPTION
      WHEN SQLSTATE 'P0999' THEN
        GET STACKED DIAGNOSTICS v_sqlstate = MESSAGE_TEXT;
        INSERT INTO bf59_results VALUES ('T0' || i, 'ordinary user sets ' || split_part(v_msg, ' ', 1), 'FAIL', 'update succeeded (' || v_sqlstate || ')');
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE;
        EXECUTE 'RESET ROLE';
        INSERT INTO bf59_results VALUES ('T0' || i, 'ordinary user sets ' || split_part(v_msg, ' ', 1),
          CASE WHEN v_sqlstate = '42501' THEN 'PASS' ELSE 'FAIL' END, 'sqlstate ' || v_sqlstate);
    END;
  END LOOP;

  -- ---- T05: allowed column on own row ------------------------------------
  BEGIN
    PERFORM set_config('request.jwt.claims', v_claims, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    EXECUTE format('UPDATE public.profiles SET full_name = full_name WHERE id = %L', v_user);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'probe:%', v_n USING ERRCODE = 'P0999';
  EXCEPTION
    WHEN SQLSTATE 'P0999' THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      INSERT INTO bf59_results VALUES ('T05', 'ordinary user updates own full_name', CASE WHEN v_msg = 'probe:1' THEN 'PASS' ELSE 'FAIL' END, v_msg);
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE;
      EXECUTE 'RESET ROLE';
      INSERT INTO bf59_results VALUES ('T05', 'ordinary user updates own full_name', 'FAIL', 'sqlstate ' || v_sqlstate);
  END;

  -- ---- T06: other user's row is invisible under RLS ----------------------
  BEGIN
    PERFORM set_config('request.jwt.claims', v_claims, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    EXECUTE format('UPDATE public.profiles SET full_name = full_name WHERE id = %L', v_other);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'probe:%', v_n USING ERRCODE = 'P0999';
  EXCEPTION
    WHEN SQLSTATE 'P0999' THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      INSERT INTO bf59_results VALUES ('T06', 'ordinary user updates another user''s row', CASE WHEN v_msg = 'probe:0' THEN 'PASS' ELSE 'FAIL' END, v_msg);
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE;
      EXECUTE 'RESET ROLE';
      INSERT INTO bf59_results VALUES ('T06', 'ordinary user updates another user''s row', 'FAIL', 'sqlstate ' || v_sqlstate);
  END;

  -- ---- T07: trigger JWT-claim branch (DB role stays postgres) -------------
  BEGIN
    PERFORM set_config('request.jwt.claims', v_claims, true);
    EXECUTE format('UPDATE public.profiles SET platform_role = ''super_admin'' WHERE id = %L', v_user);
    INSERT INTO bf59_results VALUES ('T07', 'guard trigger blocks authenticated JWT claim even as postgres', 'FAIL', 'update succeeded');
    RAISE EXCEPTION 'probe' USING ERRCODE = 'P0999';
  EXCEPTION
    WHEN SQLSTATE 'P0999' THEN
      INSERT INTO bf59_results VALUES ('T07', 'guard trigger blocks authenticated JWT claim even as postgres', 'FAIL', 'update succeeded');
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE;
      INSERT INTO bf59_results VALUES ('T07', 'guard trigger blocks authenticated JWT claim even as postgres', CASE WHEN v_sqlstate = '42501' THEN 'PASS' ELSE 'FAIL' END, 'sqlstate ' || v_sqlstate);
  END;

  -- ---- T08: service_role request can change role -------------------------
  -- The value must actually change: the guard only inspects rows where role /
  -- platform_role IS DISTINCT FROM the old value, so `role = role` would never
  -- exercise the service-role exemption (Codex finding, verify round 1). The
  -- probe is rolled back by the P0999 marker like every other one.
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
    EXECUTE 'SET LOCAL ROLE service_role';
    EXECUTE format('UPDATE public.profiles SET role = CASE WHEN role = ''user'' THEN ''admin'' ELSE ''user'' END WHERE id = %L', v_user);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'probe:%', v_n USING ERRCODE = 'P0999';
  EXCEPTION
    WHEN SQLSTATE 'P0999' THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      INSERT INTO bf59_results VALUES ('T08', 'service_role request updates role', CASE WHEN v_msg = 'probe:1' THEN 'PASS' ELSE 'FAIL' END, v_msg);
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE;
      EXECUTE 'RESET ROLE';
      INSERT INTO bf59_results VALUES ('T08', 'service_role request updates role', 'FAIL', 'sqlstate ' || v_sqlstate);
  END;

  -- ---- T09: super admin helper still true for the super admin ------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_super, 'role', 'authenticated')::text, true);
  INSERT INTO bf59_results VALUES ('T09', 'is_super_admin() true for the platform super admin', CASE WHEN public.is_super_admin() THEN 'PASS' ELSE 'FAIL' END, v_super::text);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ---- T10..T13: catalog assertions --------------------------------------------
INSERT INTO bf59_results
SELECT 'T10', 'no UPDATE privilege on role/platform_role/id/email for authenticated/anon',
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END, 'offending grants: ' || count(*)
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles' AND privilege_type = 'UPDATE'
  AND grantee IN ('authenticated', 'anon') AND column_name IN ('role', 'platform_role', 'id', 'email');

INSERT INTO bf59_results
SELECT 'T11', 'guard trigger present on profiles', CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END, 'count=' || count(*)
FROM pg_trigger WHERE tgrelid = 'public.profiles'::regclass AND tgname = 'profiles_guard_privilege_columns' AND NOT tgisinternal;

INSERT INTO bf59_results
SELECT 'T12', 'profiles_update_own has WITH CHECK', CASE WHEN with_check IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, coalesce(with_check, '(none)')
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own';

INSERT INTO bf59_results
SELECT 'T13', 'anon holds no write privileges on profiles', CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END, 'write grants: ' || count(*)
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'profiles' AND grantee = 'anon' AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');

SELECT id, description, outcome, detail FROM bf59_results ORDER BY id;
