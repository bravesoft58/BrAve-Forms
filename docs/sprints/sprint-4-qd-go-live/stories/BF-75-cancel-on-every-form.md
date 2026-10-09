# BF-75: Cancel next to Submit on every form, with a "discard changes?" confirmation

**Type:** Feature (consistent form navigation; Q&D request)
**Priority:** MEDIUM (usability; crews use the new-entry screens daily)
**Points:** 2
**Status:** DONE (verify cycle 2 round 1 PASS 9.1; ships with BF-67)
**Sprint:** 4 (backlog)
**Started:** 2026-10-08T20:44:28Z
**Completed:** 2026-10-09T15:23:58Z
**Reported by:** Q&D note relayed by Tim, 2026-10-08: "Daily dust log had a cancel option next to Submit. None of the other forms have this cancel option. Would like to have that option in all forms." Confirmation step added by Tim the same day as a safety measure.
**Created:** 2026-10-08
**Last Updated:** 2026-10-09T16:00:30Z

## Problem

Only the Daily Dust Log (new entry and add-entries) has Cancel on its entry screen. NDEP Weekly Stormwater, NDOT Stormwater and Working in Waterways have Cancel on their **edit** pages only (a `cancelHref` link). NDEP SAD, NNPH Dust Permit and the project create/edit form have none. On a phone the only way out is the browser's Back.

The dust log's Cancel calls `router.back()`. That leaves the app when the form was opened from a link, a bookmark, or after a reload, and it gives no warning before throwing away a filled-in form.

## Proposed change

- **One shared component**, for example `src/components/forms/shared/FormCancel.tsx`: a `type="button"` Cancel styled like the dust log's, placed left of Submit on every form in the BF-66 list (`Testing/forms/bf66_form_reset_test.ts`: the six form components, the dust-log append form, and `project-form.tsx`). Disabled while the form is saving.
- **Fixed destination, not Back.** Each page passes `cancelHref`: the project's tab for that form on a new entry (`/dashboard/projects/{id}?tab=<form>`), the record's view page on an edit (as the three edit pages already do), the projects list or project page for the project form. The dust log moves from `router.back()` to its `cancelHref`.
- **Confirmation only when there is something to lose.** *(Superseded at scout, 2026-10-08: change detection compares FormData snapshots, because button-driven changes fire no input event; see Technical Approach.)* The form tracks a "changed" flag set by any `input` or `change` event inside the `<form>` (works for the controlled React forms and the uncontrolled project form alike; the hidden photo file input bubbles too). Unchanged: Cancel navigates straight away. Changed: an inline confirmation replaces the button row: "Discard your changes? [Keep editing] [Discard]". Inline rather than the browser's `window.confirm`, so it matches the app's styling, works the same on iPhone and Android, and can be driven in browser tests.
- **Photos already uploaded stay in Storage** when a form is discarded. That is the existing behaviour for removed photos (harmless, unreferenced; cleanup belongs to a reference-aware job, BF-58.1).
- Extend the BF-66 static test: every form in the list renders the shared Cancel, and every button inside it is `type="button"`.

## Acceptance criteria

- [x] Every form in the list shows Cancel next to Submit, on both new and edit pages, with the same look.
- [x] Cancel on an untouched form goes straight to the project's tab for that form (new) or the record's view page (edit); never to an outside page. *(Browser check 2026-10-09: NDOT and dust log new entries to their tabs, project edit to the project page.)*
- [x] After any change, Cancel shows "Discard your changes?"; Keep editing returns to the form with every value intact; Discard leaves without saving. *(Browser check 2026-10-09: typed comment, and a photo upload in flight, both asked; Keep editing kept the comment; Discard saved nothing.)*
- [x] Cancel and the confirmation buttons are disabled while saving, and none of them submit the form (Enter key included).
- [x] The dust log no longer uses `router.back()`.
- [x] `pnpm build`, lint, BF-66 and the new test clean; no production file over 300 lines.

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
- Discard-changes wording (firecrawl_search, 2026-10-08): https://ux.stackexchange.com/questions/142111/intuitive-dialog-for-choosing-whether-to-close-and-lose-changes-or-keep-editing.

## Files

| File | What |
|---|---|
| `src/lib/forms/form-snapshot.ts` (new, 28 lines) | `snapshotFormData` / `snapshotForm` (ordered `[name, value]` pairs, files as name:size:date) and `sameFormSnapshot`. |
| `src/components/forms/shared/FormCancel.tsx` (new, 73 lines) | Cancel, and the inline "Discard your changes? Keep editing / Discard" row. Finds its form with `closest("form")`, takes the baseline once `ready`, `router.push(href)`. All buttons `type="button"`; disabled while saving; Cancel also until ready. |
| Eight forms (dust log, dust log add-entries, NDEP SAD, NDEP stormwater, NDOT stormwater, NNPH, Waterways, project form) | Render `<FormCancel href=... ready={ready} disabled={pending} />` left of Submit. New-entry destinations default to `/dashboard/projects/{id}?tab={form_type}`; the edit pages keep passing their view page; dust log add-entries goes to the dust log record; the project form defaults to `/dashboard/projects`. Dust log `router.back()` and the three `<a>` Cancel links removed. |
| `src/app/dashboard/projects/[id]/edit/page.tsx` | Passes `cancelHref` = the project page. |
| `Testing/forms/bf75_cancel_test.ts` | Snapshot comparisons and static wiring guards. |

## Validation (story session, 2026-10-08T20:48:19Z)

Worktree `e:/brave-forms-worktrees/BF-75`, branch `feature/BF-75-cancel-on-every-form`, Node 24 + pnpm 10.34.5 via `npx`.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | `bf75_cancel_test.ts` | PASS 9/9 | Untouched equal; hidden JSON change seen; duplicate names (second value, then first value) seen; added and removed fields seen; reordered values seen; files compared by name/size/date; every form renders `FormCancel` inside its `<form>` with `ready`/`pending` and its fixed destination, with no `router.back()` and no hand-made Cancel left; the project edit page's destination; three `type="button"` buttons, no `window.confirm`, baseline only once ready. |
| 2 | Mutation: `sameFormSnapshot` reduced to a length check | 4 FAIL | The comparison tests can fail; file restored from a scratchpad copy. |
| 3 | Regression: bf66 4, bf70 13, bf70 render 6, bf72 16, bf74 19, bf65 15, bf58_1 16, bf73 9 + 6, bf58_2 7 | all pass, 0 fail | 111 tests across 10 files |
| 4 | `tsc --noEmit`; `pnpm lint` (0 errors, the 12 pre-existing warnings, none in touched files); `pnpm build` | PASS | |
| 5 | Sizes | `DailyDustLog.tsx` 283 to 275, `AppendDustLogEntries.tsx` 292 to 288, `project-form.tsx` 256 | No file over 300; net -8 lines across the eight forms. |

**Done 2026-10-09T16:00:30Z on the preview of `3e821aa`; all passed. Evidence and details: [artifacts/BF-75](../artifacts/BF-75/README.md) "Browser check", files 08 to 12.** Originally open for the browser check: an untouched form leaves straight away; after "+ Add Entry" or a typed change Cancel asks; Keep editing keeps every value; Discard leaves without saving. No database change in this story. Use explicit "Discard changes" and "Keep editing" labels, not Yes/No.

## Verify (round 1, 2026-10-09T14:31:20Z)

**Verdict: PASS, score 8.8/10** (computed by `verify_verdict.py` from the adjudicated findings; no critical or high left unfixed). Headless, fresh session, on `8254d0d` against `master`. Second reviewer: Codex (gpt-6-astra, xhigh) [observed 2026-10-09], verdict needs-attention with two findings, both upheld as medium and filed. Evidence: [artifacts/BF-75](../artifacts/BF-75/README.md).

Re-run by verify on Node 24.21.0 [observed 2026-10-09]: the 11 `Testing/forms` unit files 120 pass / 0 fail, `tsc --noEmit` clean, ESLint 0 errors (the 12 pre-existing warnings, none in a touched file), `next build` exit 0. No production file over 300 lines.

| AC | Status | Evidence |
|---|---|---|
| 1 Cancel next to Submit on every form, same look | MET | All eight forms render `FormCancel` left of Submit inside the `<form>`; the three edit pages' `<a>` links and the dust log buttons replaced. |
| 2 Untouched form goes straight to the fixed destination | MET by code trace | Tab keys equal `FORM_TYPES` and the project page reads `?tab=`; the dust log view route and `/dashboard/projects` exist. No form changes serialized state after mount, so the baseline equals an untouched form. Not yet executed on screen (V1). |
| 3 Any change asks; Keep editing keeps values; Discard leaves | PARTIALLY MET | Typed, select, radio and button-driven changes all reach a named field at render time, so they are seen. Two edge paths skip the prompt: C1 and C2 below. |
| 4 Disabled while saving; nothing submits (Enter included) | MET | All three buttons `type="button"`; `disabled` follows `pending`, Cancel also waits for `ready`; implicit submission goes to the real Submit, which is disabled while pending. |
| 5 Dust log no longer uses `router.back()` | MET | No `router.back()` left in any touched production file. |
| 6 Build, lint, BF-66 and new test clean; no file over 300 lines | MET | As above; largest touched file 288 lines. |

Findings to file (medium):
- **C1** Edits typed into the uncontrolled project form before hydration become the baseline, so Cancel then leaves without asking. **FIXED after round 1 (Tim, 2026-10-09) by building BF-67 on this branch:** all eight forms wrap their body in one `<fieldset disabled={!ready}>`, so nothing can be edited before hydration and the baseline is always the untouched form. `bf66_form_reset_test.ts` gained the fieldset check and BF-67's "every button declares its type" check (6/6; removing the lock from the project form fails it). All 13 form test files pass (126 tests); tsc, lint (0 errors) and `next build` clean on Node 24; largest touched file 291 lines.
- **C2** Photos still compressing or uploading are not in the hidden JSON yet, so Cancel during an upload on an otherwise unchanged NDOT or Waterways form leaves without asking. **FIXED after round 1 (Tim, 2026-10-09):** `PhotoAttachment` marks its section with `PENDING_WORK_ATTR` while uploading, and `FormCancel` asks whenever any element inside the form carries it (`needsDiscardCheck`). Unit test 13/13 (4 new), BF-66 4/4, tsc, lint and `next build` clean on Node 24. Discard during an upload still leaves the uploaded file unreferenced in Storage, which `PhotoAttachment` already accepts for removed photos (cleanup belongs in a reference-aware job).

Noted (low): V1 no test executes `FormCancel`'s behaviour; V2 an empty named file input would make every snapshot differ (no form has one); V3 the wiring test matches destinations file-wide; V4 focus drops to the page after Keep editing; V5 no progress feedback while Cancel navigates; V6 the baseline effect would run before any future parent mount effect.

## Verify (cycle 2, round 1, 2026-10-09T15:23:58Z)

**Verdict: PASS, score 9.1/10** (computed by `verify_verdict.py`; nothing critical, high or medium left open, nothing to file). The round-1 PASS closed that cycle, so this is a full, blind round on `3e821aa` against `master`, covering the C1 and C2 fixes and the BF-67 lock built on this branch. Headless, fresh session. Second reviewer: Codex (gpt-6-astra, xhigh) [observed 2026-10-09], verdict **approve**, no findings. It read the diff through GitHub because its sandbox could not run commands, so it ran no tests. Evidence: [artifacts/BF-75](../artifacts/BF-75/README.md), files 04 to 07.

Re-run by verify on Node 24.21.0 [observed 2026-10-09]: the 11 `Testing/forms` unit files 126 pass / 0 fail (bf75 13, bf66 6); `tsc --noEmit` clean; ESLint 0 errors and the 12 pre-existing warnings (one, `no-img-element`, is in `PhotoAttachment.tsx`, which the C2 fix touched; it predates this story); `next build` exit 0. Largest touched production file 291 lines.

Mutation check: removing the lock from the project form, dropping the upload marker, and ignoring in-flight work each fail a test. Inverting Cancel's ask/leave choice and wiring Discard to Keep editing both pass the whole suite: the click path is proven by code trace only (V1).

| AC | Status | Evidence |
|---|---|---|
| 1 Cancel next to Submit on every form, same look | MET | All eight forms render `FormCancel` left of Submit inside the `<form>`; bf75 wiring test. |
| 2 Untouched form goes straight to the fixed destination | MET by code trace | The fieldset lock means nothing can change before the baseline is taken; the tab keys match `ProjectTabs`; every destination route exists in the build. Browser check still pending. |
| 3 Any change asks; Keep editing keeps values; Discard leaves | MET by code trace | C1 and C2 closed (below). Keep editing only re-renders `FormCancel`, so form state is untouched. Browser check still pending. |
| 4 Disabled while saving; nothing submits (Enter included) | MET | Three `type="button"` buttons; `disabled` follows `pending`; bf66 now also requires every button under the form components to declare its type. |
| 5 Dust log no longer uses `router.back()` | MET | bf75 wiring test. |
| 6 Build, lint, BF-66 and new test clean; no file over 300 lines | MET | As above. |

Round-1 findings re-checked: **C1 fixed.** Each form body is one `<fieldset disabled={!ready}>`, and `ready` is false in the server HTML. React removes the attribute in the same commit that `FormCancel`'s baseline effect follows, so the baseline always sees enabled fields. **C2 fixed.** `PhotoAttachment` sets `uploading` before compression starts and clears it in `finally`, and the new photos and the cleared marker land in one batched render, so there is no unguarded gap.

Noted (low, not filed): V1 to V6 carried from round 1, still true; V7 browser-restored values on the uncontrolled project form, for example a Firefox reload mid-edit, would count as untouched (suspected, not reproduced); V8 the form bodies were not re-indented under the new `<fieldset>`. V9 (sprint-index row still NOT STARTED) was dismissed: closeout writes that row.
