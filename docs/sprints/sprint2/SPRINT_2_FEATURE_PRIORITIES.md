# Sprint 2 Feature Priorities - Forms-First Product Positioning

**Created:** 2025-10-02
**Author:** Product Owner
**Sprint Duration:** October 14-25, 2025 (2 weeks)
**Sprint Goal:** Launch Core Forms Engine MVP (Dynamic Builder + Photo Documentation)
**Business Value:** Enable foremen to create custom forms and capture photos, reducing daily paperwork from 2-3 hours to 30 minutes

---

## Executive Summary

Sprint 2 marks the critical transition from infrastructure (Sprint 1) to product value delivery. Based on our forms-first positioning (80% forms, 20% compliance), this sprint focuses on the **Core Forms Engine** that solves the primary construction pain point: daily paperwork burden.

**Strategic Context:**

- Sprint 1 completed 44/45 issues (98% - infrastructure, weather API, PWA foundation)
- PRD validated: Forms Manager Frank (primary persona) spends 2-3 hours daily on paperwork
- Market research: 70% time reduction achievable with digital forms = $37,500 saved annually per foreman
- Competitive positioning: Construction-native forms specialist vs expensive general PM tools

**Sprint 2 Priorities:**

1. **Dynamic Form Builder** (P0) - Enable administrators to create custom forms without developer help
2. **Photo Documentation System** (P0) - Seamless camera integration with GPS tagging
3. **Form Template Library** (P1) - 5-10 construction templates (daily logs, inspections, safety)
4. **Forms Testing Infrastructure** (P0) - TDD approach for quality assurance
5. **Architecture Review** (P1) - Container efficiency and separation of concerns

**Success Criteria:**

- Admins can create a custom form in <15 minutes
- Foremen can fill a form with photos on mobile in <10 minutes
- 5-10 pre-built templates covering 70% of common construction forms
- Test coverage increases to 60% (from 40% post-Sprint 1)
- Container architecture reviewed and optimized

**Sprint 1 Carryover:**

- ISSUE-041: Lighthouse PWA Audit (deferred, needs proper container setup)
- BLOCKER-001: TanStack Query version lock (from ISSUE-047 discovery tracker)
- BLOCKER-002: Valtio store integration tests (from ISSUE-047)
- BLOCKER-007: Dashboard pre-rendering fix (Next.js + Clerk integration issue)

---

## Feature List with User Stories

### P0 Features (Ship Blockers - Must Complete)

#### Feature 1: Dynamic Form Builder Backend

**As a** project administrator
**I need** a GraphQL API to create custom forms with drag-and-drop fields
**So that** I can digitize our company-specific forms without developer help

**Acceptance Criteria:**

1. GraphQL mutation `createFormTemplate(input: CreateFormTemplateInput)` implemented
2. Support 8+ field types: text, number, date, dropdown, photo, signature, GPS, weather_data
3. JSONB schema validation with Zod (field definitions, validation rules, conditional logic)
4. Form versioning system (track template changes, maintain submission history)
5. Multi-tenant isolation verified (Clerk orgId filtering, PostgreSQL RLS)

**Technical Approach:**

- **Schema Design:** PostgreSQL JSONB column for flexible form definitions
- **Validation Engine:** Zod schemas for field type validation
- **Versioning:** Separate `form_templates` and `form_template_versions` tables
- **GraphQL Layer:** NestJS resolvers with ClerkAuthGuard
- **Testing:** Unit tests for validation logic, integration tests for CRUD operations

**Priority:** P0 (Core product functionality)
**Estimated Complexity:** Large (8-12 hours)
**Dependencies:** Sprint 1 database schema (organizations, projects tables)
**Evidence Required:** GraphQL Playground screenshot of createFormTemplate mutation

---

#### Feature 2: Photo Documentation API

**As a** construction foreman
**I need** to upload photos with GPS metadata to specific form fields
**So that** visual documentation automatically attaches to inspection reports

**Acceptance Criteria:**

1. Photo upload endpoint with multipart form-data support
2. GPS EXIF data extraction (latitude, longitude, timestamp, device info)
3. Hybrid storage strategy: <100KB → PostgreSQL bytea, >100KB → S3 + metadata
4. Automatic image compression (85% quality, preserves EXIF, 60-80% size reduction)
5. Photo annotation support (arrows, text, highlights - metadata stored)

**Technical Approach:**

- **Upload Endpoint:** GraphQL file upload using graphql-upload
- **EXIF Extraction:** exif-parser library (validate GPS coordinates exist)
- **Storage Logic:** Decision tree based on compressed file size
- **S3 Integration:** AWS SDK with presigned URLs for mobile direct upload
- **Metadata Storage:** `photos` table with foreign key to form_submissions

**Priority:** P0 (Primary value proposition - photo integration)
**Estimated Complexity:** Large (8-12 hours)
**Dependencies:** Sprint 1 MinIO deployment (S3-compatible storage)
**Evidence Required:** Photo uploaded with GPS coordinates extracted and stored

---

#### Feature 3: Form Submission Workflow

**As a** construction foreman
**I need** to fill out forms on my mobile device with auto-save
**So that** I never lose work and can submit instantly when connectivity returns

**Acceptance Criteria:**

1. GraphQL mutation `createFormSubmission(input: CreateSubmissionInput)` implemented
2. JSONB field for dynamic form data (flexible schema per template)
3. Status workflow: draft → in_progress → submitted → approved
4. Required field validation (server-side, fail fast)
5. Digital signature capture (base64 string, timestamp, user metadata)

**Technical Approach:**

- **Schema:** `form_submissions` table with JSONB `data` column
- **Validation:** Zod schema generated from form template definition
- **Workflow:** State machine pattern (draft → in_progress → submitted → approved)
- **Signatures:** Stored as base64 strings with cryptographic hash for tamper detection
- **Audit Trail:** Immutable log of all status changes (who, when, reason)

**Priority:** P0 (Core submission flow)
**Estimated Complexity:** Medium (4-8 hours)
**Dependencies:** Feature 1 (form templates must exist)
**Evidence Required:** Form submission saved as draft, then completed and approved

---

#### Feature 4: Forms Testing Infrastructure

**As a** developer
**I need** comprehensive test coverage for forms engine
**So that** we maintain quality as features grow and prevent regressions

**Acceptance Criteria:**

1. Unit tests for form validation logic (Zod schemas, field types, conditional logic)
2. Integration tests for GraphQL resolvers (CRUD operations, auth, multi-tenancy)
3. E2E tests for form builder workflow (create template, fill form, submit)
4. Test coverage increases to 60% (from 40% baseline)
5. TDD workflow documentation (tests first, then implementation)

**Technical Approach:**

- **Unit Tests:** Jest for backend validation logic (target 80% coverage)
- **Integration Tests:** Jest + Supertest for GraphQL API (mock Clerk auth)
- **E2E Tests:** Playwright for critical user flows (form creation, submission)
- **Coverage Reporting:** Istanbul + CodeCov integration
- **TDD Process:** Write failing tests first (red phase), implement (green phase)

**Priority:** P0 (Quality gate - non-negotiable)
**Estimated Complexity:** Medium (4-8 hours)
**Dependencies:** Features 1-3 (test targets)
**Evidence Required:** Coverage report showing 60% overall, 80% for new forms code

---

### P1 Features (Important - High Business Value)

#### Feature 5: Form Template Library (5-10 Templates)

**As a** construction foreman
**I need** pre-built form templates for common construction tasks
**So that** I can start using the platform immediately without creating forms from scratch

**Acceptance Criteria:**

1. 5-10 construction form templates created and seeded into database
2. Templates organized by category: daily logs, safety, quality, equipment
3. Each template includes: field definitions, validation rules, mobile-optimized layout
4. Templates cloneable and customizable per project
5. Usage analytics tracked (which templates used most frequently)

**Template List (10 Templates - MVP Set):**

**Daily Logs Category (2 templates):**

1. General Daily Log (weather, crew, hours, activities, issues)
2. Superintendent Daily Report (progress, deliveries, visitors, photos)

**Safety Inspection Category (3 templates):** 3. General Site Safety Inspection (PPE, hazards, corrective actions) 4. Toolbox Talk Sign-In (topic, attendees, signatures, photos) 5. Incident Report (injury details, witness statements, photos, corrective actions)

**Quality Control Category (2 templates):** 6. General Quality Inspection (work type, pass/fail, deficiencies, photos) 7. Concrete Pour Inspection (mix design, temperature, slump test, photos)

**Equipment Category (2 templates):** 8. Daily Equipment Inspection (equipment ID, condition, maintenance needs, photos) 9. Equipment Delivery Receipt (delivery details, quantities, condition, photos)

**Environmental Compliance Category (1 template - BONUS):** 10. SWPPP Weekly Inspection (BMP status, maintenance needs, photos, compliance notes)

**Technical Approach:**

- **Seed Script:** TypeScript seed file in `apps/backend/prisma/templates.seed.ts`
- **Template Format:** JSON schema matching form_templates table structure
- **Validation:** Ensure each template passes Zod validation before seeding
- **Documentation:** Template usage guide for administrators
- **Testing:** Verify templates load correctly in mobile UI

**Priority:** P1 (High business value - immediate usability)
**Estimated Complexity:** Medium (4-8 hours)
**Dependencies:** Feature 1 (form builder API must exist)
**Evidence Required:** Screenshot of 10 templates in database, mobile UI rendering test

---

#### Feature 6: Architecture Review & Optimization

**As a** DevOps engineer
**I need** to review container architecture and separation of concerns
**So that** our infrastructure scales efficiently and maintains clean boundaries

**Acceptance Criteria:**

1. Backend container size analyzed and optimized (multi-stage build, remove dev dependencies)
2. Web container Dockerfile reviewed (standalone build, production-ready)
3. Service boundaries documented (backend, web, mobile, database, redis, minio)
4. Resource limits defined (CPU, memory for each service)
5. Separation of concerns validated (no business logic in web, API calls only)

**Technical Approach:**

- **Container Analysis:** Review Dockerfiles in `infrastructure/docker/`
- **Multi-Stage Builds:** Separate build and runtime stages (reduce image size 50-70%)
- **Dependency Audit:** Remove dev dependencies from production images
- **Resource Planning:** Define CPU/memory limits for Kubernetes deployments
- **Documentation:** Architecture diagram updated with service boundaries

**Architecture Review Checklist:**

- [ ] Backend image size <500MB (currently unknown, likely 1GB+)
- [ ] Web image size <300MB (standalone Next.js build)
- [ ] Multi-stage builds implemented (builder → runner stages)
- [ ] Dev dependencies excluded from production images
- [ ] Health check endpoints implemented (/health, /readiness)
- [ ] Kubernetes resource limits defined (CPU: 500m-2000m, Memory: 512Mi-4Gi)
- [ ] Service boundaries clear (backend API, web UI, no business logic in frontend)

**Priority:** P1 (Infrastructure efficiency)
**Estimated Complexity:** Medium (4-8 hours)
**Dependencies:** Sprint 1 Kubernetes deployment
**Evidence Required:** Before/after container size comparison, architecture diagram

---

### P2 Features (Desirable - Time Permitting)

#### Feature 7: Form Builder Web UI (Basic)

**As a** project administrator
**I need** a web interface to create forms visually
**So that** I don't need to use GraphQL Playground for form creation

**Acceptance Criteria:**

1. Basic form builder page at `/admin/forms/new`
2. Add field UI (select field type, enter label, set required flag)
3. Field list with drag-to-reorder capability
4. Form preview pane (show how form looks on mobile)
5. Save as draft functionality (persist incomplete forms)

**Technical Approach:**

- **UI Framework:** Mantine v7 components (form inputs, drag-and-drop)
- **State Management:** Valtio for form builder state
- **Drag-and-Drop:** dnd-kit library for field reordering
- **Preview:** Mobile viewport simulation (375px width, iOS/Android styles)
- **API Integration:** Call createFormTemplate mutation from Feature 1

**Priority:** P2 (Nice to have - GraphQL Playground sufficient for MVP)
**Estimated Complexity:** Large (8-12 hours)
**Dependencies:** Feature 1 (backend API)
**Evidence Required:** Screenshot of form builder UI with 5+ fields, mobile preview

---

#### Feature 8: Photo Gallery View

**As a** project manager
**I need** to view all photos for a project organized by date and form type
**So that** I can quickly review site documentation

**Acceptance Criteria:**

1. Photo gallery page at `/projects/{id}/photos`
2. Filter by date range (last 7 days, 30 days, custom)
3. Filter by form type (daily logs, inspections, safety)
4. Thumbnail grid view (lazy loading for performance)
5. Click to view full-resolution photo with metadata (GPS, timestamp, form link)

**Technical Approach:**

- **UI:** Mantine Grid component with lazy loading (react-virtualized)
- **API:** GraphQL query `photosByProject(projectId, filters)`
- **Thumbnail Generation:** AWS Lambda resize on upload (S3 → Lambda → thumbnails bucket)
- **Map Integration:** Google Maps API for GPS location preview
- **Performance:** Paginated results (50 photos per page)

**Priority:** P2 (Nice to have - core photo upload more important)
**Estimated Complexity:** Medium (4-8 hours)
**Dependencies:** Feature 2 (photo API)
**Evidence Required:** Screenshot of photo gallery with 20+ photos, filter working

---

### Sprint 1 Carryover Issues (Must Address)

#### Carryover 1: ISSUE-041 - Lighthouse PWA Audit

**Issue:** Production build uses `output: 'standalone'` which breaks `next start` command
**Blocker:** Cannot run Lighthouse PWA audit without proper container setup
**Resolution Required:**

1. Deploy web container to Kubernetes with standalone build
2. Access web app via NodePort (http://localhost:30102)
3. Run Lighthouse audit against running container
4. Test offline mode with service worker active
5. Verify IndexedDB persistence works as expected

**Priority:** P1 (PWA validation important)
**Estimated Complexity:** Small (2-4 hours)
**Evidence Required:** Lighthouse PWA score report, service worker active screenshot

---

#### Carryover 2: BLOCKER-001 - TanStack Query Version Lock

**Issue:** Package.json specifies ^5.14.2, actually running 5.90.2 (72 versions difference)
**Risk:** Breaking changes in minor versions, unpredictable production behavior
**Resolution Required:**

1. Lock package.json to exact version 5.90.0 (no caret)
2. Verify pnpm-lock.yaml matches
3. Test all TanStack Query features after lock
4. Document rationale for version lock

**Priority:** P0 (Production stability risk)
**Estimated Complexity:** Small (2-4 hours)
**Evidence Required:** package.json updated, all tests passing

---

#### Carryover 3: BLOCKER-002 - Valtio Store Integration Tests

**Issue:** Query client has hard dependency on Valtio store exports
**Risk:** Runtime failures if store missing or incomplete
**Resolution Required:**

1. Create integration tests for query client + store interaction
2. Test offline queue scenarios (add, process, fail, retry)
3. Document store contract in JSDoc
4. Verify all required exports exist and functional

**Priority:** P0 (Core offline functionality)
**Estimated Complexity:** Small (2-4 hours)
**Evidence Required:** Integration test suite passing, JSDoc documentation

---

#### Carryover 4: BLOCKER-007 - Dashboard Pre-rendering Fix

**Issue:** Next.js 14 attempts to pre-render /dashboard page, but Clerk useAuth requires runtime
**Blocker:** Build fails with exit code 1
**Resolution Required:**

1. Research Next.js 14 App Router dynamic rendering patterns
2. Options: Dynamic imports, route groups, middleware redirect, or remove pre-rendering
3. Test solution doesn't break Clerk authentication flow
4. Verify build succeeds with exit code 0

**Priority:** P0 (Blocks build completion)
**Estimated Complexity:** Medium (4-8 hours)
**Evidence Required:** Build succeeds, dashboard page loads with Clerk auth

---

## Sprint 2 Objectives and Success Metrics

### Sprint Objectives

1. **Launch Core Forms Engine MVP** - Enable administrators to create custom forms via API
2. **Photo Documentation Integration** - Seamless camera integration with GPS tagging
3. **Form Template Library** - 10 construction templates ready for immediate use
4. **Quality Assurance** - Test coverage 60%, TDD workflow established
5. **Infrastructure Optimization** - Container architecture reviewed and optimized

### Success Metrics

**Product Metrics:**

- [ ] Admins can create custom form in <15 minutes (via GraphQL Playground)
- [ ] Foremen can fill form with 5 photos on mobile in <10 minutes (manual test)
- [ ] 10 construction templates created and seeded (daily logs, safety, quality, equipment)
- [ ] Form submission workflow functional (draft → submitted → approved)
- [ ] Photo upload with GPS EXIF extraction working

**Technical Metrics:**

- [ ] Test coverage 60% overall (from 40% baseline)
- [ ] Forms module test coverage 80% (unit + integration)
- [ ] Backend container size <500MB (multi-stage build)
- [ ] Web container deployed to Kubernetes (standalone build)
- [ ] All Sprint 1 carryover blockers resolved

**Quality Metrics:**

- [ ] Zero emoji violations in code/commits
- [ ] All evidence collected in `docs/sprints/sprint2/evidence/`
- [ ] TDD workflow documented (tests first, then implementation)
- [ ] Multi-tenant isolation verified (Clerk orgId filtering)
- [ ] Photo storage hybrid strategy validated (<100KB PostgreSQL, >100KB S3)

**Business Impact Metrics:**

- [ ] Forms-first positioning maintained (80% forms, 20% compliance)
- [ ] Forms Manager Frank (primary persona) can complete daily log in <10 minutes
- [ ] Template library covers 70% of common construction forms
- [ ] Photo documentation seamless (no manual organization required)

---

## Risk Assessment and Mitigation Strategies

### Technical Risks

**Risk 1: JSONB Schema Complexity**

- **Probability:** Medium
- **Impact:** High (core forms engine functionality)
- **Mitigation:**
  - Start with simple field types (text, number, date) before advanced (conditional logic)
  - Comprehensive Zod validation schemas
  - Integration tests for schema validation edge cases
  - Document JSONB structure with examples

**Risk 2: Photo Upload Performance**

- **Probability:** Medium
- **Impact:** Medium (user experience degradation)
- **Mitigation:**
  - Image compression before upload (85% quality)
  - Presigned S3 URLs for mobile direct upload (bypass backend bottleneck)
  - Chunked upload for large files (5MB+ photos)
  - Progress indicators for upload status
  - Background upload queue with retry logic

**Risk 3: Next.js Pre-rendering Blocker**

- **Probability:** High (already discovered in Sprint 1)
- **Impact:** High (blocks build, prevents deployment)
- **Mitigation:**
  - Allocate full 4-8 hours for research and testing
  - Consult Next.js 14 App Router + Clerk integration docs
  - Test multiple solutions (dynamic imports, route groups, middleware)
  - Fallback: Remove pre-rendering entirely if necessary

### Scope Risks

**Risk 4: Feature Creep (Form Builder UI)**

- **Probability:** Medium
- **Impact:** Medium (sprint goal distraction)
- **Mitigation:**
  - Form Builder UI marked P2 (time permitting)
  - GraphQL Playground sufficient for MVP (admins can create forms)
  - Focus on API completeness before UI polish
  - Defer advanced UI features to Sprint 3

**Risk 5: Template Quality**

- **Probability:** Low
- **Impact:** Medium (user adoption, template usability)
- **Mitigation:**
  - Research industry-standard forms (OSHA, EPA templates)
  - Interview beta customers for real-world form requirements
  - Mobile-optimize layouts (large touch targets, minimal typing)
  - Test templates on actual mobile devices (iOS, Android)

### Quality Risks

**Risk 6: Test Coverage Gap**

- **Probability:** Medium
- **Impact:** High (quality regression, production bugs)
- **Mitigation:**
  - Allocate dedicated time for testing (Feature 4)
  - TDD workflow enforced (tests first, then implementation)
  - Code review checklist includes test coverage verification
  - Automated coverage reports in CI/CD

**Risk 7: Multi-Tenant Data Leakage**

- **Probability:** Low
- **Impact:** CRITICAL (regulatory violation, lawsuits)
- **Mitigation:**
  - Explicit cross-tenant access tests (must fail)
  - Three-layer defense: Clerk JWT, Prisma middleware, PostgreSQL RLS
  - Code review focused on orgId filtering
  - Integration tests for multi-org scenarios

---

## Handoff Notes for Project Manager

### Sprint 2 Planning Recommendations

**Breakdown into 25 Issues:**

**Phase 1: Backend Forms Engine (Issues 1-8, ~16 hours total)**

1. ISSUE-048: Create form_templates schema and migration (2 hours)
2. ISSUE-049: Implement form template CRUD resolvers (2 hours)
3. ISSUE-050: Zod validation for 8 field types (2 hours)
4. ISSUE-051: Form versioning system (2 hours)
5. ISSUE-052: Unit tests for form validation (2 hours)
6. ISSUE-053: Integration tests for CRUD operations (2 hours)
7. ISSUE-054: Multi-tenant isolation tests (2 hours)
8. ISSUE-055: GraphQL Playground documentation (2 hours)

**Phase 2: Photo Documentation (Issues 9-14, ~12 hours total)** 9. ISSUE-056: Photo upload GraphQL mutation (2 hours) 10. ISSUE-057: EXIF data extraction logic (2 hours) 11. ISSUE-058: Hybrid storage decision tree (<100KB PostgreSQL, >100KB S3) (2 hours) 12. ISSUE-059: Image compression implementation (2 hours) 13. ISSUE-060: Photo metadata storage schema (2 hours) 14. ISSUE-061: Photo upload integration tests (2 hours)

**Phase 3: Form Submission Workflow (Issues 15-18, ~10 hours total)** 15. ISSUE-062: Form submission schema and migration (2 hours) 16. ISSUE-063: Submission CRUD resolvers (2 hours) 17. ISSUE-064: Status workflow state machine (3 hours) 18. ISSUE-065: Digital signature capture (3 hours)

**Phase 4: Template Library (Issues 19-21, ~8 hours total)** 19. ISSUE-066: Create 10 construction templates (JSON schemas) (4 hours) 20. ISSUE-067: Template seed script (2 hours) 21. ISSUE-068: Template mobile UI rendering tests (2 hours)

**Phase 5: Architecture Review (Issues 22-24, ~8 hours total)** 22. ISSUE-069: Backend container optimization (multi-stage build) (3 hours) 23. ISSUE-070: Web container Dockerfile review (2 hours) 24. ISSUE-071: Kubernetes resource limits definition (3 hours)

**Phase 6: Sprint 1 Carryover (Issues 25-28, ~14 hours total)** 25. ISSUE-072: BLOCKER-001 - TanStack Query version lock (2 hours) 26. ISSUE-073: BLOCKER-002 - Valtio store integration tests (2 hours) 27. ISSUE-074: BLOCKER-007 - Dashboard pre-rendering fix (4-6 hours) 28. ISSUE-075: ISSUE-041 - Lighthouse PWA audit (2 hours)

**Phase 7: Optional (Time Permitting, Issues 29-30)** 29. ISSUE-076: Form Builder Web UI (basic) (8-12 hours - P2) 30. ISSUE-077: Photo Gallery View (4-8 hours - P2)

**Total Estimated Time:** 68-70 hours (34-35 hours per week for 2-person team)

### Task Sizing Guidelines

- **Small (2-4 hours):** Single API endpoint, schema migration, unit test suite
- **Medium (4-8 hours):** Feature module with CRUD operations, integration tests, documentation
- **Large (8-12 hours):** Complex workflow engine, UI component with state management, E2E testing

### Sprint Capacity Planning

**Assumptions:**

- 2-person development team (1 backend, 1 full-stack)
- 2-week sprint (10 working days)
- 70% productive time (30% meetings, reviews, blockers)
- 35 hours productive time per developer per sprint

**Recommended Allocation:**

- Backend Developer: Issues 1-8, 9-14, 19-21 (36 hours - forms engine, photos, templates)
- Full-Stack Developer: Issues 15-18, 22-24, 25-28 (32 hours - submissions, architecture, carryover)
- Optional (if ahead of schedule): Issues 29-30 (P2 features)

### Critical Path

**Sequential Dependencies:**

1. ISSUE-048 (schema) → ISSUE-049 (resolvers) → ISSUE-050 (validation) → ISSUE-052 (tests)
2. ISSUE-056 (photo API) → ISSUE-057 (EXIF) → ISSUE-058 (storage) → ISSUE-061 (tests)
3. ISSUE-062 (submission schema) → ISSUE-063 (resolvers) → ISSUE-064 (workflow) → ISSUE-065 (signatures)
4. ISSUE-066 (templates) → ISSUE-067 (seed) → ISSUE-068 (tests)
5. ISSUE-074 (pre-rendering fix) MUST complete before build verification

**Parallel Work Possible:**

- Backend forms engine (Issues 1-8) can run parallel to photo documentation (Issues 9-14)
- Template creation (Issue 19) can start once schema exists (after ISSUE-048)
- Architecture review (Issues 22-24) can run parallel to any backend work

### Daily Standup Focus

**Week 1 (Oct 14-18):**

- Monday: Sprint planning, assign issues, carryover blocker review
- Tuesday-Friday: Forms engine progress, photo API progress, blocker resolution

**Week 2 (Oct 21-25):**

- Monday-Tuesday: Template library completion, submission workflow testing
- Wednesday: Architecture review findings, container optimization
- Thursday: Integration testing, evidence collection
- Friday: Sprint review, demo to stakeholders, retrospective

### Sprint Review Preparation

**Demo Flow (30 minutes):**

1. Show GraphQL Playground creating custom form template (5 min)
2. Demonstrate photo upload with GPS EXIF extraction (5 min)
3. Walk through 10 construction templates (5 min)
4. Show form submission workflow (draft → submitted) (5 min)
5. Present test coverage report (60% overall) (5 min)
6. Container optimization results (before/after size comparison) (5 min)

**Stakeholder Invites:**

- Product Owner (required)
- Beta customer representatives (2-3 construction foremen)
- Engineering leadership
- QA team

### Evidence Collection Requirements

**Per Issue:**

- Code committed to Git (no emoji, no AI branding)
- Tests passing (screenshot or CI/CD log)
- Manual testing evidence (screenshots, API responses)
- Evidence saved to `docs/sprints/sprint2/evidence/ISSUE-###/`

**Sprint-Level Evidence:**

- Test coverage report (60% overall, 80% forms module)
- Container size comparison (before/after optimization)
- GraphQL schema documentation
- Template library screenshots (10 templates)
- Photo upload with GPS EXIF (actual photo metadata)

### Risk Escalation Triggers

**Escalate to Product Owner if:**

- BLOCKER-007 (pre-rendering fix) takes >6 hours (deadline: Wednesday Week 1)
- Test coverage <50% by end of Week 1
- Photo upload performance <5 seconds per 5MB image
- Multi-tenant isolation tests failing

**Escalate to Project Manager if:**

- Sprint 1 carryover blockers not resolved by end of Week 1
- Template quality concerns raised by beta customers
- Container optimization not achieving 50% size reduction

### Sprint Success Criteria (Gate Checklist)

**Must Complete (Non-Negotiable):**

- [ ] Form templates CRUD API functional (Features 1, 3)
- [ ] Photo upload with GPS EXIF extraction working (Feature 2)
- [ ] 10 construction templates created and seeded (Feature 5)
- [ ] Test coverage 60% overall, 80% forms module (Feature 4)
- [ ] All Sprint 1 carryover blockers resolved (BLOCKER-001, 002, 007, ISSUE-041)

**Should Complete (High Priority):**

- [ ] Form submission workflow functional (draft → submitted → approved)
- [ ] Container architecture optimized (backend <500MB, web deployed)
- [ ] Multi-tenant isolation verified (cross-tenant tests passing)
- [ ] Photo storage hybrid strategy validated (<100KB PostgreSQL, >100KB S3)

**Nice to Have (Time Permitting):**

- [ ] Form Builder Web UI (basic drag-and-drop)
- [ ] Photo Gallery View (thumbnail grid, filtering)
- [ ] Advanced form validation (conditional logic)

---

## Appendix A: Forms-First Positioning Alignment

**This Sprint Supports 80/20 Forms/Compliance Split:**

**Forms-First Features (80% of sprint effort):**

1. Dynamic Form Builder Backend (12 hours) - PRIMARY VALUE PROP
2. Photo Documentation System (12 hours) - PRIMARY VALUE PROP
3. Form Submission Workflow (10 hours) - PRIMARY VALUE PROP
4. Form Template Library (8 hours) - PRIMARY VALUE PROP
5. Form Builder Web UI (optional 8-12 hours) - PRIMARY VALUE PROP

**Total Forms Focus:** 42-54 hours (80-85% of sprint)

**Compliance Features (20% of sprint effort):**

- Template 10: SWPPP Weekly Inspection (included in 10-template set)
- EPA compliance is BONUS, not primary focus

**Total Compliance Focus:** <2 hours (3% of sprint - appropriate positioning)

**Infrastructure/Quality (15% of sprint effort):**

- Testing infrastructure (8 hours)
- Architecture review (8 hours)
- Sprint 1 carryover (14 hours)

**Forms Manager Frank (Primary Persona) Benefits:**

- Can create custom daily log form in <15 minutes (Feature 1)
- Can fill daily log with 5 photos in <10 minutes (Features 2, 3)
- Has 10 templates immediately available (Feature 5)
- Photos auto-attach to form fields (Feature 2 - no manual organization)

**Compliance Carlos (Tertiary Persona) Benefits:**

- SWPPP template included (1 of 10 templates - 10% of library)
- Weather triggers deferred to Sprint 7-8 (per PRD roadmap)

---

## Appendix B: PRD Alignment Verification

**PRD Month 2-3 Requirements (Core Forms Engine):**

- [ ] Dynamic form builder (drag-and-drop interface) - **Sprint 2: Backend API (P0), UI (P2 optional)**
- [ ] 15+ field types - **Sprint 2: 8 field types (MVP), expand to 15+ in Sprint 3**
- [ ] Form validation (required fields, data type checking) - **Sprint 2: Zod validation (P0)**
- [ ] Mobile-optimized form rendering - **Sprint 3 (mobile UI focus)**
- [ ] Auto-save every 30 seconds - **Sprint 3 (mobile offline capability)**
- [ ] Form submission workflow - **Sprint 2: Backend workflow (P0)**

**PRD Month 3-4 Requirements (Photo Documentation + Templates):**

- [ ] Photo capture within forms - **Sprint 2: Backend API (P0), Mobile UI Sprint 3**
- [ ] GPS EXIF tagging and timestamping - **Sprint 2: EXIF extraction (P0)**
- [ ] Photo annotation tools - **Sprint 3 (mobile UI)**
- [ ] Hybrid photo storage (PostgreSQL + S3) - **Sprint 2: Storage strategy (P0)**
- [ ] 20+ construction form templates - **Sprint 2: 10 templates (MVP), expand to 20+ Sprint 3-4**

**Sprint 2 Progress Against PRD Roadmap:**

- **On Track:** Core forms engine backend (Months 2-3 deliverable)
- **Ahead of Schedule:** Photo documentation API (Month 3-4 deliverable, starting in Sprint 2)
- **Right Scope:** 10 templates (50% of 20-template target - iterative approach)

---

## Appendix C: Competitive Positioning Validation

**Sprint 2 Deliverables vs Competitors:**

**vs. Procore ($375-549/month):**

- BrAve Advantage: Forms-focused API ($24-49/user vs $375-549 flat fee)
- Sprint 2 Parity: Custom form creation, photo integration
- BrAve Better: Construction-native templates (10 ready-made forms)

**vs. SafetyCulture ($24/user - Direct Competitor):**

- BrAve Advantage: Construction-specific templates (SWPPP, concrete inspection)
- Sprint 2 Parity: Photo documentation, form builder API
- BrAve Better: GPS EXIF auto-tagging (SafetyCulture requires manual location)

**vs. PlanGrid/Autodesk Build ($165/user):**

- BrAve Advantage: 3x cheaper, better forms focus
- Sprint 2 Parity: Photo workflows, custom forms
- BrAve Trade-off: No drawing markup (PlanGrid specialty)

**Sprint 2 Competitive Strategy:**

1. Launch forms engine MVP FAST (2 weeks vs 6-month competitor cycles)
2. Construction-native templates DAY ONE (10 templates vs generic tools)
3. Photo integration seamless (GPS auto-tag vs manual data entry)
4. API-first approach (enables future integrations with Procore/PlanGrid)

---

**Product Owner Sign-Off:**

I hereby approve Sprint 2 Feature Priorities with the following understanding:

- **Primary Goal:** Launch Core Forms Engine MVP (backend API + 10 templates)
- **Success Criteria:** Admins create forms in <15 minutes, foremen fill forms in <10 minutes
- **Forms-First Alignment:** 80% sprint effort on forms features, <5% on compliance
- **Quality Gate:** 60% test coverage, zero multi-tenant data leakage
- **Carryover Blockers:** ALL Sprint 1 blockers resolved by end of Week 1

**Signature:** ********\_\_\_\_********
**Date:** 2025-10-02

---

**Last Updated:** 2025-10-02
**Next Review:** Sprint 2 Planning (October 14, 2025)
**Maintained By:** Product Owner
