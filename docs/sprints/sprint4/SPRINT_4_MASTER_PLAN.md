# Sprint 4 Master Plan - QR Inspector Portal & Q&D Agency Templates

**Created:** 2025-10-23
**Sprint Duration:** December 2025 (4 weeks)
**Sprint Goal:** Enable inspector access via QR codes + add all 9 missing Q&D Construction agency-specific templates
**Business Value:** Support county/state inspectors without app installation + achieve 100% template coverage for Q&D Construction forms
**Velocity Target:** 24 issues (50 hours total)

## Sprint Objectives

1. **QR Inspector Portal** - Time-limited tokens for read-only form access
2. **Agency-Specific Templates** - 9 Nevada/local agency compliance forms
3. **Template Coverage** - 100% Q&D Construction forms (15/15 templates)
4. **Testing & Polish** - E2E tests, cross-browser testing, performance optimization
5. **Q&D Pilot Readiness** - Production-ready for pilot deployment

## Strategic Context

Sprint 4 completes the pilot-ready platform for Q&D Construction with full inspector access and 100% agency template coverage.

**Sprint 3 Foundation:**

- Forms Filling: FormRenderer complete (15 field types rendering)
- Mobile + Web: Form submission workflow functional
- Photo + Signature: Capture working with GPS EXIF
- Form Cloning: "Copy Yesterday's Log" operational
- Templates: 6/15 Q&D templates (40% coverage)

**Sprint 4 Additions:**

- QR Inspector Portal: County/state inspectors access forms without app install
- Agency Templates: 9 missing Nevada agency-specific forms (NDEP, NDOT, TMWA)
- Template Coverage: 15/15 Q&D forms (100% coverage)
- Testing: Cross-browser, mobile device, performance optimization

**Q&D Construction Forms Status:**

- Before Sprint 4: 6/15 templates (40%)
- After Sprint 4: 15/15 templates (100%)
- Templates Source: "Spec Updates/Forms from QD Enviro" PDFs

## 24 Issues Breakdown

### Phase 1: QR Inspector Portal (6 issues, 12h)

**ISSUE-100: Time-Limited QR Token Generation (2h)** - P0

- Create QRTokenService backend service
- Generate JWT tokens with 24-hour expiration
- Include projectId and permissions in token
- Store token metadata in database
- Dependencies: Sprint 3 complete
- Success: QR tokens generated and validated

**ISSUE-101: Inspector Portal Layout (3h)** - P0

- Create public /inspector/[token] route (no auth required)
- Validate token and extract project info
- Read-only layout with branding
- Mobile-optimized for tablet inspectors
- Dependencies: ISSUE-100
- Success: Inspector portal accessible via token URL

**ISSUE-102: Project-Level QR Code Display (1h)** - P0

- Add QR code generator to project page
- Display QR code with token URL
- Regenerate button (invalidates old token)
- Print QR code option
- Dependencies: ISSUE-101
- Success: QR code displayed on project page

**ISSUE-103: Form Submission Viewer (Read-Only) (2h)** - P0

- List all submissions for project
- View submission details (read-only)
- Filter by date, template, status
- No edit/delete buttons (inspector can't modify)
- Dependencies: ISSUE-102
- Success: Inspector can view submissions

**ISSUE-104: Photo Gallery Viewer (2h)** - P1

- Grid view of all photos in submission
- Click to enlarge with lightbox
- GPS location map pin
- Timestamp and metadata display
- Dependencies: ISSUE-103
- Success: Photos displayed in gallery

**ISSUE-105: QR Portal Tests (2h)** - P0

- Test token generation and validation
- Test token expiration (24 hours)
- Test read-only enforcement (no mutations)
- Test mobile tablet layout
- Dependencies: ISSUE-104
- Success: QR portal tests passing

### Phase 2: Q&D Agency-Specific Templates (12 issues, 24h)

**ISSUE-106: NDEP BWPC SWPPP Template (3h)** - P0

- Nevada DEP Bureau of Water Pollution Control SWPPP
- Multi-page template with 50+ fields
- Site information, BMPs, inspection checklist
- Quarterly monitoring requirements
- Dependencies: Phase 1 complete
- Source: NDEP BWPC SWPPP Template.pdf

**ISSUE-107: NDOT SWPPP Template (3h)** - P0

- Nevada Department of Transportation SWPPP
- Highway/roadway construction specific
- Traffic control BMP sections
- NDOT inspector signature required
- Dependencies: ISSUE-106
- Source: NDOT SWPPP Template.pdf

**ISSUE-108: NDEP Weekly Stormwater Log (2h)** - P0

- Nevada DEP weekly log (different from Template 10)
- Simplified 7-day inspection format
- Visual assessment checkboxes
- Weather conditions tracking
- Dependencies: ISSUE-107
- Source: NDEP Weekly Stormwater Log.pdf

**ISSUE-109: NDOT Weekly Stormwater Logs (2h)** - P0

- NDOT-specific weekly log format
- Highway project requirements
- Culvert and drainage inspection
- Traffic impact notes
- Dependencies: ISSUE-108
- Source: NDOT Weekly Stormwater Logs.pdf

**ISSUE-110: TMWA Inspection Checklist (3h)** - P0

- Truckee Meadows Water Authority compliance
- Water quality protection measures
- Erosion control verification
- TMWA-specific reporting format
- Dependencies: ISSUE-109
- Source: Inspection Checklist TMWA.pdf

**ISSUE-111: Quarterly Visual Assessment (2h)** - P0

- EPA MSGP quarterly requirement
- Visual assessment of stormwater discharge
- Photograph documentation required
- Corrective action tracking
- Dependencies: ISSUE-110
- Source: Quarterly Visual Assessment Fillable.pdf

**ISSUE-112: Visual Assessment Report (2h)** - P0

- Detailed visual assessment report format
- Lab analysis sections
- Monitoring data tables
- Signature and certification
- Dependencies: ISSUE-111
- Source: Visual_Assessment_Report Fillable.pdf

**ISSUE-113: Routine Facility Inspection (2h)** - P0

- Industrial facility inspection checklist
- Equipment condition assessment
- Spill prevention verification
- Housekeeping standards
- Dependencies: ISSUE-112
- Source: Routine Facility Inspection Fillable.pdf

**ISSUE-114: Daily Dust Logs (2h)** - P0

- Daily dust control monitoring
- Wind speed and direction
- Dust control measures applied
- Visual dust observation
- Dependencies: ISSUE-113
- Source: Daily Dust Logs.pdf

**ISSUE-115: Validate All Templates (1h)** - P0

- Run validation script on all 15 templates (6 existing + 9 new)
- Ensure all pass Zod schema validation
- Check for duplicate field IDs
- Verify conditional logic references
- Dependencies: ISSUE-114
- Success: All 15 templates validated

**ISSUE-116: Seed All Q&D Templates (1h)** - P0

- Update seed script to include all 15 templates
- Run seed: `pnpm --filter backend seed:templates`
- Verify all templates in database
- Test template retrieval via GraphQL
- Dependencies: ISSUE-115
- Success: 15/15 templates in database

**ISSUE-117: Template Documentation Update (1h)** - P1

- Update templates/README.md with all 15 templates
- Add agency-specific compliance requirements
- Document Q&D Construction coverage (100%)
- Add template selection guide
- Dependencies: ISSUE-116
- Success: Documentation current

### Phase 3: Testing & Polish (6 issues, 14h)

**ISSUE-118: QR Portal E2E Tests (3h)** - P0

- Test QR code generation
- Test inspector access (no auth)
- Test read-only enforcement
- Test token expiration
- Dependencies: Phase 2 complete
- Success: E2E tests passing

**ISSUE-119: Template Rendering Tests (3h)** - P0

- Test all 15 templates render in FormRenderer
- Test agency-specific field types
- Test repeater fields in complex templates
- Test conditional logic in SWPPP templates
- Dependencies: ISSUE-118
- Success: All templates render correctly

**ISSUE-120: Cross-Browser Testing (2h)** - P1

- Test Chrome, Firefox, Safari, Edge
- Test mobile Chrome and Safari
- Test QR portal on tablet devices
- Test form filling on all browsers
- Dependencies: ISSUE-119
- Success: All browsers functional

**ISSUE-121: Mobile Device Testing (3h)** - P0

- Test on actual iOS device (iPhone 12+)
- Test on actual Android device (Pixel 6+)
- Test camera photo capture
- Test GPS EXIF extraction
- Test signature capture with finger
- Test glove-friendly touch targets
- Dependencies: ISSUE-120
- Success: Mobile devices functional

**ISSUE-122: Performance Optimization (2h)** - P1

- Form load time <2 seconds (Lighthouse)
- QR portal load <1 second
- Photo upload <5 seconds
- Template list load <1 second
- Optimize bundle size (code splitting)
- Dependencies: ISSUE-121
- Success: Performance targets met

**ISSUE-123: Sprint 4 Completion Report (1h)** - P0

- Document all completed features
- Collect evidence screenshots
- Update SPRINT_4_MASTER_PLAN.md
- Create COMPLETION_REPORT.md
- Q&D pilot readiness assessment
- Dependencies: All issues complete
- Success: Sprint documented

## Issue Sizing Guidelines

- **Small (1-2h):** Simple components, basic tests, configuration changes, single template extraction
- **Medium (2-3h):** Complex templates, integration tests, API endpoints, multi-section forms
- **Large (3-4h):** Major features, E2E workflows, complex agency templates (50+ fields)

## Dependencies and Critical Path

**Sequential Dependencies:**

```
Phase 1 (QR Portal):
ISSUE-100 (tokens) → ISSUE-101 (layout) → ISSUE-102 (QR display)
                   → ISSUE-103 (viewer) → ISSUE-104 (photos) → ISSUE-105 (tests)

Phase 2 (Templates - Sequential for testing):
ISSUE-106 (NDEP SWPPP) → ISSUE-107 (NDOT SWPPP) → ISSUE-108 (NDEP Weekly)
→ ISSUE-109 (NDOT Weekly) → ISSUE-110 (TMWA) → ISSUE-111 (Quarterly Visual)
→ ISSUE-112 (Visual Report) → ISSUE-113 (Routine Facility) → ISSUE-114 (Dust Logs)
→ ISSUE-115 (validate) → ISSUE-116 (seed) → ISSUE-117 (docs)

Phase 3 (Testing):
ISSUE-118 (E2E) → ISSUE-119 (template tests) → ISSUE-120 (cross-browser)
             → ISSUE-121 (mobile devices) → ISSUE-122 (performance) → ISSUE-123 (report)
```

**Parallel Work Possible:**

- Phase 1 and Phase 2 can run in parallel with different developers
- Phase 2 templates can be created in parallel (2-3 developers working simultaneously)
- Phase 3 testing can start as Phase 1-2 complete

## Success Metrics

**Product Metrics:**

- [ ] County inspectors can access QR portal without login
- [ ] Inspector portal loads in <1 second on tablet
- [ ] All 15 Q&D templates render correctly
- [ ] Agency-specific fields function properly
- [ ] QR codes print clearly for on-site posting

**Technical Metrics:**

- [ ] Test coverage 70% overall (from 65% baseline)
- [ ] QR portal test coverage 80%
- [ ] All 15 templates validated via Zod
- [ ] E2E tests passing for inspector workflow
- [ ] Performance targets met (Lighthouse >90)

**Quality Metrics:**

- [ ] Zero emoji violations in code/commits
- [ ] All evidence collected in docs/sprints/sprint4/evidence/
- [ ] TDD workflow documented (tests first, then implementation)
- [ ] QR token expiration verified (24 hours)
- [ ] Read-only enforcement validated (no mutations)

**Business Impact Metrics:**

- [ ] Q&D Construction has 100% template coverage
- [ ] Inspectors can access forms without app install
- [ ] Agency-specific compliance requirements met
- [ ] Pilot deployment ready for production

## Evidence Requirements

**Per Issue:**

- Code committed to Git (no emoji, no AI branding)
- Tests passing (screenshot or CI/CD log)
- Manual testing evidence (screenshots, mobile videos)
- Evidence saved to docs/sprints/sprint4/evidence/ISSUE-###/

**Folder Structure:**

```
docs/sprints/sprint4/evidence/
├── ISSUE-100/
│   ├── code/ (QRTokenService implementation)
│   └── test-results/ (token generation tests passing)
├── ISSUE-101/
│   ├── code/ (inspector portal layout)
│   └── deployment/ (tablet screenshot)
├── [... ISSUE-102 through ISSUE-123]
└── README.md (evidence collection guidelines)
```

**Sprint-Level Evidence:**

- Test coverage report (70% overall, 80% QR portal)
- QR portal workflow video (token generation → inspector access)
- All 15 templates rendering (screenshot)
- Cross-browser testing matrix
- Mobile device testing videos (iOS, Android)

## Risk Assessment and Mitigation Strategies

### Technical Risks

**Risk 1: QR Token Security**

- **Probability:** Medium
- **Impact:** High (inspector portal access)
- **Mitigation:**
  - JWT tokens with 24-hour expiration
  - Read-only enforcement at GraphQL resolver level
  - Token metadata stored for audit trail
  - Regeneration invalidates previous tokens

**Risk 2: Complex Agency Templates**

- **Probability:** Medium
- **Impact:** Medium (NDEP SWPPP has 50+ fields)
- **Mitigation:**
  - Start with simple templates (Daily Dust Logs)
  - Extract PDF fields systematically (section by section)
  - Validate each template independently
  - Test rendering with actual FormRenderer

**Risk 3: Mobile Device Testing**

- **Probability:** Low
- **Impact:** High (Q&D pilot success)
- **Mitigation:**
  - Test on actual iOS and Android devices
  - Validate glove-friendly touch targets
  - Test photo capture with GPS EXIF
  - Field test with Q&D foremen

### Scope Risks

**Risk 4: Template Extraction Complexity**

- **Probability:** Medium
- **Impact:** Medium (timeline)
- **Mitigation:**
  - Time-box each template to 2-3 hours
  - Defer advanced field types to future sprints
  - Focus on agency-required fields only
  - Use PDF as ground truth for field extraction

**Risk 5: Inspector Portal UX**

- **Probability:** Low
- **Impact:** Medium (inspector adoption)
- **Mitigation:**
  - Mobile-optimized for tablet devices
  - High-contrast design (outdoor visibility)
  - Large touch targets (glove use)
  - Test with actual county inspectors

### Quality Risks

**Risk 6: Template Validation Failures**

- **Probability:** Low
- **Impact:** Medium (database seed fails)
- **Mitigation:**
  - Validate each template after creation
  - Run Zod schema validation script
  - Check for duplicate field IDs
  - Verify conditional logic references

**Risk 7: Performance Degradation**

- **Probability:** Low
- **Impact:** Medium (user experience)
- **Mitigation:**
  - Code splitting for template library
  - Lazy loading for large templates
  - Optimize photo thumbnails
  - Lighthouse performance audits

## Sprint 4 Development Workflow

**Standard Process:**

1. Read issue documentation
2. TDD: Write tests first (red phase) → Implement (green phase) → Coverage >80%
3. Run quality gates: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
4. **Code Review:** Run `/review` command (code-reviewer agent)
5. Address findings: Critical/High issues fixed immediately
6. Manual testing and evidence collection
7. Create completion report
8. Commit and close issue

**New in Sprint 4:**

- **PDF Extraction:** Systematic field extraction from agency PDFs
- **Template Validation:** Run validation script after each template
- **QR Testing:** Test token expiration and read-only enforcement
- **Mobile Devices:** Test on actual iOS and Android devices

## Definition of Done (Sprint-Level)

**Must Complete (Non-Negotiable):**

- [ ] QR token generation functional (ISSUE-100)
- [ ] Inspector portal accessible via token (ISSUE-101)
- [ ] All 9 agency templates created (ISSUE-106 through ISSUE-114)
- [ ] All 15 templates validated (ISSUE-115)
- [ ] All 15 templates seeded (ISSUE-116)
- [ ] Test coverage 70% overall, 80% QR portal (ISSUE-118)
- [ ] E2E tests passing (ISSUE-118, ISSUE-119)
- [ ] Mobile device testing complete (ISSUE-121)
- [ ] All Critical and High severity code issues resolved

**Should Complete (High Priority):**

- [ ] QR code display on project page (ISSUE-102)
- [ ] Photo gallery viewer (ISSUE-104)
- [ ] Cross-browser testing (ISSUE-120)
- [ ] Performance optimization (ISSUE-122)
- [ ] Template documentation (ISSUE-117)

**Nice to Have (Deferred to Sprint 5):**

- [ ] Advanced photo filtering (by date, GPS location)
- [ ] QR analytics (inspector access logs)
- [ ] Bulk template operations (export all submissions)

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

### Week 1 (Dec 2-6, 2025)

**Monday (Dec 2):**

- Sprint planning meeting (2 hours)
- Assign issues to developers
- ISSUE-100: QR token generation
- ISSUE-101: Inspector portal layout

**Tuesday-Wednesday (Dec 3-4):**

- Complete Phase 1 (ISSUE-100 through ISSUE-105)
- Start Phase 2 templates (ISSUE-106, ISSUE-107)

**Thursday-Friday (Dec 5-6):**

- Continue Phase 2 templates (ISSUE-108 through ISSUE-110)

### Week 2 (Dec 9-13, 2025)

**Monday-Wednesday (Dec 9-11):**

- Complete Phase 2 templates (ISSUE-111 through ISSUE-114)
- Template validation (ISSUE-115)
- Template seeding (ISSUE-116)

**Thursday-Friday (Dec 12-13):**

- Template documentation (ISSUE-117)
- Start Phase 3 testing (ISSUE-118)

### Week 3 (Dec 16-20, 2025)

**Monday-Wednesday (Dec 16-18):**

- Complete Phase 3 testing (ISSUE-119 through ISSUE-121)
- Evidence collection

**Thursday-Friday (Dec 19-20):**

- Performance optimization (ISSUE-122)
- ISSUE-123: Sprint completion report
- Integration testing, bug fixes

### Week 4 (Dec 23-27, 2025 - Holiday Week)

**Monday (Dec 23):**

- Sprint review and demo (2 hours)
- Sprint retrospective (1 hour)
- Q&D pilot deployment preparation

**Tuesday (Dec 24) - Holiday:**

- NO WORK (Christmas Eve)

**Wednesday (Dec 25) - Holiday:**

- NO WORK (Christmas Day)

**Thursday-Friday (Dec 26-27):**

- Deployment preparation
- Sprint 5 planning preview

## Progress Tracking

**Last Updated:** 2025-11-27 (Sprint 4 COMPLETE)

**Overall Progress:** 23/24 issues complete + 1 deferred (96%)
**Hours Completed:** 48/50 hours (96%)
**Sprint Status:** COMPLETE - Q&D PILOT READY

### Phase Completion

- **Phase 1: QR Inspector Portal** - 6/6 issues (100%) - COMPLETE
- **Phase 2: Q&D Agency Templates** - 12/12 issues (100%) - COMPLETE
  - 20 template JSON files created and validated
  - 236 template tests passing
  - All 11 compliance.agency fields fixed per code review
  - Templates: NDEP SWPPP, NDOT SWPPP, Weekly Logs, TMWA, Visual Assessments, Facility, Dust Logs
- **Phase 3: Testing & Polish** - 9/10 issues (90%) - COMPLETE
  - ISSUE-118: QR Portal E2E Tests - COMPLETE
  - ISSUE-119: Form Filling E2E Tests - COMPLETE
  - ISSUE-120: Template Rendering E2E Tests - COMPLETE
  - ISSUE-121: Code Review - COMPLETE
  - ISSUE-122: Database Review - COMPLETE
  - ISSUE-123: Cross-Browser Testing - COMPLETE
  - ISSUE-124: Lighthouse Performance - COMPLETE
  - ISSUE-125: Security Audit - COMPLETE
  - ISSUE-126: Load Testing - DEFERRED (post-pilot)
  - ISSUE-127: Completion Report - COMPLETE

### Integration Work (ISSUE-105.5)

**ISSUE-105.5: Web UI Integration and Template Rendering Fixes** - COMPLETE (4h)

- Fixed critical Zod schema generation bug ("s.max is not a function")
- Fixed GraphQL endpoint configuration in Docker
- Fixed GraphQL query fields and ID type mismatch
- Verified all 21 templates load and render in web UI
- Complex templates (NDOT SWPPP with 100+ fields) render correctly
- Auto-save draft functionality confirmed working
- See: [ISSUE-105.5.md](issues/ISSUE-105.5.md) for full details

### Phase 1 Completion Details (2025-11-26)

**ISSUE-100: Time-Limited QR Token Generation** - COMPLETE

- Backend QRTokenService with JWT generation
- 24-hour token expiration
- Database model for InspectorQRToken

**ISSUE-101: Inspector Portal Layout** - COMPLETE

- Public /inspector/[token] route (no auth required)
- Token verification and project info extraction
- Mobile-optimized read-only layout

**ISSUE-102: Project-Level QR Code Display** - COMPLETE

- ProjectQRCode component with QR generation modal
- Download QR as PNG functionality
- Token regeneration (invalidates old tokens)

**ISSUE-103: Form Submission Viewer (Read-Only)** - COMPLETE

- SubmissionViewer component for listing submissions
- Read-only view with permission-based access
- Filter and search functionality

**ISSUE-104: Photo Gallery Viewer** - COMPLETE

- PhotoGalleryViewer component with grid display
- Lightbox for photo enlargement
- GPS metadata display

**ISSUE-105: QR Portal Tests** - COMPLETE

- 77 tests across all QR Portal components
- Token generation and validation tests
- Read-only enforcement tests
- Mock authentication tests

**Code Review Completed:** 11 issues fixed (1 Critical, 3 High, 4 Medium, 3 Low)
**Commit:** feat(qr-portal): implement QR code inspector portal (ISSUE-100-105)

## Sprint Review Demo Flow (30 minutes)

1. **QR Portal Demo** (5 min) - Generate QR → Inspector accesses without login
2. **Agency Templates Demo** (10 min) - Show all 15 Q&D templates rendering
3. **Form Filling Demo** (5 min) - Fill NDEP SWPPP template with 50+ fields
4. **Photo Gallery Demo** (5 min) - Inspector views photos with GPS map
5. **Mobile Testing Demo** (5 min) - iOS and Android form filling

**Stakeholder Invites:**

- Product Owner (required)
- Q&D Construction foremen (2-3 users)
- County/state inspectors (2-3 users)
- Engineering leadership
- QA team

## Next Sprint Preview

**Sprint 5: Multi-Tenant Migration & Production Readiness (January 2026)**

- Re-enable Clerk Organizations feature
- Implement proper multi-tenant isolation
- Add organization switching UI
- Production security hardening
- SOC 2 audit preparation

---

**Sprint Commitment:** 24 issues (50 hours)
**Risk Level:** Medium (QR security, complex templates)
**Confidence Level:** 85% (Sprint 3 forms complete, clear requirements)
**Forms-First Alignment:** 100% of effort on forms features and inspector access

**CRITICAL:** This sprint completes Q&D Construction pilot readiness with 100% template coverage and inspector access.

**Remember:**

- NO emoji in code/commits/documentation
- Evidence-based completion only (real systems, no mocks)
- TDD workflow enforced (tests first, then implementation)
- QR token expiration verified (24 hours)
- Read-only enforcement validated (no mutations)
- All 24 atomic issue files exist in docs/sprints/sprint4/issues/
- Forms-first positioning maintained (100% forms features)
- Agency templates extracted from actual PDFs (no approximations)
