# BF-75: Cancel next to Submit on every form, with a "discard changes?" confirmation

**Type:** Feature (consistent form navigation; Q&D request)
**Priority:** MEDIUM (usability; crews use the new-entry screens daily)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** Q&D note relayed by Tim, 2026-10-08: "Daily dust log had a cancel option next to Submit. None of the other forms have this cancel option. Would like to have that option in all forms." Confirmation step added by Tim the same day as a safety measure.
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:38:50Z

## Problem

Only the Daily Dust Log (new entry and add-entries) has Cancel on its entry screen. NDEP Weekly Stormwater, NDOT Stormwater and Working in Waterways have Cancel on their **edit** pages only (a `cancelHref` link). NDEP SAD, NNPH Dust Permit and the project create/edit form have none. On a phone the only way out is the browser's Back.

The dust log's Cancel calls `router.back()`. That leaves the app when the form was opened from a link, a bookmark, or after a reload, and it gives no warning before throwing away a filled-in form.

## Proposed change

- **One shared component**, for example `src/components/forms/shared/FormCancel.tsx`: a `type="button"` Cancel styled like the dust log's, placed left of Submit on every form in the BF-66 list (`Testing/forms/bf66_form_reset_test.ts`: the six form components, the dust-log append form, and `project-form.tsx`). Disabled while the form is saving.
- **Fixed destination, not Back.** Each page passes `cancelHref`: the project's tab for that form on a new entry (`/dashboard/projects/{id}?tab=<form>`), the record's view page on an edit (as the three edit pages already do), the projects list or project page for the project form. The dust log moves from `router.back()` to its `cancelHref`.
- **Confirmation only when there is something to lose.** The form tracks a "changed" flag set by any `input` or `change` event inside the `<form>` (works for the controlled React forms and the uncontrolled project form alike; the hidden photo file input bubbles too). Unchanged: Cancel navigates straight away. Changed: an inline confirmation replaces the button row: "Discard your changes? [Keep editing] [Discard]". Inline rather than the browser's `window.confirm`, so it matches the app's styling, works the same on iPhone and Android, and can be driven in browser tests.
- **Photos already uploaded stay in Storage** when a form is discarded. That is the existing behaviour for removed photos (harmless, unreferenced; cleanup belongs to a reference-aware job, BF-58.1).
- Extend the BF-66 static test: every form in the list renders the shared Cancel, and every button inside it is `type="button"`.

## Acceptance criteria

- [ ] Every form in the list shows Cancel next to Submit, on both new and edit pages, with the same look.
- [ ] Cancel on an untouched form goes straight to the project's tab for that form (new) or the record's view page (edit); never to an outside page.
- [ ] After any change, Cancel shows "Discard your changes?"; Keep editing returns to the form with every value intact; Discard leaves without saving.
- [ ] Cancel and the confirmation buttons are disabled while saving, and none of them submit the form (Enter key included).
- [ ] The dust log no longer uses `router.back()`.
- [ ] `pnpm build`, lint, BF-66 and the new test clean; no production file over 300 lines.

## Depends on

- Run after [BF-73](BF-73-equipment-picker-per-site-history.md) and [BF-74](BF-74-org-email-settings-m365.md) merge: both are in flight and BF-73 touches the Waterways form pages.
- Sequence with [BF-67](BF-67-lock-fields-until-hydrated.md) (also wraps every form's fields); whichever lands second rebases.
