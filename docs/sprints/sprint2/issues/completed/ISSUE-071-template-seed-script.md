# ISSUE-071: Template Seed Script Execution

**Sprint:** Sprint 2 | **Phase:** 4 - Template Library | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-070 (templates defined)

## What You'll Do

Create seed script to load 10 templates into database, run seed command, verify templates in database, and test template retrieval queries.

## Step-by-Step Instructions

### Step 1: Create Template Seed Script (60 min)

Create `apps/backend/prisma/seeds/templates.seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TemplateData {
  name: string;
  description: string;
  category: string;
  fields: any[];
}

async function seedTemplates() {
  const templatesDir = path.join(__dirname, 'templates');
  const categories = fs.readdirSync(templatesDir).filter((f) => f !== 'README.md');

  let totalSeeded = 0;

  for (const category of categories) {
    const categoryPath = path.join(templatesDir, category);
    const templates = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.json'));

    for (const templateFile of templates) {
      const templatePath = path.join(categoryPath, templateFile);
      const templateData: TemplateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

      // Create system template (no orgId - available to all orgs for cloning)
      const template = await prisma.formTemplate.create({
        data: {
          orgId: 'system', // Special orgId for system templates
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          fields: templateData.fields as any,
          version: 1,
          isActive: true,
          createdBy: 'system',
        },
      });

      // Create version snapshot
      await prisma.formTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          fields: templateData.fields as any,
          changeLog: 'Initial system template',
          createdBy: 'system',
        },
      });

      console.log(`✓ Seeded: ${templateData.name}`);
      totalSeeded++;
    }
  }

  console.log(`\n✓ Seeded ${totalSeeded} templates successfully`);
}

seedTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

### Step 2: Add Seed Command to package.json (15 min)

Update `apps/backend/package.json`:

```json
{
  "scripts": {
    "seed": "ts-node prisma/seeds/seed.ts",
    "seed:templates": "ts-node prisma/seeds/templates.seed.ts"
  }
}
```

### Step 3: Run Seed Script (15 min)

```bash
cd apps/backend
pnpm seed:templates
```

Expected output:

```
✓ Seeded: Daily Safety Inspection
✓ Seeded: Toolbox Talk Sign-In
✓ Seeded: Incident Report
...
✓ Seeded 10 templates successfully
```

### Step 4: Verify in Prisma Studio (15 min)

```bash
cd packages/database
pnpm studio
```

Access http://localhost:5555

Verify:

- [ ] 10 templates exist in form_templates table
- [ ] All have orgId = 'system'
- [ ] All have version = 1
- [ ] 10 version snapshots exist in form_template_versions

### Step 5: Test Template Queries (30 min)

```graphql
query GetSystemTemplates {
  formTemplates(orgId: "system") {
    id
    name
    category
    fields {
      id
      type
      label
    }
  }
}

query GetTemplatesByCategory {
  formTemplates(orgId: "system", category: "safety") {
    id
    name
    description
  }
}
```

### Step 6: Test Template Cloning (15 min)

```graphql
mutation CloneSafetyTemplate {
  cloneFormTemplate(templateId: "<system_template_id>", name: "My Safety Inspection") {
    id
    name
    orgId
  }
}
```

Verify cloned template has user's orgId, not "system".

## Files to Create

- `templates.seed.ts`
- Update `package.json` scripts

## Verification Checklist

- [ ] Seed script created
- [ ] 10 templates seeded successfully
- [ ] All templates visible in Prisma Studio
- [ ] System templates queryable
- [ ] Template cloning functional
- [ ] Cloned templates have correct orgId

## Time Estimate: 2 hours

## Next Issue

**ISSUE-072:** Backend Container Optimization (3h)
