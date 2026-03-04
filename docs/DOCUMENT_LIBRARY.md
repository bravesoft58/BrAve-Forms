# BrAve Forms - Master Documentation Library

**Last Updated:** 2026-03-04
**Doc Version:** v2.0
**Maintained By:** Documentation Library Manager Agent
**Status:** SALVAGE PIVOT - Q&D Construction focused, Salvage Sprints S1-S5 planned

## Documentation Overview

This master index provides a complete inventory of all documentation in the BrAve Forms repository. Documents are categorized by type, status, and relevance to current development efforts.

## Document Status Legend

- ACTIVE - Current and accurate
- UNDER_REVIEW - May need updates
- DEPRECATED - Outdated but kept for reference
- ARCHIVED - Historical documents
- DUPLICATE - Redundant content to be consolidated
- SUPERSEDED - Replaced by Salvage Sprint plan (Feb 2026)

---

## Core Project Documentation

### Primary Documentation

- ACTIVE **[README.md](../../README.md)** - Main project overview
  - **Purpose:** Entry point for developers and stakeholders
  - **Status:** Active, well-maintained
  - **Owner:** Project Team

- ACTIVE **[CLAUDE.md](../../claude.md)** - AI development instructions (v1.6)
  - **Purpose:** Critical workflow and coding standards for AI-assisted development
  - **Status:** Active, version 1.6
  - **Owner:** Development Team
  - **Note:** MUST be reviewed before any code changes

- ACTIVE **[ACCESS.md](../../ACCESS.md)** - Access documentation
  - **Purpose:** Access credentials and service documentation
  - **Status:** Active

### Supporting Technical Documentation

- ACTIVE **[TECH_STACK_DETAILS.md](TECH_STACK_DETAILS.md)** - Comprehensive technical stack
  - **Purpose:** Detailed technology specifications, versions, patterns, and configurations
  - **Referenced By:** CLAUDE.md
  - **Coverage:** Backend, Frontend, Infrastructure, Performance targets, Security

- ACTIVE **[COMMON_PITFALLS.md](COMMON_PITFALLS.md)** - Development anti-patterns guide
  - **Purpose:** Comprehensive guide to avoid common mistakes and violations
  - **Referenced By:** CLAUDE.md
  - **Coverage:** Code quality, testing, compliance, multi-tenancy, offline requirements

- ACTIVE **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Development environment setup
  - **Purpose:** Setup instructions for local development environment

- ACTIVE **[GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md)** - Git branching and PR workflow
  - **Purpose:** GitHub Flow strategy, branch naming, PR process
  - **Coverage:** Branch protection, commit standards, merge strategies

- ACTIVE **[GITHUB_WORKFLOW_IMPLEMENTATION.md](GITHUB_WORKFLOW_IMPLEMENTATION.md)** - Workflow implementation details
  - **Purpose:** Implementation notes for GitHub workflow setup

- ACTIVE **[DOCUMENTATION_CLEANUP_PLAN.md](DOCUMENTATION_CLEANUP_PLAN.md)** - Documentation cleanup strategy
  - **Purpose:** Plan for organizing and cleaning documentation

- ACTIVE **[REPOSITORY_ALIGNMENT_REPORT.md](REPOSITORY_ALIGNMENT_REPORT.md)** - Repository alignment audit
  - **Purpose:** Report on repository structure alignment

### Strategic Planning (Feb 2026 Pivot)

- ACTIVE **[ANDY_SALVAGE_PLAN.md](ANDY_SALVAGE_PLAN.md)** - Salvage Plan (Feb 17, 2026)
  - **Purpose:** Major strategic pivot - focus on Q&D Construction with 5 Nevada forms
  - **Status:** Active - PRIMARY STRATEGIC DOCUMENT
  - **Context:** Replaces generic forms platform approach with focused Q&D pilot
  - **Key Decision:** 5 specific Nevada agency forms (NDEP, NDOT, NNPH, etc.)

- ACTIVE **[Andy-Review12-10-25.txt](Andy-Review12-10-25.txt)** - Andy's QA Review Notes
  - **Purpose:** CEO QA review feedback from December 10, 2025
  - **Status:** Active reference for Sprint 7 fixes

### CI/CD Pipeline

- ACTIVE **[.github/workflows/deploy-production.yml](../../.github/workflows/deploy-production.yml)** - Production deployment workflow
  - **Purpose:** Automated deployment to DigitalOcean on push to master
  - **Trigger:** Push to master branch or manual workflow_dispatch
  - **Process:** SSH deploy, Docker rebuild, health check
  - **Server:** 159.89.246.229 (api.brave-soft.com / forms.brave-soft.com)

### Deployment Documentation

- ACTIVE **[DIGITALOCEAN_DEPLOYMENT_GUIDE.md](deployment/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)** - DigitalOcean deployment guide
  - **Purpose:** Step-by-step deployment to DigitalOcean droplet
  - **Coverage:** Server setup, Docker configuration, domain routing

- ACTIVE **[DIGITALOCEAN_SERVER_SETUP_LOG.md](deployment/DIGITALOCEAN_SERVER_SETUP_LOG.md)** - Server setup log
  - **Purpose:** Historical log of DigitalOcean server provisioning and configuration

### Testing Documentation

- ACTIVE **[E2E_BROWSER_TEST_PLAN.md](testing/E2E_BROWSER_TEST_PLAN.md)** - E2E browser test plan
  - **Purpose:** Playwright E2E testing strategy and test case definitions
  - **Coverage:** Browser automation, form testing, offline scenarios

### Project Management

- UNDER_REVIEW **[PROJECT_MANAGEMENT_PLAN.md](../../PROJECT_MANAGEMENT_PLAN.md)** - Active PM plan (Root)
  - **Purpose:** Current project timeline and milestones
  - **Status:** Under review - may need update for Salvage Sprint pivot

---

## Design & Architecture Documentation

### Master Documents (October 2025 - Forms-First Repositioning)

- ACTIVE **[Comprehensive PRD](../design/comprehensive_prd.md)** - MASTER PRODUCT REQUIREMENTS
  - **Purpose:** Complete product requirements with forms-first positioning (80% forms, 20% compliance)
  - **Size:** 80KB, 1,800+ lines
  - **Key Sections:** User personas, Epic hierarchy (Forms Engine P0, Compliance P1), Pricing strategy

- ACTIVE **[Product Positioning](../design/product_positioning.md)** - MASTER POSITIONING DOCUMENT
  - **Purpose:** Market positioning, competitive differentiation, go-to-market strategy
  - **Coverage:** Value proposition hierarchy (80/20), competitive analysis, sales messaging, pricing tiers

- ACTIVE **[Product Vision v2.0](../design/brave-forms-product-vision.md)** - STRATEGIC VISION DOCUMENT
  - **Purpose:** Strategic vision, mission statement, market opportunity
  - **Positioning:** Forms-first (80%) with compliance automation bonus (20%)

### Product & Business Documents

- ACTIVE **[Business Case](../design/brave-forms-business-case.md)**
  - **Purpose:** ROI analysis and investment justification

- ARCHIVED **[Product Vision](../archive/design/legacy/brave-forms-product-vision.md)**
  - **Status:** ARCHIVED (October 1, 2025) - Compliance-first positioning
  - **Superseded By:** comprehensive_prd.md executive summary

- ARCHIVED **[Comprehensive Compliance PRD](../archive/design/legacy/comprehensive_compliance_prd.md)**
  - **Status:** ARCHIVED (October 1, 2025) - Compliance-first (60/40 split)
  - **Superseded By:** comprehensive_prd.md with correct 80/20 forms/compliance split

- ARCHIVED **[Market Requirements Document](../archive/design/legacy/Market-Requirements-Document.md)**
  - **Status:** ARCHIVED - EPA threshold error (0.5" vs 0.25"), compliance-first

- ARCHIVED **[Product Requirements Document (Early Version)](../archive/design/legacy/Product-Requirements-Document-EARLY-VERSION.txt)**
  - **Status:** ARCHIVED - Very early text file version

### Technical Architecture

- ACTIVE **[Revised Architecture with Clerk](../design/revised_architecture_clerk.md)**
  - **Purpose:** Current system design with Clerk authentication
  - **Status:** Active, current architecture

- ACTIVE **[Software Architecture Document](../design/brave-forms-sad.md)**
  - **Purpose:** Detailed software architecture
  - **Update:** Forms-first positioning complete, priority levels added (P0 forms, P1 compliance)

- ACTIVE **[API Interface Control](../design/brave-forms-api-icd.md)**
  - **Purpose:** GraphQL API specifications
  - **Update:** User role types added (FIELD $39, OFFICE $19, INSPECTOR FREE), JWT claims enhanced

- ACTIVE **[Database Design](../design/database%20design%20document.md)**
  - **Purpose:** PostgreSQL 15 schema with JSONB
  - **Update:** PostgreSQL 15 verified, user role schema added with pricing tiers

- ACTIVE **[PWA vs Capacitor Architecture Analysis](../design/PWA_vs_CAPACITOR_ARCHITECTURE_ANALYSIS.md)**
  - **Purpose:** Architectural comparison of PWA vs Capacitor approaches
  - **Status:** Active reference for mobile strategy decisions

- ACTIVE **[UI/UX Design Research](../design/UI_UX_DESIGN_RESEARCH.md)**
  - **Purpose:** UI/UX design research for construction-optimized interfaces

### Design Process Documents

- ACTIVE **[DESIGN_DOCS_REVIEW_AND_ARCHIVE_PLAN.md](../design/DESIGN_DOCS_REVIEW_AND_ARCHIVE_PLAN.md)**
  - **Purpose:** Plan for reviewing and archiving design documents

- ACTIVE **[DOCUMENTATION_UPDATE_COMPLETE.md](../design/DOCUMENTATION_UPDATE_COMPLETE.md)**
  - **Purpose:** Completion report for documentation updates

- ACTIVE **[SDP_V2_UPDATE_SUMMARY.md](../design/SDP_V2_UPDATE_SUMMARY.md)**
  - **Purpose:** Summary of Software Development Plan v2.0 updates

### Tech Stack Documentation

- ACTIVE **[TECH_STACK_DETAILS.md](TECH_STACK_DETAILS.md)** - MASTER TECH STACK
  - **Purpose:** Single authoritative source for all technology decisions
  - **Coverage:** Backend, Frontend, Infrastructure, Performance targets, Security
  - **Referenced By:** CLAUDE.md, comprehensive_prd.md

- ARCHIVED **Tech Stack Duplicates (Consolidated October 1, 2025)**
  - **[TECH_STACK.md](../archive/design/duplicate/TECH_STACK.md)** - Original version
  - **[brave-forms-final-tech-stack.md](../archive/design/duplicate/brave-forms-final-tech-stack.md)** - "Final" version
  - **[Tech Stack Recommendations.md](../archive/design/duplicate/Tech-Stack-Recommendations.md)** - Recommendations
  - **Status:** All three consolidated into TECH_STACK_DETAILS.md

### Requirements & Specifications

- ARCHIVED **[Functional Requirements](../archive/design/legacy/brave-forms-frd.md)**
  - **Status:** ARCHIVED (October 1, 2025) - Compliance-heavy module priorities
  - **Superseded By:** comprehensive_prd.md Feature Requirements section

- ACTIVE **[Non-Functional Requirements](../design/brave-forms-nfr.md)**
  - **Purpose:** Performance, security, compliance requirements

- ACTIVE **[Use Cases](../design/brave-forms-use-cases.md)**
  - **Purpose:** User scenarios and workflows

- ACTIVE **[UX Design Document](../design/brave-forms-ux-design-doc.md)**
  - **Purpose:** Field-optimized UI specifications

- ACTIVE **[Software Development Plan v2.0](../design/sdp-brave-forms.md)** - Forms-first repositioning
  - **Purpose:** Development methodology, AI practices, CLAUDE.md v1.6 alignment

- UNDER_REVIEW **[Product Requirements Document.txt](../design/Product%20Requirements%20Document.txt)**
  - **Purpose:** Product requirements
  - **Status:** Under review - older text file format

---

## Sprint Documentation

### Salvage Sprints (Feb 2026 Pivot) - PLANNED

- ACTIVE **[Salvage Sprint Plan](../sprints/SALVAGE_SPRINT_PLAN.md)** - CURRENT STRATEGIC PLAN
  - **Purpose:** 5 focused sprints (S1-S5) replacing old roadmap
  - **Status:** Active - PRIMARY SPRINT PLANNING DOCUMENT
  - **Context:** Q&D Construction pilot with 5 Nevada agency forms
  - **Sprints:** S1 (Foundation), S2 (Forms), S3 (Compliance), S4 (Mobile), S5 (Polish)

### Sprint 7 - COMPLETE (January 5, 2026)

- COMPLETE **[Sprint 7 Master Plan](../sprints/sprint7/SPRINT_7_MASTER_PLAN.md)**
  - **Purpose:** Andy's QA fixes from December 10, 2025 review
  - **Status:** COMPLETE (January 5, 2026)
  - **Total Issues:** 14 issues completed
  - **Context:** Fixes identified during CEO QA review session

- COMPLETE **[Sprint 7 Completion Report](../sprints/sprint7/SPRINT_7_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation
  - **Status:** COMPLETE (January 5, 2026)

### Sprint 6 - IN PROGRESS

- IN_PROGRESS **[Sprint 6 Master Plan](../sprints/sprint6/SPRINT_6_MASTER_PLAN.md)**
  - **Purpose:** Backend integration sprint
  - **Status:** In progress
  - **Total Issues:** 7 (ISSUE-168 to ISSUE-174)

- IN_PROGRESS **[Sprint 6 Issues Summary](../sprints/sprint6/SPRINT_6_ISSUES_SUMMARY.md)**
  - **Purpose:** Issue tracking for Sprint 6

### Sprint 5 - COMPLETE (November 30, 2025)

- COMPLETE **[Sprint 5 Master Plan](../sprints/sprint5/SPRINT_5_MASTER_PLAN.md)**
  - **Purpose:** Production-Ready MVP with Photo Gallery, Offline UI, Settings, and Form Builder
  - **Status:** COMPLETE (November 30, 2025)
  - **Total Issues:** 43/43 (100%)

- COMPLETE **[Sprint 5 Completion Report](../sprints/sprint5/SPRINT_5_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation with evidence and metrics
  - **Key Deliverables:** Photo Gallery, Offline UI, Form Builder, 550+ tests

### Sprint 4 - CLOSED (November 27, 2025)

- CLOSED **[Sprint 4 Master Plan](../sprints/sprint4/SPRINT_4_ISSUES_SUMMARY.md)**
  - **Purpose:** QR Inspector Portal and Q&D Agency Templates
  - **Status:** CLOSED (November 27, 2025)
  - **Total Issues:** 25/26 (96%)

- CLOSED **[Sprint 4 Completion Report](../sprints/sprint4/SPRINT_4_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation with Q&D pilot readiness

### Sprint 3 - COMPLETE (November 25, 2025)

- COMPLETE **[Sprint 3 Master Plan](../sprints/sprint3/SPRINT_3_MASTER_PLAN.md)**
  - **Purpose:** Frontend UI development sprint - Forms Runtime and Testing
  - **Status:** COMPLETE (November 25, 2025)
  - **Total Issues:** 38/38 (100%)

- COMPLETE **[Sprint 3 Completion Report](../sprints/sprint3/SPRINT_3_COMPLETION_REPORT.md)**
  - **Purpose:** Final sprint completion documentation with evidence and metrics

- COMPLETE **[Sprint 3 Phase 1 Completion Report](../sprints/sprint3/SPRINT_3_PHASE_1_COMPLETION.md)**
  - **Purpose:** Complete documentation of Phase 1 navigation components

### Sprint 2 - COMPLETE (October 2025)

- COMPLETE **[Sprint 2 Master Plan](../sprints/sprint2/SPRINT_2_MASTER_PLAN.md)**
  - **Purpose:** Forms Engine foundation sprint
  - **Issues:** 24 completed (ISSUE-047 through ISSUE-071, plus ISSUE-114)

### Sprint 1 - COMPLETE (October 2025)

- COMPLETE **[Sprint 1 Master Plan (FINAL)](../sprints/sprint1/SPRINT_1_MASTER_PLAN_FINAL.md)**
  - **Purpose:** Infrastructure and deployment foundation
  - **Format:** 46 atomic issues completed

### Sprint Planning & Tracking Documents

- ACTIVE **[Issue Numbering Master](../sprints/ISSUE_NUMBERING_MASTER.md)**
  - **Purpose:** Master index of all issue numbers across sprints

- ACTIVE **[Complete UI Requirements Synthesis](../sprints/COMPLETE_UI_REQUIREMENTS_SYNTHESIS.md)**
  - **Purpose:** Consolidated UI requirements from all sources

- ACTIVE **[Sprint 7-10 Conflict Tracker](../sprints/SPRINT_7_10_CONFLICT_TRACKER_LIVE_2025-12-20.md)**
  - **Purpose:** Live conflict tracking for Sprint 7-10 period

- ACTIVE **[Deployment Requirements Tracker](../sprints/DEPLOYMENT_REQUIREMENTS_TRACKER.md)**
  - **Purpose:** Pre-production deployment checklist

- ACTIVE **[Deployment Requirements Resolved](../sprints/DEPLOYMENT_REQUIREMENTS_RESOLVED.md)**
  - **Purpose:** Historical archive for completed deployment requirements

- SUPERSEDED **[Master Sprint Roadmap V2](../sprints/MASTER_SPRINT_ROADMAP_V2.md)**
  - **Purpose:** High-level sprint planning
  - **Status:** Superseded by Salvage Sprint Plan (Feb 2026)

- SUPERSEDED **[Sprint Execution Guide](../sprints/SPRINT_EXECUTION_GUIDE.md)**
  - **Purpose:** Sprint execution methodology
  - **Status:** Superseded by Salvage Sprint Plan (Feb 2026)

- ACTIVE **[Documentation Update Report](../sprints/DOCUMENTATION_UPDATE_REPORT_2025-10-24.md)**
  - **Purpose:** October 24, 2025 documentation update report

### Legacy Sprint Plans (ARCHIVED - Historical Only)

**WARNING:** These documents claimed "COMPLETED" for features that were only partially implemented.

- ARCHIVED **[docs/archive/sprints/SPRINT_1_PLAN_LEGACY.md](../archive/sprints/SPRINT_1_PLAN_LEGACY.md)**
- ARCHIVED **[docs/archive/sprints/sprint2/](../archive/sprints/sprint2/)**
- ARCHIVED **[docs/archive/sprints/sprint3/](../archive/sprints/sprint3/)**
- ARCHIVED **[docs/archive/sprints/sprint4/](../archive/sprints/sprint4/)**

### Archived General Sprint Documents

- ARCHIVED **[docs/archive/MASTER_SPRINT_ROADMAP.md](../archive/MASTER_SPRINT_ROADMAP.md)** - Old roadmap
- ARCHIVED **[docs/archive/SPRINT_PLAN.md](../archive/SPRINT_PLAN.md)** - Original sprint plan
- ARCHIVED **[docs/archive/SPRINTS_3-10_OVERVIEW.md](../archive/SPRINTS_3-10_OVERVIEW.md)** - Old overview
- ARCHIVED **[docs/archive/SPRINT_3_SUMMARY.md](../archive/SPRINT_3_SUMMARY.md)** - Sprint 3 summary
- ARCHIVED **[docs/archive/alignment.md](../archive/alignment.md)** - Alignment notes

---

## AI Agent Documentation

### Agent Configurations (.claude/agents/)

15 specialized AI development agents configured for different domains (reduced from 25 in Feb 2026):

#### Core Development Agents

- ACTIVE **[Database Schema Architect](../../.claude/agents/database-schema-architect.md)**
- ACTIVE **[API Integration Architect](../../.claude/agents/api-integration-architect.md)**
- ACTIVE **[GraphQL API Specialist](../../.claude/agents/graphql-api-specialist.md)**
- ACTIVE **[Frontend UX Developer](../../.claude/agents/frontend-ux-developer.md)**
- ACTIVE **[Forms Engine Developer](../../.claude/agents/forms-engine-developer.md)**

#### Specialized Feature Agents

- ACTIVE **[QR Inspector Portal Developer](../../.claude/agents/qr-inspector-portal-developer.md)**
- ACTIVE **[Code Reviewer](../../.claude/agents/code-reviewer.md)**

#### Infrastructure & Operations

- ACTIVE **[DevOps Pipeline Engineer](../../.claude/agents/devops-pipeline-engineer.md)**
- ACTIVE **[Security Compliance Officer](../../.claude/agents/security-compliance-officer.md)**
- ACTIVE **[Performance Optimizer](../../.claude/agents/performance-optimizer.md)**

#### Quality & Documentation

- ACTIVE **[Test Automation Engineer](../../.claude/agents/test-automation-engineer.md)**
- ACTIVE **[Technical Writer](../../.claude/agents/technical-writer.md)**
- ACTIVE **[Doc Library Manager](../../.claude/agents/doc-library-manager.md)** (This agent)
- ACTIVE **[Doc Sync Guardian](../../.claude/agents/doc-sync-guardian.md)**

#### Management

- ACTIVE **[Project Manager](../../.claude/agents/project-manager.md)**

#### Deleted Agents (Feb 2026 - Scope Reduction)

The following 10 agents were removed during the Salvage Sprint pivot to reduce complexity:

- chaos-engineer, compliance-engine-developer, infrastructure-designer
- mobile-app-builder, multi-tenant-architect, offline-sync-specialist
- photo-storage-optimizer, product-owner, queue-processing-engineer
- scrum-master, weather-integration-specialist

### Agent Configuration Files

- ACTIVE **[brave-forms-agents.md](agents/brave-forms-agents.md)** - Agent overview and configuration
  - **Purpose:** Central configuration for all AI agents

---

## Slash Commands (.claude/commands/)

12 custom slash commands available (reduced from 19 in Feb 2026):

### Quality Gates

- `/qa` - Run complete quality gate (lint + type-check + test + build)
- `/test-offline` - Test offline functionality and 30-day sync
- `/test-compliance` - Validate EPA CGP 0.25" rules and compliance
- `/review` - Launch code-reviewer agent with strict standards

### Planning & Architecture

- `/plan-feature` - Architecture analysis in Plan Mode
- `/check-patterns <file>` - Verify code follows project patterns
- `/compliance-check <feature>` - Deep EPA/OSHA validation

### Database

- `/db-check` - Validate multi-tenancy and RLS patterns
- `/db-migrate-safe` - Create and validate migration

### Documentation

- `/doc-api <path>` - Generate API documentation

### Workflow

- `/pr-ready` - Full validation and create PR (NO branding)
- `/sync` - Session synchronization

### Deleted Commands (Feb 2026)

- `/agent-compliance`, `/agent-offline`, `/agent-security` (agents removed)
- `/commit-clean`, `/doc-sync`, `/feature`, `/fix` (consolidated)

---

## Supporting Documentation (.claude/)

- ACTIVE **[business-requirements-md.txt](../../.claude/business-requirements-md.txt)**
  - **Purpose:** EPA/OSHA compliance requirements

- ACTIVE **[clerk-implementation-md.txt](../../.claude/clerk-implementation-md.txt)**
  - **Purpose:** Clerk authentication implementation guide

- ACTIVE **[database-patterns-md.txt](../../.claude/database-patterns-md.txt)**
  - **Purpose:** Database design patterns

- ACTIVE **[ui-standards-md.txt](../../.claude/ui-standards-md.txt)**
  - **Purpose:** UI/UX standards for construction field use

---

## Dev Notes (Untracked Reference Materials)

The `Dev Notes/` folder contains reference materials from project stakeholders. These are NOT tracked in git.

- Meeting transcript (Feb 16, 2026) - Project setup for site administrators
- Meeting recording (.mp3) - Audio of above meeting
- Nevada agency form PDFs (5):
  - BrAve Flow form sample
  - Daily Dust Logs
  - NDEP SAD Application
  - NDEP Weekly Stormwater Log
  - NDOT Weekly Stormwater Logs
  - NNPH Dust Control Permit Application
- Project Setup documents (.docx, .txt)
- New Text Document.txt (scratch)

**Note:** These PDF forms are the 5 target Nevada agency forms for the Salvage Sprint pivot.

---

## Legacy & Outdated Documentation

### Archived Project Status Documents (October 24, 2025)

- ARCHIVED **[ACTUAL_IMPLEMENTATION_STATUS.md](archive/project-status/ACTUAL_IMPLEMENTATION_STATUS.md)**
- ARCHIVED **[CODEBASE_STATUS_REPORT.md](archive/project-status/CODEBASE_STATUS_REPORT.md)**
- ARCHIVED **[DESIGN_DOCS_UPDATE_SUMMARY.md](archive/project-status/DESIGN_DOCS_UPDATE_SUMMARY.md)**
- ARCHIVED **[FORMS_FIRST_REPOSITIONING_COMPLETE.md](archive/project-status/FORMS_FIRST_REPOSITIONING_COMPLETE.md)**
- ARCHIVED **[ULTRA_THINK_MODE_ANALYSIS.md](archive/project-status/ULTRA_THINK_MODE_ANALYSIS.md)**

### Legacy Folders Archived (October 24, 2025)

- ARCHIVED **[frontend/](archive/legacy-project/frontend/)** - Old frontend folder
- ARCHIVED **[Spec Updates/](archive/spec-updates-oct-24/)** - October specifications
- ARCHIVED **[To Be Updated/](archive/legacy-project/To%20Be%20Updated/)** - Old Express/MongoDB code

---

## Documentation Health Metrics

- **Total Documents:** 90+ (after March 2026 audit)
- **Active Documents:** 55+ (core docs + active sprint work + deployment + testing)
- **Archived Documents:** 35+ (project status, legacy content, spec updates)
- **Deprecated/Outdated:** 0 (all properly archived or marked SUPERSEDED)
- **Duplicates Found:** 0 (all resolved)
- **Agents:** 15 active (reduced from 25)
- **Commands:** 12 active (reduced from 19)
- **Sprint Progress:**
  - Sprint 1: COMPLETE (46 issues - 100%)
  - Sprint 2: COMPLETE (24 issues - 100%)
  - Sprint 3: COMPLETE (38/38 issues - 100%) - Completed November 25, 2025
  - Sprint 4: CLOSED (25/26 issues - 96%) - Closed November 27, 2025
  - Sprint 5: COMPLETE (43/43 issues - 100%) - Completed November 30, 2025 - Production-Ready MVP
  - Sprint 6: IN PROGRESS (7 issues, ISSUE-168 to ISSUE-174)
  - Sprint 7: COMPLETE (14 issues) - Completed January 5, 2026 - Andy's QA fixes
  - Salvage Sprints S1-S5: PLANNED (Feb 2026 pivot to Q&D Construction focus)
- **Strategic Pivot:** February 17, 2026 - Salvage Plan adopted
  - From: Generic forms platform for all construction companies
  - To: Focused Q&D Construction pilot with 5 Nevada agency forms

---

## Maintenance Schedule

- **Weekly:** Review sprint documentation updates
- **Bi-weekly:** Verify technical docs match implementation
- **Monthly:** Full documentation audit and cleanup
- **Quarterly:** Archive outdated sprint documents, Review CLAUDE.md effectiveness

---

## Change History

### Phase 9: Salvage Pivot & March 2026 Audit (2026-03-04)

**Context:** Major strategic pivot occurred February 17, 2026. BrAve Forms shifted from generic forms platform to focused Q&D Construction tool with 5 specific Nevada agency forms.

**Changes in this audit:**

1. **Emoji Removal:** Removed all remaining emoji markers (checkmarks, warnings, archive/robot/note icons) per zero-emoji policy
2. **Strategic Documents Added:**
   - ANDY_SALVAGE_PLAN.md - Primary strategic document
   - SALVAGE_SPRINT_PLAN.md - New S1-S5 sprint structure
   - Andy-Review12-10-25.txt - CEO QA review notes
3. **Deployment Docs Added:** DigitalOcean deployment guide and server setup log
4. **Testing Docs Added:** E2E browser test plan
5. **Design Docs Added:** PWA vs Capacitor analysis, UI/UX research, design process docs
6. **Sprint Docs Added:** Sprint 6 (in progress), Sprint 7 (complete), conflict tracker, issue numbering, UI requirements synthesis
7. **Agent Section Updated:** 25 agents reduced to 15 (10 deleted during scope reduction)
8. **Commands Section Added:** 12 active commands documented (7 deleted during scope reduction)
9. **Dev Notes Section Added:** Reference materials from project stakeholders
10. **Health Metrics Updated:** Reflects current state including Salvage Sprint pivot
11. **ACCESS.md Added:** Root-level access documentation

### Phase 8: Complete Repository Alignment (October 24, 2025) - COMPLETED

Comprehensive repository alignment and cleanup. Files moved to proper locations, folders archived, empty directories removed.

### Phase 7: Sprint 3 Phase 1 Documentation Update (October 24, 2025) - COMPLETED

Sprint 3 Phase 1 completion documented.

### Phase 6: Documentation Cleanup (October 3, 2025) - COMPLETED

Archive legacy/unused documentation to prevent confusion during Sprint 2 transition.

### Phase 5: Sprint 1 Discovery & Deployment Tracking (October 1, 2025) - COMPLETED

Critical deployment requirements and discovered issues tracked.

### Phase 4: Final 5 Documents Update (October 1, 2025) - COMPLETED

Forms-first alignment for remaining 5 technical design documents.

### Phase 3: Forms-First Repositioning (October 1, 2025) - COMPLETED

Repositioned BrAve Forms from compliance-first to forms-first (80/20 split).

### Phase 2: Documentation Enhancements (September 30, 2025) - COMPLETED

CLAUDE.md v1.6, TECH_STACK_DETAILS.md, COMMON_PITFALLS.md created.

---

_This master library is maintained by the Documentation Library Manager agent and should be updated whenever documentation changes occur._

**Last Full Audit:** 2026-03-04 (Salvage Pivot & Comprehensive Audit)
**Next Scheduled Audit:** 2026-04-01
**Last Update:** 2026-03-04
