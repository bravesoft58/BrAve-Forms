# ISSUE-106: NDEP BWPC SWPPP Template

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-105 (Phase 1 complete)
**Status:** NOT STARTED

## What You'll Do

Create the Nevada DEP Bureau of Water Pollution Control SWPPP template with 50+ fields covering site information, BMPs installed, inspection checklist, and quarterly monitoring requirements.

## Prerequisites

- [ ] Phase 1 complete (QR portal functional)
- [ ] Backend running at http://localhost:30101/graphql
- [ ] Code editor open to packages/database directory
- [ ] PDF source: NDEP BWPC SWPPP Template.pdf (331 KB)

## Step-by-Step Instructions

### Step 1: Extract PDF Fields (60 min)

**Download PDF:** Spec Updates/Forms from QD Enviro/NDEP BWPC SWPPP Template.pdf

Open PDF and systematically extract fields section by section:

**Section 1: Site Information (15 fields)**

- site_name (text)
- permit_number (text)
- site_address (text)
- city (text)
- county (text, Nevada only: Carson City, Churchill, Clark, Douglas, Elko, Esmeralda, Eureka, Humboldt, Lander, Lincoln, Lyon, Mineral, Nye, Pershing, Storey, Washoe, White Pine)
- zip_code (text, 5 digits)
- site_contact_name (text)
- site_contact_phone (text)
- site_contact_email (text)
- project_type (select: Residential, Commercial, Industrial, Infrastructure, Highway/Roadway)
- project_start_date (date)
- project_end_date (date)
- total_disturbed_acres (number, 2 decimals)
- receiving_waters (text)
- latitude (text, GPS format)
- longitude (text, GPS format)

**Section 2: Best Management Practices Installed (repeater fields)**

- bmp_list (repeater with itemSchema):
  - bmp_type (select: Silt Fence, Inlet Protection, Stabilized Construction Entrance, Concrete Washout, Rock Check Dam, Dust Control, Seeding/Mulching, Erosion Control Blankets)
  - install_date (date)
  - install_location (text)
  - condition (select: Good, Fair, Poor, Failed)
  - last_inspection_date (date)
  - maintenance_required (checkbox)
  - maintenance_notes (textarea)

**Section 3: Inspection Checklist (20 fields, all checkboxes)**

- silt_fence_intact (checkbox, "Silt fence intact and properly installed")
- inlet_protection_clean (checkbox, "Inlet protection clean and functional")
- entrance_stabilized (checkbox, "Construction entrance stabilized")
- washout_posted (checkbox, "Concrete washout area posted and functional")
- exposed_soil_covered (checkbox, "Exposed soil covered or stabilized")
- stockpiles_covered (checkbox, "Stockpiles covered or protected")
- discharge_points_clear (checkbox, "Discharge points clear of sediment")
- drainage_functioning (checkbox, "Site drainage functioning properly")
- no_offsite_tracking (checkbox, "No offsite tracking of sediment")
- no_unauthorized_discharge (checkbox, "No unauthorized non-stormwater discharge")
- spill_kit_available (checkbox, "Spill prevention kit available on site")
- waste_properly_stored (checkbox, "Waste properly stored and secured")
- equipment_clean (checkbox, "Equipment clean, no leaks")
- fuel_storage_compliant (checkbox, "Fuel storage compliant with regulations")
- dust_control_active (checkbox, "Dust control measures active")
- perimeter_controls_maintained (checkbox, "Perimeter controls maintained")
- swppp_on_site (checkbox, "SWPPP available on site")
- training_current (checkbox, "Crew training current")
- inspection_frequency_met (checkbox, "Inspection frequency requirements met")
- corrective_actions_documented (checkbox, "Corrective actions documented")

**Section 4: Quarterly Monitoring (repeater fields)**

- quarterly_reports (repeater with itemSchema):
  - quarter (select: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec))
  - report_date (date)
  - visual_assessment_complete (checkbox)
  - sampling_conducted (checkbox)
  - ph_level (number, range 6.0-9.0)
  - turbidity_ntu (number, range 0-100)
  - oil_sheen_observed (checkbox)
  - corrective_actions (textarea)
  - next_inspection_date (date)

**Section 5: Inspector Signature**

- inspector_name (text, required)
- inspector_title (text)
- inspector_cert_number (text, "Nevada DEP certification number")
- inspection_date (date, required)
- inspector_signature (signature, required)

Create `packages/database/templates/12-ndep-bwpc-swppp.json`:

```json
{
  "id": "12-ndep-bwpc-swppp",
  "name": "NDEP BWPC SWPPP Template",
  "version": "1.0",
  "category": "COMPLIANCE",
  "description": "Nevada Department of Environmental Protection - Bureau of Water Pollution Control - Stormwater Pollution Prevention Plan template for construction sites",
  "compliance": {
    "regulation": "Nevada NAC 445A - Water Pollution Control",
    "requiredFields": [
      "site_name",
      "permit_number",
      "total_disturbed_acres",
      "bmp_list",
      "inspector_name",
      "inspection_date",
      "inspector_signature"
    ],
    "frequency": "Quarterly monitoring required with visual assessment",
    "agency": "Nevada DEP Bureau of Water Pollution Control",
    "citations": [
      "Nevada NAC 445A.235 - Stormwater discharge permits",
      "Nevada NAC 445A.237 - SWPPP requirements for construction",
      "Nevada NAC 445A.243 - Inspection and monitoring requirements"
    ]
  },
  "schema": {
    "sections": [
      {
        "id": "site_information",
        "title": "Site Information",
        "description": "Basic project and site details required for NDEP BWPC compliance",
        "fields": [
          {
            "id": "site_name",
            "type": "text",
            "label": "Site Name",
            "required": true,
            "placeholder": "Enter project or site name"
          },
          {
            "id": "permit_number",
            "type": "text",
            "label": "NDEP Permit Number",
            "required": true,
            "placeholder": "NEV-XXXXXX",
            "validation": {
              "pattern": "^NEV-[0-9]{6}$",
              "message": "Permit number must be in format NEV-XXXXXX"
            }
          },
          {
            "id": "site_address",
            "type": "text",
            "label": "Site Address",
            "required": true
          },
          {
            "id": "city",
            "type": "text",
            "label": "City",
            "required": true
          },
          {
            "id": "county",
            "type": "select",
            "label": "County",
            "required": true,
            "options": [
              "Carson City",
              "Churchill",
              "Clark",
              "Douglas",
              "Elko",
              "Esmeralda",
              "Eureka",
              "Humboldt",
              "Lander",
              "Lincoln",
              "Lyon",
              "Mineral",
              "Nye",
              "Pershing",
              "Storey",
              "Washoe",
              "White Pine"
            ]
          },
          {
            "id": "zip_code",
            "type": "text",
            "label": "ZIP Code",
            "required": true,
            "validation": {
              "pattern": "^[0-9]{5}$",
              "message": "ZIP code must be 5 digits"
            }
          },
          {
            "id": "site_contact_name",
            "type": "text",
            "label": "Site Contact Name",
            "required": true
          },
          {
            "id": "site_contact_phone",
            "type": "text",
            "label": "Site Contact Phone",
            "required": true,
            "placeholder": "(775) 555-1234"
          },
          {
            "id": "site_contact_email",
            "type": "text",
            "label": "Site Contact Email",
            "validation": {
              "pattern": "^[^@]+@[^@]+\\.[^@]+$",
              "message": "Invalid email format"
            }
          },
          {
            "id": "project_type",
            "type": "select",
            "label": "Project Type",
            "required": true,
            "options": [
              "Residential",
              "Commercial",
              "Industrial",
              "Infrastructure",
              "Highway/Roadway"
            ]
          },
          {
            "id": "project_start_date",
            "type": "date",
            "label": "Project Start Date",
            "required": true
          },
          {
            "id": "project_end_date",
            "type": "date",
            "label": "Estimated Project End Date",
            "required": true
          },
          {
            "id": "total_disturbed_acres",
            "type": "number",
            "label": "Total Disturbed Area (acres)",
            "required": true,
            "validation": {
              "min": 0,
              "max": 10000,
              "decimals": 2
            },
            "helpText": "NDEP permit required for 1+ acres or part of larger common plan"
          },
          {
            "id": "receiving_waters",
            "type": "text",
            "label": "Receiving Waters",
            "required": true,
            "placeholder": "Name of stream, river, lake, or drainage basin",
            "helpText": "Water body that receives stormwater discharge from site"
          },
          {
            "id": "latitude",
            "type": "text",
            "label": "Latitude",
            "placeholder": "39.5296° N"
          },
          {
            "id": "longitude",
            "type": "text",
            "label": "Longitude",
            "placeholder": "119.8138° W"
          }
        ]
      },
      {
        "id": "bmps_installed",
        "title": "Best Management Practices Installed",
        "description": "List all BMPs installed on site with current condition",
        "fields": [
          {
            "id": "bmp_list",
            "type": "repeater",
            "label": "BMP List",
            "required": true,
            "minItems": 1,
            "itemSchema": {
              "fields": [
                {
                  "id": "bmp_type",
                  "type": "select",
                  "label": "BMP Type",
                  "required": true,
                  "options": [
                    "Silt Fence",
                    "Inlet Protection",
                    "Stabilized Construction Entrance",
                    "Concrete Washout",
                    "Rock Check Dam",
                    "Dust Control",
                    "Seeding/Mulching",
                    "Erosion Control Blankets"
                  ]
                },
                {
                  "id": "install_date",
                  "type": "date",
                  "label": "Installation Date",
                  "required": true
                },
                {
                  "id": "install_location",
                  "type": "text",
                  "label": "Installation Location",
                  "required": true,
                  "placeholder": "North perimeter, Station 10+00"
                },
                {
                  "id": "condition",
                  "type": "select",
                  "label": "Current Condition",
                  "required": true,
                  "options": ["Good", "Fair", "Poor", "Failed"]
                },
                {
                  "id": "last_inspection_date",
                  "type": "date",
                  "label": "Last Inspection Date",
                  "required": true
                },
                {
                  "id": "maintenance_required",
                  "type": "checkbox",
                  "label": "Maintenance Required"
                },
                {
                  "id": "maintenance_notes",
                  "type": "textarea",
                  "label": "Maintenance Notes",
                  "conditionalLogic": {
                    "field": "maintenance_required",
                    "condition": "equals",
                    "value": true
                  }
                }
              ]
            }
          }
        ]
      },
      {
        "id": "inspection_checklist",
        "title": "Inspection Checklist",
        "description": "Complete all inspection items per NDEP requirements",
        "fields": [
          {
            "id": "silt_fence_intact",
            "type": "checkbox",
            "label": "Silt fence intact and properly installed"
          },
          {
            "id": "inlet_protection_clean",
            "type": "checkbox",
            "label": "Inlet protection clean and functional"
          },
          {
            "id": "entrance_stabilized",
            "type": "checkbox",
            "label": "Construction entrance stabilized"
          },
          {
            "id": "washout_posted",
            "type": "checkbox",
            "label": "Concrete washout area posted and functional"
          },
          {
            "id": "exposed_soil_covered",
            "type": "checkbox",
            "label": "Exposed soil covered or stabilized"
          },
          {
            "id": "stockpiles_covered",
            "type": "checkbox",
            "label": "Stockpiles covered or protected"
          },
          {
            "id": "discharge_points_clear",
            "type": "checkbox",
            "label": "Discharge points clear of sediment"
          },
          {
            "id": "drainage_functioning",
            "type": "checkbox",
            "label": "Site drainage functioning properly"
          },
          {
            "id": "no_offsite_tracking",
            "type": "checkbox",
            "label": "No offsite tracking of sediment"
          },
          {
            "id": "no_unauthorized_discharge",
            "type": "checkbox",
            "label": "No unauthorized non-stormwater discharge"
          },
          {
            "id": "spill_kit_available",
            "type": "checkbox",
            "label": "Spill prevention kit available on site"
          },
          {
            "id": "waste_properly_stored",
            "type": "checkbox",
            "label": "Waste properly stored and secured"
          },
          {
            "id": "equipment_clean",
            "type": "checkbox",
            "label": "Equipment clean, no leaks"
          },
          {
            "id": "fuel_storage_compliant",
            "type": "checkbox",
            "label": "Fuel storage compliant with regulations"
          },
          {
            "id": "dust_control_active",
            "type": "checkbox",
            "label": "Dust control measures active"
          },
          {
            "id": "perimeter_controls_maintained",
            "type": "checkbox",
            "label": "Perimeter controls maintained"
          },
          {
            "id": "swppp_on_site",
            "type": "checkbox",
            "label": "SWPPP available on site"
          },
          {
            "id": "training_current",
            "type": "checkbox",
            "label": "Crew training current"
          },
          {
            "id": "inspection_frequency_met",
            "type": "checkbox",
            "label": "Inspection frequency requirements met"
          },
          {
            "id": "corrective_actions_documented",
            "type": "checkbox",
            "label": "Corrective actions documented"
          }
        ]
      },
      {
        "id": "quarterly_monitoring",
        "title": "Quarterly Monitoring",
        "description": "Quarterly visual assessment and sampling data",
        "fields": [
          {
            "id": "quarterly_reports",
            "type": "repeater",
            "label": "Quarterly Reports",
            "minItems": 0,
            "itemSchema": {
              "fields": [
                {
                  "id": "quarter",
                  "type": "select",
                  "label": "Reporting Quarter",
                  "required": true,
                  "options": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"]
                },
                {
                  "id": "report_date",
                  "type": "date",
                  "label": "Report Date",
                  "required": true
                },
                {
                  "id": "visual_assessment_complete",
                  "type": "checkbox",
                  "label": "Visual assessment completed"
                },
                {
                  "id": "sampling_conducted",
                  "type": "checkbox",
                  "label": "Water quality sampling conducted"
                },
                {
                  "id": "ph_level",
                  "type": "number",
                  "label": "pH Level",
                  "validation": {
                    "min": 6.0,
                    "max": 9.0,
                    "decimals": 1
                  },
                  "helpText": "Acceptable range: 6.0-9.0 per NDEP standards",
                  "conditionalLogic": {
                    "field": "sampling_conducted",
                    "condition": "equals",
                    "value": true
                  }
                },
                {
                  "id": "turbidity_ntu",
                  "type": "number",
                  "label": "Turbidity (NTU)",
                  "validation": {
                    "min": 0,
                    "max": 100,
                    "decimals": 1
                  },
                  "helpText": "Nephelometric Turbidity Units",
                  "conditionalLogic": {
                    "field": "sampling_conducted",
                    "condition": "equals",
                    "value": true
                  }
                },
                {
                  "id": "oil_sheen_observed",
                  "type": "checkbox",
                  "label": "Oil sheen observed in discharge"
                },
                {
                  "id": "corrective_actions",
                  "type": "textarea",
                  "label": "Corrective Actions Taken",
                  "placeholder": "Describe any corrective actions implemented this quarter"
                },
                {
                  "id": "next_inspection_date",
                  "type": "date",
                  "label": "Next Scheduled Inspection Date",
                  "required": true
                }
              ]
            }
          }
        ]
      },
      {
        "id": "inspector_signature",
        "title": "Inspector Certification",
        "description": "Certified inspector signature required for NDEP compliance",
        "fields": [
          {
            "id": "inspector_name",
            "type": "text",
            "label": "Inspector Name",
            "required": true
          },
          {
            "id": "inspector_title",
            "type": "text",
            "label": "Inspector Title",
            "placeholder": "Certified Stormwater Inspector"
          },
          {
            "id": "inspector_cert_number",
            "type": "text",
            "label": "Nevada DEP Certification Number",
            "required": true,
            "placeholder": "NDEP-CSI-XXXXX"
          },
          {
            "id": "inspection_date",
            "type": "date",
            "label": "Inspection Date",
            "required": true
          },
          {
            "id": "inspector_signature",
            "type": "signature",
            "label": "Inspector Signature",
            "required": true
          }
        ]
      }
    ]
  }
}
```

### Step 2: Validate Template (15 min)

Run validation script to ensure template passes Zod schema:

```bash
cd packages/database
pnpm validate:templates 12-ndep-bwpc-swppp.json
```

Expected output:

```
Validating template: 12-ndep-bwpc-swppp.json
✓ Valid JSON structure
✓ All required fields present
✓ No duplicate field IDs
✓ Conditional logic references valid fields
✓ Repeater itemSchema structure correct
✓ Template passes Zod schema validation

Template validated successfully!
```

Fix any validation errors before proceeding.

### Step 3: Test Template Rendering (30 min)

Test the template renders correctly in FormRenderer:

```bash
# Seed just this template for testing
cd packages/database
pnpm seed:template 12-ndep-bwpc-swppp.json

# Check backend logs
kubectl logs -f deployment/backend -n braveforms
```

Navigate to web frontend:

1. Open http://localhost:30102
2. Go to Forms section
3. Click "New Form"
4. Select "NDEP BWPC SWPPP Template"
5. Verify all 5 sections render
6. Test repeater fields:
   - Add multiple BMPs
   - Add quarterly reports
7. Test conditional logic:
   - Toggle "Maintenance Required" checkbox
   - Verify maintenance_notes field appears/disappears
   - Toggle "Sampling conducted" checkbox
   - Verify pH and turbidity fields appear/disappear
8. Test signature field renders
9. Screenshot: Save to evidence/ISSUE-106/deployment/template-rendering.png

### Step 4: Manual Testing (45 min)

Fill out the form with realistic data:

**Site Information:**

- Site Name: "Reno Industrial Park Phase 3"
- Permit Number: NEV-123456
- Site Address: "4500 Longley Lane"
- City: "Reno"
- County: "Washoe"
- ZIP Code: 89502
- Site Contact: "John Smith"
- Phone: (775) 555-1234
- Email: jsmith@example.com
- Project Type: Industrial
- Start Date: 2025-06-01
- End Date: 2026-12-31
- Total Disturbed Acres: 12.5
- Receiving Waters: "Truckee River"
- Latitude: 39.5296° N
- Longitude: 119.8138° W

**BMPs Installed (add 3):**

1. Silt Fence - 2025-06-15 - North perimeter - Good - 2025-10-20
2. Inlet Protection - 2025-06-15 - Storm drains (all) - Fair - 2025-10-20 - Maintenance Required (sediment buildup at Drain #4)
3. Stabilized Construction Entrance - 2025-06-10 - Main gate - Good - 2025-10-20

**Inspection Checklist:** Check all 20 items

**Quarterly Monitoring (add 2):**

1. Q2 (Apr-Jun) - 2025-06-30 - Visual assessment complete - Sampling conducted - pH 7.2 - Turbidity 12.5 NTU - No oil sheen - Next inspection 2025-09-30
2. Q3 (Jul-Sep) - 2025-09-30 - Visual assessment complete - Sampling conducted - pH 7.5 - Turbidity 8.3 NTU - No oil sheen - Corrective actions: Repaired silt fence at Station 12+00 - Next inspection 2025-12-31

**Inspector Signature:**

- Inspector Name: "Jane Doe"
- Title: "Certified Stormwater Inspector"
- Cert Number: NDEP-CSI-12345
- Date: 2025-10-23
- Signature: (Draw signature)

Submit form and verify:

- All data saved correctly
- Repeater fields stored as arrays
- Conditional fields only saved when visible
- Signature image stored to S3

Screenshot: Save to evidence/ISSUE-106/deployment/form-submission.png

## TDD Workflow (MANDATORY)

### Phase 1: Validation Tests (Red Phase)

Create test file `packages/database/__tests__/templates/12-ndep-bwpc-swppp.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import template from '../../templates/12-ndep-bwpc-swppp.json';
import { validateFormTemplate } from '../utils/validate-template';

describe('NDEP BWPC SWPPP Template', () => {
  it('should have correct metadata', () => {
    expect(template.id).toBe('12-ndep-bwpc-swppp');
    expect(template.name).toBe('NDEP BWPC SWPPP Template');
    expect(template.category).toBe('COMPLIANCE');
  });

  it('should have correct compliance metadata', () => {
    expect(template.compliance.regulation).toBe('Nevada NAC 445A - Water Pollution Control');
    expect(template.compliance.agency).toBe('Nevada DEP Bureau of Water Pollution Control');
    expect(template.compliance.requiredFields).toContain('inspector_signature');
  });

  it('should have 5 sections', () => {
    expect(template.schema.sections).toHaveLength(5);
    expect(template.schema.sections[0].id).toBe('site_information');
    expect(template.schema.sections[4].id).toBe('inspector_signature');
  });

  it('should have repeater field for BMPs with correct itemSchema', () => {
    const bmpsSection = template.schema.sections.find((s) => s.id === 'bmps_installed');
    const bmpField = bmpsSection?.fields[0];

    expect(bmpField?.type).toBe('repeater');
    expect(bmpField?.itemSchema?.fields).toHaveLength(7);
    expect(bmpField?.itemSchema?.fields[0].id).toBe('bmp_type');
  });

  it('should have conditional logic for maintenance_notes', () => {
    const bmpsSection = template.schema.sections.find((s) => s.id === 'bmps_installed');
    const bmpField = bmpsSection?.fields[0];
    const maintenanceNotesField = bmpField?.itemSchema?.fields.find(
      (f) => f.id === 'maintenance_notes'
    );

    expect(maintenanceNotesField?.conditionalLogic).toBeDefined();
    expect(maintenanceNotesField?.conditionalLogic?.field).toBe('maintenance_required');
    expect(maintenanceNotesField?.conditionalLogic?.value).toBe(true);
  });

  it('should validate successfully against Zod schema', () => {
    expect(() => validateFormTemplate(template)).not.toThrow();
  });

  it('should have no duplicate field IDs within sections', () => {
    const allFieldIds = template.schema.sections.flatMap((section) =>
      section.fields.map((f) => f.id)
    );
    const uniqueIds = new Set(allFieldIds);
    expect(allFieldIds.length).toBe(uniqueIds.size);
  });
});
```

Run tests (should PASS - tests validate the template we created):

```bash
cd packages/database
pnpm test 12-ndep-bwpc-swppp
```

Screenshot: Save to evidence/ISSUE-106/test-results/green-phase.png

## Files to Create

**Template:**

- packages/database/templates/12-ndep-bwpc-swppp.json

**Tests:**

- packages/database/**tests**/templates/12-ndep-bwpc-swppp.test.ts

## Verification Checklist

- [ ] Template JSON valid (no syntax errors)
- [ ] All 5 sections present
- [ ] 50+ total fields across all sections
- [ ] Repeater fields have correct itemSchema
- [ ] Conditional logic references valid fields
- [ ] Nevada county options correct (17 counties)
- [ ] NDEP permit number format validated
- [ ] pH range validation (6.0-9.0)
- [ ] Template renders in FormRenderer
- [ ] Form submission successful
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-106/

**Required:**

- test-results/
  - green-phase.png (validation tests passing)
- deployment/
  - template-rendering.png (all sections visible)
  - form-submission.png (completed form with data)
  - repeater-fields.png (multiple BMPs and quarterly reports)

## Troubleshooting

**Problem:** Validation fails with "Duplicate field IDs"

- **Cause:** Field ID used in multiple sections
- **Solution:** Ensure unique IDs across entire template (prefix with section name if needed)

**Problem:** Repeater fields don't render

- **Cause:** Missing itemSchema or invalid structure
- **Solution:** Verify itemSchema has "fields" array with valid field definitions

**Problem:** Conditional logic doesn't work

- **Cause:** Field reference incorrect or field doesn't exist
- **Solution:** Check field ID matches exactly (case-sensitive)

**Problem:** Template doesn't appear in dropdown

- **Cause:** Seed script not run or database connection issue
- **Solution:** Run `pnpm seed:template 12-ndep-bwpc-swppp.json` and check logs

## Success Criteria

- [ ] Template JSON created with 50+ fields
- [ ] All 5 sections complete
- [ ] Validation tests passing
- [ ] Template renders in FormRenderer
- [ ] Form submission successful
- [ ] Repeater fields functional
- [ ] Conditional logic working
- [ ] Evidence collected

## Time Estimate

**3 hours total:**

- PDF field extraction: 60 min
- Template validation: 15 min
- Test rendering: 30 min
- Manual testing: 45 min
- Tests + evidence: 30 min

## Next Issue

**ISSUE-107:** NDOT SWPPP Template (3h)

- Prerequisites: ISSUE-106 complete
- Phase: 2 - Q&D Agency Templates
- Creates: Nevada Department of Transportation SWPPP template with highway-specific requirements
