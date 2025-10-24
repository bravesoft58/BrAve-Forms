# Sprint 3 Navigation Issues - Creation Summary

**Created:** 2025-10-23
**Status:** IN PROGRESS - Creating 14 new navigation/UI issue files

## Summary

Sprint 3 has been EXPANDED from 24 to 38 issues by adding comprehensive navigation layer (Phase 1 + Phase 2). This document tracks the creation of these new issue files.

## New Issues to Create (14 total)

### Phase 1: Navigation Layer (8 issues, 14h)

**Status: 1/8 Complete**

- [x] **ISSUE-076-create-appshell-layout.md** - COMPLETED
  - Mantine AppShell with responsive breakpoints
  - Construction theme configuration
  - Header/navbar/main slots

- [ ] **ISSUE-077-build-appheader-component.md** - PENDING
  - BrAve Forms logo (top-left)
  - User navigation dropdown (top-right)
  - Offline sync indicator
  - Mobile hamburger menu toggle

- [ ] **ISSUE-078-build-appnavbar-component.md** - PENDING
  - Desktop sidebar navigation
  - Mobile bottom navigation (5 tabs)
  - Active route highlighting
  - Glove-friendly 48x48dp touch targets

- [ ] **ISSUE-079-build-dashboardnav-component.md** - PENDING
  - Quick actions widget
  - Weather alerts banner
  - Pending tasks counter
  - Recent activity feed

- [ ] **ISSUE-080-build-usernav-dropdown.md** - PENDING
  - User profile menu
  - Settings link
  - Sign out button
  - Sync status indicator

- [ ] **ISSUE-081-build-offlinebanner-component.md** - PENDING
  - Display when offline
  - Show pending sync count
  - Manual sync trigger button
  - Auto-hide when online

- [ ] **ISSUE-082-build-pagecontainer-component.md** - PENDING
  - Consistent page layout
  - Breadcrumb integration
  - Loading skeleton states
  - Error boundary wrapper

- [ ] **ISSUE-083-build-breadcrumbs-component.md** - PENDING
  - Dynamic breadcrumb generation
  - Click to navigate up hierarchy
  - Mobile: Show only last 2 crumbs
  - Home > Projects > Project Name > Forms

### Phase 2: Core Pages (6 issues, 12h)

**Status: 0/6 Complete**

- [ ] **ISSUE-084-build-dashboard-home-page.md** - PENDING
  - Welcome message with user name
  - Weather alerts widget (rain >= 0.25")
  - Pending tasks list
  - Quick actions (New Form, View Projects)
  - Recent activity feed (last 5 submissions)

- [ ] **ISSUE-085-build-projects-list-page.md** - PENDING
  - Grid view of all projects
  - Filter: Active, Favorites, Archived
  - Search by project name/address
  - New Project button
  - Empty state (No projects yet)

- [ ] **ISSUE-086-build-projectcard-component.md** - PENDING
  - Project name, address, status
  - Weather icon if rain alert
  - Pending tasks counter
  - Click to navigate to project detail

- [ ] **ISSUE-087-build-project-detail-page.md** - PENDING
  - Project header (name, address, edit button)
  - Tabs: Forms, Photos, Team, Weather, Compliance
  - Forms tab: Template selector, submitted forms list
  - Mobile: Swipeable tabs

- [ ] **ISSUE-088-build-template-selector-component.md** - PENDING
  - Grid of available form templates
  - Filter by category (Daily Logs, Inspections, Safety)
  - Search templates by name
  - Click template to fill form

- [ ] **ISSUE-089-build-submitted-forms-list.md** - PENDING
  - List all submitted forms for project
  - Filter by date range, template, status
  - Sort by date (newest first)
  - Click to view submission details
  - Empty state (No forms yet)

## Implementation Notes

**Issue File Format:**

- Title: ISSUE-###-descriptive-name.md
- Sections: Description, Business Value, Acceptance Criteria, Technical Implementation, TDD Workflow, Quality Gates, Evidence Requirements, Manual Testing, Definition of Done

**Technology Stack:**

- UI Library: Mantine v7
- Routing: Next.js 14 App Router
- State: Valtio (global), React Hook Form (forms)
- Testing: Vitest (unit), Playwright (E2E)

**Field Optimization:**

- Minimum touch target: 48x48dp (glove-friendly)
- Minimum font size: 14px (sunlight readability)
- High contrast: 7:1 ratio
- Mobile-first responsive design

**Evidence Required Per Issue:**

- test-results/ (red → green phase screenshots)
- code/ (implementation screenshots)
- ui-screenshots/ (desktop + mobile)
- coverage-report/ (>80% for new code)

## Old Issues to Rename (24 files)

These existing files need to be RENUMBERED to make room for navigation issues:

**Current:** ISSUE-076.md through ISSUE-099.md (24 files)
**New Numbers:** ISSUE-090.md through ISSUE-113.md (24 files)

**Renaming will happen AFTER new navigation issues are created.**

## Next Steps

1. **Create remaining 13 issue files** (ISSUE-077 through ISSUE-089)
2. **Rename old issues** to new numbers (ISSUE-076→090, ISSUE-077→091, etc.)
3. **Update Sprint 4 plan** to build on expanded Sprint 3
4. **Create Sprint 5 plan** for additional UI features

## Progress Tracking

**Overall:** 1/14 new navigation issues created (7%)
**Phase 1 (Navigation):** 1/8 (12.5%)
**Phase 2 (Core Pages):** 0/6 (0%)

**Estimated Time to Complete:**

- Creating issue files: ~2 hours (10 min per file × 13 files)
- Renaming old files: ~15 minutes (scripted batch rename)
- Total: ~2.25 hours

---

**Last Updated:** 2025-10-23
**Next Update:** After completing all 14 navigation issue files
