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

## Technical Approach

Scouted 2026-10-08 (master `5d2cd71`, code graph rebuilt from the same commit). BF-73 and BF-74 are merged, so the "run after" dependency is met. No new dependencies.

**Design correction: detect changes by comparing what the form would submit, not by listening for input events.** The "Proposed change" sets a flag on any `input`/`change` event. That misses every change made by a button, which these forms use a lot: the dust log's "+ Add Entry", "Use Previous" and row removal, removing a photo, and BF-70's "Copy from previous" picker. None of these fire an input event, so a crew member could add three dust-log rows, press Cancel and lose them with no warning.

Instead, every form already serializes what it sends into named fields: the state-backed forms write one hidden JSON field (`data`, or `entries` for the dust log), and the project form uses plain named inputs. So:
- When the page is ready, take a snapshot of `new FormData(form)`. Use `useNoResetSubmit`'s `ready`, after hydration, so the server-rendered values are not what gets compared.
- On Cancel, take it again. If the two match, go straight to `cancelHref`. If not, show the confirmation.

This catches typing, selects, radios, checkboxes, button-driven rows, photos and the picker alike, and needs no per-form wiring.

**Build vs Use**

| Component | Verdict | Source | Reopen when |
| --- | --- | --- | --- |
| Change detection | BUILD on the platform `FormData(form)` constructor | Baseline since 2015; includes only named, enabled controls (MDN, checked 2026-10-08) | the app adopts a form library (react-hook-form's `isDirty`); not worth adding one for a Cancel button, since the forms are `useActionState` + hidden-JSON by design (BF-65/66) |
| Cancel + inline confirmation | BUILD, one small component | Dust log's Cancel styling; "Discard changes / Keep editing" wording (UX Stack Exchange thread, checked 2026-10-08) | a shared dialog component lands (BF-78 may reuse this one) |

**Shape:**
- `src/components/forms/shared/FormCancel.tsx` (client): props `href`, `disabled` (the form's `pending`), `ready`. Render it inside the `<form>`. Its own button's `.form` property finds the form, so no ref has to be passed from each form. It snapshots on `ready`, compares on click, and then either calls `router.push(href)` or switches the button row to "Discard your changes? [Keep editing] [Discard]". Every button is `type="button"`. Serialize the snapshot as an ordered list of `[name, value]` pairs: `FormData` keeps duplicate names, such as the project form's repeated `permit_type`, so a plain object would collapse them.
- Destinations:
  - New entry: `/dashboard/projects/{id}?tab={form_type}`. The tab keys are the `FORM_TYPES` values: `daily_dust_log`, `ndep_weekly_stormwater`, `ndot_weekly_stormwater`, `ndep_sad_application`, `nnph_dust_permit`, `working_in_waterways`.
  - Edit: the record's view page. The three edit pages already pass it.
  - Dust log add-entries: the dust log record's view page.
  - Project form: `/dashboard/projects` for create, `/dashboard/projects/{id}` for edit.
- Replace the three existing `cancelHref` `<a>` links and the dust log's two `router.back()` buttons with `FormCancel`. `DailyDustLog.tsx` (283 lines) and `AppendDustLogEntries.tsx` (292) get shorter, not longer.

**Gotchas:**
- `FormData` skips disabled controls. Take the snapshot only after `ready`. If BF-67 later disables a `<fieldset>` until hydration, the same rule still holds.
- The BF-65 client key is added at submit time, not as a form field, so it never makes a form look changed.
- Waterways and dust log default the date and time on the client (`pacificToday`/`pacificTime`). The snapshot is taken after those defaults, so an untouched new form compares equal.
- Browser Back and closing the tab are out of scope. This is about the Cancel button only. A `beforeunload` prompt would be a separate ask.

**Tests:**
- A pure helper, `sameFormSnapshot(a, b)`, over ordered `[name, value]` pairs. It must catch: a duplicate name where only the second value changed; an added hidden row; a reordered row.
- Extend the BF-66 static test: every form in its list renders `FormCancel`, and `FormCancel`'s buttons are `type="button"`.
- Browser check on preview: an untouched form leaves straight away; after Add Entry it asks; Keep editing keeps every value.

**Forward conflicts:**
- BF-67 wraps every form's fields; sequence matters, no collision.
- BF-64 changes when Submit is disabled; benign.
- BF-78 could reuse the confirmation row.

**Size:** 2 SP holds. Eight forms each get a one-line component swap. The component is about 60 lines, the helper about 20.

## Research Sources

- MDN, `FormData()` constructor (firecrawl_scrape, page modified 2026-08-12, checked 2026-10-08): https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData. Built from the form's current values; only named, non-disabled controls are included; Baseline widely available since July 2015, including iOS Safari.
- Unsaved-changes approaches (firecrawl_search, 2026-10-08): https://stackoverflow.com/questions/62792342/in-react-router-v6-how-to-check-form-is-dirty-before-leaving-page-route and https://github.com/jaredpalmer/formik/issues/1657. Both are framework-level dirty tracking; neither fits a hidden-JSON `useActionState` form.
- react-hook-form with `useActionState` (firecrawl_search, 2026-10-08): https://react-hook-form.com/advanced-usage and https://github.com/orgs/react-hook-form/discussions/11832. Adopting it means restructuring every form, and syncing pending state is still a known friction. Rejected for this story.
- Discard-changes wording (firecrawl_search, 2026-10-08): https://ux.stackexchange.com/questions/142111/intuitive-dialog-for-choosing-whether-to-close-and-lose-changes-or-keep-editing. Use explicit "Discard changes" and "Keep editing" labels, not Yes/No.
