# Sprint 5: Production-Ready MVP - Documentation Index

**Sprint Duration:** January 2026 (7-8 weeks)
**Sprint Goal:** Complete 100% production-ready MVP with photo management, offline experience, user settings, and form builder
**Total Issues:** 34 (160 hours total)
**Issues Created:** 9 of 34 (26%)
**Status:** READY FOR IMPLEMENTATION

---

## Documentation Files

### Planning Documents

1. **[SPRINT_5_MASTER_PLAN.md](SPRINT_5_MASTER_PLAN.md)** - Complete sprint plan
   - All 34 issues detailed
   - 5 phases: Photo Gallery (20h), Offline UI (24h), Settings (12h), Polish (4h), Form Builder (100h)
   - Dependencies, success criteria, evidence requirements
   - Updated with correct library choices (MapLibre, Annotorious, Yet Another React Lightbox, expr-eval)

2. **[LIBRARY_MIGRATION_GUIDE.md](LIBRARY_MIGRATION_GUIDE.md)** - Library implementation guide
   - 4 library changes required (Mapbox → MapLibre, etc.)
   - Before/after code examples
   - Security best practices
   - Rollback procedures

3. **[LIBRARY_REVIEW_SUMMARY.md](LIBRARY_REVIEW_SUMMARY.md)** - Library research summary
   - Complete evaluation of all Sprint 5 libraries
   - License compliance (100% MIT/BSD, zero proprietary)
   - Cost analysis ($60-240/year savings)
   - Security analysis (2025 npm supply chain attacks mitigation)

### Issue Creation Status

4. **[ISSUE_CREATION_STATUS.md](ISSUE_CREATION_STATUS.md)** - Live creation progress
   - 9 of 34 issues created (26%)
   - Template format for remaining 25 issues
   - Critical remaining dependencies

5. **[ISSUE_CREATION_COMPLETE_SUMMARY.md](ISSUE_CREATION_COMPLETE_SUMMARY.md)** - Final summary
   - Detailed completion report
   - All created issues indexed
   - Next steps for developer
   - Options for completing remaining issues

---

## Created Issue Files (9 of 34)

### Phase 1: Photo Gallery (6 issues - 100% COMPLETE)

1. **[ISSUE-128](issues/ISSUE-128.md)** - Photo Gallery Grid View (4h)
   - Masonry layout, infinite scroll, filtering, responsive design
   - Uses: CSS Grid, TanStack Query infinite scroll
   - File size: 12KB

2. **[ISSUE-129](issues/ISSUE-129.md)** - Photo Lightbox Viewer (3h)
   - Yet Another React Lightbox integration (MIT license)
   - Zoom, navigation, EXIF metadata, download/share
   - File size: 14KB

3. **[ISSUE-130](issues/ISSUE-130.md)** - GPS Map Integration (4h)
   - MapLibre GL JS (BSD license, FREE vs $5-20/mo Mapbox)
   - Free tile providers (Stadia Maps, MapTiler, OpenStreetMap)
   - Clustering, offline tiles support
   - File size: 13KB

4. **[ISSUE-131](issues/ISSUE-131.md)** - Photo Annotations (4h)
   - Annotorious integration (BSD license, actively maintained)
   - Drawing tools (rect, polygon, circle, freehand)
   - Metadata tracking, annotation history
   - File size: 6.7KB

5. **[ISSUE-132](issues/ISSUE-132.md)** - Photo Search & Filter (3h)
   - 6 filter types (description, user, form type, date, GPS, weather)
   - Backend query support, clear filters
   - File size: 8.1KB

6. **[ISSUE-133](issues/ISSUE-133.md)** - Before/After Photo Pairing (2h)
   - Side-by-side comparison, fade slider
   - Pairing UI, filter for paired photos
   - File size: 4.6KB

### Phase 2: Offline Experience UI (1 issue)

7. **[ISSUE-134](issues/ISSUE-134.md)** - Sync Status Dashboard (4h)
   - Current sync status, last/next sync timestamps
   - Sync statistics, storage usage meter
   - 30-day offline capability countdown
   - File size: 8.3KB

### Phase 5: Form Builder (2 critical issues)

8. **[ISSUE-150](issues/ISSUE-150.md)** - Form Builder Architecture Setup (6h)
   - @dnd-kit/core integration (MIT license, 10KB, zero dependencies)
   - Valtio state management with undo/redo (50 snapshots)
   - 3-column layout (palette, canvas, properties)
   - Auto-save every 30 seconds
   - File size: 12KB

9. **[ISSUE-155](issues/ISSUE-155.md)** - Calculated Fields Editor (10h)
   - expr-eval integration (MIT license, NOT mathjs for security)
   - Operators: +, -, \*, /, ()
   - Functions: SUM, AVG, MIN, MAX
   - Circular dependency detection, live preview
   - File size: 15KB

**Total Issue Files:** 93.7KB documentation (average 10.4KB per issue)

---

## Remaining Issues (25 of 34)

### Phase 2: Offline Experience UI (6 remaining)

- [ ] ISSUE-135: Sync Queue Management (4h)
- [ ] ISSUE-136: Conflict Resolution UI (6h)
- [ ] ISSUE-137: Offline Storage Indicators (2h)
- [ ] ISSUE-138: Manual Sync Trigger (2h)
- [ ] ISSUE-139: Retry Failed Sync (2h)
- [ ] ISSUE-140: Offline Experience Tests (4h)

### Phase 3: Settings & Profile (5 remaining)

- [ ] ISSUE-141: User Profile Page (3h)
- [ ] ISSUE-142: Account Settings (3h)
- [ ] ISSUE-143: Notification Preferences (2h)
- [ ] ISSUE-144: Help & Documentation (2h)
- [ ] ISSUE-145: App Settings (2h)

### Phase 4: Polish & Testing (4 remaining)

- [ ] ISSUE-146: Loading States Audit (1h)
- [ ] ISSUE-147: Error Handling Audit (1h)
- [ ] ISSUE-148: Responsive Design Fixes (1h)
- [ ] ISSUE-149: Sprint 5 Completion Report (1h)

### Phase 5: Form Builder (10 remaining)

- [ ] ISSUE-151: Field Palette Component (8h)
- [ ] ISSUE-152: Form Canvas with Drag-Drop (12h)
- [ ] ISSUE-153: Properties Panel Component (10h)
- [ ] ISSUE-154: Conditional Logic Builder (12h)
- [ ] ISSUE-156: Field Settings Tabs (8h)
- [ ] ISSUE-158: Form Preview Component (8h)
- [ ] ISSUE-159: Save/Publish Workflow (6h)
- [ ] ISSUE-160: Undo/Redo History (6h)
- [ ] ISSUE-161: Form Builder Tests & Polish (6h)

---

## Key Library Choices (Research-Validated)

All library choices based on comprehensive research documented in:

- LIBRARY_REVIEW_SUMMARY.md
- LIBRARY_MIGRATION_GUIDE.md

### 1. MapLibre GL JS (ISSUE-130)

**Why:** Mapbox GL v2+ changed to proprietary license in December 2020
**License:** BSD 3-Clause (fully open source)
**Governance:** Linux Foundation (Amazon, Meta, Microsoft backing)
**Cost:** FREE (saves $5-20/month vs Mapbox)
**Offline:** Self-hostable tiles for construction sites

### 2. Annotorious (ISSUE-131)

**Why:** react-image-annotate unmaintained for 5 years, no security patches
**License:** BSD 3-Clause (fully open source)
**Status:** Actively maintained (Sept 2025 updates)
**Features:** Full TypeScript support, modern annotation API

### 3. Yet Another React Lightbox (ISSUE-129)

**Why:** react-image-lightbox deprecated, no longer supported
**License:** MIT (fully open source)
**Compatibility:** React 19, 18, 17, 16.8+
**Endorsement:** Recommended by Mantine community

### 4. expr-eval (ISSUE-155)

**Why:** mathjs has LGPL copyleft concerns + security risks (import/createUnit functions)
**License:** MIT (simple, permissive, NO copyleft)
**Size:** 5KB vs mathjs (heavy package)
**Security:** No dangerous functions

### 5. @dnd-kit/core (ISSUE-150)

**Why:** Best-in-class drag-drop for 2025
**License:** MIT (fully open source)
**Size:** 10KB minified, zero dependencies
**Features:** Accessible (built-in ARIA), performant (minimal re-renders)

**Total Cost:** $0/month (100% open source, zero proprietary licenses)
**Annual Savings:** $60-240 (Mapbox elimination)

---

## Issue File Format (All 9 Follow This)

Each created issue includes:

1. **Header:** Sprint, Phase, Priority, Time, Complexity, Dependencies, Status
2. **What You'll Do:** Clear objective description
3. **Prerequisites:** Checklist of requirements
4. **Libraries/Dependencies:** Version, License, Rationale (if applicable)
5. **Step-by-Step Instructions:** Detailed tasks with time estimates
6. **TDD Workflow:** Red phase (failing tests) → Green phase (passing tests)
7. **Files to Create/Modify:** Complete file list
8. **Verification Checklist:** Including "Zero emoji, zero AI branding"
9. **Evidence Requirements:** Screenshots, test results, coverage reports
10. **Success Criteria:** Measurable outcomes (>80% test coverage)
11. **Time Estimate:** Breakdown by task
12. **Next Issue:** Dependency chain

---

## Next Steps for Developer

### Option 1: Manual Creation (RECOMMENDED)

**Estimated Time:** 2-3 hours

**Steps:**

1. Review 9 created issues (30 min)
2. Use Sprint 5 Master Plan for remaining issue content
3. Follow format from created issues
4. Ensure zero emoji, zero AI branding
5. Verify library choices match research documents

**Template:** Use ISSUE-128 through ISSUE-155 as examples

### Option 2: Batch Script Generation

Request automated generation script for remaining 25 issues.

**Estimated Time:** 45 minutes (script + verification)

### Option 3: Continue One-by-One

Continue creating issues individually in future sessions.

**Estimated Time:** 3-4 hours across multiple sessions

---

## Quality Assurance

**All 9 Created Issues Verified For:**

- [x] Correct library choices from research
- [x] Library rationale (why chosen, alternatives rejected)
- [x] License information (all MIT/BSD)
- [x] Code examples from migration guide
- [x] TDD workflow (red → green)
- [x] Evidence requirements
- [x] Step-by-step instructions with time estimates
- [x] Verification checklists
- [x] Success criteria (>80% coverage)
- [x] Dependencies and next issue links
- [x] **ZERO emoji** (enforced)
- [x] **ZERO AI branding** (enforced)

---

## Sprint 5 Readiness

**Created Issues Cover:**

- ✓ Complete Photo Gallery foundation (6 issues)
- ✓ Offline UI foundation (1 issue)
- ✓ Form Builder architecture (2 critical issues)
- ✓ All 4 library migrations documented
- ✓ Security considerations noted
- ✓ Cost analysis completed

**Remaining Work:**

- 6 Offline UI issues (standard CRUD operations)
- 5 Settings issues (standard forms)
- 4 Polish issues (audits and testing)
- 10 Form Builder issues (drag-drop implementation)

**Critical Path:** Form Builder foundation (ISSUE-150) and calculated fields (ISSUE-155) are complete, enabling remaining form builder work.

---

## References

**Primary Documentation:**

- [Sprint 5 Master Plan](SPRINT_5_MASTER_PLAN.md)
- [Library Migration Guide](LIBRARY_MIGRATION_GUIDE.md)
- [Library Review Summary](LIBRARY_REVIEW_SUMMARY.md)

**Related Documentation:**

- [TECH_STACK_DETAILS.md](../../TECH_STACK_DETAILS.md) - Updated with Sprint 5 libraries
- [CLAUDE.md](../../../CLAUDE.md) - Development workflow standards

**Research Sources:**

- 20+ sources on best practices (Anthropic official + community)
- Library documentation (MapLibre, Annotorious, Yet Another React Lightbox, expr-eval)
- 2025 npm security analysis (Shai-Hulud Worm, Chalk/Debug Attack)

---

**Status:** READY FOR SPRINT 5 IMPLEMENTATION

**Last Updated:** 2025-10-23
**Created By:** Project Manager Agent
**Maintained By:** Development Team
