# BF-67: Lock form fields until the page has hydrated

**Type:** Bug (shared form behaviour; a visible edit can be silently discarded)
**Priority:** MEDIUM (needs a slow page load plus an edit in that window; what is saved always matches the screen)
**Points:** 1
**Status:** DONE (merged with BF-75, `4535e7b`)
**Sprint:** 4 (backlog)
**Reported by:** BF-66 `/verify` round 3 (finding F4, Codex, reported as C1 in the closeout summary), filed at closeout 2026-09-28
**Created:** 2026-09-28
**Completed:** 2026-10-09T16:03:59Z
**Last Updated:** 2026-10-09T16:03:59Z

> **Closed with BF-75 (2026-10-09T16:03:59Z).** Browser check on the preview of `3e821aa`: the server HTML of all eight form pages has the fieldset `disabled`, and it is enabled after load (BF-75 artifacts README, "Browser check"). AC2's delayed-script run was not simulated (the browser extension cannot throttle the network); the server-HTML lock is the condition it depends on.

> **Bundled into BF-75 (Tim, 2026-10-09).** BF-75's verify round 1 found the same gap from the other side (C1: an edit made before hydration became Cancel's baseline). Built on `feature/BF-75-cancel-on-every-form`: the fieldset on all eight forms and both test additions. The V2 split was not needed: `project-form.tsx` is 258 lines with the wrapper. Verified and merged with BF-75; the delayed-script browser check is part of BF-75's browser run.
>
> **Verified with BF-75 (cycle 2 round 1 PASS, 2026-10-09T15:23:58Z; see BF-75's Verify section).** AC1 met by code trace: `ready` is false in the server HTML, and bf66 requires the `<fieldset disabled={!ready}>` to be the first element in every form and to close right before `</form>`. Removing it from the project form fails the test. AC3 met: the no-reset submit path is unchanged and the BF-66 tests pass. AC4 met: largest touched file 291 lines; build, lint and bf66 clean. AC2 (delayed-script browser check) is still open. This story has no verify-ledger record of its own; its evidence is BF-75's.

## Problem

BF-66 keeps each form's submit button disabled ("Loading...") until the page has hydrated, because before hydration the hidden JSON field still holds the server-rendered values. The fields themselves stay editable during that window. A select, radio, checkbox or text change made before hydration is a native DOM change that React's state never sees. When hydration finishes, React re-renders the controlled fields to their state value and the edit disappears. A later submit saves the old value with no error.

On a normal connection the window is under a second. On a phone with weak signal it can be several seconds, which is when a field crew is most likely to start tapping. The controlled-field revert existed before BF-66 on the seven older forms; BF-66 did not cause it, but its submit gate now makes it the one remaining gap.

## Proposed change

- Wrap each form's fields in `<fieldset disabled={!ready}>` (with the wrapper styling reset) in the eight forms listed in `Testing/forms/bf66_form_reset_test.ts`, using the `ready` value `useNoResetSubmit` already returns.
- Extend `bf66_form_reset_test.ts` so each form's fieldset is gated on `ready`.
- Also from the same verify (low): the test does not enforce that non-submit buttons stay `type="button"`, which the Enter-key block depends on. Add that assertion.
- Also from the same verify (low, V2): `project-form.tsx` is at the 300-line ceiling, so the wrapper will push it over. Move `ContactGroup` (or the permits section) into its own file as part of this change.

## Acceptance criteria

- [ ] In the server-rendered HTML of all eight form pages, the fields sit inside a disabled fieldset; after hydration they are enabled.
- [ ] With script loading delayed (browser throttling or a delayed-script test), fields cannot be changed before hydration.
- [ ] BF-66 behaviour unchanged: a rejected submit keeps every value on screen.
- [ ] No production file over 300 lines; `pnpm build`, lint and the BF-66 test clean.
