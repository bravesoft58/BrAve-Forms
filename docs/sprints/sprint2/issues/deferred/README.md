# Sprint 2 Deferred Issues

**Date Deferred:** 2025-10-24
**Reason:** Strategic decision to prioritize MVP feature development (Sprints 3-5) over infrastructure optimization
**Target Completion:** After Sprint 5, before production deployment (recommended: Sprint 6: Production Readiness)

---

## Deferred Issues (3 issues, 8 hours)

### ISSUE-072: Backend Container Optimization (3h) - P1

**Purpose:** Multi-stage Dockerfile to reduce backend container size to <500MB

**Why Deferred:**

- Operational efficiency, not blocking feature development
- Current container size (~1GB) acceptable for development
- More optimization opportunities will be discovered after more code is written
- **Best timing:** Right before production deployment

**Dependencies:** Sprint 1 backend complete

---

### ISSUE-073: Separation of Concerns Review (3h) - P1

**Purpose:** Architecture audit to ensure clean service boundaries between backend/frontend

**Why Deferred:**

- Code quality/architecture review task
- **ACTUALLY BETTER after Sprint 5** - will have complete MVP to review
- Current separation is adequate for development
- More valuable with full picture of all features (Sprint 3-5 add significant code)
- **Best timing:** After Sprint 5, before production

**Dependencies:** All backend features complete (Sprint 5)

---

### ISSUE-074: Resource Limits and Health Checks (2h) - P1

**Purpose:** Add Kubernetes health probes (liveness/readiness) and resource limits for production

**Why Deferred:**

- Production operational requirement
- Not needed for local development (Rancher Desktop tolerates missing probes)
- Depends on ISSUE-072 for accurate resource limit sizing
- **Best timing:** Right before production deployment, after load testing

**Dependencies:** ISSUE-072 (for resource sizing)

---

## Strategic Rationale

### Sprint 2 Completion: 24/27 (89%)

**Phase 0-4 Complete (100%):**

- Phase 0: Sprint 1 Carryover (4/4) ✅
- Phase 1: Forms Engine Backend (8/8) ✅
- Phase 2: Photo Documentation (6/6) ✅
- Phase 3: Form Submission Workflow (4/4) ✅
- Phase 4: Template Library (3/3) ✅ **including ISSUE-069, ISSUE-071 completed 2025-10-24**

**Phase 5: Architecture Review (0/3) - DEFERRED:**

- All 3 issues are infrastructure/operational tasks
- Not blocking MVP feature development
- Better value when done closer to production

### Sprint 3-5 Focus: 100% Feature Development

**Sprint 3-4 (estimated):**

- Navigation & UI shell
- Form rendering engine (15 field types)
- Form submission workflow
- QR inspector portal
- 15 Q&D Construction agency-specific form templates

**Sprint 5 (34 issues, 160 hours - verified plan exists):**

- Photo Gallery (grid, lightbox, GPS map, annotations, search)
- Offline Experience UI (sync status, conflict resolution, queue management)
- Settings & Profile (account management, notifications, help)
- Form Builder (drag-drop designer, field palette, conditional logic, preview)
- Production Polish (loading states, error handling, responsive design)

**After Sprint 5:** 100% production-ready MVP

### Benefits of Deferral

1. **Faster Time-to-MVP:** Skip 8 hours of infrastructure work now
2. **Better Architecture Review:** ISSUE-073 more valuable with complete MVP codebase
3. **Right-Sized Infrastructure:** ISSUE-074 resource limits better informed after load testing
4. **Focused Velocity:** 100% team effort on user-facing features
5. **Natural Grouping:** Can create "Sprint 6: Production Readiness" for all pre-production tasks

---

## Recommended: Sprint 6 - Production Readiness

After Sprint 5 completion, before production pilot with Q&D Construction:

**Sprint 6 Scope (estimated 20-30 hours):**

1. ISSUE-072: Backend Container Optimization (3h)
2. ISSUE-073: Separation of Concerns Review (3h) - **NOW with full MVP context**
3. ISSUE-074: Resource Limits & Health Checks (2h)
4. Load Testing & Performance Tuning (4h)
5. Security Audit (4h)
6. Deployment Automation (4h)
7. Production Monitoring Setup (4h)
8. Disaster Recovery Planning (2h)

**Sprint 6 Deliverable:** Production-ready platform ready for Q&D Construction pilot

---

## When to Revisit

**Trigger:** Sprint 5 complete (100% MVP features implemented)

**Action Items:**

1. Review these 3 deferred issues
2. Add to Sprint 6: Production Readiness backlog
3. Prioritize alongside other pre-production tasks
4. Schedule before production pilot launch

---

**Decision Made By:** Development Team
**Date:** 2025-10-24
**Status:** Approved - proceed to Sprint 3
