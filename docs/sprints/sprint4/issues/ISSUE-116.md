# ISSUE-116: Seed All Q&D Templates

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-115 (All templates validated)
**Status:** NOT STARTED

## What You'll Do

Update seed script to include all 20 templates, run database seeding, verify all templates in PostgreSQL, and test template retrieval via GraphQL queries.

## Prerequisites

- [ ] ISSUE-115 complete (All 20 templates validated)
- [ ] Backend running at http://localhost:30101/graphql
- [ ] PostgreSQL running at localhost:5432
- [ ] Database connection configured

## Step-by-Step Instructions

### Step 1: Update Seed Script (15 min)

Open `packages/database/scripts/seed-templates.ts` and verify it includes all 20 templates:

```typescript
// packages/database/scripts/seed-templates.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TEMPLATES_DIR = path.join(__dirname, '../templates');

const TEMPLATE_FILES = [
  // Existing templates (Sprint 3)
  '01-general-daily-log.json',
  '02-superintendent-daily-report.json',
  '03-safety-inspection.json',
  '04-toolbox-talk.json',
  '05-incident-report.json',
  '06-quality-control-inspection.json',
  '07-material-receiving-log.json',
  '08-equipment-inspection.json',
  '09-environmental-inspection.json',
  '10-weekly-stormwater-inspection.json',
  '11-swppp-inspection.json',

  // New agency-specific templates (Sprint 4)
  '12-ndep-bwpc-swppp.json',
  '13-ndot-swppp.json',
  '14-ndep-weekly-stormwater.json',
  '15-ndot-weekly-stormwater.json',
  '16-tmwa-inspection.json',
  '17-quarterly-visual-assessment.json',
  '18-visual-assessment-report.json',
  '19-routine-facility-inspection.json',
  '20-wiw-daily-form.json',
];

async function seedTemplates() {
  console.log('Seeding form templates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const file of TEMPLATE_FILES) {
    const filePath = path.join(TEMPLATES_DIR, file);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const template = JSON.parse(fileContent);

      // Upsert template (create or update if exists)
      const result = await prisma.formTemplate.upsert({
        where: { id: template.id },
        update: {
          name: template.name,
          version: template.version,
          category: template.category,
          description: template.description,
          compliance: template.compliance,
          schema: template.schema,
        },
        create: {
          id: template.id,
          name: template.name,
          version: template.version,
          category: template.category,
          description: template.description,
          compliance: template.compliance,
          schema: template.schema,
        },
      });

      console.log(`✓ Created/Updated: ${template.name} (ID: ${result.id})`);
      successCount++;
    } catch (err) {
      console.error(`✗ Failed to seed ${file}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`✓ Success: ${successCount} templates`);
  console.log(`✗ Errors: ${errorCount} templates`);

  await prisma.$disconnect();

  if (errorCount > 0) {
    process.exit(1);
  }
}

seedTemplates();
```

Add script to package.json if not present:

```json
{
  "scripts": {
    "seed:templates": "ts-node scripts/seed-templates.ts"
  }
}
```

### Step 2: Run Seed Script (15 min)

Execute seeding:

```bash
cd packages/database
pnpm seed:templates
```

Expected output:

```
Seeding form templates...

✓ Created/Updated: General Daily Log (ID: 01-general-daily-log)
✓ Created/Updated: Superintendent Daily Report (ID: 02-superintendent-daily-report)
✓ Created/Updated: Safety Inspection (ID: 03-safety-inspection)
✓ Created/Updated: Toolbox Talk (ID: 04-toolbox-talk)
✓ Created/Updated: Incident Report (ID: 05-incident-report)
✓ Created/Updated: Quality Control Inspection (ID: 06-quality-control-inspection)
✓ Created/Updated: Material Receiving Log (ID: 07-material-receiving-log)
✓ Created/Updated: Equipment Inspection (ID: 08-equipment-inspection)
✓ Created/Updated: Environmental Inspection (ID: 09-environmental-inspection)
✓ Created/Updated: Weekly Stormwater Inspection (ID: 10-weekly-stormwater-inspection)
✓ Created/Updated: SWPPP Inspection (ID: 11-swppp-inspection)
✓ Created/Updated: NDEP BWPC SWPPP Template (ID: 12-ndep-bwpc-swppp)
✓ Created/Updated: NDOT SWPPP Template (ID: 13-ndot-swppp)
✓ Created/Updated: NDEP Weekly Stormwater Log (ID: 14-ndep-weekly-stormwater)
✓ Created/Updated: NDOT Weekly Stormwater Logs (ID: 15-ndot-weekly-stormwater)
✓ Created/Updated: TMWA Inspection Checklist (ID: 16-tmwa-inspection)
✓ Created/Updated: Quarterly Visual Assessment (ID: 17-quarterly-visual-assessment)
✓ Created/Updated: Visual Assessment Report (ID: 18-visual-assessment-report)
✓ Created/Updated: Routine Facility Inspection (ID: 19-routine-facility-inspection)
✓ Created/Updated: WIW Daily Form (ID: 20-wiw-daily-form)

Seeding complete!
✓ Success: 20 templates
✗ Errors: 0 templates
```

Screenshot: Save to evidence/ISSUE-116/deployment/seeding-success.png

### Step 3: Verify Templates in Database (15 min)

Connect to PostgreSQL and verify all 20 templates exist:

```bash
# Connect to database
kubectl port-forward svc/postgres 5432:5432 -n braveforms

# In another terminal
psql -h localhost -U braveforms -d braveforms
```

SQL query:

```sql
SELECT id, name, category, version
FROM "FormTemplate"
ORDER BY id;
```

Expected: 20 rows returned with all template IDs (01-general-daily-log through 20-wiw-daily-form).

Screenshot: Save to evidence/ISSUE-116/deployment/database-verification.png

Exit psql:

```sql
\q
```

### Step 4: Test GraphQL Template Retrieval (15 min)

Navigate to GraphQL Playground: http://localhost:30101/graphql

**Query 1: Get all templates**

```graphql
query GetAllTemplates {
  formTemplates {
    id
    name
    category
    version
    description
  }
}
```

Expected: 20 templates returned.

Screenshot: Save to evidence/ISSUE-116/deployment/graphql-all-templates.png

**Query 2: Filter templates by category (COMPLIANCE)**

```graphql
query GetComplianceTemplates {
  formTemplates(where: { category: COMPLIANCE }) {
    id
    name
    compliance {
      regulation
      agency
      frequency
    }
  }
}
```

Expected: 9 templates returned (NDEP SWPPP, NDOT SWPPP, TMWA, Quarterly Visual, etc.).

Screenshot: Save to evidence/ISSUE-116/deployment/graphql-compliance-filter.png

**Query 3: Get specific template with full schema**

```graphql
query GetNDEPTemplate {
  formTemplate(id: "12-ndep-bwpc-swppp") {
    id
    name
    description
    compliance {
      regulation
      requiredFields
      agency
      citations
    }
    schema {
      sections {
        id
        title
        description
        fields {
          id
          type
          label
          required
        }
      }
    }
  }
}
```

Expected: NDEP BWPC SWPPP template with 5 sections, 50+ fields.

Screenshot: Save to evidence/ISSUE-116/deployment/graphql-ndep-template.png

## TDD Workflow (MANDATORY)

No new tests required - this issue verifies existing seed script and GraphQL queries work with all 20 templates.

## Files Modified

- packages/database/scripts/seed-templates.ts (updated to include 20 templates)
- packages/database/package.json (if seed:templates script added)

## Verification Checklist

- [ ] Seed script includes all 20 template files
- [ ] Seed script runs without errors
- [ ] All 20 templates in PostgreSQL FormTemplate table
- [ ] GraphQL query returns all 20 templates
- [ ] GraphQL category filtering works (COMPLIANCE, SAFETY, etc.)
- [ ] GraphQL single template query returns full schema
- [ ] Seeding idempotent (re-running doesn't duplicate)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-116/

**Required:**

- deployment/
  - seeding-success.png (pnpm seed:templates output)
  - database-verification.png (psql query showing 20 rows)
  - graphql-all-templates.png (20 templates returned)
  - graphql-compliance-filter.png (9 compliance templates)
  - graphql-ndep-template.png (full NDEP template schema)

## Troubleshooting

**Problem:** Seed script fails with "Template not found"

- **Cause:** Template file path incorrect
- **Solution:** Verify file exists in packages/database/templates/ with exact filename

**Problem:** Database connection error

- **Cause:** PostgreSQL not running or connection string incorrect
- **Solution:** Check `kubectl get pods -n braveforms` and verify DATABASE_URL in .env

**Problem:** GraphQL query returns 0 templates

- **Cause:** Seeding didn't complete or database empty
- **Solution:** Re-run `pnpm seed:templates` and check for errors

**Problem:** Duplicate key error when seeding

- **Cause:** Template ID already exists
- **Solution:** Seed script uses `upsert`, so this shouldn't happen. If it does, check for duplicate IDs in JSON files.

**Problem:** GraphQL schema doesn't include formTemplates query

- **Cause:** Backend not restarted after schema changes
- **Solution:** Restart backend: `kubectl rollout restart deployment/backend -n braveforms`

## Success Criteria

- [ ] Seed script updated with all 20 templates
- [ ] Seeding successful (20/20 templates)
- [ ] All templates in PostgreSQL database
- [ ] GraphQL queries returning all templates
- [ ] Category filtering functional
- [ ] Evidence screenshots collected
- [ ] Q&D Construction 100% coverage confirmed

## Time Estimate

**1 hour total:**

- Update seed script: 15 min
- Run seeding: 15 min
- Verify database: 15 min
- Test GraphQL queries: 15 min

## Next Issue

**ISSUE-117:** Template Documentation Update (1h)

- Prerequisites: ISSUE-116 complete (all templates seeded)
- Phase: 2 - Q&D Agency Templates
- Updates packages/database/templates/README.md with all 20 templates and Q&D coverage documentation
