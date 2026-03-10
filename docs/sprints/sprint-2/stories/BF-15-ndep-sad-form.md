# BF-15: NDEP SAD Application Form + View

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 5
**Priority:** HIGH
**Dependencies:** BF-09
**Status:** COMPLETE
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S4-001, S4-002

---

## Summary

Build the NDEP Surface Area Disturbance (SAD) Application form and its read-only view. This is a one-time permit application form (not daily/weekly), with 4 sections: General Company Info (6 address blocks), Location Details (Township/Range/Section grid, UTM, basin), SAD Details (project info, 16+ BMP checkboxes, water trucks), and Application Certification (attachment checklist, signature). Heavy auto-fill from project data and contacts.

---

## CEO Directives

- "I attached copies of the two permits that are currently completed by hand" -- Andy (NDEP SAD + NNPH Dust are fillable forms)
- "Surface Area Disturbance Permit: would trigger a Dust Log being required" -- and the SAD application form itself
- Auto-fill from project + contacts: company name, address, PM -> Responsible Official, superintendent -> Site Manager

---

## Acceptance Criteria

- [x] Section 1 (General Company Info): 6 address blocks -- Company, Owner, Site/Plant, Records Location, Responsible Official, Site Manager
- [x] Auto-fill: Company from project data, Responsible Official from PM contacts, Site Manager from superintendent
- [x] Section 2 (Location Details): Township/Range/Section grid, UTM coordinates (Easting/Northing NAD83 Zone 11), Hydrographic Basin, County, Nearest City, Driving Directions
- [x] Section 3 (SAD Details): Project Name (auto-fill), Total Acres (auto-fill), 16+ BMP checkboxes, Water Truck count + capacity
- [x] Section 4 (Certification): Attachment checklist checkboxes, Signature + Date
- [x] Form submits as JSONB with form_type='ndep_sad_application'
- [x] Read-only view renders all 4 sections in clean printable layout
- [x] View route at /dashboard/projects/[id]/forms/ndep-sad/[submissionId]
- [x] Zod validation on required fields
- [x] "Use Previous" support (for resubmissions/corrections)

---

## Tasks

- [x] T-15.1: Finalize Zod schema for NDEP SAD (1h)
- [x] T-15.2: Build form component -- 4 sections with 6 address blocks (2h)
- [x] T-15.3: Create server action + new entry page (0.5h)
- [x] T-15.4: Build read-only view component (1h)
- [x] T-15.5: Create view page route (0.25h)
- [x] T-15.6: Test full flow: fill, submit, view (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/ndep-sad.ts` | MODIFY -- finalize full schema (~120 lines) |
| `src/components/forms/ndep-sad/NdepSadApplication.tsx` | CREATE -- form component (~250 lines) |
| `src/app/dashboard/projects/[id]/forms/ndep-sad/actions.ts` | CREATE -- server action (~50 lines) |
| `src/app/dashboard/projects/[id]/forms/ndep-sad/new/page.tsx` | CREATE -- new entry page (~40 lines) |
| `src/app/dashboard/projects/[id]/forms/ndep-sad/[submissionId]/page.tsx` | CREATE -- view page (~120 lines) |

---

## Key Interfaces

```typescript
interface NdepSadData {
  // 6 address blocks
  company: AddressBlock;
  owner: AddressBlock;
  site_plant: AddressBlock;
  records_location: AddressBlock;
  responsible_official: ContactBlock;
  site_manager: ContactBlock;

  // Location
  township: string;
  range: string;
  section: string;
  utm_easting: string;
  utm_northing: string;
  hydrographic_basin: string;
  county: string;
  nearest_city: string;
  driving_directions: string;

  // SAD details
  project_name: string;
  total_acres: string;
  bmp_checkboxes: Record<string, boolean>; // 16+ BMPs
  water_truck_count: string;
  water_truck_capacity: string;

  // Certification
  attachment_checklist: Record<string, boolean>;
  signature: string;
  signature_date: string;
}

interface AddressBlock {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface ContactBlock extends AddressBlock {
  title: string;
  phone: string;
  fax: string;
  email: string;
}
```

---

## Testing

Manual verification:
- Create project with SAD permit
- Fill SAD application with all sections
- Verify auto-fill from project data
- Submit, view read-only
- All 6 address blocks render correctly
- BMP checkboxes display checked/unchecked state
