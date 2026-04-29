# BF-37: Daily Dust Log — UAT Polish (5 items)

**Type:** Bug + Polish
**Priority:** HIGH (UAT blocker for one item, polish for the rest)
**Points:** 3
**Status:** COMPLETE — merged 2026-04-29 (commit 7364d90, verify 9.5/10), awaiting Andy UAT sign-off
**Sprint:** 3
**Depends on:** None
**Reported by:** Andy Breen, UAT 2026-04-25

## Problem

Five issues raised by Andy on the Daily Dust Log during BF-30 soak testing. Two are functional bugs, three are polish.

### #1 — "Company / Contractor" auto-fills with Superintendent name

When adding an entry, the "Company / Contractor" field is being seeded from `projects.superintendent_name` (a person's name) when it should be the company name (or "Company Name + Superintendent" combined). This is misleading on regulatory forms — a contractor name field should never contain a person's first/last name as the default.

### #2 — "Visible Dust" select column too narrow (visible bug)

Screenshot shows the "Visible Dust Y/N" `<select>` dropdown clipping the character — Andy circled it. The column width on the entry table at `src/components/forms/dust-log/DailyDustLog.tsx:168-171` and the append variant at `src/components/forms/dust-log/AppendDustLogEntries.tsx:174-178` is too tight for the chevron + value to render together.

### #3 — "View" button triggers print prompt instead of preview

`src/components/form-actions.tsx:25-32` currently fires `window.print()` on click. This is a leftover from the pre-BF-27 print-button era. It should navigate to or render a read-only detail/preview view — not invoke the OS print dialog.

### #4 — PDF download for dust log fails, saves as `pdf.txt`

Screenshot from Andy's download history shows two failed `pdf.txt` files with "Site wasn't available". An NDEP-Stormwater PDF downloaded fine 17 minutes earlier — so the route works in general. The failing case is the dust-log template specifically.

**Hypothesis:** the `<a download>` element at `src/components/form-actions.tsx:34-41` has the `download` attribute with no explicit value, so when the response is **not** a 200 with `Content-Disposition: attachment; filename="..."`, the browser falls back to the URL's last path segment (`pdf`) and appends `.txt` because the response body is `text/html` (the Next.js error page). The dust-log PDF render is throwing server-side and the `<a download>` is masking it.

Likely cause: `src/lib/pdf/dust-log.tsx` blowing up on `data` shape — the JSONB has `entries` as an array of objects with the new field set; either a renderer expects a key that BF-27 didn't update, or the form_date is null.

### #5 — Add "Cancel" button to Add Entry screen

The back arrow works but Andy wants an explicit Cancel button on the Add Entry screen. Polish only.

## Design

### Fix #1 — Company/Contractor default

Change the default in `src/components/forms/dust-log/DailyDustLog.tsx` and `AppendDustLogEntries.tsx`. Source from `projects.company_name` (already exists per Sprint 3 docs), not `superintendent_name`. If `company_name` is empty, leave the field blank — never default to a person's name.

### Fix #2 — Visible Dust column width

Bump min-width on the column header and on the `<td>` wrapping the select in both `DailyDustLog.tsx` and `AppendDustLogEntries.tsx`. Target: chevron + 1-char value visible without clipping at 100% zoom.

### Fix #3 — View button

Change `src/components/form-actions.tsx`:
- Replace `onClick={() => window.print()}` with a navigation to the form's read-only detail page (each form already has one at `/dashboard/projects/[id]/forms/[type]/[submissionId]`). Pass the detail href in via props (similar to `backHref`).
- Or remove the View button entirely if Download PDF + Back are sufficient — confirm with Tim before deletion.

### Fix #4 — PDF download root cause

1. Add an explicit `try/catch` around `renderToBuffer` in `src/app/api/forms/[submissionId]/pdf/route.ts` and return JSON 500 with the error instead of letting Next.js render its HTML page.
2. Set `download="<filename>.pdf"` explicitly on the `<a>` so browsers fall back to that name even if the server hiccups.
3. Reproduce the failure with one of Andy's existing dust-log submissions; capture the actual error.
4. Fix the dust-log template renderer (`src/lib/pdf/dust-log.tsx`) to handle whatever shape blew up.
5. Smoke-test all 5 form types still PDF cleanly.

### Fix #5 — Cancel button

Add a Cancel button on the New Entry / Append Entry forms. Behavior: same as back arrow (navigate back). Place to the left of Submit.

## Acceptance Criteria

- [x] Company/Contractor field defaults to `projects.company_name` — `superintendent_name` removed from all 3 dust-log page.tsx files. Production verified all 5 Q&D projects have `company_name = "Q&D Construction"` via BF-30 backfill.
- [x] "Visible Dust" select column: `min-w-[72px]` applied on both `DailyDustLog.tsx:172` and `AppendDustLogEntries.tsx:180`. Visual confirmation at 100% zoom: Andy UAT.
- [x] View button removed entirely from `form-actions.tsx` (Tim approved removal — story explicitly invited it). Eye icon import dropped, `window.print` call gone.
- [x] PDF route hardened: `try/catch` around `renderToBuffer` returns JSON 500 (`route.ts:70-81`); empty `download=""` attr removed from `<a>` so browsers respect `Content-Disposition`. Root cause fixed in `dust-log.tsx:41` — accepts both `DustLogEntry[]` and `{entries: ...}` shapes (production stores bare array per `actions.ts:49`). All 5 form types: Andy UAT.
- [x] Cancel button left of Submit on both forms (`DailyDustLog.tsx:246-253`, `AppendDustLogEntries.tsx:255-262`); `router.back()` matches story spec.
- [ ] Andy retests all 5 items and signs off in writing.

## Test Plan

1. Local repro of PDF failure first — that's the only one that needs investigation rather than a known fix.
2. Implement fixes in one branch.
3. `pnpm build` clean; full PDF render of all 5 forms locally.
4. Push, auto-deploy via Vercel.
5. Andy retests on UAT.

## Out of Scope

- Print mode CSS cleanup (separate concern; current `print:hidden` is already wired).
- Form-list-page View button changes (this story only covers the in-form FormActions component).
- Any change to the underlying `form_submissions.data` shape for dust logs.
