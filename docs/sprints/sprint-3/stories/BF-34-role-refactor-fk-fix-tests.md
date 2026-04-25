# BF-34: Org-Scoped Role Checks + Service-Audited Client + FK Fix + Cross-Tenant Test Harness

**Type:** Refactor / Security / Tests
**Priority:** HIGH
**Points:** 5
**Status:** NOT STARTED
**Sprint:** 3
**Depends on:** BF-33

## Problem

After BF-33, the schema + RLS + UI all support multi-tenant, but every server action still reads `profiles.role` directly and branches on `user.role !== "admin"`. This works today only because every user's `profiles.role` was faithfully mirrored into `organization_members.role` during BF-30 backfill — it's a ticking mismatch waiting to happen. Also:

- Super-admin reads through `/admin/*` currently go through plain service client — no audit log, no write guardrails.
- The 4 NO-ACTION FKs on `profiles(id)` still block user deletion (BF-28/29 deferred debt).
- No automated test proves cross-tenant isolation. Every future change could silently break it.

## Design

### Org-scoped role checks

Replace every `user.role !== "admin"` callsite with `requireOrgAdmin(orgId)`. The org ID comes from:
- **Create** actions (e.g. new project): active org from cookie (`getActiveOrg()`).
- **Update/Delete** actions on an existing resource: the resource's `organization_id` column.

New helper `src/lib/auth.ts::requireOrgAdmin(orgId)`:
```ts
export async function requireOrgAdmin(orgId: string): Promise<User | ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  if (!data || !['owner','admin'].includes(data.role)) {
    return { error: "Org admin access required." };
  }
  return user;
}
```

### Service-audited client (filling in BF-33 stub)

`src/lib/supabase/service-audited.ts` wraps `createServiceClient()`:
- Every query method (`select`, `rpc`) writes an `audit_log` row: `action='super_admin_view'`, `actor_user_id=<super_admin>`, `target_org_id`, `target_table`, `metadata={query_info}`.
- Write methods (`insert`, `update`, `delete`, `upsert`) throw unless the target org is one the super-admin is ALSO a regular admin of (rare, but allowed).
- `/admin/*` routes use this wrapper exclusively. No bare `createServiceClient` in `/admin/**`.

### FK fix (BF-28/29 debt)

Migration: `supabase/migrations/20260424150000_user_deletion_fks.sql`

```sql
-- Make currently-NOT NULL columns nullable where needed
ALTER TABLE project_documents ALTER COLUMN uploaded_by DROP NOT NULL;
-- form_submissions.submitted_by, projects.created_by already nullable

-- Recreate FKs with SET NULL
ALTER TABLE form_submissions DROP CONSTRAINT form_submissions_submitted_by_fkey;
ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_submitted_by_fkey
  FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_documents DROP CONSTRAINT project_documents_uploaded_by_fkey;
ALTER TABLE project_documents ADD CONSTRAINT project_documents_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE projects DROP CONSTRAINT projects_created_by_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_users DROP CONSTRAINT project_users_assigned_by_fkey;
ALTER TABLE project_users ADD CONSTRAINT project_users_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;
```

No rows changed — `ON DELETE SET NULL` only fires on future deletes.

### `deleteUser` simplification

`src/app/dashboard/users/actions.ts::deleteUser` — drop any FK-avoidance logic, just call `service.auth.admin.deleteUser(userId)`. Orphan records stay scoped to their org (safer than today, since deletion used to fail entirely).

### Cross-tenant Playwright test harness

`tests/multi-tenant.spec.ts` — full cross-tenant leak test matrix (12 cases from the plan). Seed fixture: 2 orgs + 1 super-admin, each with members, projects, a submission with photo, and a document.

## Files

### New

- `tests/multi-tenant.spec.ts` — Playwright suite.
- `tests/fixtures/multi-tenant.sql` — seed script for the harness.
- `supabase/migrations/20260424150000_user_deletion_fks.sql` — FK migration.
- `supabase/migrations/_rollback/20260424150000_rollback.sql` — inverse.

### Modified

- `src/lib/supabase/service-audited.ts` — fill in audit-log wiring (stubbed in BF-33).
- `src/lib/auth.ts` — add `requireOrgAdmin(orgId)`.
- `src/app/dashboard/projects/actions.ts` — replace `user.role !== "admin"` at lines 23, 103, 184 with `requireOrgAdmin`.
- `src/app/dashboard/projects/new/page.tsx:8` — `requireOrgAdmin(activeOrg.id)`.
- `src/app/dashboard/projects/[id]/document-actions.ts:57` — `requireOrgAdmin(project.organization_id)`.
- `src/app/dashboard/projects/[id]/page.tsx:54` — QR modal only if `requireOrgAdmin(project.organization_id)` passes.
- `src/app/dashboard/projects/[id]/edit/page.tsx:19` — `requireOrgAdmin`.
- `src/app/dashboard/users/page.tsx:8` — `requireOrgAdmin(activeOrg.id)`.
- `src/app/dashboard/users/actions.ts` — every action uses `requireOrgAdmin(activeOrg.id)`.
- `src/app/dashboard/users/users-client.tsx` — role-toggle UI driven by org-membership role, not profile.role.
- `src/components/sidebar.tsx:42` — `adminOnly` → "admin of active org".
- `src/components/dashboard-shell.tsx:14` — receive/pass `activeOrgRole` instead of `profile.role`.
- `src/components/sidebar.tsx` footer — always source from `activeOrg.name` (BF-33 had flag-gated version; remove flag branch).
- `src/app/admin/*` — every route uses `createAuditedServiceClient` exclusively (remove any bare service client usage added in BF-33).

## Playwright test matrix

Fixture: org_a (admin `a_admin`, member `a_member`), org_b (admin `b_admin`, member `b_member`), super `super@test`.

| # | Actor | Action | Expected |
|---|---|---|---|
| 1 | a_admin | GET /dashboard/projects | Only org_a's projects |
| 2 | a_admin | GET /dashboard/projects/{org_b_id} | 404 |
| 3 | a_admin | GET /api/forms/{org_b_submission_id}/pdf | 403/404 |
| 4 | anyone w/ org_a token | GET /inspector/{token} | org_a data only |
| 5 | a_admin | SELECT profiles | Self + org_a members only |
| 6 | a_admin | signFileUrl for org_b path | RLS denies |
| 7 | a_admin | POST /dashboard/users invite with tampered org_id | Rejected server-side |
| 8 | a_admin | Set cookie bf_active_org=org_b manually | Proxy resets on next request |
| 9 | super | GET /admin/organizations/{org_b} | Loads + audit_log row written |
| 10 | super | POST /dashboard/projects (while viewing org_b) | 403 |
| 11 | any admin | Delete user w/ submissions | Succeeds; submission.submitted_by = NULL |
| 12 | unauthenticated | GET bucket URL without signature | 403 |

## Pre-Flight

- Playwright configured for Next.js 16 + Supabase (check existing test infra; if none, scaffold minimally — Playwright over E2E via API mocks because cross-tenant needs real RLS).
- FK migration tested on Supabase branch: create a test user with submissions, delete, verify submission survives with `submitted_by=NULL`.

## Rollback

### Code (L1)
Vercel rollback — app reverts to single-tenant role checks. Schema is additive.

### FK migration (L2)
`supabase/migrations/_rollback/20260424150000_rollback.sql` — recreate FKs with NO ACTION. Safeguard: before running inverse, `SELECT count(*) FROM form_submissions WHERE submitted_by IS NULL` — if >0, confirm with user whether to hydrate or accept the orphans in the rollback. For a 7-day window before BF-35, unlikely to have any.

### Service-audited client
Revert `/admin/*` routes to plain service client — low-risk, no schema impact.

## Acceptance Criteria

- [ ] `requireOrgAdmin(orgId)` helper added to `src/lib/auth.ts`.
- [ ] Every `user.role !== "admin"` callsite replaced with `requireOrgAdmin`.
- [ ] Grep `src/app/` for `user\.role\s*!==\s*"admin"` returns zero matches.
- [ ] `src/lib/supabase/service-audited.ts` writes an `audit_log` row on every SELECT.
- [ ] Service-audited client throws on any write to an org the super-admin isn't a regular admin of.
- [ ] `/admin/*` routes use `service-audited` exclusively.
- [ ] FK migration recreates 4 FKs with `ON DELETE SET NULL`; `project_documents.uploaded_by` made nullable.
- [ ] `deleteUser` server action simplified (no FK-avoidance logic).
- [ ] Playwright test harness passes all 12 cases on Supabase branch.
- [ ] Fixture SQL seeds 2 orgs + super-admin cleanly.
- [ ] Manual smoke test: delete a test user holding form submissions → delete succeeds, submissions persist with NULL creator.
- [ ] Manual smoke test: super-admin views org_b; `audit_log` row appears; write attempt blocked.
- [ ] No regression in Q&D UX (Andy smoke test).
- [ ] Rollback migration tested (dry-run on branch).

## Go/No-Go Gate → BF-35 (scheduled +7 days)

- Playwright suite passes clean in CI.
- 7 days of production stability after BF-34 merge.
- `grep -rE "is_admin\(|profile\.role|profiles\..*\.role" src/` returns zero matches (CI gate).
- Audit log has rows for every super-admin cross-org view in the 7-day window (confirm logging works).
- Zero user-deletion failures in production since FK fix landed.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 5a + Phase 6)
- Resolves: BF-28/29 deferred debt (user-deletion FK gap)
- Previous: BF-33 (feature flag on in production)
- Next: BF-35 (scheduled +7 days after this lands, drops `is_admin()` and `profiles.role`)
