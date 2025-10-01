# Software Development Plan v2.0 - Update Summary

**Document:** sdp-brave-forms.md
**Version:** 1.0 → 2.0
**Date:** October 1, 2025
**Updated By:** Product Owner + Development Team
**Effort:** 2.5 hours

---

## Executive Summary

Updated the Software Development Plan to align with forms-first repositioning (80/20 split), CLAUDE.md v1.6 evidence-based practices, and corrected technical inaccuracies. The document now accurately reflects the project's strategic direction and development standards.

---

## Strategic Changes

### Forms-First Repositioning (80/20)

**Before (v1.0 - Compliance-First):**
> "a web-first construction compliance and forms management system"

**After (v2.0 - Forms-First):**
> "a web-first construction forms management system designed to reduce daily documentation time from 2-3 hours to under 30 minutes. The platform's 80/20 focus is: **80% forms management and digitization** (primary value driver) + **20% automated compliance workflows** (competitive differentiation through weather-triggered SWPPP automation)."

### Business Drivers Reordered

**Priority Changed:**
1. Documentation Time (PRIMARY ROI - 90% time savings)
2. Data Entry Errors
3. Photo Organization
4. Offline Access
5. Compliance Violations (SECONDARY)

### Stakeholder Rebalancing

**Before:** "Construction foremen, project managers, compliance officers"

**After:**
- **Primary:** Construction foremen, project managers, field superintendents (FORMS USERS)
- **Secondary:** Office staff, safety managers, compliance officers (COMPLIANCE USERS)

---

## Technical Corrections

### Database Version

**CRITICAL CORRECTION:**
- **Before:** PostgreSQL 16 with JSONB
- **After:** PostgreSQL 15 + TimescaleDB with JSONB
- **Reason:** TimescaleDB compatibility requirement for time-series weather data

### Mobile Framework

**CRITICAL CORRECTION:**
- **Before:** "React Native specialist"
- **After:** "Capacitor 6 + React specialist"
- **Reason:** Project uses Capacitor 6 (web technologies in native shell), NOT React Native

### Project Management

**CORRECTION:**
- **Before:** Archon agent-based management
- **After:** GitHub Projects with Kanban boards
- **Reason:** Project uses GitHub for project management, NOT Archon

---

## CLAUDE.md v1.6 Alignment

### Definition of Done - Evidence-Based (NEW)

Added comprehensive evidence requirements with MANDATORY quality gates:

```markdown
**Code Quality Gates (MANDATORY):**
- [ ] Code written and peer-reviewed (GitHub PR with approvals)
- [ ] Unit tests achieve 80% coverage (screenshot of coverage report)
- [ ] Integration tests pass (CI/CD pipeline green)
- [ ] Linting and type-check pass (`pnpm lint && pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)

**Evidence Archive (MANDATORY - NO FAKE VALIDATION):**
docs/sprints/{sprint-id}/evidence/{issue-id}/
├── test-results/          # Red → Green test progression
├── deployment/            # Running system verification
├── performance/           # Actual benchmark results
└── compliance/            # EPA/OSHA validation (if applicable)

**PROHIBITED Development Practices:**
- ❌ NO toy/dummy implementations presented as complete
- ❌ NO mock data claimed as real validation
- ✅ ONLY real end-to-end validation with actual systems
```

### Sprint Velocity - Forms-First Focus

**Before:**
| Sprint | Focus Area |
|--------|------------|
| 1-2 | Authentication, project setup |
| 3-4 | Core forms, SWPPP module |
| 5-6 | Weather integration, photos |

**After:**
| Sprint | Focus Area (Forms-First Priority) |
|--------|----------------------------------|
| 1-2 | Authentication, project setup, database foundation |
| 3-4 | **Forms engine** (P0), dynamic form builder, validation |
| 5-6 | **Photo capture** (P0), offline storage, basic reporting |
| 7-8 | Weather integration (P1), QR system, SWPPP automation |
| 9-10 | Issues/Actions tracking, advanced reporting |

### Development Phases Rebalanced

**Phase 1: Foundation & Forms Engine (Months 1-2) - 80% FOCUS**
- Sprint 1-2: Core Infrastructure
- Sprint 3-4: Forms Engine (P0 - PRIMARY VALUE DRIVER)

**Phase 2: Photos & Offline (Months 3-4) - 80% FOCUS**
- Sprint 5-6: Photo Capture & Basic Reporting (P0)
- Sprint 7-8: Mobile Platform Development

**Phase 3: Compliance Automation (Month 5) - 20% FOCUS**
- Sprint 9-10: SWPPP & Inspector Portal (P1 - DIFFERENTIATION)

### AI-Assisted Development Practices (MANDATORY)

Added CLAUDE.md v1.6 best practices:

**Plan Mode (Shift+Tab Twice):**
- Use for ANY feature estimated >30 minutes
- 21% faster plan generation vs regular mode
- Forces structured approach, prevents scope drift

**Evidence-Based TDD Workflow (Anti-Hallucination):**
1. Human defines tests based on expected input/output
2. Claude writes tests FIRST - Do NOT implement yet
3. Run tests, confirm they FAIL - Verify test validity (red phase)
4. Commit tests to git - Tests exist BEFORE implementation
5. Claude implements code to pass tests (NO test modifications)
6. Iterate until GREEN - Human QA gates, Claude fixes

**Context Management:**
- 0-50% capacity: Normal operation
- 50-70% capacity: Consider `/compact`
- 70%+ capacity: COMPACT NOW, prepare to wrap up
- After task completion: `/clear` for fresh context

---

## Risk Management Updates

### Technical Risks - Offline Focus

**Added High-Priority Risks:**
- **iOS IndexedDB data loss** (High probability, High impact)
  - Mitigation: SQLite for critical data
  - Contingency: iOS-specific persistence testing

- **30-day offline capability broken** (High probability, Critical impact)
  - Mitigation: Comprehensive offline testing
  - Contingency: Service Workers + IndexedDB fallback

- **EPA compliance inaccuracy** (Low probability, Critical impact)
  - Mitigation: Exact 0.25" threshold validation
  - Contingency: Regulatory review + legal sign-off

### Project Risks - Forms-First Enforcement

**Added:**
- **Forms-first misalignment** → Product Owner enforces 80% forms development effort
- **Fake validation** → MANDATORY evidence archive, NO toy implementations

---

## Success Metrics - Forms-First Focus

### MVP Success Criteria (Month 6)

**Added:**
- **Forms Usage:** 80% of user time (validate forms-first positioning)

**Updated:**
- **Users:** 250 active customers (5-25 employees/company)
- **Revenue:** $50K MRR ($39/field, $19/office user pricing)
- **Rating:** 4.0+ app store (forms ease-of-use focus)

### Long-term Goals (Year 1)

**Updated:**
- 1,000+ customers (5-25 employee PRIMARY market)
- Expansion to 3 additional **form types** (estimating, time tracking, client deliverables)
- **80/20 split validated:** 80% forms usage, 20% compliance automation usage

### AI-Assistance Metrics (Evidence-Based)

**Changed from Archon metrics to CLAUDE.md v1.6 metrics:**
- TDD Workflow Compliance: 100% of features (tests BEFORE implementation)
- Evidence Archive Coverage: 100% of issues
- Context Management: `/clear` after tasks
- **Fake Validation Incidents:** 0 (ZERO TOLERANCE)

---

## Budget Updates

**Before (9 months, Archon-based):**
- Personnel: $600,000
- Total Development: $673,000

**After (7 months, forms-first prioritization):**
- Personnel: $400,000 (4 developers + PM + QA)
- Total Development: $454,000
- **Savings:** $146,000 (24% reduction)
- **Time to Market:** 2 months faster

---

## Training Plan Updates

### Week 1: Claude Code Fundamentals (UPDATED)

**Added:**
- CLAUDE.md v1.6 comprehensive review (MANDATORY before ANY code)
- Plan Mode (Shift+Tab twice) for complex features
- Evidence-based TDD workflow (anti-hallucination)
- Context management (`/compact`, `/clear`)

### Week 2: Forms-First Development (NEW)

**Focus changed from compliance to forms:**
- Forms engine priorities (80% development effort)
- Compliance automation as differentiation (20% effort)
- Offline-first architecture (30-day capability)
- iOS persistence requirements (SQLite vs IndexedDB)
- EPA CGP exact 0.25" threshold validation

### Ongoing: Quality Standards (NEW)

**Added zero-tolerance standards:**
- NO emoji, NO AI branding
- Evidence archive for ALL completions (NO fake validation)
- TDD: Tests BEFORE implementation (red → green workflow)
- Quality gates: lint + type-check + test + build (MANDATORY)

---

## Appendix Updates

### ADR-003: Database Choice

**Before:** PostgreSQL 16 with JSONB

**After:** PostgreSQL 15 + TimescaleDB with JSONB
- **Correction:** NOT PostgreSQL 16 (TimescaleDB compatibility requirement)

### ADR-004: AI Development Tools

**Before:** Claude Code + Archon

**After:** Claude Code with evidence-based TDD workflow (CLAUDE.md v1.6)
- **Critical:** NO fake validation, NO toy implementations, MANDATORY evidence archive

### ADR-005: Project Management

**Before:** Archon agent-based management

**After:** GitHub Projects with Kanban boards
- **Correction:** NOT Archon (project uses GitHub for project management)

### Appendix F: AI Tools Setup Guide

**Completely rewritten from Archon to CLAUDE.md v1.6:**
- Session Start Protocol (read CLAUDE.md, verify "Developer" address)
- TDD Workflow (MANDATORY: tests FIRST, red → green)
- Quality Gates (BEFORE COMMIT: lint + type-check + test + build)
- Context Management (0-50% normal, 50-70% compact, 70%+ wrap up)
- Evidence Archive Structure (test-results/, deployment/, performance/, compliance/)

---

## Document Control

### Version History

Added Version 2.0 entry:
> **2.0** | October 1, 2025 | Product Owner + Dev Team | **Forms-first repositioning (80/20 split)**, CLAUDE.md v1.6 alignment, PostgreSQL 15 correction, Capacitor 6 clarification, Evidence-based TDD, GitHub Projects (not Archon)

### Summary Section Added

Comprehensive summary of v2.0 changes including:
- Strategic repositioning (compliance-first → forms-first)
- Technical corrections (PostgreSQL 15, Capacitor 6, GitHub Projects)
- CLAUDE.md v1.6 alignment (TDD, Plan Mode, Context Management)
- Development prioritization (P0 vs P1)
- Success metrics (forms-first focus)

---

## Files Updated

1. **docs/design/sdp-brave-forms.md** (v1.0 → v2.0, 1,055 lines)
   - 45+ sections updated
   - All references to Archon replaced with GitHub Projects
   - PostgreSQL 16 → 15 (all instances)
   - React Native → Capacitor 6 (all instances)

2. **docs/DOCUMENT_LIBRARY.md** (updated sdp-brave-forms.md entry)
   - Added version 2.0 status
   - Listed key updates

---

## Validation Checklist

- [x] Forms-first positioning (80/20) reflected throughout
- [x] PostgreSQL 15 + TimescaleDB (all instances corrected)
- [x] Capacitor 6 with React (all instances corrected)
- [x] GitHub Projects (all Archon references replaced)
- [x] CLAUDE.md v1.6 alignment (TDD, Plan Mode, Context Management)
- [x] Evidence-based completion requirements (NO fake validation)
- [x] Sprint prioritization (P0 forms, P1 compliance)
- [x] Success metrics (forms-first focus)
- [x] Training curriculum (CLAUDE.md v1.6 best practices)
- [x] Risk management (offline + forms-first enforcement)
- [x] Budget updates (7 months, forms-first)
- [x] Version history and summary section

---

## Next Steps

**Remaining Documentation (1 document):**

1. **New Product Vision Document** (3-4 hours estimated)
   - Create from comprehensive_prd.md executive summary
   - Remove emojis, use forms-first messaging
   - Replace archived brave-forms-product-vision.md

**Total Remaining Effort:** 3-4 hours

---

## Completion Status

**sdp-brave-forms.md Update:** ✅ COMPLETE

**Evidence:**
- 1,055 lines reviewed and updated
- 45+ sections aligned with forms-first positioning
- All technical inaccuracies corrected (PostgreSQL 15, Capacitor 6, GitHub Projects)
- CLAUDE.md v1.6 best practices integrated throughout
- Version 2.0 summary section added
- DOCUMENT_LIBRARY.md updated

**Time Spent:** 2.5 hours (within 2-3 hour estimate)

---

**Last Updated:** October 1, 2025
**Status:** COMPLETE - Ready for Product Owner review
