# BF-63: Append-only revision history for form submissions

**Type:** Record integrity (database capture; no UI in this story)
**Priority:** HIGH (every in-place edit made before this ships is lost for good)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Tim, 2026-09-25, raised while reviewing BF-58.1's photo-deletion fixes ("should superseded records have some kind of a chain, a history log? Same thing with an overwritten photo."). Routed to a ticket by Tim the same day.
**Created:** 2026-09-25
**Last Updated:** 2026-09-25T16:25:28Z

## Problem

Every edit path overwrites the record in place: `updateNdotStormwater`, `updateNdepStormwater` and (from BF-58.1) `updateWaterways` replace `form_submissions.data`, and the previous version is gone. Nothing records who changed what or when beyond the latest update time.

These are compliance records. EPA stormwater records carry a 3-year retention requirement ([epa-osha-business-requirements.txt](../../../requirements/epa-osha-business-requirements.txt)). The PRD's "Form Versioning and Audit Trail" user stories ask for edit history and a complete audit trail for inspections ([comprehensive_prd.md](../../../requirements/comprehensive_prd.md), Epic 4). The [go-live readiness assessment](../../../release/QD-GO-LIVE-READINESS-2026-09-08.md) lists record integrity as an open gate.

**Photos.** Photos are never overwritten in place: each upload gets a unique timestamped name and uploads use `upsert: false`. "Replacing" a photo is remove + add. Since BF-58.1 Codex round 2, the form paths never delete photo files, so a removed photo's file still exists, but no record points at it any more. Keeping the old `data` (which includes its `photos` list) makes those files findable again. This story therefore depends on the no-delete rule staying in place; any future storage cleanup job must treat photos referenced by a revision as referenced.

## Scope

Capture only. Viewing history in the app is a later story.

1. **Revision table.** A new `form_submission_revisions` table: `id`, `submission_id`, `project_id`, `form_type`, `op` (`UPDATE` or `DELETE`), the full old row (at least `data`, `form_date`, `status`, `submitted_by`, `submitted_at`), `changed_by` (`auth.uid()`, null for service-role writes), `changed_at` (`now()`).
2. **Trigger.** `BEFORE UPDATE OR DELETE` on `form_submissions`, writing the OLD row. It runs in the database, so every present and future edit path is covered, including admin SQL. Skip no-op updates (`OLD IS NOT DISTINCT FROM NEW`) so an unchanged save does not add noise.
3. **Append-only.** RLS on; read access organization-scoped to match `form_submissions` (BF-42 visibility); no INSERT/UPDATE/DELETE policy and no grants to `authenticated` or `anon`, so only the trigger (SECURITY DEFINER, pinned `search_path`) writes and nobody edits or deletes history. Check the table against BF-60's default-grant cleanup.
4. **Cascade decision.** `submission_id` must NOT cascade-delete history when a submission is deleted; the DELETE revision is the record that it existed. Use no FK, or a FK with `ON DELETE SET NULL`, and keep `submission_id` as a plain value.

## Build vs Use

**Build vs Use:** USE or BUILD, decided at /story. Supabase publishes `supa_audit` (generic per-table history via `audit.enable_tracking`, write-up 2022); its maintenance status and availability on this project were not checked (unverified 2026-09-25). A hand-written trigger is about 30 lines and gives control over the columns, `changed_by`, the no-op skip and the RLS read policy. Prefer `supa_audit` only if it is maintained, installable on this Supabase project, and can meet items 2-4. Reopen when a history viewer needs richer querying than one table gives.

## Acceptance criteria

- [ ] Every UPDATE of a `form_submissions` row that changes it writes exactly one revision holding the previous version, with `changed_by` and `changed_at`. A no-op update writes none.
- [ ] Every DELETE writes one revision holding the deleted row, and the revision survives the delete.
- [ ] Probe as an ordinary member, an org admin and an outsider (rolled back, P0999 pattern): members and admins can read revisions for their organization's projects only; nobody can INSERT, UPDATE or DELETE a revision directly.
- [ ] Editing a submission through the app (one NDOT, NDEP or Working in Waterways edit on a preview) leaves a readable prior version, including its photo list, whose files still exist in Storage.
- [ ] Migration with rollback pair, rehearsed rolled back before applying, with Tim's go.

## Relationships

- **BF-61** (optimistic concurrency) is complementary: BF-61 stops two edits silently overwriting each other; this story makes any overwrite recoverable.
- **BF-58.1** introduced the no-delete photo rule this story relies on, and another edit path.
- **Follow-up, not in scope:** a history view for users and inspectors; a reference-aware Storage cleanup job (must count photos referenced by revisions).
