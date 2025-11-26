# ISSUE-113: Routine Facility Inspection

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-112 (Visual Assessment Report complete)
**Status:** COMPLETE (2025-11-26)

## What You'll Do

Create the Routine Facility Inspection template for industrial facilities with equipment condition assessment, spill prevention verification, housekeeping standards, and material storage compliance per EPA SPCC requirements.

## Prerequisites

- [ ] ISSUE-112 complete
- [ ] Backend running
- [ ] PDF source: Routine Facility Inspection Fillable.pdf (191 KB)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (40 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/Routine Facility Inspection Fillable.pdf

EPA SPCC (Spill Prevention, Control, and Countermeasure) routine facility inspection checklist.

**Section 1: Facility Information (10 fields)**

- facility_name (text, required)
- facility_address (text, required)
- facility_contact (text, required)
- contact_phone (text)
- inspection_date (date, required)
- inspection_time (time)
- inspector_name (text, required)
- inspector_title (text)
- inspection_frequency (select: Weekly, Monthly, Quarterly)
- last_inspection_date (date)

**Section 2: Equipment Condition Assessment (repeater fields)**

- equipment_inspections (repeater, minItems: 1):
  - equipment_id (text, required, "Tank 1, Pump 2, etc.")
  - equipment_type (select: Storage Tank, Transfer Pump, Piping, Valve, Loading Rack, Other)
  - equipment_location (text)
  - visual_condition (select: Good, Fair, Poor)
  - leaks_observed (checkbox)
  - leak_description (textarea, conditional on leaks_observed)
  - corrosion_observed (checkbox)
  - corrosion_severity (select: Minor, Moderate, Severe, conditional on corrosion_observed)
  - mechanical_integrity (checkbox, "Equipment operating properly")
  - maintenance_required (checkbox)
  - maintenance_notes (textarea, conditional on maintenance_required)

**Section 3: Spill Prevention Measures (12 checkboxes)**

- secondary_containment_intact (checkbox, "Secondary containment intact and functional")
- containment_capacity_adequate (checkbox, "Containment capacity adequate (110% of largest tank)")
- containment_free_of_liquids (checkbox, "Containment area free of accumulated liquids")
- valves_closed (checkbox, "Valves closed when not in use")
- overfill_protection_functional (checkbox, "Overfill protection operational")
- spill_kit_available (checkbox, "Spill prevention kit available and stocked")
- response_equipment_accessible (checkbox, "Spill response equipment accessible")
- emergency_contacts_posted (checkbox, "Emergency contact numbers posted")
- drainage_controlled (checkbox, "Facility drainage controls in place")
- no_unauthorized_discharge (checkbox, "No unauthorized discharge observed")
- spcc_plan_onsite (checkbox, "SPCC plan available on site")
- training_records_current (checkbox, "Employee training records current")

**Section 4: Housekeeping Standards (10 checkboxes)**

- area_clean_organized (checkbox, "Work areas clean and organized")
- spills_cleaned (checkbox, "No evidence of unreported spills")
- waste_properly_stored (checkbox, "Waste materials properly stored and labeled")
- containers_labeled (checkbox, "All containers properly labeled")
- incompatible_materials_separated (checkbox, "Incompatible materials separated")
- drum_storage_compliant (checkbox, "Drum storage compliant with regulations")
- floor_free_of_debris (checkbox, "Floors free of debris and obstructions")
- lighting_adequate (checkbox, "Lighting adequate in all areas")
- ventilation_functioning (checkbox, "Ventilation systems functioning")
- fire_extinguishers_accessible (checkbox, "Fire extinguishers accessible and inspected")

**Section 5: Material Storage Compliance (repeater fields)**

- storage_areas (repeater, minItems: 0):
  - storage_area_id (text, required)
  - material_stored (text, required, "Type of material stored")
  - quantity (number, "Gallons or units")
  - secondary_containment (checkbox, "Secondary containment present")
  - containment_capacity (number, "Gallons", conditional on secondary_containment)
  - proper_labeling (checkbox, "Materials properly labeled")
  - sds_available (checkbox, "Safety Data Sheet available")
  - compliant_storage (checkbox, "Storage compliant with regulations")
  - issues_identified (textarea, "Describe any storage compliance issues")

**Section 6: Findings and Corrective Actions (8 fields)**

- deficiencies_found (checkbox)
- deficiency_count (number, conditional on deficiencies_found)
- deficiency_summary (textarea, conditional on deficiencies_found)
- immediate_actions_taken (textarea)
  - corrective_actions_required (textarea)
- responsible_party (text, "Person responsible for corrective actions")
- completion_deadline (date)
- next_inspection_date (date, required)

**Section 7: Inspector Certification (3 fields)**

- inspector_certification (checkbox, required, "I certify this inspection was conducted per facility SPCC plan requirements")
- inspector_name_cert (text, required)
- inspector_signature (signature, required)

Create `packages/database/templates/19-routine-facility-inspection.json`.

**Key Features:**

- EPA SPCC compliance focus
- Equipment condition tracking (tanks, pumps, piping)
- Secondary containment verification
- Spill prevention measures (12 checkboxes)
- Housekeeping standards (10 checkboxes)
- Material storage compliance repeater
- Corrective action tracking

### Step 2: Validate Template (10 min)

```bash
cd packages/database
pnpm validate:templates 19-routine-facility-inspection.json
```

### Step 3: Test Rendering (20 min)

```bash
pnpm seed:template 19-routine-facility-inspection.json
```

Test in web frontend - verify all 7 sections render properly.

Screenshot: evidence/ISSUE-113/deployment/template-rendering.png

### Step 4: Manual Testing with Facility Data (50 min)

Fill realistic industrial facility inspection data with equipment, spill prevention, and storage areas.

Submit and verify all data saved.

Screenshot: evidence/ISSUE-113/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/19-routine-facility-inspection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/19-routine-facility-inspection.json';

describe('Routine Facility Inspection Template', () => {
  it('should have EPA SPCC compliance metadata', () => {
    expect(template.compliance.regulation).toContain('EPA SPCC');
  });

  it('should have equipment inspections repeater', () => {
    const equipSection = template.schema.sections.find(
      (s) => s.id === 'equipment_condition_assessment'
    );
    const equipField = equipSection?.fields[0];

    expect(equipField?.type).toBe('repeater');
  });

  it('should have 22 total checkboxes for spill prevention and housekeeping', () => {
    const spillSection = template.schema.sections.find((s) => s.id === 'spill_prevention_measures');
    const houseSection = template.schema.sections.find((s) => s.id === 'housekeeping_standards');

    expect(spillSection?.fields.length).toBe(12);
    expect(houseSection?.fields.length).toBe(10);
  });
});
```

## Files to Create

- packages/database/templates/19-routine-facility-inspection.json
- packages/database/**tests**/templates/19-routine-facility-inspection.test.ts

## Time Estimate

**2 hours total**

## Next Issue

**ISSUE-114:** WIW Daily Form (2h)
