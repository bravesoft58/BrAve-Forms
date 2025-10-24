# ISSUE-108: NDEP Weekly Stormwater Log

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-107 (NDOT SWPPP complete)
**Status:** NOT STARTED

## What You'll Do

Create the Nevada DEP Weekly Stormwater Log template with 7-day inspection format, visual assessment checkboxes, and weather conditions tracking.

## Prerequisites

- [ ] ISSUE-107 complete
- [ ] Backend running
- [ ] PDF source: NDEP Weekly Stormwater Log.pdf (251 KB)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (45 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/NDEP Weekly Stormwater Log.pdf

**Section 1: Site Information (8 fields)**

- site_name (text, required)
- permit_number (text, required, "NEV-XXXXXX format")
- week_starting (date, required, "Monday of inspection week")
- week_ending (date, required, "Sunday of inspection week")
- inspector_name (text, required)
- inspector_cert (text, "NDEP certification number")
- project_phase (select: Site Prep, Active Construction, Final Grading, Final Stabilization)
- total_disturbed_acres (number, 2 decimals)

**Section 2: Daily Inspections (repeater fields)**

7-day format with daily checklist:

- daily_inspections (repeater with itemSchema, minItems: 1, maxItems: 7):
  - inspection_date (date, required)
  - day_of_week (select: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
  - weather_conditions (select: Clear, Cloudy, Rain, Snow, Wind, Dust)
  - precipitation_amount (number, "Inches, 2 decimals")
  - visual_assessment_complete (checkbox, required)
  - bmps_functional (checkbox, "All BMPs functioning properly")
  - erosion_observed (checkbox, "Erosion or sediment discharge observed")
  - maintenance_performed (checkbox, "Maintenance performed today")
  - maintenance_description (textarea, conditional on maintenance_performed)
  - corrective_actions (textarea, conditional on erosion_observed)
  - next_day_followup_required (checkbox)
  - inspector_initials (text, required)

**Section 3: Weekly Summary (8 fields)**

- total_precipitation_week (number, 2 decimals, "Total inches for week")
- storm_events_count (number, "Number of 0.25+ inch events")
- bmps_repaired_count (number, "BMPs repaired this week")
- new_bmps_installed_count (number, "New BMPs installed this week")
- non_compliance_observed (checkbox)
- non_compliance_description (textarea, conditional on non_compliance_observed)
- next_week_planned_work (textarea)
- weekly_certification_signature (signature, required)

Create `packages/database/templates/14-ndep-weekly-stormwater.json`.

**Key Features:**

- Simpler than SWPPP template (weekly log vs full plan)
- Daily repeater with max 7 items (one week)
- Weather and precipitation tracking
- Visual assessment requirement each day
- Weekly summary with total precipitation

### Step 2: Validate Template (10 min)

```bash
cd packages/database
pnpm validate:templates 14-ndep-weekly-stormwater.json
```

### Step 3: Test Rendering (20 min)

Seed and test:

```bash
pnpm seed:template 14-ndep-weekly-stormwater.json
```

Navigate to web and verify:

1. Select "NDEP Weekly Stormwater Log"
2. Add 7 daily inspections (full week)
3. Verify day_of_week dropdown
4. Test conditional fields (maintenance_description, corrective_actions)
5. Verify maxItems: 7 enforcement (can't add 8th day)
6. Screenshot: evidence/ISSUE-108/deployment/template-rendering.png

### Step 4: Manual Testing with Weekly Data (45 min)

Fill realistic weekly log:

**Site Information:**

- Site Name: "Sparks Logistics Center"
- Permit Number: NEV-234567
- Week Starting: 2025-10-14 (Monday)
- Week Ending: 2025-10-20 (Sunday)
- Inspector Name: "Mike Johnson"
- Inspector Cert: NDEP-CSI-67890
- Project Phase: Active Construction
- Total Disturbed Acres: 8.3

**Daily Inspections (add all 7 days):**

**Monday 10/14:**

- Weather: Clear
- Precipitation: 0.00
- Visual assessment complete: Yes
- BMPs functional: Yes
- No erosion observed
- No maintenance
- Initials: MJ

**Tuesday 10/15:**

- Weather: Cloudy
- Precipitation: 0.00
- Visual assessment complete: Yes
- BMPs functional: Yes
- No erosion observed
- No maintenance
- Initials: MJ

**Wednesday 10/16:**

- Weather: Rain
- Precipitation: 0.35
- Visual assessment complete: Yes
- BMPs functional: No (silt fence damaged)
- Erosion observed: Yes
- Corrective actions: Repaired silt fence at north perimeter, installed additional inlet protection
- Maintenance performed: Yes
- Maintenance description: Repaired 50 linear feet of silt fence
- Follow-up required: Yes
- Initials: MJ

**Thursday 10/17:**

- Weather: Cloudy
- Precipitation: 0.10
- Visual assessment complete: Yes
- BMPs functional: Yes (repairs from yesterday holding)
- No erosion observed
- No maintenance
- Initials: MJ

**Friday 10/18:**

- Weather: Clear
- Precipitation: 0.00
- Visual assessment complete: Yes
- BMPs functional: Yes
- No erosion observed
- No maintenance
- Initials: MJ

**Saturday 10/19:**

- No construction activity (add inspection anyway per NDEP)
- Weather: Clear
- Precipitation: 0.00
- Visual assessment complete: Yes
- BMPs functional: Yes
- No erosion observed
- No maintenance
- Initials: MJ

**Sunday 10/20:**

- No construction activity
- Weather: Clear
- Precipitation: 0.00
- Visual assessment complete: Yes
- BMPs functional: Yes
- No erosion observed
- No maintenance
- Initials: MJ

**Weekly Summary:**

- Total Precipitation Week: 0.45 inches
- Storm Events Count: 1 (Wednesday 0.35")
- BMPs Repaired Count: 1 (silt fence)
- New BMPs Installed: 2 (inlet protection)
- No non-compliance observed
- Next Week Planned Work: "Continue grading on east side, install erosion control blankets on slopes"
- Weekly Certification Signature: (Draw signature)

Submit and verify all 7 daily inspections stored as array.

Screenshot: evidence/ISSUE-108/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/14-ndep-weekly-stormwater.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/14-ndep-weekly-stormwater.json';

describe('NDEP Weekly Stormwater Log Template', () => {
  it('should have daily inspections repeater with max 7 items', () => {
    const dailySection = template.schema.sections.find((s) => s.id === 'daily_inspections');
    const dailyField = dailySection?.fields[0];

    expect(dailyField?.type).toBe('repeater');
    expect(dailyField?.minItems).toBe(1);
    expect(dailyField?.maxItems).toBe(7);
  });

  it('should have conditional maintenance_description field', () => {
    const dailySection = template.schema.sections.find((s) => s.id === 'daily_inspections');
    const dailyField = dailySection?.fields[0];
    const maintenanceDesc = dailyField?.itemSchema?.fields.find(
      (f) => f.id === 'maintenance_description'
    );

    expect(maintenanceDesc?.conditionalLogic?.field).toBe('maintenance_performed');
    expect(maintenanceDesc?.conditionalLogic?.value).toBe(true);
  });

  it('should have weekly summary with signature', () => {
    const summarySection = template.schema.sections.find((s) => s.id === 'weekly_summary');
    const sigField = summarySection?.fields.find((f) => f.id === 'weekly_certification_signature');

    expect(sigField?.type).toBe('signature');
    expect(sigField?.required).toBe(true);
  });
});
```

## Files to Create

- packages/database/templates/14-ndep-weekly-stormwater.json
- packages/database/**tests**/templates/14-ndep-weekly-stormwater.test.ts

## Verification Checklist

- [ ] Template created with 3 sections
- [ ] Daily inspections repeater limited to 7 items
- [ ] Weather conditions dropdown functional
- [ ] Conditional fields working
- [ ] Weekly summary calculates total precipitation
- [ ] Template renders and submits correctly
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-108/

- test-results/green-phase.png
- deployment/template-rendering.png
- deployment/form-submission.png (7-day week filled)

## Success Criteria

- [ ] Weekly log template created
- [ ] 7-day limit enforced
- [ ] Tests passing
- [ ] Evidence collected

## Time Estimate

**2 hours total:**

- PDF extraction: 45 min
- Validation: 10 min
- Test rendering: 20 min
- Manual testing: 45 min

## Next Issue

**ISSUE-109:** NDOT Weekly Stormwater Logs (2h)
