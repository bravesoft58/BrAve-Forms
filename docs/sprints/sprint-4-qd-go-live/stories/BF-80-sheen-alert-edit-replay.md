# BF-80: A retried No-to-Yes edit must still send the sheen alert

**Type:** Bug (BF-72 follow-up; a reportable event can go unannounced)
**Priority:** MEDIUM (needs the server to stop between saving the edit and scheduling the email, then a resend)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-72 `/verify` round 1 (finding C1, Codex high, verify medium), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T19:16:40Z

## Problem

`updateWaterways` alerts only when `shouldSendSheenAlert(stored, data)` is true, where `stored` is the record as loaded at the start of the request. If an edit from No to Yes commits and the function then stops before `after()` schedules the alert (timeout, crash, lost connection), the crew member's resend is a BF-65 replay. On that resend `stored` is already the saved Yes, so no alert is scheduled and none was sent. The create path does not have this gap: it schedules on every Yes, and the alert's claim row prevents a second email.

## Proposed change

- Record the intent with the edit. Options for scout: (a) on an edit that is a replay and whose saved answer is Yes, schedule `runSheenAlert` anyway; the claim row stops a duplicate, but it would also alert on a retried comment fix to a Yes record that predates BF-72 (no alert row), so it needs a guard such as the record's revision history showing a No-to-Yes change; (b) write the alert claim row (`status = 'pending'`) in the same request as the edit, before the update, and let a later request or the view page finish any `pending` row older than a minute. Codex suggested (b).
- Keep: one alert per inspection, no automatic retry of a failed send (Tim, 2026-10-08).

## Acceptance criteria

- [ ] A No-to-Yes edit that saves but whose first request never schedules the alert still produces exactly one alert after the resend.
- [ ] A retried comment fix on a Yes record sends nothing.
- [ ] A test reproduces the interrupted edit (stubbed) and fails without the fix.
- [ ] `pnpm build`, lint and tests clean.

## Depends on

- [BF-72](BF-72-sheen-plume-email-alert.md) (merged `3b486db`).
