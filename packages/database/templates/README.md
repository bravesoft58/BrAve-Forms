# BrAve Forms - Construction Form Templates

**Version:** 2.0.0
**Last Updated:** 2025-11-26
**Template Count:** 20
**Status:** Production-ready

---

## Overview

This directory contains 11 construction-native form templates designed for field use with mobile devices, gloves, and offline capability. All templates are validated against industry standards (OSHA, EPA, ACI) and optimized for construction site conditions.

**Key Features:**
- Mobile-optimized (large touch targets for glove use)
- 30-day offline capability
- GPS-enabled photo capture
- Compliance metadata with regulatory citations
- Conditional logic and dynamic fields
- Digital signature capture with timestamps

---

## Template Catalog

### Daily Logs (2 templates)

#### 01 - General Daily Log
- **File:** `01-general-daily-log.json`
- **Category:** DAILY_LOG
- **Purpose:** Comprehensive daily project documentation
- **Compliance:** Industry best practice
- **Time:** 10-15 minutes
- **Key Sections:** Weather, work performed, labor, equipment, materials, subcontractors, delays, safety
- **Target Role:** Foreman, Superintendent

#### 02 - Superintendent Daily Report
- **File:** `02-superintendent-daily-report.json`
- **Category:** DAILY_LOG
- **Purpose:** Project management daily report with schedule tracking
- **Compliance:** PM best practices
- **Time:** 15-20 minutes
- **Key Sections:** Schedule status, work progress, inspections, RFIs, change orders, safety
- **Target Role:** Project Superintendent

---

### Safety (3 templates)

#### 03 - Daily Safety Inspection
- **File:** `03-daily-safety-inspection.json`
- **Category:** SAFETY
- **Purpose:** Comprehensive daily safety inspection checklist
- **Compliance:** OSHA 29 CFR 1926.20(b) - Accident Prevention Programs
- **Time:** 15-20 minutes
- **Key Sections:** PPE, fall protection, scaffolding/ladders, electrical, fire safety, tools, hazard communication
- **Target Role:** Safety Manager, Competent Person
- **Inspector Requirement:** Competent person per OSHA 1926.32(f)

#### 04 - Toolbox Talk Sign-In
- **File:** `04-toolbox-talk-sign-in.json`
- **Category:** SAFETY
- **Purpose:** Safety meeting attendance and training record
- **Compliance:** OSHA 29 CFR 1926.21(b)(2) - Safety Training and Education
- **Time:** During toolbox talk + 5 minutes
- **Key Sections:** Meeting info, training topic, hazards discussed, attendee sign-in, questions/feedback
- **Target Role:** Safety Manager, Foreman, Superintendent
- **Recordkeeping:** Duration of employment + 3 years per OSHA

#### 05 - Incident Report
- **File:** `05-incident-report.json`
- **Category:** SAFETY
- **Purpose:** Comprehensive incident/injury report
- **Compliance:** OSHA Form 301 - Injury and Illness Incident Report
- **Time:** 20-30 minutes
- **Key Sections:** Employee info, incident details, what happened, treatment, witnesses, root cause, corrective actions
- **Target Role:** Supervisor, Safety Manager, HR
- **Timeline:** Must be completed within 7 calendar days of incident
- **Recordkeeping:** Keep for 5 years following year incident occurred
- **Privacy Note:** Fields 14-17 must not include PII in OSHA submissions

---

### Quality Control (2 templates)

#### 06 - General Quality Inspection
- **File:** `06-general-quality-inspection.json`
- **Category:** QUALITY_CONTROL
- **Purpose:** Quality control inspection for workmanship, materials, and specifications
- **Compliance:** Industry QC best practices
- **Time:** 15-25 minutes
- **Key Sections:** Work scope, inspection points (workmanship, materials, dimensions, code), deficiencies, overall status
- **Target Role:** Quality Inspector, Project Manager, Engineer

#### 07 - Concrete Pour Inspection
- **File:** `07-concrete-pour-inspection.json`
- **Category:** QUALITY_CONTROL
- **Purpose:** Comprehensive concrete pour inspection
- **Compliance:** ACI 318-19 - Building Code Requirements for Structural Concrete
- **Time:** 30-45 minutes (during pour)
- **Key Sections:** Pre-pour (formwork, rebar), during-pour (slump tests, placement), post-pour (finish, curing), test cylinders
- **Target Role:** ACI Certified Inspector, Project Engineer
- **Inspector Requirement:** ACI Field Testing Technician Grade I certification recommended
- **Critical Requirements:**
  - Slump test: 75-125mm typical range
  - Free fall limit: <1 meter per ACI
  - Layer thickness: <450mm per ACI
  - Test cylinders: Minimum 2 per set
- **Standards:** ACI 318-19, ACI SPEC-311.7-18

---

### Equipment (1 template)

#### 08 - Daily Equipment Inspection
- **File:** `08-daily-equipment-inspection.json`
- **Category:** EQUIPMENT
- **Purpose:** Pre-shift heavy equipment and tool inspection
- **Compliance:** OSHA 1926.1412 - Daily Equipment Inspections
- **Time:** 10-15 minutes
- **Key Sections:** Equipment info, walk-around check, safety features, deficiencies, equipment status
- **Target Role:** Equipment Operator, Competent Person, Foreman
- **Frequency:** Prior to each shift per OSHA requirements
- **Inspector Requirement:** Competent person per OSHA 1926.1427

---

### Logistics (1 template)

#### 09 - Equipment/Material Delivery Receipt
- **File:** `09-equipment-material-delivery-receipt.json`
- **Category:** LOGISTICS
- **Purpose:** Delivery receipt for equipment and materials
- **Compliance:** Construction inventory control best practices
- **Time:** 5-10 minutes
- **Key Sections:** Delivery info, supplier, purchase order, items delivered, discrepancies, special handling
- **Target Role:** Foreman, Warehouse Lead, Project Manager

---

### Compliance (2 templates)

#### 10 - SWPPP Site Inspection
- **File:** `10-swppp-site-inspection.json`
- **Category:** COMPLIANCE
- **Purpose:** EPA stormwater pollution prevention inspection
- **Compliance:** EPA CGP 2022 Section 4.4 - Inspection Requirements
- **Time:** 20-30 minutes
- **Key Sections:** Inspection type, storm event, current weather, BMP inspection, site conditions, deficiencies, SWPPP updates
- **Target Role:** SWPPP Coordinator, Qualified Inspector
- **Dual-Purpose:**
  - **7-Day Routine:** Every 7 calendar days
  - **Post-Storm:** Within 24 hours of ≥0.25 inch rain (during working hours)
- **CRITICAL:** EXACT 0.25 inch threshold (not approximated)
- **Timeline:** If storm occurs Friday, inspection due Monday (next work day)
- **Multiple Storms:** Accumulation ≥0.25" in 24-hour rolling window = one inspection
- **Penalty:** $25,000-$50,000 per day for non-compliance
- **Reference:** EPA CGP 2022 Section 4.4

#### 11 - Dust Control Daily Log
- **File:** `11-dust-control-daily-log.json`
- **Category:** COMPLIANCE
- **Purpose:** Daily dust control log for Nevada air quality compliance
- **Compliance:** Clark County Air Quality Regulations Section 94
- **Time:** 15-20 minutes
- **Key Sections:** Weather (with wind speed), soil conditions, water application, dust palliatives, control measures, inspection results
- **Target Role:** Dust Control Monitor, Site Superintendent, Foreman
- **Jurisdiction:** Nevada (Clark County, Washoe County, other areas)
- **Permit Thresholds:**
  - Clark County: ≥0.25 acres OR trenching ≥100 feet
  - Washoe County: ≥1 acre
  - Nevada DEP: ≥5 acres
- **CRITICAL:** Wind speed >15 mph requires increased watering frequency
- **Inspection Frequency:**
  - Daily: When water is primary control measure
  - Weekly: When dust suppressants/binders are used
  - Continuous: During initial palliative application
- **Dust Control Monitor:** Required for projects ≥50 acres actively disturbed
- **Recordkeeping:** Daily log must be kept on-site with active permit

---

### Nevada Q&D Agency Templates (9 templates)

These templates are designed for Nevada-specific Quality & Discipline compliance requirements, covering various state and federal stormwater, water quality, and environmental protection regulations.

#### 14 - NDEP Weekly Stormwater Log
- **File:** `14-ndep-weekly-stormwater.json`
- **Category:** COMPLIANCE
- **Purpose:** Weekly stormwater inspection log for Nevada DEP compliance
- **Compliance:** Nevada NAC 445A - Water Pollution Control, NVR100000 Construction Stormwater General Permit
- **Time:** 20-30 minutes
- **Key Sections:** Site info, weather conditions, BMP inspections, corrective actions, certification
- **Target Role:** SWPPP Coordinator, Environmental Compliance Officer
- **Frequency:** Weekly (every 7 calendar days) + within 24 hours of >=0.25" rain
- **Tests:** 14 tests

#### 15 - NDOT Weekly Stormwater Logs
- **File:** `15-ndot-weekly-stormwater.json`
- **Category:** COMPLIANCE
- **Purpose:** Nevada DOT highway project weekly stormwater inspection
- **Compliance:** NDOT Stormwater Quality Manual, NVR100000, NDOT MS4 Permit NV0023329
- **Time:** 25-35 minutes
- **Key Sections:** Highway project info, weather, erosion controls, sediment controls, material storage, corrective actions
- **Target Role:** NDOT Environmental Coordinator, WPCM, Highway Project Engineer
- **Highway-Specific:** Route number, mile posts, district, NDOT project number
- **Tests:** 16 tests

#### 16 - TMWA Inspection Checklist
- **File:** `16-tmwa-inspection.json`
- **Category:** COMPLIANCE
- **Purpose:** Truckee Meadows Water Authority infrastructure inspection
- **Compliance:** TMWA Water Quality Standards, Nevada NAC 445A, Safe Drinking Water Act
- **Time:** 30-45 minutes
- **Key Sections:** Facility info, water quality parameters, chlorine residuals, storage tanks, distribution system, cross-connection control
- **Target Role:** TMWA Inspector, Water System Operator, Distribution System Technician
- **Water Quality Fields:** pH, turbidity, chlorine residual, temperature, coliform testing
- **Tests:** 25 tests

#### 17 - Quarterly Visual Assessment
- **File:** `17-quarterly-visual-assessment.json`
- **Category:** COMPLIANCE
- **Purpose:** EPA MSGP quarterly visual assessment of stormwater discharge
- **Compliance:** EPA Multi-Sector General Permit (MSGP), 40 CFR 122.26
- **Time:** 15-25 minutes
- **Key Sections:** Facility info, outfall observations, discharge characteristics, visual indicators, corrective actions
- **Target Role:** Environmental Manager, Stormwater Coordinator, Facility Manager
- **Visual Indicators:** Color, odor, clarity, floating solids, suspended solids, foam, oil sheen, other
- **Frequency:** Once per quarter during discharge events
- **Tests:** 23 tests

#### 18 - Visual Assessment Report
- **File:** `18-visual-assessment-report.json`
- **Category:** COMPLIANCE
- **Purpose:** Comprehensive visual assessment report for EPA MSGP annual reporting
- **Compliance:** EPA MSGP Part 4.2 - Visual Assessment Requirements, EPA NetDMR Reporting
- **Time:** 30-45 minutes
- **Key Sections:** Facility/permit info, observations repeater, laboratory analysis, corrective actions, monitoring summary, certification
- **Target Role:** Environmental Manager, Compliance Officer, SWPPP Coordinator
- **Lab Parameters:** pH, turbidity (NTU), TSS, oil & grease, BOD, COD
- **Annual Summary:** Total observations, passed/failed counts, lab samples, exceedances
- **Tests:** 25 tests

#### 19 - Routine Facility Inspection
- **File:** `19-routine-facility-inspection.json`
- **Category:** COMPLIANCE
- **Purpose:** Monthly routine facility inspection for EPA MSGP and SPCC compliance
- **Compliance:** EPA MSGP Part 4.1 - Routine Facility Inspections, 40 CFR 112 SPCC
- **Time:** 45-60 minutes
- **Key Sections:** Facility info, stormwater controls, industrial areas, material storage, SPCC equipment, spill response, documentation
- **Target Role:** Facility Manager, Environmental Coordinator, SPCC Inspector
- **Inspection Areas:** 12 BMP checkboxes, 8 industrial activity fields, SPCC containment verification
- **Frequency:** Monthly per EPA MSGP, or as specified in SWPPP
- **Tests:** 26 tests

#### 20 - WIW Daily Form
- **File:** `20-wiw-daily-form.json`
- **Category:** COMPLIANCE
- **Purpose:** Work-In-Water daily environmental monitoring form
- **Compliance:** Nevada NAC 503 - Wildlife Protection, NAC 445A - Water Quality, Army Corps Section 404
- **Time:** 20-30 minutes
- **Key Sections:** Project info, daily work log (repeater), turbidity monitoring, BMPs, fish/wildlife observations, incidents, certification
- **Target Role:** Environmental Monitor, WIW Inspector, Project Biologist
- **Aquatic BMPs:** Silt curtain, turbidity curtain, cofferdam, fish relocation, dewatering, fish screens
- **Wildlife Monitoring:** Fish observations, species, behavior (normal/stressed/mortality), NDOW notification
- **Tests:** 28 tests

#### 21 - NDEP BWPC SWPPP
- **File:** `21-ndep-bwpc-swppp.json`
- **Category:** COMPLIANCE
- **Purpose:** Nevada DEP Bureau of Water Pollution Control Stormwater Pollution Prevention Plan
- **Compliance:** EPA CGP 2022 Part 7.2, Nevada NAC 445A, NVR100000 General Permit
- **Time:** 2-4 hours (initial preparation)
- **Key Sections:** Project/site info, site operators, stormwater team, nature of construction, erosion controls, sediment controls, good housekeeping, stabilization, inspection procedures, amendments, certification
- **Sections:** 11 sections, 80+ fields
- **Nevada-Specific:** 17 Nevada county options, NDEP permit number, NVR permit reference
- **EPA CGP 7.2 Elements:** All 14 required SWPPP elements per EPA CGP 2022
- **Tests:** 41 tests

#### 22 - NDOT SWPPP
- **File:** `22-ndot-swppp.json`
- **Category:** COMPLIANCE
- **Purpose:** Nevada DOT Highway Construction SWPPP per NDOT Form 018-002
- **Compliance:** NDOT Form 018-002SWPPP, NDOT BMPs Manual (Feb 2025), NVR100000, EPA CGP 2022
- **Time:** 2-4 hours (initial preparation)
- **Key Sections:** Project info, highway location, site operators, stormwater team, nature of construction, erosion controls, sediment controls, good housekeeping, stabilization, traffic control impacts, inspection procedures, certification
- **Sections:** 11 sections, 90+ fields
- **Highway-Specific:** Route type (Interstate/US/State/Local), route number, begin/end mile posts, NDOT project number, district (1/2/3), WPCM certification
- **NDOT BMP Codes:** EC-1 to EC-12 (erosion controls), SE-1 to SE-10 (sediment controls) per NDOT BMPs Manual
- **Tests:** 38 tests

---

## Template Structure

All templates follow a standardized JSON structure:

```json
{
  "name": "Template Name",
  "description": "Detailed description of template purpose and use",
  "category": "CATEGORY_NAME",
  "version": "1.0.0",
  "compliance": {
    "regulation": "Regulation reference",
    "requiredFields": ["field1", "field2"],
    "timeline": "Completion requirements",
    "recordkeeping": "Retention requirements"
  },
  "schema": {
    "sections": [
      {
        "id": "section_id",
        "title": "Section Title",
        "order": 1,
        "fields": [...]
      }
    ]
  },
  "offlineCapable": true,
  "metadata": {
    "estimatedCompletionTime": "10-15 minutes",
    "fieldOptimization": "mobile-friendly with large touch targets",
    "industryStandard": "Standard reference",
    "targetRole": "Intended user role"
  }
}
```

---

## Field Types Supported

### Basic Input Fields
- **text**: Single-line text input
- **textarea**: Multi-line text input
- **number**: Numeric input with validation (min, max, precision)
- **date**: Date picker
- **time**: Time picker
- **datetime-local**: Date and time picker

### Selection Fields
- **select**: Dropdown with predefined options
- **radio**: Single-choice radio buttons
- **checkbox**: Single checkbox
- **checkboxes**: Multiple checkbox group

### Advanced Fields
- **repeater**: Dynamic list of item groups (e.g., labor breakdown, deficiencies)
- **signature**: Digital signature capture with timestamp
- **photo**: Photo upload with GPS EXIF data capture

### Special Features
- **Conditional Display**: Show/hide fields based on other field values
- **Computed Fields**: Auto-calculated values (e.g., totals, counts)
- **Validation**: Min/max values, length limits, precision controls
- **Default Values**: Template variables like {{currentDate}}, {{currentUser}}, {{projectName}}

---

## Compliance Features

### Regulatory Citations
All compliance templates include:
- Exact regulation reference (OSHA, EPA, ACI)
- Required fields clearly marked
- Recordkeeping requirements
- Timeline/deadline requirements
- Inspector qualification requirements

### Critical Thresholds
- **EPA Rain Threshold:** EXACT 0.25 inches (not approximated)
- **Nevada Wind Speed:** >15 mph triggers increased watering
- **ACI Free Fall:** <1 meter limit
- **ACI Layer Thickness:** <450mm limit

### Penalties Documented
- **EPA CGP Violation:** $25,000-$50,000 per day
- **OSHA Recordkeeping:** Various penalties per regulation

---

## Mobile Optimization

### Glove-Friendly Design
- Large touch targets (minimum 44x44 pixels)
- Dropdown selections preferred over free text
- Minimal typing requirements
- Auto-populated fields where possible

### Offline Capability
- All templates marked `offlineCapable: true`
- Work without internet for 30 days
- Queue for sync when connection restored
- Service Workers + IndexedDB integration

### Photo Documentation
- GPS EXIF data capture for location verification
- Multiple photos per form (10-40 depending on template)
- Compressed for bandwidth efficiency
- Offline storage with sync

---

## Validation Research

All templates validated against authoritative sources:
- OSHA construction standards (29 CFR 1926)
- EPA Construction General Permit (CGP) 2022
- ACI 318-19 concrete inspection standards
- Nevada Air Quality Regulations (Clark County Section 94, Nevada DEP, Washoe County)
- Industry best practices (SafetyCulture, construction software vendors)

**Research Documentation:** `/docs/sprints/sprint2/evidence/ISSUE-070/TEMPLATE_VALIDATION_RESEARCH.md`

---

## Categories

Templates are organized into 6 categories:

1. **DAILY_LOG** (2 templates): Daily project documentation
2. **SAFETY** (3 templates): Safety inspections, meetings, incidents
3. **QUALITY_CONTROL** (2 templates): Quality inspections and testing
4. **EQUIPMENT** (1 template): Equipment inspection and maintenance
5. **LOGISTICS** (1 template): Deliveries and inventory
6. **COMPLIANCE** (11 templates): EPA/OSHA/Nevada environmental compliance including Q&D agency templates

---

## Usage

### Loading Templates

Templates will be loaded into the database via seed script (ISSUE-071):

```typescript
import templates from './templates';
await prisma.formTemplate.createMany({ data: templates });
```

### Cloning Templates

Organizations can clone templates and customize:

```typescript
const clonedTemplate = await templateCloningService.cloneTemplate(
  sourceTemplateId,
  targetOrgId,
  userId,
  {
    name: 'Custom Daily Log',
    schema: customSchema, // Modified fields
    offlineCreated: false,
  }
);
```

### Multi-Tenant Security

All templates include `orgId` filtering for tenant isolation per CLAUDE.md requirements.

---

## Development Guidelines

### Adding New Templates

1. Create JSON file with sequential number: `12-template-name.json`
2. Follow standard structure (see above)
3. Include compliance metadata if applicable
4. Validate against industry standards
5. Document in this README
6. Add to seed script
7. Create validation tests

### Modifying Existing Templates

1. Update version number
2. Document changes in template file
3. Test backward compatibility
4. Update completion reports if template is in active use

### Field Naming Conventions

- Use snake_case for field IDs: `inspector_name`, `wind_speed`
- Use clear, descriptive labels: "Inspector Name", "Wind Speed (mph)"
- Include units in labels: "(°F)", "(inches)", "(mph)"
- Add help text for complex fields

---

## Testing

### Validation Script

Run validation to check JSON structure:

```bash
pnpm --filter database validate-templates
```

### Manual Testing Checklist

- [ ] JSON validates against schema
- [ ] All required fields present
- [ ] Conditional logic works correctly
- [ ] Computed fields calculate properly
- [ ] Photo upload functional
- [ ] Signature capture works
- [ ] Offline mode tested (deferred until mobile build)

---

## References

### OSHA Standards
- 29 CFR 1926.20(b) - Accident prevention programs
- 29 CFR 1926.21(b)(2) - Employee instruction
- 29 CFR 1926.1412 - Equipment inspections
- OSHA Form 301 - Injury and Illness Incident Report

### EPA Standards
- EPA Construction General Permit (CGP) 2022
- EPA CGP Section 4.4 - Inspection requirements
- EPA SWPPP Template (2022)

### ACI Standards
- ACI 318-19 - Building Code Requirements for Structural Concrete
- ACI SPEC-311.7-18 - Specification for Inspection of Concrete Construction

### Nevada Air Quality
- Clark County Air Quality Regulations Section 94 (Dust Control for Construction)
- Nevada Division of Environmental Protection (NDEP) - Surface Area Disturbance Permits
- Northern Nevada Public Health - Dust Control Requirements

### Nevada Water Quality & Stormwater
- Nevada NAC 445A - Water Pollution Control
- NVR100000 - Nevada Construction Stormwater General Permit
- NDOT Form 018-002SWPPP - Highway Construction SWPPP
- NDOT BMPs Manual (February 2025) - Erosion/Sediment Control Best Management Practices
- NDOT MS4 Permit NV0023329 - Municipal Separate Storm Sewer System
- TMWA Water Quality Standards - Truckee Meadows Water Authority

### Nevada Wildlife Protection
- Nevada NAC 503 - Wildlife Protection
- Army Corps Section 404 - Clean Water Act Dredge and Fill Permits

### EPA Multi-Sector General Permit
- EPA MSGP Part 4.1 - Routine Facility Inspections
- EPA MSGP Part 4.2 - Visual Assessment Requirements
- 40 CFR 122.26 - Stormwater Discharges
- 40 CFR 112 - SPCC (Spill Prevention, Control, and Countermeasure)

---

## Support

For questions or issues with templates:
- See: `/docs/sprints/sprint2/evidence/ISSUE-070/`
- Contact: Project team
- Documentation: CLAUDE.md, TECH_STACK_DETAILS.md

---

**Template Library Status:** COMPLETE (20/20 templates)
**Validation Status:** All templates validated against industry standards (236 tests passing)
**Production Readiness:** Ready for database seeding
**Sprint 4 Phase 2:** Nevada Q&D Agency Templates (ISSUE-106 through ISSUE-117) - COMPLETE
