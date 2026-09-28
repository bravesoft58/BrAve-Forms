-- BF-60: default table grants probe.
--
-- Non-destructive by construction. One DO block ending in RAISE EXCEPTION
-- (SQLSTATE P0999), so everything it does rolls back, and every mutating case
-- additionally runs inside its own sub-block that always undoes itself with a
-- P0998 marker. The report is the exception message.
--
--   Production, after apply: run this file as is. "before" and "after" then
--   both describe the applied state.
--   Rehearsal: Testing/security/bf60_rehearsal.py splices the migration in at
--   @@MIGRATION@@ (and, with --roundtrip, the rollback at @@ROLLBACK@@), so the
--   same block shows the hole before, the fix after, and that nothing a user
--   can see changed.
--
-- Real Q&D users through request.jwt.claims + SET LOCAL ROLE, so RLS and grants
-- apply exactly as for the app:
--   member  213ccf96-4059-47e1-869b-9570f2d4eb87 (org role member)
--   admin   284ff2a0-2ce2-4d19-8b71-6b59d35f0db2 (org role admin)
--   super   d0b8e31f-82ca-46a4-b0a8-8dc99399c5d2 (platform super admin)
-- Project d80cdc1c-6199-4f58-a3bc-33b6f7c5caaf (17254 NDOT 4541 7 Bridges).

DO $probe$
DECLARE
  proj   constant uuid := 'd80cdc1c-6199-4f58-a3bc-33b6f7c5caaf';
  member constant uuid := '213ccf96-4059-47e1-869b-9570f2d4eb87';
  admin  constant uuid := '284ff2a0-2ce2-4d19-8b71-6b59d35f0db2';
  super  constant uuid := 'd0b8e31f-82ca-46a4-b0a8-8dc99399c5d2';
  tbls   constant text[] := ARRAY[
    'audit_log', 'form_photos', 'form_submission_revisions', 'form_submissions',
    'inspector_sessions', 'organization_invitations', 'organization_members',
    'organizations', 'profiles', 'project_documents', 'project_form_requirements',
    'project_permits', 'project_users', 'projects', 'qr_tokens'];
  twelve constant text[] := ARRAY[
    'audit_log', 'form_photos', 'form_submissions', 'organization_invitations',
    'organization_members', 'organizations', 'project_documents',
    'project_form_requirements', 'project_permits', 'project_users', 'projects', 'qr_tokens'];
  roundtrip boolean := false;
  r      text := E'\n';
  fails  int  := 0;
  n      int;
  st     text;
  ok     boolean;
  sub    uuid;
  doc    uuid;
  proj2  uuid;
  acl0   text;
  acl1   text;
  c      record;
  vis0   jsonb := '{}';
  vis1   jsonb := '{}';
  out0   jsonb := '{}';
  out1   jsonb := '{}';
  pass   int;
BEGIN
  -- ----------------------------------------------------------- fixtures
  SELECT id INTO proj2 FROM public.projects
   WHERE organization_id = (SELECT organization_id FROM public.projects WHERE id = proj) AND id <> proj
   ORDER BY id LIMIT 1;
  INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at)
  VALUES (proj, 'ndep_weekly_stormwater', '{"v":"bf60"}', current_date, 'submitted', member, now())
  RETURNING id INTO sub;
  INSERT INTO public.project_documents (project_id, name, file_path, uploaded_by)
  VALUES (proj, 'bf60 probe', 'bf60/probe.pdf', member)
  RETURNING id INTO doc;

  -- Grant state, order-insensitive: table, column, default ACLs, policy text,
  -- handle_new_user. Used for the rollback round trip.
  SELECT md5(string_agg(x, '|' ORDER BY x)) INTO acl0 FROM (
    SELECT 't:' || pc.relname || ':' || a::text x FROM pg_class pc, unnest(pc.relacl) a
     WHERE pc.relnamespace = 'public'::regnamespace AND pc.relkind = 'r'
    UNION ALL
    SELECT 'c:' || at.attrelid::regclass::text || '.' || at.attname || ':' || a::text FROM pg_attribute at, unnest(at.attacl) a
     WHERE at.attrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r')
    UNION ALL
    SELECT 'd:' || d.defaclobjtype::text || ':' || a::text FROM pg_default_acl d, unnest(d.defaclacl) a
     WHERE d.defaclnamespace = 'public'::regnamespace AND d.defaclrole = 'postgres'::regrole
    UNION ALL
    SELECT 'p:' || policyname || ':' || coalesce(with_check, '') FROM pg_policies
     WHERE schemaname = 'public' AND policyname IN ('submissions_insert', 'project_documents_insert')
    UNION ALL
    SELECT 'f:' || coalesce(array_to_string(proconfig, ','), '') FROM pg_proc WHERE oid = 'public.handle_new_user'::regproc
    UNION ALL
    SELECT 'fa:' || a::text FROM pg_proc, unnest(proacl) a WHERE oid = 'public.handle_new_user'::regproc
  ) s;

  -- The cases: who, statement, what the fixed state must answer.
  -- "allowed" also requires at least one row where the statement names one.
  CREATE TEMP TABLE bf60_cases (id text, who text, sql text, want text) ON COMMIT DROP;
  INSERT INTO bf60_cases VALUES
    ('X01', 'admin',  'TRUNCATE public.audit_log', 'denied'),
    ('X02', 'member', 'TRUNCATE public.form_photos', 'denied'),
    ('X03', 'admin',  format('UPDATE public.form_submissions SET submitted_by = %L WHERE id = %L', admin, sub), 'denied'),
    ('X04', 'admin',  format('UPDATE public.form_submissions SET project_id = %L WHERE id = %L', proj2, sub), 'denied'),
    ('X05', 'member', format('DELETE FROM public.form_submissions WHERE id = %L', sub), 'denied'),
    ('X06', 'member', format('INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at) VALUES (%L, ''ndep_weekly_stormwater'', ''{}'', current_date, ''submitted'', %L, now())', proj, admin), 'denied'),
    ('X07', 'member', format('INSERT INTO public.project_documents (project_id, name, file_path, uploaded_by) VALUES (%L, ''x'', ''x/x.pdf'', %L)', proj, admin), 'denied'),
    ('X08', 'admin',  format('UPDATE public.project_documents SET name = ''renamed'' WHERE id = %L', doc), 'denied'),
    ('X09', 'admin',  format('UPDATE public.projects SET organization_id = organization_id WHERE id = %L', proj), 'denied'),
    ('X10', 'admin',  format('UPDATE public.projects SET created_by = created_by WHERE id = %L', proj), 'denied'),
    ('X11', 'admin',  format('UPDATE public.qr_tokens SET project_id = project_id WHERE project_id = %L', proj), 'denied'),
    ('X12', 'admin',  format('UPDATE public.organization_members SET role = role WHERE user_id = %L', member), 'denied'),
    ('X13', 'admin',  'DELETE FROM public.audit_log WHERE false', 'denied'),
    ('X14', 'member', 'UPDATE public.form_photos SET file_path = file_path WHERE false', 'denied'),
    ('X15', 'anon',   'SELECT count(*) FROM public.form_submissions', 'denied'),
    ('X16', 'anon',   'DELETE FROM public.organizations WHERE false', 'denied'),
    ('X17', 'anon',   'SELECT public.handle_new_user()', 'denied'),
    ('A01', 'member', format('UPDATE public.form_submissions SET data = ''{"v":"edited"}'', form_date = form_date WHERE id = %L', sub), 'allowed'),
    ('A02', 'admin',  format('UPDATE public.form_submissions SET data = ''{"v":"admin"}'' WHERE id = %L', sub), 'allowed'),
    ('A03', 'member', format('INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at, client_key) VALUES (%L, ''ndep_weekly_stormwater'', ''{}'', current_date, ''submitted'', %L, now(), gen_random_uuid())', proj, member), 'allowed'),
    ('A04', 'member', format('INSERT INTO public.project_documents (project_id, name, file_path, file_size, mime_type, category, uploaded_by) VALUES (%L, ''x'', ''x/x.pdf'', 1, ''application/pdf'', ''general'', %L)', proj, member), 'allowed'),
    ('A05', 'member', format('DELETE FROM public.form_photos WHERE submission_id = %L', sub), 'allowed0'),
    ('A06', 'admin',  format('UPDATE public.projects SET name = name, address = address, waterway_sites = waterway_sites WHERE id = %L', proj), 'allowed'),
    ('A07', 'admin',  format('SELECT * FROM public.reissue_inspector_qr(%L, NULL)', proj), 'allowed'),
    ('A08', 'admin',  format('DELETE FROM public.project_documents WHERE id = %L', doc), 'allowed'),
    ('A09', 'admin',  format('UPDATE public.project_users SET role = role WHERE project_id = %L', proj), 'allowed0');

  -- Runs every case; each one is undone by its own P0998 marker.
  -- Outcome: 'allowed:<rows>', or the SQLSTATE plus 'rls' for a policy refusal.
  FOR pass IN 0..1 LOOP
    IF pass = 1 THEN
      -- @@MIGRATION@@
      NULL;
    END IF;

    FOR c IN SELECT * FROM bf60_cases ORDER BY id LOOP
      PERFORM set_config('request.jwt.claims',
        CASE c.who WHEN 'anon' THEN json_build_object('role', 'anon')::text
          ELSE json_build_object('sub', CASE c.who WHEN 'admin' THEN admin ELSE member END, 'role', 'authenticated')::text END, true);
      IF c.who = 'anon' THEN SET LOCAL ROLE anon; ELSE SET LOCAL ROLE authenticated; END IF;
      n := -1;
      BEGIN
        EXECUTE c.sql;
        GET DIAGNOSTICS n = ROW_COUNT;
        RAISE EXCEPTION USING ERRCODE = 'P0998';
      EXCEPTION
        WHEN SQLSTATE 'P0998' THEN st := 'allowed:' || n;
        WHEN OTHERS THEN st := SQLSTATE || CASE WHEN SQLERRM LIKE '%row-level security%' THEN ' rls' ELSE '' END;
      END;
      RESET ROLE;
      IF pass = 0 THEN out0 := out0 || jsonb_build_object(c.id, st);
      ELSE out1 := out1 || jsonb_build_object(c.id, st); END IF;
    END LOOP;

    -- Per-tier visibility of every public table (lesson 2026-04-30).
    FOR c IN SELECT t, who FROM unnest(tbls) t, unnest(ARRAY['member', 'admin', 'super', 'anon']) who LOOP
      PERFORM set_config('request.jwt.claims',
        CASE c.who WHEN 'anon' THEN json_build_object('role', 'anon')::text
          ELSE json_build_object('sub', CASE c.who WHEN 'admin' THEN admin WHEN 'super' THEN super ELSE member END,
                                 'role', 'authenticated')::text END, true);
      IF c.who = 'anon' THEN SET LOCAL ROLE anon; ELSE SET LOCAL ROLE authenticated; END IF;
      BEGIN
        EXECUTE format('SELECT count(*) FROM public.%I', c.t) INTO n;
      EXCEPTION WHEN insufficient_privilege THEN n := -1;
      END;
      RESET ROLE;
      IF pass = 0 THEN vis0 := vis0 || jsonb_build_object(c.t || '/' || c.who, n);
      ELSE vis1 := vis1 || jsonb_build_object(c.t || '/' || c.who, n); END IF;
    END LOOP;
  END LOOP;
  PERFORM set_config('request.jwt.claims', '', true);

  -- ------------------------------------------------------ fixed state: cases
  FOR c IN SELECT * FROM bf60_cases ORDER BY id LOOP
    st := out1 ->> c.id;
    ok := CASE c.want
            WHEN 'denied'   THEN st LIKE '42501%'
            WHEN 'allowed'  THEN st LIKE 'allowed:%' AND split_part(st, ':', 2)::int >= 1
            WHEN 'allowed0' THEN st LIKE 'allowed:%'
          END;
    r := r || format('%s %s %s [%s] before=%s after=%s', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END,
                     c.id, c.who, left(c.sql, 70), out0 ->> c.id, st) || E'\n';
    IF NOT ok THEN fails := fails + 1; END IF;
  END LOOP;

  -- ------------------------------------------------- visibility unchanged
  -- Signed-in tiers must see exactly the same row counts. anon saw nothing
  -- before (no policy) and is refused outright after.
  SELECT count(*) INTO n FROM jsonb_each_text(vis0) b JOIN jsonb_each_text(vis1) a USING (key)
   WHERE CASE WHEN b.key LIKE '%/anon' THEN NOT (b.value::int IN (0, -1) AND a.value::int IN (0, -1))
              ELSE a.value <> b.value END;
  IF n = 0 AND (SELECT count(*) FROM jsonb_object_keys(vis1)) = 60 THEN
    r := r || format('PASS V1 per-tier visibility identical on all 15 tables x 3 signed-in tiers; anon sees nothing (%s)',
                     (SELECT string_agg(key || '=' || value, ' ' ORDER BY key) FROM jsonb_each_text(vis1) WHERE key LIKE 'form_submissions/%')) || E'\n';
  ELSE
    r := r || format('FAIL V1 %s cells changed: %s', n,
                     (SELECT string_agg(b.key || ' ' || b.value || '->' || a.value, ', ') FROM jsonb_each_text(vis0) b
                        JOIN jsonb_each_text(vis1) a USING (key) WHERE a.value <> b.value)) || E'\n';
    fails := fails + 1;
  END IF;

  -- ---------------------------------------------------------- catalog state
  SELECT count(*) INTO n FROM information_schema.table_privileges
   WHERE table_schema = 'public' AND grantee = 'anon' AND table_name = ANY (twelve);
  IF n = 0 THEN r := r || 'PASS C1 anon holds no privilege on the 12 tables' || E'\n';
  ELSE r := r || format('FAIL C1 anon holds %s privileges', n) || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM information_schema.table_privileges
   WHERE table_schema = 'public' AND grantee = 'anon' AND privilege_type <> 'SELECT';
  IF n = 0 THEN r := r || 'PASS C2 anon holds no write privilege on any public table' || E'\n';
  ELSE r := r || format('FAIL C2 anon write privileges: %s', n) || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM information_schema.table_privileges
   WHERE table_schema = 'public' AND grantee IN ('authenticated', 'anon', 'PUBLIC')
     AND privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER');
  IF n = 0 THEN r := r || 'PASS C3 no API role or PUBLIC holds TRUNCATE, REFERENCES or TRIGGER on any public table' || E'\n';
  ELSE r := r || format('FAIL C3 %s table-wide grants remain', n) || E'\n'; fails := fails + 1; END IF;

  -- Exact UPDATE allow-lists: the set of updatable columns equals the intended set.
  FOR c IN SELECT * FROM (VALUES
      ('form_submissions', 'data,form_date'),
      ('projects', 'acres_disturbed,address,completion_date,description,foreman_email,foreman_name,foreman_phone,name,owner_rep_address,owner_rep_email,owner_rep_name,owner_rep_phone,parcel_numbers,pm_email,pm_name,pm_phone,soil_type,start_date,superintendent_email,superintendent_name,superintendent_phone,waterway_sites'),
      ('qr_tokens', 'expires_at,revoked_at'),
      ('organization_members', ''),
      ('form_photos', ''),
      ('project_documents', ''),
      ('audit_log', ''),
      ('profiles', 'full_name,phone')) v(t, cols) LOOP
    SELECT coalesce(string_agg(attname, ',' ORDER BY attname), '') INTO st FROM pg_attribute
     WHERE attrelid = ('public.' || c.t)::regclass AND attnum > 0 AND NOT attisdropped
       AND has_column_privilege('authenticated', attrelid, attnum, 'UPDATE');
    IF st = c.cols THEN r := r || format('PASS C4 %s updatable columns for authenticated: {%s}', c.t, st) || E'\n';
    ELSE r := r || format('FAIL C4 %s updatable {%s}, want {%s}', c.t, st, c.cols) || E'\n'; fails := fails + 1; END IF;
  END LOOP;

  SELECT count(*) INTO n FROM information_schema.column_privileges
   WHERE table_schema = 'public' AND grantee IN ('PUBLIC', 'anon') AND privilege_type = 'UPDATE';
  IF n = 0 THEN r := r || 'PASS C5 no PUBLIC or anon column UPDATE anywhere in public' || E'\n';
  ELSE r := r || format('FAIL C5 %s PUBLIC/anon column UPDATE grants', n) || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM pg_policies
   WHERE schemaname = 'public'
     AND ((policyname = 'submissions_insert' AND with_check LIKE '((submitted_by = ( SELECT auth.uid() AS uid)) AND %')
       OR (policyname = 'project_documents_insert' AND with_check LIKE '((uploaded_by = ( SELECT auth.uid() AS uid)) AND %'));
  IF n = 2 THEN r := r || 'PASS C6 both insert policies start with the signed-in-user binding' || E'\n';
  ELSE r := r || format('FAIL C6 %s of 2 insert policies bind the user', n) || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM pg_default_acl d, unnest(d.defaclacl) a
   WHERE d.defaclnamespace = 'public'::regnamespace AND d.defaclrole = 'postgres'::regrole
     AND (a::text ~ '^(anon|authenticated|service_role)=' OR a::text LIKE '=%');
  IF n = 0 THEN r := r || 'PASS C7 new postgres-created tables, sequences and functions grant nothing to anon, authenticated, service_role or PUBLIC' || E'\n';
  ELSE r := r || format('FAIL C7 %s default grants remain', n) || E'\n'; fails := fails + 1; END IF;

  SELECT NOT has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
     AND NOT has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE')
     AND proconfig = ARRAY['search_path=""']
    INTO ok FROM pg_proc WHERE oid = 'public.handle_new_user'::regproc;
  IF ok THEN r := r || 'PASS C8 handle_new_user not callable by anon/authenticated; search_path pinned empty' || E'\n';
  ELSE r := r || 'FAIL C8 handle_new_user grants or search_path' || E'\n'; fails := fails + 1; END IF;

  -- The auth.users trigger still creates the profile under the pinned
  -- search_path. Undone by its own marker.
  BEGIN
    INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
    VALUES ('00000000-0000-4000-8000-0000000bf600', 'bf60-probe@example.invalid', '{"full_name":"BF60 probe"}', 'authenticated', 'authenticated');
    SELECT count(*) INTO n FROM public.profiles WHERE id = '00000000-0000-4000-8000-0000000bf600' AND full_name = 'BF60 probe';
    RAISE EXCEPTION USING ERRCODE = 'P0998';
  EXCEPTION
    WHEN SQLSTATE 'P0998' THEN st := 'profiles=' || n;
    WHEN OTHERS THEN st := SQLSTATE || ' ' || SQLERRM;
  END;
  IF st = 'profiles=1' THEN r := r || 'PASS C9 a new auth user still gets its profile through handle_new_user' || E'\n';
  ELSE r := r || format('FAIL C9 new auth user: %s', st) || E'\n'; fails := fails + 1; END IF;

  -- -------------------------------------------------------- rollback round trip
  -- @@ROLLBACK@@
  IF roundtrip THEN
    SELECT md5(string_agg(x, '|' ORDER BY x)) INTO acl1 FROM (
      SELECT 't:' || pc.relname || ':' || a::text x FROM pg_class pc, unnest(pc.relacl) a
       WHERE pc.relnamespace = 'public'::regnamespace AND pc.relkind = 'r'
      UNION ALL
      SELECT 'c:' || at.attrelid::regclass::text || '.' || at.attname || ':' || a::text FROM pg_attribute at, unnest(at.attacl) a
       WHERE at.attrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r')
      UNION ALL
      SELECT 'd:' || d.defaclobjtype::text || ':' || a::text FROM pg_default_acl d, unnest(d.defaclacl) a
       WHERE d.defaclnamespace = 'public'::regnamespace AND d.defaclrole = 'postgres'::regrole
      UNION ALL
      SELECT 'p:' || policyname || ':' || coalesce(with_check, '') FROM pg_policies
       WHERE schemaname = 'public' AND policyname IN ('submissions_insert', 'project_documents_insert')
      UNION ALL
      SELECT 'f:' || coalesce(array_to_string(proconfig, ','), '') FROM pg_proc WHERE oid = 'public.handle_new_user'::regproc
      UNION ALL
      SELECT 'fa:' || a::text FROM pg_proc, unnest(proacl) a WHERE oid = 'public.handle_new_user'::regproc
    ) s;
    IF acl1 = acl0 THEN r := r || 'PASS R1 rollback restores every table, column and default ACL, both policies and handle_new_user exactly' || E'\n';
    ELSE r := r || format('FAIL R1 rollback state %s differs from start %s', acl1, acl0) || E'\n'; fails := fails + 1; END IF;
  END IF;

  r := r || format('%s failures', fails);
  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = 'BF60 PROBE (rolled back)' || r;
END
$probe$;
