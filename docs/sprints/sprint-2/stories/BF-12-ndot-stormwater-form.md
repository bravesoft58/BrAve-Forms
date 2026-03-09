# BF-12: NDOT Weekly Stormwater Form (3 Sections)

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 8
**Priority:** HIGH
**Dependencies:** BF-09
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S3-005, S3-006, S3-007

---

## Summary

Build the complete NDOT Weekly Stormwater Inspection form -- the most complex form in the system. 3 sections covering site info with many personnel fields, weather conditions with checkboxes, 5 conditional questions, 4 SWPPP elements, 11 BMP categories, batch plants, 5 illicit discharge questions, and dual signatures (Inspector + WPCM). The NDOT form explicitly requires photo attachment capability (handled in BF-13).

---

## CEO Directives

- "Construction Stormwater Permit - NDOT: would trigger NDOT Weekly Storm Log" -- Andy's notes
- "Attach digital photographs of deficiencies or other noted issues of concern" -- NDOT form instructions
- Form layout must match NDOT PDF as closely as practical
- Dual signatures: Inspector + Contractor's WPCM with 40 CFR 122.22(d) certification

---

## Acceptance Criteria

- [ ] Section 1: Report No. field (sequential/manual entry)
- [ ] Section 1: Site info auto-fills -- Project Location from project address, plus fields for Contract #, CSW/Tracking # (with N/A option), NDOT Inspector/Crew, Resident Engineer, WPCM, dates
- [ ] Section 1: Weather checkboxes (CLEAR/P.CLOUDY/OVERCAST/RAIN), precipitation intensity, reference, total, wind, temp range
- [ ] Section 1: 5 conditional questions with show/hide logic (TMDL waterway, deficiency follow-up, erosion, adjacent runoff, pollutants)
- [ ] Section 1: 4 SWPPP elements (each Y/N)
- [ ] Section 1: First 2 BMP categories (Sediment Control, Erosion Control) with Required Y/N, Implemented Y/N, Comments
- [ ] Section 2: 9 additional BMP categories (11 total) with same field structure
- [ ] Section 3: Batch plants section (Present Y/N, location, BMPs, comments)
- [ ] Section 3: 5 illicit discharge / spill response questions
- [ ] Section 3: Non-structural BMPs text, Final Check Y/N, Additional Comments
- [ ] Section 3: Dual signature fields -- Inspector (name + date) and Reviewed By WPCM (name + date)
- [ ] Section 3: 40 CFR 122.22(d) certification statement displayed
- [ ] Form submits as single JSONB payload with form_type='ndot_stormwater'
- [ ] Zod validation on required fields
- [ ] "Use Previous" support

---

## Tasks

- [ ] T-12.1: Finalize Zod schema for NDOT stormwater (types + validation) (1h)
- [ ] T-12.2: Build Section 1 -- site info + conditions + conditionals + SWPPP + first 2 BMPs (2.5h)
- [ ] T-12.3: Build Section 2 -- 9 BMP categories table (1.5h)
- [ ] T-12.4: Build Section 3 -- batch plants + illicit discharge + signatures (1.5h)
- [ ] T-12.5: Create server action (submitNdotStormwater) (0.5h)
- [ ] T-12.6: Create new entry page + wire "Use Previous" (0.5h)
- [ ] T-12.7: Build and test (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/ndot-stormwater.ts` | MODIFY -- finalize full Zod schema (~180 lines) |
| `src/components/forms/ndot-stormwater/NdotStormwater.tsx` | CREATE -- full form component (~400 lines) |
| `src/app/dashboard/projects/[id]/forms/ndot-stormwater/actions.ts` | CREATE -- server action (~60 lines) |
| `src/app/dashboard/projects/[id]/forms/ndot-stormwater/new/page.tsx` | CREATE -- new entry page (~40 lines) |

---

## Key Interfaces

```typescript
interface NdotStormwaterData {
  report_no: string;
  project_location: string;
  contract_number: string;
  csw_tracking: string;
  csw_na: boolean;
  ndot_inspector: string;
  crew_number: string;
  resident_engineer: string;
  wpcm: string;
  inspection_date: string;
  previous_inspection_date: string;

  // Conditions
  weather: string[]; // multi-select checkboxes
  precip_intensity: 'none' | 'light' | 'moderate' | 'heavy';
  precip_reference_type: string;
  precip_reference_location: string;
  precip_total: string;
  precip_na: boolean;
  wind: 'none' | 'light' | 'moderate' | 'heavy';
  temp_range: '<32' | '32-50' | '51-75' | '>75';

  // Conditional questions
  tmdl_waterway: 'Y' | 'N';
  tmdl_waterway_names?: string;
  deficiency_followup: 'na' | 'yes' | 'no';
  deficiency_actions?: string;
  erosion_evidence: 'Y' | 'N';
  erosion_discharge?: 'Y' | 'N';
  erosion_waterway?: string;
  adjacent_runoff: 'Y' | 'N';
  pollutant_concerns: 'Y' | 'N';
  pollutant_explain?: string;

  // SWPPP
  swppp_onsite: 'Y' | 'N';
  swppp_signed: 'Y' | 'N';
  swppp_current: 'Y' | 'N';
  swppp_posted: 'Y' | 'N';

  // BMP categories (11 total)
  bmp_categories: BmpCategory[];

  // Section 3
  batch_plant_present: 'Y' | 'N';
  batch_plant_location?: 'onsite' | 'offsite';
  batch_plant_bmps?: string;
  batch_plant_comments?: string;
  illicit_discharges: 'Y' | 'N';
  reportable_spills: 'Y' | 'N';
  spill_action?: string;
  ndep_report_filed?: 'Y' | 'N';
  non_reportable_spills: 'Y' | 'N';
  non_structural_bmps: string;
  all_areas_inspected: 'Y' | 'N';
  additional_comments: string;

  // Signatures
  inspector_name: string;
  inspector_date: string;
  wpcm_name: string;
  wpcm_date: string;
}

interface BmpCategory {
  name: string;
  required: 'Y' | 'N';
  implemented: 'Y' | 'N';
  comments: string;
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Form pattern | useActionState + server action | Same as all other forms |
| BMP categories | Map over array of 11 items | Table layout, same as NDEP control measures |
| Conditional fields | State-driven show/hide | Y/N toggles reveal sub-fields |
| Weather checkboxes | Multi-select state array | Checkboxes, not radio buttons (per NDOT PDF) |
| Dual signatures | Two signature sections | Both required, displayed at bottom of form |
| Photo attachment | NOT in this story | Handled in BF-13 as separate component |

---

## Testing

Manual verification:
- Fill all 3 sections including conditional fields
- Submit and verify JSONB payload
- Use Previous loads correctly
- Conditional fields show/hide based on Y/N values
- All 11 BMP categories render and save
