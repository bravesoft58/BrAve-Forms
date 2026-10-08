# BF-77: Email settings saves and test results must not cross configurations

**Type:** Record integrity (BF-74 follow-up; two races in the settings page)
**Priority:** MEDIUM (needs two admins editing at once, or a save during the few seconds a test takes)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-74 `/verify` round 1 (findings C3 and C4, Codex and verify, medium), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T17:34:52Z

## Problem

1. **Stale save (C3).** Two admins open Settings. Admin A saves a new client ID with its new secret. Admin B saves the older form with the secret left blank, which means "keep the stored secret". The row now pairs B's old client ID and expiry date with A's new secret: every send fails and the expiry banner tracks the wrong date, until someone runs a test.
2. **Test written onto the wrong configuration (C4).** A test email is in flight with working configuration A. A save of configuration B (bad secret) clears the last test result. A's send succeeds and writes "Last test: sent" onto B, so the page reports an untested, broken configuration as working.

## Proposed change

One revision check fixes both, the same pattern as BF-61 for submissions:

- The page loads the row's `updated_at` (as database text, never through `Date`: it has microseconds, BF-61 lesson) and sends it back with a save. The save updates only when it still matches; otherwise "Settings were changed by someone else. Reload to see them."
- The test action records the `updated_at` it tested and writes `last_test_*` only `WHERE updated_at = <that value>`; a mismatch leaves the result unwritten and tells the admin to test again.

## Acceptance criteria

- [ ] A save based on an older load is refused and changes nothing; a save based on the current load succeeds.
- [ ] A test result is written only onto the configuration that was tested.
- [ ] Unit tests for both races with stubbed Supabase; `pnpm build`, lint, tests clean.

## Depends on

- [BF-74](BF-74-org-email-settings-m365.md) (merged `66ec348`).
