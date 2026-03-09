# BF-10: NDEP Weekly Stormwater Form (3 Sections)

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 8
**Priority:** HIGH
**Dependencies:** BF-09
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S3-001, S3-002, S3-003

---

## Summary

Build the complete NDEP Weekly Stormwater Inspection Checklist form -- a 3-section weekly inspection form matching the NDEP PDF layout. This is the second-most-complex form in the system after NDOT. Includes general info with auto-fill, storm event data with 0.25" threshold question, 3 SWPPP elements, 16 stormwater control measures, 4 stabilization items, dynamic corrective action rows, and inspector signature.

---

## CEO Directives

- "Construction Stormwater Permit - NDEP: would trigger NDEP Weekly Storm Log" -- Andy's notes
- Form layout must match NDEP PDF as closely as practical
- Auto-fill from project data (site name, CSW#, location)
- "Use Previous" support for weekly continuity

---

## Acceptance Criteria

- [ ] Section 1: General info auto-fills (Project Site Name, CSW#, Location) from project data
- [ ] Section 1: Inspection details -- date, time, inspector name, inspection type (Regular/Post Storm/Other)
- [ ] Section 1: Storm Event Data -- 0.25" threshold Y/N, rain gauge vs weather station, total rainfall, storm start date/time, storm duration
- [ ] Section 1: Snowmelt discharge trigger question (Y/N)
- [ ] Section 1: Site conditions -- weather select, temperature, discharge Y/N (conditional describe), erosion Y/N (conditional describe), previous corrective actions Y/N (describe)
- [ ] Section 2: 3 SWPPP Element questions (each Y/N)
- [ ] Section 2: All 16 stormwater control measure items, each with Implemented (Y/N/NA), Maintenance Needed (Y/N), Notes
- [ ] Section 3: 4 stabilization items (same fields as control measures)
- [ ] Section 3: Corrective action table -- dynamic rows with action description, date to complete, completed Y/N
- [ ] Section 3: Inspector signature field + date
- [ ] Form submits as single JSONB payload to form_submissions with form_type='ndep_stormwater'
- [ ] Zod validation catches missing required fields (date, time, inspector name)
- [ ] "Use Previous" button loads latest NDEP stormwater submission, clears date/time
- [ ] Server action validates + saves, redirects to project form tab

---

## Tasks

- [ ] T-10.1: Finalize Zod schema for NDEP stormwater (types + validation) (1h)
- [ ] T-10.2: Build Section 1 -- general info + inspection details + storm event + site conditions (2h)
- [ ] T-10.3: Build Section 2 -- SWPPP elements + 16 control measures table (2h)
- [ ] T-10.4: Build Section 3 -- stabilization + corrective action table + signature (1.5h)
- [ ] T-10.5: Create server action (submitNdepStormwater) with Zod validation (0.5h)
- [ ] T-10.6: Create new entry page at /dashboard/projects/[id]/forms/ndep-stormwater/new (0.5h)
- [ ] T-10.7: Wire "Use Previous" (fetch latest submission, pass as prop) (0.5h)
- [ ] T-10.8: Build and test full form submission flow (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/ndep-stormwater.ts` | MODIFY -- finalize full Zod schema (~150 lines) |
| `src/components/forms/ndep-stormwater/NdepStormwater.tsx` | CREATE -- full form component (~300 lines) |
| `src/app/dashboard/projects/[id]/forms/ndep-stormwater/actions.ts` | CREATE -- server action (~60 lines) |
| `src/app/dashboard/projects/[id]/forms/ndep-stormwater/new/page.tsx` | CREATE -- new entry page (~40 lines) |

---

## Key Interfaces

```typescript
// src/lib/schemas/ndep-stormwater.ts
interface NdepStormwaterData {
  // Section 1
  inspection_date: string;
  inspection_time: string;
  inspector_name: string;
  inspection_type: 'regular' | 'post_storm' | 'other';
  inspection_type_other?: string;
  storm_event_025: 'Y' | 'N';
  rain_source?: 'rain_gauge' | 'weather_station';
  total_rainfall?: string;
  storm_start?: string;
  storm_duration?: string;
  snowmelt_discharge: 'Y' | 'N';
  weather: string;
  temperature: string;
  discharge_from_site: 'Y' | 'N';
  discharge_description?: string;
  erosion_evidence: 'Y' | 'N';
  erosion_description?: string;
  previous_corrective_complete: 'Y' | 'N';
  previous_corrective_description?: string;

  // Section 2
  swppp_available: 'Y' | 'N';
  swppp_current: 'Y' | 'N';
  site_map_accurate: 'Y' | 'N';
  control_measures: ControlMeasureItem[];

  // Section 3
  stabilization_items: StabilizationItem[];
  corrective_actions: CorrectiveActionRow[];
  inspector_signature: string;
  signature_date: string;
}

interface ControlMeasureItem {
  name: string;
  implemented: 'Y' | 'N' | 'NA';
  maintenance_needed: 'Y' | 'N';
  notes: string;
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Form pattern | useActionState + server action | Same as dust log, proven pattern |
| Section layout | Single component with section headings | Keeps form as one unit, easier for "Use Previous" |
| Control measures | Map over array of 16 items | Renders as table, each row is a ControlMeasureItem |
| Corrective actions | Dynamic rows with add/remove | Same pattern as dust log entries |
| Conditional fields | Show/hide based on Y/N selects | Simple state-driven visibility |

---

## Testing

Manual verification:
- Fill all 3 sections, submit
- Verify JSONB payload in Supabase
- Use Previous loads correctly (date/time cleared, everything else pre-filled)
- Zod validation rejects empty required fields
- Form renders correctly on different screen sizes
