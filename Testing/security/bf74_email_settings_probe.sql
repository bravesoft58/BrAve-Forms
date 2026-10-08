-- BF-74: organization_email_settings access probe.
--
-- Non-destructive by construction: one DO block ending in RAISE EXCEPTION
-- (SQLSTATE P0999), so everything it creates rolls back; the result table is
-- the exception message. Safe on production once the migration is applied.
-- Rehearsal: Testing/security/bf74_rehearsal.py splices the migration body in
-- at the @@MIGRATION@@ marker, so the DDL rolls back too.
--
-- Proves the effect, not the catalog (BF-60 lesson): signed-in users, org
-- admins included, are refused by the database itself (42501, no grant), and
-- anon likewise; the service role can do what the app does; is_org_admin, the
-- server-side check the settings actions rely on, says yes to the org's admin
-- and no to a plain member and to an admin of another organization.
--
-- Users: a real org admin and member are used when they exist (production);
-- otherwise synthetic ones are created inside the rolled-back block.

DO $probe$
DECLARE
  org_a  uuid;
  org_b  uuid;
  admin  uuid;
  member uuid;
  r      text := E'\n';
  fails  int  := 0;
  st     text;
  n      int;
  ok     boolean;
  role_name text;
  priv   text;
BEGIN
  -- @@MIGRATION@@

  -- ------------------------------------------------------------ the people
  SELECT m.user_id, m.org_id INTO admin, org_a
  FROM public.organization_members m WHERE m.role IN ('owner', 'admin') ORDER BY m.joined_at LIMIT 1;
  IF admin IS NULL THEN
    admin := gen_random_uuid();
    INSERT INTO auth.users (id, email) VALUES (admin, 'bf74-admin@probe.invalid');
    INSERT INTO public.profiles (id, email, full_name) VALUES (admin, 'bf74-admin@probe.invalid', 'BF-74 admin')
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.organizations (name, slug) VALUES ('BF-74 probe A', 'bf74-probe-a') RETURNING id INTO org_a;
    INSERT INTO public.organization_members (org_id, user_id, role) VALUES (org_a, admin, 'admin');
  END IF;

  SELECT m.user_id INTO member
  FROM public.organization_members m WHERE m.org_id = org_a AND m.role = 'member' ORDER BY m.joined_at LIMIT 1;
  IF member IS NULL THEN
    member := gen_random_uuid();
    INSERT INTO auth.users (id, email) VALUES (member, 'bf74-member@probe.invalid');
    INSERT INTO public.profiles (id, email, full_name) VALUES (member, 'bf74-member@probe.invalid', 'BF-74 member')
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.organization_members (org_id, user_id, role) VALUES (org_a, member, 'member');
  END IF;

  -- A second organization the admin does not belong to.
  INSERT INTO public.organizations (name, slug) VALUES ('BF-74 probe B', 'bf74-probe-b-' || substr(gen_random_uuid()::text, 1, 8))
    RETURNING id INTO org_b;

  -- ------------------------------------------------------------ the schema
  SELECT c.relrowsecurity INTO ok FROM pg_class c WHERE c.oid = 'public.organization_email_settings'::regclass;
  SELECT count(*) INTO n FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_email_settings';
  IF ok AND n = 0 THEN r := r || 'PASS T1 RLS on, no policies' || E'\n';
  ELSE r := r || format('FAIL T1 rls=%s policies=%s', ok, n) || E'\n'; fails := fails + 1; END IF;

  n := 0;
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    FOREACH priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
      IF has_table_privilege(role_name, 'public.organization_email_settings', priv) THEN n := n + 1; END IF;
    END LOOP;
    IF has_any_column_privilege(role_name, 'public.organization_email_settings', 'SELECT') THEN n := n + 1; END IF;
  END LOOP;
  IF n = 0 THEN r := r || 'PASS T2 anon and authenticated hold no table or column privilege' || E'\n';
  ELSE r := r || format('FAIL T2 %s privileges held by API user roles', n) || E'\n'; fails := fails + 1; END IF;

  IF has_table_privilege('service_role', 'public.organization_email_settings', 'SELECT')
     AND has_table_privilege('service_role', 'public.organization_email_settings', 'INSERT')
     AND has_table_privilege('service_role', 'public.organization_email_settings', 'UPDATE')
     AND has_table_privilege('service_role', 'public.organization_email_settings', 'DELETE')
     AND NOT has_table_privilege('service_role', 'public.organization_email_settings', 'TRUNCATE') THEN
    r := r || 'PASS T3 service_role: SELECT, INSERT, UPDATE, DELETE and nothing more' || E'\n';
  ELSE r := r || 'FAIL T3 service_role privileges' || E'\n'; fails := fails + 1; END IF;

  SELECT count(*) INTO n FROM pg_constraint
  WHERE conrelid = 'public.organization_email_settings'::regclass AND contype = 'f'
    AND ((confrelid = 'public.organizations'::regclass AND confdeltype = 'c')
      OR (confrelid = 'public.profiles'::regclass AND confdeltype = 'n'));
  IF n = 2 THEN r := r || 'PASS T4 org FK cascades on delete; updated_by FK sets null' || E'\n';
  ELSE r := r || format('FAIL T4 %s matching foreign keys', n) || E'\n'; fails := fails + 1; END IF;

  -- -------------------------------------------- service role (the app path)
  SET LOCAL ROLE service_role;
  INSERT INTO public.organization_email_settings
    (org_id, tenant_id, client_id, sender_mailbox, client_secret_ciphertext, client_secret_expires_on, updated_by)
  VALUES (org_a, 'tenant', 'client', 'forms-alerts@probe.invalid', 'v1:a:b:c', current_date + 365, admin);
  UPDATE public.organization_email_settings SET last_test_ok = true, last_test_at = now() WHERE org_id = org_a;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN r := r || 'PASS T5 service_role inserts and updates a settings row' || E'\n';
  ELSE r := r || format('FAIL T5 update touched %s rows', n) || E'\n'; fails := fails + 1; END IF;

  st := 'ok';
  BEGIN
    INSERT INTO public.organization_email_settings
      (org_id, provider, tenant_id, client_id, sender_mailbox, client_secret_ciphertext, client_secret_expires_on)
    VALUES (org_b, 'smtp', 't', 'c', 'x@probe.invalid', 'v1:a:b:c', current_date);
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE;
  END;
  IF st = '23514' THEN r := r || 'PASS T6 provider other than microsoft365 is refused (23514)' || E'\n';
  ELSE r := r || format('FAIL T6 provider smtp gave %s', st) || E'\n'; fails := fails + 1; END IF;
  RESET ROLE;

  -- ------------------------------------------ signed-in users via the API role
  FOREACH role_name IN ARRAY ARRAY['admin', 'member'] LOOP
    -- Both claim forms: production's auth.uid() reads request.jwt.claims, a
    -- bare supabase/postgres image (the rehearsal) reads request.jwt.claim.sub.
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', CASE role_name WHEN 'admin' THEN admin ELSE member END, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', (CASE role_name WHEN 'admin' THEN admin ELSE member END)::text, true);
    SET LOCAL ROLE authenticated;

    -- Without this, a NULL uid would make the member's "not admin" pass vacuously.
    IF auth.uid() IS DISTINCT FROM (CASE role_name WHEN 'admin' THEN admin ELSE member END) THEN
      r := r || format('FAIL T0 auth.uid() is %s while impersonating the %s', auth.uid(), role_name) || E'\n';
      fails := fails + 1;
    END IF;

    st := 'ok';
    BEGIN PERFORM 1 FROM public.organization_email_settings WHERE org_id = org_a;
    EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
    IF st = '42501' THEN r := r || format('PASS T7 %s cannot read the settings: 42501', role_name) || E'\n';
    ELSE r := r || format('FAIL T7 %s read gave %s', role_name, st) || E'\n'; fails := fails + 1; END IF;

    st := 'ok';
    BEGIN UPDATE public.organization_email_settings SET sender_mailbox = 'attacker@probe.invalid' WHERE org_id = org_a;
    EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
    IF st = '42501' THEN r := r || format('PASS T8 %s cannot change the settings: 42501', role_name) || E'\n';
    ELSE r := r || format('FAIL T8 %s update gave %s', role_name, st) || E'\n'; fails := fails + 1; END IF;

    st := 'ok';
    BEGIN INSERT INTO public.organization_email_settings
      (org_id, tenant_id, client_id, sender_mailbox, client_secret_ciphertext, client_secret_expires_on)
      VALUES (org_b, 't', 'c', 'x@probe.invalid', 'v1:a:b:c', current_date);
    EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
    IF st = '42501' THEN r := r || format('PASS T9 %s cannot create settings: 42501', role_name) || E'\n';
    ELSE r := r || format('FAIL T9 %s insert gave %s', role_name, st) || E'\n'; fails := fails + 1; END IF;

    -- The server-side gate the settings actions call on the user's session.
    IF public.is_org_admin(org_a) = (role_name = 'admin') THEN
      r := r || format('PASS T10 is_org_admin(own org) is %s for the %s', role_name = 'admin', role_name) || E'\n';
    ELSE r := r || format('FAIL T10 is_org_admin(own org) wrong for %s', role_name) || E'\n'; fails := fails + 1; END IF;
    IF NOT public.is_org_admin(org_b) THEN
      r := r || format('PASS T11 is_org_admin(other org) is false for the %s', role_name) || E'\n';
    ELSE r := r || format('FAIL T11 %s is admin of another organization', role_name) || E'\n'; fails := fails + 1; END IF;

    RESET ROLE;
  END LOOP;

  SET LOCAL ROLE anon;
  st := 'ok';
  BEGIN PERFORM 1 FROM public.organization_email_settings;
  EXCEPTION WHEN OTHERS THEN st := SQLSTATE; END;
  RESET ROLE;
  IF st = '42501' THEN r := r || 'PASS T12 anon cannot read the settings: 42501' || E'\n';
  ELSE r := r || format('FAIL T12 anon read gave %s', st) || E'\n'; fails := fails + 1; END IF;

  RAISE EXCEPTION USING ERRCODE = 'P0999',
    MESSAGE = format('BF-74 probe: %s failure(s), everything rolled back%s', fails, r);
END
$probe$;
