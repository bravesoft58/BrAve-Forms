-- BF-63: form submission revision history probe.
--
-- Non-destructive by construction: one DO block ending in RAISE EXCEPTION
-- (SQLSTATE P0999), so every insert, update and delete it makes rolls back.
-- The result table is the exception message. Safe on production once the BF-63
-- migration is applied. Rehearsal: Testing/security/bf63_rehearsal.py splices
-- the migration body in at the @@MIGRATION@@ marker, so the rehearsal rolls
-- back the DDL too.
--
-- Impersonates two real Q&D users via request.jwt.claims + SET LOCAL ROLE:
--   member  213ccf96-4059-47e1-869b-9570f2d4eb87 (org role member)
--   admin   284ff2a0-2ce2-4d19-8b71-6b59d35f0db2 (org role admin)
-- plus an outsider (random UUID, no organization) and the service_role key.
-- Project d80cdc1c-6199-4f58-a3bc-33b6f7c5caaf (17254 NDOT 4541 7 Bridges).
-- Only rows the probe inserts are touched.

DO $probe$
DECLARE
  proj     constant uuid := 'd80cdc1c-6199-4f58-a3bc-33b6f7c5caaf';
  member   constant uuid := '213ccf96-4059-47e1-869b-9570f2d4eb87';
  admin    constant uuid := '284ff2a0-2ce2-4d19-8b71-6b59d35f0db2';
  outsider constant uuid := gen_random_uuid();
  r        text := E'\n';
  fails    int  := 0;
  n        int;
  st       text;
  seq      text;
  ok       boolean;
  sub0     uuid;
  sub1     uuid;
  rev      record;  -- a form_submission_revisions row (the type is created inside the rehearsal)
BEGIN
  -- @@MIGRATION@@

  -- ------------------------------------------------------ grants and function
  SELECT NOT has_table_privilege('anon', 'public.form_submission_revisions', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.form_submission_revisions', 'INSERT')
     AND NOT has_table_privilege('anon', 'public.form_submission_revisions', 'UPDATE')
     AND NOT has_table_privilege('anon', 'public.form_submission_revisions', 'DELETE')
     AND NOT has_table_privilege('anon', 'public.form_submission_revisions', 'TRUNCATE')
     AND has_table_privilege('authenticated', 'public.form_submission_revisions', 'SELECT')
     AND NOT has_table_privilege('authenticated', 'public.form_submission_revisions', 'INSERT')
     AND NOT has_table_privilege('authenticated', 'public.form_submission_revisions', 'UPDATE')
     AND NOT has_table_privilege('authenticated', 'public.form_submission_revisions', 'DELETE')
     AND NOT has_table_privilege('authenticated', 'public.form_submission_revisions', 'TRUNCATE')
     AND has_table_privilege('service_role', 'public.form_submission_revisions', 'SELECT')
     AND NOT has_table_privilege('service_role', 'public.form_submission_revisions', 'INSERT')
     AND NOT has_table_privilege('service_role', 'public.form_submission_revisions', 'UPDATE')
     AND NOT has_table_privilege('service_role', 'public.form_submission_revisions', 'DELETE')
     AND NOT has_table_privilege('service_role', 'public.form_submission_revisions', 'TRUNCATE')
    INTO ok;
  IF ok THEN r := r || 'PASS T1 grants: anon none; authenticated and service_role SELECT only' || E'\n';
  ELSE r := r || 'FAIL T1 grants on form_submission_revisions are wider than SELECT' || E'\n'; fails := fails + 1; END IF;

  SELECT NOT has_function_privilege('anon', 'public.record_form_submission_revision()', 'EXECUTE')
     AND NOT has_function_privilege('authenticated', 'public.record_form_submission_revision()', 'EXECUTE')
     AND (SELECT prosecdef FROM pg_proc WHERE oid = 'public.record_form_submission_revision()'::regprocedure)
    INTO ok;
  IF ok THEN r := r || 'PASS T2 trigger function is SECURITY DEFINER and not executable by anon/authenticated' || E'\n';
  ELSE r := r || 'FAIL T2 trigger function privileges' || E'\n'; fails := fails + 1; END IF;

  -- ------------------------------------------------- direct SQL (no JWT claims)
  PERFORM set_config('request.jwt.claims', '', true);

  INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at, updated_at)
  VALUES (proj, 'ndep_weekly_stormwater', '{"v":"S0","photos":[{"file_name":"1-a.jpg"}]}', current_date, 'submitted', admin, now(), now() - interval '1 day')
  RETURNING id INTO sub0;

  SELECT count(*) INTO n FROM public.form_submission_revisions WHERE submission_id = sub0;
  IF n = 0 THEN r := r || 'PASS T3 an INSERT writes no revision' || E'\n';
  ELSE r := r || format('FAIL T3 INSERT wrote %s revisions', n) || E'\n'; fails := fails + 1; END IF;

  -- No-op save. updated_at starts a day old, so the updated_at trigger really
  -- changes it here (checked below): the revision trigger must ignore that.
  UPDATE public.form_submissions SET data = data WHERE id = sub0;
  SELECT count(*) INTO n FROM public.form_submission_revisions WHERE submission_id = sub0;
  SELECT updated_at > now() - interval '1 hour' INTO ok FROM public.form_submissions WHERE id = sub0;
  IF n = 0 AND ok THEN r := r || 'PASS T4 a save that only moves updated_at writes no revision (updated_at did change)' || E'\n';
  ELSIF NOT ok THEN r := r || 'FAIL T4 vacuous: updated_at did not change' || E'\n'; fails := fails + 1;
  ELSE r := r || format('FAIL T4 no-op save wrote %s revisions', n) || E'\n'; fails := fails + 1; END IF;

  UPDATE public.form_submissions SET data = '{"v":"S0b","photos":[]}' WHERE id = sub0;
  SELECT * INTO rev FROM public.form_submission_revisions WHERE submission_id = sub0;
  SELECT count(*) INTO n FROM public.form_submission_revisions WHERE submission_id = sub0;
  IF n = 1 AND rev.op = 'UPDATE' AND rev.old_row ->> 'id' = sub0::text
     AND rev.old_row -> 'data' = '{"v":"S0","photos":[{"file_name":"1-a.jpg"}]}'::jsonb
     AND rev.project_id = proj AND rev.form_type = 'ndep_weekly_stormwater'
     AND rev.changed_by IS NULL AND rev.changed_role IS NULL THEN
    r := r || 'PASS T5 direct-SQL edit: one revision with the previous data and photo list, no user or role' || E'\n';
  ELSE r := r || format('FAIL T5 direct-SQL revision: n=%s op=%s by=%s role=%s old=%s', n, rev.op, rev.changed_by, rev.changed_role, rev.old_row -> 'data') || E'\n'; fails := fails + 1; END IF;

  -- ---------------------------------------------------------------- member
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at)
  VALUES (proj, 'ndep_weekly_stormwater', '{"v":"A"}', current_date, 'submitted', member, now())
  RETURNING id INTO sub1;

  UPDATE public.form_submissions SET data = '{"v":"B"}' WHERE id = sub1;
  SELECT * INTO rev FROM public.form_submission_revisions WHERE submission_id = sub1 ORDER BY id DESC LIMIT 1;
  IF rev.old_row -> 'data' = '{"v":"A"}'::jsonb AND rev.changed_by = member AND rev.changed_role = 'authenticated' THEN
    r := r || 'PASS T6 member edit: revision holds the previous data, changed_by = member, role authenticated' || E'\n';
  ELSE r := r || format('FAIL T6 member revision: by=%s role=%s old=%s', rev.changed_by, rev.changed_role, rev.old_row -> 'data') || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM public.form_submission_revisions WHERE submission_id IN (sub0, sub1);
  IF n = 2 THEN r := r || 'PASS T7 member reads revisions of org submissions, including one they did not make' || E'\n';
  ELSE r := r || format('FAIL T7 member sees %s of 2 revisions', n) || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.form_submission_revisions (submission_id, project_id, form_type, op, old_row)
    VALUES (sub1, proj, 'ndep_weekly_stormwater', 'UPDATE', '{}');
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T8 member INSERT into revisions refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T8 member INSERT result ' || st || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    UPDATE public.form_submission_revisions SET old_row = '{}' WHERE submission_id = sub1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T9 member UPDATE of revisions refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T9 member UPDATE result ' || st || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    DELETE FROM public.form_submission_revisions WHERE submission_id = sub1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T10 member DELETE of revisions refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T10 member DELETE result ' || st || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    TRUNCATE public.form_submission_revisions;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T11 member TRUNCATE of revisions refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T11 member TRUNCATE result ' || st || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- ----------------------------------------------------------------- admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  UPDATE public.form_submissions SET data = '{"v":"C"}' WHERE id = sub1;
  SELECT * INTO rev FROM public.form_submission_revisions WHERE submission_id = sub1 ORDER BY id DESC LIMIT 1;
  IF rev.old_row -> 'data' = '{"v":"B"}'::jsonb AND rev.changed_by = admin THEN
    r := r || 'PASS T12 org admin edit of a member''s submission: revision holds B, changed_by = admin' || E'\n';
  ELSE r := r || format('FAIL T12 admin revision: by=%s old=%s', rev.changed_by, rev.old_row -> 'data') || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    DELETE FROM public.form_submission_revisions WHERE submission_id = sub1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T13 org admin DELETE of revisions refused (42501)' || E'\n';
  ELSE r := r || 'FAIL T13 admin DELETE result ' || st || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- -------------------------------------------------------------- outsider
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', outsider, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.form_submission_revisions WHERE submission_id IN (sub0, sub1);
  IF n = 0 THEN r := r || 'PASS T14 a user outside the organization sees no revisions' || E'\n';
  ELSE r := r || format('FAIL T14 outsider sees %s revisions', n) || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;

  -- ---------------------------------------------------------- service_role
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  SET LOCAL ROLE service_role;

  UPDATE public.form_submissions SET data = '{"v":"D"}' WHERE id = sub1;
  SELECT * INTO rev FROM public.form_submission_revisions WHERE submission_id = sub1 ORDER BY id DESC LIMIT 1;
  IF rev.old_row -> 'data' = '{"v":"C"}'::jsonb AND rev.changed_by IS NULL AND rev.changed_role = 'service_role' THEN
    r := r || 'PASS T15 service-key edit: revision holds C, no user, role service_role' || E'\n';
  ELSE r := r || format('FAIL T15 service revision: by=%s role=%s old=%s', rev.changed_by, rev.changed_role, rev.old_row -> 'data') || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    UPDATE public.form_submission_revisions SET old_row = '{}' WHERE submission_id = sub1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  seq := st;
  st := 'ok';
  BEGIN
    DELETE FROM public.form_submission_revisions WHERE submission_id = sub1;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  seq := seq || '/' || st;
  st := 'ok';
  BEGIN
    INSERT INTO public.form_submission_revisions (submission_id, project_id, form_type, op, old_row)
    VALUES (sub1, proj, 'ndep_weekly_stormwater', 'UPDATE', '{}');
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  seq := seq || '/' || st;
  IF seq = '42501/42501/42501' THEN r := r || 'PASS T16 service key cannot UPDATE, DELETE or INSERT revisions (42501 x3)' || E'\n';
  ELSE r := r || 'FAIL T16 service key write results ' || seq || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);

  -- ---------------------------------------------------------------- delete
  DELETE FROM public.form_submissions WHERE id = sub1;
  SELECT string_agg(op || ':' || (old_row -> 'data' ->> 'v'), ',' ORDER BY id) INTO seq
  FROM public.form_submission_revisions WHERE submission_id = sub1;
  IF seq = 'UPDATE:A,UPDATE:B,UPDATE:C,DELETE:D' THEN
    r := r || 'PASS T17 the full chain survives the delete in order: ' || seq || E'\n';
  ELSE r := r || 'FAIL T17 revision chain after delete: ' || coalesce(seq, '(none)') || E'\n'; fails := fails + 1; END IF;

  r := r || format('%s failures', fails);
  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = 'BF63 PROBE (rolled back)' || r;
END
$probe$;
