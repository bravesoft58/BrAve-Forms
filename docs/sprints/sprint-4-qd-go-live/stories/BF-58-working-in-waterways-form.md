# BF-58: Working in Waters of the State daily inspection form

**Type:** New form type (schema, entry, view, PDF, inspector)
**Priority:** HIGH (needed for the Microsoft project phase; permit already advertises it)
**Points:** 5
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Gracie Damele via Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`), sample attached as `docs/reference/WIW Daily Form.pdf`
**Created:** 2026-09-20
**Last Updated:** 2026-09-24T12:53:30Z

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
