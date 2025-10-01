# ISSUE-021: Verify Web Build Succeeds

**Sprint:** Sprint 1 | **Phase:** Phase 3 - Apollo Removal | **Priority:** P0
**Time:** 10 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 15:25:00 EDT
**Dependencies:** ISSUE-020 ✅

---

## What You'll Do

Confirm all Apollo removed and web builds successfully without errors.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-020 complete (All Apollo migrations finished)

### Steps

1. Run: `pnpm --filter web build`

2. Wait for build to complete (2-3 minutes)

3. Verify output shows: "Build completed successfully"

4. Check for Apollo import errors (should be NONE):
```bash
# Search for remaining Apollo imports
grep -r "@apollo/client" apps/web/
```

5. Verify build artifacts created:
```bash
ls apps/web/.next/
```

6. Screenshot successful build output

---

## Files to Verify

**Check these directories:**
- `apps/web/.next/` - Build artifacts should exist
- `apps/web/components/` - No Apollo imports
- `apps/web/lib/api/` - TanStack Query helpers present

---

## Verification Checklist

- [ ] Build completes without errors
- [ ] No Apollo references in build output
- [ ] Build artifacts created in `.next/` directory
- [ ] No remaining `@apollo/client` imports in codebase
- [ ] Build time reasonable (2-3 minutes)

---

## Testing Steps

1. Clean build (remove old artifacts):
```bash
rm -rf apps/web/.next
pnpm --filter web build
```

2. Check for Apollo packages:
```bash
grep "@apollo/client" apps/web/package.json
```

3. Verify TanStack Query is installed:
```bash
grep "@tanstack/react-query" apps/web/package.json
```

---

## Evidence Requirements

**Location:** `evidence/ISSUE-021/deployment/`

**Required Screenshots:**
1. `web-build-success.png` - Terminal showing successful build
2. `no-apollo-grep.png` - Output of grep showing no Apollo imports
3. `next-artifacts.png` - `.next/` directory structure

---

## Troubleshooting

**Problem:** Build fails with Apollo errors
- Search for remaining Apollo imports: `grep -r "@apollo/client" apps/web/`
- Check `package.json` dependencies
- Remove Apollo from dependencies if still present

**Problem:** Type errors during build
- Run: `pnpm --filter web type-check` to see specific errors
- Check TanStack Query types are installed
- Verify all components use correct query hooks

**Problem:** Build succeeds but very slow
- Check for circular imports
- Verify no duplicate dependencies
- Consider build cache: `pnpm --filter web build --no-cache`

**Problem:** Module not found errors
- Check imports use correct paths (`@/lib/api/...`)
- Verify all API helper files created
- Check `tsconfig.json` paths configuration

---

## Success Criteria

- Build completes successfully without errors
- No Apollo imports remain in codebase
- Build artifacts created in `.next/` directory
- Build time within expected range (2-3 minutes)
- All evidence collected

---

## Next Issue

**ISSUE-022:** Research NOAA API Documentation (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 10 minutes
