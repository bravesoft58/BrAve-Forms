# BF-61: Optimistic concurrency on submission edits

> **BUNDLED INTO [BF-65](BF-65-submission-idempotency.md), 2026-09-28T17:29:54Z (Tim: "bundle it if it makes sense").** Built, verified and closed out as part of BF-65 (branch `feature/BF-65-record-integrity`). The two meet at one point: a retried edit whose first attempt already landed must succeed rather than be refused as a conflict, and that check is BF-65's same-content comparison. This file keeps its ACs as the record; evidence lives in BF-65. Set to DONE by hand in BF-65's closeout, as the parent BF-58 was.

**Type:** Record integrity (shared edit model)
**Priority:** MEDIUM (pilot-scale collision risk is low; grows with users)
**Points:** 2
**Status:** IN PROGRESS
**Sprint:** 4 (backlog)
**Reported by:** BF-57 verify round 2, Codex adversarial review (confidence 0.99), filed 2026-09-22
**Created:** 2026-09-22
**Started:** 2026-09-28T17:29:54Z
**Last Updated:** 2026-09-28T17:29:54Z

## Problem

`updateNdotStormwater` and `updateNdepStormwater` replace the whole `form_submissions.data` document with the client's copy and carry no revision check. Two people editing the same submission at once, or one person retrying a save after a slow response, overwrite each other silently and both see success. The dust log's append-only "Add Entries" flow does not have this problem; every in-place edit path does.

Tim's decision 2026-09-22: accept last-writer-wins for the Q&D pilot (about a dozen users, one inspector per form) and track the fix here rather than grow BF-57.

## Proposed change

1. Send the loaded `updated_at` (or a revision counter) with the edit form as a hidden field.
2. In each update action, add `.eq("updated_at", loadedUpdatedAt)` to the UPDATE and keep the `.select("id")` read-back. Zero rows now means either "no permission" or "someone saved first"; re-read the row to tell them apart and return a distinct message for the conflict case ("This submission changed since you opened it. Reload to see the latest version.").
3. Apply the same shape to every in-place edit path present when the story is built (NDOT, NDEP, and any form BF-58 or later adds), in one shared helper rather than per-form copies.
4. Prove it: a rolled-back SQL scenario or an integration test where two saves race, the second one is refused, and the first one's data survives.

## Acceptance criteria

- [ ] A save against a submission that changed since it was loaded is refused with a conflict message, and the earlier save is intact.
- [ ] A permission failure and a conflict are reported as different messages.
- [ ] Every in-place edit action uses the same check (no per-form drift).
- [ ] A normal single-editor save is unchanged for the user.
- [ ] Evidence recorded here.

## Notes

- The `updated_at` trigger already exists on `form_submissions` (initial schema), so the timestamp is maintained by the database.
- Do not build this into the RLS layer; it is application logic.
