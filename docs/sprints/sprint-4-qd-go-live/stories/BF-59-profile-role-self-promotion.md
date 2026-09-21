# BF-59: Close the profile role self-promotion path

**Type:** Security fix (database grants, policy, trigger) + negative tests
**Priority:** CRITICAL (any signed-in user can become platform super admin)
**Points:** 2
**Status:** IN PROGRESS
**Sprint:** 4
**Started:** 2026-09-20T19:43:50Z
**Reported by:** Q&D readiness assessment 2026-09-08 (`docs/release/QD-GO-LIVE-READINESS-2026-09-08.md`, blocker 1); re-verified against production 2026-09-20. Added to this sprint by Tim on 2026-09-20.
**Created:** 2026-09-20
**Last Updated:** 2026-09-21T17:35:26Z

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
| CREATE | `Testing/security/bf59_profile_role_guard.py` | REST-level negative suite against a live project with a real ordinary user session; explicit target, timeout-safe restore, non-destructive cross-user probe |
| CREATE | `Testing/security/bf59_rest_stub_test.py` | Credential-free self-test of the REST suite against an in-process API stub: patched, open, timeout, and production-refusal scenarios |
| CREATE | `Testing/security/bf59_visibility_matrix.sql` | Read-only per-tier profile visibility count (no silent hide) |
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
- [x] Applied to production; `information_schema.column_privileges` shows no UPDATE on `role`, `platform_role`, `id`, `email` for `authenticated` or `anon`; the trigger exists; the policy has a WITH CHECK.
- [x] Negative tests pass against production with an ordinary Q&D user (not an admin). (SQL suite impersonating abreen@qdgroupinvesco.com, 13 of 13; the REST suite was not run because no ordinary-user credentials were available. Tim chose to rely on the SQL suite, which exercises the same privilege check PostgREST hits.)
- [x] Privileged-account review recorded: list of super admins and admins before and after, with the finding stated. (Post-apply rows identical to pre-apply.)
- [x] No app regression: sign-in, form submit, user invite, role change by an admin all work. (Run 2026-09-21 through Tim's signed-in session via Claude in Chrome; evidence below.)
- [x] Readiness document blocker 1 updated to point at this ticket and its evidence.

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

## Production evidence (applied 2026-09-20T20:07:35Z, Tim's go)

Applied through the Supabase MCP `apply_migration` with the body of `20260920194350_profile_role_guard.sql` (sha256 `b15f1aca...`). Supabase recorded it in `supabase_migrations.schema_migrations` as version `20260920200725` `profile_role_guard`, the same repo-file-vs-recorded-version pattern as every prior MCP-applied migration here (for example the repo's `20260430140000_admin_org_access.sql` is recorded as `20260430141806`).

Catalog after apply: authenticated UPDATE columns on profiles = `full_name, phone`; anon table grants = SELECT only; triggers = `profiles_guard_privilege_columns` (BEFORE UPDATE OF role, platform_role) and `profiles_updated_at`; `profiles_update_own` WITH CHECK = `((select auth.uid()) = id)`.

Negative suite on production (`Testing/security/bf59_profile_role_guard.sql` via MCP, every probe rolled back): 13 of 13 PASS. T01-T04 42501, T05 own full_name 1 row, T06 other row 0 rows, T07 JWT-claim branch 42501, T08 service_role 1 row, T09 super admin true, T10-T13 catalog assertions pass.

Visibility matrix on production after apply: member 7, org admin 7, super admin 8, `select *` works for all three. Identical to before apply.

Smoke: live site /login 200, unauthenticated /dashboard redirects to /login, GoTrue health 200, anonymous organizations select returns an empty set as before. Authenticated regression (sign-in, form submit, invite, admin role change) still to be run by a person with a session.

Rollback if a legitimate profile write breaks: apply `_rollback/20260920194350_rollback.sql` through the same MCP path, then re-apply once the cause is fixed.

## Verify round 1 (headless, 2026-09-20T20:26:41Z): NEEDS ATTENTION, 8.5

Fresh-session verify plus a Codex adversarial review found no bypass in the migration and confirmed at the code layer that every app write to profiles goes through the service-role client. Three findings, all addressed before round 2:

1. **REST suite could become the exploit** (Codex, high). On an unpatched or regressed target a non-rejected PATCH would have left the test account promoted. Verify added a best-effort revert-on-breach with a loud CRITICAL line and restricted the documented targets. Kept as-is and committed.
2. **T08 was a no-op** (Codex, medium). `SET role = role` never trips the guard's IS DISTINCT FROM condition, so the service-role exemption was never exercised. Fixed: T08 now flips the value inside the rolled-back probe. Re-run on the rebuilt local copy (13 of 13) and on production (T08 PASS, role `user -> user` after the probe).
3. **No independent re-execution.** The isolated copy had been torn down. It is rebuilt and left running for round 2; see below.

Verify could not write to the repo lessons file under headless permissions; the two lessons are applied by hand in `.claude/lessons-learned.md`. AC 6 (authenticated app regression) remains open and needs a person with a session.

## Verify round 2 (headless, 2026-09-20T20:45:41Z): NEEDS ATTENTION, 8.5

Verify re-executed the cycle itself on the local copy: 13 of 13 on the patched copy, exploit reproduced after the rollback script (2 columns writable, 8 offending grants back), 13 of 13 after re-apply. Codex corroborated and found no migration bypass. Two items remained:

1. **REST suite hardening** (Codex, high). The HTTP helper caught only HTTP errors, so a committed write whose response timed out would crash before the restore; the cross-user probe wrote a literal `"x"`; the script defaulted to the production env file. Fixed: every forbidden probe is followed by a re-read and restore regardless of the response (id case confirmed by email at the new id); the cross-user probe writes the other user's current value back; `--url` and `--anon-key` are required and the production ref is refused without `--allow-production`. Validated by the new `bf59_rest_stub_test.py` (patched: exit 0 no breach; open and timeout: exit 1 with breach lines and the stub's state restored; production refusal: exit 2). That self-test also caught a false breach on the id probe in the first rewrite, which is now fixed.
2. **AC 6, authenticated app regression.** Still needs a person with a live session.

## AC 6: authenticated regression on production (2026-09-21T17:12Z to 17:14Z)

Driven through Tim's signed-in Brave session (super admin) with Claude in Chrome, against the live site after the migration. Every artifact created was removed afterwards; counts were checked back to baseline.

| Check | What was done | Result |
| --- | --- | --- |
| Sign-in / profile read | Dashboard and Projects pages loaded with Tim's session (`getCurrentUser` reads `profiles.role`; project list under RLS) | Welcome banner, 10 projects listed |
| Form submit | Daily Dust Log on the throwaway project "BF 32 Test", default entry, submitted | Redirected to the project's dust-log tab showing the new entry; `form_submissions` row 327b1e69 created (daily_dust_log, submitted_by Tim, 17:12:41Z) |
| Admin role change | Users page: Demote claude.test@braveforms.dev to user, then Promote back to admin (service-client `updateRole`, now passing the guard trigger with a real value change) | "Role updated to user." then "Role updated to admin."; profile role admin, `organization_members.role` admin synced |
| User invite | Invite "BF-59 Invite Check" timsaverill+bf59@protonmail.com as user (service-client `inviteUser` + `handle_new_user` trigger) | "Invite sent"; auth user, profile (user/member) and Q&D membership (member) created |
| Delete user (bonus) | App's Delete user on the invitee, inline Confirm | "User deleted."; auth user, profile and membership gone via cascade |

Cleanup: submission 327b1e69 deleted by SQL; invitee deleted through the app. After: auth.users 9, profiles 8, organization_members 8, form_submissions 39, invitee 0, claude.test admin with admin membership. Only residue is a bumped `updated_at` on claude.test's profile.

Browser note: after a text field took focus, every Claude in Chrome page action failed with "Cannot access a chrome-extension:// URL of different extension" until the page was reloaded; the ChatGPT extension installed 2026-09-08 attaches to text fields. Workaround used: reload, then drive controls through `javascript_tool` on the page DOM.

## Verify round 4 (headless, 2026-09-21T17:33:33Z): NEEDS ATTENTION, 8.5

All seven acceptance criteria confirmed met. Verify independently confirmed that the deployed `auth.role()` returns NULL in a bare postgres session, so the guard trigger never blocks future migrations. One Codex finding (confidence 1.0): the REST script's `--allow-production` flag still allowed the mutating probe against production, where a write that commits after the process exits cannot be rolled back by any client-side sweep. Verify named the fix: remove production-mutation support entirely. Done: the flag is gone and the production ref is refused unconditionally, which matches the AC 4 decision that the transactional SQL suite is the production check. The `--allow-production` mention in the round 2 note above is historical.

## Verify round 3 (headless, 2026-09-20T21:07:33Z): NEEDS ATTENTION, 8.5

Per-file: migration 9.7, rollback 9.6, SQL suite 9.6, visibility matrix 9.6, stub test 8.5, REST script 7.5. Both reviewers again: no migration bypass; every profile write in the app goes through the service client. Two Codex findings, both on the REST harness, both fixed the same session:

1. A forbidden write that commits after the per-probe re-read (read lag) escaped detection. Fixed with a final sweep over every forbidden field after all probes, restoring anything that changed. The stub test gained a `late` scenario: open target with read lag, per-probe re-read stale, sweep catches and restores.
2. An empty fixture lookup silently dropped R03 and R06 and reported PASS on five checks. Fixed: the script fails closed with exit 2 when no second profile is visible. The stub test gained a `solo` scenario.

Stub self-test after the fixes: patched, open, timeout, late, solo, refusal all PASS.

A client-side detector cannot close the lag window entirely; the transactional SQL suite remains the production check, and the REST harness is slated to fold into BF-34's Playwright harness. Three headless rounds have converged on the same verdict for the same structural reason: AC 6 (authenticated regression) is not verifiable headless. No further headless round until a person runs it.

### How to re-run the suites independently

REST suite self-test, no credentials: `python Testing/security/bf59_rest_stub_test.py` (expect `RESULT: PASS`).

Local copy (patched, production data from the 2026-09-20 backup): container `bf59-pg`, port 55433, superuser `postgres`, password `bf59local`. If it is not running: `docker run -d --name bf59-pg -e POSTGRES_PASSWORD=bf59local -p 127.0.0.1:55433:5432 public.ecr.aws/supabase/postgres@sha256:d97ae90aaf153598f2978a100c7b9c24098829df4a5c3f3c466bb56b6037b998`, then `python backups/2026-09-20T192106Z-pre-launch-tweaks/scripts/restore_local_docker.py bf59-pg`, then apply the migration with `docker cp` and `psql -f`.

```
MSYS_NO_PATHCONV=1 docker cp Testing/security/bf59_profile_role_guard.sql bf59-pg:/tmp/suite.sql
MSYS_NO_PATHCONV=1 docker exec bf59-pg psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 -f /tmp/suite.sql
```

Production: paste the body of `Testing/security/bf59_profile_role_guard.sql` into the Supabase MCP `execute_sql` for project `ytsghlfjgdhczfbggpdl`. Every probe rolls back; the final SELECT is the report. The same holds for `bf59_visibility_matrix.sql`.

## Privileged-account review (production, read-only, 2026-09-20)

| Email | role | platform_role | profile updated_at | Membership | Provenance |
| --- | --- | --- | --- | --- | --- |
| timsaverill@protonmail.com | admin | super_admin | 2026-04-25 | Q&D Construction: owner | BF-30 backfill set super_admin on 2026-04-25 (EF fact 7d644dbd) |
| abreen@qdconstruction.com | admin | member | 2026-03-12 | Q&D Construction: admin | Andy, promoted during sprint 2 UAT |
| gdamele@qdconstruction.com | admin | member | 2026-04-16 | Q&D Construction: admin | Gracie, invited as admin |
| claude.test@braveforms.dev | admin | member | 2026-03-09 | Q&D Construction: admin | test account (BF-55 removes) |
| itadmin@pleniumbuilders.com | admin | member | 2026-05-02 | Q&D Construction: admin | was a Q&D `user` in the BF-30 backfill; promoted 2026-05-02 during multi-tenant UAT. Membership is Q&D, not Plenium. Confirm intent in BF-55. |
| adminbreen@pleniumbuilders.com | admin | member | 2026-06-08 | Plenium Builders: owner | BF-33 Slice 1 backfill by Tim on 2026-06-08 (EF fact edc68e8c) |

Finding: one super admin, and it is Tim. Every admin-role row matches the 2026-09-20 backup exactly and every `updated_at` predates the 2026-09-08 discovery, with a documented provisioning event behind each. Re-read after the production apply at 2026-09-20T20:07Z: identical rows. No evidence the self-promotion path was used. Caveat, stated plainly: PostgREST writes are not in the Supabase Auth audit log, and a promote-then-revert would leave only a bumped `updated_at`; none of the timestamps is unexplained, but this is evidence of absence, not proof.

## Notes

- This fixes self-promotion. It does not add target-organization authorization to the user-management service-role actions (readiness blocker 1, second bullet). File that separately if it is not folded into BF-34.
- Run before BF-55 if possible: the user cleanup should happen on a database where the remaining accounts cannot re-escalate.
