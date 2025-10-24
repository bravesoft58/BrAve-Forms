# ISSUE-112: Visual Assessment Report

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-111 (Quarterly Visual Assessment complete)
**Status:** NOT STARTED

## What You'll Do

Create the detailed Visual Assessment Report template with lab analysis sections, monitoring data tables, signature and certification for EPA MSGP detailed reporting requirements.

## Prerequisites

- [ ] ISSUE-111 complete
- [ ] Backend running
- [ ] PDF source: Visual_Assessment_Report Fillable.pdf (166 KB)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (40 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/Visual_Assessment_Report Fillable.pdf

This is a more detailed version of the Quarterly Visual Assessment with lab analysis and monitoring data.

**Section 1: Facility and Permit Information (12 fields)**

- facility_name (text, required)
- facility_address (text, required)
- city (text)
- state (select, US states)
- zip_code (text)
- npdes_permit_number (text, required)
- facility_contact_name (text, required)
- contact_phone (text)
- contact_email (text)
- reporting_period_start (date, required)
- reporting_period_end (date, required)
- report_date (date, required)

**Section 2: Visual Assessment Observations (repeater fields)**

- observations (repeater, minItems: 1):
  - observation_date (date, required)
  - observation_time (time, required)
  - discharge_point_id (text, required)
  - weather_past_72h (textarea, "Weather conditions past 72 hours")
  - discharge_present (checkbox)
  - discharge_color (select: Clear, Brown, Gray, Green, Yellow, Red, Black, Other)
  - discharge_odor (select: None, Petroleum, Chemical, Sewage, Fishy, Rotten Eggs, Other)
  - discharge_clarity (select: Clear, Slightly Cloudy, Cloudy, Opaque)
  - floating_solids (checkbox)
  - suspended_solids (checkbox)
  - foam (checkbox)
  - oil_sheen (checkbox)
  - other_obvious_indicators (textarea)
  - visual_assessment_passed (checkbox, "Visual assessment indicates acceptable discharge quality")

**Section 3: Laboratory Analysis (repeater fields)**

Optional lab testing when visual assessment fails:

- lab_results (repeater, minItems: 0):
  - sample_date (date, required)
  - sample_time (time, required)
  - discharge_point_sampled (text, required)
  - lab_name (text, "Laboratory conducting analysis")
  - lab_cert_number (text, "Lab certification number")
  - ph_value (number, range 0-14, 1 decimal)
  - turbidity_ntu (number, "Nephelometric Turbidity Units")
  - tss_mg_l (number, "Total Suspended Solids (mg/L)")
  - oil_grease_mg_l (number, "Oil and Grease (mg/L)")
  - bod_mg_l (number, "Biochemical Oxygen Demand (mg/L)")
  - cod_mg_l (number, "Chemical Oxygen Demand (mg/L)")
  - other_parameters_tested (textarea)
  - exceedances_observed (checkbox)
  - exceedance_description (textarea, conditional on exceedances_observed)

**Section 4: Corrective Actions (repeater fields)**

- corrective_actions (repeater, minItems: 0):
  - action_date (date, required)
  - deficiency_identified (textarea, required)
  - corrective_action_description (textarea, required)
  - responsible_party (text)
  - completion_deadline (date)
  - action_status (select: Planned, In Progress, Completed)
  - completion_date (date, conditional on action_status = 'Completed')
  - verification_method (textarea, "How corrective action effectiveness was verified")
  - followup_required (checkbox)
  - followup_date (date, conditional on followup_required)

**Section 5: Monitoring Data Summary Table (8 fields)**

Summary statistics for reporting period:

- total_observations_conducted (number, required)
- observations_with_discharge (number)
- observations_passed_visual (number)
- observations_failed_visual (number)
- lab_samples_collected (number)
- lab_exceedances_detected (number)
- corrective_actions_implemented (number)
- facility_in_compliance (checkbox, "Facility in compliance with MSGP requirements")

**Section 6: Certification and Signature (5 fields)**

- preparer_name (text, required, "Report prepared by")
- preparer_title (text)
- preparer_date (date, required)
- authorized_signatory_name (text, required, "Facility authorized signatory")
- authorized_signatory_signature (signature, required)

Create `packages/database/templates/18-visual-assessment-report.json`.

**Key Features:**

- Detailed lab analysis section (pH, turbidity, TSS, BOD, COD, oil/grease)
- Monitoring data summary table
- Corrective actions tracking with status
- Visual observations repeater (multiple dates/locations)
- Lab results repeater (when visual assessment fails)
- Compliance certification

### Step 2: Validate Template (10 min)

```bash
cd packages/database
pnpm validate:templates 18-visual-assessment-report.json
```

### Step 3: Test Rendering (20 min)

```bash
pnpm seed:template 18-visual-assessment-report.json
```

Test in web frontend:

1. Select "Visual Assessment Report"
2. Verify 6 sections render
3. Test observations repeater (add 3-4 observations)
4. Test lab_results repeater (add 2 lab samples)
5. Test corrective_actions repeater (add 2 actions)
6. Verify conditional fields (exceedance_description, completion_date, followup_date)
7. Screenshot: evidence/ISSUE-112/deployment/template-rendering.png

### Step 4: Manual Testing with Detailed Report Data (50 min)

**Facility and Permit Information:**

- Facility Name: "Carson City Manufacturing"
- Facility Address: "5678 Industrial Parkway"
- City: "Carson City"
- State: Nevada
- ZIP Code: 89701
- NPDES Permit Number: NVR050001
- Contact Name: "Robert Garcia"
- Contact Phone: (775) 555-9876
- Contact Email: rgarcia@ccmfg.com
- Reporting Period Start: 2025-07-01
- Reporting Period End: 2025-09-30
- Report Date: 2025-10-10

**Visual Assessment Observations (add 4 - monthly + one extra):**

**Observation 1:**

- Date: 2025-07-15
- Time: 09:30
- Discharge Point: Outfall 001
- Weather Past 72h: "Clear, no precipitation"
- Discharge present: Yes
- Color: Clear
- Odor: None
- Clarity: Clear
- No floating solids, suspended solids, foam, oil sheen
- Visual assessment passed: Yes

**Observation 2:**

- Date: 2025-08-20
- Time: 10:15
- Discharge Point: Outfall 001
- Weather Past 72h: "Rain on 8/18 (0.45 inches), otherwise clear"
- Discharge present: Yes
- Color: Brown
- Odor: None
- Clarity: Cloudy
- Suspended solids: Yes
- No floating solids, foam, oil sheen
- Visual assessment passed: No (turbidity high)

**Observation 3:**

- Date: 2025-08-22
- Time: 14:00
- Discharge Point: Outfall 001
- Weather Past 72h: "Clear since 8/18 rain event"
- Discharge present: Yes
- Color: Clear
- Odor: None
- Clarity: Slightly Cloudy
- No indicators
- Visual assessment passed: Yes (improved after corrective action)

**Observation 4:**

- Date: 2025-09-25
- Time: 11:00
- Discharge Point: Outfall 001
- Weather Past 72h: "Clear, no precipitation"
- Discharge present: Yes
- Color: Clear
- Odor: None
- Clarity: Clear
- No indicators
- Visual assessment passed: Yes

**Laboratory Analysis (add 2 - for failed visual on 8/20):**

**Lab Sample 1:**

- Sample Date: 2025-08-20
- Sample Time: 10:30
- Discharge Point: Outfall 001
- Lab Name: "Nevada Environmental Lab"
- Lab Cert: NV-123-456
- pH: 7.8
- Turbidity: 45.2 NTU
- TSS: 78 mg/L
- Oil & Grease: 3.2 mg/L
- BOD: 12 mg/L
- COD: 25 mg/L
- Other parameters: "None"
- Exceedances observed: Yes
- Exceedance description: "Turbidity and TSS exceeded visual assessment criteria due to post-storm sediment mobilization"

**Lab Sample 2 (follow-up after corrective action):**

- Sample Date: 2025-08-23
- Sample Time: 09:00
- Discharge Point: Outfall 001
- Lab Name: "Nevada Environmental Lab"
- Lab Cert: NV-123-456
- pH: 7.5
- Turbidity: 8.3 NTU
- TSS: 15 mg/L
- Oil & Grease: 1.1 mg/L
- BOD: 5 mg/L
- COD: 10 mg/L
- Exceedances observed: No (corrective action effective)

**Corrective Actions (add 2):**

**Action 1:**

- Date: 2025-08-20
- Deficiency: "High turbidity and TSS in stormwater discharge after 8/18 rain event"
- Corrective Action: "Installed additional sediment trap, increased inlet protection capacity, cleaned all BMPs"
- Responsible Party: "Maintenance Supervisor - John Lee"
- Deadline: 2025-08-21
- Status: Completed
- Completion Date: 2025-08-21
- Verification: "Follow-up lab sample on 8/23 showed turbidity and TSS within acceptable range"
- No followup required

**Action 2:**

- Date: 2025-09-10
- Deficiency: "Sediment accumulation observed in sediment trap, reducing capacity"
- Corrective Action: "Clean sediment trap quarterly, increase maintenance frequency during rainy season"
- Responsible Party: "Maintenance Supervisor - John Lee"
- Deadline: 2025-09-15
- Status: Completed
- Completion Date: 2025-09-14
- Verification: "Sediment trap cleaned, capacity restored to 100%"
- Followup required: Yes
- Followup date: 2025-12-15 (quarterly cleaning)

**Monitoring Data Summary:**

- Total observations: 4
- Observations with discharge: 4
- Observations passed visual: 3
- Observations failed visual: 1
- Lab samples collected: 2
- Lab exceedances: 1 (8/20 sample)
- Corrective actions implemented: 2
- Facility in compliance: Yes (after corrective actions)

**Certification:**

- Preparer: "Maria Sanchez"
- Title: "Environmental Coordinator"
- Date: 2025-10-10
- Authorized Signatory: "Robert Garcia"
- Signature: (Draw signature)

Submit and verify all repeater data saved.

Screenshot: evidence/ISSUE-112/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/18-visual-assessment-report.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/18-visual-assessment-report.json';

describe('Visual Assessment Report Template', () => {
  it('should have lab analysis section with water quality parameters', () => {
    const labSection = template.schema.sections.find((s) => s.id === 'laboratory_analysis');
    const labField = labSection?.fields[0];
    const fields = labField?.itemSchema?.fields || [];

    const phField = fields.find((f) => f.id === 'ph_value');
    const turbidityField = fields.find((f) => f.id === 'turbidity_ntu');
    const tssField = fields.find((f) => f.id === 'tss_mg_l');

    expect(phField?.type).toBe('number');
    expect(turbidityField?.type).toBe('number');
    expect(tssField?.type).toBe('number');
  });

  it('should have corrective actions with status tracking', () => {
    const actionsSection = template.schema.sections.find((s) => s.id === 'corrective_actions');
    const actionsField = actionsSection?.fields[0];
    const statusField = actionsField?.itemSchema?.fields.find((f) => f.id === 'action_status');

    expect(statusField?.type).toBe('select');
    expect(statusField?.options).toEqual(['Planned', 'In Progress', 'Completed']);
  });

  it('should have monitoring data summary table', () => {
    const summarySection = template.schema.sections.find((s) => s.id === 'monitoring_data_summary');

    expect(summarySection).toBeDefined();
    expect(summarySection?.fields.length).toBeGreaterThanOrEqual(8);
  });

  it('should have compliance certification checkbox', () => {
    const summarySection = template.schema.sections.find((s) => s.id === 'monitoring_data_summary');
    const complianceField = summarySection?.fields.find((f) => f.id === 'facility_in_compliance');

    expect(complianceField?.type).toBe('checkbox');
  });
});
```

## Files to Create

- packages/database/templates/18-visual-assessment-report.json
- packages/database/**tests**/templates/18-visual-assessment-report.test.ts

## Verification Checklist

- [ ] Template created with 6 sections
- [ ] Lab analysis fields (pH, turbidity, TSS, BOD, COD, oil/grease)
- [ ] Observations repeater functional
- [ ] Lab results repeater functional
- [ ] Corrective actions with status tracking
- [ ] Monitoring data summary table complete
- [ ] Conditional fields working
- [ ] Tests passing
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-112/

- test-results/green-phase.png
- deployment/template-rendering.png
- deployment/form-submission.png (with lab data)
- deployment/corrective-actions-repeater.png

## Success Criteria

- [ ] Visual assessment report created
- [ ] Lab analysis section functional
- [ ] Corrective actions tracking working
- [ ] Tests passing
- [ ] Evidence collected

## Time Estimate

**2 hours total:**

- PDF extraction: 40 min
- Validation: 10 min
- Test rendering: 20 min
- Manual testing: 50 min

## Next Issue

**ISSUE-113:** Routine Facility Inspection (2h)
