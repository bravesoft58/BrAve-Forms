# ISSUE-036: Install PWA Dependencies

**Sprint:** Sprint 1 | **Phase:** Phase 5 - PWA & Offline | **Priority:** P1
**Time:** 10 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 16:30:00 EDT
**Dependencies:** ISSUE-035 ✅

---

## What You'll Do

Add next-pwa package to enable service worker and offline capabilities.

---

## Step-by-Step Instructions

### Steps

1. Open terminal in repository root

2. Run installation:
```bash
pnpm --filter web add @ducanh2912/next-pwa
```

3. Wait for installation (1-2 minutes)

4. Verify package added:
```bash
grep "@ducanh2912/next-pwa" apps/web/package.json
```

5. Screenshot package.json showing new dependency

---

## Files to Modify

**Updated:**
- `apps/web/package.json` - Dependency added
- `pnpm-lock.yaml` - Lockfile updated

---

## Verification Checklist

- [ ] Package installed successfully
- [ ] package.json includes `@ducanh2912/next-pwa`
- [ ] No installation errors
- [ ] pnpm-lock.yaml updated

---

## Testing Steps

1. Check package installed:
```bash
ls node_modules/@ducanh2912/next-pwa
```

2. Verify version (should be latest):
```bash
grep "@ducanh2912/next-pwa" apps/web/package.json
```

---

## Evidence Requirements

**Location:** `evidence/ISSUE-036/deployment/`

**Required Screenshots:**
1. `pwa-package-installed.png` - package.json showing dependency

---

## Troubleshooting

**Problem:** Installation fails
- Clear cache: `pnpm store prune`
- Retry: `pnpm --filter web add @ducanh2912/next-pwa`

**Problem:** Wrong package version
- Check latest version: `npm view @ducanh2912/next-pwa version`
- Install specific version if needed: `pnpm --filter web add @ducanh2912/next-pwa@latest`

---

## Success Criteria

- Package installed successfully
- package.json updated
- No installation errors
- Evidence collected

---

## Next Issue

**ISSUE-037:** Create Service Worker Configuration (25 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 10 minutes
