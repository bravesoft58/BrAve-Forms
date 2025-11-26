# ISSUE-114: WIW Daily Form

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-113 (Routine Facility Inspection complete)
**Status:** COMPLETE (2025-11-26)

## What You'll Do

Create the WIW (Work In Water) Daily Form template for aquatic environment protection with turbidity monitoring (NTU readings), best practices compliance, and fish and wildlife observations per Nevada NAC 503 (Wildlife Protection).

## Prerequisites

- [ ] ISSUE-113 complete
- [ ] Backend running
- [ ] PDF source: WIW Daily Form.xlsx (58 KB - Excel format, convert to JSON)

## Step-by-Step Instructions

### Step 1: Extract Excel Fields and Convert to JSON (50 min)

**Download File:** Spec Updates/Forms from QD Enviro/WIW Daily Form.xlsx

This is an Excel spreadsheet (not PDF), so extraction requires converting Excel structure to JSON field definitions.

**Section 1: Project Information (12 fields)**

- project_name (text, required)
- project_location (text, required)
- waterbody_name (text, required, "Name of stream, river, or lake")
- waterbody_type (select: Stream, River, Lake, Reservoir, Wetland)
- work_type (select: Bridge Construction, Culvert Installation, Stream Crossing, Dredging, Riprap Installation, Other)
- contractor_name (text, required)
- environmental_monitor (text, required)
- monitor_phone (text)
- work_start_date (date, required)
- work_end_date (date)
- permit_number (text, "Nevada DEP or Army Corps permit number")
- permit_agency (select: Nevada DEP, Army Corps of Engineers, Both)

**Section 2: Daily Work Log (repeater fields)**

Daily tracking of work in water activities:

- daily_logs (repeater, minItems: 1):
  - log_date (date, required)
  - work_performed (checkbox, "Work in water performed today")
  - work_description (textarea, conditional on work_performed, "Describe work activities")
  - work_start_time (time, conditional on work_performed)
  - work_end_time (time, conditional on work_performed)
  - equipment_used (textarea, conditional on work_performed, "Equipment used in water")
  - water_depth_ft (number, "Water depth at work location (feet)", 1 decimal)
  - flow_conditions (select: No Flow, Low Flow, Moderate Flow, High Flow)
  - weather_conditions (select: Clear, Cloudy, Rain)
  - air_temp_f (number, "Air temperature (°F)")
  - water_temp_f (number, "Water temperature (°F)")

**Section 3: Turbidity Monitoring (repeater fields within daily_logs)**

NTU readings required when working in water:

- turbidity_readings (repeater, minItems: 0, nested within daily_logs):
  - reading_time (time, required)
  - location (select: Upstream, Work Area, Downstream 100ft, Downstream 300ft)
  - turbidity_ntu (number, required, "Nephelometric Turbidity Units", 1 decimal)
  - threshold_exceeded (checkbox, "Turbidity >25 NTU above upstream")
  - corrective_action (textarea, conditional on threshold_exceeded)

**Section 4: Best Management Practices (12 checkboxes)**

Aquatic protection BMPs:

- silt_curtain_installed (checkbox, "Silt curtain installed and functional")
- turbidity_curtain_maintained (checkbox, "Turbidity curtain properly maintained")
- cofferdam_intact (checkbox, "Cofferdam intact and dewatered")
- dewatering_controlled (checkbox, "Dewatering discharge controlled")
- sediment_controls_functional (checkbox, "Sediment controls functional")
- no_fuel_in_water (checkbox, "No fueling operations over water")
- equipment_clean (checkbox, "Equipment clean, no leaks")
- spill_kit_onsite (checkbox, "Spill prevention kit on site")
- exclusion_zone_marked (checkbox, "Work exclusion zone marked")
- fish_relocation_complete (checkbox, "Fish relocation complete (if required)")
- vegetation_buffers_protected (checkbox, "Riparian vegetation buffers protected")
- work_area_isolated (checkbox, "Work area isolated from flowing water")

**Section 5: Fish and Wildlife Observations (8 fields)**

Nevada NAC 503 wildlife protection compliance:

- fish_observed (checkbox)
- fish_species (textarea, conditional on fish_observed, "Species observed")
- fish_behavior (select: Normal, Stressed, Mortality, conditional on fish_observed)
- wildlife_observed (checkbox, "Other wildlife observed")
- wildlife_species (textarea, conditional on wildlife_observed)
- nesting_birds_present (checkbox, "Nesting birds present near work area")
- work_restrictions_followed (checkbox, "Wildlife work restrictions followed (seasonal, buffer zones)")
- wildlife_agency_notified (checkbox, "Nevada NDOW notified of observations (if required)")

**Section 6: Environmental Incidents (5 fields)**

- incidents_occurred (checkbox)
- incident_type (select: Spill, Fish Kill, Excessive Turbidity, Equipment Failure, Other, conditional on incidents_occurred)
- incident_description (textarea, conditional on incidents_occurred)
- incident_response (textarea, conditional on incidents_occurred)
- agency_notification_required (checkbox, conditional on incidents_occurred)

**Section 7: Daily Certification (4 fields)**

- bmps_maintained (checkbox, required, "All BMPs maintained per permit requirements")
- no_unauthorized_impacts (checkbox, required, "No unauthorized impacts to waterbody")
- monitor_signature (signature, required)
- monitor_date (date, required)

Create `packages/database/templates/20-wiw-daily-form.json`.

**Key Features:**

- Nevada-specific Work In Water regulations
- Turbidity monitoring with NTU readings (nested repeater within daily logs)
- Threshold exceedance tracking (>25 NTU above upstream)
- Fish and wildlife observations (NAC 503 compliance)
- Aquatic environment BMPs (silt curtains, cofferdams, dewatering)
- Environmental incident tracking

### Step 2: Validate Template (10 min)

```bash
cd packages/database
pnpm validate:templates 20-wiw-daily-form.json
```

### Step 3: Test Rendering (20 min)

```bash
pnpm seed:template 20-wiw-daily-form.json
```

Test nested repeater structure (turbidity_readings within daily_logs).

Screenshot: evidence/ISSUE-114/deployment/template-rendering.png

### Step 4: Manual Testing with WIW Data (40 min)

**Project Information:**

- Project: "Truckee River Bridge Replacement"
- Location: "I-80 Mile Post 5.2, Reno, NV"
- Waterbody: "Truckee River"
- Type: Stream
- Work Type: Bridge Construction
- Contractor: "Q&D Construction"
- Environmental Monitor: "Sarah Miller"
- Phone: (775) 555-4321
- Start Date: 2025-08-01
- End Date: 2025-11-30
- Permit: NEV-WIW-2025-123
- Agency: Both (Nevada DEP and Army Corps)

**Daily Log (add 2 days):**

**Day 1 - 2025-08-15:**

- Work performed: Yes
- Work description: "Installed cofferdam for bridge pier foundation excavation"
- Start time: 07:00
- End time: 15:00
- Equipment: "Excavator, vibratory hammer, sheet piles"
- Water depth: 3.5 ft
- Flow: Moderate Flow
- Weather: Clear
- Air temp: 78°F
- Water temp: 62°F

Turbidity readings (add 4):

1. 06:45 - Upstream - 8.2 NTU (baseline)
2. 09:00 - Work Area - 45.5 NTU - Threshold exceeded (45.5 - 8.2 = 37.3 NTU above upstream) - Corrective action: "Installed additional silt curtain, reduced excavation rate"
3. 12:00 - Downstream 100ft - 18.3 NTU
4. 15:30 - Downstream 300ft - 10.1 NTU

**Day 2 - 2025-08-16:**

- Work performed: Yes
- Work description: "Continued cofferdam installation and dewatering"
- Start time: 07:00
- End time: 16:00
- Equipment: "Pumps, excavator, sheet piles"
- Water depth: 3.5 ft
- Flow: Moderate Flow
- Weather: Clear
- Air temp: 82°F
- Water temp: 64°F

Turbidity readings (add 4):

1. 07:00 - Upstream - 7.8 NTU
2. 09:00 - Work Area - 22.5 NTU (within threshold, 14.7 above upstream)
3. 12:00 - Downstream 100ft - 14.2 NTU
4. 16:00 - Downstream 300ft - 9.3 NTU

**BMPs:** Check all 12 items

**Fish and Wildlife Observations:**

- Fish observed: Yes
- Species: "Rainbow trout, mountain whitefish"
- Behavior: Normal
- Wildlife observed: Yes
- Wildlife species: "Great blue heron, belted kingfisher"
- No nesting birds
- Work restrictions followed: Yes
- Wildlife agency notified: No (no incidents requiring notification)

**Environmental Incidents:** No incidents

**Daily Certification:**

- BMPs maintained: Yes
- No unauthorized impacts: Yes
- Monitor signature: (Draw signature)
- Date: 2025-08-16

Submit and verify nested turbidity readings stored correctly.

Screenshot: evidence/ISSUE-114/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/20-wiw-daily-form.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/20-wiw-daily-form.json';

describe('WIW Daily Form Template', () => {
  it('should have Nevada NAC 503 wildlife protection compliance', () => {
    expect(template.compliance.regulation).toContain('Nevada NAC 503');
  });

  it('should have nested turbidity readings repeater within daily logs', () => {
    const dailySection = template.schema.sections.find((s) => s.id === 'daily_work_log');
    const dailyField = dailySection?.fields[0];
    const turbidityField = dailyField?.itemSchema?.fields.find(
      (f) => f.id === 'turbidity_readings'
    );

    expect(turbidityField?.type).toBe('repeater');
    expect(turbidityField?.itemSchema?.fields).toBeDefined();
  });

  it('should have turbidity threshold exceedance conditional field', () => {
    const dailySection = template.schema.sections.find((s) => s.id === 'daily_work_log');
    const dailyField = dailySection?.fields[0];
    const turbidityField = dailyField?.itemSchema?.fields.find(
      (f) => f.id === 'turbidity_readings'
    );
    const correctiveAction = turbidityField?.itemSchema?.fields.find(
      (f) => f.id === 'corrective_action'
    );

    expect(correctiveAction?.conditionalLogic?.field).toBe('threshold_exceeded');
  });
});
```

## Files to Create

- packages/database/templates/20-wiw-daily-form.json
- packages/database/**tests**/templates/20-wiw-daily-form.test.ts

## Time Estimate

**2 hours total:**

- Excel to JSON conversion: 50 min
- Validation: 10 min
- Test rendering: 20 min
- Manual testing: 40 min

## Next Issue

**ISSUE-115:** Validate All Templates (1h)
