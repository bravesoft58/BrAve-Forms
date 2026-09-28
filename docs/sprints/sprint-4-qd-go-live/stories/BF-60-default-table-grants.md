# BF-60: Tighten Supabase default table grants across the public schema

**Type:** Security hardening (database grants) + test hygiene
**Priority:** HIGH (same class as BF-59; RLS does not cover TRUNCATE)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** BF-59 verify rounds 1-6 (out-of-scope findings filed at closeout, 2026-09-21)
**Created:** 2026-09-21
**Last Updated:** 2026-09-28T19:22:24Z

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

## Technical Approach

Scouted 2026-09-28T19:22:24Z against production (`ytsghlfjgdhczfbggpdl`, Postgres 15.8, read-only catalog queries) at master 902d8eb.

**Build vs Use:** COPY — the BF-59 migration (`20260920194350_profile_role_guard.sql`) and Supabase's documented column-level-security and default-privilege recipes. This is SQL-only. No library applies, and the Supabase Security Advisor has no lint for TRUNCATE, REFERENCES or TRIGGER grants.

### Before-state inventory (production, 2026-09-28)

- `anon` and `authenticated` both hold `arwdDxt` (all seven privileges) on 12 tables: `audit_log`, `form_photos`, `form_submissions`, `organization_invitations`, `organization_members`, `organizations`, `project_documents`, `project_form_requirements`, `project_permits`, `project_users`, `projects`, `qr_tokens`.
- Already tight, leave alone: `profiles` (BF-59), `inspector_sessions` (no grants, service client only), `form_submission_revisions` (authenticated SELECT only).
- **No policy anywhere targets `anon`.** Every policy is `TO authenticated`, so revoking all anon privileges on the 12 tables removes nothing the app uses. Anonymous inspector access goes through the service client.
- No `PUBLIC` table grants and no public sequences.

### The story missed a root cause: default privileges

`pg_default_acl` still grants `arwdDxt` on every **future** table (and EXECUTE on every future function, `rwU` on sequences) to `anon` and `authenticated`. It does so for objects created by both `postgres` and `supabase_admin`. Without a fix, the next migration re-opens the hole. BF-56 and BF-63 only avoided it because their migrations revoked by hand.

- Add `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES / SEQUENCES / FUNCTIONS FROM anon, authenticated` (and `REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`). This is Supabase's own recipe.
- **Supabase will do much of this for us on 2026-10-30.** Its "tables not exposed automatically" change is applied to all existing projects that day, and **also drops `service_role` from the defaults** [verified 2026-09-28, GitHub discussion #45329]. Existing tables keep their grants. Consequence for every later migration: a new table needs an explicit `GRANT ... TO service_role` (and to `authenticated` where the app needs it), or the service client (inspector portal, user admin) gets 42501. Decide here whether BF-60 also revokes `service_role` defaults now, so the change lands on our schedule instead of theirs. Recommended: yes, plus a migration-header comment on the explicit-grant convention.
- The `supabase_admin` default ACL cannot be changed by `postgres` (not a member). It only applies to objects `supabase_admin` creates; our migrations run as `postgres`. Record it as known, not fixable.

### Per-table grant plan, derived from policies plus actual app writes

| Table | authenticated keeps | Revoke from authenticated | Why |
|---|---|---|---|
| all 12 | — | TRUNCATE, REFERENCES, TRIGGER | RLS does not govern TRUNCATE/REFERENCES (PG 15 docs) |
| `audit_log` | SELECT | INSERT, UPDATE, DELETE | Only a SELECT policy exists |
| `form_submissions` | SELECT, INSERT, UPDATE (columns only) | DELETE, table-level UPDATE | No DELETE policy. App UPDATE patches set only `data`, `form_date` (`submission-writes.ts`, dust-log append). Grant back `UPDATE (data, form_date, status, signatures)`; lock `id, project_id, form_type, submitted_by, submitted_at, created_at, client_key, based_on_id`. |
| `form_photos` | SELECT, INSERT, DELETE | UPDATE | No UPDATE policy; the app deletes and reinserts photo rows |
| `project_documents` | SELECT, INSERT, DELETE | UPDATE | No UPDATE policy, and the app never updates. The story's `uploaded_by` column lock becomes a full UPDATE revoke. |
| `projects` | SELECT, INSERT, DELETE, UPDATE (columns only) | table-level UPDATE | Grant back exactly the `buildProjectFields` columns plus `status`; lock `id, organization_id, created_by, created_at, qr_token, company_name`. /story confirms the final list against `buildProjectFields`, including `waterway_sites`. |
| `organization_members` | SELECT, INSERT, DELETE | UPDATE (all) | Every column is ownership or scope. The app writes this table only through the **service client** (`users/actions.ts` `syncOrgMemberRole`), so authenticated UPDATE is unused. |
| `qr_tokens` | SELECT, INSERT, UPDATE (revoked_at, expires_at) | table-level UPDATE | **Trap:** `reissue_inspector_qr` is SECURITY **INVOKER** and runs `UPDATE qr_tokens SET revoked_at, expires_at` as authenticated. A full UPDATE revoke breaks QR reissue. |
| `organizations`, `organization_invitations`, `project_permits`, `project_form_requirements`, `project_users` | SELECT, INSERT, UPDATE, DELETE | — | Policies exist for each command (org or super admin). Optional: column-lock scope keys (`org_id`, `project_id`, `user_id`) if the budget allows. |

- Column privileges add to table privileges: `REVOKE UPDATE ON TABLE`, then `GRANT UPDATE (cols)`, as in BF-59.
- Trigger-set columns (`updated_at`, BF-63 revisions) are not privilege-checked, so the triggers keep working.
- `.update().eq("updated_at", v).select("id")` needs SELECT on the filter columns only, which stays.

### Fold-in (recommended): bind the submitter on insert

- `submissions_insert` WITH CHECK does not require `submitted_by = auth.uid()`, so a direct REST call can file a submission under another user (BF-65 scout).
- Every create action already sets `submitted_by: user.id`.
- Add `AND submitted_by = (SELECT auth.uid())` to the policy, and apply the same to `project_documents_insert` (`uploaded_by: user.id` is always set in `document-actions.ts`).
- Drop and recreate each policy (no `CREATE POLICY IF NOT EXISTS`). The rollback restores the exact old expressions.

### Optional in-scope-adjacent (advisor WARN)

- `handle_new_user()` is SECURITY DEFINER, has no `search_path`, and anon and authenticated can call it through `/rest/v1/rpc/handle_new_user`.
- Revoke EXECUTE from PUBLIC, anon and authenticated, and set `search_path = public`.
- The `auth.users` trigger still fires: EXECUTE is checked at CREATE TRIGGER time, not when the trigger fires.

### Proof method

- Use the BF-63/BF-65 pattern: a **rolled-back rehearsal in production** (DDL is transactional; a DO block ending in a P0999 marker), not the Docker isolated copy the story names.
- The probe runs before and after.
- Extend `Testing/security/bf59_visibility_matrix.sql` into a per-tier count for **every** touched table (member, org admin, super admin). The counts must be identical before and after.
- Negative probes under `SET LOCAL ROLE authenticated`:
  - TRUNCATE denied.
  - UPDATE of `form_submissions.submitted_by` and `projects.organization_id` denied (42501).
  - Normal `data` update still works.
  - `reissue_inspector_qr` still works for an org admin.
  - Insert with a foreign `submitted_by` refused.
  - Anon holds zero privileges.
  - `pg_default_acl` for postgres/public no longer names anon or authenticated.
- T10 and T12 tightening per Proposed change 5.

### Story corrections for /story (outside scout's write surface)

1. **Points 2 → 3.** Default privileges, the qr_tokens trap, the submitter-binding fold-in and an all-table matrix exceed the original scope. The migration SQL itself does not count against the budget.
2. AC 4: `project_documents.uploaded_by` becomes "no UPDATE on project_documents". Add `qr_tokens` project/token columns.
3. Add ACs:
   - Default privileges no longer grant to anon/authenticated.
   - Insert with a foreign `submitted_by` / `uploaded_by` is refused.
   - QR reissue still works.
4. Proposed change 6: "isolated-copy proof" becomes a rolled-back production rehearsal (the repo has used this since BF-63).
5. AC 7 regression: add QR reissue and project edit.

### Forward-conflict check

- No CREATE/CREATE collisions.
- **Sequence matters, BF-34 (NOT STARTED):** it reworks user-management actions. If it moves `organization_members` role writes from the service client to the user-scoped client, it must deliberately grant `UPDATE (role)` back after BF-60.
- BF-35 owns `profiles`; untouched here.
- BF-69 touches `submission-writes.ts` (app code only); no overlap with grants.

## Research Sources

- firecrawl_search "Supabase default privileges anon authenticated public schema new tables change 2025 OR 2026" -> https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically -> new projects stop auto-granting from 2026-05-30; opt-in SQL for existing projects is `alter default privileges for role postgres in schema public revoke ...`.
- same search -> https://github.com/orgs/supabase/discussions/45329 -> the setting is applied to **all existing projects on 2026-10-30**; `auto_expose_new_tables` is removed that day; revokes cover `service_role` too.
- firecrawl_scrape https://github.com/orgs/supabase/discussions/45329 (maxAge 0) -> existing tables keep their current grants on 2026-10-30; only future objects are affected. [verified 2026-09-28]
- supabase search_docs "revoke default privileges anon authenticated truncate public schema" -> Supabase securing-your-API guide: the four-statement default-privilege revoke, including `revoke execute on functions from public`; `supabase db diff` emits REFERENCES/TRIGGER/TRUNCATE grants because they are default.
- firecrawl_scrape https://www.postgresql.org/docs/15/ddl-rowsecurity.html (Postgres 15 docs, matches prod 15.8) -> "Operations that apply to the whole table, such as TRUNCATE and REFERENCES, are not subject to row security"; a policy without WITH CHECK reuses USING for new rows.
- firecrawl_search "PostgREST column-level privileges UPDATE ..." -> https://supabase.com/docs/guides/database/postgres/column-level-security -> revoke table UPDATE, then grant UPDATE (cols); a column revoke is a no-op while the table grant exists.
- same search -> https://supabase.com/docs/guides/troubleshooting/database-api-42501-errors -> a missing table privilege surfaces as 42501 through the Data API (the failure mode to probe for).
- get_advisors security (2026-09-28T19:21Z) -> `handle_new_user` anon-executable SECURITY DEFINER; five functions with mutable search_path; the Postgres 15.8.1.070 patch available (out of scope, note for the readiness gates).
