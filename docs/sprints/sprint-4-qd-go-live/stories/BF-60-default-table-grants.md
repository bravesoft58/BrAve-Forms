# BF-60: Tighten Supabase default table grants across the public schema

**Type:** Security hardening (database grants) + test hygiene
**Priority:** HIGH (same class as BF-59; RLS does not cover TRUNCATE)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** BF-59 verify rounds 1-6 (out-of-scope findings filed at closeout, 2026-09-21)
**Created:** 2026-09-21
**Last Updated:** 2026-09-21T18:14:36Z

## Problem

BF-59 locked down `profiles`, and only `profiles`. Every other public table still carries Supabase's default grants: `authenticated` and `anon` hold SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on all of them (read from production on 2026-09-20). Row-level security gates SELECT, INSERT, UPDATE and DELETE, but it does not apply to TRUNCATE at all, and REFERENCES and TRIGGER are never something an API role should hold. Today nothing in PostgREST exposes TRUNCATE, so the practical exposure is low, but the grants are wider than the app needs and a future RPC or a policy mistake would inherit the full width.

## Proposed change

1. **Inventory.** Query `information_schema.table_privileges` for `authenticated` and `anon` on every public table; record the before state in this ticket.
2. **anon.** Revoke all write privileges (INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) on every public table. The app's only anonymous path is the inspector portal, which uses the service client. Keep SELECT only where a policy exists for `anon`; today none do.
3. **authenticated.** Revoke TRUNCATE, REFERENCES and TRIGGER everywhere. Keep INSERT, UPDATE, DELETE only on tables that have a matching policy for that command; revoke on the rest (for example `audit_log`, which has no policies for `authenticated`).
4. **Column-level UPDATE** on tables where a user should not change ownership or scope columns, following the BF-59 pattern (revoke table UPDATE, grant back the allowed columns): `form_submissions.submitted_by` and `project_id`, `project_documents.uploaded_by`, `organization_members.role`, `projects.organization_id`. Verify each with the visibility-matrix approach before and after (lesson 2026-04-30: count under impersonation per tier).
5. **Suite hygiene** carried from the BF-59 round-6 review: T10 should also assert no `PUBLIC` grantee holds UPDATE on the locked columns; T12 should assert the exact `WITH CHECK` expression, not just that one exists.
6. One migration, paired rollback, isolated-copy proof first (the BF-59 restore script rebuilds the copy), then production on Tim's go.

## Acceptance criteria

- [ ] Before and after grant inventories recorded here.
- [ ] `anon` holds no write privileges on any public table.
- [ ] `authenticated` holds no TRUNCATE, REFERENCES or TRIGGER on any public table.
- [ ] Ownership and scope columns listed above are not updatable by `authenticated`.
- [ ] Per-tier visibility matrix identical before and after for every table touched.
- [ ] BF-59 suite T10 and T12 tightened as described; still 13 of 13.
- [ ] App regression: sign-in, form submit, photo upload, document upload, invite, role change.

## Notes

- Do not touch `profiles` here; BF-59 owns it.
- `supabase/migrations/20260920194350_profile_role_guard.sql` is the pattern to copy, including the rollback shape.
