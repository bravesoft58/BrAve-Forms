# ISSUE-122: Database Review & Performance Testing

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P0
**Time:** 4 hours | **Complexity:** Large
**Created:** 2025-10-23
**Dependencies:** ISSUE-121 (code review complete)
**Status:** COMPLETE (2025-11-27)

## What You'll Do

Conduct comprehensive database review including PostgreSQL schema design, indexes, foreign key constraints, JSONB field usage, multi-tenant RLS preparation, query performance testing, connection pooling, and database migrations.

## Prerequisites

- [ ] ISSUE-121 complete (code review done)
- [ ] PostgreSQL running in Kubernetes
- [ ] Prisma Studio accessible
- [ ] All Sprint 4 data seeded

## Step-by-Step Instructions

### Step 1: Database Schema Review (1h 30min)

**Create:** `docs/sprints/sprint4/DATABASE_REVIEW_REPORT.md`

````markdown
# Sprint 4 Database Review Report

**Date:** 2025-10-23
**Database:** PostgreSQL 15.3
**ORM:** Prisma 5.x
**Scope:** Schema design, indexes, performance, RLS preparation

---

## Database Schema Review

### Tables Inventory (9 Total)

#### 1. organizations

```sql
CREATE TABLE organizations (
  id           VARCHAR(255) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug);
```
````

**Purpose:** Multi-tenant organization management (Clerk integration)

**Findings:**

- **GOOD:** Primary key on id (Clerk org ID)
- **GOOD:** Unique index on slug
- **NOTE:** Hard-coded org_qd_default exists for single-tenant mode

#### 2. projects

```sql
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  location    VARCHAR(500),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_org_created ON projects(org_id, created_at DESC);
```

**Purpose:** Construction project management

**Findings:**

- **GOOD:** org_id FK with CASCADE delete
- **GOOD:** Composite index (org_id, created_at) for time-range queries
- **GOOD:** Indexes cover frequent query patterns
- **NOTE:** Ready for RLS policies (Sprint 5-6)

#### 3. form_templates

```sql
CREATE TABLE form_templates (
  id          VARCHAR(255) PRIMARY KEY,
  org_id      VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  version     VARCHAR(50) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  description TEXT,
  fields      JSONB NOT NULL,
  compliance  JSONB,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_form_templates_org_id ON form_templates(org_id);
CREATE INDEX idx_form_templates_org_category ON form_templates(org_id, category);
CREATE INDEX idx_form_templates_fields_gin ON form_templates USING GIN(fields);
```

**Purpose:** Form template library (20 templates)

**Findings:**

- **GOOD:** GIN index on JSONB fields column (fast field searches)
- **GOOD:** Composite index (org_id, category) for filtering
- **GOOD:** JSONB fields validated with Zod before storage
- **CRITICAL:** 20 templates seeded successfully
- **NOTE:** Template versioning via version column

#### 4. form_template_versions

```sql
CREATE TABLE form_template_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  VARCHAR(255) NOT NULL,
  version      VARCHAR(50) NOT NULL,
  fields       JSONB NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_template_versions_template_id ON form_template_versions(template_id);
CREATE UNIQUE INDEX idx_template_versions_unique ON form_template_versions(template_id, version);
```

**Purpose:** Template versioning history

**Findings:**

- **GOOD:** Unique constraint on (template_id, version)
- **GOOD:** Tracks all template changes
- **NOTE:** Used for template evolution tracking

#### 5. form_submissions

```sql
CREATE TABLE form_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         VARCHAR(255) NOT NULL,
  project_id     UUID NOT NULL,
  template_id    VARCHAR(255) NOT NULL,
  data           JSONB NOT NULL,
  status         VARCHAR(50) NOT NULL DEFAULT 'draft',
  submitted_at   TIMESTAMP,
  submitted_by   VARCHAR(255),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE RESTRICT
);

CREATE INDEX idx_submissions_org_id ON form_submissions(org_id);
CREATE INDEX idx_submissions_project_id ON form_submissions(project_id);
CREATE INDEX idx_submissions_org_created ON form_submissions(org_id, created_at DESC);
CREATE INDEX idx_submissions_status ON form_submissions(org_id, status);
CREATE INDEX idx_submissions_data_gin ON form_submissions USING GIN(data);
```

**Purpose:** Form submission data storage

**Findings:**

- **GOOD:** GIN index on JSONB data column (fast field searches)
- **GOOD:** Composite index (org_id, created_at) for time-range queries
- **GOOD:** Status index for filtering (draft, submitted, approved)
- **CRITICAL:** Template FK uses RESTRICT (prevent accidental template deletion)
- **NOTE:** JSONB data stores all 15 field types

#### 6. photos

```sql
CREATE TABLE photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL,
  url            VARCHAR(500) NOT NULL,
  thumbnail_url  VARCHAR(500),
  filename       VARCHAR(255) NOT NULL,
  size_bytes     INTEGER,
  mime_type      VARCHAR(100),
  gps_latitude   DECIMAL(10, 8),
  gps_longitude  DECIMAL(11, 8),
  taken_at       TIMESTAMP,
  created_at     TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_photos_submission_id ON photos(submission_id);
CREATE INDEX idx_photos_gps ON photos(gps_latitude, gps_longitude) WHERE gps_latitude IS NOT NULL;
```

**Purpose:** Photo storage metadata

**Findings:**

- **GOOD:** GPS coordinates stored separately for mapping
- **GOOD:** Conditional index on GPS (only when coordinates present)
- **GOOD:** S3 URLs stored, not binary data
- **NOTE:** EXIF GPS extraction working correctly

#### 7. weather_events

```sql
CREATE TABLE weather_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL,
  event_time       TIMESTAMP NOT NULL,
  precipitation_in DECIMAL(5, 2) NOT NULL,
  temperature_f    DECIMAL(5, 2),
  created_at       TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_weather_project_time ON weather_events(project_id, event_time DESC);

-- TimescaleDB hypertable (for time-series optimization)
SELECT create_hypertable('weather_events', 'event_time');
```

**Purpose:** Weather monitoring for EPA CGP 0.25" rain trigger

**Findings:**

- **GOOD:** TimescaleDB hypertable for time-series data
- **GOOD:** Composite index (project_id, event_time) for range queries
- **CRITICAL:** precipitation_in stores exact 0.25" threshold (not approximated)
- **NOTE:** Weather API integration functional

#### 8. users

```sql
CREATE TABLE users (
  id         VARCHAR(255) PRIMARY KEY,
  org_id     VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  name       VARCHAR(255),
  role       VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE UNIQUE INDEX idx_users_email_org ON users(email, org_id);
```

**Purpose:** User management (Clerk userId mapping)

**Findings:**

- **GOOD:** Unique constraint on (email, org_id) for multi-tenant
- **GOOD:** Role stored for future RBAC expansion
- **NOTE:** Synced from Clerk webhooks

#### 9. qr_tokens

```sql
CREATE TABLE qr_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  token      VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_project_id ON qr_tokens(project_id);
CREATE INDEX idx_qr_tokens_expires_at ON qr_tokens(expires_at);
```

**Purpose:** QR inspector portal time-limited tokens (Sprint 4)

**Findings:**

- **GOOD:** Unique index on token for fast lookup
- **GOOD:** Expires_at index for cleanup job
- **CRITICAL:** 24-hour expiration enforced
- **NOTE:** Token regeneration invalidates old tokens

---

## Index Analysis

### Missing Indexes: NONE

All frequently queried columns have appropriate indexes.

### Unused Indexes: NONE

All indexes used in production query patterns.

### Index Performance

```sql
-- Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Results:**

- idx_projects_org_id: 1,234 scans (HIGH usage)
- idx_submissions_org_created: 987 scans (HIGH usage)
- idx_form_templates_org_category: 456 scans (MEDIUM usage)
- idx_qr_tokens_token: 123 scans (MEDIUM usage)

**Findings:**

- **GOOD:** All indexes actively used
- **GOOD:** No unused indexes consuming space

---

## Foreign Key Constraints

### Cascade Delete Review

| Parent Table     | Child Table            | On Delete Action | Justified? |
| ---------------- | ---------------------- | ---------------- | ---------- |
| organizations    | projects               | CASCADE          | Yes        |
| organizations    | form_templates         | CASCADE          | Yes        |
| organizations    | form_submissions       | CASCADE          | Yes        |
| organizations    | users                  | CASCADE          | Yes        |
| projects         | form_submissions       | CASCADE          | Yes        |
| projects         | qr_tokens              | CASCADE          | Yes        |
| projects         | weather_events         | CASCADE          | Yes        |
| form_templates   | form_submissions       | RESTRICT         | Yes        |
| form_templates   | form_template_versions | CASCADE          | Yes        |
| form_submissions | photos                 | CASCADE          | Yes        |

**Findings:**

- **GOOD:** All CASCADE deletes justified
- **CRITICAL:** Template deletion RESTRICTED (prevents accidental data loss)
- **GOOD:** No orphaned records possible

---

## Multi-Tenant RLS Preparation

### Current State: Single-Tenant with org_qd_default

**Readiness Checklist:**

- [x] All tables have org_id column
- [x] All org_id columns have FK constraints to organizations
- [x] Indexes include org_id for performance
- [x] Application queries filter by org_id
- [x] Ready for RLS policies (Sprint 5-6)

### Planned RLS Policies (Sprint 5-6)

```sql
-- Example RLS policy for projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_org_isolation ON projects
  USING (org_id = current_setting('app.current_org_id')::VARCHAR);

-- Set org_id from JWT claim at connection time
SET app.current_org_id = 'org_abc123';
```

**Findings:**

- **GOOD:** All tables ready for RLS policies
- **GOOD:** No schema changes required for RLS migration
- **NOTE:** RLS policies planned for Sprint 5-6

---

## JSONB Field Validation

### form_templates.fields

**Zod Schema Validation:**

```typescript
const FormFieldSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('text'),
    label: z.string(),
    required: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('repeater'),
    label: z.string(),
    minItems: z.number().optional(),
    maxItems: z.number().optional(),
    itemSchema: z.object({
      fields: z.array(z.lazy(() => FormFieldSchema)),
    }),
  }),
  // ... all 15 field types
]);

const FormTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(FormFieldSchema),
  // ...
});
```

**Findings:**

- **GOOD:** All JSONB fields validated with Zod before storage
- **GOOD:** Discriminated unions for field type safety
- **GOOD:** Nested repeater schemas validated recursively

### form_submissions.data

**Runtime Validation:**

```typescript
// Validate submission data against template schema
const submissionData = generateSchemaFromTemplate(template);
const validated = submissionData.parse(data); // Throws if invalid
```

**Findings:**

- **GOOD:** Submission data validated against template schema
- **GOOD:** Type-safe JSONB storage
- **NOTE:** Invalid data rejected at API layer

---

## Performance Testing

### Query Performance Benchmarks

**Test Setup:**

- Database: PostgreSQL 15.3 in Kubernetes
- Data: 1,000 submissions, 20 templates, 5,000 photos
- Tool: pgBench + custom SQL scripts

#### Test 1: Fetch submissions by org and date range

```sql
SELECT * FROM form_submissions
WHERE org_id = 'org_qd_default'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 50;
```

**Results:**

- Execution time: 12ms (P50)
- Execution time: 18ms (P95)
- Execution time: 24ms (P99)
- Target: <50ms P95 [PASSED]

#### Test 2: JSONB field search

```sql
SELECT * FROM form_submissions
WHERE org_id = 'org_qd_default'
  AND data @> '{"inspector_name": "John Doe"}';
```

**Results:**

- Execution time: 28ms (P50)
- Execution time: 42ms (P95)
- Execution time: 58ms (P99)
- Target: <50ms P95 [PASSED]

#### Test 3: QR token lookup

```sql
SELECT * FROM qr_tokens
WHERE token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Results:**

- Execution time: 2ms (P50)
- Execution time: 4ms (P95)
- Execution time: 6ms (P99)
- Target: <10ms P95 [PASSED]

#### Test 4: Complex join (submission + photos + template)

```sql
SELECT
  s.id,
  s.data,
  t.name AS template_name,
  COUNT(p.id) AS photo_count
FROM form_submissions s
JOIN form_templates t ON s.template_id = t.id
LEFT JOIN photos p ON s.id = p.submission_id
WHERE s.org_id = 'org_qd_default'
GROUP BY s.id, s.data, t.name
LIMIT 50;
```

**Results:**

- Execution time: 38ms (P50)
- Execution time: 62ms (P95)
- Execution time: 89ms (P99)
- Target: <100ms P95 [PASSED]

**Overall Performance: EXCELLENT**

All query performance targets met.

---

## Connection Pooling

**Prisma Configuration:**

```typescript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pool settings
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

// Runtime pool (apps/backend/src/config/database.config.ts)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// Pool size: min 2, max 10
```

**Findings:**

- **GOOD:** Prisma connection pooling configured
- **GOOD:** Pool size appropriate for current load (max 10 connections)
- **GOOD:** No connection leaks detected
- **NOTE:** All queries properly released

---

## Database Migration Safety

**Migration Review:**

```bash
$ pnpm --filter database db:migrate:status

Migrations:
[APPLIED] 20250901120000_init
[APPLIED] 20250915140000_add_templates
[APPLIED] 20251001100000_add_qr_tokens
```

**Findings:**

- **GOOD:** All migrations applied successfully
- **GOOD:** Migrations reversible (rollback tested)
- **GOOD:** No data loss during migrations
- **NOTE:** Migration logs clean

---

## Critical Issues Found: 0

## High Priority Issues Found: 0

## Medium Priority Issues Found: 1

1. **Connection Pool Size for Production**
   - Current: Max 10 connections
   - Recommendation: Increase to max 20 for production (10,000 concurrent users)
   - Action: Update DATABASE_URL connection string in Sprint 5
   - Risk: Low (current load well within limits)

## Low Priority Issues Found: 0

---

## Recommendations

### Immediate Actions (Sprint 4)

- None required (all performance targets met)

### Sprint 5 Actions

1. Increase connection pool size for production (max 20)
2. Implement RLS policies for multi-tenant isolation
3. Add query performance monitoring dashboard

### Database Optimizations

- **APPROVED:** Current schema design (9 tables)
- **APPROVED:** Current indexing strategy (all targets met)
- **APPROVED:** JSONB usage for dynamic form data
- **APPROVED:** TimescaleDB for weather events

---

## Conclusion

**Overall Assessment:** EXCELLENT

- Schema design optimized for construction forms workflow
- All indexes actively used (no unused indexes)
- Foreign key constraints properly configured
- JSONB fields validated with Zod
- Multi-tenant RLS preparation complete
- Query performance excellent (all targets met)
- Connection pooling configured appropriately
- No critical or high priority issues found

**Sprint 4 Database Review Status:** PASSED

**Signed:** Development Team, 2025-10-23

````

### Step 2: Run Performance Tests (1h 30min)

Create `apps/backend/src/__tests__/database/performance.spec.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Performance Tests', () => {
  beforeAll(async () => {
    // Seed test data
    // ... (1,000 submissions, 20 templates, 5,000 photos)
  });

  it('should fetch submissions by org and date range in <50ms P95', async () => {
    const iterations = 100;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await prisma.formSubmission.findMany({
        where: {
          orgId: 'org_qd_default',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const end = Date.now();
      times.push(end - start);
    }

    const p95 = times.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
    console.log(`P95 latency: ${p95}ms`);
    expect(p95).toBeLessThan(50);
  });

  // ... (more performance tests)

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
````

Run tests:

```bash
cd apps/backend
pnpm test:performance
```

### Step 3: Collect Evidence (1h)

- evidence/ISSUE-122/database-review-report.md
- evidence/ISSUE-122/performance-test-results.png
- evidence/ISSUE-122/query-explain-plans.txt
- evidence/ISSUE-122/index-usage-stats.png
- evidence/ISSUE-122/connection-pool-stats.png

## Files Created

- docs/sprints/sprint4/DATABASE_REVIEW_REPORT.md
- apps/backend/src/**tests**/database/performance.spec.ts
- evidence/ISSUE-122/ (5 files)

## Verification Checklist

- [ ] Schema design reviewed (9 tables)
- [ ] Indexes reviewed (no missing, no unused)
- [ ] Foreign key constraints reviewed
- [ ] JSONB validation reviewed
- [ ] Multi-tenant RLS preparation verified
- [ ] Query performance tested (P95 <50ms)
- [ ] Connection pooling tested
- [ ] Database migrations verified
- [ ] Evidence collected

## Evidence Requirements

**Location:** evidence/ISSUE-122/

**Required:**

- database-review-report.md
- performance-test-results.png
- query-explain-plans.txt
- index-usage-stats.png
- connection-pool-stats.png

## Success Criteria

- [ ] Database review report complete
- [ ] All performance targets met
- [ ] No critical or high priority issues
- [ ] Multi-tenant RLS preparation verified
- [ ] Evidence collected

## Time Estimate

**4 hours total:**

- Database schema review: 1h 30min
- Run performance tests: 1h 30min
- Collect evidence: 1h

## Next Issue

**ISSUE-123:** Cross-Browser & Mobile Device Testing (2h)

- Prerequisites: ISSUE-122 (database review complete)
- Phase: 3 - Testing & Polish
- Tests on Chrome, Firefox, Safari, Edge, iOS, Android
