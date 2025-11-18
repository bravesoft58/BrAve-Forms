# Issue Numbering Master Registry

**Last Updated:** 2025-10-23
**Purpose:** Complete registry of all issue numbers across all sprints to prevent conflicts

---

## Issue Number Ranges by Sprint

### Sprint 1

- **Range:** ISSUE-001 through ISSUE-045
- **Total:** 45 issues
- **Status:** COMPLETE (44/45 - 98%)
- **Notes:** ISSUE-045 deferred

### Sprint 2

- **Range:** ISSUE-047 through ISSUE-074
- **Total:** 27 issues
- **Status:** COMPLETE (24/27 - 89%)
- **Notes:** ISSUE-072, ISSUE-073, ISSUE-074 deferred (Architecture Review)

### Sprint 3

- **Range:** ISSUE-076 through ISSUE-113
- **Total:** 38 issues
- **Status:** IN PROGRESS (8/38 - 21%)
- **Notes:** Phase 1 Navigation COMPLETE (8/8), Phase 2 Dashboard IN PROGRESS
- **Special:** ISSUE-157 exists (Sprint 3 runtime cleanup)

### Sprint 4

- **Range:** ISSUE-100 through ISSUE-127
- **Total:** 28 issues
- **Status:** PLANNED (0/28 - 0%)
- **Notes:** QR Inspector Portal, Q&D Agency-Specific Templates, Testing & Polish

### Sprint 5

- **Range:** ISSUE-128 through ISSUE-161 (skipping ISSUE-157)
- **Total:** 34 issues
- **Status:** PLANNED (9/34 created - 26%)
- **Notes:**
  - ISSUE-157 skipped (exists in Sprint 3)
  - Photo Gallery, Offline Experience UI, Form Builder phases
  - Renumbered from original ISSUE-123-156 to avoid conflict with Sprint 4

---

## Conflict Resolution History

### Original Conflict (Resolved)

- **Problem:** Sprint 4 (ISSUE-100-127) and Sprint 5 (ISSUE-123-156) overlapped on ISSUE-123 through ISSUE-127
- **Resolution Date:** 2025-10-23
- **Action Taken:** Sprint 5 issues renumbered from ISSUE-123-156 to ISSUE-128-161 (skipping 157)
- **Result:** Zero conflicts remaining

### Current Status

- **Sprint 4:** ISSUE-100 through ISSUE-127 (28 issues)
- **Sprint 5:** ISSUE-128 through ISSUE-161, skipping ISSUE-157 (34 issues)
- **Gap:** ISSUE-114 through ISSUE-099 (reserved for future use)
- **Special:** ISSUE-157 belongs to Sprint 3 (runtime cleanup)

---

## Complete Issue Registry

### Sprint 1 (ISSUE-001 to ISSUE-045)

- ISSUE-001 through ISSUE-045: See Sprint 1 documentation

### Sprint 2 (ISSUE-047 to ISSUE-074)

- ISSUE-047 through ISSUE-074: See Sprint 2 documentation
- **Skipped:** ISSUE-046 (not used)

### Sprint 3 (ISSUE-076 to ISSUE-113, plus ISSUE-157)

- ISSUE-076 through ISSUE-113: See Sprint 3 documentation
- ISSUE-157: Sprint 3 Runtime & UI Cleanup (special issue)
- **Skipped:** ISSUE-114 through ISSUE-075 (not used)

### Sprint 4 (ISSUE-100 to ISSUE-127)

- ISSUE-100 through ISSUE-127: See Sprint 4 documentation
- **Skipped:** ISSUE-114 through ISSUE-099 (reserved)

### Sprint 5 (ISSUE-128 to ISSUE-161, skipping ISSUE-157)

- ISSUE-128: Photo Gallery Grid View
- ISSUE-129: Photo Lightbox Viewer
- ISSUE-130: GPS Map Integration
- ISSUE-131: Photo Annotations
- ISSUE-132: Photo Search & Filter
- ISSUE-133: Before/After Photo Pairing
- ISSUE-134: Sync Status Dashboard
- ISSUE-135: Sync Queue Management
- ISSUE-136: Conflict Resolution UI
- ISSUE-137: Offline Storage Indicators
- ISSUE-138: Manual Sync Trigger
- ISSUE-139: Retry Failed Sync
- ISSUE-140: Offline Experience Tests
- ISSUE-141: User Profile Page
- ISSUE-142: Account Settings
- ISSUE-143: Notification Preferences
- ISSUE-144: Help & Documentation
- ISSUE-145: App Settings
- ISSUE-146: Loading States Audit
- ISSUE-147: Error Handling Audit
- ISSUE-148: Responsive Design Fixes
- ISSUE-149: Sprint 5 Completion Report
- ISSUE-150: Form Builder Architecture Setup
- ISSUE-151: Field Palette Component
- ISSUE-152: Form Canvas with Drag-Drop
- ISSUE-153: Properties Panel Component
- ISSUE-154: Conditional Logic Builder
- ISSUE-155: Calculated Fields Editor
- ISSUE-156: Field Settings Tabs
- **SKIPPED:** ISSUE-157 (belongs to Sprint 3)
- ISSUE-158: Form Preview Component
- ISSUE-159: Save/Publish Workflow
- ISSUE-160: Undo/Redo History
- ISSUE-161: Form Builder Tests & Polish

---

## Prevention Guidelines

### Before Creating New Issues

1. **Check This Registry:** Verify the issue number range is available
2. **Check Sprint Documentation:** Review sprint-specific issue lists
3. **Reserve Numbers:** If creating issues for future sprints, reserve the range
4. **Document Immediately:** Update this registry when creating new issues

### Issue Number Assignment Rules

1. **Sequential Within Sprint:** Issues within a sprint should be sequential
2. **No Gaps Required:** Gaps between sprints are acceptable
3. **Document Skipped Numbers:** If skipping numbers, document why
4. **Cross-Reference Check:** Before finalizing, search codebase for conflicts

### Conflict Detection Process

1. **Search Codebase:** `grep -r "ISSUE-XXX" docs/`
2. **Check All Sprints:** Review all sprint documentation
3. **Verify Master Registry:** Ensure this document is up-to-date
4. **Resolve Before Committing:** Fix conflicts before finalizing issue creation

---

## Future Sprint Planning

### Reserved Ranges

- **Sprint 6:** ISSUE-162+ (to be determined)
- **Sprint 7+:** TBD based on project needs

### Recommendations

1. **Plan Ahead:** Reserve issue number ranges before sprint planning
2. **Update Registry:** Keep this document current
3. **Communicate Changes:** Notify team when renumbering occurs
4. **Version Control:** Commit registry updates with issue creation

---

## Verification Checklist

Before considering issue numbering complete:

- [ ] All sprint ranges documented
- [ ] No overlapping issue numbers
- [ ] Skipped numbers documented with rationale
- [ ] Cross-references updated
- [ ] Master registry reflects current state
- [ ] All documentation files updated
- [ ] Search confirms no conflicts

---

## Change Log

### 2025-10-23: Sprint 5 Renumbering

- **Action:** Renumbered Sprint 5 from ISSUE-123-156 to ISSUE-128-161
- **Reason:** Conflict with Sprint 4 (ISSUE-100-127)
- **Files Updated:** 34 issue files, master plan, status docs, README
- **Result:** Zero conflicts, sequential numbering maintained

---

**Maintained By:** Project Management Team
**Last Verified:** 2025-10-23
