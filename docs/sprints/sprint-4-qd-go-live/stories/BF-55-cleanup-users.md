# BF-55: Remove or deactivate test users

**Type:** Production data cleanup
**Priority:** HIGH (blocks clean first-day use)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-20T19:30:55Z

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
| claude.test@braveforms.dev | admin | member | Q&D | test account, remove |
| timsaverill@protonmail.com | admin | super_admin | platform | KEEP (Tim, "any you need for testing/fixing") |
| adminbreen@pleniumbuilders.com | admin | member | Plenium Builders | not Q&D's decision, KEEP |
| itadmin@pleniumbuilders.com | admin | member | Plenium Builders | not Q&D's decision, KEEP |
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

## Acceptance criteria

- [ ] Andy confirms the disposition of drich@qdconstruction.com and abreen@qdgroupinvesco.com.
- [ ] Removed accounts cannot sign in (deleted, or banned with the reason recorded).
- [ ] Kept accounts sign in and see their projects.
- [ ] No orphaned membership or assignment rows; auth user count equals profile count.
- [ ] Before/after user lists and the executed operations are recorded in this ticket.

## Notes

- Execute against production by hand with the backup in place.
- This ticket does not fix the role self-promotion flaw or the user-management authorization gap from the readiness assessment. Those remain separate.
