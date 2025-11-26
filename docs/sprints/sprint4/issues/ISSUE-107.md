# ISSUE-107: NDOT SWPPP Template

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-106 (NDEP BWPC SWPPP complete)
**Status:** COMPLETE (2025-11-26)

## What You'll Do

Create the Nevada Department of Transportation SWPPP template with highway/roadway-specific fields including traffic control BMPs, NDOT inspector signature requirements, and right-of-way compliance sections.

## Prerequisites

- [ ] ISSUE-106 complete (NDEP BWPC SWPPP validated)
- [ ] Backend running at http://localhost:30101/graphql
- [ ] Code editor open to packages/database directory
- [ ] PDF source: NDOT SWPPP Template.pdf (1019 KB - largest template)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (70 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/NDOT SWPPP Template.pdf

This is the largest template (1019 KB) with highway-specific requirements. Extract fields section by section:

**Section 1: Project Information (18 fields)**

Standard highway project fields plus NDOT-specific identifiers:

- project_name (text, required)
- ndot_project_number (text, required, "Format: XXXXX-XX-XXXX")
- contract_number (text, required)
- route_number (text, "State Route, US Highway, or Interstate number")
- begin_mile_post (number, 2 decimals)
- end_mile_post (number, 2 decimals)
- county (select, Nevada counties)
- contractor_name (text, required)
- contractor_contact (text)
- contractor_phone (text)
- ndot_resident_engineer (text, required)
- ndot_re_phone (text)
- environmental_manager (text)
- em_phone (text)
- total_disturbed_acres (number, 2 decimals)
- project_start_date (date, required)
- project_end_date (date)
- receiving_waters (text, "Drainage basin or water body")

**Section 2: Traffic Control BMPs (repeater fields)**

Highway-specific traffic control measures:

- traffic_bmps (repeater with itemSchema):
  - bmp_type (select: Work Zone Signage, Temporary Barriers, Lane Closures, Flagging Operations, Speed Reductions, Detour Routes)
  - install_location (text, "Mile post or station")
  - install_date (date)
  - removal_date (date)
  - responsible_party (text, "Contractor or NDOT")
  - condition (select: Good, Fair, Poor, Non-functional)
  - last_inspection_date (date)

**Section 3: Erosion & Sediment Control (repeater fields)**

Standard plus highway-specific BMPs:

- erosion_control_bmps (repeater with itemSchema):
  - bmp_type (select: Silt Fence, Inlet Protection, Stabilized Construction Entrance, Rock Check Dam, Temporary Seeding, Mulching, Erosion Control Blankets, Dust Control, Culvert Inlet Protection, Drainage Swales)
  - install_location (text)
  - install_date (date)
  - condition (select: Good, Fair, Poor, Failed)
  - maintenance_required (checkbox)
  - maintenance_notes (textarea, conditional on maintenance_required)

**Section 4: Right-of-Way Compliance (10 checkboxes)**

NDOT-specific ROW requirements:

- row_markers_installed (checkbox, "Right-of-way markers installed and visible")
- no_encroachment (checkbox, "No work outside designated ROW")
- utility_clearances_obtained (checkbox, "Utility clearances obtained")
- archaeological_clearance (checkbox, "Archaeological clearance on file")
- environmental_clearance (checkbox, "Environmental clearance on file")
- adjacent_property_protected (checkbox, "Adjacent property protected from impacts")
- drainage_maintained (checkbox, "Existing drainage patterns maintained")
- access_maintained (checkbox, "Property access maintained during construction")
- vegetation_protected (checkbox, "Vegetation outside work area protected")
- restoration_plan_approved (checkbox, "Site restoration plan approved by NDOT")

**Section 5: Inspection Requirements (repeater fields)**

Dual signature requirement (Contractor + NDOT):

- inspections (repeater with itemSchema):
  - inspection_date (date, required)
  - inspection_type (select: Routine, Post-Storm, Quarterly, Final)
  - contractor_inspector_name (text, required)
  - contractor_inspector_cert (text, "Certification number")
  - contractor_signature (signature, required)
  - ndot_inspector_name (text, required, "NDOT inspector separate from contractor")
  - ndot_inspector_signature (signature, required, "NDOT verification required")
  - findings (textarea)
  - corrective_actions (textarea)
  - next_inspection_date (date)

Create `packages/database/templates/13-ndot-swppp.json` with complete structure.

**Key Differences from NDEP Template:**

- NDOT project numbering format
- Mile post ranges for highways
- Traffic control BMPs section (highway-specific)
- Right-of-way compliance section
- Dual signature requirement (Contractor + NDOT inspector)

### Step 2: Validate Template (15 min)

```bash
cd packages/database
pnpm validate:templates 13-ndot-swppp.json
```

Expected: Template passes Zod validation, no duplicate field IDs.

### Step 3: Test Rendering (30 min)

Seed template and test in FormRenderer:

```bash
pnpm seed:template 13-ndot-swppp.json
```

Navigate to web frontend and test:

1. Select "NDOT SWPPP Template"
2. Verify 5 sections render
3. Test traffic_bmps repeater (highway-specific)
4. Test dual signature requirement in inspections repeater
5. Verify mile post number fields accept decimals
6. Screenshot: evidence/ISSUE-107/deployment/template-rendering.png

### Step 4: Manual Testing with Highway Data (45 min)

Fill realistic highway project data:

**Project Information:**

- Project Name: "I-580 Widening Mt. Rose to Geiger Grade"
- NDOT Project Number: 12345-67-8901
- Contract Number: NDOT-2025-123
- Route Number: "I-580"
- Begin Mile Post: 12.50
- End Mile Post: 18.75
- County: Washoe
- Contractor: "Q&D Construction"
- Contractor Contact: "John Smith"
- Contractor Phone: (775) 555-1234
- NDOT Resident Engineer: "Jane Doe"
- NDOT RE Phone: (775) 555-5678
- Total Disturbed Acres: 45.2
- Start Date: 2025-06-01
- End Date: 2027-05-31
- Receiving Waters: "Steamboat Creek drainage"

**Traffic Control BMPs (add 3):**

1. Work Zone Signage - MP 12.50-18.75 - 2025-06-01 - Q&D Construction - Good - 2025-10-20
2. Temporary Barriers - MP 14.00-16.00 - 2025-07-01 - Still active - Q&D Construction - Good - 2025-10-20
3. Lane Closures - MP 15.25 - 2025-08-15 - 2025-09-01 - NDOT - Good - 2025-10-15

**Erosion & Sediment Control BMPs (add 4):**

1. Silt Fence - North ROW perimeter - 2025-06-10 - Fair - Maintenance required (repair at Station 120+00)
2. Culvert Inlet Protection - All culverts MP 12.50-18.75 - 2025-06-15 - Good
3. Dust Control - Active work areas - 2025-06-01 - Good
4. Temporary Seeding - Disturbed slopes - 2025-09-15 - Good

**Right-of-Way Compliance:** Check all 10 items

**Inspections (add 2 with dual signatures):**

1. 2025-07-15 - Routine - John Smith (Contractor) - Cert ABC-123 - Jane Doe (NDOT) - Findings: All BMPs functional - Next: 2025-08-15
2. 2025-08-20 - Post-Storm - John Smith (Contractor) - Cert ABC-123 - Jane Doe (NDOT) - Findings: Silt fence damage at MP 15.5 - Corrective: Repaired same day - Next: 2025-09-20

Submit and verify dual signatures stored correctly.

Screenshot: evidence/ISSUE-107/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/13-ndot-swppp.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/13-ndot-swppp.json';
import { validateFormTemplate } from '../utils/validate-template';

describe('NDOT SWPPP Template', () => {
  it('should have highway-specific metadata', () => {
    expect(template.id).toBe('13-ndot-swppp');
    expect(template.compliance.agency).toBe('Nevada Department of Transportation');
    expect(template.compliance.regulation).toContain('NDOT Environmental Manual');
  });

  it('should have traffic control BMPs section', () => {
    const trafficSection = template.schema.sections.find((s) => s.id === 'traffic_control_bmps');
    expect(trafficSection).toBeDefined();
    const trafficField = trafficSection?.fields[0];
    expect(trafficField?.type).toBe('repeater');
  });

  it('should have dual signature requirement in inspections', () => {
    const inspectionsSection = template.schema.sections.find(
      (s) => s.id === 'inspection_requirements'
    );
    const inspectionsField = inspectionsSection?.fields[0];
    const fields = inspectionsField?.itemSchema?.fields || [];

    const contractorSig = fields.find((f) => f.id === 'contractor_signature');
    const ndotSig = fields.find((f) => f.id === 'ndot_inspector_signature');

    expect(contractorSig?.type).toBe('signature');
    expect(contractorSig?.required).toBe(true);
    expect(ndotSig?.type).toBe('signature');
    expect(ndotSig?.required).toBe(true);
  });

  it('should have mile post fields as numbers', () => {
    const projectSection = template.schema.sections.find((s) => s.id === 'project_information');
    const beginMP = projectSection?.fields.find((f) => f.id === 'begin_mile_post');
    const endMP = projectSection?.fields.find((f) => f.id === 'end_mile_post');

    expect(beginMP?.type).toBe('number');
    expect(endMP?.type).toBe('number');
  });

  it('should validate successfully', () => {
    expect(() => validateFormTemplate(template)).not.toThrow();
  });
});
```

Run tests:

```bash
cd packages/database
pnpm test 13-ndot-swppp
```

## Files to Create

- packages/database/templates/13-ndot-swppp.json
- packages/database/**tests**/templates/13-ndot-swppp.test.ts

## Verification Checklist

- [ ] Template JSON valid
- [ ] 5 sections present
- [ ] Traffic control BMPs section (highway-specific)
- [ ] Right-of-way compliance section (10 checkboxes)
- [ ] Dual signature requirement in inspections
- [ ] Mile post fields accept decimals
- [ ] NDOT project number format validated
- [ ] Template renders correctly
- [ ] Form submission successful
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-107/

- test-results/green-phase.png
- deployment/template-rendering.png
- deployment/form-submission.png (with dual signatures)
- deployment/traffic-bmps-repeater.png

## Success Criteria

- [ ] NDOT SWPPP template created
- [ ] Highway-specific fields functional
- [ ] Dual signature enforcement working
- [ ] Tests passing
- [ ] Evidence collected

## Time Estimate

**3 hours total:**

- PDF extraction (largest template): 70 min
- Validation: 15 min
- Test rendering: 30 min
- Manual testing: 45 min
- Tests + evidence: 20 min

## Next Issue

**ISSUE-108:** NDEP Weekly Stormwater Log (2h)
