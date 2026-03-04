# Sprint 7-10 Conflict Tracker (Live)

**Created:** 2025-12-20 10:15:37 -05:00
**Purpose:** Maintain a running, single-source tracker of conflicts, breaking changes, ambiguities, contradictions, and resolution decisions while completing Phase 3 (Sprint 7-10 conflict detection).
**Status:** ACTIVE (live working document)
**Related:** `docs/sprints/SPRINT_179_221_CONFLICT_ANALYSIS.md`

---

## How to Use This Document

- **Update cadence:** Add entries as conflicts are discovered or resolved.
- **Decision logging:** Every time we choose a resolution strategy, record it in the Decision Log with timestamp.
- **Sprint gating:** Each sprint section ends with an **Approval Gate**. Mark the gate only after Developer approval.

---

## Current Progress Snapshot

**Phase 1 (Current State Ingestion):** COMPLETE  
**Phase 2 (Future State Ingestion):** COMPLETE (ISSUE-179 through ISSUE-221)  
**Phase 3 (Conflict Detection):** COMPLETE (Sprint 7–10)

**Last Updated:** 2025-12-20 10:49:08 -05:00

---

## Critical Path Dependencies (From Sprint 8-10)

These are hard ordering constraints for implementation planning:

1. **ISSUE-200** (ProjectTemplateAssignment model + `FormType` enum) must precede:
   - ISSUE-203, ISSUE-204, ISSUE-212, ISSUE-214, ISSUE-207
2. **ISSUE-201** (FormSubmission `formType`, `entryNumber` + backfill) must precede:
   - ISSUE-207, ISSUE-214, ISSUE-216, ISSUE-218
3. **ISSUE-202** (ProjectStatus add `ARCHIVED`) must precede:
   - ISSUE-206, ISSUE-208, ISSUE-221

---

## Decision Log

| Timestamp                  | Decision                                                      | Rationale                                                                                          | Impacted Areas                                         |
| -------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 2025-12-20 10:49:08 -05:00 | Developer approved proceeding past Sprint 7–10 conflict gates | Approval recorded in chat; allows moving from analysis into implementation sequencing              | Sprint 7–10 planning, delivery sequencing              |
| 2025-12-20 10:49:08 -05:00 | Proposed implementation sequence documented (draft)           | Makes dependency ordering explicit and prevents starting UI work before schema/API contracts exist | Database, backend GraphQL, web UI, offline/export, E2E |

---

## Sprint 7 (ISSUE-179 through ISSUE-199) — Conflicts

### Conflicts Table

| Category             | Conflict                                                              | Why it conflicts with current state                                                                                               | Proposed resolution                                                                                                  | Files likely impacted                                                                                                                        |
| -------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| BREAKING CHANGES     | Conditional schema key `showWhen` vs current `conditional.showIf`     | Renderer currently evaluates `field.conditional.showIf`; no `showWhen` support.                                                   | Add a schema normalization layer that supports both formats and standardize on one over time.                        | `apps/web/components/Forms/FormRenderer/types.ts`, `apps/web/components/Forms/FormRenderer/useConditionalLogic.ts`, template seed JSON files |
| TYPE MISMATCHES      | Form Builder schema vs Form Renderer schema divergence                | Builder uses `FieldDefinition` from `@brave-forms/types`; renderer uses local `FormField` union and different conditional format. | Decide canonical schema contract (shared types vs adapter). Add adapter if unification cannot happen immediately.    | `apps/web/components/Forms/FormBuilder/*`, `apps/web/components/Forms/FormRenderer/*`, `packages/types/*`, backend form schema validation    |
| BREAKING CHANGES     | Multi-column layout support required                                  | Renderer does not respect field width/layout in schema; issues propose `layout.colSpan`.                                          | Standardize on a single layout property and implement in both builder + renderer with backwards-compatible defaults. | Builder canvas + field properties editor; renderer layout loop                                                                               |
| BREAKING CHANGES     | Drag/drop from library to canvas (field creation)                     | Current builder supports drag sorting inside canvas, not cross-source drop creation.                                              | Extend existing DnD to support palette draggables and canvas droppable add behavior.                                 | `apps/web/components/Forms/FormBuilder/FormBuilder.tsx`, `FieldPalette`, `FormCanvas.tsx`                                                    |
| TYPE MISMATCHES      | Field type naming inconsistency across templates/issues               | Issues reference `email`, `tel`, `datetime`, `checkbox-group` etc; current renderer `FieldType` does not.                         | Define canonical field types and a mapping layer for legacy names; validate templates on import/save.                | Shared field type definitions; template seed JSON; renderer switch/cases                                                                     |
| MISSING DEPENDENCIES | PDF print preview generation proposed (`jsPDF`) but no current module | No existing `apps/web/lib/pdf/*` module found; data contract assumptions differ.                                                  | Choose print approach (client vs server) and implement against actual schema objects.                                | New `apps/web/lib/pdf/*` + print preview UI                                                                                                  |
| MISSING DEPENDENCIES | Language setting persistence + i18n framework                         | No `i18next` / `react-i18next` present.                                                                                           | Decide translation scope (UI chrome vs templates) and add i18n infra with persistence/offline behavior.              | New `apps/web/lib/i18n/*`, settings pages, user-preferences                                                                                  |
| CONTRADICTIONS       | ISSUE-195 and ISSUE-196 are superseded by Sprint 8                    | Sprint 7 explicitly says to not implement due to conflicting Sprint 8 architecture.                                               | Treat as an explicit constraint: do not implement; defer to Sprint 8 issues.                                         | Planning only (avoid code work on superseded items)                                                                                          |

### Sprint 7 Notes / Observations

- Current `TemplateSelector` shows organization-wide templates and filters by category; Sprint 9 will require project-context filtering and LOG/FORM grouping.
- The renderer conditional system currently supports a limited operator set and a single `showIf` clause; Sprint 7 issues introduce a different field key (`showWhen`) that must be reconciled.

### Sprint 7 Approval Gate

- **Status:** APPROVED (Developer go-ahead recorded in chat)

---

## Sprint 8 (ISSUE-200 through ISSUE-211) — Conflicts (Draft Placeholder)

### Sprint 8 Conflicts Table

| Category             | Conflict                                                                                                                 | Why it conflicts with current state                                                                                                                          | Proposed resolution                                                                                                                   | Files likely impacted                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| BREAKING CHANGES     | Missing `FormType` enum (LOG/FORM)                                                                                       | Current Prisma schema has no `FormType` enum. Sprint 8 requires it for assignments and submissions.                                                          | Add `FormType` enum to `schema.prisma`, regenerate Prisma client, create migration.                                                   | `packages/database/schema.prisma`, `packages/database/migrations/*`                                                                |
| BREAKING CHANGES     | Missing `ProjectTemplateAssignment` model                                                                                | Current schema has no assignment join table; Sprint 8 requires per-project template visibility and ordering.                                                 | Add `ProjectTemplateAssignment` model + relations on `Project` and `FormTemplate`; generate migration.                                | `packages/database/schema.prisma`, `packages/database/migrations/*`                                                                |
| TYPE MISMATCHES      | `FormSubmission` missing `formType` + `entryNumber`                                                                      | Current `FormSubmission` model has no `formType`/`entryNumber`. Sprint 8 requires these for LOG semantics and numbering.                                     | Add nullable fields + backfill existing to `FORM` in migration.                                                                       | `packages/database/schema.prisma`, migration SQL, backend submission DTOs/types                                                    |
| BREAKING CHANGES     | `ProjectStatus` missing `ARCHIVED`                                                                                       | Current `ProjectStatus` enum has 5 values (no `ARCHIVED`). Sprint 8 requires 6 and enforces read-only for non-ACTIVE.                                        | Add `ARCHIVED` enum value; update project status logic; update UI badges.                                                             | `packages/database/schema.prisma`, backend projects module, web project UI                                                         |
| SCHEMA CONFLICTS     | Missing archive metadata (`archivedAt`, `archivedBy`)                                                                    | Current `Project` model has no archive metadata fields. Sprint 8 requires retention tracking.                                                                | Add fields in `Project` and enforce in lifecycle mutations.                                                                           | `packages/database/schema.prisma`, `apps/backend/src/modules/projects/*`                                                           |
| CONTRADICTIONS       | Sprint 8 lifecycle code sample uses `closedAt`/`closedBy`, but schema changes only mention `archivedAt`/`archivedBy`     | If implemented as written, backend will attempt to write columns that do not exist.                                                                          | Decide whether to add `closedAt`/`closedBy` as well, or adjust implementation to only use status + archived fields.                   | `packages/database/schema.prisma`, `apps/backend/src/modules/projects/projects.service.ts`                                         |
| MISSING DEPENDENCIES | New backend module `project-templates` does not exist                                                                    | Current backend has no `ProjectTemplatesModule/Service/Resolver`.                                                                                            | Implement new module following existing module patterns (guards, orgId scoping, validation).                                          | `apps/backend/src/modules/project-templates/*`, `apps/backend/src/app.module.ts`                                                   |
| MISSING DEPENDENCIES | GraphQL queries/mutations do not exist (`projectTemplates`, `templatesWithAssignments`, assignment mutations)            | Current `schema.gql` and resolvers do not expose any assignment operations.                                                                                  | Add resolver + types, ensure schema generation exports enums correctly (avoid `String!` for enum fields).                             | `apps/backend/src/modules/project-templates/*`, schema generation outputs                                                          |
| BREAKING CHANGES     | Soft delete required for templates/submissions (`deletedAt`, `deletedBy`)                                                | Current Prisma models lack deleted fields; existing queries do not filter deleted. Sprint 8 requires admin delete and forbids deleting APPROVED submissions. | Add deleted fields + update all queries to `deletedAt: null`, implement delete mutations with explicit compliance guard for APPROVED. | `packages/database/schema.prisma`, `apps/backend/src/modules/forms/*`, `apps/backend/src/modules/submissions/*`, web API clients   |
| MISSING DEPENDENCIES | Audit log entries required but no audit model/pattern exists                                                             | Sprint 8 requires audit logs on deletes; current schema has no audit trail table/model.                                                                      | Define an `AuditLog` model (orgId-scoped) and a small service to append entries; decide retention strategy.                           | `packages/database/schema.prisma`, new `apps/backend/src/modules/audit/*` (or common service)                                      |
| AMBIGUITIES          | Role naming mismatch: Sprint 8 says `PROJECT_MANAGER`, current system uses `MANAGER`                                     | Backend guards/decorators and Clerk strategy validate `MANAGER`, not `PROJECT_MANAGER`.                                                                      | Keep canonical role `MANAGER` in code and treat `PROJECT_MANAGER` as documentation alias, or add alias mapping in auth layer.         | `apps/backend/src/common/decorators/roles.decorator.ts`, `apps/backend/src/modules/auth/strategies/clerk.strategy.ts`, sprint docs |
| CONTRADICTIONS       | ProjectContext store type restricts status to ACTIVE, CLOSED, ARCHIVED, but enum includes PLANNING, SUSPENDED, COMPLETED | UI may mis-handle valid statuses and incorrectly gate.                                                                                                       | Use `ProjectStatus` union everywhere (all 6 values). Enforce gating rule `status==='ACTIVE'` at a single boundary.                    | New `apps/web/lib/stores/project-context-store.ts`, project list, selection modal                                                  |
| AMBIGUITIES          | Field name collision risk: existing `Photo.formType` (string) vs new `FormSubmission.formType` (enum)                    | Today `Photo.formType` is used as a template name filter; Sprint 8 introduces `formType` as LOG/FORM. This can confuse API consumers and query filters.      | Rename `Photo.formType` to `templateName` (or similar) in Prisma + code, or ensure all usage is fully qualified and documented.       | `packages/database/schema.prisma`, photo queries, API types                                                                        |

### Sprint 8 Approval Gate

- **Status:** APPROVED (Developer go-ahead recorded in chat)

---

## Sprint 9 (ISSUE-212 through ISSUE-217) — Conflicts (Draft Placeholder)

### Sprint 9 Conflicts Table

| Category             | Conflict                                                                                                 | Why it conflicts with current state                                                                                                                                                                                                             | Proposed resolution                                                                                                                                                                     | Files likely impacted                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MISSING DEPENDENCIES | Admin assignment UI (`ProjectTemplateManager`) does not exist                                            | Sprint 9 expects a new DnD-based admin manager plus assignment hooks, but current code has no project-template assignment surface.                                                                                                              | Implement after Sprint 8 backend exists; follow existing Mantine patterns and add optimistic updates with rollback.                                                                     | `apps/web/components/Projects/ProjectTemplateManager.tsx` (new), `apps/web/hooks/useProjectTemplates.ts` (new)                                                 |
| MISSING DEPENDENCIES | Project settings route tree does not exist                                                               | Sprint 9 requires `/dashboard/projects/[id]/settings/templates` and a settings layout with tabs; current `projects/[id]/page.tsx` is a single client page with tabs, no `settings/` segment.                                                    | Decide route strategy: add `settings/` subtree, or keep single page tabs and expose manager via new tab. Align with App Router conventions.                                             | `apps/web/app/dashboard/projects/[id]/settings/*` (new) or `apps/web/app/dashboard/projects/[id]/page.tsx`                                                     |
| BREAKING CHANGES     | `TemplateSelector` must be rewritten (project-filtered, grouped LOG/FORM)                                | Current `TemplateSelector` fetches org-wide templates via `useFormTemplates`, filters by category, and takes `projectId` prop. Sprint 9 requires using project context + `projectTemplates` assignments and entry counts.                       | Replace `TemplateSelector(projectId)` with project-context driven selector and keep legacy category filters only if explicitly required.                                                | `apps/web/components/Forms/TemplateSelector.tsx`, `apps/web/components/Projects/ProjectFormsTab.tsx`                                                           |
| MISSING DEPENDENCIES | New hooks are missing (`useProjectTemplates`, `useLogEntryCounts`, `useLogEntries`, `useLatestLogEntry`) | No project-template GraphQL queries exist yet and none of the hooks/files exist.                                                                                                                                                                | Implement hooks after Sprint 8 schema/API exists; ensure query keys include orgId/projectId for cache isolation.                                                                        | `apps/web/hooks/*` (new), `apps/web/lib/api/*`                                                                                                                 |
| TYPE MISMATCHES      | LOG entry list requires `entryNumber` + `createdBy {firstName,lastName}`                                 | Current backend `FormSubmission` exposes `submittedBy: String!` and no `entryNumber`/`createdBy` object; Sprint 9 `LogEntryList` assumes richer identity and numbering.                                                                         | Add `entryNumber` and `formType` to schema (Sprint 8), and decide whether to expose submitter as `User` object (requires user profile data) or keep `submittedBy` string and adjust UI. | `packages/database/schema.prisma`, `apps/backend/src/modules/submissions/*`, `apps/backend/src/schema.gql`, `apps/web/components/Forms/LogEntryList.tsx` (new) |
| MISSING DEPENDENCIES | `logEntries` query (pagination) not present                                                              | Sprint 9 expects `logEntries(projectId, templateId, offset, limit)` returning `{items, hasMore}`; current schema has only general submissions queries.                                                                                          | Add a dedicated resolver for log entries (filtered by `formType='LOG'` and `deletedAt: null`) with pagination and org scoping.                                                          | `apps/backend/src/modules/submissions/submissions.resolver.ts`, `apps/backend/src/modules/submissions/services/*`, web hooks                                   |
| CONTRADICTIONS       | “Copy from yesterday” UX conflicts with existing copy behavior                                           | Current app already has `useCopyYesterdaysLog()` which clones yesterday’s submission by `templateId` and redirects. Sprint 9 wants a modal that uses `latestLogEntry` + `createLogEntry(copyFromPrevious)` per project+template LOG assignment. | Deprecate/repurpose existing copy flow to call the new `createLogEntry` mutation; keep backward compatibility behind a feature flag if needed.                                          | `apps/web/hooks/useCopyYesterdaysLog.ts`, `apps/web/lib/api/submissions.ts`, new modal/hook files                                                              |
| AMBIGUITIES          | Sprint 9 role checks use Clerk slugs (`org:admin`, `org:project_manager`) vs current uppercase roles     | Current `RoleGuard` expects `ADMIN/MANAGER` and uppercases `orgRole`. Sprint 9 sample uses server-side `auth()` role slugs, which will not match current checks.                                                                                | Standardize on a single role representation in the web app (prefer uppercase canonical roles) and map Clerk slugs once in `useAppAuth`.                                                 | `apps/web/app/providers.tsx`, `apps/web/components/Auth/RoleGuard.tsx`, any new server routes                                                                  |

### Sprint 9 Approval Gate

- **Status:** APPROVED (Developer go-ahead recorded in chat)

---

## Sprint 10 (ISSUE-218 through ISSUE-221) — Conflicts (Draft Placeholder)

### Sprint 10 Conflicts Table

| Category             | Conflict                                                                                   | Why it conflicts with current state                                                                                                                                         | Proposed resolution                                                                                                                                                                 | Files likely impacted                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| BREAKING CHANGES     | Foreman “group by LOG vs FORM” requires `formType` and LOG semantics                       | Current data model and API do not expose `formType`/`entryNumber` for submissions; current `SubmittedFormsList` is flat and filters by template/status only.                | Implement Sprint 8 `formType/entryNumber` + add new list API that returns enough metadata to group and render LOG history.                                                          | `packages/database/schema.prisma`, `apps/backend/src/modules/submissions/*`, `apps/web/components/Forms/SubmittedFormsList.tsx` |
| TYPE MISMATCHES      | Foreman list UI assumes `createdBy.firstName/lastName` and `createdAt`                     | Current frontend transforms rely on `submittedBy` string and notes `createdAt/updatedAt` and `projectId` are not exposed in GraphQL (tracked as older issues).              | Decide canonical identity contract: either expose `createdBy: User` in GraphQL or adjust Sprint 10 UI to use `submittedBy` string. Expose `createdAt` and `projectId` consistently. | `apps/backend/src/schema.gql`, submissions resolvers, `apps/web/hooks/useFormSubmissions.ts`                                    |
| MISSING DEPENDENCIES | `useProjectSubmissions` with server-side project filtering does not exist                  | Current hook fetches all org submissions and has TODO noting projectId not filterable in backend; Sprint 10 filters by date/worker/status require backend query parameters. | Add backend query to fetch submissions by projectId with filters (date range, status, submitter) and paging. Update web hook to call it.                                            | `apps/backend/src/modules/submissions/*`, `apps/web/hooks/useProjectSubmissions.ts` (new) or extend `useFormSubmissions.ts`     |
| MISSING DEPENDENCIES | Bulk selection + bulk actions (print/export) not implemented                               | Current `SubmittedFormsList` has no selection state, no bulk action UI, no export services.                                                                                 | Add selection + action bar and implement print/export services once data contract is finalized.                                                                                     | `apps/web/components/Forms/SubmittedFormsList.tsx`, `apps/web/lib/export/*` (new)                                               |
| MISSING DEPENDENCIES | Print/export service modules absent                                                        | Sprint 10 requires `apps/web/lib/export/print-service.ts` and `csv-service.ts`; none exist today.                                                                           | Implement export modules with unit tests; decide whether print is HTML+window.print vs server-side PDF for large batches.                                                           | `apps/web/lib/export/*` (new), `apps/web/components/Forms/*`                                                                    |
| AMBIGUITIES          | Print/export needs photos + signatures in a stable format                                  | Current submission data uses JSON and photos are stored separately (S3/bytes); print/export needs either URLs or base64 and clear signature representation.                 | Define a “submission export DTO” that includes resolved photo URLs and signature image data (or placeholders) and is safe for offline use.                                          | Backend submissions query/resolver, web export services                                                                         |
| CONTRADICTIONS       | Sprint 10 expects E2E tests in `apps/web/e2e/sprint8/*`, but repo uses `apps/web/tests/**` | Current Playwright config uses `testDir: './tests'` and there is already `tests/e2e/*`.                                                                                     | Either align new tests to existing `apps/web/tests/e2e/` structure or update Playwright config and migrate existing tests.                                                          | `apps/web/playwright.config.ts`, `apps/web/tests/e2e/*`, new tests                                                              |
| MISSING DEPENDENCIES | Offline project context store + validation hook do not exist                               | Sprint 10 requires `project-context-store.ts` + `useProjectContextValidation.ts` + forced selection gating; none exist in current repo.                                     | Implement Sprint 8 project context first, then extend with Sprint 10 offline-aware flags and reconnect validation.                                                                  | `apps/web/lib/stores/project-context-store.ts` (new), `apps/web/hooks/useProjectContextValidation.ts` (new), AppShell layout    |
| MISSING DEPENDENCIES | Template assignment caching in IndexedDB not implemented                                   | Sprint 10 requires `template-cache.ts` using `idb`; current IndexedDB usage exists only in QR portal caching.                                                               | Reuse `idb` dependency and follow QR portal IndexedDB patterns; add orgId scoping and cache invalidation rules.                                                                     | `apps/web/lib/cache/template-cache.ts` (new), template hooks, project context validation                                        |
| MISSING DEPENDENCIES | Header offline indicator component not implemented                                         | Current app has `OfflineBanner` (top-of-page) but Sprint 10 requires header indicator tied to project context offline state.                                                | Decide whether to reuse `OfflineBanner` or add `OfflineIndicator` in header; ensure consistent messaging.                                                                           | `apps/web/components/Layout/OfflineIndicator.tsx` (new), layout header component                                                |

### Sprint 10 Approval Gate

- **Status:** APPROVED (Developer go-ahead recorded in chat)

---

## Proposed Implementation Sequence (Draft, Dependency-Ordered)

This is the recommended order to implement Sprints 8–10 without rework. Sprint 7 items are primarily UI/schema unification prerequisites.

### Step 0: Resolve Sprint 7 contract deltas (foundation)

- **Schema normalization (S7)**: Decide how to support both `conditional.showIf` and `showWhen` (and unify field type naming).
- **Layout contract (S7)**: Decide the canonical multi-column layout key and implement builder+renderer compatibility.

**Exit criteria:** Templates can be parsed/rendered with either legacy or new conditional keys; layout defaults are backwards compatible.

### Step 1: Sprint 8 database contracts (must be first)

- **Add Prisma schema changes**:
  - `FormType` enum (LOG, FORM)
  - `ProjectTemplateAssignment` model + relations
  - `FormSubmission.formType`, `FormSubmission.entryNumber` + backfill existing to `FORM`
  - `ProjectStatus.ARCHIVED` + `Project.archivedAt/archivedBy`
  - Soft-delete fields `deletedAt/deletedBy` (templates/submissions)
  - Decide on `closedAt/closedBy` (add vs remove from design)
  - Decide rename of `Photo.formType` (to avoid collision with `FormSubmission.formType`)

**Exit criteria:** Migrations run cleanly; Prisma client regenerates; legacy data is preserved and queries still work.

### Step 2: Sprint 8 backend GraphQL API (enables all Sprint 9/10 UI)

- **Project template assignment module**:
  - Queries: `projectTemplates`, `templatesWithAssignments`
  - Mutations: assign/unassign/update/bulk assign/reorder
- **LOG entry APIs**:
  - `createLogEntry(projectId, templateId, copyFromPrevious)`
  - `latestLogEntry(projectId, templateId)`
  - Add `logEntries(projectId, templateId, offset, limit)` pagination contract (needed by Sprint 9 list + Sprint 10 foreman grouping)
- **Project lifecycle**:
  - close/archive/reopen with explicit status transition validation and compliance constraints
- **Soft delete + compliance guard**:
  - Admin-only delete, forbid delete of APPROVED submissions
- **Role mapping decision**:
  - Standardize `MANAGER` vs `PROJECT_MANAGER` representation (backend + web)
- **Audit logging**:
  - Define whether an `AuditLog` model/service is required now vs deferred

**Exit criteria:** `apps/backend/src/schema.gql` exposes the new types/enums/fields; role checks and orgId scoping are enforced.

### Step 3: Sprint 8 web project context gating (required before project-centric UX)

- **Valtio project context store** + validation hook
- **Project selection modal** + header indicator integration
- **App gating**: block access until project chosen

**Exit criteria:** project selection persists across navigation and refresh; invalid context forces selection.

### Step 4: Sprint 9 admin UI + end-user template UX

- **Admin: ProjectTemplateManager** and settings surface:
  - Decide route strategy (`/settings/templates` subtree vs new tab in existing project detail page)
  - Implement assignment UI with optimistic updates + rollback
- **End user: TemplateSelector rewrite**:
  - Use project context + assignments
  - Group LOG vs FORM
  - Entry counts for LOG templates
- **LOG UX components**:
  - `FormTypeCard`
  - `LogEntryList` (pagination)
  - Copy-from-yesterday modal + hook (`useLatestLogEntry`) integrated with `createLogEntry`
  - Deprecate/repurpose current `useCopyYesterdaysLog` flow to use LOG semantics

**Exit criteria:** A field worker can select a project, see only assigned templates, and create LOG/FORM submissions via the new workflow.

### Step 5: Sprint 10 foreman review + export + offline polish

- **SubmittedFormsList foreman enhancements**:
  - Group by LOG vs FORM
  - Expandable LOG history
  - Date/worker/status filters
  - Bulk selection
- **Bulk print/export**:
  - Implement `apps/web/lib/export/print-service.ts` and `csv-service.ts`
  - Decide export DTO (photos/signatures resolution strategy)
- **Offline sync for project context**:
  - Add offline awareness + reconnect validation
  - Cache template assignments in IndexedDB (reuse QR portal IndexedDB patterns)
  - Add header offline indicator (decide reuse vs new indicator)
- **E2E tests**:
  - Align with existing Playwright layout (`apps/web/tests/e2e/*`) or migrate config; pick one.

**Exit criteria:** Foreman can filter/group/select and export/print reliably; offline project context behaves correctly; E2E suite covers the new workflow.

### Critical Decision Points (should be decided early)

1. **Role naming**: canonical web/backend role representation (`MANAGER` vs `PROJECT_MANAGER`) and mapping from Clerk.
2. **Project lifecycle fields**: whether `closedAt/closedBy` exists (schema vs sample code mismatch).
3. **`Photo.formType` rename**: avoid ambiguity with new `FormSubmission.formType`.
4. **Export data contract**: how photos/signatures are represented for print/CSV (URLs vs embedded).
5. **Route strategy**: project settings subtree vs extending existing project detail page tabs.

---

## Open Questions (Running)

1. **Canonical schema contract:** Should builder + renderer share the same field schema type (preferred), or do we maintain adapters?
2. **Conditional logic standard:** Standardize on `showWhen`, or keep `conditional` as the canonical internal representation?
3. **Template assignment migration:** For existing projects, do we auto-assign all templates to all projects as FORM, or require admin assignment before templates appear?
4. **Project selection gating:** Should users be forced to select a project even for browsing templates, or only when filling/submitting?

---

## Ambiguities Requiring Clarification

_(Merged from SPRINT_179_221_CONFLICT_ANALYSIS.md)_

### Ambiguity 1: LOG Entry Number Assignment Scope

**Question:** Is `entryNumber` scoped per:

- Project + Template? (e.g., Daily Log for Project A: #1, #2...)
- Template only? (e.g., Daily Log: #1, #2... across all projects)
- Global? (all LOG entries: #1, #2...)

**ISSUE-207 Code Suggests:**

```typescript
const lastEntry = await this.prisma.formSubmission.findFirst({
  where: { projectId, templateId, formType: 'LOG' },
  orderBy: { entryNumber: 'desc' },
});
```

**Implies:** Per project + template (correct approach)

**Resolution:** Confirm: entryNumber is per (projectId + templateId). Consider adding unique constraint: `@@unique([projectId, templateId, entryNumber])`.

---

### Ambiguity 2: Template Assignment Default Behavior

**Question:** What happens to existing projects when Sprint 8 architecture is deployed?

- Do all existing templates get auto-assigned to all existing projects?
- Or do admins need to manually assign templates?

**Resolution Required:**

- Create migration script to assign all templates to all projects as FORM type
- OR: Require admin assignment before users can access templates
- Document decision in ISSUE-200 or Sprint 8 Master Plan

---

### Ambiguity 3: Copy from Yesterday Field Exclusion List

**ISSUE-207 Copy Logic:**

```typescript
const fieldsToReset = ['signature', 'date', 'time', 'timestamp', 'photos'];
```

**ISSUE-217 Copy Modal:**

- Will copy: Site conditions, Equipment, Crew, Weather, BMP status, Inspector notes
- Will NOT copy: Signatures, Dates/times, Photos, Entry number

**Resolution Required:** Standardize exclusion list. Consider template-specific exclusion rules.

---

### Ambiguity 4: FormStatus vs Submission Status Usage

**Current Schema:**

```prisma
enum FormStatus {
  DRAFT
  IN_PROGRESS
  SUBMITTED
  REVIEWED
  APPROVED
  REJECTED
}
```

**ISSUE-218 (Foreman View):** References DRAFT, SUBMITTED, APPROVED, REJECTED only.

**Resolution Required:** Clarify if IN_PROGRESS and REVIEWED are actively used, or should be removed from enum.

---

## Risk Assessment

_(Merged from SPRINT_179_221_CONFLICT_ANALYSIS.md)_

| Risk                                     | Severity | Mitigation                                                |
| ---------------------------------------- | -------- | --------------------------------------------------------- |
| FormSubmission migration fails           | HIGH     | Test migration on staging, backup database                |
| Template filtering breaks user workflows | HIGH     | Auto-assign all templates during migration                |
| Project context blocks access            | MEDIUM   | Clear messaging, admin can assign templates quickly       |
| Conditional logic migration breaks forms | MEDIUM   | Test all templates, provide migration script              |
| EntryNumber conflicts                    | LOW      | Unique constraint on (projectId, templateId, entryNumber) |

---

## Missing Dependencies

_(Merged from SPRINT_7_10_CONFLICT_ANALYSIS.md)_

Install before Sprint 7 implementation:

```bash
# ISSUE-191: Photo compression
pnpm add browser-image-compression

# ISSUE-192: Internationalization
pnpm add i18next react-i18next
```

---

## Field Interface Updates Required

_(Merged from SPRINT_7_10_CONFLICT_ANALYSIS.md)_

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

## Change Log

| Timestamp                  | Change                                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-12-20 10:15:37 -05:00 | Created live tracker document and seeded Sprint 7 conflicts + placeholders for Sprint 8–10.                                                                          |
| 2025-12-20 10:49:08 -05:00 | Added Sprint 9 and Sprint 10 conflict tables, marked Sprint 7–10 approval gates as approved per Developer go-ahead, and documented proposed implementation sequence. |
| 2025-12-20 (session 2)     | Merged unique content from SPRINT_179_221 and SPRINT_7_10 conflict analysis documents (ambiguities, risk assessment, dependencies, field interface updates).         |
