# Sprint 2 Workflow Updates - Summary

**Date:** 2025-10-02
**Changes:** Code review integration and issue tracking

---

## What Changed

### 1. New Issue Created: ISSUE-075

**File:** [issues/ISSUE-075-code-issues-tracker.md](issues/ISSUE-075-code-issues-tracker.md)

**Purpose:** Centralized running log of all code issues, bugs, and tech debt found during Sprint 2

**How it works:**

- Code-reviewer agent adds findings after reviewing each completed issue
- Developer reviews findings and decides actions:
  - **Fix Now:** Critical/High severity issues
  - **Sprint Close:** Medium severity (batch fix before review)
  - **Sprint 3:** Low severity (create tickets for next sprint)

**Benefits:**

- Nothing gets forgotten
- Clear tracking of code quality throughout sprint
- Easy to see patterns and repeated issues
- Sprint review prep already done

### 2. New Workflow Document

**File:** [SPRINT_2_WORKFLOW.md](SPRINT_2_WORKFLOW.md)

**Contents:**

- Standard issue completion workflow (10 steps)
- TDD process (Red → Green → Coverage)
- Code review integration point (step 4)
- Evidence collection requirements
- Quality gates checklist
- Troubleshooting tips

**Key Addition:** Step 4 - Code Review

```bash
# After quality gates pass, run:
/review

# Code-reviewer agent will:
1. Review all changed files
2. Check against BrAve Forms standards
3. Add findings to ISSUE-075
4. Provide severity ratings
5. Recommend actions
```

### 3. Updated Sprint Master Plan

**File:** [SPRINT_2_MASTER_PLAN.md](SPRINT_2_MASTER_PLAN.md)

**Added:**

- Sprint 2 Development Workflow section (quick reference)
- Link to detailed SPRINT_2_WORKFLOW.md
- ISSUE-075 integration notes
- New Definition of Done item: "All Critical and High severity code issues resolved"

---

## Standard Issue Completion Flow (Updated)

### Before (Sprint 1):

1. Read issue → 2. Write tests → 3. Implement → 4. Quality gates → 5. Manual test → 6. Evidence → 7. Report → 8. Commit → 9. Close

### After (Sprint 2 - New Step 4):

1. Read issue
2. Write tests (TDD: red → green)
3. Implement feature
4. Quality gates (lint, type-check, test, build)
5. **Code review** (`/review` command) ← **NEW**
6. **Address findings** (check ISSUE-075, fix Critical/High) ← **NEW**
7. Manual testing
8. Collect evidence
9. Create completion report
10. Commit and close issue

**Time Impact:** +5-10 minutes per issue for code review

---

## Code Review Process

### What Gets Checked

**Automatically by code-reviewer agent:**

1. **Code Quality:** No emoji, proper patterns, error handling, input validation
2. **Testing:** TDD followed, coverage >80%, edge cases, offline scenarios
3. **Multi-Tenancy:** orgId filtering, Prisma middleware, RLS, cross-tenant tests
4. **Offline-First:** Works without connectivity, sync handling, iOS considerations
5. **Performance:** API <200ms, queries optimized, no N+1 problems
6. **Security:** Input sanitization, JWT validation, SQL injection prevention
7. **Documentation:** JSDoc comments, README updates, complex logic explained

### Severity Ratings

- **Critical:** Security vulnerability, data loss risk, breaks existing functionality
- **High:** Performance issue, poor error handling, missing tests
- **Medium:** Code duplication, minor pattern violations, optimization opportunities
- **Low:** Style issues, documentation improvements, refactoring suggestions

### Actions Based on Severity

| Severity | Action                                  | Timeline |
| -------- | --------------------------------------- | -------- |
| Critical | Fix immediately before closing issue    | Same day |
| High     | Fix before closing issue                | Same day |
| Medium   | Track for batch fix before sprint close | Oct 24   |
| Low      | Defer to Sprint 3, create ticket        | Sprint 3 |

---

## ISSUE-075 Usage

### Throughout Sprint:

- Developer completes ISSUE-XXX
- Runs `/review` command
- Code-reviewer adds findings to ISSUE-075
- Developer addresses Critical/High immediately
- Medium/Low tracked for later

### Before Sprint Review (October 24, 2025):

1. Review all entries in ISSUE-075
2. Fix all "Sprint Close" medium priority items
3. Create GitHub issues for Sprint 3 tech debt
4. Update sprint completion summary

### During Sprint Retrospective (October 25, 2025):

- Review patterns in ISSUE-075
- Discuss repeated issues
- Identify areas for improvement
- Update CLAUDE.md if needed

---

## Benefits of New Workflow

### For Developers:

- **Quality feedback immediately** after each issue
- **Clear priorities** (Critical/High = now, Medium/Low = later)
- **Nothing forgotten** (centralized tracker)
- **Learn patterns** from code-reviewer recommendations

### For Sprint:

- **Higher code quality** (caught early, not at sprint end)
- **Easier sprint review** (tech debt already tracked)
- **Faster Sprint 3 planning** (tech debt tickets ready)
- **Pattern recognition** (repeated issues visible)

### For Project:

- **Consistent standards** (automated checking)
- **Knowledge capture** (findings documented)
- **Technical debt visibility** (not hidden)
- **Continuous improvement** (retrospective data)

---

## Relaxed Rules (Per Developer Request)

**What we're relaxing:**

- No need to constantly verify EPA compliance rules during development
- Focus on getting work done, code-reviewer will catch compliance issues
- Trust developers know the 0.25" threshold requirement
- Don't block progress with over-verification

**What stays strict:**

- TDD workflow (tests first, always)
- Quality gates (must pass before review)
- Code review (every issue, no exceptions)
- Evidence collection (screenshots, reports)
- No emoji, no AI branding (zero tolerance)

---

## Quick Reference

### Commands

```bash
# Run code review after issue completion
/review

# Check issue tracker
cat docs/sprints/sprint2/issues/ISSUE-075-code-issues-tracker.md

# Run all quality gates
pnpm lint && pnpm type-check && pnpm test && pnpm build
```

### Files

- **Workflow:** [SPRINT_2_WORKFLOW.md](SPRINT_2_WORKFLOW.md) (detailed process)
- **Issue Tracker:** [ISSUE-075](issues/ISSUE-075-code-issues-tracker.md) (code issues log)
- **Master Plan:** [SPRINT_2_MASTER_PLAN.md](SPRINT_2_MASTER_PLAN.md) (sprint overview)

### Timeline

- **During Sprint:** Code review after each issue, track in ISSUE-075
- **October 24:** Fix all medium priority items from ISSUE-075
- **October 25:** Sprint review with clean codebase

---

## Examples

### Example 1: Critical Issue Found

```
Developer completes ISSUE-051 (Form Schema Design)
Runs /review
Code-reviewer finds: "SQL injection vulnerability in field validation"
Severity: Critical
Action: Fix immediately before closing issue
Developer fixes, reruns tests, updates evidence
Issue closed with fix documented
```

### Example 2: Medium Issue Found

```
Developer completes ISSUE-053 (createFormTemplate Mutation)
Runs /review
Code-reviewer finds: "Duplicated validation logic, extract to helper"
Severity: Medium
Action: Track for sprint close
Developer adds to ISSUE-075, continues to next issue
Fixed on October 24 in batch with other medium items
```

### Example 3: Low Issue Found

```
Developer completes ISSUE-060 (GPS EXIF Extraction)
Runs /review
Code-reviewer finds: "JSDoc comments could be more detailed"
Severity: Low
Action: Defer to Sprint 3
Developer creates Sprint 3 ticket: "Improve GPS service documentation"
Moves to next issue
```

---

## Questions & Answers

**Q: Do I run code review on every issue?**
A: Yes, mandatory after every issue completion. Takes 5-10 minutes.

**Q: What if I disagree with code-reviewer findings?**
A: Document your reasoning in ISSUE-075. Discuss in standup if needed.

**Q: Can I skip fixing medium priority issues?**
A: Yes, during development. Must fix before sprint close (Oct 24).

**Q: What if ISSUE-075 gets too long?**
A: Expected. It's a living document. Review before sprint close.

**Q: Do I need to fix every low priority issue?**
A: No, create Sprint 3 tickets and move on.

---

**Sprint 2 workflow is designed for quality without sacrificing velocity.**

**Last Updated:** 2025-10-02
**Next Review:** After Sprint 2 completion (October 25, 2025)
