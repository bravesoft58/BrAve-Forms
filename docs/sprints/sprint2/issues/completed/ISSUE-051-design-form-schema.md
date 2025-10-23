# ISSUE-051: Design Form Schema in Prisma

**STATUS:** ✅ COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-051/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** Sprint 1 database deployment

## What You'll Do

Create Prisma schema for form templates with JSONB fields column for dynamic form definitions, form_template_versions table for versioning, and multi-tenant orgId filtering. Run migration to deploy tables to PostgreSQL.

## Prerequisites

- [ ] PostgreSQL running in Kubernetes (Sprint 1 complete)
- [ ] Prisma CLI accessible
- [ ] Port forward to PostgreSQL: kubectl port-forward svc/postgres 5432:5432 -n braveforms

## Step-by-Step Instructions

### Step 1: Design Form Template Schema (30 min)

Edit `packages/database/schema.prisma`:

```prisma
// Form Templates - Dynamic form definitions
model FormTemplate {
  id          String   @id @default(uuid())
  orgId       String   @map("org_id") // Clerk organization ID (multi-tenancy)
  name        String
  description String?
  category    String   // e.g., "safety", "quality", "compliance", "daily_log"

  // JSONB column for dynamic field definitions
  fields      Json     // FieldDefinition[] serialized

  // Form metadata
  isActive    Boolean  @default(true) @map("is_active")
  version     Int      @default(1)

  // Audit trail
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdBy   String   @map("created_by") // User ID from Clerk

  // Relations
  versions    FormTemplateVersion[]
  submissions FormSubmission[]

  // Indexes for performance
  @@index([orgId])
  @@index([category])
  @@index([isActive])
  @@map("form_templates")
}

// Form Template Versioning - History of template changes
model FormTemplateVersion {
  id             String       @id @default(uuid())
  templateId     String       @map("template_id")
  template       FormTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  version        Int
  fields         Json         // Snapshot of fields at this version
  changeLog      String?      @map("change_log") // What changed

  createdAt      DateTime     @default(now()) @map("created_at")
  createdBy      String       @map("created_by")

  @@index([templateId])
  @@index([version])
  @@map("form_template_versions")
}

// Form Submissions - Completed forms (Phase 3)
model FormSubmission {
  id             String       @id @default(uuid())
  orgId          String       @map("org_id")
  templateId     String       @map("template_id")
  template       FormTemplate @relation(fields: [templateId], references: [id])

  // Submission data
  data           Json         // Field values
  status         String       // "draft", "in_progress", "submitted", "approved", "rejected"

  // Metadata
  submittedAt    DateTime?    @map("submitted_at")
  submittedBy    String?      @map("submitted_by")
  approvedAt     DateTime?    @map("approved_at")
  approvedBy     String?      @map("approved_by")

  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  @@index([orgId])
  @@index([templateId])
  @@index([status])
  @@map("form_submissions")
}
```

### Step 2: Create TypeScript Types for JSONB Structure (30 min)

Create `packages/types/src/form-template.ts`:

```typescript
/**
 * Form Field Definition
 * Stored in form_templates.fields JSONB column
 */
export interface FieldDefinition {
  id: string; // Unique field ID within template
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule;
  conditionalLogic?: ConditionalLogic;
  metadata?: Record<string, unknown>;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'photo'
  | 'signature'
  | 'gps'
  | 'weather_data';

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: number | string;
  message: string;
}

export interface ConditionalLogic {
  field: string; // Field ID to watch
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  value: string | number | boolean;
  action: 'show' | 'hide' | 'require';
}

/**
 * Form Template DTO
 */
export interface FormTemplateDTO {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  category: string;
  fields: FieldDefinition[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Form Submission DTO
 */
export interface FormSubmissionDTO {
  id: string;
  orgId: string;
  templateId: string;
  data: Record<string, unknown>; // Field ID → field value
  status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 3: Generate Prisma Client (15 min)

```bash
cd packages/database

# Generate Prisma client with new models
pnpm db:generate

# Expected output:
# ✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

Verify generated types:

```bash
cat node_modules/@prisma/client/index.d.ts | grep "FormTemplate"
```

Expected: FormTemplate, FormTemplateVersion, FormSubmission types exist

### Step 4: Create Migration (15 min)

```bash
cd packages/database

# Create migration for form tables
pnpm db:migrate -- --name add_form_templates

# Enter migration name when prompted: add_form_templates
```

Expected output:

```
Prisma Migrate created the following migration without applying it:

migrations/
  └─ 20251002XXXXXX_add_form_templates/
    └─ migration.sql
```

Review generated SQL:

```bash
cat prisma/migrations/*_add_form_templates/migration.sql
```

### Step 5: Apply Migration (15 min)

```bash
# Port forward to PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n braveforms

# In new terminal, apply migration
cd packages/database
pnpm db:migrate

# Expected:
# The following migration(s) have been applied:
# migrations/
#   └─ 20251002XXXXXX_add_form_templates/
#     └─ migration.sql
```

### Step 6: Verify Tables in Prisma Studio (15 min)

```bash
cd packages/database
pnpm studio

# Access http://localhost:5555
```

Verify tables exist:

- [ ] form_templates (with columns: id, org_id, name, fields JSONB, etc.)
- [ ] form_template_versions (with template_id foreign key)
- [ ] form_submissions (with template_id foreign key)

**Screenshot:** Prisma Studio showing all three tables

## TDD Workflow (MANDATORY)

### Phase 1: Schema Design (No Tests Yet)

Schema design is declarative - tests come in ISSUE-052 (GraphQL types) and ISSUE-053 (resolvers)

### Phase 2: Migration Verification

**Verify migration:**

```bash
pnpm db:migrate status
```

**Expected:** "Database schema is up to date!"

**Screenshot:** Save status output to `evidence/ISSUE-051/deployment/migration-status.png`

### Phase 3: Manual Data Verification

**Insert test record:**

```sql
INSERT INTO form_templates (id, org_id, name, category, fields, created_by)
VALUES (
  'test-template-001',
  'org_test123',
  'Daily Safety Inspection',
  'safety',
  '[{"id":"field1","type":"text","label":"Inspector Name","required":true}]'::jsonb,
  'user_test123'
);
```

**Query back:**

```sql
SELECT * FROM form_templates WHERE id = 'test-template-001';
```

**Expected:** Record returned with fields as JSONB

**Screenshot:** Save query result to `evidence/ISSUE-051/test-results/jsonb-insert-query.png`

## Files to Modify/Create

**Modify:**

- `packages/database/schema.prisma` (add 3 models)

**Create:**

- `packages/types/src/form-template.ts` (TypeScript types for JSONB)
- `packages/database/prisma/migrations/*_add_form_templates/migration.sql` (auto-generated)

## Verification Checklist

- [ ] FormTemplate model added to schema.prisma
- [ ] FormTemplateVersion model added to schema.prisma
- [ ] FormSubmission model added to schema.prisma
- [ ] TypeScript types created in packages/types
- [ ] Prisma client generated successfully
- [ ] Migration created (add_form_templates)
- [ ] Migration applied to PostgreSQL
- [ ] Tables visible in Prisma Studio
- [ ] JSONB fields column functional (insert/query test)
- [ ] Indexes created for orgId, category, isActive
- [ ] Zero emoji in schema or types
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-051/

**Required:**

- deployment/
  - migration-status.png (pnpm db:migrate status)
  - migration-sql.png (generated migration.sql)
  - prisma-studio-tables.png (all 3 tables visible)
- test-results/
  - jsonb-insert-query.png (test record insert/query)
  - prisma-client-generated.png (pnpm db:generate output)
- code/
  - schema-prisma-diff.png (git diff showing new models)
  - typescript-types.png (form-template.ts file)

## Troubleshooting

**Problem:** Migration fails with "column already exists"

- **Cause:** Previous migration attempt
- **Solution:** pnpm db:migrate reset (WARNING: drops all data)

**Problem:** JSONB column not accepting JSON

- **Cause:** PostgreSQL version <9.4
- **Solution:** Verify PostgreSQL 15 running (kubectl exec into pod)

**Problem:** Prisma Studio doesn't show new tables

- **Cause:** Studio cache
- **Solution:** Restart pnpm studio

## Success Criteria

- [ ] form_templates table deployed with JSONB fields column
- [ ] form_template_versions table deployed with versioning
- [ ] form_submissions table deployed (ready for Phase 3)
- [ ] TypeScript types created for JSONB structure
- [ ] Migration applied successfully
- [ ] Test JSONB insert/query functional
- [ ] Multi-tenant indexes created (orgId)

## Time Estimate

**2 hours total:**

- Schema design: 30 min
- TypeScript types: 30 min
- Prisma client generation: 15 min
- Migration creation: 15 min
- Migration application: 15 min
- Prisma Studio verification: 15 min

## Next Issue

**ISSUE-052:** Create FormTemplate GraphQL Types (2h)

- Prerequisites: This issue complete (schema exists)
- Uses: Prisma models for GraphQL type generation

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-051/COMPLETION-REPORT.md)

**Time:** 2 hours (estimated 2h)

**Summary:**

- Three tables created: form_templates, form_template_versions, form_submissions
- JSONB schema field for dynamic form definitions
- Multi-tenancy via org_id FK → organizations (CASCADE)
- Version history tracking with FormTemplateVersion
- Migration applied directly in PostgreSQL pod (port-forward instability workaround)
- All tables verified with \dt command
- JSONB insert/query tests passed
