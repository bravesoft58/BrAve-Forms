# BF-58: Working in Waters of the State daily inspection form

> **SPLIT 2026-09-25T14:41:20Z (Tim):** built as [BF-58.1](BF-58.1-waterways-form-core.md) (5 SP: migration, sites, entry, view, edit) and [BF-58.2](BF-58.2-waterways-form-pdf-inspector.md) (3 SP: PDF, inspector, today indicator, Gracie sign-off). This file stays the design record both children point at; it is not worked directly. BF-58.1 merged 2026-09-25 (`e96a8df`). When BF-58.2 closes out, set this file to DONE with the same Completed time, so sprint progress (which counts this file) can reach complete.

**Type:** New form type (schema, entry, view, PDF, inspector)
**Priority:** HIGH (needed for the Microsoft project phase; permit already advertises it)
**Points:** 8 (5 + 3, see children; was 5)
**Status:** SPLIT
**Depends On:** BF-58.1 (merged), BF-58.2 (pending)
**Sprint:** 4
**Reported by:** Gracie Damele via Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`), sample attached as `docs/reference/WIW Daily Form.pdf`
**Created:** 2026-09-20
**Last Updated:** 2026-09-25T17:07:55Z

## Request (verbatim)

Andy:

> Need to add Working In Waterways forms. They will/are tied to Waterway NDEP permit (right now if you add Waterway NDEP permit to a project it list the working in waterways form but says it is coming in next sprint).

Gracie:

> Eventually I will need some Working In Waterways forms for the Microsoft project. Maybe something like the attached? It doesn't have to look a certain way as long as the information is the same. These are the forms that vary depending on the project. This project will need two completed each day when this phase starts, one for each waterway location.

## The sample form

Two pages, identical except for the site. Q&D letterhead, title "Working in Waters of the State Daily Inspection", project "Microsoft RNO18 Main Campus". Page 1 site: Western Drainage. Page 2 site: Eastern Drainage.

| Field | Type | Comments column |
| --- | --- | --- |
| Date, Time, Initials | header | |
| Site | header (per-project list of waterway locations) | |
| Is there water in the waterway? | Yes / No | yes |
| Daily Vehicle Inspection | Pass / Fail | yes |
| BMPs Visual Inspection | Pass / Fail | yes |
| Visible sheen/plume? | Yes / No / N/A | yes |
| Photo taken? | Yes / No | yes |
| Equipment in use in and around waterway today | free text, several lines | |

Gracie's requirements reduce to: one submission per site per day, the six items above, and the information preserved. Layout is ours to choose.

## Current state

- The permit type `waterway` exists in the permits constants with the label "Waterway — NDEP" and an empty form list. Selecting it on a project produces the "coming next sprint" placeholder Andy describes.
- No form type, Zod schema, entry page, view page, PDF renderer, or inspector renderer exists for it. The five shipped form types are Daily Dust Log, NDEP Stormwater, NDOT Stormwater, NDEP SAD, NNPH Dust Permit.
- The shared pieces to reuse: `PhotoAttachment` (photos, private bucket, signed URLs), `FormActions` (back, edit, PDF), the per-type renderers in the inspector portal's `FormDetail`, and the PDF route's per-type templates.
- The Daily Dust Log is the closest existing shape (a daily form). Its append-only JSON-array model is NOT the model here: each site-day is its own submission, like the weekly stormwater forms.

## Proposed change

1. **Form type.** Add `working_in_waterways` (name to confirm) to the form type enum used by `form_submissions.form_type`, the `FormType` union in `FormActions`, and the permit-to-forms map so the `waterway` permit lists it.
2. **Sites per project.** Add a per-project list of waterway sites. Smallest option: a `waterway_sites text[]` column on `projects` edited in the project form when the waterway permit is checked. Alternative: a `project_waterway_sites` table if sites need their own metadata later. Recommend the column; confirm.
3. **Schema.** Zod schema with: `site` (must be one of the project's sites), `inspection_date`, `inspection_time`, `initials`, five check items each with a value enum and optional `comment`, `equipment_in_use` text, photos via the existing photo model. Store in `form_submissions.data` like the other forms; no new table.
4. **Entry page** at `forms/working-in-waterways/new` with site selector, the six items laid out as rows with a comments field each, equipment text area, photo attachment. Default date to the project-local date (do not repeat the UTC-date-with-local-time mix the dust log has).
5. **View page and Edit.** Build edit in from the start (add to `EDIT_SUPPORTED`); do not ship another form with a disabled Edit button.
6. **PDF.** One page per submission, Q&D header, project, site, the table above, equipment block, photos appended. Matches the information in the sample; layout is ours.
7. **Inspector portal.** Add the per-type renderer so inspectors see these forms under the project.
8. **Two per day.** Enforce at the UI level: the project's form list shows which sites have a submission for today and which do not. Do not hard-block a second submission for the same site-day (corrections happen); show it as a duplicate warning.

## Technical Approach (scout, 2026-09-24T21:04:57Z)

**Build vs Use:** BUILD by COPYING the repo's own form pattern (NDEP stormwater, with the BF-57 edit action), plus USE of what is already installed (`@react-pdf/renderer`, Zod, `PhotoAttachment`, `Intl`). No new dependencies.

| Component | Library found? | Verdict | Why / reopen when |
| --- | :---: | --- | --- |
| Form engine for the inspection form | Yes: schema-driven form engines exist, for example the MIT HSE platform `braedonsaunders/beaconhs` | BUILD (copy the NDEP pattern) | Every shipped form is hand-built on server actions, `useActionState` and Zod. One more form does not justify a platform change. Reopen when three or more further per-project-variable forms are requested (Gracie called these "forms that vary depending on the project"). |
| Editable waterway sites list (name + optional descriptor) | Yes: react-hook-form `useFieldArray` (7.88.0, MIT) | BUILD (small `useState` list rendering repeated named inputs, read with `formData.getAll`) | The repo does not use react-hook-form; the project form already submits repeated permit inputs this way. Adding a form library for one field diverges from every other form. Reopen when the app adopts react-hook-form. |
| Project-local date ("today" in Nevada) | Yes: `@date-fns/tz` 1.5.0, `date-fns-tz` 3.2.0 | USE the built-in `Intl.DateTimeFormat` with `timeZone: "America/Los_Angeles"` | The runtime supports named time zones natively, so no dependency is needed. |
| PDF | Installed: `@react-pdf/renderer` (lockfile 4.3.2; 4.9.0 current) | USE | Snyk lists no direct vulnerabilities as of 4.9.0. The NDOT PDF already embeds signed-URL photos in production. No upgrade needed for this story. [verified 2026-09-24] |
| Validation | Installed: Zod 3.24.4 (3.25.76 latest 3.x; Zod 4 ships inside 3.25 as a subpath) | USE Zod 3 as is | No migration in scope. [verified 2026-09-24] |

### What exists (codebase recon, master `57ba781`, graph fresh)

- **Every form type is hand-wired in about 13 places.** Each needs the new `working_in_waterways` entry:
  - `FORM_TYPES`, `FORM_LABELS` and `PERMIT_FORM_MAP` (`src/lib/constants/permits.ts`).
  - `FORM_ROUTE_MAP` in `ProjectTabs.tsx` and in `dashboard/forms/page.tsx`.
  - The `FormType` union and `EDIT_SUPPORTED` in `form-actions.tsx`.
  - The PDF `registry`, `getPdfFilename`'s `typeMap`, and the PDF route's `permitTypeMap` and `PHOTO_SUBPATH`.
  - `PHOTO_STORAGE_PATHS` in `queries/inspector.ts`.
  - The `FormDetail` switch.
  - The two database CHECK constraints below.
- **Database constraints.** `form_submissions_form_type_check` and `project_form_requirements_form_type_check` both enumerate the five form types. The migration must drop and re-add both with `working_in_waterways`. The tables are small, so a plain validating `ADD CONSTRAINT` is fine and `NOT VALID` is unnecessary. `project_permits` already allows `waterway`.
- **Two production projects already carry the Waterway permit but have no requirement row:** `17254 NDOT 4541 7 Bridges` and `17446 - RNO 18 Main Campus` (the Microsoft project in Gracie's sample). Requirements are only derived when a project is created or edited (`deriveFormTypes` in the project actions). The migration must backfill `project_form_requirements (project_id, 'working_in_waterways', 'auto_permit')` for every project with a `waterway` permit, or neither project shows the tab until someone edits it.
- **The BF-41 placeholder** (`WATERWAY_PLACEHOLDER_KEY`, "queued for the next sprint") lives in `ProjectTabs.tsx`. Remove it once the real tab exists.
- **`getProjectById` selects `*`** (graph god node #2, 31 edges), so a new `projects.waterway_sites` column flows through with no query change.
- **Photos:**
  - Storage policies key on path segment 2 (the project ID), so `projects/{id}/working-in-waterways/` needs no storage change.
  - `photoSchema` is private to `lib/schemas/ndot-stormwater.ts` (only the `FormPhoto` type is exported). With a second user, move it to a shared schema module.
  - The photo subfolder is hand-listed in the PDF route and in the inspector queries. Make it one shared map.
  - The NDOT actions dual-write `form_photos`; copy that.
- **Dates:** every existing form defaults its date with `toISOString().split("T")[0]` (UTC), so after 5 pm PDT the default is tomorrow. BF-58 needs a small helper that returns the date in `America/Los_Angeles`. The server-side "sites with a form today" check needs the same helper, because Vercel functions run in UTC. Fixing the other five forms is out of scope; file it separately.

### Recommended design

1. **Migration.**
   - Add `projects.waterway_sites jsonb NOT NULL DEFAULT '[]'` with `CHECK (jsonb_typeof(waterway_sites) = 'array')`.
   - Extend both form-type CHECKs.
   - Backfill the requirement rows.
   - Include a rollback pair and rehearse it rolled back, as BF-56 did.
2. **Sites editor.** Add a new `WaterwaySitesField.tsx`, shown in the project form when the Waterway permit is ticked. It renders repeated `waterway_site_name` / `waterway_site_descriptor` inputs. `parseProjectForm` reads them with `getAll`, and the Zod schema validates non-empty, de-duplicated names. `buildProjectFields` writes `waterway_sites`.
3. **Form data.**
   - Fields: `site_name` and `site_descriptor`, snapshotted into the submission; `inspection_date`, `inspection_time` and `initials`.
   - **Four** check items, each with a value and a comment:
     - water in the waterway: Yes/No
     - daily vehicle inspection: Pass/Fail
     - BMPs visual inspection: Pass/Fail
     - visible sheen or plume: Yes/No/N/A
   - `equipment_in_use`, and `photos.min(1)`.
4. **Server actions** (copy the NDEP actions from BF-57):
   - The submit action re-reads the project's sites and rejects a site name that is not in the list.
   - The edit action accepts either the stored snapshot name or a current site, so renaming a site later does not lock the old record.
   - Ownership: admin or submitter.
   - Chain `.select("id").maybeSingle()` on the update, so an RLS refusal is reported instead of silently affecting 0 rows.
5. **Pages:** `new`, `[submissionId]` (view) and `[submissionId]/edit` under `forms/working-in-waterways/`, mirroring NDEP.
6. **Inspector:** a new `WorkingInWaterwaysDetail.tsx` imported by `FormDetail`, not written inside it (see the modularity note).
7. **"Sites with a form today"** (AC 4): information only, in the project's Working in Waterways tab, comparing today's date in `America/Los_Angeles` against `form_date`.

### Gotchas to carry into /story

- **The story's count is wrong.** Dropping "Photo taken?" leaves **four** check items, not five.
- **Phone photos can render rotated in PDFs.** `@react-pdf/renderer` ignores EXIF orientation in some cases (react-pdf issues #1848, #2972). `PhotoAttachment` compresses in the browser, which usually normalizes orientation; confirm with a real phone photo in the Gracie review.
- **`@react-pdf/renderer` has a reported memory growth under repeated `renderToBuffer` in Node** (#3051). This is existing behaviour, not new; watch function memory if PDFs are generated in bulk.
- **Service-layer duplication** (photo schema, photo subfolder map): extract on this second caller, per the service-layer rule.
- **BF-49 conflict.** BF-49 (stormwater auto-assign choice, not started) rewrites `PERMIT_FORM_MAP` and quotes `waterway: []`. Whichever merges second rebases.

### Modularity

- `FormDetail.tsx` is already 579 lines and `project-form.tsx` is 291. Put the new renderer and the sites editor in their own files.
- Keep the entry form under 300 lines. A header section plus a checks section, as NDEP splits its sections, will do.

### Feasibility

**FEASIBILITY CONCERN.** The closest comparable, NDEP stormwater, is about 1,700 lines across schema, actions, form, pages and PDF. BF-58 is smaller per form, but it adds a migration with a backfill, a project-setup editor, an inspector renderer, the today indicator and shared-code extractions. The estimate is about 900 to 1,100 production lines, against a 5 SP budget of 400 (800 at the 2x ceiling). Recommend one of:
- **Split:**
  - **BF-58a (5 SP):** migration and backfill, sites editor, constants, schema, entry, view and edit.
  - **BF-58b (3 SP):** PDF, inspector renderer, today indicator, and Gracie's sign-off.
- **Or re-estimate** as a single 8 SP story.

Either way, `/story` runs through EnterPlanMode (5+ SP).

## Research Sources

- Codebase and production reads (2026-09-24): CHECK constraint definitions via `pg_constraint`; `form-attachments` storage policies via `pg_policies`; project permits against form requirements for all 5 projects. `graphify update .` at `57ba781`: `getProjectById` has 31 edges (god node #2); `PhotoAttachment` has one container edge. [verified 2026-09-24]
- `npm view`: `@react-pdf/renderer` 4.9.0 (2026-08-27); zod 4.6.5, latest 3.x 3.25.76; react-hook-form 7.88.0; `date-fns-tz` 3.2.0; `@date-fns/tz` 1.5.0. [verified 2026-09-24]
- firecrawl_search "@react-pdf/renderer vulnerability OR CVE…" → https://security.snyk.io/package/npm/%40react-pdf%2Frenderer → no direct vulnerabilities, latest 4.9.0. The same search's CVE-2024-34342 hit is the separate `react-pdf` viewer package, not the renderer. [verified 2026-09-24]
- firecrawl_search "react-pdf renderer Image remote URL…" → https://github.com/diegomura/react-pdf/issues/3051 → memory growth under repeated `renderToBuffer` in Node.
- firecrawl_search "react-pdf.org Image component src object…" → https://react-pdf.org/docs/v2/components → Image takes network or local JPG/PNG or base64; https://github.com/diegomura/react-pdf/issues/1736 → the `{uri, method, headers}` form for remote images.
- firecrawl_search "react-pdf renderer 4.x Image … EXIF rotated…" → https://github.com/diegomura/react-pdf/issues/1848 and https://github.com/diegomura/react-pdf/issues/2972 → phone JPEGs rendered rotated (EXIF orientation).
- firecrawl_search "zod 3 maintenance status after zod 4…" → https://github.com/colinhacks/zod/issues/5239 → Zod 3.25+ ships both v3 and v4. https://zod.dev/v4 → v4 release notes. No reason to migrate for this story.
- firecrawl_search "get today's date in a specific time zone Intl.DateTimeFormat…" → https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat → the `timeZone` option with IANA zones such as `America/Los_Angeles`.
- firecrawl_search "PostgreSQL add value to CHECK constraint…" → https://www.postgresql.org/docs/current/sql-altertable.html → drop and re-add the CHECK; `NOT VALID` only skips the scan of existing rows (not needed for small tables).
- firecrawl_search "react dynamic repeating field list … useFieldArray…" → https://react-hook-form.com/docs/usefieldarray → the field-array API (considered, not adopted; see Build vs Use).
- firecrawl_search "Next.js server actions useActionState dynamic list inputs FormData getAll…" → https://www.robinwieruch.de/next-forms/ and https://ui.shadcn.com/docs/forms/next → native `useActionState` + Zod server-action forms with dynamic fields; this matches the repo's pattern.
- firecrawl_search "open source daily inspection checklist form builder…" → https://github.com/braedonsaunders/beaconhs → a full HSE platform with its own form engine (considered, not adopted).
- firecrawl_scrape https://react-pdf.org/components → the page did not answer the Image-source question (docs moved to /docs/v4); covered by the search results above.
- Not run: Phase 2g literature search. The story is plumbing on established patterns, with no technique to ground.

## Acceptance criteria

- [ ] A project with the Waterway NDEP permit lists the Working in Waterways form with no placeholder text.
- [ ] Project admins can define the project's waterway sites in project setup: a name plus an optional descriptor such as coordinates or mile markers. The Microsoft project can carry "Western Drainage" and "Eastern Drainage".
- [ ] A user can submit one form per site with every field from the sample except "Photo taken?", including a comment for each check item. The server rejects a submission that has no photo.
- [ ] The project's daily view shows which sites have a submission today. This is information only, with no outstanding warning, because forms are filled in only on days of in-water work.
- [ ] View page, Edit (owner or admin), and PDF work; the PDF contains every field and the site name.
- [ ] The inspector portal renders the form read-only.
- [ ] RLS: same organization-scoped visibility and BF-43 edit ownership as the other forms, verified with an ordinary user and an admin.
- [ ] Gracie reviews the rendered form and PDF against the sample and signs off that the information matches.
- [ ] `pnpm build` and lint clean.

## Open questions (answered 2026-09-24)

Q&D's answers came back through Tim on 2026-09-24, after Andy's review with Gracie. The first-person answers are Gracie's, confirmed by Tim. Also settled: inspectors reach this form through the project's single QR code (BF-56 decision).

1. **Sites.** Site names are sufficient. When one job has several locations, Q&D sometimes adds a second descriptor such as coordinates or mile markers. Sites are not added or removed during the project. They suggested an optional field on the project setup page.
2. **Daily vs phase.** The form is filled in only on days a crew works in the water. That phase is usually a part of a larger job and ends before the job does. The respondent would own an on/off switch but called it "not the most important thing". When the in-water work ends, the foreman simply stops filling in forms.
3. **Photo taken?** Drop the Yes/No box, because photos are attached directly. Make it clear that at least one photo is expected for every day of in-water work.

### Design impact (proposed, confirm at /story)

- **Sites model.** Each site is a name plus an optional descriptor. The earlier `text[]` proposal no longer fits. Use a `waterway_sites jsonb` column on `projects` holding `[{name, descriptor}]`, edited in the project setup form when the Waterway NDEP permit is checked. There is no separate table. Admins can still edit the list to fix setup mistakes. Each submission copies the site name and descriptor into its own data, so a later edit to the list cannot rewrite past records.
- **No phase switch.** Drop the on/off control. Rewrite AC 4 as information only: show which sites have a submission today. There is no "outstanding" warning, because a day with no in-water work legitimately has no form.
- **Photos.** Remove the "Photo taken?" row, which leaves five check items. The Zod schema requires at least one photo (`photos.min(1)`), enforced on the server at submit and at edit. This works because `PhotoAttachment` uploads photos before submit and they arrive in the form data. The form states the one-photo rule next to the photo control.
