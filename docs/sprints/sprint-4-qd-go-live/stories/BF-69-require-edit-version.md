# BF-69: Require the loaded version on every submission edit

**Type:** Record integrity (hardening a BF-61 compatibility allowance)
**Priority:** LOW (needs a browser still on pre-BF-65 code, or a hand-crafted request, plus a concurrent edit of the same record)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-65 `/verify` rounds 1 and 2 (finding C2, Codex, medium), filed at closeout 2026-09-28
**Created:** 2026-09-28
**Last Updated:** 2026-09-28T18:56:51Z

## Problem

BF-65 (with bundled BF-61) guards each edit with the `updated_at` the form loaded, so a stale save is refused instead of overwriting someone else's. To keep browsers that loaded the page before the deploy working, `updateSubmissionIfUnchanged` in `src/lib/forms/submission-writes.ts` still runs an unguarded UPDATE when no version is sent. After the deploy window, only an old cached page or a crafted request omits the version. Either way that request can overwrite a newer save, which is the lost update BF-61 exists to stop. Row-level security still limits who can write, so this is not a permission escalation.

## Proposed change

- Once the BF-65 deploy is a few days old, treat a missing or empty version on the edit path as a conflict ("Reload to see the latest version") instead of running the update.
- Keep the create path's missing-key behaviour (insert as before), since a missing key there can only cause a duplicate, never an overwrite.
- Add a regression test showing that a request without a version cannot overwrite newer content.

## Acceptance criteria

- [ ] An edit request without a version is refused and changes nothing.
- [ ] Normal edits from the current forms (which always send the version) are unchanged.
- [ ] Unit test for the missing-version case; `pnpm build` and lint clean.
