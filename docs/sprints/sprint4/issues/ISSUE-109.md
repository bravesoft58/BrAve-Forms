# ISSUE-109: NDOT Weekly Stormwater Logs

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-108 (NDEP Weekly Log complete)
**Status:** COMPLETE (2025-11-26)

## What You'll Do

Create the NDOT-specific Weekly Stormwater Logs template with highway project requirements, culvert and drainage inspection, traffic impact notes, and right-of-way BMP verification.

## Prerequisites

- [ ] ISSUE-108 complete
- [ ] Backend running
- [ ] PDF source: NDOT Weekly Stormwater Logs.pdf (2.2 MB - multiple pages)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (45 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/NDOT Weekly Stormwater Logs.pdf

This is an NDOT-specific weekly log with highway/ROW requirements.

**Section 1: Project Information (10 fields)**

- project_name (text, required)
- ndot_project_number (text, required, "XXXXX-XX-XXXX format")
- route_number (text, "I-580, US-95, SR-447, etc.")
- mile_post_range (text, "Begin MP - End MP")
- week_starting (date, required)
- week_ending (date, required)
- ndot_resident_engineer (text, required)
- contractor_name (text, required)
- inspector_name (text, required)
- inspector_cert (text, "NDOT certification number")

**Section 2: Daily Highway Inspections (repeater fields)**

Highway-specific daily checklist (maxItems: 7):

- daily_inspections (repeater):
  - inspection_date (date, required)
  - day_of_week (select: Monday-Sunday)
  - weather_conditions (select: Clear, Cloudy, Rain, Snow, Wind, Dust)
  - precipitation_amount (number, 2 decimals)
  - active_construction (checkbox, "Active construction today")
  - traffic_control_functional (checkbox, "Traffic control measures functional")
  - culverts_inspected (checkbox, "Culverts and drainage inspected")
  - culvert_findings (textarea, conditional on culverts_inspected)
  - row_bmps_functional (checkbox, "Right-of-way BMPs functional")
  - row_bmp_issues (textarea, conditional on row_bmps_functional = false)
  - erosion_observed (checkbox)
  - erosion_location (text, "Mile post or station", conditional on erosion_observed)
  - maintenance_performed (checkbox)
  - maintenance_description (textarea, conditional on maintenance_performed)
  - traffic_impact (select: None, Minor Delay, Lane Closure, Detour)
  - inspector_initials (text, required)

**Section 3: Weekly Highway Summary (12 fields)**

- total_precipitation_week (number, 2 decimals)
- storm_events_count (number, "0.25+ inch events")
- culverts_cleaned_count (number, "Culverts cleaned this week")
  - drainage_issues_resolved_count (number, "Drainage issues resolved")
- bmps_repaired_count (number)
- new_bmps_installed_count (number)
- traffic_delays_count (number, "Days with traffic delays")
- row_violations_observed (checkbox)
- row_violation_description (textarea, conditional on row_violations_observed)
- environmental_issues (checkbox, "Environmental issues observed")
- environmental_issue_description (textarea, conditional on environmental_issues)
- next_week_planned_work (textarea)
- ndot_inspector_signature (signature, required, "NDOT inspector verification")

Create `packages/database/templates/15-ndot-weekly-stormwater.json`.

**Key Differences from NDEP Weekly Log:**

- NDOT project numbering and route information
- Culvert and drainage inspection requirements
- Traffic impact tracking (highway-specific)
- Right-of-way BMP verification
- NDOT inspector signature (not contractor)

### Step 2: Validate Template (10 min)

```bash
cd packages/database
pnpm validate:templates 15-ndot-weekly-stormwater.json
```

### Step 3: Test Rendering (20 min)

```bash
pnpm seed:template 15-ndot-weekly-stormwater.json
```

Test in web frontend:

1. Select "NDOT Weekly Stormwater Logs"
2. Add 7 daily inspections
3. Test highway-specific fields (culverts, traffic impact, ROW BMPs)
4. Verify conditional logic for culvert_findings, row_bmp_issues
5. Screenshot: evidence/ISSUE-109/deployment/template-rendering.png

### Step 4: Manual Testing with Highway Weekly Data (45 min)

**Project Information:**

- Project Name: "US-395 Widening Steamboat to Pleasant Valley"
- NDOT Project Number: 23456-78-9012
- Route Number: US-395
- Mile Post Range: "25.00 - 32.50"
- Week Starting: 2025-10-14
- Week Ending: 2025-10-20
- NDOT Resident Engineer: "Sarah Williams"
- Contractor Name: "Q&D Construction"
- Inspector Name: "Tom Davis"
- Inspector Cert: NDOT-HWY-5678

**Daily Inspections (add 5 workdays):**

**Monday 10/14:**

- Weather: Clear
- Precipitation: 0.00
- Active construction: Yes
- Traffic control functional: Yes
- Culverts inspected: Yes
- Culvert findings: "All 4 culverts between MP 27-29 clear, no debris"
- ROW BMPs functional: Yes
- No erosion observed
- No maintenance
- Traffic impact: Minor Delay (shoulder work)
- Initials: TD

**Tuesday 10/15:**

- Weather: Cloudy
- Precipitation: 0.00
- Active construction: Yes
- Traffic control functional: Yes
- Culverts inspected: Yes
- Culvert findings: "Culvert at MP 28.5 has sediment buildup"
- ROW BMPs functional: No
- ROW BMP issues: "Silt fence down at MP 29.2, outside ROW markers"
- Erosion observed: Yes
- Erosion location: "MP 29.2, slope failure near culvert"
- Maintenance performed: Yes
- Maintenance description: "Repaired silt fence, cleaned culvert at MP 28.5, stabilized slope at MP 29.2"
- Traffic impact: Lane Closure (maintenance work)
- Initials: TD

**Wednesday 10/16:**

- Weather: Rain
- Precipitation: 0.40
- Active construction: No (rain delay)
- Traffic control functional: Yes
- Culverts inspected: Yes
- Culvert findings: "High flow in all culverts, functioning properly"
- ROW BMPs functional: Yes (repairs from yesterday holding)
- No erosion observed
- No maintenance (rain day)
- Traffic impact: None
- Initials: TD

**Thursday 10/17:**

- Weather: Cloudy
- Precipitation: 0.05
- Active construction: Yes
- Traffic control functional: Yes
- Culverts inspected: Yes
- Culvert findings: "Minor debris at MP 27.0 culvert inlet, cleared"
- ROW BMPs functional: Yes
- No erosion observed
- Maintenance performed: Yes
- Maintenance description: "Cleared culvert debris"
- Traffic impact: Minor Delay
- Initials: TD

**Friday 10/18:**

- Weather: Clear
- Precipitation: 0.00
- Active construction: Yes
- Traffic control functional: Yes
- Culverts inspected: Yes
- Culvert findings: "All clear"
- ROW BMPs functional: Yes
- No erosion observed
- No maintenance
- Traffic impact: None
- Initials: TD

**Weekly Summary:**

- Total Precipitation: 0.45 inches
- Storm Events: 1 (Wednesday 0.40")
- Culverts Cleaned: 2 (MP 28.5, MP 27.0)
- Drainage Issues Resolved: 1 (slope stabilization MP 29.2)
- BMPs Repaired: 1 (silt fence MP 29.2)
- New BMPs Installed: 0
- Traffic Delays: 2 days
- No ROW violations
- No environmental issues
- Next Week Planned Work: "Continue shoulder widening MP 30-32, monitor culvert at MP 28.5 for additional sediment"
- NDOT Inspector Signature: (Draw signature)

Screenshot: evidence/ISSUE-109/deployment/form-submission.png

## TDD Workflow (MANDATORY)

Create test file `packages/database/__tests__/templates/15-ndot-weekly-stormwater.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/15-ndot-weekly-stormwater.json';

describe('NDOT Weekly Stormwater Logs Template', () => {
  it('should have highway-specific project fields', () => {
    const projectSection = template.schema.sections.find((s) => s.id === 'project_information');
    const routeField = projectSection?.fields.find((f) => f.id === 'route_number');
    const mpField = projectSection?.fields.find((f) => f.id === 'mile_post_range');

    expect(routeField).toBeDefined();
    expect(mpField).toBeDefined();
  });

  it('should have culvert inspection fields in daily inspections', () => {
    const dailySection = template.schema.sections.find((s) => s.id === 'daily_inspections');
    const dailyField = dailySection?.fields[0];
    const culvertInspected = dailyField?.itemSchema?.fields.find(
      (f) => f.id === 'culverts_inspected'
    );
    const culvertFindings = dailyField?.itemSchema?.fields.find((f) => f.id === 'culvert_findings');

    expect(culvertInspected?.type).toBe('checkbox');
    expect(culvertFindings?.type).toBe('textarea');
    expect(culvertFindings?.conditionalLogic?.field).toBe('culverts_inspected');
  });

  it('should have traffic impact tracking', () => {
    const dailySection = template.schema.sections.find((s) => s.id === 'daily_inspections');
    const dailyField = dailySection?.fields[0];
    const trafficImpact = dailyField?.itemSchema?.fields.find((f) => f.id === 'traffic_impact');

    expect(trafficImpact?.type).toBe('select');
    expect(trafficImpact?.options).toContain('Lane Closure');
  });

  it('should have NDOT inspector signature requirement', () => {
    const summarySection = template.schema.sections.find((s) => s.id === 'weekly_summary');
    const sigField = summarySection?.fields.find((f) => f.id === 'ndot_inspector_signature');

    expect(sigField?.type).toBe('signature');
    expect(sigField?.required).toBe(true);
  });
});
```

## Files to Create

- packages/database/templates/15-ndot-weekly-stormwater.json
- packages/database/**tests**/templates/15-ndot-weekly-stormwater.test.ts

## Verification Checklist

- [ ] Template created with highway-specific fields
- [ ] Culvert inspection fields functional
- [ ] Traffic impact tracking working
- [ ] ROW BMP verification present
- [ ] Conditional logic working
- [ ] NDOT inspector signature required
- [ ] Tests passing
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-109/

- test-results/green-phase.png
- deployment/template-rendering.png
- deployment/form-submission.png (highway weekly log)

## Success Criteria

- [ ] NDOT weekly log created
- [ ] Highway-specific fields working
- [ ] Tests passing
- [ ] Evidence collected

## Time Estimate

**2 hours total:**

- PDF extraction: 45 min
- Validation: 10 min
- Test rendering: 20 min
- Manual testing: 45 min

## Next Issue

**ISSUE-110:** TMWA Inspection Checklist (3h)
