# Documentation Cleanup Plan - October 3, 2025

**Purpose:** Archive legacy/unused documentation to prevent confusion during Sprint 2
**Status:** Ready for execution
**Impact:** Removes 52+ obsolete files, cleans up 7 empty folders

---

## Documents to Archive

### 1. Root-Level Sprint Status Reports (Sept 30 - Superseded)

**Location:** `docs/sprints/`
**Reason:** These were created Sept 30 before Sprint 1 actual completion (Oct 2)

Files to archive:

- `SPRINT_1_COMPLETION_REPORT.md` (Sept 30) → Superseded by sprint1/SPRINT_1_COMPLETION_SUMMARY.md (Oct 2)
- `SPRINT_2_COMPLETION_REPORT.md` (Sept 30) → Sprint 2 hasn't started yet!
- `SPRINT_2_KICKOFF.md` (Sept 30) → Sprint 2 starts Oct 14, this is premature
- `SPRINT_3_PLANNING_PREPARATION.md` (Sept 30) → Way too early

**Action:**

```bash
mkdir -p docs/archive/sprints/legacy-sept30-reports
mv docs/sprints/SPRINT_1_COMPLETION_REPORT.md docs/archive/sprints/legacy-sept30-reports/
mv docs/sprints/SPRINT_2_COMPLETION_REPORT.md docs/archive/sprints/legacy-sept30-reports/
mv docs/sprints/SPRINT_2_KICKOFF.md docs/archive/sprints/legacy-sept30-reports/
mv docs/sprints/SPRINT_3_PLANNING_PREPARATION.md docs/archive/sprints/legacy-sept30-reports/
```

### 2. Empty Sprint Folders (Never Used)

**Location:** `docs/sprints/sprint{5..10}/`
**Reason:** Empty folders, no work done, confusing

Folders to remove:

- `docs/sprints/sprint5/` (empty)
- `docs/sprints/sprint6/` (empty)
- `docs/sprints/sprint7/` (empty)
- `docs/sprints/sprint8/` (empty)
- `docs/sprints/sprint9/` (empty)
- `docs/sprints/sprint10/` (empty)

**Action:**

```bash
rm -rf docs/sprints/sprint{5..10}
```

### 3. Old Planning Documents (Superseded)

**Location:** `docs/sprints/`
**Reason:** Now have active Sprint 2 master plan

Files to archive:

- `MOBILE_SPRINTS_7-10_PLAN.md` (Sept 3) → Too far ahead, no Sprint 3-6 plan
- `WEB_MVP_LAUNCH_PLAN.md` (Sept 30) → Part of Sprint 2 now

**Action:**

```bash
mkdir -p docs/archive/sprints/old-planning
mv docs/sprints/MOBILE_SPRINTS_7-10_PLAN.md docs/archive/sprints/old-planning/
mv docs/sprints/WEB_MVP_LAUNCH_PLAN.md docs/archive/sprints/old-planning/
```

### 4. Old Documentation Reports (Historical)

**Location:** `docs/`
**Reason:** Historical doc sync reports, not needed for active work

Files to archive:

- `DOC_SYNC_REPORT_2025-10-02.md` → Historical
- `REORGANIZATION_PLAN.md` (Sept 4) → Reorganization complete

**Action:**

```bash
mkdir -p docs/archive/historical
mv docs/DOC_SYNC_REPORT_2025-10-02.md docs/archive/historical/
mv docs/REORGANIZATION_PLAN.md docs/archive/historical/
```

### 5. Legacy Project Folder (Different Tech Stack)

**Location:** `To Be Updated/`
**Reason:** Old Express/MongoDB codebase, completely different from current NestJS/PostgreSQL

**Action:**

```bash
mkdir -p docs/archive/legacy-project
mv "To Be Updated" docs/archive/legacy-project/
```

---

## Documents to KEEP Active

### Core Documentation (Root Level)

- ✅ `CLAUDE.md` (v1.6) - CRITICAL, must read before any code
- ✅ `README.md` - Project overview
- ✅ `PROJECT_MANAGEMENT_PLAN.md` - Active PM plan

### Documentation System (docs/)

- ✅ `DOCUMENT_LIBRARY.md` - Master documentation index
- ✅ `TECH_STACK_DETAILS.md` - Technology specifications
- ✅ `COMMON_PITFALLS.md` - Development anti-patterns

### Sprint Documentation (docs/sprints/)

- ✅ `MASTER_SPRINT_ROADMAP_V2.md` - High-level roadmap
- ✅ `SPRINT_EXECUTION_GUIDE.md` - Sprint methodology
- ✅ `DEPLOYMENT_REQUIREMENTS_TRACKER.md` - Pre-production checklist
- ✅ `DEPLOYMENT_REQUIREMENTS_RESOLVED.md` - Resolved items

### Active Sprint Folders

- ✅ `docs/sprints/sprint1/` - Sprint 1 completed work
  - SPRINT_1_MASTER_PLAN_FINAL.md
  - SPRINT_1_COMPLETION_SUMMARY.md (updated Oct 3)
  - All evidence folders (ISSUE-001 through ISSUE-046)

- ✅ `docs/sprints/sprint2/` - Current sprint work
  - SPRINT_2_MASTER_PLAN.md
  - All evidence folders (ISSUE-047, 048, 049)

### Design Documentation (docs/design/)

- ✅ All active design documents (per DOCUMENT_LIBRARY.md Phase 4)

### Archive Folder (docs/archive/)

- ✅ Keep as-is (already properly archived)

---

## Updated Folder Structure After Cleanup

```
docs/
├── COMMON_PITFALLS.md
├── DOCUMENT_LIBRARY.md
├── TECH_STACK_DETAILS.md
├── archive/
│   ├── design/
│   ├── sprints/
│   │   ├── legacy-sept30-reports/ (NEW)
│   │   ├── old-planning/ (NEW)
│   │   └── [existing archive folders]
│   ├── historical/ (NEW)
│   └── legacy-project/ (NEW - "To Be Updated" folder)
├── design/
│   └── [all active design docs]
├── form samples/
└── sprints/
    ├── DEPLOYMENT_REQUIREMENTS_RESOLVED.md
    ├── DEPLOYMENT_REQUIREMENTS_TRACKER.md
    ├── MASTER_SPRINT_ROADMAP_V2.md
    ├── SPRINT_EXECUTION_GUIDE.md
    ├── sprint1/
    └── sprint2/
```

---

## Execution Commands

**WARNING:** Review each command before executing. This will move/delete files.

```bash
# 1. Create new archive directories
mkdir -p docs/archive/sprints/legacy-sept30-reports
mkdir -p docs/archive/sprints/old-planning
mkdir -p docs/archive/historical
mkdir -p docs/archive/legacy-project

# 2. Archive Sept 30 status reports
mv docs/sprints/SPRINT_1_COMPLETION_REPORT.md docs/archive/sprints/legacy-sept30-reports/
mv docs/sprints/SPRINT_2_COMPLETION_REPORT.md docs/archive/sprints/legacy-sept30-reports/
mv docs/sprints/SPRINT_2_KICKOFF.md docs/archive/sprints/legacy-sept30-reports/
mv docs/sprints/SPRINT_3_PLANNING_PREPARATION.md docs/archive/sprints/legacy-sept30-reports/

# 3. Archive old planning docs
mv docs/sprints/MOBILE_SPRINTS_7-10_PLAN.md docs/archive/sprints/old-planning/
mv docs/sprints/WEB_MVP_LAUNCH_PLAN.md docs/archive/sprints/old-planning/

# 4. Archive historical reports
mv docs/DOC_SYNC_REPORT_2025-10-02.md docs/archive/historical/
mv docs/REORGANIZATION_PLAN.md docs/archive/historical/

# 5. Archive legacy project folder
mv "To Be Updated" docs/archive/legacy-project/

# 6. Remove empty sprint folders
rm -rf docs/sprints/sprint{5..10}

# 7. Create archive README
cat > docs/archive/sprints/legacy-sept30-reports/README.md << 'EOF'
# Legacy Sprint Reports (September 30, 2025)

**Archived:** October 3, 2025
**Reason:** These reports were created September 30 before Sprint 1 actual completion

## Why Archived:

- Sprint 1 actually completed October 2 (not Sept 30)
- Sprint 2 hasn't started yet (starts Oct 14)
- Sprint 3 planning is premature

## Superseded By:

- `docs/sprints/sprint1/SPRINT_1_COMPLETION_SUMMARY.md` (Oct 2, updated Oct 3)
- `docs/sprints/sprint2/SPRINT_2_MASTER_PLAN.md` (Oct 2)

These files preserved for historical reference only.
EOF
```

---

## Impact Assessment

### Before Cleanup:

- Total doc files in docs/sprints/: 18
- Empty folders: 7 (sprint 3-4 missing, sprint 5-10 empty)
- Legacy project folders: 1
- Confusing status reports: 4
- Total confusion risk: HIGH

### After Cleanup:

- Total doc files in docs/sprints/: 6 (active only)
- Empty folders: 0
- Legacy folders: Archived
- Confusing reports: Archived
- Total confusion risk: LOW

### Benefits:

1. **Clear sprint structure:** Only sprint1/ and sprint2/ visible
2. **Accurate status:** No premature completion reports
3. **Focused work:** Developers see only active documentation
4. **Historical preservation:** All files archived, not deleted

---

## Validation Checklist

After executing cleanup:

- [ ] `docs/sprints/` contains only active files
- [ ] `docs/sprints/sprint1/` and `sprint2/` exist
- [ ] No sprint{5..10} folders present
- [ ] Archive folders created with README.md
- [ ] DOCUMENT_LIBRARY.md still accurate
- [ ] No broken links in active documentation

---

## Next Steps

1. Execute cleanup commands
2. Update DOCUMENT_LIBRARY.md (remove archived files)
3. Commit with message: "docs: archive legacy sprint documentation and cleanup structure"
4. Continue with ISSUE-050 (Frontend Build Optimization)

---

**Created:** 2025-10-03 09:30:00 EDT
**Status:** Ready for execution
**Estimated Time:** 10 minutes
