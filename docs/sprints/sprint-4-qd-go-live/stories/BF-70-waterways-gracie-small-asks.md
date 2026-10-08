# BF-70: Working in Waterways: sheen contact, photo wording, copy equipment from a previous inspection

**Type:** Feature (three small changes to the Working in Waterways form, bundled)
**Priority:** HIGH (direct requests from Q&D's environmental lead after her first live test; all cheap)
**Points:** 3
**Status:** DONE
**Sprint:** 4 (backlog)
**Started:** 2026-10-08T15:15:24Z
**Completed:** 2026-10-08T15:59:11Z
**Reported by:** Gracie's handwritten notes on her 2026-10-07 test submission, forwarded by Andy Breen 2026-10-08. Filed under [docs/reference/WIW-Gracie-comments-2026-10-08.pdf](../../../reference/WIW-Gracie-comments-2026-10-08.pdf) and [docs/reference/RE BrAve Forms Update 2026-10-08.msg](../../../reference/RE%20BrAve%20Forms%20Update%202026-10-08.msg).
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T15:59:11Z

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

- [x] Admin can set and clear the waterway contact on the project edit page; the saved values survive a reload. A non-admin cannot change them (column grant plus existing policy).
- [x] With a contact set, the sheen/plume row shows "If yes, call {name} at {phone} immediately." on the new and edit forms; with none set, nothing extra is shown.
- [x] Waterways photo section reads "Attach at least one overview photo of the waterway work today." once; the NDOT and NDEP photo sections still read as before.
- [x] "Copy from previous" lists earlier inspections on the project, same site first, and fills the equipment box with the chosen one; the box stays editable and the form submits what is on screen.
- [x] Project with no earlier waterway inspection: no button.
- [x] Migration applied to production with the column grant; `pnpm build`, lint and tests clean; no production file over 300 lines.
- [ ] Gracie confirms the three changes from the live app (closeout gate, as BF-58.2).

## Depends on

- Nothing. BF-72 depends on this ticket's contact field.

## Validation (story session, 2026-10-08T15:23:40Z)

Worktree `e:/brave-forms-worktrees/BF-70`, branch `feature/BF-70-waterways-small-asks`, Node 24 + pnpm 10.34.5 via `npx`.

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | `Testing/forms/bf70_waterway_contact_picker_test.ts` (schema fields, contact reader, picker ordering, static wiring guards) | PASS 10/10 | `node --import ./Testing/forms/ts-alias-hooks.mjs ...` |
| 2 | Regressions: bf58_1 schema 16/16, bf66 form reset 4/4, bf65 record integrity 15/15, bf58_2 PDF 7/7 | PASS | same harness |
| 3 | `tsc --noEmit`, `pnpm lint` (0 errors; 12 pre-existing warnings, none introduced), `pnpm build` | PASS | all routes compiled |
| 4 | Migration rehearsal in production inside a `DO` block that raises at the end (rolled back): `has_column_privilege` update=t select=t insert=t, anon update=f | PASS | rehearsal before apply |
| 5 | Migration applied via Supabase MCP `apply_migration`, recorded as version `20261008152320`; live re-check: authenticated UPDATE and SELECT true, anon UPDATE false on all three columns | PASS | repo file renamed to match the recorded version |
| 6 | Line counts: project-form.tsx 300 -> 251 (ContactGroup extracted), WaterwaysForm.tsx 213, WaterwaysChecks.tsx 92, picker 84, helper 41 | PASS | all under the 300-line ceiling |

Browser-dependent criteria (admin set/clear and reload, hint on the live form, picker fill, no-button case) are left for `/verify` and the signed-in preview run; the code paths are covered by the unit and static tests above. The picker was built inline (no dialog or popover) per the scout note on iOS Safari.

Production data note: the migration adds three nullable columns to `projects`; no rows changed. Rollback: `supabase/migrations/_rollback/20261008152320_rollback.sql`.

## Verify round 1 (2026-10-08T15:59:11Z): PASS 9.4

Two reviewers: the verify session and Codex (`gpt-6-astra`, xhigh). Codex's shell and file tools failed to start (Windows sandbox setup error) on both `adversarial-review` attempts, so it reviewed in `task` mode from a pasted bundle: the full branch diff, nine full context files, the BF-60 grants migration, the projects and submissions policies, and this story. It then confirmed the fix commit. Verdict computed by `verify_verdict.py`; machine stamp recorded by `verify_stamp.py` (round 1, bound to `66754b4`).

| # | Finding | Raised by | Severity | Status |
|---|---------|-----------|----------|--------|
| C1 | Picker rows stayed clickable while the form saved (only the toggle took `disabled`): a pick after Submit changed the screen, not the record | both | medium | fixed in `66754b4` |
| C2 | The 10-row limit is applied project-wide before same-site ordering, so an older same-site inspection can drop out of the list; ten recent blank-equipment rows hide the button | Codex | medium | follow-up ticket (the story specified the cap; needs a per-site candidate query) |
| C3 | A failed history read broke the whole new/edit inspection page (awaited in `Promise.all` with the required data) | both | medium | fixed in `66754b4`: `.catch(previousEquipmentUnavailable)` logs and renders the form without the picker |
| V2 | Hint and no-button behaviour were proven only by source-text regexes | both | low | fixed: `Testing/forms/bf70_render_test.ts` renders both to HTML |
| V1 | The migration comment says a missing column grant fails silently; PostgreSQL raises 42501 instead | verify | low | noted (the file is applied; no runtime effect) |
| V3 | A contact with a phone but no name shows no hint | verify | low | noted (follows the spec: a name is required) |
| V4 | Codex reviewed a pasted bundle, not the repo | verify | low | noted (sandbox to be repaired) |
| V5 | No signed-in browser run in this headless verify | verify | low | noted (covered by the AC 7 closeout gate) |

| Check | Result |
|-------|--------|
| Unit and render tests (Node 24.21.0): bf70 13, bf70 render 6, bf58_1 schema 16, bf65 15, bf66 4, bf58_2 PDF 7 | 61 pass, 0 fail |
| `tsc --noEmit`, `eslint` (0 errors, the same 12 pre-existing warnings), `next build` | clean, on the committed tree |
| `Testing/security/bf70_contact_grant_probe.sql` on production, read-only (session pooler, `BEGIN READ ONLY` then `ROLLBACK`) | 18/18: migration recorded; three nullable text columns; `authenticated` UPDATE and SELECT on each; `anon` neither; no table-wide UPDATE; every UPDATE policy requires `is_org_admin` |

AC 1, 2, 4 and 5 are ticked on code, unit and render tests, the build and the production catalog probe. The live signed-in run is part of AC 7.

## Technical Approach

Scouted 2026-10-08 (commit b78b42d; code graph rebuilt from the same commit). No new dependencies. Everything here copies a pattern already in the repo.

**Build vs Use**

| Component | Verdict | Pattern to copy | Reopen when |
| --- | --- | --- | --- |
| Waterway contact columns + grant | COPY | `superintendent_*` triple in the initial schema; the `GRANT UPDATE (cols)` block for `projects` in migration `20260928194436_default_table_grants.sql` | n/a |
| Contact form fields | COPY | `ContactGroup` in `project-form.tsx` (name, phone, email with `optionalPhone` / `optionalEmail` from `schemas/project.ts`) | n/a |
| Sheen hint | BUILD (one line) | hint rendered inside `WaterwaysChecks` under the `sheen_or_plume` row, phone as a `tel:` link | n/a |
| Photo wording | BUILD (one prop) | `PhotoAttachment` gains `hint?: string` defaulting to the current sentence | n/a |
| "Copy from previous" picker | BUILD (small, no library) | `DailyDustLog` "Use Previous" button + `getProjectSubmissions` JSON-path select (`site_name:data->>site_name`) | the app adopts a headless UI kit, or a second picker of this shape appears |

**Migration.** `ALTER TABLE public.projects ADD COLUMN waterway_contact_name text, waterway_contact_phone text, waterway_contact_email text;` then `GRANT UPDATE (waterway_contact_name, waterway_contact_phone, waterway_contact_email) ON TABLE public.projects TO authenticated;` in the same file. Postgres evaluates column UPDATE privilege per column or whole table, and BF-60 revoked the whole-table grant, so a column added without its own grant is read-only to every admin while the UPDATE returns no error (verified against the PostgreSQL 15 GRANT reference, 2026-10-08). INSERT on `projects` is still table-wide, so `createProject` needs nothing new. `getProjectById` selects `*`, so the new columns reach every page that already loads the project. Prove the grant in the migration's rehearsal with `has_column_privilege('authenticated', 'public.projects', 'waterway_contact_email', 'UPDATE')`, the way BF-60 tested effects rather than catalog rows.

**Schema and action.** Add the three fields to `projectCreateSchema` (reuse `optionalString`, `optionalPhone`, `optionalEmail`), to `parseProjectForm`, and to `buildProjectFields` in the projects action (`|| null` like the other contacts). `project-form.tsx` is at the 300-line ceiling (BF-66 verify), so move `ContactGroup` and its `FieldError` into `src/components/projects/ContactGroup.tsx` first, then add `<ContactGroup title="Waterway contact" prefix="waterway_contact" />` under Contacts. BF-67 asks for the same move; whichever story lands first does it and the other rebases.

**Hint.** `WaterwaysForm` takes a new optional prop `waterwayContact?: { name: string; phone: string }` and passes it to `WaterwaysChecks`, which renders under the `sheen_or_plume` row: "If yes, call {name} at {phone} immediately." with the phone in `<a href="tel:...">`. Both the new and edit pages already hold `project`, so they pass `project.waterway_contact_name` / `_phone` when the name is set. Nothing on the view page, inspector detail or PDF. Optional follow-on, not in scope: the inspector portal's contact list in `InspectorPortal.tsx` could show the waterway contact beside Superintendent and Foreman.

**Photo wording.** `PhotoAttachment` gets `hint?: string`; the paragraph that now reads "Attach digital photographs of deficiencies or other noted issues of concern." renders `hint ?? <that sentence>`. `WaterwaysForm` passes "Attach at least one overview photo of the waterway work today." and drops its own "At least one photo is required..." line above the component, so the section says it once. The NDOT and NDEP forms pass nothing and are unchanged.

**Picker.** Data: a new narrow query in `src/lib/queries/projects.ts`, `getRecentWaterwaysEquipment(projectId, limit = 10)`, selecting `id, form_date, site_name:data->>site_name, initials:data->>initials, equipment:data->>equipment_in_use` from `form_submissions` where `form_type = 'working_in_waterways'`, ordered by `form_date` desc then `created_at` desc. PostgREST's `->>` alias form and JSON ordering are documented (PostgREST tables/views reference, checked 2026-10-08); the `site_name:data->>site_name` select already in `getProjectSubmissions` is the in-repo proof. The read is covered by the org-scoped `submissions_select` policy (migration `20260504160000_org_scoped_visibility.sql`), so a crew member sees colleagues' inspections on the same project. Both the new and edit pages call it and pass `previousEquipment` to `WaterwaysForm`; the edit page excludes the record being edited.

UI: a `type="button"` "Copy from previous" next to the equipment label (the BF-66 form test enforces `type="button"` on non-submit buttons; keep it). Clicking toggles an inline list rendered directly under the textarea: one button per earlier inspection, label "{date} · {site} · {initials}", second line the first 80 characters of its equipment text, entries with empty equipment skipped, rows for `draft.site_name` sorted first. Choosing one sets `equipment_in_use` and closes the list. No `<dialog>`, no popover: the Popover API is Baseline since 2025 but still partial on iOS Safari (MDN browser-compat issue #22927, Stack Overflow 79904650 on the `overflow` workaround, checked 2026-10-08), and the crews are on iPhones. An inline disclosure has no top-layer, focus-trap or scroll-lock behaviour to get wrong. Hidden when the list is empty. Keep the list in its own file, `WaterwaysEquipmentPicker.tsx`, so `WaterwaysForm.tsx` (200 lines) stays under the ceiling.

**Tests.** Extend `Testing/forms/bf58_1_waterways_schema_test.ts` (or a new `bf70_*` file) with: the projects schema accepting and trimming the three fields and rejecting a bad email; the picker's ordering helper (same-site first, empties dropped, edit record excluded) as a pure function in `src/lib/forms/waterways-previous-equipment.ts`; and the BF-66 form test still passing with the new button.

**Forward conflicts.** BF-67 (ContactGroup extraction, sequence matters, no collision). BF-64 and BF-68 touch `PhotoAttachment` (benign: this story adds one prop). BF-71 adds photo fields to `PhotoAttachment` (benign, but land this first; it is smaller). BF-72 consumes the contact email (depends on this story).

**Size check.** Three points holds. The migration, schema and form changes are mechanical; the picker is the only new UI and is one small component plus one query.

## Research Sources

- PostgreSQL 15 GRANT reference (firecrawl_scrape, 2026-10-08): https://www.postgresql.org/docs/15/sql-grant.html. Column privilege is checked per column or whole table; a table-level revoke plus column grants means every new column needs its own grant.
- Supabase column-level security guide (firecrawl_search, 2026-10-08): https://supabase.com/docs/guides/database/postgres/column-level-security. `revoke update on table ... from authenticated; grant update (cols) on table ... to authenticated;` is the documented pattern, matching BF-60.
- PostgREST tables and views reference (firecrawl_scrape, 2026-10-08): https://docs.postgrest.org/en/latest/references/api/tables_views.html. JSON path select with `->>`, alias with `alias:col`, ordering on JSON paths.
- Supabase JSON guide (firecrawl_search, 2026-10-08): https://supabase.com/docs/guides/database/json. `->>` returns text.
- MDN dialog element (firecrawl_search, 2026-10-08): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog. Native modal available if a modal is ever wanted; not used here.
- MDN Popover API (firecrawl_search, 2026-10-08): https://developer.mozilla.org/en-US/docs/Web/API/Popover_API, and browser-compat issue https://github.com/mdn/browser-compat-data/issues/22927 (iOS Safari partial), Stack Overflow https://stackoverflow.com/questions/79904650/native-html-popovers-dont-work-on-safari-ios. Reason the picker is an inline list.
- Headless listbox options surveyed and not adopted (firecrawl_search, 2026-10-08): https://headlessui.com/v1/react/listbox, https://www.greatfrontend.com/blog/top-headless-ui-libraries-for-react-in-2026, https://react-select.com/. A ten-row single-tap list does not justify a dependency.
