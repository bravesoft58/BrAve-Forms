# BF-59: Close the profile role self-promotion path

**Type:** Security fix (database grants, policy, trigger) + negative tests
**Priority:** CRITICAL (any signed-in user can become platform super admin)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Q&D readiness assessment 2026-09-08 (`docs/release/QD-GO-LIVE-READINESS-2026-09-08.md`, blocker 1); re-verified against production 2026-09-20. Added to this sprint by Tim on 2026-09-20.
**Created:** 2026-09-20
**Last Updated:** 2026-09-20T19:39:29Z

## Problem

Any authenticated user can update their own `profiles.role` and `profiles.platform_role` through the Supabase data API with their normal session. Setting `platform_role = 'super_admin'` makes `is_super_admin()` return true, and that function is the escape hatch in every organization-scoped policy. Nothing in the app UI offers this; the exposure is the data API that the browser client already talks to.

No exploit has been run. All facts below come from read-only inspection of the production catalog on 2026-09-20 and match the 2026-09-08 findings.

## Current state (production, 2026-09-20)

**Grants.** `authenticated` holds the Supabase default full table privileges on `profiles` (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER), including column-level UPDATE on `role`, `platform_role`, `id`, and `email`. `anon` holds the same. Row-level security is the only thing standing between a user and these columns.

**Policies on `profiles`.** Exactly two:

- `profiles_select`: own row, or super admin, or members of the caller's organizations.
- `profiles_update_own`: `USING (auth.uid() = id)`, no `WITH CHECK`, no column restriction. Defined in `20260305_002_schema_gaps_and_rls.sql` and unchanged by the multi-tenant migrations.

No INSERT or DELETE policy exists, so those are already denied for `authenticated` and `anon` despite the grants.

**Triggers.** One non-internal trigger, `profiles_updated_at`, which stamps `updated_at`. It does not inspect `role` or `platform_role`.

**Helpers.**

- `is_super_admin()`: SECURITY DEFINER, returns true when the caller's `profiles.platform_role = 'super_admin'`.
- `is_admin()`: SECURITY DEFINER, returns true when `profiles.role = 'admin'`. No live policy references it any more (legacy).
- `is_org_admin(org)`: reads `organization_members.role`. That table's UPDATE policy requires super admin or org admin, so it is NOT self-editable. The hole is confined to `profiles`.

**Blast radius.** 31 live policies trust `is_super_admin()`: every command on `organizations`, `organization_members`, `form_submissions`, `form_photos`, `project_documents`, `qr_tokens`, `audit_log`, the SELECT policies on `projects`, `project_permits`, `project_form_requirements`, `project_users`, `organization_invitations`, `profiles`, and all six Storage object policies on both private buckets. A self-promoted user reads and writes both organizations' data and files.

`profiles.role = 'admin'` is lower impact: it drives app-level UI gating (`getCurrentUser` reads it; the form view pages use it for `canEdit`; the users page lists it) and the user-management server actions authorize on it. Self-promotion there exposes the user-management page, whose service-role actions can then delete users or change roles without target-organization checks (readiness assessment, blocker 1). Both columns must be locked.

**Legitimate writers.** The app never updates a caller's own profile through the browser client. The only writes to `role` are in the user-management actions (`inviteUser`, `updateRole`) and they use the service client, which bypasses RLS and column grants. `platform_role` is only ever set by migration. So locking the columns for `authenticated` breaks nothing in the app.

## Proposed change

One migration, additive and reversible, applied to production after the pre-change backup and after the same migration passes on an isolated copy.

1. **Column grants (the primary fix).**
   `REVOKE UPDATE (role, platform_role, id, email) ON public.profiles FROM authenticated, anon;`
   PostgREST enforces column privileges before RLS, so a request that names any of these columns fails with a permission error regardless of policy. Ordinary users keep UPDATE on `full_name` and `phone` for a future settings page.
2. **Hygiene on `anon`.** `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM anon;` Nothing anonymous should write profiles; RLS already denies it, the grant should agree.
3. **Trigger guard (defense in depth).** A `BEFORE UPDATE` trigger on `profiles` that raises when `NEW.role IS DISTINCT FROM OLD.role` or `NEW.platform_role IS DISTINCT FROM OLD.platform_role` unless the session role is `service_role` or `postgres`. This survives a future policy or grant change that reopens the column. Keep it SECURITY DEFINER-free; it only compares values and reads `current_user` / `auth.role()`.
4. **Policy tightening.** Recreate `profiles_update_own` with an explicit `WITH CHECK ((select auth.uid()) = id)` so a row cannot be re-pointed at another id (the `id` column grant revoke already blocks this; the check documents intent).
5. **Integrity review, not code.** Query `profiles` for anyone with `platform_role = 'super_admin'` other than Tim and anyone with `role = 'admin'` who should not be. Compare against the pre-change backup and the 2026-09-08 readings. Record the result in this ticket. Supabase Auth audit log entries do not cover PostgREST writes, so absence of evidence is not proof; state that plainly.
6. **Do not** drop `profiles.role` here. That is BF-35, gated on BF-34 and a stability window.

## Tests (the deliverable is the denial, not the migration)

Run with a real ordinary user's session against the isolated copy, then against production after apply:

- `PATCH /rest/v1/profiles?id=eq.<self>` with `{"platform_role":"super_admin"}` returns a permission error and the row is unchanged.
- Same with `{"role":"admin"}`.
- Same with `{"id":"<other user id>"}` and `{"email":"..."}`.
- `PATCH` with `{"full_name":"..."}` on the own row succeeds (proves the policy still works for allowed columns).
- `PATCH` on another user's row with any column is denied.
- The user-management page (service client) can still change a role; `organization_members.role` still syncs.
- A super admin session still passes `is_super_admin()`.
- Script these as a repeatable check under `Testing/` or a Playwright spec, so `/verify` and later releases can rerun them.

## Acceptance criteria

- [ ] Migration file in `supabase/migrations/` with a matching rollback under `_rollback/`.
- [ ] Applied to an isolated copy first; the negative tests above pass there.
- [ ] Applied to production; `information_schema.column_privileges` shows no UPDATE on `role`, `platform_role`, `id`, `email` for `authenticated` or `anon`; the trigger exists; the policy has a WITH CHECK.
- [ ] Negative tests pass against production with an ordinary Q&D user (not an admin).
- [ ] Privileged-account review recorded: list of super admins and admins before and after, with the finding stated.
- [ ] No app regression: sign-in, form submit, user invite, role change by an admin all work.
- [ ] Readiness document blocker 1 updated to point at this ticket and its evidence.

## Notes

- This fixes self-promotion. It does not add target-organization authorization to the user-management service-role actions (readiness blocker 1, second bullet). File that separately if it is not folded into BF-34.
- Run before BF-55 if possible: the user cleanup should happen on a database where the remaining accounts cannot re-escalate.
