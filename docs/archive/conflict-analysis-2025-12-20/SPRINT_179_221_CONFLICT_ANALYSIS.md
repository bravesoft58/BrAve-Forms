# Sprint 179-221 Comprehensive Conflict Analysis

**Created:** 2025-12-19
**Purpose:** Identify conflicts, breaking changes, ambiguities, and contradictions between Sprint 7 (ISSUE-179+) and Sprints 8-10
**Status:** ACTIVE - Review before implementing any Sprint 7 Phase 6+ or Sprint 8-10 work

---

## Executive Summary

After comprehensive review of issues 179 through Sprint 10 (ISSUE-221), I've identified:

- **3 CRITICAL CONFLICTS** requiring immediate resolution
- **5 BREAKING CHANGES** that need migration planning
- **8 AMBIGUITIES** requiring clarification
- **2 CONTRADICTIONS** between issues

**Recommendation:** Address critical conflicts before proceeding with Sprint 8-10 implementation.

---

## CRITICAL CONFLICTS

### Conflict 1: Database Schema - FormSubmission Missing Fields

**Issue:** Sprint 8 ISSUE-201 requires `formType` and `entryNumber` fields on `FormSubmission`, but current schema doesn't have them.

**Current Schema (schema.prisma:230-259):**

```prisma
model FormSubmission {
  id             String       @id @default(uuid())
  orgId          String       @map("org_id")
  templateId     String       @map("template_id")
  projectId      String?      @map("project_id")
  submittedBy    String       @map("submitted_by")
  status         FormStatus   @default(DRAFT)
  data           Json         @map("data")
  // NO formType field
  // NO entryNumber field
}
```

**Sprint 8 Requirement (ISSUE-201):**

```prisma
model FormSubmission {
  // ... existing fields ...
  formType    FormType? @map("form_type")      // LOG or FORM
  entryNumber Int?      @map("entry_number")   // For LOGs: 1, 2, 3...
}
```

**Impact:**

- ISSUE-207 (Create LOG Entry) cannot work without `formType` and `entryNumber`
- ISSUE-214 (TemplateSelector rewrite) depends on formType distinction
- ISSUE-216 (LogEntryList) requires entryNumber for display
- ISSUE-218 (Foreman Enhancements) groups by formType

**Resolution:**

- MUST implement ISSUE-201 BEFORE ISSUE-207, ISSUE-214, ISSUE-216, ISSUE-218
- Migration must backfill existing submissions as `FORM` type
- Add database migration with data backfill

**Breaking Change:** Yes - requires migration

---

### Conflict 2: Database Schema - ProjectTemplateAssignment Model Missing

**Issue:** Sprint 8 ISSUE-200 creates `ProjectTemplateAssignment` model, but it doesn't exist in current schema.

**Current Schema:** No `ProjectTemplateAssignment` model exists

**Sprint 8 Requirement (ISSUE-200):**

```prisma
enum FormType {
  LOG
  FORM
}

model ProjectTemplateAssignment {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  templateId  String   @map("template_id")
  formType    FormType
  displayName String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  assignedBy  String
  assignedAt  DateTime @default(now())
  // Relations to Project and FormTemplate
}
```

**Impact:**

- ISSUE-203 (ProjectTemplateService) cannot work without model
- ISSUE-204 (GraphQL Resolvers) depends on model
- ISSUE-212 (ProjectTemplateManager UI) requires assignments
- ISSUE-214 (TemplateSelector rewrite) filters by assignments

**Resolution:**

- MUST implement ISSUE-200 BEFORE ISSUE-203, ISSUE-204, ISSUE-212, ISSUE-214
- This is the foundation for entire Sprint 8-10 architecture

**Breaking Change:** No - new model, no existing data

---

### Conflict 3: ProjectStatus Enum Missing ARCHIVED

**Issue:** Sprint 8 ISSUE-202 says ARCHIVED status needs to be added, but current schema shows ProjectStatus enum without ARCHIVED.

**Current Schema (schema.prisma:167-173):**

```prisma
enum ProjectStatus {
  PLANNING
  ACTIVE
  SUSPENDED
  COMPLETED
  CLOSED
  // NO ARCHIVED
}
```

**Sprint 8 Requirement (ISSUE-202):**

```prisma
enum ProjectStatus {
  PLANNING
  ACTIVE
  SUSPENDED
  COMPLETED
  CLOSED
  ARCHIVED    // NEW - needs to be added
}
```

**Impact:**

- ISSUE-206 (Project Close/Archive Mutations) requires ARCHIVED status
- ISSUE-208 (Project Context Store) references ARCHIVED in status checks
- ISSUE-221 (Offline Sync) handles ARCHIVED project scenarios

**Resolution:**

- Add ARCHIVED to enum in ISSUE-202
- No migration needed (enum addition)
- Update all ProjectStatus type references

**Breaking Change:** No - enum addition is backward compatible

---

## BREAKING CHANGES

### Breaking Change 1: FormSubmission.formType Required for LOG Workflows

**Issue:** Sprint 8-10 architecture assumes `formType` field exists, but current code doesn't use it.

**Affected Code:**

- `apps/backend/src/modules/submissions/submissions.resolver.ts` - Queries assume formType
- `apps/web/components/Forms/TemplateSelector.tsx` - Filters by formType
- `apps/web/components/Forms/SubmittedFormsList.tsx` - Groups by formType

**Migration Required:**

- Backfill all existing submissions: `UPDATE form_submissions SET form_type = 'FORM' WHERE form_type IS NULL;`
- Update all queries to handle nullable formType during transition
- Add validation: LOG entries MUST have formType = 'LOG'

**Timeline:** Must complete before ISSUE-207 (Create LOG Entry)

---

### Breaking Change 2: Template Assignment Architecture Change

**Issue:** Current system shows all templates to all users. Sprint 8-10 requires project-based template filtering.

**Current Behavior:**

- Users see all templates in organization
- No project-template relationship

**New Behavior (Sprint 8-10):**

- Users only see templates assigned to their current project
- Requires ProjectTemplateAssignment records
- Empty state if no templates assigned

**Migration Required:**

- Create ProjectTemplateAssignment records for existing projects
- Default assignment: Assign all existing templates to all existing projects as FORM type
- OR: Require admin to assign templates before users can see them

**User Impact:** HIGH - Users will see fewer templates initially

**Timeline:** Must complete before ISSUE-214 (TemplateSelector rewrite)

---

### Breaking Change 3: Project Context Required for Form Access

**Issue:** Sprint 8 ISSUE-208-211 requires project selection before accessing forms.

**Current Behavior:**

- Users can access forms without selecting project
- Project selection optional

**New Behavior (Sprint 8-10):**

- Project selection modal forced on login
- Cannot access forms without project context
- Project context persists across navigation

**Migration Required:**

- None (UI/UX change only)
- Existing submissions retain projectId

**User Impact:** MEDIUM - Workflow change, but improves UX

**Timeline:** Must complete before ISSUE-214 (TemplateSelector rewrite)

---

### Breaking Change 4: FormType Enum Required Before LOG Features

**Issue:** FormType enum must exist before any LOG-specific features.

**Dependencies:**

- ISSUE-200 creates FormType enum
- ISSUE-201 adds formType to FormSubmission
- ISSUE-207 creates LOG entries (requires enum)
- ISSUE-214 filters by formType (requires enum)

**Resolution:** ISSUE-200 MUST be completed before ISSUE-207, ISSUE-214

---

### Breaking Change 5: Conditional Field Logic Naming Inconsistency

**Issue:** Two different conditional logic approaches exist in codebase.

**Sprint 5 Approach (ISSUE-154):**

```typescript
interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains';
  value: any;
  action: 'show' | 'hide' | 'require' | 'optional';
}

field.conditionalRules: ConditionalRule[]
```

**Sprint 7 Approach (ISSUE-187, ISSUE-197):**

```typescript
field.showWhen: {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains';
  value: any;
}
```

**Conflict:**

- ISSUE-187 uses `showWhen` property
- ISSUE-197 uses `showWhen` property
- Sprint 5 uses `conditionalRules` array

**Resolution Required:**

- Standardize on ONE approach
- Recommendation: Use `showWhen` (simpler, matches ISSUE-187/197)
- Migrate existing `conditionalRules` to `showWhen` format
- Update ConditionalLogicBuilder to use `showWhen`

**Files Affected:**

- `apps/web/components/form-builder/ConditionalLogicBuilder.tsx`
- `apps/web/components/form-renderer/FieldRenderer.tsx`
- All form templates with conditional logic

**Breaking Change:** Yes - requires template schema migration

---

## AMBIGUITIES

### Ambiguity 1: Field Type Standardization

**Issue:** Multiple issues reference field types inconsistently.

**ISSUE-183 (NDEP Form):**

- References: 'date', 'email', 'phone', 'address' as field types
- Says these should render as TextInput

**ISSUE-197 (Test Form):**

- References: 'text', 'number', 'textarea', 'select', 'checkbox', 'date', 'time', 'datetime', 'photo', 'signature'
- Also mentions: 'email', 'tel', 'currency'

**Current Implementation:** Unknown - need to check FieldRenderer

**Resolution Required:**

- Document standard field types
- Clarify: Are 'email', 'phone', 'address' separate types or just 'text' with validation?
- Standardize field type names across all issues

---

### Ambiguity 2: Project Status Lifecycle Transitions

**Issue:** ISSUE-202 documents status flow, but ISSUE-206 implementation may differ.

**ISSUE-202 Status Flow:**

```
PLANNING --> ACTIVE <--> SUSPENDED
                |
                v
           COMPLETED --> ARCHIVED
                or
             CLOSED --> ARCHIVED
```

**ISSUE-206 Mutations:**

- `closeProject`: ACTIVE --> CLOSED
- `archiveProject`: CLOSED --> ARCHIVED
- `reopenProject`: CLOSED --> ACTIVE

**Ambiguity:** Can COMPLETED projects be archived? Can SUSPENDED projects be closed?

**Resolution Required:**

- Clarify all valid status transitions
- Document in ISSUE-202 or ISSUE-206
- Add validation in backend service

---

### Ambiguity 3: LOG Entry Number Assignment

**Issue:** ISSUE-207 says entryNumber auto-increments, but doesn't specify scope.

**Question:** Is entryNumber scoped per:

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

**Resolution Required:**

- Confirm: entryNumber is per (projectId + templateId)
- Document in ISSUE-207
- Add unique constraint: `@@unique([projectId, templateId, entryNumber])` if needed

---

### Ambiguity 4: Project Context Validation Frequency

**Issue:** ISSUE-208 says validate every 5 minutes, but ISSUE-221 says validate on reconnect.

**ISSUE-208:**

- Validation every 5 minutes when online
- Uses `lastValidated` timestamp

**ISSUE-221:**

- Validates on reconnect (online event)
- Also mentions 5-minute interval

**Ambiguity:** Are these complementary or conflicting?

**Resolution:** They're complementary:

- ISSUE-208: Periodic validation while online (every 5 min)
- ISSUE-221: Immediate validation on reconnect (online event)
- Both use same validation logic

**Clarification Needed:** Document both behaviors clearly

---

### Ambiguity 5: Template Assignment Default Behavior

**Issue:** What happens to existing projects when Sprint 8 architecture is deployed?

**Question:**

- Do all existing templates get auto-assigned to all existing projects?
- Or do admins need to manually assign templates?

**ISSUE-200:** Creates model, doesn't specify migration strategy

**ISSUE-212:** Admin UI for assignment, but what about existing data?

**Resolution Required:**

- Create migration script to assign all templates to all projects as FORM type
- OR: Require admin assignment before users can access templates
- Document decision in ISSUE-200 or Sprint 8 Master Plan

---

### Ambiguity 6: Copy from Yesterday Field Exclusion List

**Issue:** ISSUE-207 and ISSUE-217 both define what gets copied, but lists differ slightly.

**ISSUE-207 Copy Logic:**

```typescript
const fieldsToReset = ['signature', 'date', 'time', 'timestamp', 'photos'];
```

**ISSUE-217 Copy Modal:**

```
Will copy:
- Site conditions
- Equipment on site
- Crew information
- Weather observations
- BMP status
- Inspector notes

Will NOT copy:
- Signatures
- Dates and times
- Photos
- Entry number
```

**Ambiguity:** Are these consistent? Should field exclusion be configurable per template?

**Resolution Required:**

- Standardize exclusion list
- Consider: Template-specific exclusion rules?
- Document in ISSUE-207

---

### Ambiguity 7: FormStatus vs Submission Status

**Issue:** Current schema has `FormStatus` enum, but issues reference different status values.

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

**ISSUE-218 (Foreman View):**

- References: DRAFT, SUBMITTED, APPROVED, REJECTED
- Missing: IN_PROGRESS, REVIEWED

**ISSUE-205 (Admin Delete):**

- Checks for APPROVED status
- Says cannot delete APPROVED submissions

**Ambiguity:** Are IN_PROGRESS and REVIEWED used? Should they be?

**Resolution Required:**

- Clarify status workflow
- Update ISSUE-218 to include all statuses
- Or remove unused statuses from enum

---

### Ambiguity 8: Project Assignment vs Project Context

**Issue:** ISSUE-194 (Project User Assignment) and ISSUE-208 (Project Context) both deal with projects.

**ISSUE-194:**

- Assigns users to projects (many-to-many)
- ProjectAssignment model

**ISSUE-208:**

- Current working project (one selected)
- ProjectContext store

**Ambiguity:** Should project context be limited to assigned projects only?

**Resolution Required:**

- Clarify: Can user select project they're not assigned to?
- Recommendation: Filter project selection by assignments
- Update ISSUE-210 (ProjectSelectionModal) to filter by assignments

---

## CONTRADICTIONS

### Contradiction 1: Conditional Logic Property Name

**Sprint 5:** Uses `conditionalRules` (array of rules)
**Sprint 7:** Uses `showWhen` (single condition object)

**Contradiction:** Two different approaches for same feature

**Evidence:**

- ISSUE-154 (Sprint 5): `field.conditionalRules: ConditionalRule[]`
- ISSUE-187 (Sprint 7): `field.showWhen: { field, operator, value }`
- ISSUE-197 (Sprint 7): Uses `showWhen`

**Resolution:**

- Standardize on `showWhen` (simpler, matches newer issues)
- Migrate existing `conditionalRules` to `showWhen`
- Update ConditionalLogicBuilder component

**Action Required:** Update ISSUE-154 completion to note migration needed

---

### Contradiction 2: Project Status Values

**ISSUE-202:** Says ARCHIVED needs to be added (implies it doesn't exist)
**Current Schema:** Shows ProjectStatus enum without ARCHIVED

**Contradiction:** Issue says "PLANNING, ACTIVE, SUSPENDED, COMPLETED, CLOSED already exist" but then says "only ARCHIVED is new"

**Resolution:**

- Current schema confirmed: ARCHIVED does NOT exist
- ISSUE-202 is correct: ARCHIVED needs to be added
- No contradiction - issue is accurate

**Action Required:** None - issue is correct

---

## IMPLEMENTATION ORDER DEPENDENCIES

### Critical Path for Sprint 8-10

```
ISSUE-200 (ProjectTemplateAssignment model)
    |
    +--> ISSUE-201 (FormType enum + FormSubmission fields)
    |       |
    |       +--> ISSUE-207 (Create LOG Entry)
    |       |       |
    |       |       +--> ISSUE-217 (Copy from Yesterday)
    |       |
    |       +--> ISSUE-214 (TemplateSelector rewrite)
    |               |
    |               +--> ISSUE-215 (FormTypeCard)
    |               +--> ISSUE-216 (LogEntryList)
    |
    +--> ISSUE-203 (ProjectTemplateService)
            |
            +--> ISSUE-204 (GraphQL Resolvers)
                    |
                    +--> ISSUE-212 (ProjectTemplateManager UI)
                            |
                            +--> ISSUE-213 (Settings Page Route)

ISSUE-202 (ProjectStatus ARCHIVED)
    |
    +--> ISSUE-206 (Project Close/Archive)
            |
            +--> ISSUE-208 (Project Context Store)
                    |
                    +--> ISSUE-209 (ProjectContextIndicator)
                    +--> ISSUE-210 (ProjectSelectionModal)
                    +--> ISSUE-211 (AppShell Integration)
                    +--> ISSUE-221 (Offline Sync)
```

**Blockers:**

- ISSUE-200 MUST be done first (foundation)
- ISSUE-201 MUST be done before any LOG features
- ISSUE-208 MUST be done before ISSUE-214

---

## RECOMMENDATIONS

### Immediate Actions

1. **Complete ISSUE-200 FIRST** - Foundation for entire architecture
2. **Complete ISSUE-201 SECOND** - Required for LOG features
3. **Complete ISSUE-202** - Add ARCHIVED status (simple enum addition)
4. **Resolve Conditional Logic Contradiction** - Standardize on `showWhen`
5. **Create Migration Script** - Assign existing templates to existing projects

### Before Sprint 8 Implementation

1. Review this conflict analysis with team
2. Update ISSUE-200 to include migration strategy
3. Update ISSUE-201 to include backfill script
4. Resolve all ambiguities listed above
5. Update ConditionalLogicBuilder to use `showWhen`

### Sprint 7 Issues Safe to Proceed

All Sprint 7 issues EXCEPT:

- ISSUE-195 (DEFERRED - superseded by ISSUE-200)
- ISSUE-196 (DEFERRED - superseded by ISSUE-208-211)

**Safe Issues:**

- ISSUE-179-194: Form builder fixes, template fixes, UX improvements
- ISSUE-197: Example form (no architecture dependency)
- ISSUE-186: Form fields pull from project (compatible with Sprint 8)

---

## TESTING REQUIREMENTS

### Before Sprint 8-10 Implementation

1. **Database Migration Tests:**
   - Test FormSubmission formType backfill
   - Test ProjectTemplateAssignment creation
   - Test ProjectStatus ARCHIVED addition

2. **Breaking Change Tests:**
   - Test template filtering (empty state when no assignments)
   - Test project context requirement (forced selection)
   - Test LOG entry creation (requires formType)

3. **Integration Tests:**
   - Test project context + template assignment flow
   - Test LOG entry with entryNumber assignment
   - Test conditional logic with `showWhen` property

---

## DOCUMENTATION UPDATES REQUIRED

1. **Update ISSUE-200:** Add migration strategy for existing projects
2. **Update ISSUE-201:** Add backfill script details
3. **Update ISSUE-207:** Clarify entryNumber scope (project + template)
4. **Update ISSUE-208:** Document validation frequency (5 min + reconnect)
5. **Update ISSUE-214:** Document empty state behavior
6. **Create:** Field type standardization document
7. **Create:** Conditional logic migration guide (`conditionalRules` → `showWhen`)

---

## RISK ASSESSMENT

| Risk                                     | Severity | Mitigation                                                |
| ---------------------------------------- | -------- | --------------------------------------------------------- |
| FormSubmission migration fails           | HIGH     | Test migration on staging, backup database                |
| Template filtering breaks user workflows | HIGH     | Auto-assign all templates during migration                |
| Project context blocks access            | MEDIUM   | Clear messaging, admin can assign templates quickly       |
| Conditional logic migration breaks forms | MEDIUM   | Test all templates, provide migration script              |
| EntryNumber conflicts                    | LOW      | Unique constraint on (projectId, templateId, entryNumber) |

---

**Last Updated:** 2025-12-19
**Next Review:** Before Sprint 8 kickoff
**Status:** ACTIVE - Critical conflicts identified, resolution required
