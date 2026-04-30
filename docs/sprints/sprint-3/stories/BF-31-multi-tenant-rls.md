# BF-31: Multi-Tenant RLS Rewrite + Profiles Leak Fix

**Type:** Security / Schema Migration
**Priority:** CRITICAL
**Points:** 5
**Status:** COMPLETE (2026-04-30 — base migration `20260430120000_multi_tenant_rls.sql` + Option A addendum `20260430140000_admin_org_access.sql`)
**Sprint:** 3
**Depends on:** BF-30

## Problem

With the org schema in place, every existing RLS policy needs to be rewritten to scope through organization membership. Current policies short-circuit on `is_admin() OR ...`, which under multi-tenant would give any admin cross-org god mode.

Two existing leaks also get fixed here:

1. **`profiles_select` uses `USING true`** — every authenticated user can list every profile in the database. Today this means Andy can see Tim's email, name, and role. Under multi-tenant it would expose every prospect's user list to every other prospect.
2. **`qr_tokens` policy targets `public` role instead of `authenticated`** — wrong grant by accident.

## Design

Rewrite every policy on all 9 existing public tables. Add policies for the 4 new tables from BF-30. Introduce three helper functions that every policy uses. Keep `is_admin()` alive as a compatibility shim so server actions still work; BF-35 drops it.

### Helper functions

```sql
CREATE OR REPLACE FUNCTION current_org_ids() RETURNS uuid[]
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ARRAY(SELECT org_id FROM organization_members WHERE user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid() AND org_id = p_org_id AND role IN ('owner','admin')
  )
$$;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
$$;
```

### `get_user_project_ids()` rewrite

```sql
CREATE OR REPLACE FUNCTION get_user_project_ids() RETURNS uuid[]
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ARRAY(
    SELECT pu.project_id
    FROM project_users pu
    JOIN projects p ON p.id = pu.project_id
    WHERE pu.user_id = auth.uid()
      AND p.organization_id = ANY(current_org_ids())
  )
$$;
```

### Policy rewrites

| Table | Cmd | New USING / WITH CHECK |
|---|---|---|
| `projects` | select | `is_super_admin() OR organization_id = ANY(current_org_ids())` |
| `projects` | insert | `is_org_admin(organization_id)` |
| `projects` | update | `is_org_admin(organization_id)` |
| `projects` | delete (NEW) | `is_org_admin(organization_id)` |
| `form_submissions` | select/insert/update | `is_super_admin() OR project_id = ANY(get_user_project_ids())` |
| `form_photos` | select/insert | same shape via submission → project |
| `project_documents` | select/insert | `is_super_admin() OR project_id = ANY(get_user_project_ids())` |
| `project_documents` | delete | `is_super_admin() OR is_org_admin((SELECT organization_id FROM projects WHERE id = project_id))` |
| `project_permits` | all | admin path via `is_org_admin(project.org)`; select also allows project members |
| `project_form_requirements` | all | same |
| `project_users` | select | `is_super_admin() OR user_id = auth.uid() OR is_org_admin((SELECT organization_id FROM projects WHERE id = project_id))` |
| `project_users` | insert/update/delete | `is_org_admin(project.org)` |
| `qr_tokens` | ALL | target `authenticated` role (fix wrong `public` grant); `is_org_admin(project.org) OR project_id = ANY(get_user_project_ids())` |
| `profiles` | select ⚠️ FIX LEAK | `auth.uid() = id OR is_super_admin() OR id IN (SELECT user_id FROM organization_members WHERE org_id = ANY(current_org_ids()))` |
| `profiles` | update | unchanged (self only) |
| `organizations` | select | `is_super_admin() OR id = ANY(current_org_ids())` |
| `organizations` | insert/update/delete | `is_super_admin()` |
| `organization_members` | select | `is_super_admin() OR org_id = ANY(current_org_ids())` |
| `organization_members` | insert/delete | `is_super_admin() OR is_org_admin(org_id)` |
| `organization_invitations` | select | `is_super_admin() OR is_org_admin(org_id) OR email = auth.jwt()->>'email'` |
| `organization_invitations` | write | `is_org_admin(org_id)` |
| `audit_log` | select | `is_super_admin()` |
| `audit_log` | insert | `false` (service role bypasses) |
| `audit_log` | update/delete | `false` — append-only |

### Supporting index

```sql
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org
  ON organization_members (user_id, org_id);
```

Covers `current_org_ids()` and `is_org_admin()`.

## Files

### New

- `supabase/migrations/20260424130000_multi_tenant_rls.sql` — forward.
- `supabase/migrations/_rollback/20260424130000_rollback.sql` — inverse (verbatim old policies captured during planning).

### Modified

None (no code changes).

## Pre-Flight

1. Capture current policies verbatim BEFORE running the forward migration:
   ```
   pg_dump --schema-only --no-owner | grep -A2 "CREATE POLICY" > backups/pre_bf31_policies.sql
   ```
   This file IS the rollback script body.
2. Supabase snapshot.
3. Run on Supabase branch. Seed a second test org + test user via a one-off SQL script, not via the app yet.
4. Two-org SQL assertion: impersonate org_b user via `SET request.jwt.claims`, verify zero org_a rows visible across every table.
5. Grep confirms `profiles_select` tightening only affects `src/lib/queries/users.ts`.

## Rollback (L2)

`supabase/migrations/_rollback/20260424130000_rollback.sql`:
- Drops all new policies.
- Recreates the captured old policies verbatim from `pre_bf31_policies.sql`.
- Reverts `get_user_project_ids()` to its pre-BF-31 body.
- Leaves helper functions `current_org_ids`, `is_org_admin`, `is_super_admin` in place (harmless if unused).
- Leaves the supporting index (harmless).

Zero data loss. App unaffected because no code yet references the new helpers.

## Performance Verification

After running the forward migration on the branch:
- `EXPLAIN ANALYZE` the dashboard's main `SELECT * FROM projects` query as a Q&D member. Must not regress by >10% vs pre-BF-31.
- If regression: inline the helper function bodies into policies (Postgres doesn't always inline `SECURITY DEFINER` functions).

## Acceptance Criteria

- [ ] Helper functions `current_org_ids()`, `is_org_admin(uuid)`, `is_super_admin()` created and marked `STABLE SECURITY DEFINER`.
- [ ] `get_user_project_ids()` rewritten to filter via `organization_members`.
- [ ] Index `idx_organization_members_user_org` created.
- [ ] All 9 public-table policies rewritten per the table above.
- [ ] `profiles_select` no longer leaks — a Q&D member sees only self + co-members.
- [ ] `qr_tokens` policy targets `authenticated` role, not `public`.
- [ ] All 4 new-table policies created (organizations, organization_members, organization_invitations, audit_log).
- [ ] `is_admin()` function preserved unchanged (compatibility shim for existing server actions).
- [ ] Two-org isolation script passes clean on Supabase branch.
- [ ] Q&D dashboard unchanged: all 5 projects, 11 submissions, documents visible to the correct users (manual smoke test).
- [ ] No >10% latency regression on dashboard page load.
- [ ] `pre_bf31_policies.sql` captured and committed to `backups/`.
- [ ] Rollback migration tested (dry-run on branch).

## Go/No-Go Gate → BF-32

- Q&D users still see same projects, forms, documents in the UI.
- Two-org assertion script: org_b user returns zero org_a rows across all tables.
- `SELECT id, email, full_name FROM profiles` run as org_a user → returns only org_a members + self.
- Dashboard page load latency within 10% of pre-BF-31 baseline.
- `audit_log` INSERT from authenticated client fails (service-role-only).
- No errors in Vercel runtime logs for 24h after production merge.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 2)
- Previous: BF-30 (schema foundation)
- Next: BF-32 (storage privatization)

---

## Addendum — Option A: Admin Tier on Project-Level Data (2026-04-30)

**Why:** /verify caught a behavioral regression introduced by the design table at line 68 above. Pre-BF-31, every `profiles.role='admin'` user saw all submissions/photos/documents/permits/form_requirements via the `is_admin()` short-circuit baked into every policy. BF-31 narrowed that to `is_super_admin()` (Tim only) plus `project_users` gating. Production count under impersonation:

| User | Pre-BF-31 submissions | Post-BF-31 (base) | Post-Option-A |
|------|:---:|:---:|:---:|
| Andy Breen (org admin, 2 project_users rows) | 14 | 7 | **14** |
| Claude Test (org admin, 3 project_users rows) | 14 | 6 | **14** |
| Gracie Damele (org admin, **0** project_users rows) | 14 | **0** | **14** |
| Plain member (org member, 0 project_users) | 0 | 0 | 0 |
| Orphan (no membership) | n/a | 0 | 0 |
| Tim (super_admin) | 14 | 14 | 14 |

**Migration:** `supabase/migrations/20260430140000_admin_org_access.sql`
**Rollback:** `supabase/migrations/_rollback/20260430140000_rollback.sql`
**Pattern:** add `OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))` to the SELECT (and submissions/photos/documents INSERT-UPDATE) policies on the five project-level tables. Matches the BF-31 mutation policies on `qr_tokens`, `project_documents.delete`, `project_permits.{insert,update,delete}`, and `project_form_requirements.{insert,update,delete}` which were already correct.

**Tier matrix (final):**
- `super_admin` → everything platform-wide (audited).
- `is_org_admin(org)` → every project's data in the org (read + write where the BF-31 mutations allowed admin write).
- `project_users` member → data only for projects in their `project_users` rows.
- non-member of org → projects.SELECT widened to org members but project-level data denied.
- orphan → all-zero everywhere.

**Verification:** orphan still 0/everything (isolation preserved), plain member still 6 projects + 0 project-level data (BF-31 design intact for non-admins), all 3 Q&D admins now see 14/14 submissions and full org-wide documents/permits/form_requirements. Advisor profile unchanged from BF-31 baseline. Lessons-learned entry captured at `.claude/lessons-learned.md` ("RLS rewrites that collapse a tier silently hide data — count rows under impersonation before AND after").
