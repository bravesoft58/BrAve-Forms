# BF-36: UAT Hotfix — create-project NOT NULL + qr_tokens RLS

**Type:** Hotfix
**Priority:** P0 (blocks Sprint 3 soak testing)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 3
**Depends on:** BF-30 (cause of regression #1)
**Reported by:** Andy Breen, UAT 2026-04-25

## Problem

Two regressions surfaced by Andy during BF-30 soak testing on 2026-04-25. Both block soak testing — Andy cannot create new projects or generate inspector QR codes for anything other than the original Q&D project.

### #1 — Create New Project fails

```
null value in column "organization_id" of relation "projects" violates not-null constraint
```

BF-30 added `projects.organization_id` and made it `NOT NULL` after backfill. The `createProject` server action at `src/app/dashboard/projects/actions.ts:44-51` was not updated to populate it. Every new-project insert now fails.

### #2 — Inspector QR generation fails for non-Q&D-assigned projects

```
new row violates row-level security policy for table "qr_tokens"
```

Visible from Andy's screenshot: clicking "Inspector QR Code" on projects he isn't assigned to via `project_users` returns this error. The `qr_tokens` policy in `supabase/migrations/20260310163000_qr_tokens.sql:17-23` only allows insert when the user is in `project_users` for that project — it doesn't honor `is_admin()`. Tim (and any future admin) is implicitly admin everywhere but is only listed in `project_users` for the original Q&D project he created. This is technically a pre-existing bug, not strictly a BF-30 regression, but it now blocks soak testing because Andy is exercising the QR feature across all projects.

## Design

### Fix #1 — inject `organization_id`

Active-org context is BF-33's job (cookie-driven `getActiveOrg()`); BF-30 did not stand up any cookie. For the hotfix, derive the org from the user's `organization_members` row. Every existing user has exactly one membership today (Q&D), so a single-row lookup is unambiguous. When BF-33 lands, swap to the cookie-driven helper — TODO comment must mark the call site for replacement.

Use `.maybeSingle()` (not `.single()`) so a missing membership returns clean `null` instead of an error. Use `.order('joined_at').limit(1)` to make the lookup deterministic for any future multi-membership case.

```ts
// src/app/dashboard/projects/actions.ts (createProject)
// TODO(BF-33): replace with getActiveOrg() once cookie/org-context lands.
const { data: membership, error: membershipError } = await supabase
  .from("organization_members")
  .select("org_id")
  .eq("user_id", user.id)
  .order("joined_at", { ascending: true })
  .limit(1)
  .maybeSingle();

if (membershipError) {
  return { error: "Could not resolve your organization. Try again." };
}
if (!membership) {
  return { error: "No organization membership found. Contact your administrator." };
}

// then in insert():
.insert({
  ...buildProjectFields(data),
  organization_id: membership.org_id,
  created_by: user.id,
})
```

### Fix #2 — broaden `qr_tokens` policy to honor `is_admin()` (and correctly target `authenticated`)

Single-statement migration aligned with how every other write policy in the system works. BF-31 will rewrite this against org-scoped helpers, but for the hotfix we add `is_admin()` to match the existing global pattern.

While we're authoring a fresh policy, we also fix the latent role-grant bug flagged in BF-31's docs: the existing policy targets the `public` role instead of `authenticated`. Drift toward correctness; one word, no scope creep, removes the bug from BF-31's docket.

All references are schema-qualified to be safe under whatever `search_path` the Supabase MCP `apply_migration` runs with.

```sql
-- supabase/migrations/<fresh_timestamp>_qr_tokens_admin_policy.sql
-- Use a timestamp generated at apply time (e.g. 20260429HHMMSS), not the planning placeholder.
DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects" ON public.qr_tokens;
DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects or admin" ON public.qr_tokens;

CREATE POLICY "Users can manage QR tokens for assigned projects or admin"
  ON public.qr_tokens FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())
  );
```

Paired rollback at `supabase/migrations/_rollback/<fresh_timestamp>_rollback.sql` drops the new policy by name and restores the original verbatim (note: original used neither `WITH CHECK` nor `TO authenticated` — preserve that exact shape on rollback).

## Acceptance Criteria

- [ ] Admin user can create a new project end-to-end with no error; the `projects.organization_id` of the new row equals the `org_id` returned by `SELECT org_id FROM organization_members WHERE user_id = <admin>` (verify with a direct SQL query post-create, not just by absence of error).
- [ ] Non-admin user (when re-enabled) creating a project still fails the existing `role !== "admin"` gate before reaching the insert.
- [ ] Admin user can generate an Inspector QR Code for any project in the system (smoke-tested across all 5 existing Q&D projects + 1 new project Andy creates).
- [ ] Non-admin user assigned to a project via `project_users` can still generate a QR for that project (existing OR branch of the policy — must be exercised, not just assumed).
- [ ] Post-migration `pg_policies` query asserts: `qr_tokens` has exactly one ALL policy, `roles = {authenticated}`, and `with_check IS NOT NULL` and matches `qual`.
- [ ] No console errors. Vercel runtime logs and Supabase Postgres logs show no RLS denials in the 1h window after Andy resumes soak.
- [ ] Andy soak-tests both fixes in production and signs off in writing.

## Test Plan

1. **Local**: create migration + code change; `pnpm build` clean; manual test create-project + QR on local Supabase.
2. **Prod migration**: apply via `mcp__plugin_supabase_supabase__apply_migration` with the fresh timestamp. Commit the exact applied file to `supabase/migrations/`. Run `supabase migration list` to verify local history matches remote.
3. **Prod code**: push to `master`, auto-deploy via Vercel.
4. **Post-migration policy assertion (SQL):**
   ```sql
   SELECT policyname, roles, cmd, qual, with_check
   FROM pg_policies WHERE tablename = 'qr_tokens';
   ```
   Confirm exactly one row, `roles = {authenticated}`, `cmd = ALL`, `with_check` non-null and matches `qual`.
5. **Smoke as admin (Tim):** create a throwaway test project; verify `organization_id` is set correctly via direct SQL; generate QR for the new project + 2 existing Q&D projects; check Vercel runtime logs and Supabase Postgres logs (NOT `auth.audit_log_entries` — that only tracks auth events, not RLS denials).
6. **Smoke as non-admin:** sign in as a non-admin user assigned to a project via `project_users`, generate a QR for that project. Confirms the OR branch of the new policy works. (If no non-admin test account exists, create a temporary one or use `SET request.jwt.claims` in a local Supabase session for an SQL-level assertion.)
7. **Andy**: resume soak testing, exercise create-project and QR across all projects.

## Escape Plan

- L1: `git revert` + Vercel rollback (~30s).
- L2: Run paired rollback migration (~1 min).
- L3: PITR if anything else surfaces (unlikely; both fixes are narrow and additive).

## Out of Scope

- Active-org cookie management (BF-33).
- Org-scoped RLS rewrite for `qr_tokens` (BF-31 will replace this policy entirely).
- Cross-tenant testing harness (BF-34).
- Transactional integrity of `createProject` (currently does 4 sequential inserts; partial failure leaves orphan project + permits + form requirements without the user assignment row). Pre-existing — predates BF-30 — not introduced by this hotfix. Track separately if it bites real users.
- Dust log UAT items — separate story BF-37.

## Note for BF-31

Until BF-31 ships, the new `qr_tokens` policy gives any global `is_admin()` user read/write access to QR tokens for projects in **any** organization that ever gets seeded. With Q&D as the only org today this is identical to the pre-BF-30 behavior. If a second prospect org gets seeded before BF-31 lands (unlikely per Sprint 3 sequence), this hotfix becomes a cross-tenant leak vector. BF-31 closes it by replacing this policy with org-scoped helpers (`is_org_admin(project.org)`).

Also: BF-31's currently planned migration timestamp `20260424130000` is older than this hotfix's timestamp. When BF-31 starts, freshen its timestamp so the migration sequence applies forward-only.
