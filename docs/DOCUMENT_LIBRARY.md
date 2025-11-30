# BrAve Forms - Master Documentation Library

**Last Updated:** 2025-11-30
**Maintained By:** Documentation Library Manager Agent
**Status:** ALIGNED - Sprint 5 Complete, Production-Ready MVP

## Documentation Overview

This master index provides a complete inventory of all documentation in the BrAve Forms repository. Documents are categorized by type, status, and relevance to current development efforts.

## Document Status Legend

- ACTIVE - Current and accurate
- UNDER_REVIEW - May need updates
- DEPRECATED - Outdated but kept for reference
- ARCHIVED - Historical documents
- DUPLICATE - Redundant content to be consolidated

**Note:** Emojis removed from this document per CLAUDE.md v1.6 professional code standards.

---

## Core Project Documentation

### Primary Documentation

- ACTIVE **[README.md](../../README.md)** - Main project overview
  - **Purpose:** Entry point for developers and stakeholders
  - **Status:** Active, well-maintained
  - **Last Updated:** Current
  - **Owner:** Project Team

- ACTIVE **[CLAUDE.md](../../claude.md)** - AI development instructions (v1.6)
  - **Purpose:** Critical workflow and coding standards for AI-assisted development
  - **Status:** Active, version 1.6 (September 30, 2025)
  - **Last Updated:** September 30, 2025
  - **Owner:** Development Team
  - **Note:** MUST be reviewed before any code changes
  - **Enhancements:** Plan Mode, Context Management, TDD workflow, Evidence-based completion, Sub-agent management

### Supporting Technical Documentation (New - Phase 2)

- ACTIVE **[TECH_STACK_DETAILS.md](TECH_STACK_DETAILS.md)** - Comprehensive technical stack
  - **Purpose:** Detailed technology specifications, versions, patterns, and configurations
  - **Status:** Active (Created September 30, 2025)
  - **Referenced By:** CLAUDE.md
  - **Coverage:** Backend, Frontend, Infrastructure, Performance targets, Security

- ACTIVE **[COMMON_PITFALLS.md](COMMON_PITFALLS.md)** - Development anti-patterns guide
  - **Purpose:** Comprehensive guide to avoid common mistakes and violations
  - **Status:** Active (Created September 30, 2025)
  - **Referenced By:** CLAUDE.md
  - **Coverage:** Code quality, testing, compliance, multi-tenancy, offline requirements

- ACTIVE **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Development environment setup
  - **Purpose:** Setup instructions for local development environment
  - **Status:** Active
  - **Location:** Moved to docs/ from root (October 24, 2025)

### Project Management

- ⚠️ **[PROJECT_MANAGEMENT_PLAN.md](../../PROJECT_MANAGEMENT_PLAN.md)** - Active PM plan (Root)
  - **Purpose:** Current project timeline and milestones
  - **Status:** Active but duplicate exists
  - **Issue:** Duplicate in docs/archive folder
  - **Recommendation:** Remove archive version

- 🗄️ **[docs/archive/PROJECT_MANAGEMENT_PLAN.md](../archive/PROJECT_MANAGEMENT_PLAN.md)** - Archived version
  - **Status:** Should be removed (duplicate)

---

## Design & Architecture Documentation

### NEW MASTER DOCUMENTS (October 1, 2025 - Forms-First Repositioning)

- ACTIVE **[Comprehensive PRD](../design/comprehensive_prd.md)** - MASTER PRODUCT REQUIREMENTS
  - **Purpose:** Complete product requirements with forms-first positioning (80% forms, 20% compliance)
  - **Status:** Active (Created October 1, 2025) - REPLACES comprehensive_compliance_prd.md
  - **Size:** 80KB, 1,800+ lines
  - **Research-Validated:** All claims backed by market research
  - **Key Sections:** User personas (Forms Manager Frank primary), Epic hierarchy (Forms Engine P0, Compliance P1), Pricing strategy (user roles, volume discounts)

- ACTIVE **[Product Positioning](../design/product_positioning.md)** - MASTER POSITIONING DOCUMENT
  - **Purpose:** Market positioning, competitive differentiation, go-to-market strategy
  - **Status:** Active (Created October 1, 2025)
  - **Size:** 48KB, 400+ lines
  - **Coverage:** Value proposition hierarchy (80/20), competitive analysis, sales messaging, pricing tiers
  - **Target Market:** Small contractors (5-25 employees) with volume discounts for 25-50

- ACTIVE **[Product Vision v2.0](../design/brave-forms-product-vision.md)** - STRATEGIC VISION DOCUMENT
  - **Purpose:** Strategic vision, mission statement, market opportunity, competitive positioning
  - **Status:** Active (Created October 1, 2025) - REPLACES archived v1.0 (compliance-first)
  - **Size:** 18KB, 450+ lines
  - **Key Sections:** Vision/mission statements, market analysis, 3-phase strategy, ROI calculations, product principles
  - **Positioning:** Forms-first (80%) with compliance automation bonus (20%)
  - **Differentiation:** Construction-native forms specialist vs general tools

### Product & Business Documents

- ACTIVE **[Business Case](../design/brave-forms-business-case.md)**
  - **Purpose:** ROI analysis and investment justification
  - **Status:** Active - NEEDS UPDATE per DESIGN_DOCS_UPDATE_SUMMARY.md
  - **Update Required:** Reframe ROI around time savings (primary) vs compliance fines (secondary)

- ARCHIVED **[Product Vision](../archive/design/legacy/brave-forms-product-vision.md)**
  - **Status:** ARCHIVED (October 1, 2025) - Compliance-first positioning, contains emojis
  - **Superseded By:** comprehensive_prd.md executive summary
  - **Action Required:** Rewrite using forms-first messaging

- ARCHIVED **[Comprehensive Compliance PRD](../archive/design/legacy/comprehensive_compliance_prd.md)**
  - **Status:** ARCHIVED (October 1, 2025) - Compliance-first (60/40 split)
  - **Superseded By:** comprehensive_prd.md with correct 80/20 forms/compliance split

- ARCHIVED **[Market Requirements Document](../archive/design/legacy/Market-Requirements-Document.md)**
  - **Status:** ARCHIVED (October 1, 2025) - EPA threshold error (0.5" vs 0.25"), compliance-first
  - **Superseded By:** comprehensive_prd.md Market Opportunity section
  - **Critical Issue:** Documented 0.5" rain threshold (INCORRECT per EPA CGP 2022)

- ARCHIVED **[Product Requirements Document (Early Version)](../archive/design/legacy/Product-Requirements-Document-EARLY-VERSION.txt)**
  - **Status:** ARCHIVED - Very early text file version
  - **Superseded By:** comprehensive_prd.md

### Technical Architecture

- ✅ **[Revised Architecture with Clerk](../design/revised_architecture_clerk.md)**
  - **Purpose:** Current system design with Clerk authentication
  - **Status:** Active, current architecture
- ACTIVE **[Software Architecture Document](../design/brave-forms-sad.md)**
  - **Purpose:** Detailed software architecture
  - **Status:** Active (UPDATED October 1, 2025)
  - **Update:** Forms-first positioning complete, priority levels added (P0 forms, P1 compliance)

- ACTIVE **[API Interface Control](../design/brave-forms-api-icd.md)**
  - **Purpose:** GraphQL API specifications
  - **Status:** Active (UPDATED October 1, 2025)
  - **Update:** User role types added (FIELD $39, OFFICE $19, INSPECTOR FREE), JWT claims enhanced

- ACTIVE **[Database Design](../design/database%20design%20document.md)**
  - **Purpose:** PostgreSQL 15 schema with JSONB
  - **Status:** Active (UPDATED October 1, 2025)
  - **Update:** PostgreSQL 15 verified, user role schema added with pricing tiers

### Tech Stack Documentation

- ACTIVE **[TECH_STACK_DETAILS.md](TECH_STACK_DETAILS.md)** - MASTER TECH STACK (Root docs/)
  - **Purpose:** Single authoritative source for all technology decisions
  - **Status:** Active (Created September 30, 2025)
  - **Coverage:** Backend, Frontend, Infrastructure, Performance targets, Security
  - **Referenced By:** CLAUDE.md, comprehensive_prd.md

- ARCHIVED **Tech Stack Duplicates (Consolidated October 1, 2025)**
  - **[TECH_STACK.md](../archive/design/duplicate/TECH_STACK.md)** - Original version
  - **[brave-forms-final-tech-stack.md](../archive/design/duplicate/brave-forms-final-tech-stack.md)** - "Final" version
  - **[Tech Stack Recommendations.md](../archive/design/duplicate/Tech-Stack-Recommendations.md)** - Recommendations
  - **Status:** All three consolidated into TECH_STACK_DETAILS.md
  - **Reason:** Inconsistencies (PostgreSQL 15 vs 16, React Native vs Capacitor 6), maintenance burden

### Requirements & Specifications

- ARCHIVED **[Functional Requirements](../archive/design/legacy/brave-forms-frd.md)**
  - **Status:** ARCHIVED (October 1, 2025) - Compliance-heavy module priorities
  - **Superseded By:** comprehensive_prd.md Feature Requirements section
  - **Action Required:** Major rewrite (8-12 hours) - Reorder modules: Forms Engine first, Compliance last

- ACTIVE **[Non-Functional Requirements](../design/brave-forms-nfr.md)**
  - **Purpose:** Performance, security, compliance requirements
  - **Status:** Active (UPDATED October 1, 2025)
  - **Update:** EPA requirements reframed with forms workflow context, compliance automation emphasis

- ✅ **[Use Cases](../design/brave-forms-use-cases.md)**
  - **Purpose:** User scenarios and workflows
  - **Status:** Active

- ACTIVE **[UX Design Document](../design/brave-forms-ux-design-doc.md)**
  - **Purpose:** Field-optimized UI specifications
  - **Status:** Active (UPDATED October 1, 2025)
  - **Update:** User journey maps emphasize forms workflows, user role pricing added ($39 Field, $19 Office, FREE Inspector)

- ACTIVE **[Software Development Plan v2.0](../design/sdp-brave-forms.md)** - Forms-first repositioning
  - **Purpose:** Development methodology, AI practices, CLAUDE.md v1.6 alignment
  - **Status:** Active (Updated October 1, 2025)
  - **Version:** 2.0 (Forms-first 80/20 split)
  - **Key Updates:** Evidence-based TDD, PostgreSQL 15 correction, Capacitor 6 clarification, GitHub Projects

- ⚠️ **[Product Requirements Document.txt](../design/Product%20Requirements%20Document.txt)**
  - **Purpose:** Product requirements
  - **Status:** Under review - appears to be older version
  - **Issue:** Text file format, may duplicate comprehensive_compliance_prd.md

---

## Sprint Documentation

### Sprint 5 - COMPLETE (November 30, 2025)

- COMPLETE **[Sprint 5 Master Plan](../sprints/sprint5/SPRINT_5_MASTER_PLAN.md)**
  - **Purpose:** Production-Ready MVP with Photo Gallery, Offline UI, Settings, and Form Builder
  - **Status:** COMPLETE (November 30, 2025)
  - **Total Issues:** 43/43 (100%)
  - **Phase 0:** Production-Ready Fixes (ISSUE-162 to ISSUE-167) - COMPLETE (6.5/6.5)
  - **Phase 1:** Photo Gallery (ISSUE-128 to ISSUE-133) - COMPLETE (6/6)
  - **Phase 2:** Offline Experience UI (ISSUE-134 to ISSUE-140) - COMPLETE (8/8)
  - **Phase 3:** Settings & Profile (ISSUE-141 to ISSUE-145) - COMPLETE (5/5)
  - **Phase 4:** Polish & Testing (ISSUE-146 to ISSUE-148) - COMPLETE (5/5)
  - **Phase 5:** Form Builder (ISSUE-148 to ISSUE-161) - COMPLETE (12/12)

- COMPLETE **[Sprint 5 Completion Report](../sprints/sprint5/SPRINT_5_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation with evidence and metrics
  - **Status:** COMPLETE (November 30, 2025)
  - **Key Deliverables:** Photo Gallery, Offline UI, Form Builder, 550+ tests
  - **Production Status:** 100% MVP ready for Q&D Construction pilot
  - **Form Builder:** Complete drag-drop designer with Valtio state management

### Sprint 4 - CLOSED (November 27, 2025)

- CLOSED **[Sprint 4 Master Plan](../sprints/sprint4/SPRINT_4_ISSUES_SUMMARY.md)**
  - **Purpose:** QR Inspector Portal and Q&D Agency Templates
  - **Status:** CLOSED (November 27, 2025)
  - **Total Issues:** 25/26 (96%) - ISSUE-126 moved to Sprint 5
  - **Phase 1:** QR Inspector Portal (ISSUE-100 to ISSUE-105) - COMPLETE (6/6)
  - **Phase 2:** Q&D Agency Templates (ISSUE-106 to ISSUE-117) - COMPLETE (12/12)
  - **Phase 3:** Testing & Polish (ISSUE-118 to ISSUE-127) - COMPLETE (9/10)
  - **Carried Over:** ISSUE-126 (Load Testing) moved to Sprint 5

- CLOSED **[Sprint 4 Completion Report](../sprints/sprint4/SPRINT_4_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation with Q&D pilot readiness
  - **Status:** CLOSED (November 27, 2025)
  - **Key Deliverables:** QR Portal (77 tests), 20+ templates, E2E test suite
  - **Pilot Status:** APPROVED for Q&D Construction deployment
  - **Bugs Fixed:** BUG-001 (Mobile layout), BUG-002 (Title duplication)

### Sprint 3 - COMPLETE (November 25, 2025)

- COMPLETED **[Sprint 3 Master Plan](../sprints/sprint3/SPRINT_3_MASTER_PLAN.md)**
  - **Purpose:** Frontend UI development sprint - Forms Runtime and Testing
  - **Status:** COMPLETE (November 25, 2025)
  - **Total Issues:** 38/38 (100%)
  - **Phase 1:** Navigation Components (ISSUE-076 to ISSUE-083) - COMPLETE (8/8)
  - **Phase 2:** Dashboard Pages (ISSUE-084 to ISSUE-089) - COMPLETE (6/6)
  - **Phase 3:** Forms Builder (ISSUE-090 to ISSUE-099) - COMPLETE (10/10)
  - **Phase 4:** Forms Runtime (ISSUE-100 to ISSUE-109) - COMPLETE (10/10)
  - **Phase 5:** Forms Submission (ISSUE-100 to ISSUE-104) - COMPLETE (5/5)
  - **Phase 6:** Cloning (ISSUE-105 to ISSUE-108) - COMPLETE (4/4)
  - **Phase 7:** Testing & Polish (ISSUE-109 to ISSUE-113) - COMPLETE (5/5)

- COMPLETED **[Sprint 3 Completion Report](../sprints/sprint3/SPRINT_3_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation with evidence and metrics
  - **Status:** COMPLETE (November 25, 2025)
  - **Tests:** 54+ tests passing (unit, integration, E2E, offline)
  - **Coverage:** Form submission, cloning workflow, offline sync, accessibility

- COMPLETED **[Sprint 3 Phase 1 Completion Report](../sprints/sprint3/SPRINT_3_PHASE_1_COMPLETION.md)**
  - **Purpose:** Complete documentation of Phase 1 navigation components
  - **Status:** COMPLETE (October 24, 2025)
  - **Issues Completed:** 8/8 (ISSUE-076 through ISSUE-083)
  - **Key Achievements:** Aggressive compact design system, mobile-first, no emoji/AI branding
  - **Git Commits:** bc72019, 658b66b, f1fd501 (all merged to master)

### Recently Completed Sprints

- COMPLETED **[Sprint 2 Master Plan](../sprints/sprint2/SPRINT_2_MASTER_PLAN.md)**
  - **Purpose:** Forms Engine foundation sprint
  - **Status:** Completed (October 2025)
  - **Issues:** 24 completed (ISSUE-047 through ISSUE-071, plus ISSUE-114)
  - **Achievements:** Form schema, GraphQL types, photo upload, 11 EPA templates

- COMPLETED **[Sprint 1 Master Plan (FINAL)](../sprints/sprint1/SPRINT_1_MASTER_PLAN_FINAL.md)**
  - **Purpose:** Infrastructure and deployment foundation
  - **Status:** Completed (October 2025)
  - **Format:** 46 atomic issues completed
  - **Approach:** Evidence-based, Kubernetes deployment focus
  - **Achievement:** Backend API deployed, TanStack Query migration, weather service

- ACTIVE **[ISSUE-047: Discovery Tracker](../sprints/sprint1/issues/ISSUE-047-discovery-tracker.md)** - NEW
  - **Purpose:** Centralized tracker for new issues uncovered during Sprint 1 implementation
  - **Status:** Active (Created October 1, 2025)
  - **Tracks:** 3 critical blockers, 4 monitoring requirements, 2 documentation gaps, 2 resolved technical debt
  - **Critical Items:**
    - BLOCKER-001: TanStack Query version mismatch (5.14.2 vs 5.86.0)
    - BLOCKER-002: Valtio store hard dependency verification needed
    - BLOCKER-003: iOS IndexedDB transience (CRITICAL for EPA compliance - data loss risk)
  - **Sprint Assignments:** Sprint 2 (blockers), Sprint 3 (monitoring), Sprint 5 (iOS SQLite)
  - **Integration:** Links to deployment tracker, converts to GitHub issues

- ACTIVE **[Deployment Requirements Tracker](../sprints/DEPLOYMENT_REQUIREMENTS_TRACKER.md)** - NEW
  - **Purpose:** Pre-production deployment checklist to ensure critical requirements not forgotten
  - **Status:** Active (Created October 1, 2025)
  - **Coverage:** 3 critical pre-production blockers, 4 monitoring requirements, 30+ item deployment checklist
  - **Source:** ISSUE-012 deployment requirements discovery
  - **Review Schedule:** Weekly standup, sprint planning, pre-release gate
  - **Escalation Path:** Same-day flagging, 24-hour escalation to Product Owner

- ACTIVE **[Deployment Requirements Resolved](../sprints/DEPLOYMENT_REQUIREMENTS_RESOLVED.md)** - NEW
  - **Purpose:** Historical archive for completed deployment requirements
  - **Status:** Active (Created October 1, 2025)
  - **Tracks:** Resolution evidence, lessons learned, completion statistics
  - **Integration:** Items moved from tracker when resolved

- ACTIVE **[Sprint 1 Issues (20 Atomic Tasks)](../sprints/sprint1/issues/)**
  - **Purpose:** Individual issue tracking with step-by-step instructions
  - **Status:** Active
  - **Phase 0 - Pre-Deployment:** ISSUE-001 through ISSUE-003 (port check, images, secrets)
  - **Phase 1 - Kubernetes:** ISSUE-004 through ISSUE-008 (deploy postgres, redis, migrations, seed)
  - **Phase 2 - Backend:** ISSUE-009 through ISSUE-010 (deploy backend, test GraphQL)
  - **Phase 3 - Apollo Removal:** ISSUE-011 through ISSUE-015 (remove Apollo, migrate TanStack Query)
  - **Phase 4 - Weather API:** ISSUE-016 through ISSUE-018 (NOAA client, 0.25" threshold, caching)
  - **Phase 5 - PWA & Testing:** ISSUE-019 through ISSUE-020 (PWA config, test coverage 40%)

- ACTIVE **[Sprint 1 Evidence](../sprints/sprint1/evidence/)**
  - **Purpose:** Real proof of completed work (NO mocks, NO fake validation)
  - **Status:** Active
  - **Requirements:** Actual screenshots, real API responses, genuine test results
  - **Structure:** deployment/, test-results/, performance/, compliance/
  - **Per Issue:** Separate folder for each ISSUE-001 through ISSUE-020
  - **Recent Additions:**
    - **ISSUE-010/COMPLETION-REPORT.md** - GraphQL API testing with Playwright MCP (authentication verified, schema introspection)
    - **ISSUE-012/COMPLETION-REPORT-FINAL.md** - TanStack Query setup (research phase, code review, networkMode fix)
    - **ISSUE-012/deployment/DEPLOYMENT_REQUIREMENTS.md** - Comprehensive deployment checklist (dependencies, monitoring, iOS warnings, rollback procedures)

### Legacy Sprint Plans (ARCHIVED - Historical Only)

**WARNING:** These documents claimed "COMPLETED" for features that were only partially implemented or not implemented at all. Archived for historical context only.

- ARCHIVED **[docs/archive/sprints/SPRINT_1_PLAN_LEGACY.md](../archive/sprints/SPRINT_1_PLAN_LEGACY.md)**
  - **Status:** Archived (claimed complete, actually minimal implementation)
  - **Reality:** Weather API structure only, no actual API calls
  - **See:** [Archive README](../archive/sprints/README.md) for context

- ARCHIVED **[docs/archive/sprints/sprint2/](../archive/sprints/sprint2/)**
  - **Status:** Archived (claimed complete, EPA rules not implemented)

- ARCHIVED **[docs/archive/sprints/sprint3/](../archive/sprints/sprint3/)**
  - **Status:** Archived (claimed complete, web build failing)

- ARCHIVED **[docs/archive/sprints/sprint4/](../archive/sprints/sprint4/)**
  - **Status:** Archived (claimed complete, zero implementation)

### Other Sprint Planning Documents

- UNDER_REVIEW **[Master Sprint Roadmap V2](../sprints/MASTER_SPRINT_ROADMAP_V2.md)**
  - **Purpose:** High-level sprint planning (may need update based on reality check)
  - **Status:** Under review

- UNDER_REVIEW **[Sprint Execution Guide](../sprints/SPRINT_EXECUTION_GUIDE.md)**
  - **Purpose:** Sprint execution methodology
  - **Status:** Under review (may need atomic task updates)

- UNDER_REVIEW **[Web MVP Launch Plan](../sprints/WEB_MVP_LAUNCH_PLAN.md)**
  - **Purpose:** Web platform launch strategy
  - **Status:** Under review (dependent on Sprint 1 completion)

- UNDER_REVIEW **[Mobile Sprints 7-10 Plan](../sprints/MOBILE_SPRINTS_7-10_PLAN.md)**
  - **Purpose:** Mobile development sprints
  - **Status:** Under review (mobile at 0% implementation)

### Archived General Sprint Documents

- ARCHIVED **[docs/archive/MASTER_SPRINT_ROADMAP.md](../archive/MASTER_SPRINT_ROADMAP.md)** - Old roadmap
- ARCHIVED **[docs/archive/SPRINT_PLAN.md](../archive/SPRINT_PLAN.md)** - Original sprint plan
- ARCHIVED **[docs/archive/SPRINTS_3-10_OVERVIEW.md](../archive/SPRINTS_3-10_OVERVIEW.md)** - Old overview
- ARCHIVED **[docs/archive/SPRINT_3_SUMMARY.md](../archive/SPRINT_3_SUMMARY.md)** - Sprint 3 summary
- ARCHIVED **[docs/archive/alignment.md](../archive/alignment.md)** - Alignment notes

---

## 🤖 AI Agent Documentation

### Agent Configurations (.claude/agents/)

25 specialized AI development agents configured for different domains:

#### Core Development Agents

- ✅ **[Database Schema Architect](../../.claude/agents/database-schema-architect.md)**
- ✅ **[API Integration Architect](../../.claude/agents/api-integration-architect.md)**
- ✅ **[GraphQL API Specialist](../../.claude/agents/graphql-api-specialist.md)**
- ✅ **[Frontend UX Developer](../../.claude/agents/frontend-ux-developer.md)**
- ✅ **[Mobile App Builder](../../.claude/agents/mobile-app-builder.md)**

#### Specialized Feature Agents

- ✅ **[Compliance Engine Developer](../../.claude/agents/compliance-engine-developer.md)**
- ✅ **[Offline Sync Specialist](../../.claude/agents/offline-sync-specialist.md)**
- ✅ **[Weather Integration Specialist](../../.claude/agents/weather-integration-specialist.md)**
- ✅ **[Forms Engine Developer](../../.claude/agents/forms-engine-developer.md)**
- ✅ **[QR Inspector Portal Developer](../../.claude/agents/qr-inspector-portal-developer.md)**
- ✅ **[Photo Storage Optimizer](../../.claude/agents/photo-storage-optimizer.md)**
- ✅ **[Queue Processing Engineer](../../.claude/agents/queue-processing-engineer.md)**

#### Infrastructure & Operations

- ✅ **[Infrastructure Designer](../../.claude/agents/infrastructure-designer.md)**
- ✅ **[DevOps Pipeline Engineer](../../.claude/agents/devops-pipeline-engineer.md)**
- ✅ **[Multi-Tenant Architect](../../.claude/agents/multi-tenant-architect.md)**
- ✅ **[Security Compliance Officer](../../.claude/agents/security-compliance-officer.md)**
- ✅ **[Performance Optimizer](../../.claude/agents/performance-optimizer.md)**
- ✅ **[Chaos Engineer](../../.claude/agents/chaos-engineer.md)**

#### Quality & Documentation

- ✅ **[Test Automation Engineer](../../.claude/agents/test-automation-engineer.md)**
- ✅ **[Technical Writer](../../.claude/agents/technical-writer.md)**
- ✅ **[Doc Library Manager](../../.claude/agents/doc-library-manager.md)** (This agent)
- ✅ **[Doc Sync Guardian](../../.claude/agents/doc-sync-guardian.md)**

#### Management

- ✅ **[Product Owner](../../.claude/agents/product-owner.md)**
- ✅ **[Project Manager](../../.claude/agents/project-manager.md)**
- ✅ **[Scrum Master](../../.claude/agents/scrum-master.md)**

### Agent Configuration Files

- ACTIVE **[brave-forms-agents.md](agents/brave-forms-agents.md)** - Agent overview and configuration
  - **Purpose:** Central configuration for all AI agents
  - **Status:** Active
  - **Location:** Moved to docs/agents/ (October 24, 2025)

---

## 📝 Supporting Documentation (.claude/)

- ✅ **[business-requirements-md.txt](../../.claude/business-requirements-md.txt)**
  - **Purpose:** EPA/OSHA compliance requirements
  - **Status:** Active

- ✅ **[clerk-implementation-md.txt](../../.claude/clerk-implementation-md.txt)**
  - **Purpose:** Clerk authentication implementation guide
  - **Status:** Active

- ✅ **[database-patterns-md.txt](../../.claude/database-patterns-md.txt)**
  - **Purpose:** Database design patterns
  - **Status:** Active

- ✅ **[ui-standards-md.txt](../../.claude/ui-standards-md.txt)**
  - **Purpose:** UI/UX standards for construction field use
  - **Status:** Active

---

## Legacy & Outdated Documentation

### Archived Project Status Documents (October 24, 2025)

Documents moved from root to archive/project-status/:

- ARCHIVED **[ACTUAL_IMPLEMENTATION_STATUS.md](archive/project-status/ACTUAL_IMPLEMENTATION_STATUS.md)**
  - **Purpose:** Historical implementation status snapshot
  - **Status:** Archived (September 30, 2025 snapshot)

- ARCHIVED **[CODEBASE_STATUS_REPORT.md](archive/project-status/CODEBASE_STATUS_REPORT.md)**
  - **Purpose:** Historical codebase status report
  - **Status:** Archived (September 30, 2025 snapshot)

- ARCHIVED **[DESIGN_DOCS_UPDATE_SUMMARY.md](archive/project-status/DESIGN_DOCS_UPDATE_SUMMARY.md)**
  - **Purpose:** Forms-first repositioning design doc updates
  - **Status:** Archived (October 1, 2025 - completed)

- ARCHIVED **[FORMS_FIRST_REPOSITIONING_COMPLETE.md](archive/project-status/FORMS_FIRST_REPOSITIONING_COMPLETE.md)**
  - **Purpose:** Documentation of forms-first pivot completion
  - **Status:** Archived (October 1, 2025 - completed)

- ARCHIVED **[ULTRA_THINK_MODE_ANALYSIS.md](archive/project-status/ULTRA_THINK_MODE_ANALYSIS.md)**
  - **Purpose:** Strategic analysis for forms-first pivot
  - **Status:** Archived (October 1, 2025 - completed)

### Legacy Folders Archived (October 24, 2025)

- ARCHIVED **[frontend/](archive/legacy-project/frontend/)**
  - **Purpose:** Old frontend folder (duplicate of apps/web)
  - **Status:** Archived - superseded by apps/web structure

- ARCHIVED **[Spec Updates/](archive/spec-updates-oct-24/)**
  - **Purpose:** October 24 specification updates and forms
  - **Status:** Archived - contains various PRDs and forms samples

### "To Be Updated" Folder (Previously Documented)

- ARCHIVED **[To Be Updated/](archive/legacy-project/To%20Be%20Updated/)**
  - **Purpose:** Old project with different tech stack
  - **Status:** Archived to legacy-project folder
  - **Tech Stack:** Express, MongoDB (deprecated)

---

## Issues Resolved (October 24, 2025)

### All Issues Fixed During Alignment:

1. **Duplicate Documents** - RESOLVED
   - Tech Stack documentation consolidated into single TECH_STACK_DETAILS.md
   - PROJECT_MANAGEMENT_PLAN.md duplicate removed from archive

2. **Misplaced Documents** - RESOLVED
   - brave-forms-agents.md moved to docs/agents/
   - SPRINT_1_STATUS.md moved to docs/sprints/sprint1/
   - Project status documents archived to docs/archive/project-status/
   - DEVELOPMENT_SETUP.md moved to docs/

3. **Outdated Content** - RESOLVED
   - "To Be Updated" folder archived to docs/archive/legacy-project/
   - Old frontend folder archived
   - Spec Updates folder archived with date stamp

4. **Cleanup Completed** - RESOLVED
   - Empty uploads folder removed
   - web-server.log removed
   - test-minio-manually.js moved to tests/
   - Screenshots organized in sprint1/evidence/screenshots/
   - Empty evidence folders cleaned up

---

## Recommended Actions

### Completed Actions (October 24, 2025)

All previously identified actions have been completed:

- Tech Stack consolidated into TECH_STACK_DETAILS.md
- Project status documents archived appropriately
- Files moved to correct locations
- Legacy content archived with proper organization
- Empty folders removed

### Future Maintenance Recommendations

1. **Regular Cleanup Schedule:**
   - Weekly: Review root folder for new misplaced files
   - Monthly: Archive completed sprint documentation
   - Quarterly: Full documentation audit

2. **Naming Conventions:**
   - Enforce lowercase with hyphens for all new files
   - No spaces in filenames
   - Date stamps in YYYY-MM-DD format for archives

3. **Documentation Standards:**
   - Keep all documentation in docs/ folder
   - Archive completed work promptly
   - Maintain DOCUMENT_LIBRARY.md as single source of truth

---

## Documentation Health Metrics

- **Total Documents:** 80+ (after full repository alignment)
- **Active Documents:** 50 (core docs + active sprint work)
- **Archived Documents:** 30+ (project status, legacy content, spec updates)
- **Deprecated/Outdated:** 0 (all properly archived)
- **Duplicates Found:** 0 (all resolved)
- **Misplaced Files:** 0 (all relocated to proper folders)
- **Coverage:** Excellent for design/architecture, comprehensive technical documentation, deployment tracking, sprint progress
- **New Coverage Areas:**
  - Sprint 3 Phase 1 navigation components complete documentation
  - Sprint completion tracking across Sprint 1, 2, and 3
  - Evidence-based completion reports for all major work
  - Real-time sprint progress tracking
- **Forms-First Alignment:** 15/15 documents (100% consistency)
- **Sprint Progress:**
  - Sprint 1: COMPLETE (46 issues - 100%)
  - Sprint 2: COMPLETE (24 issues - 100%)
  - Sprint 3: COMPLETE (38/38 issues - 100%) - Completed November 25, 2025
  - Sprint 4: CLOSED (25/26 issues - 96%) - Closed November 27, 2025, ISSUE-126 moved to Sprint 5
  - Sprint 5: COMPLETE (43/43 issues - 100%) - Completed November 30, 2025 - Production-Ready MVP

---

## Maintenance Schedule

- **Weekly:** Review sprint documentation updates
- **Bi-weekly:** Verify technical docs match implementation
- **Monthly:** Full documentation audit and cleanup
- **Quarterly:** Archive outdated sprint documents, Review CLAUDE.md effectiveness

## Recent Changes (September 30, 2025)

### Phase 2 Documentation Enhancements

1. **CLAUDE.md upgraded to v1.6:**
   - Removed all emojis (professional code standard)
   - Added Plan Mode (Shift+Tab twice) section
   - Added Context Management strategies
   - Enhanced TDD workflow with anti-hallucination approach
   - Added Evidence-Based Completion section
   - Added Sub-Agent Management guidance

2. **New Technical Documents:**
   - TECH_STACK_DETAILS.md - Extracted from CLAUDE.md for clarity
   - COMMON_PITFALLS.md - Comprehensive anti-patterns guide

3. **Documentation Standards:**
   - Removed emojis from DOCUMENT_LIBRARY.md
   - Updated all status indicators to text-only format
   - Added Phase 2 completion tracking

### Phase 3: Forms-First Repositioning (October 1, 2025) - COMPLETED

**Strategic Initiative:** Reposition BrAve Forms from compliance-first to forms-first

#### New Master Documents Created:

1. **comprehensive_prd.md (80KB):** Master PRD with 80/20 forms/compliance split
   - User personas: Forms Manager Frank (primary), Compliance Carlos (tertiary)
   - Epic hierarchy: Forms Engine P0, Compliance P1
   - Pricing strategy: User roles (Field $39, Office $19, Inspector FREE), volume discounts
   - Issues/Actions tracking (Epic 7) for competitive parity with SafetyCulture

2. **product_positioning.md (48KB):** Market positioning and go-to-market
   - Value proposition: 80% forms messaging, 20% compliance bonus
   - Target market: 5-25 employees (PRIMARY), 25-50 with volume discounts (STRETCH)
   - Competitive analysis: vs Procore (too expensive), SafetyCulture (not construction-specific)
   - Sales framework: Discovery questions, objection handling, ROI calculator

#### Documents Archived (October 1, 2025):

- **Legacy (Compliance-First):** 4 documents moved to docs/archive/design/legacy/
  - comprehensive_compliance_prd.md (compliance-first 60/40 split)
  - brave-forms-product-vision.md (contains emojis, compliance-first)
  - Market Requirements Document.md (EPA threshold error 0.5" vs 0.25")
  - brave-forms-frd.md (wrong module priorities)
  - Product Requirements Document.txt (very early version)

- **Duplicates (Consolidated):** 3 documents moved to docs/archive/design/duplicate/
  - TECH_STACK.md, brave-forms-final-tech-stack.md, Tech Stack Recommendations.md
  - All consolidated into TECH_STACK_DETAILS.md

#### Files Removed (October 1, 2025):

- Binary files (5): .docx files (808KB), .png screenshots (320KB), package.json
- Reason: Unrelated (GIRGID screenshots), binary format, or superseded

#### Key Corrections Applied:

1. **Target Market:** Changed from "10-500 employees" to "5-25 employees (PRIMARY)"
2. **Volume Discounts:** Added 15% (11-25 users), 25% (26-50 users) discounts
3. **User Role Pricing:** Field User ($39), Office User ($19), Inspector Portal (FREE)
4. **EPA Threshold:** Documented correct 0.25" (not 0.5" error in archived docs)
5. **SWPPP Differentiation:** Automation vs templates (SafetyCulture has templates)

#### Design Folder Summary:

- **Before:** 26 files (1.8MB) with duplicates and binary files
- **After:** 13 markdown files (450KB) - 75% reduction
- **Active Documents:** 11 aligned with forms-first direction
- **Archive Structure:** docs/archive/design/legacy/ and duplicate/

#### Related Documents:

- ULTRA_THINK_MODE_ANALYSIS.md - Strategic validation with research
- DESIGN_DOCS_UPDATE_SUMMARY.md - Action plan for remaining 5 docs
- DESIGN_DOCS_REVIEW_AND_ARCHIVE_PLAN.md - Complete archive execution plan

### Phase 4: Final 5 Documents Update (October 1, 2025) - COMPLETED

**Objective:** Complete forms-first alignment for remaining 5 technical design documents

**Documents Updated:**

1. **brave-forms-sad.md** - Software Architecture Document
   - Forms service priority: P0 (Core product functionality)
   - Compliance engine priority: P1 (Competitive differentiation)
   - Enhanced feature descriptions with 50+ templates, multi-format export
   - PostgreSQL 15 database emphasis on JSONB for forms first

2. **brave-forms-nfr.md** - Non-Functional Requirements
   - EPA requirements reframed with forms workflow context
   - Added time savings metric: 2-3 hours to 30 minutes
   - Compliance automation positioned as supporting feature

3. **brave-forms-api-icd.md** - API Interface Control Document
   - Added user role types in JWT: FIELD, OFFICE, INSPECTOR
   - Added pricing tier metadata: field $39, office $19, inspector FREE
   - Enhanced role_metadata structure with features_enabled

4. **database design document.md** - Database Schema
   - Verified PostgreSQL 15 (corrected any PostgreSQL 16 references)
   - Added user_role_type ENUM with pricing tiers
   - Created users table schema with pricing_tier CHECK constraint

5. **brave-forms-ux-design-doc.md** - UX Design
   - User journey maps emphasize forms workflows
   - Added user role pricing to personas (Field $39, Office $19, Inspector FREE)
   - Time savings metric prominent: "2-3 hours reduced to 30 minutes via smart forms"

**Evidence:**

- REMAINING_DOCS_UPDATE_COMPLETE.md - Detailed completion report with line-by-line changes

**Results:**

- Total documents aligned: 15 (10 previously + 5 now)
- Forms-first positioning: 100% consistency across all documentation
- Technical accuracy: PostgreSQL 15, Capacitor 6, user role pricing verified
- NO emoji, NO AI branding maintained

### Phase 5: Sprint 1 Discovery & Deployment Tracking (October 1, 2025) - COMPLETED

**Strategic Initiative:** Ensure critical deployment requirements and discovered issues are not forgotten

#### New Documents Created:

1. **ISSUE-047: Discovery Tracker** (sprint1/issues/ISSUE-047-discovery-tracker.md)
   - Centralized tracker for issues uncovered during Sprint 1 implementation
   - Tracks 11 total issues: 3 critical blockers, 4 monitoring requirements, 2 documentation gaps, 2 resolved technical debt
   - **Critical Blockers:**
     - BLOCKER-001: TanStack Query version mismatch (5.14.2 vs 5.86.0) → Sprint 2
     - BLOCKER-002: Valtio store hard dependency verification → Sprint 2
     - BLOCKER-003: iOS IndexedDB transience (EPA compliance risk) → Sprint 5
   - Integration: Converts to GitHub issues, links to deployment tracker
   - Review schedule: Weekly standup, sprint planning

2. **Deployment Requirements Tracker** (sprints/DEPLOYMENT_REQUIREMENTS_TRACKER.md)
   - Pre-production deployment checklist (30+ items)
   - 3 critical pre-production blockers with action plans
   - 4 production monitoring requirements with implementation specs
   - Sprint integration roadmap (Sprint 2, 3, 5 assignments)
   - Escalation path: Same-day flagging, 24-hour escalation to Product Owner
   - Review schedule: Weekly standup, sprint planning, pre-release gate

3. **Deployment Requirements Resolved** (sprints/DEPLOYMENT_REQUIREMENTS_RESOLVED.md)
   - Historical archive for completed deployment requirements
   - Tracks resolution evidence, lessons learned, completion statistics
   - Integration: Items moved from tracker when resolved

4. **ISSUE-012 Deployment Requirements** (sprint1/evidence/ISSUE-012/deployment/DEPLOYMENT_REQUIREMENTS.md)
   - Comprehensive deployment checklist for TanStack Query implementation
   - Dependency version management (5.14.2 vs 5.86.0 gap analysis)
   - Critical runtime dependencies (Valtio store exports required)
   - Browser storage requirements (IndexedDB, localStorage, iOS warnings)
   - Production monitoring requirements (5 critical metrics with code)
   - iOS-specific considerations (IndexedDB transience, SQLite migration plan)
   - Rollback procedures (3 options with detailed steps)
   - Success metrics and automated monitoring

#### Evidence Documentation:

- **ISSUE-010/COMPLETION-REPORT.md** - GraphQL API testing with Playwright MCP
  - Authentication properly requires Clerk JWT (correct behavior)
  - Schema introspection working
  - Discovered: `organizations` query doesn't exist (uses `projects` instead)

- **ISSUE-012/COMPLETION-REPORT-FINAL.md** - TanStack Query setup
  - Research phase: Web searches for v5 best practices
  - Code review: Frontend-ux-developer agent found networkMode issue
  - Consolidation: Deleted duplicate, fixed existing implementation
  - CRITICAL FIX: Changed networkMode from 'online' to 'offlineFirst'

#### Integration into Workflow:

- **Sprint Planning:** Discovery tracker issues assigned to Sprint 2, 3, 5
- **Weekly Standup:** Review blocker status, flag at-risk items
- **Pre-Release Gate:** 30+ item deployment checklist MUST be completed
- **GitHub Issues:** Convert discovered issues to trackable items with assignments

#### Key Discoveries:

- 72 minor version jump in TanStack Query (5.14.2 → 5.86.0)
- Hard dependency on Valtio store (3 required exports)
- iOS IndexedDB transience (CRITICAL for EPA compliance - data loss risk)
- networkMode configuration error in existing code (violated offline-first requirement)
- GraphQL schema documentation mismatch (organizations vs projects query)

### Next Phase (Pending)

- KUBERNETES_GUIDE.md - Local development and production deployment
- EPA_COMPLIANCE_REQUIREMENTS.md - Regulatory requirements and validation

---

_This master library is maintained by the Documentation Library Manager agent and should be updated whenever documentation changes occur._

**Last Full Audit:** October 24, 2025 (Complete Repository Alignment)
**Next Scheduled Audit:** November 1, 2025
**Last Update:** October 24, 2025 (Full repository alignment completed)

---

## Phase 6: Documentation Cleanup (October 3, 2025) - COMPLETED

**Objective:** Archive legacy/unused documentation to prevent confusion during Sprint 2 transition

### Documents Archived:

**Legacy Sept 30 Reports** (archived to docs/archive/sprints/legacy-sept30-reports/):

- SPRINT_1_COMPLETION_REPORT.md (Sept 30) - Superseded by sprint1/SPRINT_1_COMPLETION_SUMMARY.md
- SPRINT_2_COMPLETION_REPORT.md (Sept 30) - Sprint 2 hasn't started yet
- SPRINT_2_KICKOFF.md (Sept 30) - Premature
- SPRINT_3_PLANNING_PREPARATION.md (Sept 30) - Too early

**Old Planning Docs** (archived to docs/archive/sprints/old-planning/):

- MOBILE_SPRINTS_7-10_PLAN.md - Too far ahead
- WEB_MVP_LAUNCH_PLAN.md - Part of Sprint 2 now

**Historical Reports** (archived to docs/archive/historical/):

- DOC_SYNC_REPORT_2025-10-02.md - Historical
- REORGANIZATION_PLAN.md - Reorganization complete

**Legacy Project** (archived to docs/archive/legacy-project/):

- "To Be Updated" folder - Old Express/MongoDB codebase

### Folders Removed:

- sprint5/ through sprint10/ - Empty, never used

### Result:

- **Before:** 18 files in docs/sprints/, 7 empty folders, high confusion risk
- **After:** 6 active files in docs/sprints/, 0 empty folders, low confusion risk
- **Active Sprints:** Only sprint1/ and sprint2/ visible
- **Benefit:** Clear sprint structure for Sprint 2 transition period

---

## Phase 7: Sprint 3 Phase 1 Documentation Update (October 24, 2025) - COMPLETED

**Objective:** Document Sprint 3 Phase 1 completion and update all tracking

[Previous content preserved]

---

## Phase 8: Complete Repository Alignment (October 24, 2025) - COMPLETED

**Objective:** Perform comprehensive repository alignment and cleanup

### Files Moved From Root to Proper Locations:

**To docs/archive/project-status/:**

- ACTUAL_IMPLEMENTATION_STATUS.md - Historical snapshot
- CODEBASE_STATUS_REPORT.md - Historical report
- DESIGN_DOCS_UPDATE_SUMMARY.md - Forms-first pivot docs
- FORMS_FIRST_REPOSITIONING_COMPLETE.md - Pivot completion
- ULTRA_THINK_MODE_ANALYSIS.md - Strategic analysis
- clerk config.txt - Configuration notes

**To docs/:**

- DEVELOPMENT_SETUP.md - Setup instructions

**To docs/agents/:**

- brave-forms-agents.md - Agent configuration

**To docs/sprints/sprint1/:**

- SPRINT_1_STATUS.md - Sprint status report

**To tests/:**

- test-minio-manually.js - Test script

### Folders Archived:

- **frontend/** → docs/archive/legacy-project/frontend/ (old duplicate)
- **Spec Updates/** → docs/archive/spec-updates-oct-24/ (October specifications)
- **To Be Updated/** → docs/archive/legacy-project/ (old Express/MongoDB code)

### Cleanup Performed:

- Removed empty uploads/ folder
- Removed web-server.log file
- Organized .playwright-mcp screenshots to sprint1/evidence/screenshots/
- Removed all empty evidence subdirectories
- Cleaned up root folder (only README.md and claude.md remain)

### Result:

- **Root Folder:** Clean - only essential files remain
- **Documentation:** All properly organized in docs/ hierarchy
- **Archives:** Organized with descriptive names and dates
- **Misplaced Files:** 0 (all relocated)
- **Empty Folders:** 0 (all removed)
- **Repository Status:** FULLY ALIGNED
