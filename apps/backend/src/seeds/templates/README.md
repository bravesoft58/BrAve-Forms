# Form Templates Seed Data

This directory contains JSON seed data for form templates. Templates are loaded into the database during initial setup or can be imported by organizations.

## Structure

Each template file should follow this naming convention:

- `{category}-{name}.json` (e.g., `epa-swppp-daily-inspection.json`)

## Template Categories

- **EPA_SWPPP** - Stormwater Pollution Prevention Plan forms
- **EPA_CGP** - Construction General Permit forms
- **OSHA_SAFETY** - OSHA safety compliance forms
- **STATE_PERMIT** - State-specific permit forms
- **CUSTOM** - Organization-specific custom forms

## Template File Format

```json
{
  "name": "Daily Site Inspection",
  "description": "EPA SWPPP daily site inspection form",
  "category": "EPA_SWPPP",
  "schema": {
    "fields": [
      {
        "id": "inspector_name",
        "type": "text",
        "label": "Inspector Name",
        "required": true
      },
      {
        "id": "inspection_date",
        "type": "date",
        "label": "Inspection Date",
        "required": true
      },
      {
        "id": "site_conditions",
        "type": "textarea",
        "label": "Site Conditions",
        "required": true
      },
      {
        "id": "bmps_inspected",
        "type": "checkbox",
        "label": "BMPs Inspected",
        "required": false,
        "options": [
          "Silt Fences",
          "Inlet Protection",
          "Stabilized Construction Entrance",
          "Storm Drain Covers"
        ]
      },
      {
        "id": "photos",
        "type": "photo",
        "label": "Site Photos",
        "required": false,
        "multiple": true
      }
    ]
  },
  "compliance": {
    "regulation": "EPA CGP 2022 Section 4.4",
    "frequency": "DAILY",
    "requirements": ["Inspect all BMPs", "Document deficiencies", "Record weather conditions"]
  }
}
```

## Field Types Supported

- **text** - Single-line text input
- **textarea** - Multi-line text input
- **number** - Numeric input
- **date** - Date picker
- **time** - Time picker
- **select** - Dropdown selection
- **checkbox** - Multiple choice
- **radio** - Single choice
- **photo** - Photo upload (with GPS EXIF)
- **signature** - Digital signature
- **gps** - GPS coordinates

## Seed Script Usage

Templates in this directory are loaded by the seed script:

```bash
# Run seed script
pnpm --filter backend seed

# Seed specific category
pnpm --filter backend seed --category EPA_SWPPP
```

## Template Cloning

Organizations can clone these templates and customize them:

```graphql
mutation CloneTemplate {
  cloneFormTemplate(
    sourceTemplateId: "template-id-here"
    input: { name: "Custom Daily Inspection", description: "Modified for our site requirements" }
  ) {
    id
    name
    version
  }
}
```

## Next: ISSUE-070

ISSUE-070 will build 10 construction-specific templates in this directory:

1. EPA SWPPP Daily Inspection
2. EPA CGP Post-Storm Inspection (0.25" rain trigger)
3. OSHA Safety Walk-Through
4. Equipment Maintenance Log
5. Material Delivery Receipt
6. Site Access Control Log
7. Environmental Incident Report
8. BMP Maintenance Record
9. Weekly Site Report
10. Monthly Compliance Summary

Each template will include:

- Proper field types for construction site use (glove-friendly)
- EPA/OSHA compliance metadata
- Photo upload fields with GPS tracking
- Offline-capable field structure

---

**Created:** 2025-10-23 (ISSUE-069)
**Purpose:** Template storage system for ISSUE-070 construction templates
**Sprint:** Sprint 2 Phase 4 - Template Library
