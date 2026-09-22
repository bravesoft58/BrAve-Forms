# BF-55: Remove or deactivate test users

**Type:** Production data cleanup
**Priority:** HIGH (blocks clean first-day use)
**Points:** 1
**Status:** IN PROGRESS
**Sprint:** 4
**Started:** 2026-09-22T12:42:17Z
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-22T12:42:17Z

## Request (verbatim)

> Cleanup users. Keep Gracie & abreen@qdconstruction.com (and any you need for testing/fixing).

## Current state (live database, read 2026-09-20)

9 auth users, 8 profiles. Roles are the legacy global `profiles.role` plus `platform_role`.

| Email | role | platform_role | Organization | Disposition |
| --- | --- | --- | --- | --- |
| gdamele@qdconstruction.com (Gracie) | admin | member | Q&D | KEEP |
| abreen@qdconstruction.com | admin | member | Q&D | KEEP |
| abreen@qdgroupinvesco.com | user | member | Q&D | Andy sent the email from this address but did not list it. CONFIRM with Andy. |
| drich@qdconstruction.com | user | member | Q&D | Not on the keep list. CONFIRM with Andy. |
| claude.test@braveforms.dev | admin | member | Q&D | test account; KEEP for now (Tim, 2026-09-22), remove at the end of the go-live work |
| timsaverill@protonmail.com | admin | super_admin | platform | KEEP (Tim, "any you need for testing/fixing") |
| adminbreen@pleniumbuilders.com | admin | member | Plenium Builders (owner) | REMOVED 2026-09-22 (Tim's call; Plenium was the multi-tenant test org) |
| itadmin@pleniumbuilders.com | admin | member | Q&D (admin; no Plenium membership) | REMOVED 2026-09-22 (Tim's call) |
| tim@me.com | (no profile) | (no profile) | none | orphaned auth user from 2025-04-15, never used, remove |

## What deletion actually does

- Deleting an `auth.users` row cascades to `profiles`, then to `organization_members` and `project_users` (both `ON DELETE CASCADE` on the user id).
- Deletion is **blocked** by `ON DELETE NO ACTION` on: `form_submissions.submitted_by`, `project_documents.uploaded_by`, `projects.created_by`, `project_users.assigned_by`, and `qr_tokens.created_by`. Any user who created a project, submitted a form, uploaded a document, assigned a user, or generated a QR token cannot be deleted while those rows exist.
- The existing `deleteUser` server action in the user-management page uses the service client and will hit the same constraint. The readiness assessment also flagged that this action lacks target-organization authorization; do not rely on it for this cleanup.

## Procedure

1. Run after BF-54 so the test projects' records are gone.
2. For each user to remove, count referencing rows in the five NO ACTION columns above.
   - Zero references: delete the auth user (cascade handles profile and memberships).
   - References in KEEP projects (for example claude.test submissions on a kept project): do not delete. Either reassign `submitted_by` to a kept admin and record the reassignment in `audit_log`, or ban the account in Supabase Auth (blocks sign-in, preserves history). Prefer ban unless Andy wants the test records gone too.
3. Delete the orphaned `tim@me.com` auth user (no profile, no references).
4. Verify: remaining users are exactly the keep list, no `organization_members` rows point at a missing profile, no `project_users` rows point at a missing user.

## Execution record, part 1: Plenium accounts and organization (production, 2026-09-22T12:42:17Z, Tim's call)

Tim's direction 2026-09-22: delete the Plenium accounts, keep claude.test@braveforms.dev for now, move on. The Plenium Builders organization (created 2026-06-08 by adminbreen@, zero projects, one member) was the multi-tenant test tenant; Tim chose to remove the empty organization with its users.

Read-only inventory first. Neither account referenced anything guarded by a NO ACTION foreign key: 0 submissions, 0 documents, 0 projects created, 0 assignments made, 0 QR tokens, 0 invitations, 0 audit rows, 0 active sessions. adminbreen@ was the Plenium owner and the org's `created_by` (SET NULL rule). itadmin@ (created 2026-03-25, last sign-in 2026-05-04) held only a Q&D admin membership and no Plenium membership at all.

One transaction via Supabase MCP:

```sql
BEGIN;
DELETE FROM public.organizations WHERE id = '1ad8fb0a-7a38-419b-818d-acd0aad7df93' AND name = 'Plenium Builders';
DELETE FROM auth.users WHERE id IN ('24bebac3-2ffd-476d-996b-1dbbcc50831a','a49588e7-f8ac-4bb3-8c91-a33168935f5b') AND email ILIKE '%pleniumbuilders.com';
COMMIT;
```

| Table | Before | After | Expected |
| --- | --- | --- | --- |
| organizations | 2 | 1 (Q&D Construction) | 1 |
| auth.users | 9 | 7 | 7 |
| profiles | 8 | 6 | 6 |
| organization_members | 8 | 6 | 6 |

Rows matching `pleniumbuilders` or `plenium` in auth.users, profiles, organizations: 0. Orphan check: members without profile 0, members without org 0, project_users without profile 0, profiles without auth user 0, projects without org 0, auth users without profile 1 (the known tim@me.com orphan, still pending).

**Still open:** drich@qdconstruction.com and abreen@qdgroupinvesco.com (Andy), tim@me.com orphan (uncontested, not yet run), claude.test@braveforms.dev (kept until the go-live work is done).

## Acceptance criteria

- [ ] Andy confirms the disposition of drich@qdconstruction.com and abreen@qdgroupinvesco.com.
- [ ] Removed accounts cannot sign in (deleted, or banned with the reason recorded).
- [ ] Kept accounts sign in and see their projects.
- [ ] No orphaned membership or assignment rows; auth user count equals profile count.
- [ ] Before/after user lists and the executed operations are recorded in this ticket.

## Notes

- Execute against production by hand with the backup in place.
- This ticket does not fix the role self-promotion flaw or the user-management authorization gap from the readiness assessment. Those remain separate.
