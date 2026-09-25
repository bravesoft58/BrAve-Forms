# BF-66: Rejected submits blank selects and radios while the old answers are still sent

**Type:** Bug (shared form pattern; what the user sees differs from what is saved)
**Priority:** HIGH (a correction can save answers the screen showed as blank; affects every live form)
**Points:** 2
**Status:** DONE
**Completed:** 2026-09-25T17:55:20Z
**Sprint:** 4
**Reported by:** BF-58.1 signed-in preview pass, 2026-09-25 (fixed there for the new form only); filed by Tim's direction the same day
**Created:** 2026-09-25
**Last Updated:** 2026-09-25T17:55:20Z

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

- [x] On each affected form, a submit rejected by the server leaves every select, radio, checkbox and text field showing exactly what will be sent. Check in a browser on a preview, one screenshot per form, in `artifacts/BF-66/`.
- [x] On the project form, a rejected save keeps the user's typed edits.
- [x] A successful submit still redirects as before.
- [x] `pnpm build` and lint clean.

## Build vs Use

**Build vs Use:** COPY. This is the React team's documented opt-out (`onSubmit` + `startTransition`, react/react#29034, verified 2026-09-25), wrapped in a small shared hook. There is no library to adopt for a 20-line handler.

## Comprehensive Validation (2026-09-25T17:20:38Z)

Branch `feature/BF-66-form-reset`, fix commit `ba20a46`. The shared helper is split in two: `src/lib/forms/no-reset-submit.ts` (`buildNoResetSubmit`, React-free so Node can test it) and `src/lib/forms/use-no-reset-submit.ts` (`useNoResetSubmit`, which supplies React's `startTransition`). The eight stateful forms use the hook; WaterwaysForm's inline copy from BF-58.1 is replaced by it.

| # | Check | Result | Key finding |
| --- | --- | --- | --- |
| 1 | `Testing/forms/bf66_form_reset_test.ts` | 0/3 before the fix, 3/3 after | No `<form action={fn}>` under `src/components`; all eight forms call `useNoResetSubmit` on an `onSubmit`; the handler cancels the native submit, then runs the action inside a transition with exactly the form's own data. |
| 2 | `Testing/forms/bf58_1_waterways_schema_test.ts` | 16/16 | No regression in BF-58.1. |
| 3 | `tsc --noEmit`, `pnpm lint`, `pnpm build` (Node 24, pnpm 10.34.5) | PASS | 0 errors; the 9 lint warnings are pre-existing. |
| 4 | Signed-in preview pass, one server-rejected submit per form | PASS on all 8 forms | See [artifacts/BF-66/README.md](../artifacts/BF-66/README.md). Production confirmed untouched afterwards. |

**Scope note:** the auth forms (login, signup, forgot and reset password) and the users invite form still use `<form action>`. Their fields are all uncontrolled, so after a reset the screen matches what would be sent (empty). That means retyping after an error, not a desync, so it is out of this ticket's scope. The regression test documents this.

**Size:** `src` +56 / -18. `project-form.tsx` is exactly 300 lines, the modularity ceiling. The next change to it should split it (for example, the permits section into its own component).

## Verify (round 1, 2026-09-25T17:55:20Z) — PASS 8.8/10

Two independent reviews reconciled (verify + Codex `gpt-6-astra` xhigh). Tests 3/3 + 16/16 regression, `tsc --noEmit` and lint on changed files clean. No blocking findings. Two mediums to file as fast follow-ups (do NOT reopen this story):

- **BF-66-F1 (medium, progressive enhancement):** moving all eight forms off `action={formAction}` to `onSubmit`-only removed the server-action POST fallback. A submit before hydration or with JS disabled/failed now does a GET navigation to the current URL — the edit is not saved and named required fields + the hidden JSON `data` land in the query string. Edge window only; the hydrated path this story evidenced is unaffected, so the change is still a net fix. Proposed: keep `action={formAction}` alongside `onSubmit` (React skips the reset when onSubmit preventDefaults even with `action` present) or disable submit until hydrated; verify in a browser, then relax the test's `action={fn}` ban for the paired form.
- **BF-66-F2 (medium, test guard):** `bf66_form_reset_test.ts` asserts `useNoResetSubmit(` and `onSubmit={` presence separately, not that the form's `onSubmit` is the hook's output — a disconnected handler still passes 3/3 (Codex demonstrated). Production wiring is currently correct. Proposed: a component-render test with a dispatch spy that fails on the disconnected-handler mutation (needs a component test framework, not yet configured).

