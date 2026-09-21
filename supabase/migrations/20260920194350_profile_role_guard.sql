-- BF-59: Close the profile role self-promotion path
-- Pair: supabase/migrations/_rollback/20260920194350_rollback.sql
--
-- Before this migration the `authenticated` role held Supabase's default
-- table-level UPDATE on public.profiles, and profiles_update_own allowed any
-- user to update their own row with no column restriction. Nothing stopped
-- UPDATE profiles SET platform_role = 'super_admin' WHERE id = auth.uid(),
-- and is_super_admin() (which reads platform_role) is the escape hatch in
-- 31 live policies across every public table and both Storage buckets.
--
-- Three layers, in the order Postgres evaluates them:
--   1. Column privileges: table-level UPDATE is revoked and granted back on
--      the two self-service columns only. Column privileges are additive to
--      table privileges, so revoking a column grant alone would be a no-op
--      while the table grant existed (Supabase column-level security guide).
--      Postgres checks privileges before RLS and before triggers.
--   2. Guard trigger: rejects any change to role / platform_role from a
--      request whose DB role OR JWT role claim is anon/authenticated. The
--      claim branch covers SECURITY DEFINER paths, where current_user is the
--      function owner but auth.role() still names the originating request.
--      Service-role requests and direct postgres sessions pass.
--   3. Policy WITH CHECK: profiles_update_own gets the explicit check so a
--      row cannot be re-pointed at another id (the id column revoke already
--      blocks this; the check states intent).
--
-- App impact: none. The only writers of profiles.role are the user-management
-- server actions, which use the service client. platform_role is set only by
-- migration. No browser-client code updates profiles today.
--
-- BF-35 (drop profiles.role) must drop or rewrite the guard trigger first.

-- =========================================================================
-- 1. Column privileges
-- =========================================================================

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;

-- anon has no policy on profiles (RLS already denies every write); make the
-- grants say the same thing.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.profiles FROM anon;

-- =========================================================================
-- 2. Guard trigger
-- =========================================================================

CREATE OR REPLACE FUNCTION public.guard_profile_privilege_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := auth.role();
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.platform_role IS DISTINCT FROM OLD.platform_role)
     AND (current_user IN ('anon', 'authenticated')
          OR jwt_role IN ('anon', 'authenticated')) THEN
    RAISE EXCEPTION 'profiles.role and profiles.platform_role can only be changed by a service or administrator session'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_profile_privilege_columns() IS
  'BF-59: blocks role/platform_role changes from anon/authenticated requests (DB role or JWT claim). Defense in depth behind the column grants.';

DROP TRIGGER IF EXISTS profiles_guard_privilege_columns ON public.profiles;
CREATE TRIGGER profiles_guard_privilege_columns
  BEFORE UPDATE OF role, platform_role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privilege_columns();

-- =========================================================================
-- 3. Policy WITH CHECK
-- =========================================================================

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
