# BF-57: NDEP Weekly Stormwater: enable Edit on submitted forms

**Type:** Form enhancement (in-place edit, existing pattern)
**Priority:** HIGH (Q&D reported it as a bug; it is unfinished scope)
**Points:** 2
**Status:** DONE
**Sprint:** 4
**Started:** 2026-09-22T12:49:24Z
**Completed:** 2026-09-22T16:34:47Z
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-22T16:34:47Z

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

## Verify round 2 (headless, 2026-09-22T13:51:01Z): NEEDS ATTENTION, 8.0

Verify re-ran all three gates on 602cf57 itself (tsc clean, eslint 0 errors, `next build` exit 0 with the edit route) and confirmed round 1 is resolved; Tier 1 pattern scan clean; Codex leg completed. Two items, no code change made:

1. **Concurrent edits are last-writer-wins** (Codex, confidence 0.99). The update replaces the whole `form_submissions.data` document with no revision check, so two editors on one submission, or a retried save, overwrite each other silently. Pre-existing: the NDOT update this story mirrors does the same. A correct fix is cross-cutting (optimistic concurrency on `updated_at` across every edit path) and is not this 2-point story. Decision for Tim: fix at the shared level, accept for the pilot, or file a follow-up.
2. **ACs 1 to 4 need a signed-in session** against live RLS (Edit button visibility, save round trip, PDF after edit, non-owner redirect). Server logic judged sound by inspection; not exercised end to end in a headless run.

Disposition (Tim, 2026-09-22): item 1 accepted for the pilot and filed as BF-61; item 2 to be run through Tim's signed-in browser.

## Post-verify checks (2026-09-22T16:09:16Z)

**AC 4, RLS half (production, rolled back).** Nested block with `set_config('request.jwt.claims', …)` + `SET LOCAL ROLE authenticated`, a same-value UPDATE on NDEP submission `606a46d6` (owner drich@qdconstruction.com), three identities, then a marker exception so nothing persists: plain org member abreen@qdgroupinvesco.com 0 rows, owner 1 row, org admin gdamele@qdconstruction.com 1 row. `updated_at` unchanged afterwards. So the database refuses a non-owner non-admin write independently of the action's own check, and the action's `.select("id")` read-back turns that refusal into a visible error.

**Signed-in run (preview `brave-forms-9rbnisvia-embracingai.vercel.app` at 53e6298, production database, Tim signed in as super admin, 2026-09-22T16:15Z to 16:19Z, driven through Claude in Chrome).** The preview target now carries `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (added 2026-09-22, publishable values only), which is what made this run possible.

1. Submitted a fresh NDEP form on 17446 - Deodar St (inspector and signature "BF-57 verify test"): row `36c5c7ae` created, status submitted, redirect to the project tab listing 2 submissions.
2. AC 1: the view page's Edit control is an `<a>` to `.../ndep-stormwater/36c5c7ae/edit`, no `disabled` attribute, no tooltip. The grayed button is gone for this form type.
3. AC 2: the edit page rendered "Edit NDEP Weekly Stormwater Inspection" with the edit-mode note, Cancel and Save Changes, no Use Previous; hydrated state carried inspector name, signature, signature date, inspection date and time, 16 control measures, 4 stabilization items.
4. AC 5: typed temperature "99", clicked Cancel: back on the view page, `updated_at` unchanged (16:15:27), temperature still empty.
5. AC 3: set temperature "72" and inspector name "BF-57 verify test EDITED", Save Changes: redirect to the view page showing both values; database row `updated_at` 16:17:02 with temperature 72, inspector edited, signature untouched, 16 measures intact; `/api/forms/36c5c7ae/pdf` 200 `application/pdf` 9,696 bytes, rendered in Chrome's viewer with the edited inspector name and Temperature 72 (`artifacts/BF-57/01-pdf-after-edit-shows-edited-inspector-and-temperature-72.jpg`).
6. AC 4, route guard: the same submission under a different project id (`.../projects/b16bd572/forms/ndep-stormwater/36c5c7ae/edit`) returns 404. The non-owner redirect itself was not driven from a browser (only Tim's super-admin session was available); the RLS half below covers the write, and the page check is the NDOT pattern unchanged.
7. Cleanup: test row deleted by SQL scoped to its id, form type and inspector name; production back to 5 NDEP and 18 total submissions, 0 test rows, 0 photos. Tab closed.

**Preview deployment gap (Vercel, not this branch).** The branch preview `brave-forms-helrvcp4w-embracingai.vercel.app` (dpl_54Di2SSw, READY at 602cf57) returns 500 on every route: runtime log "Your project's URL and Key are required to create a Supabase client". `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for the production target only, so no preview of this project has ever booted. The preview for 57444c7 had already failed at build, which independently confirms verify round 1.

## Verify round 3 (headless, 2026-09-22T16:34:47Z): PASS, 9.5

Two-reviewer gate held and both reviewers are clean this round.

- **Gates re-run on the committed tree (b30daa0), independently:** `tsc --noEmit` exit 0, `eslint` exit 0 (0 errors, 9 pre-existing warnings, none in touched files), `next build` exit 0 with the `ndep-stormwater/[submissionId]/edit` route present. Round 1's false-build-evidence failure is confirmed resolved.
- **Tier 1 pattern scan clean.** The only `console.*`/`catch` hits are in `Testing/forms/bf57_ndep_edit_readiness.ts`, a hand-run diagnostic excluded from the app build; no secrets, no raw SQL, no `any`, no empty returns. All changed files under 300 lines.
- **AC 6 independently re-run:** `node Testing/forms/bf57_ndep_edit_readiness.ts` → 5 production NDEP rows, 5 parse, RESULT PASS.
- **Codex (`gpt-6-astra` @ xhigh, 6m 4s):** verdict `approve`, zero findings — "No new material blocker beyond the accepted BF-61 concurrency risk. Preservation, authorization, and failure-path checks passed."
- **Round 2 items disposition:** (1) concurrency last-writer-wins — re-raise recognized; Tim accepted for the pilot and filed BF-61 (exists, NOT STARTED); does not bar this round. (2) interactive ACs 1-4 — resolved by the signed-in run + RLS probe recorded above (AC 3 has the PDF artifact).
- **Note (not a blocker, shared with NDOT):** the action's `role !== "admin"` ownership pre-filter reads the legacy `profiles.role`; the authoritative boundary is the BF-43 RLS policy (super_admin/owner/org-admin), which the update surfaces via `.select("id")`. The pre-filter is fail-closed and a faithful mirror of the shipping NDOT path; any org-admin edge case belongs with the shared edit-model cleanup, not this 2-point story.

## Acceptance criteria

- [x] On a submitted NDEP Weekly Stormwater form, an admin or the submitter sees an enabled Edit button; other users do not see it (signed-in run item 2; `canEdit` gating unchanged from NDOT).
- [x] Edit page loads with all previously saved values, including the inspector signature/certification fields (the NDEP form has no photos) (signed-in run item 3).
- [x] Saving writes the changes, returns to the view page, and the view and PDF show the edited values (signed-in run item 5, PDF screenshot in artifacts).
- [x] A non-owner non-admin hitting the edit URL directly is redirected, and the server action rejects the update (RLS plus action check) (RLS probe: member 0 rows, owner 1, org admin 1; route 404 on a mismatched project; redirect logic mirrors NDOT and was not browser-driven for lack of a non-admin session).
- [x] Cancelling an edit leaves the submission unchanged (no photos on this form, so nothing in Storage to protect) (signed-in run item 4).
- [x] Existing submissions created before this change open in edit without error (no schema migration; 5 of 5 live rows parse, see evidence).
- [x] `pnpm build` and lint clean.
