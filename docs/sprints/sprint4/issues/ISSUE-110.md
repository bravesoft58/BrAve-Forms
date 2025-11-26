# ISSUE-110: TMWA Inspection Checklist

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-109 (NDOT Weekly Logs complete)
**Status:** COMPLETE (2025-11-26)

## What You'll Do

Create the Truckee Meadows Water Authority (TMWA) Inspection Checklist with water quality protection measures, erosion control verification, TMWA-specific reporting format, and Lake Tahoe watershed TMDL compliance considerations.

## Prerequisites

- [ ] ISSUE-109 complete
- [ ] Backend running
- [ ] PDF source: Inspection Checklist TMWA.pdf (334 KB)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (70 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/Inspection Checklist TMWA.pdf

TMWA serves Reno/Sparks area with strict water quality requirements, especially for Lake Tahoe watershed projects.

**Section 1: Site Information (12 fields)**

- site_name (text, required)
- site_address (text, required)
- tmwa_permit_number (text, required, "TMWA-YYYY-XXXX format")
- project_type (select: Residential, Commercial, Industrial, Utilities, Roadway)
- watershed (select: Truckee River, Steamboat Creek, Lake Tahoe, Other)
- lake_tahoe_tmdl (checkbox, "Project in Lake Tahoe TMDL area")
- contractor_name (text, required)
- contractor_contact (text)
- contractor_phone (text)
- inspection_date (date, required)
- inspector_name (text, required)
- inspector_cert (text, "TMWA certification number")

**Section 2: Erosion Control Measures (15 checkboxes)**

Water quality protection specific to TMWA requirements:

- perimeter_controls_installed (checkbox, "Perimeter erosion controls installed")
- sediment_barriers_functional (checkbox, "Sediment barriers functional")
- inlet_protection_installed (checkbox, "Storm drain inlet protection installed")
- inlet_protection_maintained (checkbox, "Inlet protection properly maintained")
- construction_entrance_stabilized (checkbox, "Construction entrance stabilized")
- tracking_prevented (checkbox, "Sediment tracking prevented")
- disturbed_areas_stabilized (checkbox, "Disturbed areas stabilized or covered")
- stockpiles_protected (checkbox, "Stockpiles covered or protected")
- slopes_protected (checkbox, "Slopes protected with BMPs")
- drainage_controls_functional (checkbox, "Drainage controls functional")
- discharge_clear (checkbox, "No sediment in discharge")
- no_offsite_impacts (checkbox, "No offsite water quality impacts")
- bmps_maintained (checkbox, "All BMPs properly maintained")
- erosion_control_blankets (checkbox, "Erosion control blankets installed on steep slopes")
- vegetation_established (checkbox, "Vegetation established on completed areas")

**Section 3: Sediment Control Measures (10 checkboxes)**

- sediment_traps_functional (checkbox, "Sediment traps/basins functional")
- check_dams_installed (checkbox, "Check dams installed in swales")
- silt_fence_intact (checkbox, "Silt fence intact and properly embedded")
- filter_fabric_clean (checkbox, "Filter fabric clean and functional")
- sediment_removed (checkbox, "Accumulated sediment removed")
- overflow_protection (checkbox, "Overflow protection in place")
- no_bypass (checkbox, "No evidence of BMP bypass")
- proper_installation (checkbox, "BMPs properly installed per plans")
- adequate_capacity (checkbox, "BMPs have adequate capacity")
- replacement_materials_onsite (checkbox, "Replacement materials available on site")

**Section 4: Water Quality Protection (12 fields)**

TMWA-specific water quality requirements:

- concrete_washout_designated (checkbox, "Concrete washout area designated and posted")
- washout_contained (checkbox, "Washout area contained and functional")
- no_concrete_discharge (checkbox, "No concrete discharge to waters")
- chemical_storage_compliant (checkbox, "Chemical storage compliant")
- fuel_storage_compliant (checkbox, "Fuel storage in secondary containment")
- spill_kit_available (checkbox, "Spill prevention kit available")
- no_spills_observed (checkbox, "No spills or leaks observed")
- equipment_clean (checkbox, "Equipment free of leaks")
- dewatering_permit_current (checkbox, "Dewatering permit current (if applicable)")
- dewatering_discharge_clear (checkbox, "Dewatering discharge clear (if applicable)")
- waterbody_protection (checkbox, "Waterbodies protected with buffers")
- lake_tahoe_bmps (checkbox, "Lake Tahoe TMDL BMPs implemented (if applicable)", conditional on lake_tahoe_tmdl)

**Section 5: Findings and Corrective Actions (repeater fields)**

- findings (repeater):
  - finding_date (date, required)
  - deficiency_description (textarea, required)
  - location (text, "Specific location on site")
  - severity (select: Minor, Moderate, Major)
  - corrective_action_required (textarea, required)
  - responsible_party (text)
  - completion_deadline (date)
  - corrective_action_completed (checkbox)
  - completion_date (date, conditional on corrective_action_completed)
  - verification_notes (textarea)

**Section 6: TMWA Certification (5 fields)**

- swppp_onsite (checkbox, required, "SWPPP available on site")
- training_current (checkbox, required, "Crew training current")
- compliance_status (select: In Compliance, Minor Deficiencies, Major Deficiencies)
- next_inspection_date (date, required)
- inspector_signature (signature, required)

Create `packages/database/templates/16-tmwa-inspection.json`.

**Key Features:**

- TMWA-specific permit numbering
- Watershed designation (Truckee River, Lake Tahoe)
- Lake Tahoe TMDL compliance section (conditional)
- Water quality protection emphasis
- Detailed findings and corrective actions repeater
- Compliance status assessment

### Step 2: Validate Template (15 min)

```bash
cd packages/database
pnpm validate:templates 16-tmwa-inspection.json
```

### Step 3: Test Rendering (30 min)

```bash
pnpm seed:template 16-tmwa-inspection.json
```

Test in web frontend:

1. Select "TMWA Inspection Checklist"
2. Verify 6 sections render
3. Test Lake Tahoe TMDL conditional field
4. Test findings repeater (add 2-3 findings)
5. Verify all checkboxes functional (37 total checkboxes)
6. Screenshot: evidence/ISSUE-110/deployment/template-rendering.png

### Step 4: Manual Testing with TMWA Data (45 min)

**Site Information:**

- Site Name: "Mt. Rose Ski Resort Expansion"
- Site Address: "22222 Mt. Rose Highway"
- TMWA Permit Number: TMWA-2025-1234
- Project Type: Commercial
- Watershed: Lake Tahoe
- Lake Tahoe TMDL: Yes (checked)
- Contractor: "Q&D Construction"
- Contractor Contact: "John Smith"
- Contractor Phone: (775) 555-1234
- Inspection Date: 2025-10-23
- Inspector Name: "Alice Johnson"
- Inspector Cert: TMWA-EC-5678

**Erosion Control Measures:** Check all 15 items (all compliant)

**Sediment Control Measures:** Check 9 of 10 items (filter_fabric_clean = unchecked, needs cleaning)

**Water Quality Protection:**

- Check all except:
  - dewatering_permit_current (not applicable, no dewatering)
  - dewatering_discharge_clear (not applicable)
- lake_tahoe_bmps: Checked (appears because lake_tahoe_tmdl = Yes)

**Findings and Corrective Actions (add 2):**

**Finding 1:**

- Date: 2025-10-23
- Deficiency: "Filter fabric at sediment basin has 40% sediment buildup, reducing effectiveness"
- Location: "Sediment Basin #2, west side of site"
- Severity: Moderate
- Corrective Action: "Clean filter fabric, remove accumulated sediment from basin"
- Responsible Party: "Q&D Foreman - Mike Davis"
- Deadline: 2025-10-25
- Not yet completed

**Finding 2:**

- Date: 2025-10-23
- Deficiency: "Minor erosion observed on slope at parking area"
- Location: "North parking lot, slope adjacent to Mt. Rose Highway"
- Severity: Minor
- Corrective Action: "Install erosion control blanket, seed and mulch slope"
- Responsible Party: "Q&D Foreman - Mike Davis"
- Deadline: 2025-10-30
- Not yet completed

**TMWA Certification:**

- SWPPP Onsite: Yes
- Training Current: Yes
- Compliance Status: Minor Deficiencies (filter fabric cleaning needed)
- Next Inspection Date: 2025-10-30
- Inspector Signature: (Draw signature)

Submit and verify findings stored as array.

Screenshot: evidence/ISSUE-110/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/16-tmwa-inspection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/16-tmwa-inspection.json';

describe('TMWA Inspection Checklist Template', () => {
  it('should have TMWA-specific metadata', () => {
    expect(template.id).toBe('16-tmwa-inspection');
    expect(template.compliance.agency).toBe('Truckee Meadows Water Authority');
    expect(template.compliance.regulation).toBe(
      'TMWA Regulation 21 - Erosion and Sediment Control'
    );
  });

  it('should have Lake Tahoe TMDL conditional field', () => {
    const siteSection = template.schema.sections.find((s) => s.id === 'site_information');
    const tmdlField = siteSection?.fields.find((f) => f.id === 'lake_tahoe_tmdl');

    expect(tmdlField?.type).toBe('checkbox');

    const waterQualitySection = template.schema.sections.find(
      (s) => s.id === 'water_quality_protection'
    );
    const laketahoeBmpsField = waterQualitySection?.fields.find((f) => f.id === 'lake_tahoe_bmps');

    expect(laketahoeBmpsField?.conditionalLogic?.field).toBe('lake_tahoe_tmdl');
    expect(laketahoeBmpsField?.conditionalLogic?.value).toBe(true);
  });

  it('should have watershed selection field', () => {
    const siteSection = template.schema.sections.find((s) => s.id === 'site_information');
    const watershedField = siteSection?.fields.find((f) => f.id === 'watershed');

    expect(watershedField?.type).toBe('select');
    expect(watershedField?.options).toContain('Lake Tahoe');
    expect(watershedField?.options).toContain('Truckee River');
  });

  it('should have findings repeater with severity levels', () => {
    const findingsSection = template.schema.sections.find(
      (s) => s.id === 'findings_corrective_actions'
    );
    const findingsField = findingsSection?.fields[0];
    const severityField = findingsField?.itemSchema?.fields.find((f) => f.id === 'severity');

    expect(severityField?.type).toBe('select');
    expect(severityField?.options).toEqual(['Minor', 'Moderate', 'Major']);
  });

  it('should have compliance status field', () => {
    const certSection = template.schema.sections.find((s) => s.id === 'tmwa_certification');
    const complianceField = certSection?.fields.find((f) => f.id === 'compliance_status');

    expect(complianceField?.type).toBe('select');
    expect(complianceField?.options).toContain('In Compliance');
    expect(complianceField?.options).toContain('Major Deficiencies');
  });
});
```

## Files to Create

- packages/database/templates/16-tmwa-inspection.json
- packages/database/**tests**/templates/16-tmwa-inspection.test.ts

## Verification Checklist

- [ ] Template created with 6 sections
- [ ] 37 total checkboxes (erosion + sediment + water quality)
- [ ] Watershed selection functional
- [ ] Lake Tahoe TMDL conditional field working
- [ ] Findings repeater functional
- [ ] Compliance status dropdown working
- [ ] Tests passing
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-110/

- test-results/green-phase.png
- deployment/template-rendering.png
- deployment/form-submission.png (with Lake Tahoe TMDL checked)
- deployment/findings-repeater.png

## Success Criteria

- [ ] TMWA inspection checklist created
- [ ] Lake Tahoe TMDL compliance working
- [ ] Findings repeater functional
- [ ] Tests passing
- [ ] Evidence collected

## Time Estimate

**3 hours total:**

- PDF extraction: 70 min
- Validation: 15 min
- Test rendering: 30 min
- Manual testing: 45 min
- Tests + evidence: 20 min

## Next Issue

**ISSUE-111:** Quarterly Visual Assessment (2h)
