# BF-54: Remove test projects, keep the three live Q&D projects

**Type:** Production data cleanup
**Priority:** HIGH (blocks clean first-day use)
**Points:** 1
**Status:** IN PROGRESS
**Sprint:** 4
**Started:** 2026-09-21T18:17:34Z
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-21T18:54:37Z

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

- [x] Exactly three projects remain, the ones Andy named.
- [x] No submissions, photos, documents, permits, requirements, assignments, or QR tokens reference a removed project.
- [x] No Storage objects remain under a removed project's prefix in either bucket.
- [x] The three kept projects and their 18 submissions are untouched (spot-check one submission per project renders and its PDF downloads).
- [x] Before/after counts and the executed SQL are recorded in this ticket.

## Execution record (production, 2026-09-21T18:17Z to 18:19Z, Tim's go)

Precondition: `backups/2026-09-20T192106Z-pre-launch-tweaks/scripts/validate_dump.py` re-run, RESULT: OK. Read-only inventory first; Tim gave the delete go on the exact list below.

**Removed projects and what the cascade took with them**

| Project | id | subs | photos | docs | permits | reqs | assign | QR | Storage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BF 32 Test | 4dff54b4 | 1 | 1 | 0 | 5 | 5 | 1 | 0 | 1 |
| E2E Test Project - Full Verification | 06c0610c | 4 | 0 | 1 | 5 | 5 | 1 | 3 | 1 |
| I-15 Bridge Repair Phase 1 | f0244e03 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| Q&D Parking Lot | 6a92e761 | 6 | 0 | 2 | 3 | 4 | 1 | 9 | 2 |
| South Meadows Mall | 1ef41705 | 7 | 3 | 0 | 5 | 5 | 1 | 3 | 3 |
| US-95 Test Project | 1a5c83b5 | 2 | 0 | 0 | 5 | 5 | 1 | 0 | 0 |
| US-95 Widening Phase 2 | 00000000-…-0001 | 1 | 0 | 0 | 3 | 3 | 0 | 1 | 0 |
| **Total** | | **21** | **4** | **3** | **26** | **27** | **6** | **16** | **7** |

`based_on_id` links from kept projects into any removal target: 0.

**Steps executed**

1. One transaction via Supabase MCP: `DELETE FROM public.projects WHERE id IN (<7 ids>) AND name NOT IN (<3 keep names>) RETURNING id, name` inside `BEGIN … COMMIT`. Returned 7 rows, the seven names above.
2. `Testing/security/bf54_delete_storage_objects.py` (service role, Storage API): dry run listed 4 objects in `form-attachments` and 3 in `project-documents` under the removed prefixes; real run deleted 4 + 3, HTTP 200 each.

**Before and after**

| Table | Before | After | Expected |
| --- | --- | --- | --- |
| projects | 10 | 3 (all Q&D Construction) | 3 |
| form_submissions | 39 | 18 | 18 |
| form_photos | 5 | 1 | 1 |
| project_documents | 14 | 11 | 11 |
| project_permits | 35 | 9 | 9 |
| project_form_requirements | 38 | 11 | 11 |
| project_users | 9 | 3 | 3 |
| qr_tokens | 24 | 8 | 8 |
| storage.objects | 19 | 12 (0 under removed prefixes) | 12 |

Orphan submissions 0, orphan photos 0.

**Spot-check through Tim's signed-in session** (Claude in Chrome): projects list shows exactly 17254 NDOT 4541 7 Bridges, 17446 - Deodar St, 17446 - Microsoft NVE Easement. Latest submission of each renders (NDOT Weekly Stormwater 671de7bb with its photo; Daily Dust Log 017396e9; Daily Dust Log 449bc1e6). `/api/forms/<id>/pdf` returned 200 `application/pdf` with `%PDF-` bytes for all three (1,514,793 / 4,624 / 4,649 bytes).

Note: the earlier BF-59 regression submission on BF 32 Test had already been deleted on 2026-09-21; the "1 submission" on that project was Andy's June NDOT test.

## Verify round 1 (headless, 2026-09-21T18:34:36Z): NEEDS ATTENTION, 8.5

Verify re-checked production read-only (3 projects, 0 child rows referencing removed ids, 18 submissions, 0 Storage objects under removed prefixes via the script's own dry run) and confirmed every acceptance criterion. Two Codex findings on `bf54_delete_storage_objects.py`, both confirmed: (1) any argument other than exactly `--dry-run` fell through to real-delete mode; (2) a failed list was skipped silently and a failed DELETE still printed DONE with exit 0. Fixed the same session: argparse rejects unknown arguments before anything runs, dry run is the default and deletion needs `--execute`, list and delete failures print and exit 1, and a post-delete re-list must be empty. Exercised: default run lists 0 and exits 0; `--dryrun` typo is rejected; `--execute` on the clean state deletes 0 and reports "re-list clean".

## Notes

- Execute against production by hand with the backup in place. Do not build a delete feature for this.
- Run before BF-55: removing test projects first reduces the records that block user deletion.
