# ISSUE-117: Template Documentation Update

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P1
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-116 (All templates seeded)
**Status:** COMPLETE (2025-11-26)

## What You'll Do

Update `packages/database/templates/README.md` to document all 20 templates, add agency-specific compliance requirements with regulatory citations, document Q&D Construction 100% template coverage, and create template selection guide.

## Prerequisites

- [ ] ISSUE-116 complete (All 20 templates seeded and verified)
- [ ] Code editor open to packages/database/templates directory

## Step-by-Step Instructions

### Step 1: Read Existing README (5 min)

Check if README exists:

```bash
cd packages/database/templates
cat README.md
```

If it doesn't exist or is outdated, proceed to Step 2.

### Step 2: Create/Update Comprehensive README (50 min)

Create `packages/database/templates/README.md` with complete documentation:

````markdown
# BrAve Forms Template Library

**Last Updated:** 2025-10-23
**Total Templates:** 20
**Q&D Construction Coverage:** 15/15 (100%)

## Overview

This directory contains all form templates for the BrAve Forms platform. Templates are JSON files validated against the FormTemplate schema and seeded into the PostgreSQL database for use in the web and mobile applications.

## Template Categories

Templates are organized into the following categories:

- **DAILY_LOG** - Daily construction logs and reports
- **SAFETY** - Safety inspections, toolbox talks, incident reports
- **QUALITY** - Quality control and material inspections
- **EQUIPMENT** - Equipment inspections and maintenance
- **COMPLIANCE** - EPA/OSHA/agency-specific regulatory compliance
- **ENVIRONMENTAL** - Environmental monitoring and stormwater management

## Template Inventory

### General Construction Templates (11 templates)

#### Daily Logs

**01-general-daily-log.json** - General Daily Log

- **Category:** DAILY_LOG
- **Fields:** 25+ (weather, crew, work performed, delays, photos)
- **Use Case:** Basic daily site documentation
- **Q&D Usage:** Daily foreman logs for all projects

**02-superintendent-daily-report.json** - Superintendent Daily Report

- **Category:** DAILY_LOG
- **Fields:** 35+ (progress, RFIs, submittals, schedule updates)
- **Use Case:** Detailed superintendent-level reporting
- **Q&D Usage:** Project superintendent weekly summaries

#### Safety Templates

**03-safety-inspection.json** - Safety Inspection

- **Category:** SAFETY
- **Fields:** 40+ checkboxes (PPE, housekeeping, equipment, hazards)
- **Use Case:** Weekly safety walkthroughs
- **Q&D Usage:** OSHA compliance weekly inspections

**04-toolbox-talk.json** - Toolbox Talk

- **Category:** SAFETY
- **Fields:** 15 (topic, attendees, discussion points, acknowledgment)
- **Use Case:** Daily crew safety meetings
- **Q&D Usage:** Required OSHA crew safety briefings

**05-incident-report.json** - Incident Report

- **Category:** SAFETY
- **Fields:** 30+ (incident details, witnesses, injuries, corrective actions)
- **Use Case:** OSHA recordable incident documentation
- **Q&D Usage:** Near-miss and injury reporting

#### Quality Control

**06-quality-control-inspection.json** - Quality Control Inspection

- **Category:** QUALITY
- **Fields:** 25+ (inspection type, standards, measurements, acceptance)
- **Use Case:** QA/QC inspections per specifications
- **Q&D Usage:** Concrete, rebar, grading inspections

**07-material-receiving-log.json** - Material Receiving Log

- **Category:** QUALITY
- **Fields:** 20 (material, supplier, quantity, condition, certifications)
- **Use Case:** Material delivery documentation
- **Q&D Usage:** Tracking concrete, asphalt, steel deliveries

#### Equipment

**08-equipment-inspection.json** - Equipment Inspection

- **Category:** EQUIPMENT
- **Fields:** 30+ checkboxes (pre-use inspection, maintenance needs)
- **Use Case:** Daily equipment safety checks
- **Q&D Usage:** Crane, excavator, loader daily inspections

#### Environmental / Stormwater

**09-environmental-inspection.json** - Environmental Inspection

- **Category:** ENVIRONMENTAL
- **Fields:** 35+ (BMPs, erosion control, spill prevention)
- **Use Case:** General environmental compliance
- **Q&D Usage:** Weekly environmental walkthroughs

**10-weekly-stormwater-inspection.json** - Weekly Stormwater Inspection

- **Category:** COMPLIANCE
- **Fields:** 40+ (7-day inspection format, BMP maintenance)
- **Use Case:** EPA CGP weekly inspection requirement
- **Q&D Usage:** All projects >1 acre disturbed

**11-swppp-inspection.json** - SWPPP Inspection

- **Category:** COMPLIANCE
- **Fields:** 50+ (comprehensive SWPPP compliance checklist)
- **Use Case:** EPA Construction General Permit compliance
- **Q&D Usage:** Monthly SWPPP compliance inspections

---

### Agency-Specific Templates (9 templates)

Templates created from actual PDFs provided by Q&D Construction ("Spec Updates/Forms from QD Enviro").

#### Nevada Department of Environmental Protection (NDEP)

**12-ndep-bwpc-swppp.json** - NDEP BWPC SWPPP Template

- **Category:** COMPLIANCE
- **Agency:** Nevada DEP Bureau of Water Pollution Control
- **Regulation:** Nevada NAC 445A - Water Pollution Control
- **Fields:** 50+ (site info, BMPs, inspection checklist, quarterly monitoring)
- **Key Features:**
  - Nevada county selection (17 counties)
  - NDEP permit number format validation (NEV-XXXXXX)
  - BMP repeater with condition tracking
  - Quarterly monitoring with pH and turbidity
- **Citations:**
  - Nevada NAC 445A.235 - Stormwater discharge permits
  - Nevada NAC 445A.237 - SWPPP requirements
  - Nevada NAC 445A.243 - Inspection and monitoring
- **Q&D Usage:** Nevada construction sites requiring NDEP permits

**14-ndep-weekly-stormwater.json** - NDEP Weekly Stormwater Log

- **Category:** COMPLIANCE
- **Agency:** Nevada DEP
- **Regulation:** Nevada NAC 445A
- **Fields:** 30+ (7-day format, visual assessment, weather tracking)
- **Key Features:**
  - Daily inspections repeater (maxItems: 7)
  - Weather and precipitation tracking
  - Weekly summary with storm event count
- **Q&D Usage:** NDEP-permitted projects weekly logs

#### Nevada Department of Transportation (NDOT)

**13-ndot-swppp.json** - NDOT SWPPP Template

- **Category:** COMPLIANCE
- **Agency:** Nevada Department of Transportation
- **Regulation:** NDOT Environmental Manual Section 300
- **Fields:** 60+ (largest template, highway/roadway specific)
- **Key Features:**
  - NDOT project numbering (XXXXX-XX-XXXX)
  - Mile post ranges for highways
  - Traffic control BMPs section
  - Right-of-way compliance (10 checkboxes)
  - Dual signature requirement (Contractor + NDOT inspector)
- **Q&D Usage:** Highway and roadway projects (I-580, US-395, SR-447)

**15-ndot-weekly-stormwater.json** - NDOT Weekly Stormwater Logs

- **Category:** COMPLIANCE
- **Agency:** Nevada DOT
- **Regulation:** NDOT Environmental Manual
- **Fields:** 40+ (highway-specific weekly logs)
- **Key Features:**
  - Culvert and drainage inspection
  - Traffic impact tracking
  - Right-of-way BMP verification
  - NDOT inspector signature (not contractor)
- **Q&D Usage:** NDOT highway projects weekly reporting

#### Truckee Meadows Water Authority (TMWA)

**16-tmwa-inspection.json** - TMWA Inspection Checklist

- **Category:** COMPLIANCE
- **Agency:** Truckee Meadows Water Authority
- **Regulation:** TMWA Regulation 21 - Erosion and Sediment Control
- **Fields:** 50+ (water quality protection emphasis)
- **Key Features:**
  - Watershed designation (Truckee River, Lake Tahoe)
  - Lake Tahoe TMDL compliance section (conditional)
  - Erosion control measures (15 checkboxes)
  - Sediment control measures (10 checkboxes)
  - Water quality protection (12 fields)
  - Findings and corrective actions repeater
- **Q&D Usage:** Projects in Reno/Sparks area, Lake Tahoe watershed

#### EPA Multi-Sector General Permit (MSGP)

**17-quarterly-visual-assessment.json** - Quarterly Visual Assessment

- **Category:** COMPLIANCE
- **Agency:** EPA
- **Regulation:** EPA MSGP Part 3.2.3
- **Fields:** 40+ (visual discharge assessment)
- **Key Features:**
  - Discharge point assessments repeater
  - Visual parameters (color, odor, clarity, floating materials)
  - Photograph documentation repeater (minItems: 4)
  - Corrective action tracking
  - Certification statement with legal language
- **Q&D Usage:** Industrial facility quarterly assessments

**18-visual-assessment-report.json** - Visual Assessment Report

- **Category:** COMPLIANCE
- **Agency:** EPA
- **Regulation:** EPA MSGP Part 3.2.3 (detailed reporting)
- **Fields:** 60+ (detailed report with lab analysis)
- **Key Features:**
  - Visual observations repeater
  - Laboratory analysis repeater (pH, turbidity, TSS, BOD, COD, oil/grease)
  - Corrective actions with status tracking
  - Monitoring data summary table
  - Compliance certification
- **Q&D Usage:** Industrial facilities detailed MSGP reporting

#### Industrial Facility Inspections

**19-routine-facility-inspection.json** - Routine Facility Inspection

- **Category:** COMPLIANCE
- **Agency:** EPA
- **Regulation:** EPA SPCC (Spill Prevention, Control, and Countermeasure)
- **Fields:** 45+ (equipment, spill prevention, housekeeping)
- **Key Features:**
  - Equipment condition assessment repeater
  - Spill prevention measures (12 checkboxes)
  - Housekeeping standards (10 checkboxes)
  - Material storage compliance repeater
  - Secondary containment verification
- **Q&D Usage:** Concrete plants, asphalt plants, fuel storage facilities

#### Work In Water (Nevada NAC 503)

**20-wiw-daily-form.json** - WIW Daily Form

- **Category:** COMPLIANCE
- **Agency:** Nevada DEP, Nevada NDOW (Wildlife)
- **Regulation:** Nevada NAC 503 - Wildlife Protection
- **Fields:** 50+ (aquatic environment protection)
- **Key Features:**
  - Daily work log repeater
  - Nested turbidity readings repeater (NTU monitoring)
  - Turbidity threshold tracking (>25 NTU above upstream)
  - Aquatic environment BMPs (silt curtains, cofferdams)
  - Fish and wildlife observations
  - Environmental incident tracking
- **Q&D Usage:** Stream crossings, bridge work, lake/river projects (Truckee River, Lake Tahoe)

---

## Q&D Construction Template Coverage: 100% (15/15)

Q&D Construction requires the following 15 templates for their operations:

**Daily Operations (2):**

1. General Daily Log
2. Superintendent Daily Report

**Safety & Quality (5):**

3. Safety Inspection
4. Toolbox Talk
5. Incident Report
6. Quality Control Inspection
7. Material Receiving Log

**Equipment & Environmental (3):**

8. Equipment Inspection
9. Weekly Stormwater Inspection
10. SWPPP Inspection

**Nevada Agency-Specific (5):**

11. NDEP BWPC SWPPP Template
12. NDOT SWPPP Template
13. TMWA Inspection Checklist
14. NDOT Weekly Stormwater Logs
15. WIW Daily Form

**Status:** All 15 templates created, validated, and seeded. Q&D Construction has 100% template coverage.

---

## Template Selection Guide

### For Construction Sites in Nevada

**General Construction (All Projects):**

- Use **General Daily Log** for daily site documentation
- Use **Safety Inspection** for weekly OSHA compliance
- Use **Toolbox Talk** for daily crew safety meetings

**Stormwater Compliance (Projects >1 Acre):**

1. **General Construction** → NDEP BWPC SWPPP Template
2. **Highway/Road Projects** → NDOT SWPPP Template + NDOT Weekly Logs
3. **Lake Tahoe Watershed** → TMWA Inspection Checklist (additional requirements)

**Work Near Water:**

- Use **WIW Daily Form** for stream crossings, bridge work, lake/river projects

**Industrial Facilities:**

- Use **Routine Facility Inspection** for concrete plants, asphalt plants, fuel storage
- Use **Quarterly Visual Assessment** for EPA MSGP compliance

### By Regulatory Agency

| Agency                                | Templates                                             |
| ------------------------------------- | ----------------------------------------------------- |
| **Nevada DEP**                        | #12 NDEP BWPC SWPPP, #14 NDEP Weekly Stormwater       |
| **Nevada DOT**                        | #13 NDOT SWPPP, #15 NDOT Weekly Stormwater            |
| **TMWA (Reno/Sparks/Tahoe)**          | #16 TMWA Inspection Checklist                         |
| **EPA MSGP (Industrial)**             | #17 Quarterly Visual Assessment, #18 Visual Report    |
| **EPA SPCC (Fuel/Chemical Storage)**  | #19 Routine Facility Inspection                       |
| **Nevada Wildlife (Work In Water)**   | #20 WIW Daily Form                                    |
| **OSHA (All Construction)**           | #03 Safety Inspection, #04 Toolbox Talk, #05 Incident |
| **EPA CGP (Construction Stormwater)** | #10 Weekly Stormwater, #11 SWPPP Inspection           |

---

## Technical Details

### Template Structure

All templates follow the FormTemplate schema defined in `@braveforms/types`:

```typescript
interface FormTemplate {
  id: string; // Unique template ID (01-general-daily-log)
  name: string; // Display name
  version: string; // Template version (1.0, 2.0, etc.)
  category: TemplateCategory; // DAILY_LOG, SAFETY, QUALITY, etc.
  description: string; // Purpose and use case
  compliance?: ComplianceMetadata; // Regulatory information
  schema: FormSchema; // Field definitions and structure
}
```
````

### Compliance Metadata

Agency-specific templates include regulatory citations:

```json
{
  "compliance": {
    "regulation": "Nevada NAC 445A - Water Pollution Control",
    "requiredFields": ["site_name", "permit_number", "inspector_signature"],
    "frequency": "Quarterly monitoring required",
    "agency": "Nevada DEP Bureau of Water Pollution Control",
    "citations": [
      "Nevada NAC 445A.235 - Stormwater discharge permits",
      "Nevada NAC 445A.237 - SWPPP requirements",
      "Nevada NAC 445A.243 - Inspection and monitoring"
    ]
  }
}
```

### Field Types

Templates support 15 field types:

- **text** - Single-line text input
- **textarea** - Multi-line text
- **number** - Numeric input with validation
- **date** - Date picker
- **time** - Time picker
- **datetime** - Date and time
- **select** - Dropdown with options
- **checkbox** - Boolean checkbox
- **radio** - Radio button group
- **file** - File upload (photos, PDFs)
- **signature** - Digital signature capture
- **gps** - GPS coordinates
- **photo** - Photo with GPS EXIF
- **repeater** - Repeating field group (nested forms)
- **section** - Section divider

### Repeater Fields

Repeater fields allow nested structures (e.g., multiple BMPs, daily logs, lab samples):

```json
{
  "id": "bmp_list",
  "type": "repeater",
  "label": "BMP List",
  "minItems": 1,
  "maxItems": 100,
  "itemSchema": {
    "fields": [
      { "id": "bmp_type", "type": "select", "options": ["Silt Fence", "Inlet Protection"] },
      { "id": "install_date", "type": "date" },
      { "id": "condition", "type": "select", "options": ["Good", "Fair", "Poor"] }
    ]
  }
}
```

### Conditional Logic

Fields can conditionally appear based on other field values:

```json
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
```

---

## Validation

All templates are validated using `scripts/validate-templates.ts`:

```bash
cd packages/database
pnpm validate:templates
```

Validation checks:

1. Valid JSON syntax
2. Passes Zod schema validation
3. No duplicate field IDs
4. Conditional logic references valid fields
5. Repeater itemSchema structure correct
6. Required fields exist in schema

---

## Seeding Templates

Templates are seeded to the database using `scripts/seed-templates.ts`:

```bash
cd packages/database
pnpm seed:templates
```

Seeding is idempotent (re-running updates existing templates without duplication).

---

## GraphQL Queries

Retrieve templates via GraphQL:

```graphql
# Get all templates
query GetAllTemplates {
  formTemplates {
    id
    name
    category
  }
}

# Filter by category
query GetComplianceTemplates {
  formTemplates(where: { category: COMPLIANCE }) {
    id
    name
    compliance {
      regulation
      agency
    }
  }
}

# Get specific template
query GetTemplate($id: String!) {
  formTemplate(id: $id) {
    id
    name
    schema {
      sections {
        id
        title
        fields {
          id
          type
          label
        }
      }
    }
  }
}
```

---

## Future Enhancements

Planned additions:

- Form versioning system
- Template branching (create custom versions)
- Template marketplace (share templates between organizations)
- AI-powered template generation from PDFs
- Multi-language support (Spanish for construction crews)

---

## Contributing

When adding new templates:

1. Create JSON file in `templates/` directory
2. Follow naming convention: `##-descriptive-name.json`
3. Validate with `pnpm validate:templates`
4. Add to `seed-templates.ts` TEMPLATE_FILES array
5. Update this README with template details
6. Create unit test in `__tests__/templates/`
7. Run `pnpm seed:templates` to add to database

---

**Last Updated:** 2025-10-23
**Maintained By:** BrAve Forms Development Team
**Next Review:** Sprint 5 (January 2026)

```

### Step 3: Verify Documentation Accuracy (5 min)

Review README for:

- [ ] All 20 templates listed with correct IDs
- [ ] Q&D Construction coverage clearly stated (15/15 = 100%)
- [ ] Agency-specific templates have regulatory citations
- [ ] Template selection guide provides clear use case mapping
- [ ] Technical details accurate (field types, repeaters, conditional logic)
- [ ] No emoji, no AI branding

## Files Created

- packages/database/templates/README.md (created or updated)

## Verification Checklist

- [ ] README.md created/updated
- [ ] All 20 templates documented
- [ ] Q&D Construction coverage: 15/15 (100%)
- [ ] Agency-specific sections with regulations
- [ ] Template selection guide complete
- [ ] Technical details section accurate
- [ ] No emoji, no AI branding
- [ ] Markdown formatting correct

## Evidence Requirements

**Location:** evidence/ISSUE-117/

**Required:**

- documentation/
  - readme-preview.png (screenshot of formatted README)
  - template-inventory-section.png (20 templates listed)
  - qd-coverage-section.png (15/15 coverage documented)

## Success Criteria

- [ ] README.md comprehensive and accurate
- [ ] All 20 templates documented
- [ ] Q&D Construction 100% coverage confirmed
- [ ] Template selection guide helpful
- [ ] Evidence screenshots collected

## Time Estimate

**1 hour total:**

- Read existing README: 5 min
- Create/update comprehensive README: 50 min
- Verify accuracy: 5 min

## Next Issue

**ISSUE-118:** QR Portal E2E Tests (3h)

- Prerequisites: Phase 2 complete (all templates created)
- Phase: 3 - Testing & Polish
- Creates end-to-end tests for QR inspector portal
```
