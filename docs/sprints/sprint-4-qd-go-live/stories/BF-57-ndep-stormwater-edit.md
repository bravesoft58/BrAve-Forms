# BF-57: NDEP Weekly Stormwater: enable Edit on submitted forms

**Type:** Form enhancement (in-place edit, existing pattern)
**Priority:** HIGH (Q&D reported it as a bug; it is unfinished scope)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-20T19:30:55Z

## Request (verbatim)

> NDEP Weekly Stormwater Inspection - Edit button is grayed out when trying to edit a form that was already submitted.

## Current state

This is deliberate, not a defect. The shared `FormActions` component keeps an `EDIT_SUPPORTED` set containing only `ndot_weekly_stormwater`. For NDEP stormwater, NDEP SAD, and NNPH dust permit it renders a disabled Edit button with the tooltip "Edit for this form type is coming next sprint." The Daily Dust Log has its own append-only "Add Entries" flow.

The NDEP stormwater view page already computes `canEdit` (admin, or the submitter) and passes it to `FormActions`, but passes no `editHref`, and there is no `edit` route or `updateNdepStormwater` server action. Only `submitNdepStormwater` exists.

The NDOT form has the complete pattern: an `edit/page.tsx` route under the submission, an `updateNdotStormwater` server action, and the `NdotStormwaterForm` component accepting initial data plus a mode. Edit ownership rules are the BF-43 policy: ordinary users edit their own submissions, org admins edit within their organization.

## Proposed change

1. Add `updateNdepStormwater` to the NDEP stormwater actions, mirroring `updateNdotStormwater`: validate with the existing Zod schema, check ownership the same way, update `form_submissions.data` (and any top-level columns the submit action writes), revalidate the view path.
2. Add `ndep-stormwater/[submissionId]/edit/page.tsx`, mirroring the NDOT edit page: load the submission, enforce `canEdit` server-side (redirect if not), render the NDEP form component with initial data in edit mode.
3. Make the NDEP form component accept initial data and an update handler if it does not already (check before assuming; the NDOT one was refactored for this in BF-38-era work).
4. Add `ndep_weekly_stormwater` to `EDIT_SUPPORTED` and pass `editHref` from the NDEP view page.
5. Photos: the shared `PhotoAttachment` deletes a removed photo from Storage before the edit is saved (readiness assessment finding). Do not widen that exposure; at minimum, confirm the NDEP edit path does not delete photos on cancel. Fixing the ordering is a separate record-integrity item.

## Out of scope

NDEP SAD and NNPH dust permit edit. Andy asked only about NDEP Weekly Stormwater. Filing them separately if Q&D needs them keeps this ticket at 2 points. Note them in the sprint README if Andy raises them.

## Acceptance criteria

- [ ] On a submitted NDEP Weekly Stormwater form, an admin or the submitter sees an enabled Edit button; other users do not see it.
- [ ] Edit page loads with all previously saved values, including photos and the inspector signature/certification fields.
- [ ] Saving writes the changes, returns to the view page, and the view and PDF show the edited values.
- [ ] A non-owner non-admin hitting the edit URL directly is redirected, and the server action rejects the update (RLS plus action check).
- [ ] Cancelling an edit leaves the submission and its photos unchanged.
- [ ] Existing submissions created before this change open in edit without error (no schema migration expected; confirm).
- [ ] `pnpm build` and lint clean.
