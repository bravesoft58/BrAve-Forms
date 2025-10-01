# Sprint 1 Atomic Breakdown - Implementation Checklist

**Created:** 2025-10-01 12:50:00 EDT
**For:** Project Manager / Scrum Master
**Purpose:** Step-by-step implementation guide for atomic task rollout

---

## Pre-Implementation Checklist

### Documentation Review (30 minutes)
- [ ] Read `SPRINT_1_ATOMIC_BREAKDOWN.md` completely
- [ ] Review `ISSUE_MAPPING_GUIDE.md` for implementation strategy
- [ ] Read `ATOMIC_BREAKDOWN_SUMMARY.md` for benefits overview
- [ ] Examine 3 sample issue files (ISSUE-013, 022, 029)
- [ ] Understand 20 → 46 issue transformation

### Team Alignment (1 hour meeting)
- [ ] Schedule breakdown review meeting with development team
- [ ] Present atomic task approach and benefits
- [ ] Show sample issue files (ISSUE-013, 022, 029)
- [ ] Explain evidence-based completion requirements
- [ ] Address team questions and concerns
- [ ] Get team buy-in on approach

### Tooling Setup (15 minutes)
- [ ] Ensure GitHub project board ready
- [ ] Create labels: "Phase 3", "Phase 4", "Phase 5", "Phase 6"
- [ ] Create milestone: "Sprint 1 Atomic Completion"
- [ ] Set up evidence folder structure: `docs/sprints/sprint1/evidence/`
- [ ] Prepare daily standup template

---

## Issue Creation Phase (2-3 hours)

### Create Remaining Issue Files (2 hours)

**Already Created (3 files):**
- [x] ISSUE-013: Weather API Helper (15 min)
- [x] ISSUE-022: NOAA Research (20 min)
- [x] ISSUE-029: Threshold Check (15 min)

**To Create (43 files):**

Use sample files as templates. Each issue file needs:
1. Header with metadata (sprint, phase, priority, time, points, status, date)
2. "What You'll Do" section (1-2 sentences)
3. "Single Objective" (crystal clear)
4. "Files to Create/Modify" list
5. "Step-by-Step Instructions" (numbered, detailed)
6. "Verification Checklist" (5-10 items)
7. "Evidence Required" (what screenshots, where to save)
8. "Success Criteria" (4-6 items)
9. "Time Estimate" breakdown
10. "Next Issue" reference
11. "Notes for Junior Developers" (why it matters)
12. "Common Mistakes to Avoid" (3-5 items)

**Priority Order:**
1. Phase 3 (Apollo Removal): ISSUE-014 through ISSUE-021 (9 files)
2. Phase 4 (Weather API): ISSUE-023 through ISSUE-034 (12 files)
3. Phase 5 (PWA): ISSUE-035 through ISSUE-038 (4 files)
4. Phase 6 (Testing): ISSUE-042 through ISSUE-046 (5 files)

**Template Structure:**
```markdown
# ISSUE-XXX: [Clear Task Name]

**Sprint:** Sprint 1 | **Phase:** [3-6] | **Priority:** [P0/P1]
**Time:** [15-30] minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 12:00:00 EDT

## What You'll Do
[One sentence objective]

## Single Objective
[Crystal clear single goal]

## Files to [Create/Modify]
- `path/to/file.ts` ([NEW/MODIFY])

## Step-by-Step Instructions
[Numbered steps with code snippets]

## Verification Checklist
- [ ] [5-10 specific items]

## Evidence Required
[What to screenshot, where to save]

## Success Criteria
- [ ] [4-6 measurable outcomes]

## Time Estimate
**[15-30] minutes total:**
- [Breakdown by activity]

## Next Issue
ISSUE-XXX: [Next task name] ([time])

## Notes for Junior Developers
[Why this matters, common questions]

## Common Mistakes to Avoid
[3-5 specific pitfalls]
```

**Checklist for Each Issue File:**
- [ ] ISSUE-014: TanStack Query to WeatherDashboard
- [ ] ISSUE-015: Test WeatherDashboard Offline
- [ ] ISSUE-016: Organizations API Helper
- [ ] ISSUE-017: Convert OrganizationDashboard
- [ ] ISSUE-018: Test OrganizationDashboard
- [ ] ISSUE-019: Projects API Helper
- [ ] ISSUE-020: Convert ProjectSelector
- [ ] ISSUE-021: Verify Web Build
- [ ] ISSUE-023: NOAA TypeScript Types
- [ ] ISSUE-024: Implement getStationForCoordinates
- [ ] ISSUE-025: Implement getPrecipitation
- [ ] ISSUE-026: NOAA Error Handling
- [ ] ISSUE-027: Test NOAA Client Integration
- [ ] ISSUE-028: Precipitation Accumulation Function
- [ ] ISSUE-030: Inspection Deadline Calculator
- [ ] ISSUE-031: Tests for Threshold Detection
- [ ] ISSUE-032: Tests for Inspection Deadline
- [ ] ISSUE-033: Redis Caching to Weather Service
- [ ] ISSUE-034: Test Redis Cache Hit/Miss
- [ ] ISSUE-035: Install PWA Dependencies
- [ ] ISSUE-036: Create PWA Manifest
- [ ] ISSUE-037: Configure Next.js PWA Plugin
- [ ] ISSUE-038: Test PWA Lighthouse
- [ ] ISSUE-042: Tests for Weather Service
- [ ] ISSUE-043: Tests for Weather Resolver
- [ ] ISSUE-044: Tests for Organization Resolver
- [ ] ISSUE-045: Tests for Project Resolver
- [ ] ISSUE-046: Run Full Coverage Report

**Time Required:** 2-3 hours (create 43 issue files from templates)

---

### Create GitHub Issues (1 hour)

For each issue file created above:
1. Create GitHub issue
2. Use issue file content as description
3. Set labels (phase, priority)
4. Add to Sprint 1 milestone
5. Set estimated time (15-30 min)
6. Link prerequisites (if any)

**GitHub Issue Template:**
```markdown
## Objective
[Single clear objective from issue file]

## Time Estimate
[15-30 minutes]

## Files
- `path/to/file.ts` ([NEW/MODIFY])

## Steps
[Copy step-by-step from issue file]

## Evidence
[What screenshots to collect]

## Success Criteria
[Copy checklist from issue file]

## Links
- Issue File: `docs/sprints/sprint1/issues/ISSUE-XXX.md`
- Evidence Folder: `docs/sprints/sprint1/evidence/ISSUE-XXX/`
```

**Checklist:**
- [ ] Create 46 GitHub issues (ISSUE-001 through ISSUE-046)
- [ ] Mark ISSUE-001 through ISSUE-012 as COMPLETE
- [ ] Set dependencies (sequential order matters)
- [ ] Add phase labels
- [ ] Add to Sprint 1 milestone

---

## Developer Assignment Phase (30 minutes)

### Assign Initial Tasks
- [ ] Assign ISSUE-013 to junior developer (first task, easier)
- [ ] Explain atomic task approach in 1-on-1
- [ ] Walk through sample issue file (ISSUE-013)
- [ ] Show evidence requirements
- [ ] Set expectation: 2-3 tasks per day (4 hours)
- [ ] Explain escalation: stuck >10 min = ask for help

### Create Evidence Folder Structure
```bash
mkdir -p docs/sprints/sprint1/evidence/ISSUE-{013..046}/{code,deployment,test-results,compliance}
```

This creates:
- `evidence/ISSUE-013/code/`
- `evidence/ISSUE-013/deployment/`
- `evidence/ISSUE-014/code/`
- (repeat for all 34 new issues)

**Checklist:**
- [ ] Evidence folders created for all 34 new issues
- [ ] Developer has write access to evidence folders
- [ ] Developer knows where to save screenshots

---

## Daily Execution Phase (2 weeks)

### Daily Standup (15 minutes each day)

**Template:**
```
Sprint 1 Atomic Tasks - Daily Standup

Progress:
- Issues complete: X/46 (Y%)
- Yesterday: [list completed issues]
- Today: [list planned issues]

Blockers:
- [any issues taking >30 min?]
- [any unclear requirements?]

Help Needed:
- [escalations needed?]
```

**Checklist (Daily):**
- [ ] Review progress (track 46 checkpoints)
- [ ] Identify blockers (tasks >30 min)
- [ ] Review completed evidence
- [ ] Approve PRs (small, frequent)
- [ ] Update burn-down chart

### Evidence Review (End of Day)

For each completed issue:
- [ ] Evidence folder contains required screenshots
- [ ] Screenshots show actual work (not mocks)
- [ ] File paths visible in screenshots
- [ ] Terminal output shows success
- [ ] No emoji in code/commits
- [ ] EPA compliance exact (ISSUE-029: 0.25")

**Red Flags:**
- Missing evidence
- Fake/mock screenshots
- Approximate values (0.24" instead of 0.25")
- Emoji in code
- AI branding in commits
- Task took >30 minutes (investigate why)

---

## Sprint Review Phase (End of Week 2)

### Final Verification (1 hour)

**Sprint Completion:**
- [ ] All 46 issues complete
- [ ] All 46 evidence folders populated
- [ ] Web build succeeds: `pnpm --filter web build`
- [ ] Backend tests pass: `pnpm --filter backend test`
- [ ] Coverage report: `pnpm --filter backend test:coverage` (target: 40%+)
- [ ] PWA Lighthouse score: >80

**Critical Compliance:**
- [ ] ISSUE-029 evidence shows EXACTLY 0.25" (not 0.24 or 0.26)
- [ ] EPA CGP Section 4.4 cited in code
- [ ] Regulatory penalty mentioned in comments
- [ ] Zero approximations

**Code Quality:**
- [ ] Zero emoji in any files
- [ ] Zero AI branding in commits/PRs
- [ ] All conventional commit format
- [ ] No TODO comments without tickets

### Sprint Retrospective (1 hour)

**Metrics to Review:**
- Average time per atomic task (target: 15-30 min)
- Blockers encountered (how many? why?)
- Evidence quality (any missing/incomplete?)
- Developer feedback (was granularity helpful?)
- Rework rate (how much?)

**Questions:**
1. Were atomic tasks the right size?
2. Were instructions clear enough?
3. Did junior developers get stuck? Where?
4. Was evidence collection smooth?
5. Would we use this approach again?

**Action Items:**
- [ ] Document lessons learned
- [ ] Update issue templates for next sprint
- [ ] Identify top blockers (address in Sprint 2)
- [ ] Celebrate completion (46 tasks!)

---

## Success Metrics

### Quantitative
- [ ] 46/46 issues complete (100%)
- [ ] 46/46 evidence folders populated (100%)
- [ ] Average task time: 15-30 minutes
- [ ] Blockers: <5 total sprint
- [ ] Rework rate: <5%
- [ ] Test coverage: 40%+
- [ ] PWA score: >80
- [ ] EPA threshold: EXACT 0.25"

### Qualitative
- [ ] Junior developers felt tasks were achievable
- [ ] Tech leads could review PRs easily (small, focused)
- [ ] Project manager had daily visibility into progress
- [ ] Team understands atomic task benefits
- [ ] Evidence collection became routine

---

## Risk Mitigation

### If Task Takes >30 Minutes
1. Stop immediately (don't continue struggling)
2. Ask tech lead for help within 10 minutes
3. Identify root cause (unclear instructions? technical blocker?)
4. Update issue file with clarification
5. Resume task with help
6. Document lesson learned

### If Evidence Missing
1. Task NOT complete until evidence collected
2. Developer must go back and collect screenshots
3. No credit for "done" without evidence
4. Update issue file to clarify evidence requirements

### If Build Fails
1. Stop all feature work
2. Investigate failure cause
3. Fix BEFORE continuing to next issue
4. Document fix in evidence
5. Verify fix with full build: `pnpm build`

### If EPA Compliance Wrong
1. CRITICAL BLOCKER (stop sprint if needed)
2. Verify exact 0.25" threshold (not 0.24 or 0.26)
3. Review EPA CGP 2022 Section 4.4 citation
4. Fix immediately (regulatory risk)
5. Add extra tests to prevent regression

---

## Tools and Resources

### Project Management
- GitHub Issues: Track 46 atomic tasks
- GitHub Project Board: Kanban view
- Burn-down Chart: Daily progress tracking
- Daily Standup Template: Consistent format

### Development
- CLAUDE.md: Development standards
- TECH_STACK_DETAILS.md: Technology specifications
- COMMON_PITFALLS.md: Avoid mistakes
- Issue Files: Step-by-step instructions

### Evidence Collection
- VS Code: Screenshots of code
- Terminal: Screenshots of commands/output
- Browser DevTools: Screenshots of working features
- Lighthouse: PWA audit scores

---

## Next Sprint Preview

**Sprint 2 (Oct 14-25):**
- Apply atomic breakdown approach again
- Focus: Dynamic form builder, inspection workflows
- Estimate: 30-40 atomic tasks (15-30 min each)
- Continue evidence-based completion

**Lessons Applied:**
- Refine issue templates based on Sprint 1 feedback
- Adjust time estimates if needed
- Improve evidence requirements clarity
- Scale to 2-3 junior developers in parallel

---

## Approval Sign-off

**Implementation Plan Created:** 2025-10-01 12:50:00 EDT
**Created By:** Project Manager Agent (Claude)

**Reviewed By:** _____________
**Date:** _____________

**Approved for Rollout:** _____________
**Date:** _____________

---

**Remember:**
- 46 atomic tasks = 46 opportunities for success
- Each task 15-30 minutes (achievable by junior devs)
- Evidence-based completion (real systems, no mocks)
- NO emoji, NO AI branding, NO approximations
- EPA 0.25" threshold EXACT per CGP 2022 Section 4.4
- TDD approach: tests FIRST, then implementation

**Ready to implement!**
