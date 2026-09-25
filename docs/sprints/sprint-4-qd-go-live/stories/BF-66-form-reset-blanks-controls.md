# BF-66: Rejected submits blank selects and radios while the old answers are still sent

**Type:** Bug (shared form pattern; what the user sees differs from what is saved)
**Priority:** HIGH (a correction can save answers the screen showed as blank; affects every live form)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** BF-58.1 signed-in preview pass, 2026-09-25 (fixed there for the new form only); filed by Tim's direction the same day
**Created:** 2026-09-25
**Last Updated:** 2026-09-25T17:06:44Z

## Problem

React 19 resets a `<form action={fn}>` after the action returns. The forms keep their values in React state and send them as a hidden JSON `data` field. After a submit the server rejects (a validation error), the reset puts the DOM back to its defaults:
- controlled `<select>` elements show their first option;
- radio buttons show nothing checked;
- text inputs re-render with their values, so only some fields look cleared.

The React state, which is what gets sent, still holds the old values. A user who fixes the one flagged field and submits again saves answers the screen showed as blank.

Evidence: reproduced on the BF-58.1 preview. The screen showed no site and no answers while the draft held "Western Drainage" and "Yes" ([screenshots](../artifacts/BF-58.1/), `03-RED-...` and `04-GREEN-...`).

## Affected

These components use `<form action={formAction}>` (grep at `34673b4`):
- `dust-log/DailyDustLog.tsx`
- `dust-log/AppendDustLogEntries.tsx`
- `ndep-sad/NdepSadApplication.tsx`
- `ndep-stormwater/NdepStormwaterForm.tsx`
- `ndot-stormwater/NdotStormwaterForm.tsx`
- `nnph-dust-permit/NnphDustPermitForm.tsx`
- `projects/project-form.tsx`

Each needs checking for which controls actually desync. `project-form.tsx` is different: it is mostly uncontrolled with `defaultValue`, so a reset there loses the user's typed edits back to the saved values rather than desyncing. That is still wrong after a rejected save.

## Proposed change

Copy BF-58.1's fix: submit through `onSubmit` plus `startTransition(() => formAction(formData))` instead of the `action` prop. That path has no automatic reset. See `WaterwaysForm.tsx` `handleSubmit`.

If the same change repeats across seven forms, consider one small shared hook, for example `useFormSubmit(formAction)` returning the handler (service-layer rule: one fix, many callers).

## Acceptance criteria

- [ ] On each affected form, a submit rejected by the server leaves every select, radio, checkbox and text field showing exactly what will be sent. Check in a browser on a preview, one screenshot per form, in `artifacts/BF-66/`.
- [ ] On the project form, a rejected save keeps the user's typed edits.
- [ ] A successful submit still redirects as before.
- [ ] `pnpm build` and lint clean.
