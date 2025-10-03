# Sprint 2 Development Workflow

**Sprint:** Sprint 2 (October 14-25, 2025)
**Created:** 2025-10-02
**Purpose:** Standard workflow for completing Sprint 2 issues with code review integration

---

## Standard Issue Completion Workflow

### Step 1: Start Issue

```bash
# Read the issue documentation
cat docs/sprints/sprint2/issues/ISSUE-XXX-title.md

# Create feature branch
git checkout -b feature/issue-XXX-description
```

### Step 2: TDD Development (Red → Green)

**Phase A: Write Tests First (Red Phase)**

1. Create test file: `*.spec.ts` or `*.test.tsx`
2. Write test cases for expected behavior
3. Run tests: `pnpm --filter [backend|web] test`
4. **Verify tests FAIL** (red phase)
5. Screenshot failing tests → `evidence/ISSUE-XXX/test-results/red-phase.png`

**Phase B: Implement Feature (Green Phase)**

1. Write implementation code
2. Run tests: `pnpm --filter [backend|web] test`
3. **Verify tests PASS** (green phase)
4. Screenshot passing tests → `evidence/ISSUE-XXX/test-results/green-phase.png`

**Phase C: Coverage Verification**

1. Run coverage: `pnpm --filter [backend|web] test:cov`
2. Verify >80% coverage for new code
3. Screenshot coverage report → `evidence/ISSUE-XXX/test-results/coverage.png`

### Step 3: Quality Gates (Mandatory)

```bash
# Run all quality gates
pnpm lint              # ESLint + Prettier
pnpm type-check        # TypeScript compilation
pnpm test              # All tests passing
pnpm build             # Build succeeds
```

**All must pass before proceeding to code review.**

### Step 4: Code Review (NEW - Mandatory)

**Run code-reviewer agent:**

```bash
# Use Claude Code slash command
/review
```

**What the code-reviewer checks:**

- Code quality (no emoji, proper patterns, error handling)
- Testing (TDD followed, coverage >80%, edge cases)
- Multi-tenancy (orgId filtering, RLS, cross-tenant tests)
- Offline-first (works without connectivity, sync handling)
- Performance (API <200ms, queries optimized, no N+1 problems)
- Security (input sanitization, JWT validation, SQL injection prevention)
- Documentation (JSDoc comments, README updates, complex logic explained)

**Code-reviewer agent will:**

1. Review all changed files
2. Check against BrAve Forms standards
3. Add findings to `ISSUE-075-code-issues-tracker.md`
4. Provide severity rating (Critical/High/Medium/Low)
5. Recommend actions (Fix Now / Sprint Close / Sprint 3)

### Step 5: Address Code Review Findings

**Review the findings:**

```bash
# Open the tracker
cat docs/sprints/sprint2/issues/ISSUE-075-code-issues-tracker.md
```

**Decide on action:**

- **Critical/High issues:** Fix NOW before closing issue
- **Medium issues:** Track for "Sprint Close" batch fix
- **Low issues:** Defer to Sprint 3 (create ticket)

**If fixes needed:**

1. Make changes based on code-reviewer recommendations
2. Run quality gates again
3. Update evidence with fixes
4. Mark findings as "Fixed" in ISSUE-075

### Step 6: Manual Testing

1. Test feature in development environment
2. Test edge cases
3. Test offline scenarios (if applicable)
4. Test with multiple organizations (multi-tenancy)
5. Screenshot manual test results → `evidence/ISSUE-XXX/manual-testing/`

### Step 7: Collect Evidence

**Required evidence structure:**

```
docs/sprints/sprint2/evidence/ISSUE-XXX/
├── test-results/
│   ├── red-phase.png (tests failing)
│   ├── green-phase.png (tests passing)
│   └── coverage.png (coverage report)
├── code/
│   └── implementation-screenshot.png or git-diff.png
├── manual-testing/
│   └── feature-working.png
├── performance/ (if applicable)
│   └── api-response-times.png
└── COMPLETION-REPORT.md (summary)
```

### Step 8: Create Completion Report

**Template:**

```markdown
# ISSUE-XXX: [Title] - COMPLETION REPORT

**Status:** COMPLETE
**Time:** [Actual time spent]
**Completed:** YYYY-MM-DD
**Developer:** [Your name]

## Summary

[2-3 sentences describing what was accomplished]

## Implementation Details

[Key technical decisions, approaches used]

## Code Review Results

**Reviewer:** code-reviewer agent
**Date:** YYYY-MM-DD
**Findings:** [Link to ISSUE-075 entry or summary]
**Actions Taken:** [How you addressed findings]

## Testing Results

- Tests written first: ✅
- Red phase verified: ✅
- Green phase verified: ✅
- Coverage: X% (target: >80%)

## Evidence Collected

- [x] Red phase screenshot
- [x] Green phase screenshot
- [x] Coverage report
- [x] Manual testing screenshots
- [x] Code review completed

## Next Steps

[If applicable, note any follow-up work]
```

### Step 9: Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional format (NO EMOJI, NO AI BRANDING)
git commit -m "feat: implement [feature description]

[Detailed explanation of WHY, not WHAT]

Closes ISSUE-XXX
Reviewed-by: code-reviewer agent"

# Push to remote
git push origin feature/issue-XXX-description
```

### Step 10: Close Issue

1. Mark issue as complete in tracking
2. Update Sprint 2 Master Plan progress
3. Move to next issue

---

## Simplified Workflow Diagram

```
1. Read Issue → 2. Write Tests (Red) → 3. Implement (Green) → 4. Quality Gates
                                                                      ↓
9. Commit    ← 8. Create Report ← 7. Collect Evidence ← 6. Manual Test ← 5. Code Review
     ↓
10. Close Issue → Next Issue
```

---

## Code Review Integration Points

### When Code-Reviewer Runs:

- **Trigger:** After quality gates pass, before manual testing
- **Duration:** ~2-5 minutes per issue
- **Output:** Findings added to ISSUE-075-code-issues-tracker.md
- **Action Required:** Developer reviews findings and addresses Critical/High issues

### Code-Reviewer Checklist (Automated):

- [x] No emoji in code, comments, or documentation
- [x] No AI branding or references
- [x] Proper error handling on all external calls
- [x] Input validation on all user inputs
- [x] Tests written first (TDD verified by commit history)
- [x] Coverage >80% for new code
- [x] Edge cases and error scenarios tested
- [x] Multi-tenant isolation (orgId filtering)
- [x] Offline scenarios considered
- [x] Performance targets met (<200ms API, optimized queries)
- [x] Security vulnerabilities checked
- [x] Documentation updated (JSDoc, README)
- [x] Code follows project patterns

---

## Issue-075 Integration

**ISSUE-075** is the centralized tracker for all code issues found during Sprint 2.

### Developer Responsibilities:

1. Check ISSUE-075 after each code review
2. Address Critical and High severity issues immediately
3. Track Medium issues for batch fix before sprint close
4. Create Sprint 3 tickets for deferred Low priority items

### Before Sprint Review (October 25):

1. Review all entries in ISSUE-075
2. Fix all "Sprint Close" tagged items
3. Create GitHub issues for Sprint 3 tech debt
4. Update sprint completion summary with resolved issues

---

## Quality Gates Summary

**Must pass before code review:**

```bash
✅ pnpm lint           # No linting errors
✅ pnpm type-check     # No TypeScript errors
✅ pnpm test           # All tests passing
✅ pnpm build          # Build succeeds
```

**Must complete during workflow:**

```bash
✅ TDD (Red → Green phases with screenshots)
✅ Code review (findings documented in ISSUE-075)
✅ Manual testing (screenshots collected)
✅ Evidence collected (proper structure)
✅ Completion report created
```

---

## Time Estimates per Issue

- **Small (2-4h):** ~30 min TDD, ~1.5h implementation, ~30 min review/testing, ~30 min evidence
- **Medium (4-8h):** ~1h TDD, ~4h implementation, ~1h review/testing, ~1h evidence
- **Large (8-12h):** ~2h TDD, ~6h implementation, ~2h review/testing, ~1h evidence

**Code review adds ~5-10 minutes per issue** (automated via agent)

---

## Tips for Efficiency

### Batch Operations:

- Run quality gates together: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
- Collect evidence as you go (don't wait until end)
- Write completion report during implementation (update as you work)

### Code Review:

- Fix Critical/High issues immediately (don't accumulate tech debt)
- Use code-reviewer suggestions to learn patterns
- Reference ISSUE-075 when addressing similar issues

### Evidence Collection:

- Take screenshots in real-time (don't recreate later)
- Use descriptive filenames (red-phase.png, not screenshot1.png)
- Create COMPLETION-REPORT.md template at start, fill in as you work

---

## Troubleshooting

**Q: Code-reviewer agent not working?**
A: Use `/review` slash command or manually review against CLAUDE.md standards

**Q: Quality gates failing?**
A: Don't proceed to code review. Fix issues first, then run gates again.

**Q: Too many code review findings?**
A: Focus on Critical/High first. Medium/Low can be batched or deferred.

**Q: Forgot to take red phase screenshot?**
A: Temporarily break a test to recreate red phase, screenshot, then fix.

**Q: ISSUE-075 getting too long?**
A: That's expected. Review before sprint close and create Sprint 3 tickets.

---

## Sprint 2 Workflow Changes

**What's New in Sprint 2:**

- Code-reviewer agent integration (mandatory after each issue)
- ISSUE-075 centralized issue tracker
- Findings must be addressed before issue close
- Sprint close batch fix for accumulated Medium issues

**What Stayed the Same:**

- TDD workflow (Red → Green → Coverage)
- Quality gates (lint, type-check, test, build)
- Evidence collection requirements
- Completion report format

---

**This workflow ensures high code quality while maintaining development velocity.**

**Last Updated:** 2025-10-02
**Next Review:** After Sprint 2 completion (October 25, 2025)
