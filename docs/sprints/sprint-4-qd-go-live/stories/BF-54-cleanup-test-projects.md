# BF-54: Remove test projects, keep the three live Q&D projects

**Type:** Production data cleanup
**Priority:** HIGH (blocks clean first-day use)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-20T19:30:55Z

## Request (verbatim)

> Clean up test projects. Keep 17254 NDOT 4541 7 Bridges, 17446 Deodar St & 17446 Microsoft NVE Easement. All other projects can be removed.

## Current state (live database, read 2026-09-20)

All 10 projects belong to the Q&D Construction organization. Plenium Builders has none.

| Project | Submissions | Disposition |
| --- | --- | --- |
| 17254 NDOT 4541 7 Bridges | 9 | KEEP |
| 17446 - Deodar St | 3 | KEEP |
| 17446 - Microsoft NVE Easement | 6 | KEEP |
| BF 32 Test | 1 | remove |
| E2E Test Project - Full Verification | 4 | remove |
| I-15 Bridge Repair Phase 1 | 0 | remove |
| Q&D Parking Lot | 6 | remove |
| South Meadows Mall | 7 | remove |
| US-95 Test Project | 2 | remove |
| US-95 Widening Phase 2 | 1 | remove |

Seven projects to remove, carrying 21 form submissions between them plus their photos, documents, permits, form requirements, user assignments, and QR tokens.

## What deletion actually does

- **Database cascade is complete.** Every child table that references `projects` is `ON DELETE CASCADE`: `form_submissions` (and through it `form_photos`), `project_documents`, `project_form_requirements`, `project_permits`, `project_users`, `qr_tokens`. Deleting the seven project rows removes all dependent rows.
- **Storage is NOT cascaded.** Objects under `form-attachments/projects/<id>/...` and `project-documents/projects/<id>/...` stay in the buckets after the rows are gone. They must be deleted explicitly, by project id prefix, in both buckets.
- **One blocker to check first.** `form_submissions.based_on_id` (the "Use Previous" link) is `ON DELETE NO ACTION`. If a submission in a KEEP project was based on a submission in a remove project, the delete fails. Query for cross-project `based_on_id` links before running.
- **No delete-project UI or server action exists.** `createProject`, `updateProject`, and `generateQrToken` are the only project actions. This is a one-time SQL operation, not a feature.

## Procedure

1. Confirm the pre-change backup exists and validates (`backups/2026-09-20T192106Z-pre-launch-tweaks/`, `scripts/validate_dump.py` RESULT: OK).
2. Resolve the seven project ids by exact name and record them in this ticket.
3. Check `based_on_id` cross-links from keep projects into remove projects. If any exist, null the link on the kept submission first.
4. Inventory Storage objects under both buckets with each remove-project id prefix. Record the count.
5. In one transaction: delete the seven `projects` rows. Confirm cascade counts match the inventory.
6. Delete the inventoried Storage objects. Confirm `storage.objects` has no rows with a remove-project prefix.
7. Verify: 3 projects remain, all under Q&D Construction; form submission count equals 9 + 3 + 6 = 18; no orphaned `storage.objects`.

## Acceptance criteria

- [ ] Exactly three projects remain, the ones Andy named.
- [ ] No submissions, photos, documents, permits, requirements, assignments, or QR tokens reference a removed project.
- [ ] No Storage objects remain under a removed project's prefix in either bucket.
- [ ] The three kept projects and their 18 submissions are untouched (spot-check one submission per project renders and its PDF downloads).
- [ ] Before/after counts and the executed SQL are recorded in this ticket.

## Notes

- Execute against production by hand with the backup in place. Do not build a delete feature for this.
- Run before BF-55: removing test projects first reduces the records that block user deletion.
