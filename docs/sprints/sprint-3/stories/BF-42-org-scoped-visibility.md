# BF-42: Org-Scoped Visibility for All Members

**Type:** Architecture / RLS model change
**Priority:** HIGH (UAT round 3 — A3 unblock)
**Points:** 1
**Status:** DONE — migration LIVE in prod 2026-05-04 via Supabase MCP, Andy confirmed working as desired
**Sprint:** 3
**Depends on:** BF-31 (multi-tenant RLS), BF-32 (storage privatization)
**Reported by:** Andy Breen, UAT round 3 meeting 2026-05-04

## Problem

Andy raised two points during the 2026-05-04 UAT meeting that converged on the same answer:

1. The general-user (`role: user`) `abreen@qdgroupinvesco.com` saw zero projects and zero forms, because `project_users` had no rows for them. Andy could not assign them through the UI — the Team tab is a "coming soon" placeholder.
2. Andy stated that in construction, workers regularly move between jobs and crews. Per-project access control is more friction than it is worth — the org-trust boundary is the right one, not the project-trust boundary.

The pre-BF-42 RLS predicate for non-admin users was:

```
is_super_admin() OR is_org_admin(<org_id>) OR project_id = ANY(get_user_project_ids())
```

`get_user_project_ids()` reads `project_users` joined with `projects` filtered to the user's orgs. With no `project_users` rows for a user, the third branch is empty and only super_admin / org_admin succeed — general users see nothing.

## Decision

**Drop project-level access control entirely. Org membership is the read/write boundary.**

- Any member of the org sees all projects, permits, form requirements, submissions, photos, and documents in their org.
- Any member of the org may submit forms / upload photos for any project in their org.
- Admin-only writes (create/edit/delete project, edit/delete permits, edit/delete form_requirements, delete documents) keep their `is_org_admin` gate — unchanged.
- `project_users` table is left in place but is no longer load-bearing for access. Future cleanup may drop it or repurpose it for project-role metadata (foreman, super, etc.).
- `get_user_project_ids()` function is left in place but no longer referenced by any RLS policy. Safe to drop in a follow-up.

## RLS pattern (canonical)

```sql
project_id IN (
  SELECT p.id FROM public.projects p
  WHERE p.organization_id = ANY(public.current_org_ids())
)
```

This shape is structurally immune to the BF-32 alias-collision bug class — the outer table's `project_id` column never appears inside the subquery scope.

## Changes

**Migration:** `supabase/migrations/20260504160000_org_scoped_visibility.sql`

13 policies replaced:

| Schema | Table | Policies replaced |
|---|---|---|
| public | form_submissions | submissions_select, submissions_insert, submissions_update |
| public | form_photos | photos_select, photos_insert |
| public | project_documents | project_documents_select, project_documents_insert |
| public | project_form_requirements | form_requirements_select |
| public | project_permits | permits_select |
| public | qr_tokens | qr_tokens_all (single ALL policy with both qual + with_check) |
| storage | objects | form_attachments_read, form_attachments_upload, project_documents_read |

DELETE policies on `project_documents`, `project_permits`, `project_form_requirements`, and storage `*_delete` are unchanged — admin-only.

`projects_select` was already org-scoped via `current_org_ids()` (no change needed).

## Apply path

Direct to prod via Supabase MCP `apply_migration name=org_scoped_visibility` — same path as BF-31 Option A and BF-32 Step 3b. Supabase handles the rollback (ad-hoc DDL is reversible by re-applying the prior policy bodies if needed; Tim has the BF-31 + BF-32 backups locally).

## Verification

Pre-fix predicate count for `abreen@qdgroupinvesco.com` (general user, member-only): 0 projects / 0 submissions.

Post-fix predicate count under the same user (predicate-simulated via `current_org_ids()`):

| Resource | Visible |
|---|---|
| Projects | 7 |
| Form submissions | 15 |
| Permits | 23 |
| Form requirements | 25 |
| Documents | 2 |

Andy confirmed during the meeting: "works correctly now, as desired."

## Out of scope

- UI to manage `project_users` membership (the original "Team tab" feature) — no longer needed for access control. If we ever surface project-role metadata, that's a separate story.
- Multi-org user routing — still BF-33's territory.
- Cleanup pass dropping `project_users` and `get_user_project_ids()` — defer until BF-33 lands and we're confident nothing else depends on them.

## Notes

This decision is logged in `direction-log.md` under 2026-05-04 because it changes the RLS contract. Anyone reading the BF-31 / BF-32 stories should follow the link forward to BF-42 to see the current model.
