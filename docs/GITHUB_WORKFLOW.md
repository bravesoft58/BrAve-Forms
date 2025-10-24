# BrAve Forms - GitHub Workflow Guide

**Version:** 1.0
**Last Updated:** 2025-10-24
**Status:** ACTIVE
**Enforcement:** MANDATORY for all development work

---

## Overview

This document defines the professional GitHub workflow for BrAve Forms development. **All developers MUST follow this workflow** - no exceptions. Direct commits to master are prohibited after branch protection is enabled.

---

## Workflow Strategy: GitHub Flow

**Why GitHub Flow:**

- Simple and scalable (2-5 person teams)
- Pull request-based (code review built-in)
- Continuous integration friendly
- Fast feedback loops
- Easy to learn and enforce

**Alternative Strategies Considered:**

- GitFlow: Too complex for current team size
- Trunk-Based Development: Requires more CI/CD maturity

---

## Branch Protection Rules

**Master Branch Protection (ENABLED):**

```
Required Settings:
✅ Require pull request before merging
✅ Require status checks to pass before merging
   - lint (eslint + prettier)
   - type-check (TypeScript compilation)
   - test (Vitest + Playwright, >80% coverage)
   - build (production build verification)
✅ Require branches to be up to date before merging
✅ Include administrators (NO exceptions)
❌ Require approvals before merging (solo developer mode)
❌ Allow force pushes (NEVER)
❌ Allow deletions (NEVER)
```

**How to Enable:**

1. Go to GitHub repository Settings
2. Navigate to Branches → Branch protection rules
3. Click "Add rule"
4. Branch name pattern: `master`
5. Configure settings as listed above
6. Click "Create" or "Save changes"

---

## Branch Naming Conventions

**Format:** `<type>/<ISSUE-XXX>-<short-description>`

**Types:**

| Type          | Usage                                       | Example                                        |
| ------------- | ------------------------------------------- | ---------------------------------------------- |
| `feature/`    | New functionality                           | `feature/ISSUE-145-form-builder-ui`            |
| `fix/`        | Bug fixes                                   | `fix/ISSUE-047-database-migration-error`       |
| `compliance/` | EPA/OSHA regulatory work                    | `compliance/ISSUE-018-025-inch-rain-threshold` |
| `docs/`       | Documentation only                          | `docs/ISSUE-075-update-api-documentation`      |
| `refactor/`   | Code improvements (no functionality change) | `refactor/ISSUE-080-simplify-auth-logic`       |

**Rules:**

- ALWAYS include issue number (e.g., ISSUE-145)
- Use lowercase with hyphens (kebab-case)
- Keep description short (3-5 words max)
- Branch name max 50 characters

---

## Development Workflow

### Step 1: Start New Work

```bash
# Update master to latest
git checkout master
git pull origin master

# Create feature branch
git checkout -b feature/ISSUE-123-photo-gallery-grid

# Verify you're on the correct branch
git branch --show-current
```

### Step 2: Implement with TDD

```bash
# 1. Write failing tests FIRST
# Run tests to confirm they FAIL (red phase)
pnpm test

# 2. Implement minimal code to pass tests
# Run tests until they PASS (green phase)
pnpm test

# 3. Commit with conventional format
git add .
git commit -m "feat: implement photo gallery grid view

Add PhotoGallery component with responsive grid layout using Mantine
SimpleGrid. Supports 1-4 columns based on screen size.

Tests: PhotoGallery.test.tsx (15 tests, 95% coverage)
Evidence: docs/sprints/sprint5/evidence/ISSUE-123/"
```

### Step 3: Run Quality Gates

```bash
# Run ALL quality gates
pnpm lint
pnpm type-check
pnpm test
pnpm build

# ALL MUST PASS before proceeding
```

### Step 4: Push Branch and Create PR

```bash
# Push branch to remote
git push origin feature/ISSUE-123-photo-gallery-grid

# Create PR via GitHub UI
# Fill in PR template
# Attach evidence
```

### Step 5: Wait for Quality Gates

GitHub Actions will automatically run all checks. **Do NOT merge until ALL checks pass.**

### Step 6: Merge Pull Request

```bash
# Merge via GitHub UI using "Squash and merge"
# Delete feature branch after merge
# Pull latest master locally
git checkout master
git pull origin master
git branch -d feature/ISSUE-123-photo-gallery-grid
```

---

## Commit Message Standards

**Format:**

```
<type>: <brief summary under 72 characters>

<detailed explanation of WHY, not WHAT>

<optional footer for issue references>
```

**Types:** feat, fix, refactor, docs, test, compliance, perf, chore, security

**ABSOLUTE RULES:**

- NO emoji anywhere in commit messages
- NO "Generated with Claude Code" or AI branding
- NO "Co-Authored-By: Claude" lines
- ALWAYS use conventional commit format
- ALWAYS reference issue number in body or footer

---

## Emergency Hotfix Workflow

```bash
# 1. Create hotfix branch from master
git checkout master
git pull origin master
git checkout -b fix/ISSUE-999-critical-auth-vulnerability

# 2. Implement fix with MINIMAL changes
# 3. Run quality gates (MUST pass)
# 4. Commit, push, create PR
# 5. Merge immediately after checks pass
# 6. Deploy to production
# 7. Monitor for 1 hour
```

---

## Best Practices

### DO:

- ✅ Create branch for EVERY issue
- ✅ Write tests BEFORE implementation (TDD)
- ✅ Run quality gates before pushing
- ✅ Provide evidence in PR
- ✅ Keep PRs small (<500 lines)
- ✅ Squash and merge
- ✅ Delete branch after merge

### DON'T:

- ❌ Commit directly to master (NEVER)
- ❌ Force push to master (NEVER)
- ❌ Skip quality gates
- ❌ Use emoji in commits
- ❌ Add AI branding
- ❌ Merge with failing checks

---

## Troubleshooting

### Problem: "Cannot push to master"

**Solution:** Create a branch instead:

```bash
git branch feature/ISSUE-XXX-my-work
git reset --hard origin/master
git checkout feature/ISSUE-XXX-my-work
git push origin feature/ISSUE-XXX-my-work
```

### Problem: "Quality checks failing"

**Solution:**

1. Run locally: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
2. Fix all errors
3. Commit and push
4. Checks re-run automatically

### Problem: "Branch out of date"

**Solution:**

```bash
git checkout feature/ISSUE-XXX-my-work
git fetch origin
git rebase origin/master
git push origin feature/ISSUE-XXX-my-work --force-with-lease
```

---

## References

- **CLAUDE.md:** Primary development guidance
- **TECH_STACK_DETAILS.md:** Technology stack details
- **COMMON_PITFALLS.md:** Anti-patterns and violations

---

**Last Updated:** 2025-10-24
**Maintained By:** Development Team

**Remember:** This workflow is MANDATORY. Zero tolerance for violations.
