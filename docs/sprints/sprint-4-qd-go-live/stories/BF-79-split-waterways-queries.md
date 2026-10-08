# BF-79: Move the Waterways equipment-history query out of the shared project queries

**Type:** Code structure (BF-73 follow-up; low)
**Priority:** LOW (no functional effect)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-73 `/verify` round 1 (finding V9, verify, low, pre-existing since BF-70), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T17:34:52Z

## Problem

`src/lib/queries/projects.ts` now exports nine query functions, one over the house limit of eight per module. One of them, `getRecentWaterwaysEquipment`, is Waterways-specific and carries its own per-site fan-out and merge. The generic project-queries module keeps growing form-specific logic.

## Proposed change

- Move `getRecentWaterwaysEquipment` (and any helper only it uses) to `src/lib/queries/waterways.ts`. Update the two importers (the Waterways new and edit pages) and the BF-73 tests that import it.
- No behaviour change.

## Acceptance criteria

- [ ] `projects.ts` exports eight functions or fewer; the Waterways query lives in its own module.
- [ ] BF-70 and BF-73 tests unchanged in outcome; `pnpm build`, lint clean.

## Depends on

- [BF-73](BF-73-equipment-picker-per-site-history.md) (merged `4924b2f`). Do it alongside the next story that touches the Waterways pages, to avoid a separate merge.
