# ISSUE-017: Remove Apollo Client from package.json

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 10 minutes | **Points:** 1 | **Status:** COMPLETE
**Created:** 2025-10-01 15:45:00 EDT
**Completed:** 2025-10-01 17:55:00 EDT
**Dependencies:** ISSUE-016 (Test files deleted) ✅
**Note:** Completed during ISSUE-011 (Apollo packages already removed)

---

## What You'll Do

Remove Apollo Client and related dependencies from package.json now that migration is complete.

---

## Step-by-Step Instructions

### Step 1: Remove Apollo Packages (5 min)

```bash
cd apps/web
pnpm remove @apollo/client apollo3-cache-persist graphql-tag
```

This removes:
- `@apollo/client` - Apollo Client library
- `apollo3-cache-persist` - Persistence (replaced by TanStack Query)
- `graphql-tag` - GraphQL query parsing (if not needed)

### Step 2: Verify package.json Updated (2 min)

Open `apps/web/package.json` and verify these packages are gone from `dependencies`.

### Step 3: Clean Install (2 min)

```bash
pnpm install
```

This updates pnpm-lock.yaml and removes unused dependencies.

### Step 4: Verify Build (1 min)

```bash
pnpm build
```

Should complete without errors.

---

## Files to Modify

1. `apps/web/package.json` - Dependencies removed
2. `pnpm-lock.yaml` - Lock file updated

---

## Verification Checklist

- [x] `@apollo/client` removed (ISSUE-011)
- [x] `apollo3-cache-persist` removed (ISSUE-011)
- [x] `graphql-tag` removed (not used)
- [x] `pnpm install` completes
- [x] Build succeeds (exit code 0)

---

## Evidence Requirements

### Screenshot: package.json diff
- File: `evidence/ISSUE-017/deployment/package-json-diff.png`
- Show: Apollo packages removed

---

## Success Criteria

- ✅ Apollo packages removed from package.json
- ✅ Lock file updated
- ✅ Build succeeds

---

## Next Issue

**ISSUE-018:** Fix Web Build Errors (15 minutes)

---

**Estimated Time:** 10 minutes
