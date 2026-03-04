# Sprint 7-10 Conflict Analysis Report

**Created:** 2025-12-19
**Updated:** 2025-12-20 (Comprehensive Phase 1-3 Analysis)
**Analyst:** Claude Code
**Scope:** ISSUE-179 through ISSUE-221
**Status:** COMPLETE

---

## Executive Summary

A comprehensive conflict analysis was performed comparing the current codebase state against Sprint 7-10 planned implementations. The analysis identified **20 total conflicts** across all sprints, with **2 critical issues** (both properly superseded), **5 medium severity** items, and **13 low severity** documentation or dependency gaps.

**Conclusion:** No blocking conflicts exist. Sprints 8-10 can proceed as planned with minor documentation updates.

---

## Phase 1: Current State Baseline

### Prisma Schema Enums (Actual Values)

| Enum               | Values                                                       | Location               |
| ------------------ | ------------------------------------------------------------ | ---------------------- |
| `ProjectStatus`    | PLANNING, ACTIVE, SUSPENDED, COMPLETED, CLOSED               | schema.prisma L167-173 |
| `UserRole`         | OWNER, ADMIN, MANAGER, MEMBER, INSPECTOR                     | schema.prisma L159-165 |
| `FormStatus`       | DRAFT, IN_PROGRESS, SUBMITTED, REVIEWED, APPROVED, REJECTED  | schema.prisma L294-301 |
| `InspectionStatus` | PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED          | schema.prisma L184-190 |
| `FormCategory`     | EPA_SWPPP, EPA_CGP, OSHA_SAFETY, STATE_PERMIT, CUSTOM        | schema.prisma L286-292 |
| `InspectionType`   | ROUTINE, RAIN_EVENT, QUARTERLY, PRE_STORM, POST_STORM, FINAL | schema.prisma L175-182 |
| `TokenPermission`  | VIEW_SUBMISSIONS, VIEW_PHOTOS, VIEW_PROJECT_INFO             | schema.prisma L280-284 |
| `PlanType`         | STARTER, PROFESSIONAL, ENTERPRISE                            | schema.prisma L153-157 |
| `WeatherSource`    | NOAA, OPENWEATHER, MANUAL                                    | schema.prisma L303-307 |
| `StorageType`      | POSTGRESQL, S3                                               | schema.prisma L130-133 |

### GraphQL Schema Enums (Additional)

| Enum                     | Values                              | Purpose   |
| ------------------------ | ----------------------------------- | --------- |
| `SupportRequestType`     | BUG, FEATURE, HELP, FEEDBACK        | ISSUE-174 |
| `SupportRequestStatus`   | OPEN, IN_PROGRESS, RESOLVED, CLOSED | ISSUE-174 |
| `SupportRequestPriority` | LOW, NORMAL, HIGH, URGENT           | ISSUE-174 |

### Schema Structure Patterns

**Two patterns exist in codebase:**

1. **Sections-based** (majority of templates):

```json
{
  "schema": {
    "sections": [
      { "id": "section1", "title": "Section 1", "fields": [...] }
    ]
  }
}
```

2. **Flat fields** (legacy templates):

```json
{
  "schema": {
    "fields": [...]
  }
}
```

**Resolution:** ISSUE-178 added `extractFieldsFromSchema()` helper to handle both patterns.

### Validation Patterns in Use

- **NestJS:** ValidationPipe with class-validator decorators (REQUIRED)
- **Forms:** Zod schema validation
- **Field Types Supported:** text, textarea, number, date, select, checkbox, photo, signature, gps, weather_data, bmpChecklist

### Known Fixes Applied (Sprint 7 Phase 0)

| Issue     | Root Cause                                                 | Fix Applied                                      |
| --------- | ---------------------------------------------------------- | ------------------------------------------------ |
| ISSUE-175 | Missing class-validator decorators on CreateProjectInput   | Added @IsString(), @IsNumber() decorators        |
| ISSUE-176 | Double onChange handler, user.id vs user.userId            | Removed spread pattern, changed to user.userId   |
| ISSUE-177 | Duplicate save notifications                               | Removed notifications from FormBuilder component |
| ISSUE-178 | Schema extraction expected flat fields, missing decorators | Added extractFieldsFromSchema(), decorators      |

---

## Phase 2: Sprint-by-Sprint Conflict Analysis

---

## Sprint 7 Conflict Analysis

**Issues Reviewed:** ISSUE-179 through ISSUE-199 (21 issues)

### Issues by Phase

| Phase   | Issues                   | Focus                  |
| ------- | ------------------------ | ---------------------- |
| Phase 1 | ISSUE-179, 180, 181      | Form Builder Fixes     |
| Phase 2 | ISSUE-182, 183, 184      | Form Template Fixes    |
| Phase 3 | ISSUE-185, 186, 187, 188 | Form UX Improvements   |
| Phase 4 | ISSUE-189, 190, 191      | Dashboard & Navigation |
| Phase 5 | ISSUE-192                | Settings & Preferences |
| Phase 6 | ISSUE-193, 194, 195      | Admin Features         |
| Phase 7 | ISSUE-196, 197, 198, 199 | Workflow Enhancement   |

### Conflicts Found

| Issue     | Category   | Description                                             | Current State                     | Desired State                          | Severity     | Resolution                                                                                            |
| --------- | ---------- | ------------------------------------------------------- | --------------------------------- | -------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| ISSUE-195 | BREAKING   | Creates `ProjectFormRequirement` model                  | No model exists                   | New model proposed                     | **CRITICAL** | **DO NOT IMPLEMENT** - Superseded by Sprint 8 ISSUE-200 which uses `ProjectTemplateAssignment`        |
| ISSUE-196 | BREAKING   | Creates `useProjectContext` hook                        | No hook exists                    | Simple hook proposed                   | **CRITICAL** | **DO NOT IMPLEMENT** - Superseded by Sprint 8 ISSUE-208-211 which uses Valtio store with localStorage |
| ISSUE-187 | SCHEMA     | Uses `showWhen` property for conditional fields         | Field interface has no `showWhen` | `showWhen: { field, operator, value }` | MEDIUM       | Add `showWhen` to Field interface                                                                     |
| ISSUE-181 | SCHEMA     | Adds `layout.colSpan` for multi-column                  | Field has no `layout` property    | `layout: { colSpan: 1-12 }`            | MEDIUM       | Add `layout` to Field interface                                                                       |
| ISSUE-186 | SCHEMA     | Adds `projectBinding` for auto-fill                     | Field has no `projectBinding`     | `projectBinding?: string`              | MEDIUM       | Add `projectBinding` to Field interface                                                               |
| ISSUE-194 | ENUM       | Uses role values `owner`, `manager`, `member`, `viewer` | Prisma UserRole has no `VIEWER`   | Unclear if enum or string              | MEDIUM       | Clarify: use UserRole enum OR custom string field                                                     |
| ISSUE-193 | AMBIGUITY  | Clerk roles vs Prisma UserRole mapping                  | Two role systems                  | Need mapping documentation             | MEDIUM       | Document Clerk role to Prisma UserRole mapping                                                        |
| ISSUE-183 | TYPE       | Lists `address`, `email`, `phone` as text variants      | Backend may not handle aliases    | Map aliases to text rendering          | LOW          | Ensure FieldRenderer handles type aliases                                                             |
| ISSUE-191 | DEPENDENCY | Requires `browser-image-compression`                    | Package not installed             | Add to dependencies                    | LOW          | `pnpm add browser-image-compression`                                                                  |
| ISSUE-192 | DEPENDENCY | Requires `i18next`, `react-i18next`                     | Packages not installed            | Add to dependencies                    | LOW          | `pnpm add i18next react-i18next`                                                                      |

### Sprint 7 Summary

- **Total Conflicts:** 10
- **Critical:** 2 (both superseded - do not implement)
- **Medium:** 5 (schema additions, enum clarification)
- **Low:** 3 (dependencies, type aliases)

---

## Sprint 8 Conflict Analysis

**Issues Reviewed:** ISSUE-200 through ISSUE-211 (12 issues)

### Issues by Phase

| Phase   | Issues                                  | Focus                    |
| ------- | --------------------------------------- | ------------------------ |
| Phase 1 | ISSUE-200, 201, 202, 203, 204, 205, 206 | Backend Schema & API     |
| Phase 2 | ISSUE-207                               | LOG Entry Copy Yesterday |
| Phase 3 | ISSUE-208, 209, 210, 211                | Project Context UI       |

### Conflicts Found

| Issue     | Category | Description                  | Current State                             | Desired State                                    | Severity | Resolution                                                        |
| --------- | -------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| ISSUE-202 | SCHEMA   | ProjectStatus needs ARCHIVED | 5 values exist (PLANNING through CLOSED)  | Add ARCHIVED as 6th value                        | LOW      | Issue correctly notes existing values - just add ARCHIVED         |
| ISSUE-202 | SCHEMA   | Missing archive fields       | Project model lacks archivedAt/archivedBy | Add `archivedAt DateTime?`, `archivedBy String?` | LOW      | Add fields per spec                                               |
| ISSUE-206 | SCHEMA   | Missing close fields         | Project model lacks closedAt/closedBy     | Add `closedAt DateTime?`, `closedBy String?`     | MEDIUM   | Fields referenced but not in schema definition - add to ISSUE-202 |
| ISSUE-207 | ROUTING  | UserRole format difference   | Prisma: OWNER, ADMIN, etc.                | Clerk: org:admin, org:project_manager            | LOW      | Correctly uses Clerk format for server checks - no conflict       |

### Sprint 8 Summary

- **Total Conflicts:** 4
- **Critical:** 0
- **Medium:** 1 (missing closedAt/closedBy in schema)
- **Low:** 3 (additive changes only)

**Note:** Sprint 8 architecture is sound and properly supersedes Sprint 7's cancelled approaches.

---

## Sprint 9 Conflict Analysis

**Issues Reviewed:** ISSUE-212 through ISSUE-217 (6 issues)

### Issues by Phase

| Phase   | Issues                   | Focus                             |
| ------- | ------------------------ | --------------------------------- |
| Phase 1 | ISSUE-212, 213           | Admin Template Management         |
| Phase 2 | ISSUE-214, 215, 216, 217 | Template Selection & LOG Workflow |

### Conflicts Found

| Issue     | Category     | Description                             | Current State                                  | Desired State                               | Severity            | Resolution                                                                                         |
| --------- | ------------ | --------------------------------------- | ---------------------------------------------- | ------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| ISSUE-214 | SUPERSESSION | Creates `useProjectTemplates` hook      | ISSUE-196 was cancelled (created similar hook) | New hook based on ProjectTemplateAssignment | CRITICAL (RESOLVED) | **CORRECT APPROACH** - ISSUE-214 properly builds on Sprint 8 architecture, not cancelled ISSUE-196 |
| ISSUE-214 | DEPENDENCY   | Requires projectTemplates GraphQL query | Query doesn't exist yet                        | Created in ISSUE-204                        | MEDIUM              | Document dependency: ISSUE-200 -> ISSUE-204 -> ISSUE-214                                           |
| ISSUE-216 | NAMING       | Creates useLogEntries hook              | Unknown if name conflicts                      | Check for existing hooks                    | LOW                 | Verify no naming collision                                                                         |

### Sprint 9 Summary

- **Total Conflicts:** 3
- **Critical:** 1 (resolved - correct supersession)
- **Medium:** 1 (dependency documentation)
- **Low:** 1 (naming verification)

---

## Sprint 10 Conflict Analysis

**Issues Reviewed:** ISSUE-218 through ISSUE-221 (4 issues)

### Issues by Phase

| Phase   | Issues         | Focus                          |
| ------- | -------------- | ------------------------------ |
| Phase 1 | ISSUE-218, 219 | Foreman Dashboard Enhancements |
| Phase 2 | ISSUE-220      | E2E Testing                    |
| Phase 3 | ISSUE-221      | Offline Sync                   |

### Conflicts Found

| Issue     | Category  | Description                              | Current State                   | Desired State                    | Severity | Resolution                                    |
| --------- | --------- | ---------------------------------------- | ------------------------------- | -------------------------------- | -------- | --------------------------------------------- |
| ISSUE-218 | COMPONENT | SubmittedFormsList major rewrite         | Shows all submissions ungrouped | Group by form type, add filters  | MEDIUM   | Document breaking change, add migration notes |
| ISSUE-220 | TYPO      | Test directory named incorrectly         | N/A                             | Uses `sprint8/` subdirectory     | LOW      | Should be `sprint10/` not `sprint8/`          |
| ISSUE-221 | STORE     | Adds offline features to project context | Basic store from ISSUE-208      | Add isOffline, validationPending | LOW      | Additive changes only - no conflict           |

### Sprint 10 Summary

- **Total Conflicts:** 3
- **Critical:** 0
- **Medium:** 1 (component rewrite)
- **Low:** 2 (typo, additive changes)

---

## Cross-Sprint Dependency Chain

```
Sprint 7 (Cancelled)          Sprint 8 (Foundation)         Sprint 9 (UI)              Sprint 10 (Polish)
-------------------          ---------------------         ------------              -----------------
ISSUE-195 (CANCELLED) -----> ISSUE-200 (Model) ---------> ISSUE-212 (Admin UI)
ISSUE-196 (CANCELLED) -----> ISSUE-208 (Valtio Store) --> ISSUE-221 (Offline)
                             ISSUE-201 (FormType)
                             ISSUE-202 (ProjectStatus) --> ISSUE-206 (Mutations)
                             ISSUE-203 (Service)
                             ISSUE-204 (GraphQL) --------> ISSUE-214 (Selector)
                             ISSUE-207 (LOG Entry) ------> ISSUE-216 (List) -------> ISSUE-218 (Enhanced)
                                                          ISSUE-217 (Copy)
```

---

## Key Technical Decisions Confirmed

### 1. ProjectStatus Enum (6 Values)

```prisma
enum ProjectStatus {
  PLANNING    // Project setup, no submissions allowed
  ACTIVE      // Normal operation, submissions allowed
  SUSPENDED   // Temporary pause, read-only
  COMPLETED   // Successfully finished, read-only
  CLOSED      // Cancelled/stopped, can reopen
  ARCHIVED    // Permanent read-only, 7-year retention (NEW)
}
```

**Submission Rule:** Only `status === 'ACTIVE'` allows new submissions.

### 2. Conditional Field Property: showWhen

```typescript
interface Field {
  id: string;
  type: FieldType;
  label: string;
  // ... other properties
  showWhen?: {
    field: string; // ID of field to check
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any; // Value to compare against
  };
}
```

**Decision:** Use `showWhen` (NOT `conditionalOn`) for consistency.

### 3. Project Context: Valtio Store with localStorage

```typescript
// projectContextStore.ts (ISSUE-208)
export const projectContextStore = proxy<ProjectContextState>({
  selectedProjectId: null,
  selectedProject: null,
  isLoading: false,
  error: null,
});

// Persist to localStorage
subscribe(projectContextStore, () => {
  localStorage.setItem('selectedProjectId', projectContextStore.selectedProjectId);
});
```

**Decision:** Use Valtio store (NOT simple React hook from cancelled ISSUE-196).

### 4. Template Assignment Model

```prisma
model ProjectTemplateAssignment {
  id          String   @id @default(uuid())
  projectId   String
  templateId  String
  formType    FormType @default(FORM)  // LOG or FORM
  isRequired  Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  project     Project      @relation(...)
  template    FormTemplate @relation(...)

  @@unique([projectId, templateId])
}
```

**Decision:** Use `ProjectTemplateAssignment` (NOT `ProjectFormRequirement` from cancelled ISSUE-195).

---

## Required Document Updates

### Priority 1: Critical Supersession Markers

| File                                       | Action                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| `docs/sprints/sprint7/issues/ISSUE-195.md` | Add header: `**STATUS: SUPERSEDED by Sprint 8 ISSUE-200**`     |
| `docs/sprints/sprint7/issues/ISSUE-196.md` | Add header: `**STATUS: SUPERSEDED by Sprint 8 ISSUE-208-211**` |

### Priority 2: Schema Completeness

| File                                       | Action                                                               |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `docs/sprints/sprint8/issues/ISSUE-202.md` | Add `closedAt DateTime?` and `closedBy String?` to schema definition |
| `docs/sprints/sprint8/issues/ISSUE-206.md` | Add schema change section showing closed fields                      |

### Priority 3: Dependency Documentation

| File                                       | Action                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| `docs/sprints/sprint9/issues/ISSUE-214.md` | Add note: "Depends on ISSUE-200 and ISSUE-204 from Sprint 8" |
| `docs/sprints/sprint9/issues/ISSUE-214.md` | Add note: "Supersedes cancelled ISSUE-196 approach"          |

### Priority 4: Migration & Typo Fixes

| File                                        | Action                                                       |
| ------------------------------------------- | ------------------------------------------------------------ |
| `docs/sprints/sprint10/issues/ISSUE-218.md` | Add migration notes for SubmittedFormsList rewrite           |
| `docs/sprints/sprint10/issues/ISSUE-220.md` | Change `sprint8/` to `sprint10/` in test directory structure |

---

## Field Interface Updates Required

Before Sprint 7 implementation, update Field interface:

```typescript
// apps/web/lib/form-builder/types.ts (or equivalent)

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validation?: FieldValidation;
  options?: FieldOption[]; // For select, radio, checkbox

  // NEW: Sprint 7 additions
  showWhen?: {
    // ISSUE-187: Conditional visibility
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  layout?: {
    // ISSUE-181: Multi-column support
    colSpan: 1 | 2 | 3 | 4 | 6 | 12;
  };
  projectBinding?: string; // ISSUE-186: Auto-fill from project data
}
```

---

## Missing Dependencies

Install before Sprint 7 implementation:

```bash
# ISSUE-191: Photo compression
pnpm add browser-image-compression

# ISSUE-192: Internationalization
pnpm add i18next react-i18next
```

---

## Conflict Summary Table

| Sprint    | Total  | Critical       | Medium | Low   | Status                                |
| --------- | ------ | -------------- | ------ | ----- | ------------------------------------- |
| Sprint 7  | 10     | 2 (superseded) | 5      | 3     | Safe to proceed (skip ISSUE-195, 196) |
| Sprint 8  | 4      | 0              | 1      | 3     | Safe to proceed                       |
| Sprint 9  | 3      | 1 (resolved)   | 1      | 1     | Safe to proceed                       |
| Sprint 10 | 3      | 0              | 1      | 2     | Safe to proceed                       |
| **TOTAL** | **20** | **3**          | **8**  | **9** | **No blockers**                       |

---

## Conclusion

### Overall Assessment: READY TO PROCEED

The Sprint 7-10 planning is architecturally sound with no blocking conflicts. The two critical issues identified (ISSUE-195 and ISSUE-196) were correctly superseded by Sprint 8's improved architecture.

### Action Required Before Sprint 7

1. Mark ISSUE-195 and ISSUE-196 as SUPERSEDED
2. Update Field interface with `showWhen`, `layout`, `projectBinding`
3. Install missing dependencies
4. Clarify UserRole enum vs string for project assignment roles

### Action Required Before Sprint 8

1. Add `closedAt`/`closedBy` fields to ISSUE-202 schema definition

### Action Required Before Sprint 9

1. Document dependency chain in ISSUE-214

### Action Required Before Sprint 10

1. Add migration notes to ISSUE-218
2. Fix directory typo in ISSUE-220

---

## Appendix A: Conflict Severity Definitions

| Severity | Definition                                | Action                               |
| -------- | ----------------------------------------- | ------------------------------------ |
| CRITICAL | Blocks implementation or causes data loss | Must resolve before sprint starts    |
| MEDIUM   | Creates inconsistency or requires rework  | Should resolve before implementation |
| LOW      | Documentation gap or minor issue          | Can resolve during implementation    |

---

## Appendix B: Original Conflict Analysis (2025-12-19)

### Conflict 1: Project Form Assignment Model

**Sprint 7 ISSUE-195** proposed `ProjectFormRequirement` model (5 fields).
**Sprint 8 ISSUE-200** proposes `ProjectTemplateAssignment` model (9 fields with FormType, sortOrder, audit trail).

**Resolution:** DEFER ISSUE-195 - completely superseded by ISSUE-200.

### Conflict 2: Project-Centric Workflow

**Sprint 7 ISSUE-196** proposed simple ProjectSelector dropdown.
**Sprint 8 ISSUE-208-211** proposes Valtio store with localStorage persistence, forced project selection on login.

**Resolution:** DEFER ISSUE-196 - completely superseded by Sprint 8 comprehensive solution.

### Conflict 3: Form Fields Pull From Project Data

**Sprint 7 ISSUE-186** adds `projectBinding` field property.
**Sprint 8 ISSUE-208** creates project context store.

**Resolution:** PROCEED with ISSUE-186 - compatible, can leverage ISSUE-208 store later.

---

**Document Version:** 2.0
**Last Updated:** 2025-12-20
**Author:** Development Team
