# BF-65: Idempotent form submission (no duplicate inspections on retry)

**Type:** Record integrity (shared form-action layer)
**Priority:** MEDIUM (needs a lost response plus a retry; field connectivity makes that plausible)
**Points:** 2 (+2 for bundled [BF-61](BF-61-submission-edit-concurrency.md))
**Status:** IN PROGRESS
**Sprint:** 4 (backlog)
**Reported by:** BF-58.1 `/verify` round 1 (finding C2, headless verify with Codex reconciled), filed at closeout 2026-09-25
**Created:** 2026-09-25
**Started:** 2026-09-28T17:20:44Z
**Last Updated:** 2026-09-28T18:13:13Z

> **BUNDLED WITH BF-61, 2026-09-28 (Tim: "bundle it if it makes sense").** One branch, one verify and one closeout cover both. The two meet at one point: once edits are guarded by the version they loaded, a retried edit whose first attempt already landed must succeed rather than be refused as a conflict, and that check is this story's same-content comparison. BF-61's acceptance criteria are copied below; its file is set to DONE by hand at this story's closeout.

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

- [x] Replaying the same submit payload twice (same key) creates one row. The second call returns the first row's id as a success.
- [x] Two genuinely separate submissions (two page loads) still create two rows.
- [x] A key from another user cannot be used to probe or redirect to their row.
- [x] The dust-log append path does not duplicate entries on a retried append.
- [x] Migration rehearsed rolled back before applying, with Tim's go; `pnpm build` and lint clean.

**Added during build (preview finding):**
- [x] A save whose reply is lost keeps the form on screen with a message instead of Next's error page, so the retry reuses the key.

**From BF-61 (bundled):**
- [x] A save against a submission that changed since it was loaded is refused with a conflict message, and the earlier save is intact.
- [x] A permission failure and a conflict are reported as different messages.
- [x] Every in-place edit action uses the same check (no per-form drift).
- [x] A normal single-editor save is unchanged for the user.
- [x] Evidence recorded here.

## Technical Approach

Scouted 2026-09-28T17:11:39Z. One small migration, no new dependency.

**Build vs Use:** COPY the idempotency-key pattern (IETF `draft-ietf-httpapi-idempotency-key-header`, Stripe's idempotent requests) onto Postgres's own unique index. No library fits: the Next.js write-ups use Redis locks with a TTL, which this app does not run, and the database already gives an atomic, permanent guard for free. Reopen when the app gains a second non-database side effect per submit (email, webhook) that needs a result cache rather than a row check.

**Corrections to the proposed change above:**
1. **Generate the key in the browser at first submit, not on page load.** A key rendered by the server on page load rides in the page payload, so browser Back can bring the same key back for a genuinely new entry. Instead, the shared submit hook (`useNoResetSubmit` / `buildNoResetSubmit`, already used by all seven create and append forms) creates `crypto.randomUUID()` on first submit, keeps it in a ref for retries while the form stays mounted, and appends it to the FormData as `client_key`. Pages unmount on navigation (no `cacheComponents` in `next.config.ts`), so each new visit gets a new key. `randomUUID` needs HTTPS, which production and previews have; iOS Safari 15.4+. [verified 2026-09-28]
2. **Index on `(submitted_by, client_key)`, not a partial index on `client_key` alone.** Scoping by submitter means one user's key can never block or collide with another's, which makes the "another user's key" AC true by construction. A plain unique index is enough, because Postgres treats NULLs as distinct by default, so old rows and old clients with no key are unaffected. A partial index would also break any later `ON CONFLICT` or supabase `upsert`, since PostgREST cannot pass the index predicate.
3. **A reused key with different content must not silently succeed.** On a unique violation (`23505`, which PostgREST returns as HTTP 409), look up the row by `(submitted_by, client_key)`:
   - Same form type, project and `data` (key-order-insensitive compare) means it's a genuine retry: return that row as a success, and skip the photo-row mirror.
   - Different content, for example the user edited a field after a lost response, returns an error that links to the saved record: "This inspection was already saved. Open it to make changes." Never drop the edit silently. This is the draft's 422 "key reused with a different payload" rule.
4. **No key sent** (an old browser bundle during a deploy): insert as today. Server actions must accept a missing key.

**Pieces:**
- Migration `form_submissions.client_key uuid NULL` plus `CREATE UNIQUE INDEX ... (submitted_by, client_key)`, with a rollback pair. The column is new and empty, so building the index cannot fail on existing data; no duplicate pre-check is needed. The BF-63 trigger copies whole rows, so revisions will include `client_key`, which is harmless.
- Shared helper `src/lib/forms/submission-insert.ts`. A pure `sameSubmission(existing, incoming)` (unit-testable in Node) plus `insertSubmissionOnce(supabase, row, clientKey)`, which returns `{ id, replay }` or an error. The six submit actions call it; NDOT and Waterways skip `replacePhotoRows` / the photo insert when `replay` is true.
- Hook change: `buildNoResetSubmit` gets the key via an optional `clientKey()` provider, so the BF-66 test keeps working; `useNoResetSubmit` supplies the ref-backed UUID.
- Dust-log append: tag each appended entry with the batch's `client_key` (an optional `append_key` field in `dustLogEntrySchema`). `appendDustLogEntries` skips the append when an existing entry already carries that key. The read-modify-write race between two different appends is BF-61's (same file, same action), not this story's.

**Estimate:** about 140 production lines (helper 60, hook 15, six actions about 35, append 25, schema 5), against a 2 SP budget of 160. Fits.

**Tests:**
- Node unit tests for `sameSubmission`: key order, nested arrays, and one changed answer.
- A rolled-back SQL probe: the same `(submitted_by, key)` gives 23505, the same key under a different user is allowed, and NULL keys repeat freely.
- A replay test calling the helper twice with the same key against the probe or preview. It must assert that one row exists and that the second call returns the first row's id, not just a row count.
- Signed-in preview pass: submit, simulate a lost response (throttle or offline after send), and resubmit.

**Pre-existing gap noticed (out of scope):** the `submissions_insert` RLS policy does not bind `submitted_by = auth.uid()`, so a direct REST call could insert under another user's id. The server actions always set it from the session. This belongs with BF-60/BF-34, not here.

**Forward conflicts:**
- BF-61 (edit concurrency) modifies the same `actions.ts` files and owns the append path's lost-update race. Sequence matters: do BF-65 first, or build both together as planned. Its approach uses `updated_at`, with no migration, so there is no schema clash.
- BF-67 modifies the same seven form components and `useNoResetSubmit` (it consumes `ready`). MODIFY/MODIFY in different lines, benign.
- BF-64 touches `PhotoAttachment` and the host forms' submit disabling. Benign.
- No story creates `submission-insert.ts`.

## Research Sources

- firecrawl_scrape https://www.ietf.org/archive/id/draft-ietf-httpapi-idempotency-key-header-07.html: UUID keys recommended (§2.2); a fingerprint of the payload may be used (§2.4); reuse with a different payload SHOULD give 422, and a retry while the original is in flight gives 409 (§2.7); low-entropy keys let attackers reach other clients' entries (§5). The draft is expired, but it is the reference text. [verified 2026-09-28]
- firecrawl_search -> https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/: revision 07, marked no longer active. [verified 2026-09-28]
- firecrawl_search -> https://docs.stripe.com/api/idempotent_requests and https://github.com/stripe/stripe-ruby/issues/503: the same key returns the same result, and the same key with different params is refused ("can only be used with the same parameters"). [verified 2026-09-28]
- firecrawl_scrape https://heydev.us/blog/nextjs-server-actions-idempotency-rate-limit-2026 (published 2026-02-10, updated 2026-09-21): server-action idempotency keys via Redis lock plus TTL; warns that a lock keyed on the idempotency key alone lets one user block another (scope by user). [verified 2026-09-28]
- firecrawl_search -> https://github.com/orgs/supabase/discussions/12565: supabase `upsert` / PostgREST `on_conflict` cannot target a partial unique index ("no unique or exclusion constraint matching the ON CONFLICT specification"). [verified 2026-09-28]
- firecrawl_search -> https://www.postgresql.org/docs/current/indexes-unique.html: NULLs are not equal in a unique index by default, so multiple NULLs are allowed (NULLS DISTINCT). [verified 2026-09-28]
- firecrawl_search -> https://supabase.com/docs/guides/api/rest/postgrest-error-codes: Postgres 23505 maps to HTTP 409 "uniqueness violation". [verified 2026-09-28]
- firecrawl_scrape https://nextjs.org/docs/app/api-reference/functions/use-router: `bfcacheId` stays the same across back/forward; with `cacheComponents` the router preserves client state via `<Activity>`. [verified 2026-09-28]
- firecrawl_scrape https://nextjs.org/docs/app/guides/preserving-ui-state: without Cache Components, pages unmount on navigation. [verified 2026-09-28]
- firecrawl_search -> https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID: secure context only; Safari/iOS 15.4+, Chrome 92+. [verified 2026-09-28]

## Relationships

- **BF-61** (optimistic concurrency) covers edit conflicts; this covers duplicate creates. Both belong to the record-integrity gate.
- **BF-63** (revision history) would record a duplicate as a separate record; fixing this first keeps the history clean.

## Implementation (2026-09-28T18:13:13Z)

Branch `feature/BF-65-record-integrity`, commits `61dc999`, `9d6e599`, `34ec33f`. Production source: about 320 lines added, 170 removed, against a combined 4 SP budget of about 320. No production file over 300 lines.

- **Migration `20260928172859_submission_client_key`** (the version `apply_migration` recorded) plus a rollback pair. The rollback must follow an app revert, because the new code writes the column. It adds `form_submissions.client_key uuid` and `UNIQUE (submitted_by, client_key)`, which is plain rather than partial and scoped per submitter. It was applied to production with Tim's go after a rolled-back rehearsal passed 7/7.
- **`src/lib/forms/same-data.ts`:** a key-order-insensitive JSON comparison.
- **`src/lib/forms/submission-writes.ts`:**
  - `insertSubmissionOnce`: a unique violation on the key index leads to a lookup by submitter and key. The same project, form type, date and data is a replay, returned as success with the first row's id. Different content returns an "already saved" error.
  - `updateSubmissionIfUnchanged`: the UPDATE is guarded by `updated_at = version`. On zero rows, a re-read tells apart:
    - a permission refusal (version unchanged, or row not visible);
    - a replay of a save that already landed (same content: success);
    - a conflict.
  - A missing key or version, from an old browser bundle mid-deploy, behaves as before.
- **`src/lib/forms/lost-reply.ts`** plus `keepFormOnLostReply` in `use-no-reset-submit.ts`: a thrown server-action reply becomes an error on the form; `unstable_rethrow` passes Next's redirect through. It is applied to all seven create/edit/append forms.
- **`useNoResetSubmit`** creates `crypto.randomUUID()` on the first submit and reuses it while the form is mounted, so a new visit gets a new key.
- **Six create actions** use `insertSubmissionOnce`. NDOT and Waterways skip the photo-row mirror on a replay.
- **Three edit actions** (NDEP, NDOT, Waterways) use `updateSubmissionIfUnchanged`. Their edit pages pass `submission.updated_at` as the `version` prop, as the database's text, never through `Date`.
  - NDOT's edit had no read-back before, so an RLS refusal used to report success; it is now reported.
- **Dust-log append:**
  - New entries carry `append_key`; a retry that finds its key does nothing.
  - The UPDATE is guarded by the `updated_at` just read. A concurrent append is re-read and re-merged once.
  - An RLS refusal, which previously reported success, now shows the permission message.

**Found during the preview pass:**
- A lost reply made `useActionState` throw, and Next replaced the page with "This page couldn't load" (artifact 01). That unmounted the form and its key, so Reload would have created a duplicate: the case this story exists for.
- Fixed by `keepFormOnLostReply` in `34ec33f`.
- The app has no `error.tsx` anywhere, so any other thrown error still shows Next's default page. That is out of scope and noted for verify.

## Comprehensive Validation (2026-09-28T18:13:13Z)

| # | Check | Result | Key finding |
|---|------|--------|-------------|
| 1 | `Testing/forms/bf65_record_integrity_test.ts` (14 tests, stub Supabase client) | PASS 14/14 | Each test asserts the outcome and the returned id plus the exact filters sent: the lookup is scoped to (submitted_by, client_key), and the version reaches the filter with microseconds intact. Covered: replay versus changed content; another constraint's 23505 goes straight back without a lookup; permission versus conflict versus a landed retry; an unguarded update without a version; one key per mounted form; a lost reply becomes a message; Next's redirect still propagates. |
| 2 | Mutation check | FAIL as intended, then restored | Treating every key hit as a replay failed "the same key with different content is refused". |
| 3 | `Testing/security/bf65_client_key_probe.sql` via `bf65_rehearsal.py` | PASS 7/7 rolled back, then 7/7 against production after apply | Index shape; 23505 names the key index; the lookup finds the first row under RLS; NULL keys never collide; a second save from the same version updates 0 rows and the first save survives; another user may use the same key value; a same-org admin's lookup by (self, key) gets only their own row, though they can see the member's. |
| 4 | Regression: BF-66 4/4, BF-58.1 16/16, BF-58.2 7/7 | PASS | |
| 5 | `tsc --noEmit`, lint (0 errors, 12 existing warnings), `pnpm build` on the committed tree | PASS | |
| 6 | Supabase security advisor after apply | No new findings | Every item predates this story. |
| 7 | Preview, lost reply before the fix (artifact 01) | RED confirmed | Row saved with its key; the page became Next's error screen. |
| 8 | Preview, lost reply after the fix (artifact 03) | PASS | The first attempt saved the row and showed the message. Submit again landed on the project list, with still exactly one row (`2fe6f8f1`). |
| 9 | Preview, BF-61 two-tab conflict (artifact 02) | PASS | Tab B saved; tab A, holding the old version, got the conflict message, and the database kept tab B's text. |
| 10 | Preview, retried Add Entries (artifact 04) | PASS | One entry appended, not two (the log has 2 entries). The first attempt showed the message and the retry landed on the log. |

TEST records created on production data by the preview pass. All four were deleted with Tim's go (guarded SQL delete by id and TEST marker): 0 rows remain and their `form_photos` rows went with them. BF-63 kept 6 revisions (2 UPDATE from the append and the conflict test, 4 DELETE). The Waterways test photo file `1790618881458-k071r2.jpg` stays in Storage.
- dust logs `d47d6722` (the RED run), `cfb0cb18` (an attempt interrupted by the Vercel toolbar extension) and `2fe6f8f1` (GREEN plus append);
- Waterways `2ca1db8d` (conflict test).

The three dust logs, each from a separate page load with its own key, also show AC 2: separate submissions still create separate rows.
