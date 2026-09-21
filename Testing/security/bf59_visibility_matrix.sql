-- BF-59 companion: read-only per-tier visibility matrix on public.profiles.
-- Run as postgres. Impersonates one user per tier and counts the profiles they can SELECT,
-- plus whether SELECT * works (column privileges on SELECT are untouched by BF-59, so it must).
-- Compare the output on the patched copy against unpatched production: identical = no silent hide.
CREATE TEMP TABLE IF NOT EXISTS bf59_vis (tier text, who text, visible int, star_ok boolean);
TRUNCATE bf59_vis;
DO $$
DECLARE r record; v_n int; v_star boolean;
BEGIN
  FOR r IN
    (SELECT 'member' AS tier, p.id, p.email FROM public.profiles p WHERE p.role = 'user' AND p.platform_role = 'member' ORDER BY p.email LIMIT 1)
    UNION ALL
    (SELECT 'org_admin', p.id, p.email FROM public.profiles p JOIN public.organization_members m ON m.user_id = p.id AND m.role IN ('owner','admin') WHERE p.platform_role = 'member' ORDER BY p.email LIMIT 1)
    UNION ALL
    (SELECT 'super_admin', p.id, p.email FROM public.profiles p WHERE p.platform_role = 'super_admin' ORDER BY p.email LIMIT 1)
  LOOP
    PERFORM set_config('request.jwt.claims', json_build_object('sub', r.id, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    EXECUTE 'SELECT count(*) FROM public.profiles' INTO v_n;
    BEGIN
      EXECUTE 'SELECT count(*) FROM (SELECT * FROM public.profiles) s' INTO v_n; v_star := true;
    EXCEPTION WHEN OTHERS THEN v_star := false;
    END;
    EXECUTE 'RESET ROLE';
    INSERT INTO bf59_vis VALUES (r.tier, r.email, v_n, v_star);
  END LOOP;
  PERFORM set_config('request.jwt.claims', '', true);
END $$;
SELECT tier, who, visible, star_ok FROM bf59_vis ORDER BY tier;
