# BF-65: Idempotent form submission (no duplicate inspections on retry)

**Type:** Record integrity (shared form-action layer)
**Priority:** MEDIUM (needs a lost response plus a retry; field connectivity makes that plausible)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-58.1 `/verify` round 1 (finding C2, headless verify with Codex reconciled), filed at closeout 2026-09-25
**Created:** 2026-09-25
**Last Updated:** 2026-09-25T17:04:32Z

## Problem

Every form's submit action inserts a new `form_submissions` row with no idempotency key. If the INSERT commits but the response is lost (a dropped mobile connection on a job site), the user sees an error or a spinner, presses Submit again, and a second identical inspection is created. Both rows are real records afterwards, which muddies the compliance history, and the BF-63 revision history would treat them as two records.

Affected: all six submit actions (Daily Dust Log, NDEP Weekly Stormwater, NDOT Weekly Stormwater, NDEP SAD, NNPH Dust Permit, Working in Waterways). Found by BF-58.1's verify, which judged it inherited rather than introduced.

## Proposed change

- The form generates a client submission key (a UUID) once, when the new-entry page loads, and sends it with the payload.
- Add `form_submissions.client_key uuid` with a partial unique index (`WHERE client_key IS NOT NULL`), and a migration with a rollback pair.
- Each submit action inserts with the key. On a unique violation (23505) it looks up the existing row by `client_key` and the same submitter, and redirects to it as a success instead of creating a second row.
- Put the insert-or-return logic in one shared helper, not six copies (service-layer rule).
- The Daily Dust Log's append flow needs its own check: it appends to an existing row, so a retry duplicates entries rather than rows.

## Acceptance criteria

- [ ] Replaying the same submit payload twice (same key) creates one row. The second call returns the first row's id as a success.
- [ ] Two genuinely separate submissions (two page loads) still create two rows.
- [ ] A key from another user cannot be used to probe or redirect to their row.
- [ ] The dust-log append path does not duplicate entries on a retried append.
- [ ] Migration rehearsed rolled back before applying, with Tim's go; `pnpm build` and lint clean.

## Relationships

- **BF-61** (optimistic concurrency) covers edit conflicts; this covers duplicate creates. Both belong to the record-integrity gate.
- **BF-63** (revision history) would record a duplicate as a separate record; fixing this first keeps the history clean.
