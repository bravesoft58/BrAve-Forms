# BF-53 — NDOT Weekly Stormwater: Illicit Discharge / Spill Response + Final Check parity

**Status:** DONE (code complete, awaiting UAT)
**Story Points:** 2
**Created:** 2026-06-23
**Last Updated:** 2026-06-23T13:19:01Z
**Parent:** Follow-up to BF-51 (NDOT helper-text parity)
**Source:** Andy Breen UAT email 2026-06-18 + marked-up screenshots vs official Form 018-001
(`feedback/RE_ BrAve Form Review.msg`, `feedback/BrAve NDOT Weekly Stormwater review 20260618.pdf`)

## Context

BF-51 shipped the official NDOT Form 018-001 explanatory wording. Andy's 2026-06-18 review
passed everything (wording, vertical PDF layout, existing submissions) **except** the
*Illicit Discharge Detection and Elimination / Spill Response* and *Final Check* areas.
He attached the official form (PDF p.2) as the reference. Tablet layout still pending his
test (BF-51 open AC, unaffected by this story).

Decision (Tim, 2026-06-23): go for **full parity with the official form**, not just Andy's
flagged subset. Backward-compat with existing `spill_action` / `non_structural_bmps` free-text
was waived — **non-production system, no data to preserve** — so those fields were repurposed
in place rather than added alongside.

## Problem (mapped to official Form 018-001 p.2)

| # | Official question | Official control | Before | Fix |
|---|---|---|---|---|
| 1 | Are there any illicit discharges? *If yes, describe* | Y/N | Y/N, no describe box | + conditional describe box on Y |
| 2 | Are there any reportable-qty spills? *If yes, describe* | Y/N | Y/N, no describe box | + conditional describe box on Y |
| 3 | Was appropriate action taken to address the illicit discharge **or spill**? | N/A·Y·N | free-text textarea, gated on reportable_spills=Y | → N/A·Y·N select, always shown |
| 4 | Was a spill report filed with NDEP? | N/A·Y·N | Y/N, gated on reportable_spills=Y | → N/A·Y·N select, always shown |
| 5 | Was a non-reportable spill report completed? *If yes, describe* | N/A·Y·N | Y/N, no describe box | → N/A·Y·N + describe box on Y |
| 6 | Have non-structural BMPs been implemented? *If yes, describe* | N/A·Y·N | free-text textarea under "Additional" | → N/A·Y·N + describe box on Y; moved into spill block |
| 7 | **Final Check:** all non-stabilized & staging areas inspected? *If no, explain* | Y/N | Y/N under "Additional", no heading | + "Final Check" heading, moved above Additional Comments, + explain box on N |

Items 1, 2, 3, 5, 7 were Andy's explicit annotations; items 4 and 6 (the N/A tri-state and
the BMP describe box) were caught by comparing to the official form he attached.

## Implementation

Presentational + form-data change only (no DB migration — submission `data` is JSONB).

- **`src/lib/schemas/ndot-stormwater.ts`** — new `YNA = ["Y","N","NA"]` enum. `spill_action`,
  `ndep_report_filed`, `non_reportable_spills`, `non_structural_bmps` → `z.enum(YNA)`. Added
  description fields `illicit_discharges_desc`, `reportable_spills_desc`,
  `non_reportable_spills_desc`, `non_structural_bmps_desc`, `all_areas_inspected_explain`.
- **`src/components/forms/ndot-stormwater/NdotStormwaterForm.tsx`** — `makeEmptyData` seeds the
  new fields (`spill_action`/`non_structural_bmps` now default `undefined`, not `""`).
- **`src/components/forms/ndot-stormwater/Section3DischargeSignatures.tsx`** — new `YnSelect`
  helper (optional leading N/A); rebuilt the spill block with conditional describe boxes,
  tri-state selects, a "Final Check" heading, and reorder.
- **`src/app/dashboard/projects/[id]/forms/ndot-stormwater/[submissionId]/page.tsx`** — view
  page renders the new fields + Final Check heading; `YNBadge` already maps `NA`→"N/A".
- **`src/lib/pdf/ndot-stormwater.tsx`** — `spill_action`/`non_structural_bmps` now render via
  `PromptRow`/`YN` (tri-state) instead of free text; describe text shown via `PromptRow` detail;
  non-structural BMPs moved into the spill block so Final Check carries only the inspection
  question, matching official p.2. Wording unchanged (`NDOT_SECTION3_PROMPTS` stays the single
  source of truth across all three surfaces).

## Acceptance Criteria

- [x] Illicit discharge / reportable / non-reportable spill questions get a comment box on "Y".
- [x] "Was appropriate action taken…" is a N/A·Y·N control (was free text).
- [x] N/A option present on action / NDEP-report / non-reportable / non-structural BMP questions.
- [x] "Final Check" heading present; inspection question sits above Additional Comments.
- [x] All three surfaces (entry form, read-only view, PDF) consistent; typecheck + lint clean.
- [ ] Andy UAT: re-open a new NDOT form, confirm the section reads like the official form.
- [ ] Tablet layout check (carried from BF-51).

## Notes / Risk

- **Old submissions:** legacy free-text `spill_action` / `non_structural_bmps` values render as
  "N/A" (not Y/N/NA) and their text is not shown. Accepted — non-prod, BF-51 itself was the
  first real NDOT content. Reads do not Zod-validate (`page.tsx` casts `submission.data`), so no
  parse errors on old rows.
