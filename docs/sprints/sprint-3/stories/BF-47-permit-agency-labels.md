# BF-47: Permit Agency Labels + Section Clarity (Project Setup)

**Type:** UX / copy
**Priority:** LOW (cosmetic, but cheap and Gracie-requested)
**Points:** 1
**Status:** CODE COMPLETE — ESLint 0-err, `next build` clean. Pending: browser screenshot for the Andy/Gracie resubmission, then UAT sign-off.
**Sprint:** 3
**Reported by:** Gracie Damele via Andy Breen, email "BrAve Form Review" 2026-06-08 (`brave forms comments 1.pdf` p.1)
**Created:** 2026-06-08
**Last Updated:** 2026-06-09T19:01:52Z

## Problem

On the project-setup **Permits** section, Gracie wants the regulatory agency shown in parentheses next to each permit so field staff pick the right one. Verbatim annotation:

> Add the appropriate regulatory agency in parentheses next to each one:
> Surface Area Disturbance (SAD) (NDEP)
> Dust Control (NNPH)
> Working in Waterways (NDEP)

Second, related note on the same page (informational — drives BF-49, not this story):

> Also, the stormwater ones are a little tricky. If you need NDOT stormwater forms it is because you have an NDEP stormwater permit. But you don't need to fill out both forms. NDOT ones for NDOT jobs, NDEP ones for all other jobs. **Maybe change the title of this section to "Forms" instead of "Permits"?** But I do understand the logic behind calling it Permits.

## Current state

`src/lib/constants/permits.ts` — labels lack the agency:
```ts
export const PERMIT_LABELS: Record<PermitType, string> = {
  surface_area_disturbance: "Surface Area Disturbance (SAD)",
  dust_control: "Dust Control",
  stormwater_ndot: "Stormwater (NDOT)",
  stormwater_ndep: "Stormwater (NDEP)",
  waterway: "Waterway",
  other: "Other",
};
```

Rendered at `src/components/projects/project-form.tsx:220-273` via `{PERMIT_LABELS[permit]}`. The section heading "Permits" and the helper line "Select applicable permits. Required forms will be auto-assigned." live in the same component.

## Proposed change

1. Update `PERMIT_LABELS` to include the issuing agency:
   - `surface_area_disturbance: "Surface Area Disturbance (SAD) — NDEP"`
   - `dust_control: "Dust Control — NNPH"`
   - `stormwater_ndot: "Stormwater — NDOT"`
   - `stormwater_ndep: "Stormwater — NDEP"`
   - `waterway: "Waterway — NDEP"`
   - `other: "Other"`

   (Exact punctuation — parentheses vs. em-dash — is a style choice; match Gracie's parenthetical intent. Confirm the SAD double-acronym reads cleanly, e.g. "Surface Area Disturbance (SAD) — NDEP".)
2. **Audit every consumer of `PERMIT_LABELS`** before changing it — it's reused on the project view, possibly PDFs, and the inspector portal. Changing the label text must not break a layout that assumed the short form. Grep `PERMIT_LABELS` across `src/`.
3. **Section title:** keep "Permits" (Gracie says she understands the logic). Optionally add a one-line clarifier under the heading: "These determine which compliance forms are required." Do **not** rename to "Forms" — that overloads the existing Forms tab concept and is explicitly a "maybe" from Gracie. Note the suggestion here and let Tim decide.

## Acceptance criteria

- [x] Each permit checkbox shows its issuing agency (SAD→NDEP, Dust→NNPH, NDOT stormwater→NDOT, NDEP stormwater→NDEP, Waterway→NDEP). *(em-dash style; `permits.ts:23-30`.)*
- [x] All other `PERMIT_LABELS` consumers (project view, inspector portal) still render correctly with the longer labels — no truncation/overflow. *(3 consumers — `project-form.tsx:245`, `ProjectTabs.tsx:141`, `InspectorPortal.tsx:104` — all plain `text-sm font-medium` spans, no `truncate`/`max-w`. PDF is NOT a consumer. `next build` clean.)*
- [x] Section heading copy reviewed; rename to "Forms" explicitly deferred to Tim (documented, not done unless he says so). *(Kept "Permits"; optional one-line clarifier under the heading also left out pending Tim's call.)*

## Test plan — our browser testing before resubmitting to Andy

1. Project setup → New Project → Permits section: confirm all six labels show the agency.
2. Check each downstream surface that uses `PERMIT_LABELS`: open an existing project's view page, generate a PDF, open the inspector portal for a project with permits — confirm no broken/overflowing labels.
3. Screenshot the updated Permits section for the resubmission email.

## Code review checklist

- [x] Single source of truth — change is in `permits.ts` only, no hardcoded label strings introduced.
- [x] No label collides with a CSS truncation/`max-w` that hides the agency. *(verified all 3 spans; `max-w-xs` at `project-form.tsx:253` is on the permit-number input, not the label.)*
- [x] `PermitType` keys unchanged (DB CHECK constraint untouched). *(value-only edit.)*

## Validation findings (2026-06-08T16:53:50Z)

Code-grounded review (15-agent validation). **Verdict: SOLID — proceed, with two corrections.**

- **Confirmed:** `PERMIT_LABELS` block matches exactly (`permits.ts:23-30`); the three render consumers are `project-form.tsx:240`, `ProjectTabs.tsx:141`, `InspectorPortal.tsx:104`; `PermitType` keys and the DB CHECK (`initial_schema.sql:99-106`) are untouched by a value-only edit; no test/snapshot hardcodes the old strings (the repo has no test files at all).
- **Correction — PDFs are NOT a consumer.** Grep of `src/lib/pdf/` for `PERMIT_LABELS` returns zero; templates render the raw permit **number**, never a label. Drop the "audit the PDF / verify PDF labels" step from the proposed change, AC, and test plan — there's no PDF label to break.
- **Correction — precise render line is `:240`**, not the `220-273` section range (cosmetic, but cite `:240`).
- **No overflow risk:** none of the three label spans apply `max-width`/`truncate`; longer labels wrap, never hide. (`max-w-xs` at `project-form.tsx:253` is on the permit-number *input*.)
- **Copy decision to settle once (cross-cuts BF-51):** Gracie wrote parentheses (`Working in Waterways (NDEP)`); this story proposes em-dash + the short label `Waterway`. Since BF-51's whole driver is "make it look like the agency's form," lock the punctuation/label style across BF-47 + BF-51 rather than per-story.
- **Pre-existing typo (out of scope, don't propagate):** `permits.ts:1` comment says `projects_permits`; the table is `project_permits` (singular).

## Out of scope

- Renaming the section to "Forms" (deferred to Tim).
- The dual-number request (BF-48) and the don't-force-both-forms request (BF-49) — separate stories.
