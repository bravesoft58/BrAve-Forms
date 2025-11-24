# Sprint 3 Master Plan - Complete Forms UI with Navigation (Single-Tenant)

**Created:** 2025-10-23
**Updated:** 2025-10-23 (EXPANDED with navigation layer)
**Sprint Duration:** November 2025 (4 weeks)
**Sprint Goal:** Complete navigation layer + forms filling UI for Q&D Construction MVP
**Business Value:** Full user-facing application with navigation, dashboard, projects, and forms - proving product-market fit with first customer
**Velocity Target:** 38 issues (80 hours total)

## Sprint Objectives

1. **Navigation Layer** - AppShell, navigation components, breadcrumbs, routing structure
2. **Core Pages** - Dashboard home, projects list, project detail with tabs
3. **Single-Tenant Simplification** - Hard-code orgId to "org_qd_default" for Q&D Construction
4. **Dynamic Form Renderer** - Render 15 field types from JSON schema
5. **Form Filling Workflow** - Mobile and web form submission with photos and signatures
6. **Form Cloning** - "Copy Yesterday's Log" feature for daily forms
7. **Testing & Polish** - E2E tests, offline tests, completion report

## Strategic Context

Sprint 3 completes the FULL Forms Filling UI for Q&D Construction as the first paying customer. This sprint EXPANDS on the original plan by adding the complete navigation layer - without this, users cannot reach forms.

**Original Plan Gap:** Sprint 3 only had FormRenderer (form filling component) but missing:

- NO navigation (users can't navigate to forms)
- NO dashboard (no entry point)
- NO projects list (can't select which project)
- NO breadcrumbs (users lost in navigation)

**Expanded Plan:** Adds 14 navigation/UI issues (28 hours) to create complete user experience.

**Sprint 2 Foundation:**

- Backend: Forms engine COMPLETE (8/8 issues), Photos COMPLETE (6/6 issues), Submissions COMPLETE (4/4 issues)
- Frontend: FormBuilder exists (Phase 1), FormRenderer MISSING (critical gap)
- Templates: 11 construction templates created (6 match Q&D forms)
- Progress: 24/27 issues complete (89%)

**Single-Tenant Approach:**

- Keep database schema fields (orgId, multi-tenant indexes) for future migration
- Hard-code DEFAULT_ORG_ID = 'org_qd_default' in backend constants
- Disable Clerk Organizations feature (simple user login only)
- Remove organization switcher UI from frontend
- Sprint 5-6 will re-enable multi-tenancy with zero data migration

**Branding Clarification:**

- Product remains "BrAve Forms" (not renamed to Q&D Forms)
- Q&D Construction is first user, not owner
- Multi-tenant architecture preserved for future customers

## 38 Issues Breakdown

### Phase 1: Navigation Layer (8 issues, 16h) - NEW

**ISSUE-076: Create AppShell Layout Component (2h)** - P0

- Build Mantine AppShell with header, navbar, main content
- Configure responsive breakpoints (mobile/desktop)
- Add offline banner placement
- Implement theme provider with construction colors
- Dependencies: Sprint 2 complete
- Success: AppShell renders with header and navbar slots

**ISSUE-077: Build AppHeader Component (2h)** - P0

- BrAve Forms logo (top-left)
- User navigation dropdown (top-right)
- Offline sync indicator
- Mobile hamburger menu toggle
- Dependencies: ISSUE-076
- Success: Header functional on mobile and desktop

**ISSUE-078: Build AppNavbar Component (2h)** - P0

- Desktop: Sidebar navigation (Dashboard, Projects, Forms, Settings)
- Mobile: Bottom navigation (5 tabs with icons)
- Active route highlighting
- Glove-friendly touch targets (48x48dp minimum)
- Dependencies: ISSUE-077
- Success: Navigation renders and routes correctly

**ISSUE-079: Build DashboardNav Component (2h)** - P0

- Quick actions widget (New Form, New Project)
- Weather alerts banner
- Pending tasks counter
- Recent activity feed
- Dependencies: ISSUE-078
- Success: Dashboard navigation functional

**ISSUE-080: Build UserNav Dropdown (1h)** - P0

- User profile menu (Settings, Sign Out)
- Display current user name/email
- Sync status indicator
- Dependencies: ISSUE-077
- Success: User menu functional

**ISSUE-081: Build OfflineBanner Component (1h)** - P0

- Display when offline (You are offline)
- Show pending sync count
- Auto-hide when online
- Sync button (manual trigger)
- Dependencies: ISSUE-076
- Success: Offline banner shows/hides correctly

**ISSUE-082: Build PageContainer Component (2h)** - P0

- Consistent page layout (title, actions, content)
- Breadcrumb navigation integration
- Loading skeleton states
- Error boundary wrapper
- Dependencies: ISSUE-076
- Success: Page container reusable across routes

**ISSUE-083: Build Breadcrumbs Component (2h)** - P0

- Dynamic breadcrumb generation from route
- Home > Projects > Project Name > Forms
- Click to navigate up hierarchy
- Mobile: Show only last 2 crumbs
- Dependencies: ISSUE-082
- Success: Breadcrumbs functional on all pages

### Phase 2: Core Pages (6 issues, 12h) - NEW

**ISSUE-084: Build Dashboard Home Page (2h)** - P0

- Welcome message with user name
- Weather alerts widget (if rain >= 0.25")
- Pending tasks list (inspections due today)
- Quick actions (New Form, View Projects)
- Recent activity feed (last 5 submissions)
- Dependencies: Phase 1 complete
- Success: Dashboard renders with real data

**ISSUE-085: Build Projects List Page (2h)** - P0

- Grid view of all projects (cards)
- Filter: Active, Favorites, Archived
- Search by project name/address
- New Project button
- Empty state (No projects yet)
- Dependencies: ISSUE-084
- Success: Projects list functional with filters

**ISSUE-086: Build ProjectCard Component (1h)** - P0

- Project name, address, status
- Weather icon if rain alert
- Pending tasks counter
- Click to navigate to project detail
- Dependencies: ISSUE-085
- Success: Project cards render correctly

**ISSUE-087: Build Project Detail Page (3h)** - P0

- Project header (name, address, edit button)
- Tabs: Forms, Photos, Team, Weather, Compliance
- Forms tab: Template selector, submitted forms list
- Mobile: Swipeable tabs
- Dependencies: ISSUE-086
- Success: Project detail with tabs functional

**ISSUE-088: Build Template Selector Component (2h)** - P0

- Grid of available form templates
- Filter by category (Daily Logs, Inspections, Safety)
- Search templates by name
- Click template to fill form
- Dependencies: ISSUE-087
- Success: Template selector functional

**ISSUE-089: Build Submitted Forms List (2h)** - P0

- List all submitted forms for project
- Filter by date range, template, status
- Sort by date (newest first)
- Click to view submission details
- Empty state (No forms yet)
- Dependencies: ISSUE-088
- Success: Forms list functional

### Phase 3: Single-Tenant Simplification (3 issues, 4h) - RENUMBERED from Phase 0

**ISSUE-090: Remove Organization Switching UI (1h)** - P0

- Remove OrganizationSelector component from navigation
- Delete select-organization page
- Update dashboard to remove org dropdown
- Dependencies: Phase 2 complete
- Success: UI simplified, no org switching visible

**ISSUE-091: Hard-Code Default Organization ID (2h)** - P0

- Add DEFAULT_ORG_ID = 'org_qd_default' constant
- Update all resolvers to use default org
- Update frontend API helpers
- Seed default org in database
- Dependencies: ISSUE-090
- Success: All API calls use org_qd_default

**ISSUE-092: Simplify Clerk Authentication (1h)** - P0

- Disable Organizations in Clerk dashboard
- Remove org context from JWT claims
- Update ClerkAuthGuard to skip org validation
- Test simple user login flow
- Dependencies: ISSUE-091
- Success: User login without org selection

### Phase 4: Dynamic Form Renderer (6 issues, 14h) - RENUMBERED from Phase 1

**ISSUE-093: Build FormRenderer Component (4h)** - P0

- Create FormRenderer.tsx component
- Accept JSON schema as props
- Render form sections and fields
- Handle field state with React Hook Form
- Dependencies: Phase 3 complete
- Success: Basic form renders from JSON

**ISSUE-094: Implement 15 Field Types (5h)** - P0

- Text, textarea, number, date, time fields
- Select, radio, checkbox, checkboxes
- Photo upload, signature, GPS location
- Repeater (dynamic lists), file upload, computed
- Dependencies: ISSUE-093
- Success: All 15 field types render correctly

**ISSUE-095: Conditional Display Logic (2h)** - P1

- Show/hide fields based on values
- Watch field changes with React Hook Form
- Update visibility dynamically
- Dependencies: ISSUE-094
- Success: Conditional logic functional

**ISSUE-096: Computed Fields (2h)** - P1

- Auto-calculate SUM, COUNT, AVERAGE
- Template variables ({{currentDate}})
- Update on field change
- Dependencies: ISSUE-095
- Success: Computed fields update correctly

**ISSUE-097: Form Validation (1h)** - P0

- Required field validation
- Min/max validation
- Pattern validation (regex)
- Custom error messages
- Dependencies: ISSUE-096
- Success: Validation prevents invalid submission

**ISSUE-098: Auto-Save Draft Functionality (1h)** - P1

- Save draft to IndexedDB every 30 seconds
- Load draft on form open
- Clear draft on submit
- Dependencies: ISSUE-097
- Success: Draft persists across browser refresh

### Phase 5: Form Submission Workflow (6 issues, 14h) - RENUMBERED from Phase 2

**ISSUE-099: Mobile Form Filling Page (4h)** - P0

- Create /forms/[templateId]/fill route
- Mobile-optimized layout
- Capacitor camera integration
- Large touch targets (glove-friendly)
- Dependencies: Phase 4 complete
- Success: Mobile form renders and submits

**ISSUE-100: Web Form Filling Page (3h)** - P0

- Desktop-optimized layout
- File upload for photos
- Keyboard shortcuts
- Print preview
- Dependencies: ISSUE-099
- Success: Web form renders and submits

**ISSUE-101: Photo Attachment to Form Fields (2h)** - P0

- Camera button in photo fields
- GPS EXIF extraction
- Photo thumbnail preview
- Delete/retake photo
- Dependencies: ISSUE-100
- Success: Photos attach to correct fields

**ISSUE-102: Signature Capture Integration (2h)** - P0

- Canvas-based signature pad
- Save as PNG
- Timestamp signature
- Clear/redo signature
- Dependencies: ISSUE-101
- Success: Signature captured and stored

**ISSUE-103: Form Submission Confirmation (1h)** - P0

- Submit form mutation
- Success/error toast
- Redirect to submission view
- Offline queue if no network
- Dependencies: ISSUE-102
- Success: Form submits successfully

**ISSUE-104: Submission Detail View (2h)** - P1

- View submitted form (read-only)
- Display all field values
- Show attached photos
- Show signature
- Print/export PDF
- Dependencies: ISSUE-103
- Success: Submission viewable

### Phase 6: Form Cloning (4 issues, 8h) - RENUMBERED from Phase 3

**ISSUE-105: SubmissionCloningService (2h)** - P1

- Create cloneSubmission() method
- Copy field values to new submission
- Reset date/signature fields
- Set status to draft
- Dependencies: Phase 5 complete
- Success: Cloning logic functional

**ISSUE-106: "Copy Yesterday's Log" Button (2h)** - P1

- Add button to submission list
- Clone yesterday's submission
- Open in form renderer
- Dependencies: ISSUE-105
- Success: Yesterday's log cloneable

**ISSUE-107: "Use as Template" Feature (2h)** - P1

- Clone any submission as template
- Option to clear all fields
- Option to keep only structure
- Dependencies: ISSUE-106
- Success: Any submission cloneable

**ISSUE-108: Cloning Workflow Tests (2h)** - P1

- Test clone creates new submission
- Test field values copied
- Test date/signature reset
- Test draft status
- Dependencies: ISSUE-107
- Success: All cloning tests pass

### Phase 7: Testing & Polish (5 issues, 12h) - RENUMBERED from Phase 4

**ISSUE-109: Navigation and Pages Unit Tests (3h)** - P0

- Test AppShell, AppHeader, AppNavbar
- Test Dashboard, Projects List, Project Detail
- Test Breadcrumbs, PageContainer
- Test routing and navigation
- Dependencies: Phase 6 complete
- Success: >80% coverage on navigation components

**ISSUE-110: Form Renderer Unit Tests (3h)** - P0

- Test all 15 field types render
- Test conditional logic
- Test computed fields
- Test validation
- Dependencies: ISSUE-109
- Success: >80% coverage on FormRenderer

**ISSUE-111: Form Submission Integration Tests (3h)** - P0

- Test full submission flow
- Test photo upload
- Test signature capture
- Test offline queue
- Dependencies: ISSUE-110
- Success: E2E submission tests pass

**ISSUE-112: E2E Complete User Workflow (2h)** - P0

- Playwright test: Login → Dashboard → Select Project → Fill Form → Submit
- Test mobile viewport
- Test photo capture (mock camera)
- Test signature
- Test navigation breadcrumbs
- Dependencies: ISSUE-111
- Success: E2E complete workflow passes

**ISSUE-113: Sprint 3 Completion Report (1h)** - P0

- Document all completed features
- Collect evidence screenshots (navigation, forms, submission)
- Update SPRINT_3_MASTER_PLAN.md progress
- Create COMPLETION_REPORT.md
- Dependencies: All issues complete
- Success: Sprint documented with evidence

## Issue Sizing Guidelines

- **Small (1-2h):** Simple components, basic tests, configuration changes
- **Medium (2-4h):** Complex components, integration tests, API endpoints
- **Large (4-5h):** Major features, E2E workflows, mobile optimization

## Dependencies and Critical Path

**Sequential Dependencies:**

```
Phase 1 (Navigation Layer):
ISSUE-076 (AppShell) → ISSUE-077 (AppHeader) → ISSUE-078 (AppNavbar)
                     → ISSUE-079 (DashboardNav)
                     → ISSUE-080 (UserNav)
ISSUE-076 → ISSUE-081 (OfflineBanner)
ISSUE-076 → ISSUE-082 (PageContainer) → ISSUE-083 (Breadcrumbs)

Phase 2 (Core Pages):
Phase 1 complete → ISSUE-084 (Dashboard) → ISSUE-085 (Projects List)
                → ISSUE-086 (ProjectCard) → ISSUE-087 (Project Detail)
                → ISSUE-088 (Template Selector) → ISSUE-089 (Forms List)

Phase 3 (Single-Tenant):
Phase 2 complete → ISSUE-090 (remove UI) → ISSUE-091 (hard-code orgId) → ISSUE-092 (simplify auth)

Phase 4 (Renderer):
Phase 3 complete → ISSUE-093 (renderer) → ISSUE-094 (field types) → ISSUE-095 (conditional logic)
                                        → ISSUE-096 (computed) → ISSUE-097 (validation) → ISSUE-098 (auto-save)

Phase 5 (Submission):
Phase 4 complete → ISSUE-099 (mobile page) → ISSUE-100 (web page) → ISSUE-101 (photos)
                                           → ISSUE-102 (signature) → ISSUE-103 (submit) → ISSUE-104 (view)

Phase 6 (Cloning):
Phase 5 complete → ISSUE-105 (service) → ISSUE-106 (yesterday's log) → ISSUE-107 (use as template) → ISSUE-108 (tests)

Phase 7 (Testing):
Phase 6 complete → ISSUE-109 (nav tests) → ISSUE-110 (renderer tests) → ISSUE-111 (integration tests)
                                         → ISSUE-112 (E2E) → ISSUE-113 (report)
```

**Parallel Work Possible:**

- ISSUE-080 (UserNav) and ISSUE-081 (OfflineBanner) can run parallel after ISSUE-077
- ISSUE-082 (PageContainer) and ISSUE-079 (DashboardNav) can run parallel after ISSUE-078
- Phase 7 unit tests can start as Phase 4-6 complete individual components

## Success Metrics

**Product Metrics:**

- [ ] User can navigate Dashboard → Projects → Fill Form without getting lost
- [ ] Breadcrumbs show clear navigation hierarchy
- [ ] Q&D foreman can fill Daily Log form in <5 minutes
- [ ] Mobile form works with construction gloves (large touch targets)
- [ ] Photo capture with GPS EXIF functional
- [ ] Signature capture works smoothly
- [ ] "Copy Yesterday's Log" saves 3+ minutes daily
- [ ] Offline banner shows when disconnected

**Technical Metrics:**

- [ ] Test coverage 68% overall (from 60% baseline)
- [ ] Navigation components test coverage 80%
- [ ] FormRenderer test coverage 80%
- [ ] E2E complete workflow test passing (login to submit)
- [ ] Offline form filling test passing
- [ ] All 15 field types rendering correctly

**Quality Metrics:**

- [ ] Zero emoji violations in code/commits
- [ ] All evidence collected in docs/sprints/sprint3/evidence/
- [ ] TDD workflow documented (tests first, then implementation)
- [ ] Hard-coded orgId verified in all resolvers
- [ ] Mobile-optimized UI validated (glove test)
- [ ] Mantine v7 components used consistently

**Business Impact Metrics:**

- [ ] Q&D Construction can use complete application (not just form filling)
- [ ] Navigation intuitive (no training needed)
- [ ] Daily paperwork time reduced from 2-3 hours to <30 minutes
- [ ] Photo documentation seamless (no manual organization)
- [ ] Form cloning reduces repetitive data entry

## Evidence Requirements

**Per Issue:**

- Code committed to Git (no emoji, no AI branding)
- Tests passing (screenshot or CI/CD log)
- Manual testing evidence (screenshots, mobile videos)
- Evidence saved to docs/sprints/sprint3/evidence/ISSUE-###/

**Folder Structure:**

```
docs/sprints/sprint3/evidence/
├── ISSUE-076/ (AppShell)
│   ├── code/ (AppShell component screenshot)
│   └── test-results/ (Component tests passing)
├── ISSUE-077/ (AppHeader)
├── ... (ISSUE-078 through ISSUE-113)
└── README.md (evidence collection guidelines)
```

**Sprint-Level Evidence:**

- Test coverage report (68% overall, 80% navigation/FormRenderer)
- Complete user workflow video (login → dashboard → project → form → submit)
- Mobile form filling video (glove test)
- Photo upload with GPS EXIF (actual metadata)
- Signature capture screenshot
- Form cloning workflow video
- Offline banner screenshot
- Breadcrumb navigation demonstration

## Risk Assessment and Mitigation Strategies

### Technical Risks

**Risk 1: Navigation Complexity**

- **Probability:** Medium
- **Impact:** High (users can't reach forms without navigation)
- **Mitigation:**
  - Use Mantine AppShell (proven pattern)
  - Test navigation on mobile and desktop early
  - User testing with Q&D foremen
  - Breadcrumbs provide fallback navigation

**Risk 2: FormRenderer Complexity**

- **Probability:** Medium
- **Impact:** High (core feature)
- **Mitigation:**
  - Start with simple field types (text, number) before advanced
  - Comprehensive unit tests for each field type
  - Mobile testing early (glove-friendly validation)
  - Code review focused on performance

**Risk 3: Mobile Camera Integration**

- **Probability:** Medium
- **Impact:** Medium (photo capture critical)
- **Mitigation:**
  - Use Capacitor Camera plugin (proven in Sprint 2)
  - Mock camera for E2E tests
  - Test on actual devices (iOS, Android)
  - Fallback to file upload if camera fails

**Risk 4: Offline Auto-Save Performance**

- **Probability:** Low
- **Impact:** Medium (user experience)
- **Mitigation:**
  - Throttle auto-save to 30 seconds
  - Use IndexedDB for persistence (not localStorage)
  - Test with large forms (50+ fields)
  - Implement cancel on unmount

### Scope Risks

**Risk 5: Sprint Scope Increase (38 vs 24 issues)**

- **Probability:** High
- **Impact:** High (timeline)
- **Mitigation:**
  - Navigation components are simple (8 issues, 16h reasonable)
  - Core pages reuse components (6 issues, 12h)
  - Total 80h fits 4-week sprint (20h/week)
  - Can defer P1 features if needed (cloning, computed fields)

**Risk 6: Feature Creep (Advanced Field Types)**

- **Probability:** Medium
- **Impact:** Medium (timeline)
- **Mitigation:**
  - Stick to 15 field types defined in ISSUE-094
  - Defer advanced features to Sprint 4
  - Focus on Q&D Construction requirements only
  - Time-box each field type implementation

**Risk 7: Single-Tenant Assumptions**

- **Probability:** Low
- **Impact:** High (future migration complexity)
- **Mitigation:**
  - Keep all orgId fields in database
  - Document hard-coded values clearly
  - Plan Sprint 5-6 for multi-tenant migration
  - Review architecture with team

### Quality Risks

**Risk 8: Test Coverage Gap**

- **Probability:** Medium
- **Impact:** High (regression)
- **Mitigation:**
  - Allocate dedicated time for testing (Phase 7)
  - TDD workflow enforced (tests first)
  - Code review checklist includes coverage
  - Automated coverage reports in CI/CD

**Risk 9: Mobile UI Usability**

- **Probability:** Low
- **Impact:** High (Q&D adoption)
- **Mitigation:**
  - Test with construction gloves
  - Large touch targets (minimum 48px)
  - High contrast colors (sunlight visibility)
  - Field testing with Q&D foremen

## Sprint 3 Development Workflow

**Standard Process:**

1. Read issue documentation
2. TDD: Write tests first (red phase) → Implement (green phase) → Coverage >80%
3. Run quality gates: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
4. **Code Review:** Run `/review` command (code-reviewer agent)
5. Address findings: Critical/High issues fixed immediately
6. Manual testing and evidence collection
7. Create completion report
8. Commit and close issue

**New in Sprint 3:**

- **Mobile testing:** Test on actual devices for photo/signature
- **Glove test:** Validate touch targets work with gloves
- **Navigation testing:** Verify breadcrumbs, routing, back buttons
- **Single-tenant verification:** Confirm all API calls use org_qd_default
- **Mantine v7 components:** Use Mantine AppShell, NavLink, Breadcrumbs

## Definition of Done (Sprint-Level)

**Must Complete (Non-Negotiable):**

- [ ] AppShell with navigation functional (ISSUE-076 through ISSUE-083)
- [ ] Dashboard and Projects pages functional (ISSUE-084 through ISSUE-089)
- [ ] FormRenderer renders all 15 field types (ISSUE-093, ISSUE-094)
- [ ] Mobile form filling functional (ISSUE-099)
- [ ] Photo capture with GPS EXIF (ISSUE-101)
- [ ] Signature capture functional (ISSUE-102)
- [ ] Form submission workflow complete (ISSUE-103)
- [ ] Test coverage 68% overall, 80% navigation/FormRenderer (ISSUE-109, ISSUE-110)
- [ ] E2E complete user workflow test passing (ISSUE-112)
- [ ] All Critical and High severity code issues resolved

**Should Complete (High Priority):**

- [ ] Conditional display logic (ISSUE-095)
- [ ] Computed fields (ISSUE-096)
- [ ] Auto-save draft (ISSUE-098)
- [ ] Submission detail view (ISSUE-104)
- [ ] Form cloning ("Copy Yesterday's Log") (ISSUE-106)

**Nice to Have (Deferred to Sprint 4):**

- [ ] Advanced field types (multi-file upload, rich text)
- [ ] Form analytics (time to complete, field usage)
- [ ] Bulk submission actions (approve multiple)
- [ ] Advanced breadcrumb features (keyboard shortcuts)

## Kubernetes Quick Reference

**Daily Commands:**

```bash
# Check all services status
kubectl get all -n braveforms

# View backend logs
kubectl logs -f deployment/backend -n braveforms

# View web logs
kubectl logs -f deployment/web -n braveforms

# Restart backend after code changes
kubectl rollout restart deployment/backend -n braveforms

# Restart web after build updates
kubectl rollout restart deployment/web -n braveforms
```

**Access Points:**

- Backend GraphQL: http://localhost:30101/graphql
- Web Frontend: http://localhost:30102
- PostgreSQL: localhost:5432 (via port-forward)

## Sprint Execution Timeline

### Week 1 (Nov 4-8, 2025)

**Monday (Nov 4):**

- Sprint planning meeting (2 hours)
- Assign issues to developers
- ISSUE-076: Create AppShell
- ISSUE-077: Build AppHeader

**Tuesday-Wednesday (Nov 5-6):**

- Complete Phase 1 Navigation (ISSUE-076 through ISSUE-083)
- Start Phase 2 Core Pages (ISSUE-084, ISSUE-085)

**Thursday-Friday (Nov 7-8):**

- Complete Phase 2 Core Pages (ISSUE-086 through ISSUE-089)
- Start Phase 3 Single-Tenant (ISSUE-090, ISSUE-091)

### Week 2 (Nov 11-15, 2025)

**Monday-Tuesday (Nov 11-12):**

- Complete Phase 3 Single-Tenant (ISSUE-092)
- Start Phase 4 Renderer (ISSUE-093, ISSUE-094)

**Wednesday-Friday (Nov 13-15):**

- Complete Phase 4 Renderer (ISSUE-095 through ISSUE-098)
- Start Phase 5 Submission (ISSUE-099, ISSUE-100)

### Week 3 (Nov 18-22, 2025)

**Monday-Wednesday (Nov 18-20):**

- Complete Phase 5 Submission (ISSUE-101 through ISSUE-104)
- Start Phase 6 Cloning (ISSUE-105, ISSUE-106)

**Thursday-Friday (Nov 21-22):**

- Complete Phase 6 Cloning (ISSUE-107, ISSUE-108)
- Start Phase 7 Testing (ISSUE-109, ISSUE-110)

### Week 4 (Nov 25-29, 2025)

**Monday-Wednesday (Nov 25-27):**

- Complete Phase 7 Testing (ISSUE-111, ISSUE-112)
- Evidence collection
- Bug fixes

**Thursday (Nov 28):** THANKSGIVING HOLIDAY (US)

**Friday (Nov 29):**

- ISSUE-113: Sprint completion report
- Integration testing, final bug fixes

### Week 5 (Dec 2-6, 2025) - OVERFLOW WEEK

**Monday-Tuesday (Dec 2-3):**

- Final testing and polish
- Address any deferred P1 features

**Wednesday (Dec 4):**

- Sprint review and demo (2 hours)
- Sprint retrospective (1 hour)

**Thursday-Friday (Dec 5-6):**

- Sprint 4 planning preview
- Documentation cleanup

## Progress Tracking

**Last Updated:** 2025-11-22 (Phase 5 Complete - Form Submission Workflow)

**Overall Progress:** 35/38 issues complete (92%)
**Hours Completed:** 76/80 hours (95%)
**Sprint Days Elapsed:** Ongoing

### Phase Completion

- **Phase 1: Navigation Layer** - 8/8 issues (100%) ✅ COMPLETE
- **Phase 2: Core Pages** - 6/6 issues (100%) ✅ COMPLETE
- **Phase 3: Single-Tenant Simplification** - 3/3 issues (100%) ✅ COMPLETE
- **Phase 4: Dynamic Form Renderer** - 6/6 issues (100%) ✅ COMPLETE
  - ✅ ISSUE-093: Build FormRenderer Component (COMPLETE)
  - ✅ ISSUE-094: Implement 15 Field Types (COMPLETE)
  - ✅ ISSUE-095: Conditional Display Logic (COMPLETE)
  - ✅ ISSUE-096: Computed Fields (COMPLETE)
  - ✅ ISSUE-097: Form Validation (COMPLETE)
  - ✅ ISSUE-098: Auto-Save Draft Functionality (COMPLETE)
- **Phase 5: Form Submission Workflow** - 6/6 issues (100%) ✅ COMPLETE
  - ✅ ISSUE-099: Mobile Form Filling Page (COMPLETE - 4h) - 2025-11-17
  - ✅ ISSUE-100: Web Form Filling Page (COMPLETE - 3h) - 2025-11-22
  - ✅ ISSUE-101: Photo Attachment to Form Fields (COMPLETE - 2h) - 2025-11-22
  - ✅ ISSUE-102: Signature Capture Integration (COMPLETE - 2h) - 2025-11-22
  - ✅ ISSUE-103: Form Submission Confirmation (COMPLETE - 1h) - 2025-11-22
  - ✅ ISSUE-104: Submission Detail View (COMPLETE - 2h) - 2025-11-22
  - **PR:** [#11 - Form Submission Workflow](https://github.com/bravesoft58/BrAve-Forms/pull/11)
  - **Evidence:** docs/sprints/sprint3/evidence/ISSUE-100/ through ISSUE-104/
- **Phase 6: Form Cloning** - 4/4 issues (100%) ✅ COMPLETE
  - ✅ ISSUE-105: SubmissionCloningService (COMPLETE - 2h) - 2025-11-22
  - ✅ ISSUE-106: "Copy Yesterday's Log" Button (COMPLETE - 2h) - 2025-11-24
  - ✅ ISSUE-107: "Use as Template" Feature (COMPLETE - 2h) - 2025-11-24
  - ✅ ISSUE-108: Cloning Workflow Tests (COMPLETE - 2h) - 2025-11-24
  - **Evidence:** docs/sprints/sprint3/evidence/ISSUE-105/ through ISSUE-108/
- **Phase 7: Testing & Polish** - 0/5 issues (0%) 🔲 NOT STARTED

## Sprint Review Demo Flow (45 minutes)

1. **Navigation Demo** (10 min) - Login → Dashboard → Projects → Form (show breadcrumbs)
2. **Dashboard & Projects** (5 min) - Weather alerts, pending tasks, project cards
3. **Form Renderer Demo** (10 min) - Demonstrate all 15 field types
4. **Mobile Form Filling** (5 min) - Fill Daily Log on mobile with photos
5. **Signature Capture** (5 min) - Demonstrate signature field
6. **Form Cloning** (5 min) - "Copy Yesterday's Log" workflow
7. **Test Coverage Report** (5 min) - Present 68% overall, 80% navigation/renderer

**Stakeholder Invites:**

- Product Owner (required)
- Q&D Construction foremen (2-3 users)
- Engineering leadership
- QA team

## Next Sprint Preview

**Sprint 4: Advanced Features & Templates (Dec 2025)**

- Form Builder UI (drag-and-drop designer)
- QR Inspector Portal (public access)
- Q&D Agency Templates (11 templates)
- Photo Gallery (grid view, lightbox)
- Advanced field types (rich text, file uploads)
- Performance optimization (large forms)

---

**Sprint Commitment:** 38 issues (80 hours)
**Risk Level:** Medium-High (navigation layer + FormRenderer complexity)
**Confidence Level:** 75% (increased scope, but clear requirements)
**Forms-First Alignment:** 100% of effort on forms features

**CRITICAL:** This sprint delivers COMPLETE user-facing application, not just form filling. Navigation layer is essential - users must be able to navigate TO forms before filling them.

**Remember:**

- NO emoji in code/commits/documentation
- Evidence-based completion only (real systems, no mocks)
- TDD workflow enforced (tests first, then implementation)
- Hard-coded orgId = 'org_qd_default' verified in all API calls
- Mobile-optimized UI validated with glove test
- Mantine v7 AppShell and components used
- All 38 atomic issue files exist in docs/sprints/sprint3/issues/
- Forms-first positioning maintained (100% forms features)
- Navigation is FOUNDATION - must complete before forms
