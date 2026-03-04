# BrAve Forms - Salvage Sprint Plan

**Created:** 2026-02-17 16:30:00 UTC
**Source:** docs/ANDY_SALVAGE_PLAN.md (approved plan)
**Sprint Duration:** 1 week per sprint (focused work)
**Total Sprints:** 5
**Goal:** Get BrAve Forms aligned to Andy's Q&D Construction specifications

---

## Sprint Overview

| Sprint    | Focus                                       | Stories | Dependencies |
| --------- | ------------------------------------------- | ------- | ------------ |
| Sprint S1 | Foundation: Schema + Auth Simplification    | 12      | None         |
| Sprint S2 | Project Setup + First Form (Dust Log)       | 10      | S1           |
| Sprint S3 | Stormwater Forms (NDEP + NDOT)              | 10      | S1           |
| Sprint S4 | Permit Forms + Documents + Inspector Portal | 10      | S1, S2       |
| Sprint S5 | Users, Navigation, PDF Export, Cleanup      | 10      | S1-S4        |

**Naming convention:** S1-001 through S5-010 (Sprint-Story)
**"S" prefix** distinguishes salvage sprints from previous sprint numbering (Sprint 1-5 complete).

---

## Sprint S1: Foundation (Schema + Auth Simplification)

**Goal:** Get the data model right and simplify auth so everything else can build on solid ground.
**Risk Level:** HIGH - Auth changes touch every resolver.

### Stories

#### S1-001: Extend Project model with contact fields

**Files:** `packages/database/schema.prisma`
**Work:**

- Add to Project model: superintendentName, superintendentPhone, superintendentEmail, foremanName, foremanPhone, foremanEmail, projectManagerName, projectManagerPhone, projectManagerEmail, ownerRepName, ownerRepPhone, ownerRepEmail, ownerRepAddress, soilType, parcelNumbers, projectDescription, completionDate
- Keep existing fields (name, address, latitude, longitude, disturbedAcres, startDate, status, orgId)
- All new fields are optional (String? / DateTime?)
  **Acceptance Criteria:**
- [ ] Migration runs cleanly
- [ ] Prisma generate succeeds
- [ ] Existing data unaffected

#### S1-002: Create PermitType enum and ProjectPermit model

**Files:** `packages/database/schema.prisma`
**Work:**

- New enum: `PermitType` (SAD, DUST_CONTROL, STORMWATER_NDOT, STORMWATER_NDEP, WATERWAY, OTHER)
- New model: `ProjectPermit` (id, projectId, permitType, permitNumber, uploadedDocUrl, createdAt, updatedAt)
- Relation: Project hasMany ProjectPermit
  **Acceptance Criteria:**
- [ ] Migration runs cleanly
- [ ] Relation works in Prisma Studio

#### S1-003: Create FormType enum and ProjectFormRequirement model

**Files:** `packages/database/schema.prisma`
**Work:**

- New enum: `FormType` (DUST_LOG, NDEP_STORMWATER, NDOT_STORMWATER, NDEP_SAD, NNPH_DUST_PERMIT)
- New model: `ProjectFormRequirement` (id, projectId, formType, isRequired, addedBy, createdAt)
- addedBy: "AUTO_PERMIT" or "MANUAL"
- Relation: Project hasMany ProjectFormRequirement
  **Acceptance Criteria:**
- [ ] Migration runs cleanly
- [ ] Can create requirements linked to projects

#### S1-004: Create ProjectDocument model

**Files:** `packages/database/schema.prisma`
**Work:**

- New enum: `DocumentCategory` (PERMIT, CONTRACT, MAP, PLAN, OTHER)
- New model: `ProjectDocument` (id, projectId, name, category, fileUrl, fileSize, mimeType, uploadedBy, createdAt)
- Relation: Project hasMany ProjectDocument
  **Acceptance Criteria:**
- [ ] Migration runs cleanly

#### S1-005: Create ProjectUser model (user-project assignment)

**Files:** `packages/database/schema.prisma`
**Work:**

- New enum: `ProjectRole` (ADMIN, MEMBER)
- New model: `ProjectUser` (id, projectId, userId, role, assignedAt)
- Unique constraint on (projectId, userId)
- Relation: Project hasMany ProjectUser
  **Acceptance Criteria:**
- [ ] Migration runs cleanly
- [ ] Unique constraint prevents duplicate assignments

#### S1-006: Add role field to User tracking

**Files:** `packages/database/schema.prisma`
**Work:**

- Add `appRole` field (String, default "USER") to UserPreferences or create new UserProfile model
- Values: "ADMIN" or "USER"
- Inspector has no account (QR token)
- Decision: Use UserPreferences since it already has userId + orgId
  **Acceptance Criteria:**
- [ ] Role can be set per user
- [ ] Default is "USER"

#### S1-007: Adapt FormSubmission for typed forms

**Files:** `packages/database/schema.prisma`
**Work:**

- Add `formType` field (FormType enum) to FormSubmission - nullable initially for backwards compat
- Make `templateId` nullable (dedicated forms don't use templates)
- Keep `data` as Json (typed JSONB per form)
- Keep `projectId` (already exists, currently optional - make it used consistently)
  **Acceptance Criteria:**
- [ ] FormSubmission can be created with formType instead of templateId
- [ ] Existing submissions unaffected

#### S1-008: Run and verify all migrations

**Files:** Migration files
**Work:**

- Run `pnpm db:migrate` with all schema changes from S1-001 through S1-007
- Verify Prisma generate succeeds
- Verify existing seed data still works
- Test in Prisma Studio
  **Acceptance Criteria:**
- [ ] All migrations applied
- [ ] `pnpm db:generate` succeeds
- [ ] No data loss

#### S1-009: Create permit-to-form trigger logic (backend)

**Files:** `apps/backend/src/modules/projects/`
**Work:**

- When a ProjectPermit is added to a project, auto-create ProjectFormRequirement entries:
  - SAD permit -> DUST_LOG
  - DUST_CONTROL permit -> DUST_LOG
  - STORMWATER_NDOT permit -> NDOT_STORMWATER
  - STORMWATER_NDEP permit -> NDEP_STORMWATER
  - WATERWAY -> nothing (TBD)
  - OTHER -> nothing
- Prevent duplicate form requirements
- Admin can also manually add form requirements (addedBy: "MANUAL")
  **Acceptance Criteria:**
- [ ] Adding SAD permit auto-creates DUST_LOG requirement
- [ ] Adding DUST_CONTROL permit doesn't duplicate DUST_LOG if already exists
- [ ] Manual addition works with addedBy="MANUAL"

#### S1-010: Extend Projects GraphQL resolvers

**Files:** `apps/backend/src/modules/projects/`
**Work:**

- Update CreateProjectInput to include all new optional fields
- Update UpdateProjectInput similarly
- Add nested resolvers for project.permits, project.documents, project.formRequirements, project.assignedUsers
- Add mutations: addPermitToProject, removePermitFromProject, addFormRequirement, assignUserToProject
  **Acceptance Criteria:**
- [ ] Can create project with all new fields via GraphQL
- [ ] Can add/remove permits
- [ ] Can assign users

#### S1-011: Simplify auth guards for single-tenant pilot

**Files:** `apps/backend/src/auth/`, `apps/backend/src/common/`
**Work:**

- Keep ClerkAuthGuard but make orgId extraction more resilient
- If user has no org, auto-create/join default org (JIT provisioning already exists per recent commit)
- Add @CurrentUser decorator that provides both userId and orgId
- Do NOT remove orgId from models yet (backwards compat)
- Add helper: `canAccessProject(userId, projectId)` that checks ProjectUser table (or ADMIN role)
  **Acceptance Criteria:**
- [ ] Clerk login still works
- [ ] User without org gets auto-provisioned
- [ ] canAccessProject returns true for assigned users and admins

#### S1-012: Update seed data

**Files:** `packages/database/seed.ts` or equivalent
**Work:**

- Remove 18 generic form templates from seed
- Add sample Q&D-relevant project with:
  - All contact fields populated
  - SAD + Dust Control permits (triggers Dust Log)
  - NDEP Stormwater permit (triggers NDEP form)
  - Sample ProjectUser assignments
- Keep organization seed (needed for auth)
  **Acceptance Criteria:**
- [ ] `pnpm db:seed` runs without error
- [ ] Sample project visible with permits and form requirements

---

## Sprint S2: Project Setup + Daily Dust Log

**Goal:** The first end-to-end workflow: create a project, fill out a dust log, see it in history.
**Depends on:** Sprint S1 complete.

### Stories

#### S2-001: Rebuild project creation page (full field set)

**Files:** `apps/web/app/dashboard/projects/new/page.tsx`
**Work:**

- Replace current basic form with Andy's full field set
- Sections: Basic Info (required), Contacts (optional), Site Details (optional)
- Required: Project name, address, start date, completion date
- Optional: Superintendent (name/phone/email), Foreman (name/phone/email), PM (name/phone/email), Owner Rep (name/phone/email/address), Acres, Soil type, Parcel numbers, Description
- Keep geocode lookup for address
- Use React Hook Form + Zod validation
  **Acceptance Criteria:**
- [ ] All fields from Project Setup.docx present
- [ ] Required fields enforced (name, address, start date, completion date)
- [ ] Optional fields work correctly
- [ ] Project creates successfully with all data

#### S2-002: Add permit selection to project creation

**Files:** `apps/web/app/dashboard/projects/new/page.tsx`
**Work:**

- Add "Permits" section after project details
- Checkbox/multiselect for 6 permit types (SAD, Dust Control, NDOT Stormwater, NDEP Stormwater, Waterway, Other)
- Each selected permit shows optional "Permit Number" text field
- On submit, creates ProjectPermit records
- Display which forms will be triggered by selected permits (informational)
  **Acceptance Criteria:**
- [ ] All 6 permit types selectable
- [ ] Permit number field appears for each selected
- [ ] Form trigger preview shows correctly
- [ ] ProjectPermit records created on submit

#### S2-003: Auto-trigger form requirements from permits

**Files:** Frontend + Backend integration
**Work:**

- After project creation with permits, verify ProjectFormRequirement records auto-created (S1-009)
- Add UI feedback: "Based on selected permits, the following forms are required: [list]"
- Admin can add additional forms beyond permit-triggered ones (manual add)
  **Acceptance Criteria:**
- [ ] Selecting SAD permit shows "Daily Dust Log will be required"
- [ ] ProjectFormRequirement records exist after creation
- [ ] Manual form addition works

#### S2-004: Restructure project detail page (tab layout)

**Files:** `apps/web/app/dashboard/projects/[id]/page.tsx`
**Work:**

- Replace current 5-tab layout (Forms/Photos/Team/Weather/Compliance) with Andy's container structure
- New tabs: Permits, Documents, [one tab per required form type], Team
- Form tabs are dynamic based on ProjectFormRequirement
- Remove: Photos tab, Weather tab, Compliance tab
- Project header: Name, Address, Status badge, QR Code button, Edit button
  **Acceptance Criteria:**
- [ ] Tab layout matches plan
- [ ] Only required form tabs shown
- [ ] Permits tab shows project permits
- [ ] Old tabs removed

#### S2-005: Build Daily Dust Log form component (editable)

**Files:** `apps/web/components/forms/daily-dust-log/`
**Work:**

- Create DailyDustLog.tsx with React Hook Form + Zod
- Header section (auto-fill): Permit #, Project Name, Company/Contractor
- Entry table: Date, Time, Visible Dust (Y/N), Project Soils (dropdown), Access Roads (dropdown), Trackout (Y/N), Corrective Actions (textarea)
- "Add Entry" row for multiple observations per day
- Submit saves to FormSubmission with formType=DUST_LOG
- Create dust-log.types.ts and dust-log.validation.ts
  **Acceptance Criteria:**
- [ ] Form matches AQMD PDF layout
- [ ] Header auto-fills from project data
- [ ] Multiple entries per form
- [ ] Zod validation passes
- [ ] Saves as JSONB in FormSubmission

#### S2-006: Build Daily Dust Log read-only view

**Files:** `apps/web/components/forms/daily-dust-log/DailyDustLogView.tsx`
**Work:**

- Read-only rendering of submitted dust log data
- Clean, printable layout matching PDF format
- Used for: completed form view, inspector portal
  **Acceptance Criteria:**
- [ ] Renders all submitted data correctly
- [ ] Layout matches original PDF
- [ ] Read-only (no edit controls)

#### S2-007: Form submission backend (typed JSONB)

**Files:** `apps/backend/src/modules/submissions/`
**Work:**

- Update createSubmission mutation to accept formType (no templateId needed)
- Validate data against expected shape per formType (server-side)
- Store with projectId and formType
- Add query: getSubmissionsByProject(projectId, formType) - returns list sorted by date
- Add query: getLatestSubmission(projectId, formType) - returns most recent for "Use Previous"
  **Acceptance Criteria:**
- [ ] Can create submission with formType=DUST_LOG
- [ ] Can query submissions by project + form type
- [ ] getLatestSubmission returns most recent

#### S2-008: Form log history tab (per form type)

**Files:** `apps/web/components/projects/FormLogTab.tsx`
**Work:**

- Generic tab component that shows submission history for a specific form type on a project
- List of entries: date, submitted by, status
- "New Entry" button at top
- Click entry to view completed form (read-only, using \*View.tsx component)
- "Use Previous" button when starting new entry (loads latest submission data)
  **Acceptance Criteria:**
- [ ] Shows all submissions for form type on project
- [ ] New Entry opens editable form
- [ ] Completed entry opens read-only view
- [ ] "Use Previous" loads latest data into new form

#### S2-009: "Use Previous" form continuity

**Files:** Frontend form components
**Work:**

- "Use Previous" button on new entry form
- Calls getLatestSubmission(projectId, formType)
- Loads prior submission data into form fields
- Clears date/time fields (user enters today's)
- Keeps everything else from prior submission
  **Acceptance Criteria:**
- [ ] Button appears on new entry
- [ ] Loads previous data correctly
- [ ] Date/time fields cleared
- [ ] Other fields pre-filled

#### S2-010: End-to-end test - Dust Log workflow

**Work:**

- Create project with SAD permit
- Verify Dust Log tab appears
- Fill out dust log entry, submit
- Verify entry appears in log history
- Start new entry with "Use Previous"
- Verify auto-fill + previous data load
- View completed entry (read-only)
  **Acceptance Criteria:**
- [ ] Full workflow works end-to-end
- [ ] No errors in console
- [ ] Data persists correctly

---

## Sprint S3: Stormwater Forms (NDEP + NDOT)

**Goal:** Build the two weekly stormwater inspection forms.
**Depends on:** Sprint S1 complete (S2 not required, can parallel).

### Stories

#### S3-001: Build NDEP Weekly Stormwater form - Section 1

**Files:** `apps/web/components/forms/ndep-stormwater/`
**Work:**

- Create NdepStormwater.tsx (Section 1 of 3)
- General Info (auto-fill): Project Site Name, CSW#, Location
- Inspection Details: date, time, inspector, type (Regular/Post Storm/Other)
- Storm Event Data: 0.25" threshold question, rain gauge vs weather station, total rainfall, storm start/duration
- Snowmelt discharge trigger question
- Weather conditions, temperature
- Discharge, erosion, corrective actions follow-up
- Create ndep-stormwater.types.ts, ndep-stormwater.validation.ts
  **Acceptance Criteria:**
- [ ] Section 1 fields match NDEP PDF page 1
- [ ] Auto-fill from project data works
- [ ] Snowmelt trigger question present
- [ ] 0.25" threshold question present

#### S3-002: Build NDEP Weekly Stormwater form - Section 2

**Files:** `apps/web/components/forms/ndep-stormwater/NdepStormwater.tsx`
**Work:**

- SWPPP Elements: 3 Yes/No questions
- 16 Stormwater Control Measure items, each with:
  - Implemented: Yes/No/NA
  - Maintenance Needed: Yes/No
  - Notes: text
- Render as clean table/grid matching PDF layout
  **Acceptance Criteria:**
- [ ] 3 SWPPP questions render correctly
- [ ] All 16 control measures present with correct fields
- [ ] Layout matches PDF page 2

#### S3-003: Build NDEP Weekly Stormwater form - Section 3

**Files:** `apps/web/components/forms/ndep-stormwater/NdepStormwater.tsx`
**Work:**

- 4 Stabilization items (same fields as control measures)
- Corrective Action table: action, date to complete, completed (dynamic rows)
- Inspector signature + date
- Certification statement
  **Acceptance Criteria:**
- [ ] 4 stabilization items present
- [ ] Corrective action table allows adding rows
- [ ] Signature field present
- [ ] Full form submits as single JSONB payload

#### S3-004: Build NDEP Stormwater read-only view

**Files:** `apps/web/components/forms/ndep-stormwater/NdepStormwaterView.tsx`
**Work:**

- Read-only rendering of all 3 sections
- Clean printable layout
  **Acceptance Criteria:**
- [ ] All 3 sections render correctly
- [ ] Matches PDF layout

#### S3-005: Build NDOT Weekly Stormwater form - Section 1

**Files:** `apps/web/components/forms/ndot-stormwater/`
**Work:**

- Create NdotStormwater.tsx (Section 1)
- Report No. field (sequential)
- Site Info: Project Location, Contract #, CSW/Tracking # (or N/A), NDOT Inspector/Crew, RE, WPCM, dates
- Conditions: weather checkboxes, precipitation intensity, reference, total, wind, temp range
- Conditional questions: TMDL waterway, deficiency follow-up, erosion, adjacent runoff, pollutants
- SWPPP Elements (4 items)
- BMP: Sediment Control + Erosion Control
- Create ndot-stormwater.types.ts, ndot-stormwater.validation.ts
  **Acceptance Criteria:**
- [ ] Report No. field present
- [ ] All conditional fields show/hide correctly
- [ ] SWPPP 4 items + 2 BMP categories on page 1

#### S3-006: Build NDOT Weekly Stormwater form - Section 2

**Files:** `apps/web/components/forms/ndot-stormwater/NdotStormwater.tsx`
**Work:**

- 9 additional BMP categories (track-out through sanitation facilities)
- Each: Required/Present Y/N, BMPs Implemented Y/N, Comments
  **Acceptance Criteria:**
- [ ] All 9 BMP categories present (11 total with page 1)
- [ ] Each has correct field structure

#### S3-007: Build NDOT Weekly Stormwater form - Section 3

**Files:** `apps/web/components/forms/ndot-stormwater/NdotStormwater.tsx`
**Work:**

- Batch Plants section (Y/N, onsite/offsite, BMPs, comments)
- Illicit Discharge / Spill Response (5 questions)
- Non-structural BMPs, Final Check, Additional Comments
- Dual signatures: Inspector + WPCM (with 40 CFR 122.22(d) certification)
  **Acceptance Criteria:**
- [ ] Batch plant section complete
- [ ] All 5 illicit discharge questions present
- [ ] Dual signature fields present

#### S3-008: NDOT photo attachment component

**Files:** `apps/web/components/forms/ndot-stormwater/PhotoAttachment.tsx`
**Work:**

- Photo upload component for deficiency documentation
- Uses existing Photo model and storage infrastructure
- Caption/description per photo
- Links photos to form submission (submissionId on Photo model)
- Display uploaded photos in form view and read-only view
  **Acceptance Criteria:**
- [ ] Can upload photos during form fill
- [ ] Photos display in form
- [ ] Photos linked to submission
- [ ] Photos visible in read-only view

#### S3-009: Build NDOT Stormwater read-only view

**Files:** `apps/web/components/forms/ndot-stormwater/NdotStormwaterView.tsx`
**Work:**

- Read-only rendering of all 3 sections + attached photos
- Clean printable layout
  **Acceptance Criteria:**
- [ ] All sections render
- [ ] Photos display
- [ ] Matches PDF layout

#### S3-010: End-to-end test - Both stormwater forms

**Work:**

- Create project with NDEP + NDOT stormwater permits
- Fill both forms, submit
- Verify NDOT photo attachment works
- Verify "Use Previous" on both
- View completed entries
  **Acceptance Criteria:**
- [ ] Both forms work end-to-end
- [ ] Photo attachment works on NDOT
- [ ] Use Previous works on both

---

## Sprint S4: Permit Forms + Documents + Inspector Portal

**Goal:** The two one-time permit application forms, document uploads, and restructured inspector portal.
**Depends on:** S1 (schema), S2 (project detail structure).

### Stories

#### S4-001: Build NDEP SAD Application form

**Files:** `apps/web/components/forms/ndep-sad-application/`
**Work:**

- Multi-section form:
  - General Company Info (6 address blocks)
  - Location Details (Township/Range/Section, UTM, Basin, County, City, Directions)
  - SAD Details (Project Name, Acres, 16+ BMP checkboxes, Water Trucks)
  - Certification (attachment checklist, signature)
- Auto-fill from project + contacts
- Create ndep-sad.types.ts, ndep-sad.validation.ts
  **Acceptance Criteria:**
- [ ] All 6 address blocks present
- [ ] Location grid renders correctly
- [ ] 16+ BMP checkboxes present
- [ ] Auto-fill works from project data

#### S4-002: Build NDEP SAD read-only view

**Files:** `apps/web/components/forms/ndep-sad-application/NdepSadApplicationView.tsx`
**Acceptance Criteria:**

- [ ] All sections render
- [ ] Matches original DOCX layout

#### S4-003: Build NNPH Dust Control Permit form

**Files:** `apps/web/components/forms/nnph-dust-permit/`
**Work:**

- Application Info: type (New/Renewal/Modification), permit #, project name, APN, acres, dates
- Applicant + Contractor + After-Hours contacts (#1, #2)
- "All fields required even if same as applicant" enforcement
- Project Details: description, type dropdown (7 options), fill material, excavation, crushing equipment (conditional: Stationary Source Permit #), soil type, soil analysis (Y/N), 7 dust control methods, irrigation, speed limit, trackout, unauthorized traffic
- Signature
- Create nnph-dust.types.ts, nnph-dust.validation.ts
  **Acceptance Criteria:**
- [ ] 7 project type options in dropdown
- [ ] Contractor section required even if same as applicant
- [ ] Crushing equipment conditional field works
- [ ] 7 dust control methods with sub-details
- [ ] Auto-fill works

#### S4-004: Build NNPH Dust Permit read-only view

**Files:** `apps/web/components/forms/nnph-dust-permit/NnphDustPermitView.tsx`
**Acceptance Criteria:**

- [ ] All sections render
- [ ] Matches PDF layout

#### S4-005: Build document upload backend

**Files:** `apps/backend/src/modules/documents/`
**Work:**

- New NestJS module: DocumentsModule
- Reuse existing S3/MinIO storage infrastructure (PhotoStorageService pattern)
- CRUD mutations: uploadDocument, deleteDocument
- Query: getProjectDocuments(projectId)
- Categories: PERMIT, CONTRACT, MAP, PLAN, OTHER
- File validation: max size, allowed types
  **Acceptance Criteria:**
- [ ] Can upload document to project
- [ ] Can query documents by project
- [ ] Can delete document
- [ ] File stored in S3/MinIO

#### S4-006: Build document upload frontend (project Documents tab)

**Files:** `apps/web/components/projects/ProjectDocumentsTab.tsx`
**Work:**

- Drag-drop or file picker upload component
- Category selection dropdown
- Document list with: name, category, size, upload date, download link
- Delete button for admin
  **Acceptance Criteria:**
- [ ] Upload works
- [ ] Documents list displays
- [ ] Download links work
- [ ] Category filtering

#### S4-007: Restructure Inspector QR Portal

**Files:** `apps/web/app/inspector/[token]/page.tsx`
**Work:**

- Replace current tabs (Submissions, Photos, Project Info) with Andy's structure:
  - Completed Forms (grouped by form type, chronological)
  - Documents (uploaded project documents)
  - Permits (the selected permits on this project)
  - Project Info (header: name, address, contacts)
- Use \*View.tsx components for read-only form rendering
- Clean printable layout for each form
  **Acceptance Criteria:**
- [ ] Portal shows completed forms grouped by type
- [ ] Documents tab shows uploaded docs
- [ ] Permits tab shows project permits
- [ ] All forms render correctly in read-only mode

#### S4-008: Update QR token permissions for new structure

**Files:** `apps/backend/src/modules/qr-portal/`, schema
**Work:**

- Update TokenPermission enum to include VIEW_DOCUMENTS, VIEW_PERMITS
- Update token generation to include new permissions by default
- Update portal to check permissions for new tabs
  **Acceptance Criteria:**
- [ ] New permissions in token
- [ ] Portal respects permissions

#### S4-009: Project edit page (update existing project)

**Files:** `apps/web/app/dashboard/projects/[id]/edit/page.tsx`
**Work:**

- Edit page with same fields as creation page
- Pre-filled with existing project data
- Can update contacts, permits, form requirements
- Uses UpdateProjectInput mutation
  **Acceptance Criteria:**
- [ ] All fields pre-filled
- [ ] Can update any field
- [ ] Permit changes trigger form requirement updates

#### S4-010: End-to-end test - Permit forms + Inspector portal

**Work:**

- Create project, add SAD + Dust Control permits, upload permit doc
- Fill NDEP SAD application, submit
- Fill NNPH Dust Permit, submit
- Generate QR code
- Open inspector portal (incognito)
- Verify: completed forms, documents, permits all visible
  **Acceptance Criteria:**
- [ ] Permit forms submit correctly
- [ ] Inspector portal shows everything
- [ ] Read-only mode enforced

---

## Sprint S5: Users, Navigation, PDF Export, Cleanup

**Goal:** Admin features, role-based navigation, PDF export, and cleanup.
**Depends on:** S1-S4.

### Stories

#### S5-001: Build Users management page (admin only)

**Files:** `apps/web/app/dashboard/users/page.tsx`
**Work:**

- List all users in the system
- Show name, email, role (ADMIN/USER), assigned projects count
- "Invite User" button (Clerk invite or email)
- "Assign to Project" button per user
- Admin-only access (USER role cannot see this page)
  **Acceptance Criteria:**
- [ ] User list displays
- [ ] Can assign users to projects
- [ ] Non-admin cannot access

#### S5-002: User-to-project assignment UI

**Files:** `apps/web/components/users/AssignProjectModal.tsx`
**Work:**

- Modal: select user, select project(s), assign
- Also accessible from project Team tab
- Shows current assignments
- Can remove assignment
  **Acceptance Criteria:**
- [ ] Can assign user to project
- [ ] Can remove assignment
- [ ] Assignment reflected in dashboard

#### S5-003: Filter dashboard and projects by user assignment

**Files:** `apps/web/app/dashboard/page.tsx`, project queries
**Work:**

- USER role: dashboard shows ONLY projects they are assigned to
- ADMIN role: dashboard shows all projects
- Project list page: same filtering
- Update GraphQL queries to filter by ProjectUser when role=USER
  **Acceptance Criteria:**
- [ ] USER sees only assigned projects
- [ ] ADMIN sees all projects
- [ ] Counts reflect filtered results

#### S5-004: Role-based navigation

**Files:** `apps/web/components/layout/AppNavbar.tsx`
**Work:**

- Admin nav: Dashboard, Projects, Forms, Users, Settings
- User nav: Dashboard, Projects, Settings
- Hide: Form Builder, Weather, Photos, Inspections
- Get user role from auth context
  **Acceptance Criteria:**
- [ ] Admin sees full nav
- [ ] User sees limited nav
- [ ] Hidden items not accessible by direct URL (route guards)

#### S5-005: Admin Forms management page

**Files:** `apps/web/app/dashboard/forms/page.tsx`
**Work:**

- Replace generic template browser with simple form type list
- Shows the 5 form types with descriptions
- Link to add form to a specific project
- Future: custom form creation via builder
  **Acceptance Criteria:**
- [ ] Lists 5 form types
- [ ] Can navigate to add form to project

#### S5-006: PDF export / print styling for submitted forms

**Files:** Form \*View.tsx components, print CSS
**Work:**

- Each read-only form view has "Print / Export PDF" button
- Use `@media print` CSS for clean printable layout
- Or use @react-pdf/renderer for true PDF generation
- Recommendation: Start with print CSS (simpler, faster), add PDF lib later if needed
- Inspector portal forms also printable
  **Acceptance Criteria:**
- [ ] Print button on completed forms
- [ ] Print layout is clean (no nav, no browser chrome)
- [ ] Each form recognizable compared to original PDF
- [ ] Works in inspector portal

#### S5-007: Dashboard simplification

**Files:** `apps/web/app/dashboard/page.tsx`
**Work:**

- Remove: Weather alerts widget, Quick Actions panel, Pending Tasks widget
- Keep/add: Welcome message, assigned projects cards (name, address, pending forms count), recent activity (last 5 form submissions)
- Completed forms quick-access
  **Acceptance Criteria:**
- [ ] Dashboard shows relevant info only
- [ ] Project cards link to project detail
- [ ] Recent activity shows form submissions

#### S5-008: Hide unused features (don't delete)

**Files:** Various
**Work:**

- Remove from nav: Form Builder, Weather, Photos upload, Inspections
- Keep code in place but unreachable from UI
- Comment out nav links and route registrations
- Add comments: "Hidden per salvage plan - available for future use"
  **Acceptance Criteria:**
- [ ] Features not accessible from UI
- [ ] Code still exists in codebase
- [ ] No broken imports/references

#### S5-009: Remove generic templates from seed data

**Files:** `packages/database/templates/`, seed file
**Work:**

- Remove 18 generic JSON templates from packages/database/templates/
- Remove template seeding from seed script
- Replace with Q&D-relevant sample data
- Keep FormTemplate model in schema (future custom forms via builder)
  **Acceptance Criteria:**
- [ ] No generic templates in seed
- [ ] Seed runs cleanly
- [ ] Sample Q&D project with forms visible

#### S5-010: Full end-to-end verification

**Work:**
Complete Andy's workflow test:

1. Admin creates project with all fields + selects permits (SAD + Dust Control)
2. Permits auto-trigger Dust Log as required form
3. Admin manually adds NDEP Stormwater as additional form
4. Admin uploads permit PDF document
5. Admin assigns User to project
6. User logs in -> sees ONLY assigned project
7. User opens project -> sees correct tabs
8. User fills Dust Log -> auto-fill works
9. User submits -> form in log history
10. Next day -> "Use Previous" works
11. User views completed form (read-only)
12. Admin generates QR code
13. Inspector scans QR (no login) -> sees forms + permits + docs
14. Submitted form is printable

**Acceptance Criteria:**

- [ ] All 14 steps pass
- [ ] No console errors
- [ ] All 5 form types work
- [ ] Inspector portal complete

---

## Development Workflow

### Tracking: GitHub Issues

Each story becomes a GitHub issue when its sprint is active. Issues are created per-sprint (not all 52 upfront).

**Labels:**

- `sprint:s1` through `sprint:s5` - Sprint identifier
- `schema` - Database/Prisma work
- `api` - Backend/GraphQL work
- `frontend` - Next.js/React/Mantine work
- `auth` - Clerk/auth changes
- `forms` - Form components (the 5 dedicated forms)
- `inspector` - QR portal work
- `test` - Testing stories
- `docs` - Documentation changes

**Issue naming:** `S1-001: Extend Project model with contact fields`

**Workflow:**

1. Create issues for active sprint only
2. Create feature branch per issue: `feature/S1-001-extend-project-model`
3. PR references issue: `Closes #42`
4. Squash-and-merge to master (auto-deploys to production)
5. Close issue, delete branch

### Parallel Development: Git Worktrees

Use worktrees for parallel sprint work and clean deploys:

```bash
# Main worktree stays on master (always deployable)
# e:/BrAve Forms/  -> master

# Create worktrees for active sprint work
git worktree add ../braveforms-s1-schema feature/S1-001-extend-project-model
git worktree add ../braveforms-s1-auth feature/S1-011-simplify-auth

# Parallel Claude sessions (one per worktree)
# cd ../braveforms-s1-schema && claude  -> schema work
# cd ../braveforms-s1-auth && claude    -> auth work

# After PR merges, clean up
git worktree remove ../braveforms-s1-schema
```

**Worktree rules:**

- Main worktree (`e:/BrAve Forms/`) = master, always clean
- Feature worktrees for active stories
- Never more than 3 worktrees active (disk space, cognitive load)
- Delete worktree after PR merges
- S2 and S3 can run as parallel worktrees after S1 completes

### Sprint Lifecycle

1. **Sprint start:** Create GitHub issues for all stories in the sprint
2. **Daily:** Work stories in priority order, one branch per story
3. **Story done:** PR -> squash merge -> auto-deploy -> close issue
4. **Sprint end:** Verify all issues closed, run end-to-end test, update this doc

## Sprint Execution Notes

### Parallelization Opportunities

- **S2 and S3 can run in parallel** after S1 completes (no dependencies between them)
- Within sprints, backend and frontend stories can often be developed concurrently
- Read-only view stories (S2-006, S3-004, S3-009, S4-002, S4-004) can be batched

### Risk Register

| Risk                                          | Impact | Mitigation                                              |
| --------------------------------------------- | ------ | ------------------------------------------------------- |
| Auth simplification breaks existing resolvers | HIGH   | Keep orgId, add compatibility layer, test each resolver |
| Form layouts don't match PDFs closely enough  | MEDIUM | Side-by-side comparison during build, iterate           |
| Photo attachment on NDOT form complex         | MEDIUM | Reuse existing Photo infrastructure                     |
| Migration data loss                           | HIGH   | Test migrations on copy of production DB first          |
| QR portal restructure breaks offline cache    | MEDIUM | Test offline mode after changes                         |

### Definition of Done (per story)

- [ ] Code implemented and working
- [ ] Acceptance criteria met
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Manual test passes
- [ ] No console errors

### Definition of Done (per sprint)

- [ ] All stories complete
- [ ] End-to-end test passes
- [ ] `pnpm build` succeeds
- [ ] No regressions in existing functionality
- [ ] Sprint review with Developer

---

_End of Sprint Plan_
