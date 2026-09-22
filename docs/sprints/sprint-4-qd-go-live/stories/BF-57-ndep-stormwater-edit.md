# BF-57: NDEP Weekly Stormwater: enable Edit on submitted forms

**Type:** Form enhancement (in-place edit, existing pattern)
**Priority:** HIGH (Q&D reported it as a bug; it is unfinished scope)
**Points:** 2
**Status:** IN PROGRESS
**Sprint:** 4
**Started:** 2026-09-22T12:49:24Z
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-22T13:32:50Z

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

## Technical Approach (build stage, 2026-09-22)

**Build vs Use:** COPY — the in-repo NDOT edit pattern (`updateNdotStormwater`, `ndot-stormwater/[submissionId]/edit/page.tsx`, `NdotStormwaterForm` edit props). No new dependencies; no library exists for "edit this app's own form", so the risk step is skipped per its skip condition.

Pre-flight facts (verified 2026-09-22): Node 22.23.2, pnpm 8.15.9 pinned in `packageManager`, Next 16.1.6, React 19.2.3, Zod 3.24.4, no test framework (patterns Section 6). Live RLS for `form_submissions` UPDATE is owner OR org admin OR super admin (migration `20260504170000_submission_edit_ownership.sql`, BF-43). The NDEP form has no `PhotoAttachment` and its schema has no `photos` field, so proposed-change item 5 and the photo halves of AC 2 and AC 5 have nothing to preserve; recorded rather than built.

Research log (URLs from tool results only):
- firecrawl_search "Next.js server action bind extra argument useActionState" → https://github.com/nextjsargentina/next.js-docs/blob/c06b074ee0003b5229be49bb6048fffc91ec05f2/src/docs/02-app/01-building-your-application/02-data-fetching/02-server-actions-and-mutations.mdx → `action.bind(null, id)` is the documented way to pass an id next to FormData; matches the NDOT form.
- firecrawl_search "Supabase RLS UPDATE policy USING without WITH CHECK" → https://supabase.com/docs/guides/database/postgres/row-level-security → without WITH CHECK the USING clause governs both old and new rows, and UPDATE needs a SELECT policy (present, org-scoped). https://makerkit.dev/blog/tutorials/supabase-rls-best-practices → an RLS-denied UPDATE affects 0 rows silently. The NDOT action does not detect that; the NDEP update selects the row back and returns a permission error when nothing comes back.

## Implementation record

Branch `feature/BF-57-ndep-stormwater-edit`, worktree `e:/brave-forms-worktrees/BF-57`.

| File | Change |
| --- | --- |
| `src/app/dashboard/projects/[id]/forms/ndep-stormwater/actions.ts` | `updateNdepStormwater(submissionId, prev, formData)`: auth, ownership check (admin or submitter, same as NDOT), Zod re-validation, UPDATE scoped by id + project + form type, `.select("id")` so an RLS-denied update is reported not swallowed, revalidate view and project, redirect to view. `collectFieldErrors` shared with submit. |
| `.../ndep-stormwater/[submissionId]/edit/page.tsx` | New. Mirrors the NDOT edit page: login redirect, project and submission load, 404 when the submission is not this project's NDEP form, `canEdit` redirect to the view page, form in edit mode with `initialData` and `cancelHref`. |
| `src/components/forms/ndep-stormwater/NdepStormwaterForm.tsx` | Props `submissionId`, `initialData`, `cancelHref`; edit mode binds the update action, seeds state from `initialData`, hides Use Previous, shows Cancel and "Save Changes". |
| `src/components/form-actions.tsx` | `ndep_weekly_stormwater` added to `EDIT_SUPPORTED`; comment updated. |
| `.../ndep-stormwater/[submissionId]/page.tsx` | Passes `editHref`. |
| `Testing/forms/bf57_ndep_edit_readiness.ts` | Read-only AC 6 check: every live NDEP submission parsed through the current schema. Imports the schema with an explicit `.ts` extension because Node type stripping requires it. |
| `tsconfig.json` | `Testing` added to `exclude` so hand-run scripts there stay out of the app's type-check (verify round 1 finding). |
| `.claude/lessons-learned.md` | Lesson: take build evidence on the tree you commit. |

Size: 123 insertions, 17 deletions across four existing files plus a 59-line edit page; the 2 SP budget is about 160 lines, ceiling 320.

Evidence (worktree, re-run 2026-09-22T13:32:50Z on the tree committed after round 1; the first run at 12:49 predated the readiness script and was not valid for the commit):
- `eslint`: 0 errors, 9 pre-existing warnings (none in touched files).
- `tsc --noEmit`: clean.
- `next build`: compiled; route table lists `/dashboard/projects/[id]/forms/ndep-stormwater/[submissionId]/edit`.
- `node Testing/forms/bf57_ndep_edit_readiness.ts`: 5 NDEP submissions on production, 5 parse, RESULT: PASS. So the pre-existing rows hydrate the edit form and would save unchanged without a validation error (AC 6, no migration).

Not exercised in the build stage: the authenticated browser path (Edit button visibility, save round trip, PDF after edit, non-owner redirect). Those need a signed-in session and are left to verify.

## Verify round 1 (headless, 2026-09-22T13:04Z): FAIL, 5.0

Reproduced twice: `next build` and `tsc --noEmit` failed on `Testing/forms/bf57_ndep_edit_readiness.ts` ("An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled"). The story's build/typecheck evidence had been taken before that script existed, so the committed tree never built; the false evidence, not the defect, drove the score. Feature code itself was judged well implemented; lint confirmed clean. Verify tested the remedy in-session (exclude `Testing` in tsconfig, build exit 0) and reverted it. Applied here as the fix commit, with the gates re-run on the final tree and the lesson recorded.

## Acceptance criteria

- [ ] On a submitted NDEP Weekly Stormwater form, an admin or the submitter sees an enabled Edit button; other users do not see it.
- [ ] Edit page loads with all previously saved values, including the inspector signature/certification fields (the NDEP form has no photos).
- [ ] Saving writes the changes, returns to the view page, and the view and PDF show the edited values.
- [ ] A non-owner non-admin hitting the edit URL directly is redirected, and the server action rejects the update (RLS plus action check).
- [ ] Cancelling an edit leaves the submission unchanged (no photos on this form, so nothing in Storage to protect).
- [x] Existing submissions created before this change open in edit without error (no schema migration; 5 of 5 live rows parse, see evidence).
- [x] `pnpm build` and lint clean.
