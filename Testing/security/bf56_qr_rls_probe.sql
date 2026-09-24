-- BF-56: qr_tokens write policy, inspector_sessions lockdown, and the atomic
-- reissue_inspector_qr function (T11-T15, verify round 1 findings 1 and 2),
-- and revoked legacy tokens failing the pre-BF-56 validator (T16, round 3).
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
  tok_a  uuid;
  tok_b  uuid;
  legacy_tok uuid;
  rec    record;
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

  st := 'ok';
  BEGIN
    PERFORM * FROM public.reissue_inspector_qr(proj, NULL);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '42501' THEN r := r || 'PASS T11 member cannot call reissue_inspector_qr (42501)' || E'\n';
  ELSE r := r || 'FAIL T11 member reissue result ' || st || E'\n'; fails := fails + 1; END IF;

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

  -- reissue_inspector_qr: atomic, and a no-op for stale or retried calls.
  SELECT token INTO tok_a FROM public.qr_tokens
   WHERE project_id = proj AND expires_at IS NULL AND revoked_at IS NULL;
  -- A live legacy sentinel, so T12 proves legacy tokens are revoked too.
  INSERT INTO public.qr_tokens (project_id, expires_at, created_by)
  VALUES (proj, now() + interval '1 day', admin) RETURNING token INTO legacy_tok;

  SELECT * INTO rec FROM public.reissue_inspector_qr(proj, tok_a);
  tok_b := rec.qr_token;
  SELECT count(*) INTO n FROM public.qr_tokens WHERE project_id = proj AND revoked_at IS NULL;
  IF rec.reissued AND tok_b IS DISTINCT FROM tok_a AND n = 1
     AND EXISTS (SELECT 1 FROM public.qr_tokens WHERE token = tok_b AND expires_at IS NULL AND revoked_at IS NULL)
  THEN r := r || 'PASS T12 reissue with the current code revokes every token (stable + legacy) and leaves exactly the new one' || E'\n';
  ELSE r := r || format('FAIL T12 reissued=%s new=%s old=%s active=%s', rec.reissued, tok_b, tok_a, n) || E'\n'; fails := fails + 1; END IF;

  -- Verify round 3: the pre-BF-56 validator (still deployed until merge, and
  -- again after a code rollback) checks only expires_at > now(). A revoked
  -- legacy token must fail that check too, while staying a legacy row.
  IF NOT EXISTS (SELECT 1 FROM public.qr_tokens WHERE token = legacy_tok AND expires_at > now())
     AND EXISTS (SELECT 1 FROM public.qr_tokens WHERE token = legacy_tok AND expires_at IS NOT NULL AND revoked_at IS NOT NULL)
     AND EXISTS (SELECT 1 FROM public.qr_tokens WHERE token = tok_a AND expires_at IS NULL AND revoked_at IS NOT NULL)
  THEN r := r || 'PASS T16 revoked legacy token also fails the old validator (expires_at capped); revoked stable keeps expires_at NULL' || E'\n';
  ELSE r := r || 'FAIL T16 revoked legacy token still passes expires_at > now(), or stable row altered' || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM public.qr_tokens WHERE project_id = proj;
  SELECT * INTO rec FROM public.reissue_inspector_qr(proj, tok_a);
  IF NOT rec.reissued AND rec.qr_token = tok_b
     AND (SELECT count(*) FROM public.qr_tokens WHERE project_id = proj) = n
     AND EXISTS (SELECT 1 FROM public.qr_tokens WHERE token = tok_b AND revoked_at IS NULL)
  THEN r := r || 'PASS T13 retry with the old code is a no-op and returns the current code' || E'\n';
  ELSE r := r || format('FAIL T13 retry reissued=%s returned=%s expected=%s', rec.reissued, rec.qr_token, tok_b) || E'\n'; fails := fails + 1; END IF;

  SELECT * INTO rec FROM public.reissue_inspector_qr(proj, gen_random_uuid());
  IF NOT rec.reissued AND rec.qr_token = tok_b
  THEN r := r || 'PASS T14 stale expected code is a no-op' || E'\n';
  ELSE r := r || format('FAIL T14 stale reissued=%s returned=%s', rec.reissued, rec.qr_token) || E'\n'; fails := fails + 1; END IF;

  UPDATE public.qr_tokens SET revoked_at = now() WHERE token = tok_b;
  SELECT * INTO rec FROM public.reissue_inspector_qr(proj, tok_b);
  IF rec.reissued AND rec.qr_token IS DISTINCT FROM tok_b
     AND (SELECT count(*) FROM public.qr_tokens WHERE project_id = proj AND expires_at IS NULL AND revoked_at IS NULL) = 1
  THEN r := r || 'PASS T15 reissue with no active stable code issues a new one' || E'\n';
  ELSE r := r || format('FAIL T15 reissued=%s returned=%s', rec.reissued, rec.qr_token) || E'\n'; fails := fails + 1; END IF;

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

  r := r || format('RESULT: %s of 16 failed', fails);
  RAISE EXCEPTION USING ERRCODE = 'P0999', MESSAGE = 'BF56 PROBE (rolled back)' || r;
END
$probe$;
