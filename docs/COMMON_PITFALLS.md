# BrAve Forms - Common Pitfalls & Anti-Patterns

**Version:** 1.0
**Last Updated:** September 30, 2025
**Purpose:** Comprehensive guide to avoid common development mistakes
**Referenced By:** CLAUDE.md

---

## Overview

This document consolidates common mistakes, anti-patterns, and violations encountered during BrAve Forms development. **All items listed are PROHIBITED** - violating these standards results in code rejection and mandatory refactoring.

---

## Critical Violations (ZERO TOLERANCE)

**These violations result in immediate session restart and code rejection:**

### Code Cleanliness Violations

- ❌ **Including emoji** in code, comments, or documentation
  - **Why:** Encoding issues, platform compatibility, unprofessional appearance
  - **Examples:** 🚀, ✅, ❌, 🔥 in any code files
  - **Exception:** NONE - zero tolerance

- ❌ **Adding "Generated with Claude Code" or AI references**
  - **Why:** Unprofessional, clutters codebase, violates branding standards
  - **Examples:** "Co-Authored-By: Claude", anthropic.com links, AI generation disclaimers
  - **Exception:** NONE - zero tolerance

- ❌ **Using decorative characters** instead of proper documentation
  - **Why:** Not all terminals/editors render Unicode correctly
  - **Examples:** Box drawing characters, fancy bullets, decorative separators
  - **Solution:** Use standard ASCII characters only

- ❌ **Leaving TODO comments** without implementation or ticket reference
  - **Why:** Technical debt accumulation, forgotten work
  - **Correct:** `// TODO: Fix auth bug (JIRA-1234)` with actual ticket
  - **Incorrect:** `// TODO: fix this later`

---

## Code Quality Issues

### API & Documentation Assumptions

- ❌ **Assuming APIs without checking documentation**
  - **Why:** AI hallucination, outdated knowledge, breaking changes
  - **Example:** Using Apollo Client v3 patterns in v4 codebase
  - **Solution:** ALWAYS verify with official docs before implementing

- ❌ **Using placeholder/TODO comments without implementation**
  - **Why:** Creates false sense of completion
  - **Example:** Function with `// TODO: Implement later` body
  - **Solution:** Either implement fully or mark as incomplete

### Error Handling Violations

- ❌ **Skipping error handling** for "simple" operations
  - **Why:** Network failures, disk full, permission denied - all can happen
  - **Example:** `const data = JSON.parse(input);` without try-catch
  - **Solution:** Wrap ALL external operations in error handling

- ❌ **Generic error messages** without context
  - **Why:** Impossible to debug in production
  - **Bad:** `throw new Error('Failed');`
  - **Good:** `throw new Error(\`Failed to load project \${projectId} for org \${orgId}: \${reason}\`);`

### Testing Violations

- ❌ **Committing untested code**
  - **Why:** Breaks production, wastes team time
  - **Solution:** Run `pnpm test` before every commit

- ❌ **Approximating compliance thresholds**
  - **Why:** Regulatory fines ($25k-$50k/day), legal liability
  - **Example:** Using 0.24" or 0.26" instead of EXACTLY 0.25"
  - **Solution:** Use exact values per EPA CGP requirements

### Offline Scenarios

- ❌ **Ignoring offline scenarios in ANY feature**
  - **Why:** Construction sites have poor connectivity, 30-day requirement
  - **Example:** API call without fallback to IndexedDB cache
  - **Solution:** Every feature MUST work offline for 30 days

- ❌ **Assuming internet connectivity**
  - **Why:** Field workers operate without reliable networks
  - **Example:** Real-time validation requiring server calls
  - **Solution:** Queue operations, sync when online

---

## Pattern Violations

### Architectural Anti-Patterns

- ❌ **Creating new architectural patterns** without discussion
  - **Why:** Inconsistency, technical debt, onboarding difficulty
  - **Example:** New state management approach without team approval
  - **Solution:** Discuss with team BEFORE implementing

- ❌ **Ignoring existing error handling patterns**
  - **Why:** Inconsistent error responses, poor user experience
  - **Example:** Throwing raw errors instead of custom exceptions
  - **Solution:** Use project's established error handling (CustomException with context)

- ❌ **Skipping input validation** "because it's internal"
  - **Why:** Defense in depth, prevents data corruption
  - **Example:** Trusting internal API calls without validation
  - **Solution:** Validate ALL inputs, even from trusted sources

### Multi-Tenancy Violations

- ❌ **Not considering offline scenarios**
  - **Why:** 30-day offline requirement, construction site constraints
  - **Solution:** Test every feature without internet

- ❌ **Breaking multi-tenant isolation**
  - **Why:** Data leaks between companies, regulatory violations, lawsuits
  - **Example:** Query without orgId filter
  - **Solution:** ALWAYS filter by orgId from Clerk JWT

**Multi-Tenancy Defense Layers (ALL THREE REQUIRED):**

1. **Application Layer:** Clerk orgId in JWT → All queries filtered
2. **ORM Layer:** Prisma middleware auto-injects orgId
3. **Database Layer:** PostgreSQL RLS enforces boundaries

**Test:** Attempting cross-tenant access MUST fail

---

## Testing Violations

### TDD Violations

- ❌ **Claiming code is done** without tests
  - **Why:** No verification, high bug risk
  - **Solution:** Tests MUST exist before claiming complete

- ❌ **Writing tests AFTER implementation** (not TDD)
  - **Why:** Tests become implementation documentation, not specifications
  - **Solution:** Write tests FIRST, then implement

- ❌ **Skipping offline scenario tests**
  - **Why:** 30-day offline requirement critical for field workers
  - **Solution:** Test all features in offline mode

- ❌ **Not testing multi-tenant isolation**
  - **Why:** Data leaks between orgs = catastrophic failure
  - **Solution:** Explicit cross-tenant access attempt tests (must fail)

- ❌ **Approximating compliance thresholds**
  - **Why:** EPA CGP requires EXACTLY 0.25", not 0.24" or 0.26"
  - **Example:** `if (rain >= 0.24)` instead of `if (rain >= 0.25)`
  - **Solution:** Use exact regulatory values

---

## Process Issues

### Requirements & Planning

- ❌ **Implementing before understanding requirements fully**
  - **Why:** Rework, wasted time, wrong solution
  - **Example:** Building feature without clarifying acceptance criteria
  - **Solution:** Use Plan Mode (Shift+Tab twice), clarify BEFORE coding

- ❌ **Copying patterns from other projects** without adaptation
  - **Why:** Different tech stack, different constraints
  - **Example:** Using Docker Compose patterns in Kubernetes project
  - **Solution:** Analyze BrAve Forms patterns first

- ❌ **Skipping the research phase** for "quick fixes"
  - **Why:** Breaking changes, incompatibilities, tech debt
  - **Example:** Upgrading library without checking changelog
  - **Solution:** ALWAYS research before making changes

### Completion & Verification

- ❌ **Claiming completion without verification**
  - **Why:** False confidence, production bugs
  - **Example:** "Tests pass locally" without CI/CD verification
  - **Solution:** Run ALL quality gates (`/qa` or manual gates)

- ❌ **Skipping EPA/OSHA compliance validation**
  - **Why:** $25k-$50k/day fines, legal liability
  - **Example:** Rain trigger without 0.25" verification
  - **Solution:** Validate against actual regulations

### Construction Site Constraints

- ❌ **Ignoring construction site constraints**
  - **Why:** Gloves, weather, dust - real-world usage differs from office
  - **Examples:**
    - Small touch targets (can't use with gloves)
    - Low contrast UI (unreadable in sunlight)
    - Fragile operations (interrupted by rain/battery)
  - **Solution:** Test with field conditions checklist

- ❌ **Creating features that require constant connectivity**
  - **Why:** Construction sites have poor/no internet
  - **Example:** Real-time collaboration without offline fallback
  - **Solution:** Offline-first, sync later

---

## Documentation Violations

### Outdated Documentation

- ❌ **Not updating docs when APIs change**
  - **Why:** Team confusion, onboarding difficulty, wrong implementations
  - **Example:** Changing endpoint but not updating API docs
  - **Solution:** Update docs IMMEDIATELY when code changes

- ❌ **Including emoji in documentation**
  - **Why:** Encoding issues, platform incompatibility
  - **Solution:** Use text markers instead (## CRITICAL:, not 🚨)

- ❌ **Adding AI branding to documentation**
  - **Why:** Unprofessional, violates standards
  - **Solution:** Remove all "Generated by Claude Code" references

- ❌ **Leaving outdated documentation**
  - **Why:** Misleads developers, causes bugs
  - **Solution:** Quarterly doc review, remove obsolete content

---

## Git Violations

### Commit Quality

- ❌ **Committing without passing quality gates**
  - **Why:** Breaks CI/CD, blocks team
  - **Required gates:** Lint + Type-check + Test + Build
  - **Solution:** Run `/qa` before commit

- ❌ **Using emoji in commit messages**
  - **Why:** Breaks commit parsers, violates conventional commits
  - **Bad:** `✨ feat: add login`
  - **Good:** `feat: add login functionality`

- ❌ **Adding AI branding to commits or PRs**
  - **Why:** Unprofessional, clutters history
  - **Prohibited:**
    - "Generated with Claude Code"
    - "Co-Authored-By: Claude"
    - Anthropic.com links
  - **Solution:** Clean, professional commit messages only

- ❌ **Not following conventional commit format**
  - **Why:** Breaks changelog generation, CI/CD
  - **Format:** `<type>: <description>` (feat, fix, docs, refactor, test, chore)
  - **Example:** `feat: implement EPA CGP 0.25 inch rain trigger`

- ❌ **Pushing directly to main/master**
  - **Why:** Bypasses code review, breaks deployment
  - **Solution:** Always use feature branches + PR

---

## BrAve Forms Specific Pitfalls

### EPA Compliance Critical

- ❌ **Compromising on 0.25" rain threshold accuracy**
  - **Why:** EPA CGP legal requirement, not a guideline
  - **Penalty:** $25,000-$50,000 PER DAY of violation
  - **Solution:** EXACT 0.25", never approximate (not 0.24" or 0.26")

- ❌ **Ignoring 24-hour inspection window during working hours**
  - **Why:** EPA CGP requirement
  - **Example:** Using calendar hours instead of business hours
  - **Solution:** If storm occurs Saturday, inspection due Monday (next work day)

### Offline Capability Critical

- ❌ **Not implementing offline-first, sync later**
  - **Why:** 30-day offline requirement for construction sites
  - **Example:** Real-time API calls without offline fallback
  - **Solution:** Service Workers + IndexedDB with delta sync

- ❌ **Using IndexedDB for critical compliance data on iOS**
  - **Why:** iOS WILL reclaim IndexedDB storage under low space
  - **Example:** Storing inspection records in IndexedDB
  - **Solution:** Use SQLite (`@capacitor-community/sqlite`) for critical data

- ❌ **Breaking 30-day offline capability**
  - **Why:** Field workers need access without connectivity
  - **Example:** Adding feature that requires server call
  - **Solution:** Custom sync engine, queue operations

### Inspector Portal Access

- ❌ **Ignoring inspector portal access** in compliance features
  - **Why:** Inspectors need read-only access without app install
  - **Example:** Inspector features requiring full app login
  - **Solution:** QR codes with time-limited tokens

### Field Testing Requirements

- ❌ **Not testing with construction site conditions**
  - **Why:** Real-world differs dramatically from office
  - **Required tests:**
    - Works with construction gloves (large touch targets)
    - Visible in direct sunlight (high contrast)
    - Functions in rain/dust (weather resistant)
    - Operates without connectivity (offline capable)
    - Handles interrupted operations (battery, connectivity loss)
    - Syncs when connection restored (delta sync)

### Multi-Tenancy Isolation

- ❌ **Not using Clerk org claims + Prisma middleware + PostgreSQL RLS**
  - **Why:** Three-layer defense required for data isolation
  - **Example:** Only using application-layer filtering
  - **Solution:** Implement ALL THREE layers

- ❌ **Not testing cross-tenant access attempts**
  - **Why:** Data leaks = regulatory violations + lawsuits
  - **Solution:** Explicit tests that cross-tenant access FAILS

### Offline Persistence

- ❌ **Using TanStack Query without async-storage-persister**
  - **Why:** Query cache won't persist across app restarts
  - **Solution:** Add `@tanstack/query-async-storage-persister`

---

## Anti-Patterns from Research

### Context Management Anti-Patterns

- ❌ **Reusing long chats for multiple unrelated tasks**
  - **Why:** Irrelevant context interferes, wrong "memories"
  - **Solution:** `/clear` after completing each task

- ❌ **Letting context reach 95% before acting**
  - **Why:** Auto-compact triggers, lose important context
  - **Solution:** Manual `/compact` at 70% capacity

- ❌ **Not using Plan Mode for complex features**
  - **Why:** Scope drift, token waste, rework
  - **Solution:** Shift+Tab twice BEFORE implementing (>30 min features)

### TDD Anti-Patterns

- ❌ **Not using TDD for AI-assisted development**
  - **Why:** AI hallucination, scope drift
  - **Solution:** Tests FIRST (explicit workflow), then implement

- ❌ **Modifying tests to match broken code**
  - **Why:** Defeats purpose of TDD, false confidence
  - **Solution:** Tests are TRUTH, code must pass tests (not vice versa)

### Agent Management Anti-Patterns

- ❌ **Not delegating research to sub-agents early**
  - **Why:** Main context polluted with irrelevant information
  - **Solution:** Spawn research agents proactively

- ❌ **Using 10+ agents simultaneously**
  - **Why:** Performance degradation, coordination overhead
  - **Solution:** 5-8 agents optimal, 10 max

---

## Enforcement & Consequences

### Immediate Actions When Violations Detected

**Zero Tolerance Violations:**

1. STOP work immediately
2. Revert changes
3. Flag for review
4. Session restart if pattern persists

**Code Quality Issues:**

1. Code review rejection
2. Mandatory refactoring
3. Additional testing required
4. Documentation update

**Process Violations:**

1. Plan Mode required before proceeding
2. Requirements clarification
3. Architecture review
4. Approval gate

---

## Prevention Strategies

### Session Start Checklist

Every session start:

- [ ] Read CLAUDE.md completely
- [ ] State "CLAUDE.md rules understood"
- [ ] Run `git status` to understand current state
- [ ] Check for failing tests or lint errors
- [ ] Review recent commits for context
- [ ] Verify no emoji or branding in recent commits

### Before Commit Checklist

- [ ] Run `/qa` or manual: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
- [ ] Run `/test-offline` if touching sync/mobile
- [ ] Run `/test-compliance` if touching EPA/OSHA
- [ ] Scan diff for emoji: `git diff | grep -E '[\x{1F000}-\x{1F9FF}]'`
- [ ] Scan diff for "Claude Code" or anthropic.com
- [ ] Verify commit message: no emoji, conventional format
- [ ] Confirm all tests pass

### Before PR Checklist

- [ ] All commits have clean messages (no emoji/branding)
- [ ] Run `/pr-ready` for full validation
- [ ] PR description: no emoji, no AI branding
- [ ] All quality gates pass
- [ ] Documentation updated
- [ ] Compliance validated (if applicable)

---

## Learning From Mistakes

### When Violations Occur

1. **Document the violation:** Add to this file if new pattern
2. **Update CLAUDE.md:** Strengthen guidance if needed
3. **Add tests:** Prevent recurrence
4. **Team notification:** Share learnings
5. **Quarterly review:** Identify systemic issues

### Metrics to Track

- File size violation rate (target: <1%)
- Emoji usage violations (target: 0%)
- Fake validation incidents (target: 0%)
- Cross-tenant access attempts (all should fail)
- Offline capability breaks (target: 0)
- Compliance threshold approximations (target: 0)

---

## References

- **CLAUDE.md:** Primary development guidance
- **TECH_STACK_DETAILS.md:** Technology-specific patterns
- **EPA_COMPLIANCE_REQUIREMENTS.md:** Regulatory requirements
- **WEB_FRONTEND_STATUS.md:** Known frontend issues

---

**Last Updated:** September 30, 2025
**Review Frequency:** Quarterly or after major violations
**Maintained By:** Development Team

**Remember:** These are NOT suggestions - they are PROHIBITIONS. Violations result in code rejection and mandatory refactoring. Zero tolerance for compliance-related pitfalls.
