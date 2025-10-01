# ISSUE-011: Remove Apollo Client Dependencies

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0 (Blocker)
**Time:** 30 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Remove Apollo Client packages and test-apollo page from web app.

## Step-by-Step

```bash
cd apps/web
rm -rf app/test-apollo
pnpm remove @apollo/client apollo3-cache-persist
git add .
git diff --cached package.json
```

## Acceptance Criteria

- [ ] test-apollo page deleted
- [ ] @apollo/client removed from package.json
- [ ] apollo3-cache-persist removed

## Evidence

`evidence/ISSUE-011/deployment/package-json-diff.png`
