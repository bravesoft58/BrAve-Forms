# BF-51: NDOT Form — Match Official NDOT Form Explanatory Text

**Type:** UX / regulatory-parity copy
**Priority:** MEDIUM (this is the headline ask Andy quoted in the email body)
**Points:** 2 estimated → **4 actual** (full A+B+C parity across 4 render surfaces; deep research showed the ask is form-wide, not just the BMP table)
**Status:** CODE COMPLETE — full parity (Tiers A+B+C) built across entry form, read-only view, and PDF. ESLint 0-err, `next build` clean. Pending: our browser pass + Andy/Gracie UAT.
**Sprint:** 3
**Reported by:** Gracie Damele via Andy Breen, email "BrAve Form Review" 2026-06-08 (`brave forms comments 1.pdf` p.4-6) + reference `NDOT Weekly Stormwater Logs.pdf` (official Form 018-001 WPCM, Rev. 1/04/2017)
**Created:** 2026-06-08
**Last Updated:** 2026-06-09T20:00:46Z

## Problem

The NDOT BMP checklist in our app renders each category as a bare label (e.g. "Track-Out") with Required/Implemented Y/N selects. The official NDOT form spells out a question per sub-section. NDOT reviewers expect the digital form to *look* like theirs. Andy quoted Gracie directly in the email body:

> "I think in general just add some of the little explanations that are on the original NDOT form. Only because I know NDOT is kind of picky about things **'looking' similar even if the functionality is the same**."

Annotated on `brave forms comments 1.pdf` p.4, repeated "same comment as previous" on p.5-6. The exact wording to mirror is in the supplied official form (`NDOT Weekly Stormwater Logs.pdf`, pages 1-3).

## Reference text (from official Form 018-001 WPCM)

Per BMP sub-section, the official form asks two questions; mirror both as helper text under each category name:

| BMP Category | Line 1 (Required?) | Line 2 |
|---|---|---|
| Sediment Control | "Are sediment control measures required? If no, proceed to next sub-section." | "Are sediment control measures properly implemented?" |
| Erosion Control | "Are erosion control measures required? If no, proceed to next sub-section." | "Are erosion control measures properly implemented?" |
| Track-Out | "Are track-out measures required? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Material Stockpiles | "Are there material stockpiles? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Concrete Washout | "Are concrete washout areas required? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Construction Material Storage | "Are construction materials stored onsite? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Chemical Storage | "Are chemicals, e.g. equipment fluids, paints, solvents, etc., stored onsite? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Fueling Areas | "Is there a temporary fueling area onsite? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Construction Equipment | "Is there evidence of equipment leaks and/or spills? If no, proceed to the next sub-section." | "Are BMPs properly implemented?" |
| Waste Material Storage | "Are waste materials stored onsite? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |
| Sanitation Facilities | "Are portable toilets staged onsite? If no, proceed to next sub-section." | "Are BMPs properly implemented?" |

(Also review Section 1 conditional questions and Section 3 — Illicit Discharge / Spill Response / Final Check / Certification — against the official form for any short explanatory phrases worth mirroring. The 40 CFR 122.22(d) certification text already matches; confirm.)

## Current state

`src/components/forms/ndot-stormwater/Section2BmpCategories.tsx:31-82` renders a table; each row shows only `{item.name}` with Required/Implemented selects and a Comments input. Categories list: `src/lib/schemas/ndot-stormwater.ts:14-26` (the 11 names above, in order). No description/helper field exists on the category model today.

## Proposed change

Add the official sub-section helper text without changing the form's data model or submission shape.

- **Source the text from a constant map** (category → `{ requiredPrompt, implementedPrompt }`) in `src/lib/constants/` or alongside `NDOT_BMP_CATEGORIES`. Do not inline 11 strings into JSX.
- **Render it under each category name** as muted helper copy (e.g. small zinc text), two short lines, so the "Required" select reads against "Are X measures required? If no, proceed to next sub-section" and "Implemented" against "Are BMPs properly implemented?". Keep the table compact on mobile (these are field-used on tablets).
- **Mirror NDOT's visual structure** closely enough to satisfy a picky reviewer — section grouping, the per-category prompt — but do **not** restructure the underlying data or break the existing PDF mapping.
- **PDF parity:** confirm the generated NDOT PDF (`src/lib/pdf/` NDOT template) also reflects the official phrasing, since that's the artifact an NDOT reviewer actually receives. If the PDF already mirrors the official layout, note it; if not, add the prompts there too.

## Acceptance criteria

- [x] Each of the 11 BMP categories shows the official "required?" prompt and the "properly implemented?" prompt as helper text. *(all 3 surfaces: entry `Section2BmpCategories.tsx`, view `[submissionId]/page.tsx`, PDF `ndot-stormwater.tsx`.)*
- [x] Wording matches Form 018-001 WPCM exactly (proofread against the supplied PDF). *(extracted official text verbatim into `src/lib/constants/ndot-form-text.ts`; incl. "Track-Out Control", Construction Equipment "the next sub-section", Sediment/Erosion "measures properly implemented".)*
- [x] Helper text is sourced from a single constant, not duplicated in JSX. *(`src/lib/constants/ndot-form-text.ts` — one file feeds all 4 surfaces.)*
- [x] Form data model + submission JSON shape unchanged (no migration; existing submissions still render). *(presentational only; prompts keyed by stored `bmp_categories[].name`; no schema touch. `next build` clean.)*
- [ ] Layout holds on tablet/mobile widths (field devices). *(PENDING our browser pass — BMP table keeps `overflow-x-auto`, prompts wrap in the name cell; needs eyes on a tablet width.)*
- [x] Generated NDOT PDF reflects the official phrasing. *(PDF rewritten: Instructions block added, BMP rendered as vertical prompt blocks, Site Assessment/SWPPP/Batch/Illicit/Final converted to full-width prompt+Y/N rows. Per Tim's call, page growth past 3 sheets is accepted.)*
- [x] Section 1/3 reviewed and the official phrases added (Tier B). *(Conditional questions, SWPPP elements, batch/illicit/spill/final-check prompts all sourced from the constant; non-reportable-spill + non-structural-BMP prompts added to the PDF where they were missing.)*
- [x] Certification text canonicalized (Tier C). *(One `NDOT_CERT_TEXT` constant — verbatim incl. the comma after "law" and `[40 CFR 122.22(d)]` brackets — replaces three previously-divergent hand-typed variants on entry/view/PDF.)*

## Test plan — our browser testing before resubmitting to Andy

1. Open NDOT Weekly Stormwater new form → Section 2 → confirm all 11 categories show both prompts, wording matches the PDF line-for-line (proofread side-by-side).
2. Resize to tablet/phone widths → confirm no overflow, prompts still readable, selects still usable.
3. Fill and submit a form → reopen (view + edit) → confirm helper text renders in all states and saved Y/N values are intact (data shape unaffected).
4. Generate the NDOT PDF → compare against `NDOT Weekly Stormwater Logs.pdf` for phrasing/structure parity.
5. Regression: open a pre-existing NDOT submission → confirm it still renders (helper text is presentational only).
6. Screenshot side-by-side (our form vs official PDF) for the resubmission email so Andy/Gracie can see the parity.

## Code review checklist

- [ ] Helper strings live in one constant keyed by category; order matches `NDOT_BMP_CATEGORIES`.
- [ ] No change to `ndot-stormwater.ts` schema / submission JSON keys.
- [ ] Proofread: "the next sub-section" vs "next sub-section" matches the source per row (Construction Equipment uses "the next").
- [ ] PDF template change (if any) doesn't shift pagination or break existing field positions.
- [ ] Accessibility: helper text associated with its control (aria-describedby or adjacent label), not a floating div.

## Validation findings (2026-06-08T16:53:50Z)

Code-grounded review, **including a line-for-line proofread of the helper-text table against the official PDF** (extracted text). **Verdict: SOLID — unusually well-researched. Completeness, not correctness, is the risk.**

- **Helper text verified verbatim.** All 11 rows match Form 018-001 exactly, including the two nuances the story already captured: Construction Equipment uses "proceed to **the** next sub-section" (only row with "the"); Sediment Control and Erosion Control use "Are X **measures** properly implemented?" for Line 2 (the other nine use "Are **BMPs** properly implemented?"). `NDOT_BMP_CATEGORIES` (`ndot-stormwater.ts:14-26`) lists the 11 names in the exact table order, so a helper map keyed by index **or** name aligns 1:1 (submissions always store 11 categories in fixed order via `makeDefaultBmpCategories`).
- **PDF-template parity is the load-bearing half — make it required, not "confirm/if not, add."** `src/lib/pdf/ndot-stormwater.tsx:175-193` renders BMP rows as bare `{bmp.name}` + Y/N badges, no prompts. NDOT reviewers receive the **PDF**, so the prompts must go there too — and the test plan must verify the PDF still **paginates to 3 pages** matching the official form after the text is added.
- **Mobile/tablet reflow may exceed the 2-SP estimate.** `Section2BmpCategories.tsx` is one `overflow-x-auto` table with fixed-width selects; two helper lines under 11 names inflate row height and worsen horizontal scroll on field tablets. A responsive stacked/card layout is more than "add muted zinc text" — re-check the estimate.
- **Cert text is a NEAR-match, not exact** (the story says "already matches"). Template `CERT_TEXT` (`ndot-stormwater.tsx:38-39`) drops the comma after "law", adds "the" before "information", and omits the brackets around `[40 CFR 122.22(d)]`. The **on-screen** view-page cert (`[id]/forms/ndot-stormwater/[submissionId]/page.tsx:347-351`) is *more* divergent (drops whole clauses). For a verbatim-parity story, align them or downgrade the claim to "substantively equivalent."
- **Category name parity:** app renders `Track-Out`; the official section header is `Track-Out Control`. Out of strict scope but a real visual-parity nit given the picky-reviewer driver — document as a known deviation or fix.
- **Section 1 / Section 3 clauses are under-scoped.** The official form carries many short "If yes/no, briefly describe / proceed to next sub-section" phrases (Temporary Batch Plants, Illicit Discharge/Spill, Final Check, deficiency follow-up, non-structural BMPs). The story defers these as optional; a side-by-side picky review will flag their absence. List and decide them explicitly rather than hand-waving.

## Deep research + build (2026-06-09)

Read both ground-truth docs end-to-end (`Testing/NDOT Weekly Stormwater Logs.pdf` full text via `Testing/ndot_pdf_text.txt`; `Testing/brave forms comments 1.pdf` extracted) and diffed against every render surface. Tim's calls: **A+B+C full parity · accept PDF page growth · canonicalize cert · include the read-only view.** Built accordingly.

**Scope was wider than the original story.** Gracie's driver (comments PDF p.4) is *"in general just add some of the little explanations that are on the original NDOT form…NDOT is kind of picky about things 'looking' similar"* — and p.5-6 are "same comment as previous" on the next two NDOT-form screenshots. So the ask spans the **whole form**, not just the 11 BMP categories. Every Section 1 / SWPPP / Section 3 question in our app was abbreviated the same way the BMP names were.

**Correction to the prior validation finding:** the claim "the 40 CFR 122.22(d) certification text already matches; confirm" was **WRONG**. Three surfaces carried three *different*, all-divergent cert strings: entry form (present-tense "gather and evaluate"; parens), PDF (no comma after "law"; added "the"; no brackets), and the read-only view (**dropped the entire second half**). All three now render one canonical `NDOT_CERT_TEXT` constant, verbatim from the official form.

**Single source of truth:** `src/lib/constants/ndot-form-text.ts` holds every official string (instructions, cert, BMP prompts keyed by category name w/ `displayName` for Track-Out→"Track-Out Control", Section 1 conditional prompts, SWPPP prompts, Section 3 prompts). All four surfaces import from it.

**Four surfaces touched (the story named two):**
- `src/components/forms/ndot-stormwater/Section2BmpCategories.tsx` — BMP prompts under each name as helper text, `aria-describedby` wiring prompts to the Required/Implemented selects (a11y AC). Covers **new + edit** (both reuse this component via `NdotStormwaterForm`).
- `src/components/forms/ndot-stormwater/Section1SiteInfo.tsx` — full official prompts on conditional questions + SWPPP; site-info hints (Project Location, CSW full name, precip total).
- `src/components/forms/ndot-stormwater/Section3DischargeSignatures.tsx` — full prompts on batch/illicit/spill/final-check; cert → constant.
- `src/components/forms/ndot-stormwater/NdotStormwaterForm.tsx` — Instructions paragraph at top of form.
- `src/app/dashboard/projects/[id]/forms/ndot-stormwater/[submissionId]/page.tsx` — **read-only view** (the surface the story missed): BMP prompts, Section 1/3 full prompts (normal-case `questionClass`, since the view's tiny-caps labels would mangle sentences), cert → constant.
- `src/lib/pdf/ndot-stormwater.tsx` — **the artifact NDOT receives**: Instructions block; BMP rendered as vertical prompt blocks; Site Assessment / SWPPP / Batch / Illicit / Final converted from compact multi-column rows to full-width prompt+Y/N rows (mirrors the official's vertical layout); added the non-reportable-spill + non-structural-BMP prompts that were missing; cert → constant. Page growth past 3 sheets accepted per Tim.

**Verification:** ESLint 0 errors (8 pre-existing warnings, none in changed logic). `next build` clean (type-check passes). Browser/tablet pass + UAT still pending.

## Out of scope

- Autofill / auto-increment (BF-50).
- Adding/removing actual BMP categories or changing Y/N semantics.
- NDEP and NNPH form copy (NDEP had no annotations this round; NNPH is BF-52).
