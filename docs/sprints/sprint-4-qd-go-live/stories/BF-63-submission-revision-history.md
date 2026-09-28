# BF-63: Append-only revision history for form submissions

**Type:** Record integrity (database capture; no UI in this story)
**Priority:** HIGH (every in-place edit made before this ships is lost for good)
**Points:** 2
**Status:** IN PROGRESS
**Sprint:** 4
**Reported by:** Tim, 2026-09-25, raised while reviewing BF-58.1's photo-deletion fixes ("should superseded records have some kind of a chain, a history log? Same thing with an overwritten photo."). Routed to a ticket by Tim the same day.
**Created:** 2026-09-25
**Last Updated:** 2026-09-28T13:25:53Z

## Problem

Every edit path overwrites the record in place: `updateNdotStormwater`, `updateNdepStormwater`, (from BF-58.1) `updateWaterways`, and the dust log's `appendDustLogEntries` replace `form_submissions.data`, and the previous version is gone. Nothing records who changed what or when beyond the latest update time.

These are compliance records. EPA stormwater records carry a 3-year retention requirement ([epa-osha-business-requirements.txt](../../../requirements/epa-osha-business-requirements.txt)). The PRD's "Form Versioning and Audit Trail" user stories ask for edit history and a complete audit trail for inspections ([comprehensive_prd.md](../../../requirements/comprehensive_prd.md), Epic 4). The [go-live readiness assessment](../../../release/QD-GO-LIVE-READINESS-2026-09-08.md) lists record integrity as an open gate.

**Photos.** Photos are never overwritten in place: each upload gets a unique timestamped name and uploads use `upsert: false`. "Replacing" a photo is remove + add. Since BF-58.1 Codex round 2, the form paths never delete photo files, so a removed photo's file still exists, but no record points at it any more. Keeping the old `data` (which includes its `photos` list) makes those files findable again. This story therefore depends on the no-delete rule staying in place; any future storage cleanup job must treat photos referenced by a revision as referenced.

## Scope

Capture only. Viewing history in the app is a later story.

1. **Revision table.** A new `form_submission_revisions` table: `id`, `submission_id`, `project_id`, `form_type`, `op` (`UPDATE` or `DELETE`), the whole old row as `old_row jsonb`, `changed_by` (`auth.uid()`, null outside a signed-in request), `changed_role` (the request's JWT role, null for direct SQL), `changed_at` (`now()`). (Revised at /story from "at least these columns" to the whole row, so columns BF-61 and BF-65 add are captured.)
2. **Trigger.** `AFTER UPDATE OR DELETE` on `form_submissions`, writing the OLD row. It runs in the database, so every present and future edit path is covered, including admin SQL. Skip no-op updates by comparing the rows without `updated_at`, which `form_submissions_updated_at` changes on every save. (Revised at /story from BEFORE with a plain `OLD IS NOT DISTINCT FROM NEW`, which would never match; see the Technical Approach.)
3. **Append-only.** RLS on; read access organization-scoped to match `form_submissions` (BF-42 visibility); no INSERT/UPDATE/DELETE policy; grants leave `anon` nothing and `authenticated` and `service_role` SELECT only (Supabase's default privileges would give all three full DML), so only the trigger (SECURITY DEFINER, pinned `search_path`) writes and nobody edits or deletes history. BF-60's default-grant cleanup should find nothing to change here.
4. **Cascade decision.** `submission_id` must NOT cascade-delete history when a submission is deleted; the DELETE revision is the record that it existed. Use no FK, or a FK with `ON DELETE SET NULL`, and keep `submission_id` as a plain value.

## Build vs Use

**Decided at /story: COPY** (see the Technical Approach: `supa_audit` is archived and not offered on this project). Original note: Supabase publishes `supa_audit` (generic per-table history via `audit.enable_tracking`, write-up 2022); its maintenance status and availability on this project were not checked (unverified 2026-09-25). A hand-written trigger is about 30 lines and gives control over the columns, `changed_by`, the no-op skip and the RLS read policy. Prefer `supa_audit` only if it is maintained, installable on this Supabase project, and can meet items 2-4. Reopen when a history viewer needs richer querying than one table gives.

## Acceptance criteria

- [x] Every UPDATE of a `form_submissions` row that changes it writes exactly one revision holding the previous version, with `changed_by` and `changed_at`. A no-op update writes none.
- [x] Every DELETE writes one revision holding the deleted row, and the revision survives the delete.
- [x] Probe as an ordinary member, an org admin and an outsider (rolled back, P0999 pattern): members and admins can read revisions for their organization's projects only; nobody can INSERT, UPDATE or DELETE a revision directly.
- [ ] Editing a submission through the app (one NDOT, NDEP or Working in Waterways edit on a preview) leaves a readable prior version, including its photo list, whose files still exist in Storage.
- [x] Migration with rollback pair, rehearsed rolled back before applying, with Tim's go.

## Relationships

- **BF-61** (optimistic concurrency) is complementary: BF-61 stops two edits silently overwriting each other; this story makes any overwrite recoverable.
- **BF-58.1** introduced the no-delete photo rule this story relies on, and another edit path.
- **Follow-up, not in scope:** a history view for users and inspectors; a reference-aware Storage cleanup job (must count photos referenced by revisions).

## Technical Approach

Scouted 2026-09-28T12:41:36Z. Database-only story: one migration, its rollback, and a rolled-back SQL probe. No app code changes.

**Build vs Use:** COPY. The pattern comes from Supabase's "Postgres Auditing in 150 lines of SQL" (jsonb snapshot of the old row, SECURITY DEFINER trigger), with the extension's later fixes applied: AFTER triggers and an explicit search path. `supa_audit` itself is out: the repo was archived 2025-02-16 (last commit 2024-01-02), and it is not in this project's available-extension list [verified 2026-09-28]. Reopen when Supabase ships a maintained, installable per-table history extension, or when a history viewer needs cross-table querying.

**Design decisions (corrections to the Scope section are listed under "Story corrections" below):**

1. **Table** `public.form_submission_revisions`:
   - `id bigint generated always as identity primary key`
   - `submission_id uuid not null`, with no FK, so history survives the delete
   - `project_id uuid not null`, `form_type text not null`, copied from the old row
   - `op text not null check (op in ('UPDATE','DELETE'))`
   - `old_row jsonb not null`: the whole old row as `to_jsonb(OLD)`, so columns BF-61 and BF-65 add later are captured with no change here
   - `changed_by uuid` (`auth.uid()`, null outside a signed-in request)
   - `changed_role text`: the request's JWT role, `current_setting('request.jwt.claims', true)::jsonb->>'role'`; null means direct SQL
   - `changed_at timestamptz not null default now()`
   - Index `(submission_id, changed_at)`.
2. **Trigger:** `AFTER UPDATE OR DELETE ... FOR EACH ROW` rather than BEFORE. An AFTER trigger only sees rows that were actually written, and it sees the final NEW row after `form_submissions_updated_at` has run. `supa_audit` made the same switch in 0.3.0.
3. **No-op skip:** `(to_jsonb(OLD) - 'updated_at') IS NOT DISTINCT FROM (to_jsonb(NEW) - 'updated_at')` returns early. Comparing the full rows would never match, because `update_updated_at()` changes `updated_at` on every UPDATE, and the dust-log append also sets it from the app.
4. **Function:** `public.record_form_submission_revision()`, `SECURITY DEFINER SET search_path = ''`, every name schema-qualified. `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`, following the repo's BF-56 function pattern and Supabase's function-privileges guidance.
5. **Grants, the append-only guarantee:**
   - Supabase's default privileges give `anon`, `authenticated` and `service_role` SELECT, INSERT, UPDATE and DELETE on every new `public` table.
   - So: `REVOKE ALL ... FROM anon, authenticated, service_role`, then `GRANT SELECT TO authenticated` and `GRANT SELECT, INSERT TO service_role`.
   - Revoking from `service_role` too means the service key (inspector portal, scripts) cannot edit or delete history.
   - The table owner and superuser can still write to it. That is accepted and stated, not hidden.
6. **RLS:** enabled, with one SELECT policy that copies `submissions_select` from BF-42: `is_super_admin()` OR `project_id` in the caller's organizations' projects. There is no INSERT, UPDATE or DELETE policy.
   - Known consequence: when a whole project is deleted, it cascades to its submissions, so the DELETE revisions are written. They then stay readable only to super admins, because the project row no longer exists. Accepted: that is the audit trail of the deletion.
7. **Photos:** `data.photos` (file_name, caption, uploaded_at) lives in `data`, so `old_row` keeps the old photo list. The `form_photos` rows are a derived copy that the NDOT and Waterways edits delete and re-insert, so they need no separate history.

**Blast radius:** `form_submissions` gains one trigger. Every write path is affected: 4 UPDATE paths (the NDOT, NDEP and Waterways edits, and the dust-log append) plus any cascade DELETE from a project. Overhead is one INSERT per changed row, negligible at this volume. The code graph was not run: no app symbols change.

**Story corrections (for /story, not applied here):**
- The Problem section names 3 edit paths. There are 4: `appendDustLogEntries` also UPDATEs `form_submissions` and sets `updated_at` itself.
- Scope item 2 says BEFORE with `OLD IS NOT DISTINCT FROM NEW`. Use AFTER and exclude `updated_at` from the comparison (decisions 2 and 3); the literal version would record every save.
- Scope item 1 lists individual columns. Store `old_row jsonb` plus the extracted `project_id` and `form_type` (decision 1).
- Scope item 3 names only `authenticated` and `anon`. `service_role` must lose UPDATE, DELETE and TRUNCATE as well (decision 5).
- The AC 3 probe should include a `service_role` attempt to UPDATE or DELETE a revision, rolled back. It should also change the row for real in the UPDATE case, not with a same-value write (lesson 2026-09-20).

**Forward conflicts:**
- BF-65 (adds `form_submissions.client_key`) and BF-61 (may add a version column): benign, because `old_row` captures new columns automatically. BF-65 notes that duplicates would show as separate records; that holds in either order.
- BF-60 (default-grant cleanup): this table sets its own grants explicitly, so BF-60 should find nothing to change here. List it in BF-60's before/after matrix.
- No story creates the same table or function.

## Research Sources

- firecrawl_scrape https://github.com/supabase/supa_audit: archived 2025-02-16, read-only; last commit 2024-01-02; 672 stars; Apache-2.0; commit "transition before triggers to after. explicit search path" (0.3.0). [verified 2026-09-28]
- Supabase MCP `list_extensions` on ytsghlfjgdhczfbggpdl: `supa_audit` not offered; `pgaudit` 1.7 offered, but it writes to server logs, not table history. [verified 2026-09-28]
- firecrawl_scrape https://supabase.com/blog/postgres-audit: jsonb `old_record` snapshot, SECURITY DEFINER trigger function, `to_jsonb(old)`; overhead negligible under 1000 writes/s (2022-03-08 post).
- firecrawl_search "supabase supa_audit extension maintained" -> https://pganalyze.com/blog/5mins-postgres-auditing-pgaudit-supabase-supa-audit: trigger tables record history in the database; pgAudit writes to log files.
- Supabase MCP `search_docs` "Securing your API" (https://supabase.com/docs/guides/api/securing-your-api): new public tables get default grants to `anon`, `authenticated` and `service_role`; the documented opt-out revokes them. [verified 2026-09-28]
- firecrawl_search -> https://supabase.com/docs/guides/database/functions: `security definer set search_path = ''`; revoke execute from public and anon.
- firecrawl_search -> https://github.com/2ndQuadrant/audit-trigger and https://github.com/m-martinez/pg-audit-json: generic trigger-based alternatives. Heavier than one purpose-built table and not needed here.
- firecrawl_search -> https://viprasol.com/blog/postgres-triggers-audit/ and https://oneuptime.com/blog/post/2026-01-30-postgresql-triggers-audit/view: `IS DISTINCT FROM` over jsonb to skip no-op updates.
- /story spot-check, firecrawl_scrape https://www.postgresql.org/docs/15/trigger-definition.html: same-event triggers fire in alphabetical order by name; "an AFTER trigger can be certain it is seeing the final value of the row". [verified 2026-09-28]

## Implementation (2026-09-28T13:25:53Z)

Files (branch `feature/BF-63-submission-revision-history`):

| File | Lines | What |
| --- | --- | --- |
| `supabase/migrations/20260928132447_form_submission_revisions.sql` | 99 | Table, indexes, trigger function, trigger, grants, RLS read policy |
| `supabase/migrations/_rollback/20260928132447_rollback.sql` | 11 | Drops trigger, function, table (destructive: export first) |
| `Testing/security/bf63_revisions_probe.sql` | 224 | 17-check probe, one DO block ending in P0999 so everything rolls back |
| `Testing/security/bf63_rehearsal.py` | 33 | Splices the migration into the probe at `@@MIGRATION@@` for the pre-apply rehearsal |

No app code changes. Decisions made at /story beyond the scout's:
- `service_role` gets SELECT only, not SELECT + INSERT: the trigger writes as the function owner, so no role needs INSERT.
- `changed_role` reads `request.jwt.claims` through `nullif(..., '')`: outside a request the setting can be an empty string, and `''::jsonb` would raise, failing every admin-SQL edit.
- The existing `public.audit_log` was considered and not reused: it records super-admin cross-org access and only super admins may read it; this history must be readable by the organization's own members.
- The probe's no-op test inserts its row with `updated_at` a day old and asserts the timestamp moved, because inside one transaction `now()` is constant and the updated_at trigger would otherwise leave it unchanged, making the test vacuous (lesson 2026-09-20).

## Comprehensive Validation (2026-09-28T13:25:53Z)

**Rehearsal** (migration spliced into the probe, one rolled-back block against production, Tim's go): 17/17 PASS, 0 failures. Afterwards `form_submission_revisions` did not exist and `form_submissions` still had 30 rows.

**Applied** to production with Tim's go via `apply_migration`; recorded version `20260928132447` (repo files renamed to match).

**Post-apply probe** (same probe, no splice, rolled back): 17/17 PASS, 0 failures. Afterwards `form_submission_revisions` 0 rows, `form_submissions` 30 rows.

| # | Check | Result |
| --- | --- | --- |
| T1 | Grants: anon none; authenticated and service_role SELECT only (no INSERT/UPDATE/DELETE/TRUNCATE) | PASS |
| T2 | Trigger function SECURITY DEFINER, not executable by anon or authenticated | PASS |
| T3 | An INSERT writes no revision | PASS |
| T4 | A save that only moves updated_at writes none (updated_at did change) | PASS |
| T5 | Direct-SQL edit: one revision, previous data and photo list, no user or role | PASS |
| T6 | Member edit: previous data, changed_by member, role authenticated | PASS |
| T7 | Member reads org revisions, including one they did not make | PASS |
| T8-T11 | Member INSERT, UPDATE, DELETE, TRUNCATE on revisions refused (42501) | PASS |
| T12 | Org admin edit of a member's submission: previous data, changed_by admin | PASS |
| T13 | Org admin DELETE of revisions refused (42501) | PASS |
| T14 | Outsider sees no revisions | PASS |
| T15 | Service-key edit: previous data, no user, role service_role | PASS |
| T16 | Service key UPDATE, DELETE, INSERT on revisions refused (42501 x3) | PASS |
| T17 | Chain survives the delete, in order: UPDATE:A, UPDATE:B, UPDATE:C, DELETE:D | PASS |

**Security advisor** after apply: no finding names `form_submission_revisions` or `record_form_submission_revision`; every listed warning predates this story.

**Open:** AC 4 (an edit through the app on a preview, prior version and photo files readable) is not yet run.
