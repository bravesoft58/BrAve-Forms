# ISSUE-070: Build 11 Construction Templates

**Sprint:** Sprint 2 | **Phase:** 4 - Template Library | **Priority:** P0
**Time:** 4.5 hours (actual) | **Complexity:** Medium
**Created:** 2025-10-02 | **Completed:** 2025-10-23
**Dependencies:** ISSUE-055 (field validation exists)
**Status:** COMPLETE

**Scope Change:** Expanded from 10 to 11 templates - added Nevada Dust Control Daily Log per Developer request for state-specific air quality compliance.

## What You'll Do

Create JSON schemas for 10 construction form templates: General Daily Log, Superintendent Daily Report, General Site Safety Inspection, Toolbox Talk Sign-In, Incident Report, General Quality Inspection, Concrete Pour Inspection, Daily Equipment Inspection, Equipment Delivery Receipt, and SWPPP Weekly Inspection. Validate each template passes Zod validation.

## Step-by-Step Instructions

### Step 1: Create Template JSON Files (180 min - 18 min each)

Create `apps/backend/prisma/seeds/templates/safety/daily-safety-inspection.json`:

```json
{
  "name": "Daily Safety Inspection",
  "description": "Daily safety checklist for construction sites",
  "category": "safety",
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
      "id": "site_location",
      "type": "text",
      "label": "Site Location",
      "required": true
    },
    {
      "id": "ppe_compliance",
      "type": "dropdown",
      "label": "PPE Compliance",
      "required": true,
      "options": [
        { "value": "pass", "label": "Pass" },
        { "value": "fail", "label": "Fail" }
      ]
    },
    {
      "id": "site_photo",
      "type": "photo",
      "label": "Site Photo",
      "required": false,
      "validation": {
        "maxSizeMB": 5,
        "requireGPS": true
      }
    },
    {
      "id": "hazards_identified",
      "type": "text",
      "label": "Hazards Identified",
      "placeholder": "Describe any safety hazards",
      "required": false
    },
    {
      "id": "inspector_signature",
      "type": "signature",
      "label": "Inspector Signature",
      "required": true
    }
  ]
}
```

Create remaining 9 templates following similar structure:

1. `daily_log/general-daily-log.json`
2. `daily_log/superintendent-report.json`
3. `safety/toolbox-talk.json`
4. `safety/incident-report.json`
5. `quality/quality-inspection.json`
6. `quality/concrete-pour.json`
7. `equipment/daily-inspection.json`
8. `equipment/delivery-receipt.json`
9. `compliance/swppp-inspection.json`

### Step 2: Validate Templates Against Zod Schema (60 min)

Create `apps/backend/prisma/seeds/validate-templates.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { formTemplateFieldsSchema } from '../../src/modules/forms/validation/field-definition.schema';

const templatesDir = path.join(__dirname, 'templates');

function validateAllTemplates() {
  const categories = fs.readdirSync(templatesDir);

  categories.forEach((category) => {
    const categoryPath = path.join(templatesDir, category);
    const templates = fs.readdirSync(categoryPath);

    templates.forEach((template) => {
      const templatePath = path.join(categoryPath, template);
      const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

      console.log(`Validating ${category}/${template}...`);

      const result = formTemplateFieldsSchema.safeParse(templateData.fields);
      if (!result.success) {
        console.error(`VALIDATION FAILED: ${category}/${template}`);
        console.error(result.error.message);
        process.exit(1);
      }

      console.log(`✓ ${category}/${template} validated`);
    });
  });

  console.log('\n✓ All templates validated successfully');
}

validateAllTemplates();
```

Run validation:

```bash
cd apps/backend/prisma/seeds
ts-node validate-templates.ts
```

### Step 3: Document Templates (30 min)

Create `apps/backend/prisma/seeds/templates/README.md`:

````markdown
# BrAve Forms Template Library

10 pre-built construction form templates ready for immediate use.

## Templates

### Safety (3 templates)

1. **Daily Safety Inspection** - Daily safety checklist
2. **Toolbox Talk Sign-In** - Safety meeting attendance
3. **Incident Report** - Accident/injury documentation

### Daily Logs (2 templates)

4. **General Daily Log** - Daily activities log
5. **Superintendent Daily Report** - Site management report

### Quality (2 templates)

6. **General Quality Inspection** - Quality control checklist
7. **Concrete Pour Inspection** - Concrete placement verification

### Equipment (2 templates)

8. **Daily Equipment Inspection** - Equipment condition check
9. **Equipment Delivery Receipt** - Material delivery verification

### Compliance (1 template)

10. **SWPPP Weekly Inspection** - EPA stormwater compliance

## Usage

Templates are seeded during database initialization via:

```bash
pnpm --filter backend seed:templates
```
````

```

## Files to Create

- 10 JSON template files (one per form)
- `validate-templates.ts` script
- `templates/README.md` documentation

## Verification Checklist

- [x] 11 template JSON files created (expanded from 10)
- [x] All templates validate against JSON schema
- [x] Templates cover common construction forms
- [x] Mobile-optimized (large touch targets, minimal typing)
- [x] Documentation created
- [x] Compliance metadata included (OSHA, EPA, ACI, Nevada)
- [x] Offline capability enabled (all templates)
- [x] Advanced features implemented (repeater fields, conditional logic, computed fields)
- [x] Validation script created and passing
- [x] Seed script created for ISSUE-071

## Completion Summary

**Status:** COMPLETE
**Actual Time:** 4.5 hours (vs 4 hours estimated)
**Deliverables:**

1. **11 Template JSON Files** (5,925 lines total, 265 KB)
   - Located: `packages/database/templates/`
   - All templates pass validation
   - Categories: DAILY_LOG (2), SAFETY (3), QUALITY_CONTROL (2), EQUIPMENT (1), LOGISTICS (1), COMPLIANCE (2)

2. **Supporting Scripts**
   - `validate-templates.ts` - JSON validation (all 11 pass)
   - `seed-templates.ts` - Database seeding (ready for ISSUE-071)

3. **Documentation**
   - `templates/README.md` - 532 lines comprehensive guide
   - `TEMPLATE_VALIDATION_RESEARCH.md` - 718 lines industry standards validation
   - `COMPLETION-REPORT.md` - Detailed evidence of completion

4. **Compliance Coverage**
   - OSHA: 29 CFR 1926.20(b), 1926.21(b)(2), 1926.1412, Form 301
   - EPA: CGP 2022 Section 4.4 (EXACT 0.25" threshold)
   - ACI: 318-19 concrete inspection standards
   - Nevada: Clark County Air Quality Regulations Section 94

**Deferred Items:**
- Mobile device testing (Sprint 7-10 when mobile build available)

**Evidence:**
See `docs/sprints/sprint2/evidence/ISSUE-070/COMPLETION-REPORT.md` for full documentation.

## Next Issue

**ISSUE-071:** Template Seed Script Execution (2h)
```
