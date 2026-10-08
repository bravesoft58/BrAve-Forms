# BF-70: Working in Waterways: sheen contact, photo wording, copy equipment from a previous inspection

**Type:** Feature (three small changes to the Working in Waterways form, bundled)
**Priority:** HIGH (direct requests from Q&D's environmental lead after her first live test; all cheap)
**Points:** 3
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** Gracie's handwritten notes on her 2026-10-07 test submission, forwarded by Andy Breen 2026-10-08. Filed under [docs/reference/WIW-Gracie-comments-2026-10-08.pdf](../../../reference/WIW-Gracie-comments-2026-10-08.pdf) and [docs/reference/RE BrAve Forms Update 2026-10-08.msg](../../../reference/RE%20BrAve%20Forms%20Update%202026-10-08.msg).
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T14:35:51Z

## Problem

Gracie printed a Working in Waterways submission (17254 NDOT 4541 7 Bridges, site "drainage 1") and wrote five asks on it. Andy's email lists three. This ticket bundles the three small ones (Tim, 2026-10-08). The other two are [BF-71](BF-71-photo-download-coordinates.md) (download photos, with coordinates) and [BF-72](BF-72-sheen-plume-email-alert.md) (email alert when sheen/plume is Yes).

1. **Sheen/plume contact.** Next to "Visible sheen/plume?" she wants "(if yes, call Gracie immediately)". Tim ruled 2026-10-08 that the name is not hard-coded: BrAve Forms is planned for other customers, so the contact is a project-level field. Org-level defaults are deferred until a second customer needs them.
2. **Photo wording.** She highlighted "Attach digital photographs of deficiencies or other noted issues of concern." That sentence lives in the shared `PhotoAttachment` component and is right for the stormwater forms, not for a daily waterway photo. Her wording: "attach at least one overview photo of the waterway work today".
3. **Copy equipment from a previous inspection.** "Copy from previous would be helpful for this section." Tim chose a picker over a same-site/whole-project switch (2026-10-08): no setting to maintain, and it handles gear moving between the two waterway locations on a job.

## Proposed change

### Contact field
- Migration: add `waterway_contact_name`, `waterway_contact_phone`, `waterway_contact_email` to `projects`, following the superintendent/foreman triples. Since BF-60, project updates are column-granted: the migration must `GRANT UPDATE` on the three new columns to `authenticated` in the same file, or admin edits of the field are refused silently.
- `projectSchema` (`src/lib/schemas/project.ts`) and the project actions accept the three fields; the project form renders a `ContactGroup` titled "Waterway contact" (shown when the project has a waterway permit, or always; builder's call, keep it simple). `project-form.tsx` is at the 300-line ceiling, so `ContactGroup` moves to its own file first (the same move BF-67 asks for; whichever ticket lands first does it).
- `WaterwaysChecks` renders a hint under the sheen/plume row: "If yes, call {name} at {phone} immediately." The form page passes the project's contact in. No contact set: no hint. The PDF template (`src/lib/pdf/working-in-waterways.tsx`) does not need the hint; it is a record, not an instruction.
- BF-72 sends its email to `waterway_contact_email`, so this field is the first half of that story.

### Photo wording
- `PhotoAttachment` takes an optional `hint` prop (default: the current deficiencies sentence, so the other forms are unchanged). The waterways form passes "Attach at least one overview photo of the waterway work today." and drops its own duplicate line above the component, or keeps one of the two; not both.

### Copy from previous (picker)
- A "Copy from previous" button beside the equipment textarea. It opens a small list of the project's recent Working in Waterways submissions (date, site, initials, first line of equipment), most recent at the same site first, capped at about ten. Choosing one replaces the textarea's text; the crew member edits before submitting.
- Data: the page already loads the project's submissions for `waterwaySitesToday`; extend that select with `data->>equipment_in_use`, `data->>inspection_date`, `data->>initials` and pass the list to the form. No new query path, no new RLS surface.
- Empty project (no earlier inspection): the button is hidden.
- Edit page: same picker, same behaviour.

## Acceptance criteria

- [ ] Admin can set and clear the waterway contact on the project edit page; the saved values survive a reload. A non-admin cannot change them (column grant plus existing policy).
- [ ] With a contact set, the sheen/plume row shows "If yes, call {name} at {phone} immediately." on the new and edit forms; with none set, nothing extra is shown.
- [ ] Waterways photo section reads "Attach at least one overview photo of the waterway work today." once; the NDOT and NDEP photo sections still read as before.
- [ ] "Copy from previous" lists earlier inspections on the project, same site first, and fills the equipment box with the chosen one; the box stays editable and the form submits what is on screen.
- [ ] Project with no earlier waterway inspection: no button.
- [ ] Migration applied to production with the column grant; `pnpm build`, lint and tests clean; no production file over 300 lines.
- [ ] Gracie confirms the three changes from the live app (closeout gate, as BF-58.2).

## Depends on

- Nothing. BF-72 depends on this ticket's contact field.
