# BF-73: "Copy from previous" must not lose same-site or non-blank inspections to the 10-row limit

**Type:** Bug (the BF-70 equipment picker can hide the most useful entry, or the whole button)
**Priority:** MEDIUM (needs a project with more than ten recent inspections; Q&D's two waterway projects reach that within a week of daily forms)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-70 `/verify` round 1 (finding C2, Codex, medium), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:31:19Z

## Problem

`getRecentWaterwaysEquipment` in `src/lib/queries/projects.ts` reads the ten newest Working in Waterways inspections on the whole project. `orderPreviousEquipment` then drops rows with no equipment text and puts the current site's rows first. Because the cut happens in the query, before either step:

- On a project with two sites inspected daily, an inspection at the current site older than the last ten project-wide never reaches the list, even though it is the one the crew wants.
- If the ten newest inspections all left the equipment box blank, the picker has nothing to show and the button disappears, though older inspections have equipment listed.

## Proposed change

- Filter blank equipment in the query, not after it, so the limit counts only usable rows (PostgREST filter on the JSON path, for example `data->>equipment_in_use` not empty).
- Fetch the current site's candidates separately from the rest: one capped read for `data->>site_name = <site>` and one for the project, merged and de-duplicated by id, same site first. The site is known on the edit page; on the new page it changes in the form, so either pass all sites' top rows (one small read per site, sites are capped at 20) or keep a per-site cap in a single query ordered by site.
- Keep the edit page's "one extra" so the record being edited does not shorten the list.
- Keep the failure path: a failed read still hides the picker and never breaks the page (BF-70 C3).

## Technical Approach

**Build vs Use:** BUILD — no new dependency or module; extends the BF-70 query and helper with existing supabase-js filters. PostgREST has no top-N-per-group (no window functions), so the single-query per-site cap would need a view or RPC plus a production migration and grants. Reopen when the per-site read count shows up as measured page latency.

- `getRecentWaterwaysEquipment(projectId, siteNames, limit)` runs one capped read for the whole project plus one per site (`.eq("data->>site_name", site)`), in `Promise.all`. Every read applies `.filter("data->>equipment_in_use", "match", "\S")` before `.limit()`, so the limit counts only usable rows. The project-wide read also covers sites that were renamed or removed.
- `mergePreviousEquipment` de-duplicates the reads by id and sorts newest first (form date, then `created_at`, now selected). `orderPreviousEquipment` keeps same-site rows first, still drops blanks as a client-side backstop, and caps the list at `PREVIOUS_EQUIPMENT_LIMIT`.
- New page: the read moves after `getProjectById` (it needs the sites) and passes every site, because the site is picked in the form. Edit page: project sites plus the record's own site, with `PREVIOUS_EQUIPMENT_LIMIT + 1` per read. Both keep `.catch(previousEquipmentUnavailable)` (BF-70 C3).

## Research Sources

- PostgREST tables and views reference (fetched 2026-10-08): `match` maps to `~`; filters apply to `->` / `->>` JSON paths. https://docs.postgrest.org/en/stable/references/api/tables_views.html
- PostgreSQL pattern matching (fetched 2026-10-08): `\S` is `[^[:space:]]`, and `~` matches anywhere unless anchored. https://www.postgresql.org/docs/current/functions-matching.html

## Acceptance criteria

- [x] With eleven or more newer inspections at another site, an older inspection at the current site still appears at the top of the list.
- [x] With the ten newest inspections all blank, older inspections with equipment still show and the button stays.
- [x] Rows are still de-duplicated, newest first within each group, and the edited record is excluded.
- [x] Unit test on the merge helper; `pnpm build`, lint and the BF-70 tests clean.

## Comprehensive Validation (2026-10-08T16:31:19Z)

Run on the committed tree under Node 24 (`npx -p node@24`), pnpm 10.34.5.

| # | Test | Result | Key Finding |
|---|------|--------|-------------|
| 1 | `Testing/forms/bf73_equipment_history_test.ts` | PASS 9/9 | AC1 shows the project-wide read alone misses the older same-site row, and the merged reads put it on top. AC2 shows the BF-70 read would show nothing behind ten blanks, while the filtered read shows the older rows. AC3 covers de-duplication, date-then-save-time order, the edited record excluded with a full list of 10, and the cap. Static guards: the filter comes before the limit, and the per-site wiring is in place. |
| 2 | `Testing/forms/bf70_waterway_contact_picker_test.ts` | PASS 13/13 | Fixtures gained `created_at`. The C3 static guard now tolerates a line-wrapped `.catch(...)`. |
| 3 | `Testing/forms/bf70_render_test.ts` | PASS 6/6 | Picker markup unchanged. |
| 4 | `Testing/forms/bf73_equipment_filter_probe.ts` (read-only, production) | PASS 4/4 | The app's PostgREST filter on real data: a NULL JSON value is excluded; production's only Waterways row (blank equipment) is excluded, and the capped read returns 0; on a 16-row control key, exactly the 16 non-blank rows are kept. The per-site read was not exercised on real data because production has no Waterways row with equipment yet. Confirm on the preview with two sites. |
| 5 | `pnpm lint` | PASS | 0 errors; the 12 warnings are pre-existing and none are in touched files. |
| 6 | `tsc --noEmit` | PASS | |
| 7 | `pnpm build` | PASS | |

## Depends on

- [BF-70](BF-70-waterways-gracie-small-asks.md) (merged `d986c19`).
