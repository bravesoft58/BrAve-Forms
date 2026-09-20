# BF-59: Close the profile role self-promotion path

**Type:** Security fix (database grants, policy, trigger) + negative tests
**Priority:** CRITICAL (any signed-in user can become platform super admin)
**Points:** 2
**Status:** IN PROGRESS
**Sprint:** 4
**Started:** 2026-09-20T19:43:50Z
**Reported by:** Q&D readiness assessment 2026-09-08 (`docs/release/QD-GO-LIVE-READINESS-2026-09-08.md`, blocker 1); re-verified against production 2026-09-20. Added to this sprint by Tim on 2026-09-20.
**Created:** 2026-09-20
**Last Updated:** 2026-09-20T19:53:05Z

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

1. **Column grants (the primary fix).** Postgres column privileges are additive to table privileges: revoking a column-level UPDATE does nothing while the table-level UPDATE grant exists (Supabase column-level security guide, read 2026-09-20). The correct shape is revoke-then-grant-back:
   `REVOKE UPDATE ON TABLE public.profiles FROM authenticated;`
   `GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;`
   Postgres checks column privileges before RLS, so an UPDATE that names `role`, `platform_role`, `id`, or `email` fails with a permission error regardless of policy. Supabase's client sends only the columns passed to `.update()`, so a future settings page updating `full_name` or `phone` keeps working. SELECT is untouched, so `select('*')` on profiles still works (the guide's wildcard warning applies only when SELECT columns are restricted).
2. **Hygiene on `anon`.** `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM anon;` Nothing anonymous should write profiles; RLS already denies it, the grant should agree.
3. **Trigger guard (defense in depth).** A `BEFORE UPDATE` trigger on `profiles` that raises when `NEW.role IS DISTINCT FROM OLD.role` or `NEW.platform_role IS DISTINCT FROM OLD.platform_role` and either `current_user` or `auth.role()` (the JWT role claim PostgREST sets for the request) is `authenticated` or `anon`. The JWT-claim branch matters because inside a SECURITY DEFINER function `current_user` is the function owner, not the caller; the claim still identifies the originating request. Service-role requests (`current_user = service_role`, claim `service_role`) and direct `postgres` sessions (MCP, dashboard, migrations) pass. This survives a future policy or grant change that reopens the column. Not SECURITY DEFINER; it only compares values.
   BF-35 (drop `profiles.role`) must drop or rewrite this trigger first, since it references `OLD.role`.
4. **Policy tightening.** Recreate `profiles_update_own` with an explicit `WITH CHECK ((select auth.uid()) = id)` so a row cannot be re-pointed at another id (the `id` column grant revoke already blocks this; the check documents intent).
5. **Integrity review, not code.** Query `profiles` for anyone with `platform_role = 'super_admin'` other than Tim and anyone with `role = 'admin'` who should not be. Compare against the pre-change backup and the 2026-09-08 readings. Record the result in this ticket. Supabase Auth audit log entries do not cover PostgREST writes, so absence of evidence is not proof; state that plainly.
6. **Do not** drop `profiles.role` here. That is BF-35, gated on BF-34 and a stability window.

## Files to Modify

| Action | File | Purpose |
| --- | --- | --- |
| CREATE | `supabase/migrations/20260920194350_profile_role_guard.sql` | Grants, anon hygiene, guard trigger, policy WITH CHECK |
| CREATE | `supabase/migrations/_rollback/20260920194350_rollback.sql` | Exact inverse: restore table-level UPDATE, drop trigger, restore policy |
| CREATE | `Testing/security/bf59_profile_role_guard.sql` | SQL-level negative suite using role impersonation (`SET LOCAL ROLE` + `request.jwt.claims`); runs on the local copy and on production via MCP |
| CREATE | `Testing/security/bf59_profile_role_guard.py` | REST-level negative suite against a live project with a real ordinary user session (production acceptance run) |
| MODIFY | `docs/release/QD-GO-LIVE-READINESS-2026-09-08.md` | Point blocker 1 at this ticket and its evidence (AC 7) |

**Build vs Use:** BUILD — no test framework exists in the repo (`patterns.md` Section 6) and a search for Supabase RLS negative-test helpers (pgTAP `supabase_test_helpers`) returned no results on 2026-09-20; installing pgTAP on production for one check is disproportionate to a 2 SP story. The suite is two small scripts under `Testing/security/`. Reopen when BF-34's Playwright cross-tenant harness lands: fold these checks into it and retire the scripts.

**Isolated copy:** a Supabase preview branch was attempted via MCP on 2026-09-20 and the creation was cancelled. The isolated target is instead a local Docker Postgres from the same image production runs (`public.ecr.aws/supabase/postgres:15.8.1.070`, digest in the backup README) with the 2026-09-20 backup restored, on port 55433 (54321/54322 are held by another project's stack on this workstation).

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

- [x] Migration file in `supabase/migrations/` with a matching rollback under `_rollback/`.
- [x] Applied to an isolated copy first; the negative tests above pass there.
- [ ] Applied to production; `information_schema.column_privileges` shows no UPDATE on `role`, `platform_role`, `id`, `email` for `authenticated` or `anon`; the trigger exists; the policy has a WITH CHECK.
- [ ] Negative tests pass against production with an ordinary Q&D user (not an admin).
- [x] Privileged-account review recorded: list of super admins and admins before and after, with the finding stated. (Pre-apply review below; repeat after apply.)
- [ ] No app regression: sign-in, form submit, user invite, role change by an admin all work.
- [ ] Readiness document blocker 1 updated to point at this ticket and its evidence.

## Isolated-copy evidence (2026-09-20T19:51:45Z)

Target: local Docker container `bf59-pg`, image `public.ecr.aws/supabase/postgres:15.8.1.070` (same build as production), port 55433, loaded from the 2026-09-20 backup by `backups/.../scripts/restore_local_docker.py` (schema.sql, then public.* and auth.users data; auth.uid/role/jwt aligned to the production definitions because the image ships older ones). Restored counts matched production: auth.users 9, profiles 8, organizations 2, members 8, projects 10, submissions 39.

Suite: `Testing/security/bf59_profile_role_guard.sql`, 13 checks, every mutating probe rolled back by a marker exception inside a nested block.

| Run | Result | Meaning |
| --- | --- | --- |
| RED, before migration | T01 role, T02 platform_role, T04 email: update succeeded (1 row). T07, T10-T13: FAIL | The exploit reproduces on a faithful copy: an ordinary member set `platform_role = 'super_admin'` on their own row. T03 (id) already failed with 42501 because the USING clause doubles as the check when no WITH CHECK exists. T05, T06, T08, T09 PASS (baseline behaviour intact). |
| GREEN, after migration | 13 of 13 PASS | T01-T04 rejected with 42501; T05 own full_name still updates (1 row); T06 other row 0 rows; T07 trigger blocks the JWT-claim branch as postgres; T08 service_role updates role (1 row); T09 super admin helper true; T10 zero offending grants; T11 trigger present; T12 WITH CHECK present; T13 anon has no write grants. |
| After rollback script | Identical to the RED pattern | Rollback restores the exact prior state. |
| After re-applying the migration | 13 of 13 PASS | Migration is idempotent on a rolled-back database. |

Visibility matrix (`Testing/security/bf59_visibility_matrix.sql`, read-only, run on the patched copy and on unpatched production): member sees 7 profiles, org admin 7, super admin 8, `select *` works for all three, identical on both. No silent hide (lesson 2026-04-30 pattern).

## Privileged-account review (production, read-only, 2026-09-20)

| Email | role | platform_role | profile updated_at | Membership | Provenance |
| --- | --- | --- | --- | --- | --- |
| timsaverill@protonmail.com | admin | super_admin | 2026-04-25 | Q&D Construction: owner | BF-30 backfill set super_admin on 2026-04-25 (EF fact 7d644dbd) |
| abreen@qdconstruction.com | admin | member | 2026-03-12 | Q&D Construction: admin | Andy, promoted during sprint 2 UAT |
| gdamele@qdconstruction.com | admin | member | 2026-04-16 | Q&D Construction: admin | Gracie, invited as admin |
| claude.test@braveforms.dev | admin | member | 2026-03-09 | Q&D Construction: admin | test account (BF-55 removes) |
| itadmin@pleniumbuilders.com | admin | member | 2026-05-02 | Q&D Construction: admin | was a Q&D `user` in the BF-30 backfill; promoted 2026-05-02 during multi-tenant UAT. Membership is Q&D, not Plenium. Confirm intent in BF-55. |
| adminbreen@pleniumbuilders.com | admin | member | 2026-06-08 | Plenium Builders: owner | BF-33 Slice 1 backfill by Tim on 2026-06-08 (EF fact edc68e8c) |

Finding: one super admin, and it is Tim. Every admin-role row matches the 2026-09-20 backup exactly and every `updated_at` predates the 2026-09-08 discovery, with a documented provisioning event behind each. No evidence the self-promotion path was used. Caveat, stated plainly: PostgREST writes are not in the Supabase Auth audit log, and a promote-then-revert would leave only a bumped `updated_at`; none of the timestamps is unexplained, but this is evidence of absence, not proof.

## Notes

- This fixes self-promotion. It does not add target-organization authorization to the user-management service-role actions (readiness blocker 1, second bullet). File that separately if it is not folded into BF-34.
- Run before BF-55 if possible: the user cleanup should happen on a database where the remaining accounts cannot re-escalate.
