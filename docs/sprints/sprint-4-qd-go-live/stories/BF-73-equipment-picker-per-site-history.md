# BF-73: "Copy from previous" must not lose same-site or non-blank inspections to the 10-row limit

**Type:** Bug (the BF-70 equipment picker can hide the most useful entry, or the whole button)
**Priority:** MEDIUM (needs a project with more than ten recent inspections; Q&D's two waterway projects reach that within a week of daily forms)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-70 `/verify` round 1 (finding C2, Codex, medium), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:08:57Z

## Problem

`getRecentWaterwaysEquipment` in `src/lib/queries/projects.ts` reads the ten newest Working in Waterways inspections on the whole project. `orderPreviousEquipment` then drops rows with no equipment text and puts the current site's rows first. Because the cut happens in the query, before either step:

- On a project with two sites inspected daily, an inspection at the current site older than the last ten project-wide never reaches the list, even though it is the one the crew wants.
- If the ten newest inspections all left the equipment box blank, the picker has nothing to show and the button disappears, though older inspections have equipment listed.

## Proposed change

- Filter blank equipment in the query, not after it, so the limit counts only usable rows (PostgREST filter on the JSON path, for example `data->>equipment_in_use` not empty).
- Fetch the current site's candidates separately from the rest: one capped read for `data->>site_name = <site>` and one for the project, merged and de-duplicated by id, same site first. The site is known on the edit page; on the new page it changes in the form, so either pass all sites' top rows (one small read per site, sites are capped at 20) or keep a per-site cap in a single query ordered by site.
- Keep the edit page's "one extra" so the record being edited does not shorten the list.
- Keep the failure path: a failed read still hides the picker and never breaks the page (BF-70 C3).

## Acceptance criteria

- [ ] With eleven or more newer inspections at another site, an older inspection at the current site still appears at the top of the list.
- [ ] With the ten newest inspections all blank, older inspections with equipment still show and the button stays.
- [ ] Rows are still de-duplicated, newest first within each group, and the edited record is excluded.
- [ ] Unit test on the merge helper; `pnpm build`, lint and the BF-70 tests clean.

## Depends on

- [BF-70](BF-70-waterways-gracie-small-asks.md) (merged `d986c19`).
