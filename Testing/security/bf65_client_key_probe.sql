-- BF-65 + BF-61: submission idempotency key and guarded-update probe.
--
-- Non-destructive by construction: one DO block ending in RAISE EXCEPTION
-- (SQLSTATE P0999), so every insert and update it makes rolls back. The result
-- table is the exception message. Safe on production once the BF-65 migration
-- is applied. Rehearsal: Testing/security/bf65_rehearsal.py splices the
-- migration body in at the @@MIGRATION@@ marker, so the DDL rolls back too.
--
-- Runs as two real Q&D users through request.jwt.claims + SET LOCAL ROLE
-- authenticated, so RLS applies exactly as for the app:
--   member  213ccf96-4059-47e1-869b-9570f2d4eb87 (org role member)
--   admin   284ff2a0-2ce2-4d19-8b71-6b59d35f0db2 (org role admin)
-- Project d80cdc1c-6199-4f58-a3bc-33b6f7c5caaf (17254 NDOT 4541 7 Bridges).
-- Only rows the probe inserts are touched.

DO $probe$
DECLARE
  proj   constant uuid := 'd80cdc1c-6199-4f58-a3bc-33b6f7c5caaf';
  member constant uuid := '213ccf96-4059-47e1-869b-9570f2d4eb87';
  admin  constant uuid := '284ff2a0-2ce2-4d19-8b71-6b59d35f0db2';
  k      constant uuid := gen_random_uuid();
  r      text := E'\n';
  fails  int  := 0;
  n      int;
  st     text;
  msg    text;
  ok     boolean;
  sub1   uuid;
  hit    uuid;
  v      timestamptz;
BEGIN
  -- @@MIGRATION@@

  -- ------------------------------------------------------------- the schema
  SELECT i.indisunique
     AND array_to_string(ARRAY(SELECT a.attname FROM unnest(i.indkey) WITH ORDINALITY u(attnum, ord)
                                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = u.attnum
                                ORDER BY u.ord), ',') = 'submitted_by,client_key'
     AND i.indpred IS NULL
    INTO ok
  FROM pg_index i
  WHERE i.indexrelid = 'public.form_submissions_submitter_client_key'::regclass;
  IF ok THEN r := r || 'PASS T1 unique index on (submitted_by, client_key), not partial' || E'\n';
  ELSE r := r || 'FAIL T1 index shape' || E'\n'; fails := fails + 1; END IF;

  -- ---------------------------------------------------------------- member
  PERFORM set_config('request.jwt.claims', json_build_object('sub', member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- updated_at starts a day old so the first guarded save really changes it
  -- (now() is constant inside this transaction).
  INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at, updated_at, client_key)
  VALUES (proj, 'ndep_weekly_stormwater', '{"v":"A"}', current_date, 'submitted', member, now(), now() - interval '1 day', k)
  RETURNING id, updated_at INTO sub1, v;

  st := 'ok'; msg := '';
  BEGIN
    INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at, client_key)
    VALUES (proj, 'ndep_weekly_stormwater', '{"v":"A"}', current_date, 'submitted', member, now(), k);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE; msg := SQLERRM;
  END;
  IF st = '23505' AND msg LIKE '%form_submissions_submitter_client_key%' THEN
    r := r || 'PASS T2 the same user and key twice is refused: 23505 naming the key index' || E'\n';
  ELSE r := r || format('FAIL T2 duplicate key gave %s %s', st, msg) || E'\n'; fails := fails + 1; END IF;

  SELECT id INTO hit FROM public.form_submissions WHERE submitted_by = member AND client_key = k;
  IF hit = sub1 THEN r := r || 'PASS T3 the retry lookup (submitter + key) finds the first row under RLS' || E'\n';
  ELSE r := r || format('FAIL T3 lookup returned %s, expected %s', hit, sub1) || E'\n'; fails := fails + 1; END IF;

  INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at)
  VALUES (proj, 'ndep_weekly_stormwater', '{"v":"N1"}', current_date, 'submitted', member, now()),
         (proj, 'ndep_weekly_stormwater', '{"v":"N2"}', current_date, 'submitted', member, now());
  SELECT count(*) INTO n FROM public.form_submissions WHERE submitted_by = member AND client_key IS NULL AND data ->> 'v' IN ('N1', 'N2');
  IF n = 2 THEN r := r || 'PASS T4 rows without a key (old bundles, pre-BF-65 rows) never collide' || E'\n';
  ELSE r := r || format('FAIL T4 %s keyless rows', n) || E'\n'; fails := fails + 1; END IF;

  -- BF-61: two saves from the same loaded version. The first applies and moves
  -- updated_at; the second matches nothing, and the first one's data survives.
  UPDATE public.form_submissions SET data = '{"v":"first"}' WHERE id = sub1 AND updated_at = v;
  GET DIAGNOSTICS n = ROW_COUNT;
  st := n::text;
  UPDATE public.form_submissions SET data = '{"v":"second"}' WHERE id = sub1 AND updated_at = v;
  GET DIAGNOSTICS n = ROW_COUNT;
  st := st || '/' || n;
  SELECT data ->> 'v' INTO msg FROM public.form_submissions WHERE id = sub1;
  IF st = '1/0' AND msg = 'first' THEN
    r := r || 'PASS T5 a second save from the same loaded version updates 0 rows; the first save survives' || E'\n';
  ELSE r := r || format('FAIL T5 row counts %s, stored v=%s', st, msg) || E'\n'; fails := fails + 1; END IF;

  -- ----------------------------------------------------------------- admin
  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  st := 'ok';
  BEGIN
    INSERT INTO public.form_submissions (project_id, form_type, data, form_date, status, submitted_by, submitted_at, client_key)
    VALUES (proj, 'ndep_weekly_stormwater', '{"v":"B"}', current_date, 'submitted', admin, now(), k);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = 'ok' THEN r := r || 'PASS T6 another user can use the same key value: keys never collide across users' || E'\n';
  ELSE r := r || format('FAIL T6 other user same key gave %s', st) || E'\n'; fails := fails + 1; END IF;

  -- The admin can SELECT the member's row (same org), so this proves the
  -- submitter filter, not RLS, keeps the lookup on the admin's own row.
  SELECT count(*), max(id::text)::uuid INTO n, hit FROM public.form_submissions WHERE submitted_by = admin AND client_key = k;
  SELECT count(*) INTO st FROM public.form_submissions WHERE id = sub1;
  IF n = 1 AND hit <> sub1 AND st = '1' THEN
    r := r || 'PASS T7 the other user''s lookup by (self, key) gets only their own row, though the first user''s row is visible to them' || E'\n';
  ELSE r := r || format('FAIL T7 admin lookup n=%s hit=%s, member row visible=%s', n, hit, st) || E'\n'; fails := fails + 1; END IF;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);

  r := r || format('%s failures', fails);
  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = 'BF65 PROBE (rolled back)' || r;
END
$probe$;
