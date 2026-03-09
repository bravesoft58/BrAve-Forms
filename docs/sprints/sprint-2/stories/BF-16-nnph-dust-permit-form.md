# BF-16: NNPH Dust Control Permit Form + View

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 5
**Priority:** HIGH
**Dependencies:** BF-09
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S4-003, S4-004

---

## Summary

Build the NNPH (North Las Vegas / North Nevada Public Health) Dust Control Permit Application form and its read-only view. One-time permit application with 3 logical sections: Application Info (type, permit #, dates), Contacts (applicant, contractor -- "all fields required even if same as applicant", 2 after-hours emergency contacts), and Project Details (7 project types, 7 dust control methods with sub-details, conditional fields like crushing equipment -> Stationary Source Permit #).

---

## CEO Directives

- "Dust Control Permit: would trigger a Dust Log being required" -- Andy's notes
- "I attached copies of the two permits that are currently completed by hand" -- this is one of them
- "All fields required even if same as applicant" -- form instructions for contractor section

---

## Acceptance Criteria

- [ ] Application Info: type (New/Renewal/Modification radio), permit # (if renewal/modification), project name (auto-fill), APN (auto-fill from parcel numbers), acres (auto-fill), start/end dates (auto-fill)
- [ ] Applicant section: name, company, address, city, state, zip, phone, email (auto-fill from project contacts)
- [ ] Contractor section: same fields, ALL required even if same as applicant
- [ ] After-hours emergency contacts: #1 (name, phone) and #2 (name, phone)
- [ ] Project Details: description (textarea), project type dropdown (7 options: Commercial, Road Rehab, Municipal, Single Family, Utilities, New Road, Residential)
- [ ] Fill material source, amount of excavation
- [ ] Crushing equipment Y/N -- conditional: if Y, show Stationary Source Permit # field
- [ ] Soil type (auto-fill), soil analysis report available Y/N
- [ ] 7 dust control methods, each with sub-details (watering: frequency/equipment, chemical stabilization: product/rate, etc.)
- [ ] Temporary irrigation Y/N + details, speed limit, trackout control, unauthorized traffic prevention
- [ ] Signature + date
- [ ] Form submits as JSONB with form_type='nnph_dust_permit'
- [ ] Read-only view renders all sections
- [ ] Zod validation on required fields

---

## Tasks

- [ ] T-16.1: Finalize Zod schema for NNPH dust permit (1h)
- [ ] T-16.2: Build form component -- application info + contacts (1h)
- [ ] T-16.3: Build form component -- project details + 7 dust control methods (1.5h)
- [ ] T-16.4: Create server action + new entry page (0.5h)
- [ ] T-16.5: Build read-only view component + view route (1h)
- [ ] T-16.6: Test full flow (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/nnph-dust-permit.ts` | MODIFY -- finalize full schema (~130 lines) |
| `src/components/forms/nnph-dust-permit/NnphDustPermit.tsx` | CREATE -- form component (~280 lines) |
| `src/app/dashboard/projects/[id]/forms/nnph-dust-permit/actions.ts` | CREATE -- server action (~50 lines) |
| `src/app/dashboard/projects/[id]/forms/nnph-dust-permit/new/page.tsx` | CREATE -- new entry page (~40 lines) |
| `src/app/dashboard/projects/[id]/forms/nnph-dust-permit/[submissionId]/page.tsx` | CREATE -- view page (~120 lines) |

---

## Key Interfaces

```typescript
interface NnphDustPermitData {
  application_type: 'new' | 'renewal' | 'modification';
  permit_number?: string;
  project_name: string;
  apn: string;
  acres: string;
  start_date: string;
  end_date: string;

  applicant: ContactInfo;
  contractor: ContactInfo;
  emergency_contact_1: { name: string; phone: string };
  emergency_contact_2: { name: string; phone: string };

  project_description: string;
  project_type: string; // one of 7 options
  fill_material_source: string;
  excavation_amount: string;
  crushing_equipment: 'Y' | 'N';
  stationary_source_permit?: string; // conditional
  soil_type: string;
  soil_analysis_available: 'Y' | 'N';

  dust_control_methods: DustControlMethod[];
  temporary_irrigation: 'Y' | 'N';
  irrigation_details?: string;
  speed_limit: string;
  trackout_control: string;
  unauthorized_traffic_prevention: string;

  signature: string;
  signature_date: string;
}

interface ContactInfo {
  name: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

interface DustControlMethod {
  method: string;
  enabled: boolean;
  details: string;
}
```

---

## Testing

Manual verification:
- Fill all sections including conditional fields
- Verify contractor section enforces all fields
- Crushing equipment Y -> shows permit # field
- 7 project types in dropdown
- 7 dust control methods with sub-details
- Submit, view read-only
