-- BF-59 ROLLBACK: reopen profiles to the pre-BF-59 state.
-- Pair: supabase/migrations/20260920194350_profile_role_guard.sql
--
-- Restores: table-level UPDATE for authenticated (all columns), the default
-- write grants for anon, no guard trigger, and profiles_update_own without a
-- WITH CHECK. Running this re-introduces the self-promotion path; only use it
-- if the forward migration broke a legitimate profile write, and re-apply the
-- forward migration as soon as the cause is fixed.

-- =========================================================================
-- 1. Policy
-- =========================================================================

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id);

-- =========================================================================
-- 2. Guard trigger
-- =========================================================================

DROP TRIGGER IF EXISTS profiles_guard_privilege_columns ON public.profiles;
DROP FUNCTION IF EXISTS public.guard_profile_privilege_columns();

-- =========================================================================
-- 3. Privileges
-- =========================================================================

REVOKE UPDATE (full_name, phone) ON TABLE public.profiles FROM authenticated;
GRANT UPDATE ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.profiles TO anon;
