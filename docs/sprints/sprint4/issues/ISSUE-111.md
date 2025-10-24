# ISSUE-111: Quarterly Visual Assessment

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-110 (TMWA Inspection complete)
**Status:** NOT STARTED

## What You'll Do

Create the EPA MSGP (Multi-Sector General Permit) Quarterly Visual Assessment template with visual stormwater discharge inspection, photograph documentation requirements (4 photos minimum), and corrective action tracking.

## Prerequisites

- [ ] ISSUE-110 complete
- [ ] Backend running
- [ ] PDF source: Quarterly Visual Assessment Fillable.pdf (78 KB)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (40 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/Quarterly Visual Assessment Fillable.pdf

EPA MSGP Part 3.2.3 requires quarterly visual assessments of stormwater discharge.

**Section 1: Facility Information (10 fields)**

- facility_name (text, required)
- facility_address (text, required)
- npdes_permit_number (text, required, "EPA MSGP permit")
- sic_code (text, "Standard Industrial Classification code")
- assessment_quarter (select: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec), required)
- assessment_date (date, required)
- assessor_name (text, required)
- assessor_title (text)
- weather_conditions (select: Clear, Cloudy, Rain (current), Rain (previous 48h))
- precipitation_last_48h (number, "Inches, 2 decimals")

**Section 2: Discharge Point Assessments (repeater fields)**

Visual assessment at each discharge point:

- discharge_points (repeater, minItems: 1):
  - discharge_point_id (text, required, "Outfall 001, 002, etc.")
  - discharge_observed (checkbox, "Discharge observed during assessment")
  - discharge_flow_estimate (select: Trickle, Moderate, High, conditional on discharge_observed)
  - color (select: Clear, Brown, Gray, Green, Yellow, Other)
  - odor (select: None, Petroleum, Chemical, Sewage, Other)
  - clarity (select: Clear, Slightly Turbid, Turbid, Opaque)
  - floating_materials (checkbox, "Floating materials observed")
  - floating_materials_description (textarea, conditional on floating_materials)
  - settled_solids (checkbox, "Settled solids observed")
  - settled_solids_description (textarea, conditional on settled_solids)
  - foam (checkbox, "Foam or suds observed")
  - oil_sheen (checkbox, "Oil sheen observed")
  - potential_pollutants (textarea, "Describe any potential pollutants identified")
  - corrective_action_required (checkbox)
  - corrective_action_description (textarea, conditional on corrective_action_required)

**Section 3: Photograph Documentation (repeater fields)**

EPA MSGP requires minimum 4 photos per quarterly assessment:

- photographs (repeater, minItems: 4):
  - photo_number (number, "Photo 1, 2, 3, 4...")
  - photo_upload (file, required, "Photo upload field")
  - photo_description (textarea, required, "What this photo shows")
  - discharge_point_depicted (text, "Which discharge point this photo documents")
  - photo_timestamp (datetime, required, auto-populated from EXIF)
  - photo_gps_lat (text, auto-populated from EXIF if available)
  - photo_gps_lon (text, auto-populated from EXIF if available)

**Section 4: Overall Assessment Summary (8 fields)**

- all_discharge_points_assessed (checkbox, required, "All discharge points assessed")
- total_discharge_points_assessed (number, "Count of discharge points")
- discharge_points_with_issues (number, "Count with corrective actions needed")
- significant_pollutants_observed (checkbox)
- pollutant_description (textarea, conditional on significant_pollutants_observed)
- corrective_actions_implemented (textarea, "Corrective actions already implemented")
- corrective_actions_planned (textarea, "Corrective actions planned")
- next_assessment_date (date, required, "Next quarterly assessment due date")

**Section 5: Certification (4 fields)**

- certification_statement (checkbox, required, "I certify under penalty of law that this document and all attachments were prepared under my direction or supervision")
- certifier_name (text, required)
- certifier_title (text, required, "Must be authorized signatory per EPA MSGP")
- certifier_signature (signature, required)

Create `packages/database/templates/17-quarterly-visual-assessment.json`.

**Key Features:**

- EPA MSGP Part 3.2.3 compliance
- Quarterly assessment cycle
- Discharge point repeater (multiple outfalls)
- Photograph documentation repeater (minimum 4 photos)
- Visual assessment parameters (color, odor, clarity, etc.)
- Corrective action tracking
- Certification statement with legal language

### Step 2: Validate Template (10 min)

```bash
cd packages/database
pnpm validate:templates 17-quarterly-visual-assessment.json
```

### Step 3: Test Rendering (20 min)

```bash
pnpm seed:template 17-quarterly-visual-assessment.json
```

Test in web frontend:

1. Select "Quarterly Visual Assessment"
2. Verify 5 sections render
3. Test discharge_points repeater (add 3 outfalls)
4. Test photographs repeater (add 4+ photos)
5. Verify minItems: 4 enforcement on photographs (can't submit with <4 photos)
6. Test conditional fields (floating_materials_description, oil_sheen)
7. Screenshot: evidence/ISSUE-111/deployment/template-rendering.png

### Step 4: Manual Testing with MSGP Data (50 min)

**Facility Information:**

- Facility Name: "Reno Concrete Plant"
- Facility Address: "1234 Industrial Way, Reno, NV 89502"
- NPDES Permit Number: NVR050000
- SIC Code: 3273 (Ready-Mixed Concrete)
- Assessment Quarter: Q3 (Jul-Sep)
- Assessment Date: 2025-09-30
- Assessor Name: "Tom Wilson"
- Assessor Title: "Environmental Compliance Manager"
- Weather Conditions: Clear
- Precipitation Last 48h: 0.00 inches

**Discharge Point Assessments (add 3):**

**Discharge Point 001:**

- Discharge Point ID: "Outfall 001"
- Discharge observed: Yes
- Flow estimate: Trickle
- Color: Clear
- Odor: None
- Clarity: Clear
- No floating materials
- No settled solids
- No foam
- No oil sheen
- Potential pollutants: "None observed"
- No corrective action required

**Discharge Point 002:**

- Discharge Point ID: "Outfall 002"
- Discharge observed: Yes
- Flow estimate: Moderate
- Color: Slightly Brown
- Odor: None
- Clarity: Slightly Turbid
- No floating materials
- Settled solids: Yes
- Settled solids description: "Minor sediment accumulation at discharge point, likely from concrete washout area runoff"
- No foam
- No oil sheen
- Potential pollutants: "Concrete fines, pH elevated"
- Corrective action required: Yes
- Corrective action: "Clean sediment trap upstream of Outfall 002, inspect concrete washout area containment"

**Discharge Point 003:**

- Discharge Point ID: "Outfall 003"
- Discharge observed: No (dry)
- Color: N/A
- Odor: N/A
- Clarity: N/A
- No issues observed

**Photographs (add 4):**

1. Photo 1 - Outfall 001 - "Clear discharge, no visible pollutants" - (Upload photo)
2. Photo 2 - Outfall 002 - "Sediment accumulation visible at discharge point" - (Upload photo)
3. Photo 3 - Outfall 002 - "Concrete washout area upstream of Outfall 002" - (Upload photo)
4. Photo 4 - Outfall 003 - "Dry discharge point, no flow observed" - (Upload photo)

**Overall Assessment Summary:**

- All discharge points assessed: Yes
- Total discharge points: 3
- Discharge points with issues: 1 (Outfall 002)
- Significant pollutants observed: No (minor sediment only)
- Corrective actions implemented: "Cleaned sediment trap immediately after assessment"
- Corrective actions planned: "Install additional sediment trap capacity at Outfall 002, quarterly maintenance schedule for all traps"
- Next assessment date: 2025-12-31 (Q4)

**Certification:**

- Certification statement: Checked ("I certify under penalty of law...")
- Certifier name: "Sarah Johnson"
- Certifier title: "Plant Manager (Authorized Signatory)"
- Certifier signature: (Draw signature)

Submit and verify all data saved, especially photo uploads.

Screenshot: evidence/ISSUE-111/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/17-quarterly-visual-assessment.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/17-quarterly-visual-assessment.json';

describe('Quarterly Visual Assessment Template', () => {
  it('should have EPA MSGP compliance metadata', () => {
    expect(template.compliance.regulation).toBe('EPA MSGP Part 3.2.3');
    expect(template.compliance.frequency).toContain('Quarterly');
  });

  it('should have discharge points repeater', () => {
    const dischargeSection = template.schema.sections.find(
      (s) => s.id === 'discharge_point_assessments'
    );
    const dischargeField = dischargeSection?.fields[0];

    expect(dischargeField?.type).toBe('repeater');
    expect(dischargeField?.minItems).toBe(1);
  });

  it('should have photographs repeater with minimum 4 photos', () => {
    const photoSection = template.schema.sections.find((s) => s.id === 'photograph_documentation');
    const photoField = photoSection?.fields[0];

    expect(photoField?.type).toBe('repeater');
    expect(photoField?.minItems).toBe(4);
  });

  it('should have conditional fields for pollutant descriptions', () => {
    const dischargeSection = template.schema.sections.find(
      (s) => s.id === 'discharge_point_assessments'
    );
    const dischargeField = dischargeSection?.fields[0];
    const floatingDesc = dischargeField?.itemSchema?.fields.find(
      (f) => f.id === 'floating_materials_description'
    );

    expect(floatingDesc?.conditionalLogic?.field).toBe('floating_materials');
    expect(floatingDesc?.conditionalLogic?.value).toBe(true);
  });

  it('should have certification statement with legal language', () => {
    const certSection = template.schema.sections.find((s) => s.id === 'certification');
    const certField = certSection?.fields.find((f) => f.id === 'certification_statement');

    expect(certField?.type).toBe('checkbox');
    expect(certField?.required).toBe(true);
    expect(certField?.label).toContain('penalty of law');
  });
});
```

## Files to Create

- packages/database/templates/17-quarterly-visual-assessment.json
- packages/database/**tests**/templates/17-quarterly-visual-assessment.test.ts

## Verification Checklist

- [ ] Template created with 5 sections
- [ ] Discharge points repeater functional
- [ ] Photographs repeater enforces minItems: 4
- [ ] Visual assessment parameters complete
- [ ] Conditional logic working
- [ ] Certification statement present
- [ ] Tests passing
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-111/

- test-results/green-phase.png
- deployment/template-rendering.png
- deployment/form-submission.png (with 4+ photos)
- deployment/discharge-points-repeater.png

## Success Criteria

- [ ] Quarterly visual assessment created
- [ ] EPA MSGP compliance verified
- [ ] Photo documentation working (min 4)
- [ ] Tests passing
- [ ] Evidence collected

## Time Estimate

**2 hours total:**

- PDF extraction: 40 min
- Validation: 10 min
- Test rendering: 20 min
- Manual testing: 50 min

## Next Issue

**ISSUE-112:** Visual Assessment Report (2h)
