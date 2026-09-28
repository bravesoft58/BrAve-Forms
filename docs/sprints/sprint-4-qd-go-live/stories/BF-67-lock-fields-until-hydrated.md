# BF-67: Lock form fields until the page has hydrated

**Type:** Bug (shared form behaviour; a visible edit can be silently discarded)
**Priority:** MEDIUM (needs a slow page load plus an edit in that window; what is saved always matches the screen)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-66 `/verify` round 3 (finding F4, Codex, reported as C1 in the closeout summary), filed at closeout 2026-09-28
**Created:** 2026-09-28
**Last Updated:** 2026-09-28T12:34:48Z

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
