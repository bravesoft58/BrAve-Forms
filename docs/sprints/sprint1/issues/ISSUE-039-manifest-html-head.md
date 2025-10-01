# ISSUE-039: Add Manifest to HTML Head

**Sprint:** Sprint 1 | **Phase:** Phase 5 - PWA & Offline | **Priority:** P1
**Time:** 10 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 16:45:00 EDT
**Dependencies:** ISSUE-038 ✅

---

## What You'll Do

Add PWA manifest and theme color meta tags to HTML head.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-038 complete (manifest.json created)

### Steps

1. Open `apps/web/app/layout.tsx`

2. Update metadata export:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BrAve Forms - Construction Compliance',
  description: 'EPA/OSHA construction compliance management with 30-day offline capability',
  manifest: '/manifest.json',
  themeColor: '#1976d2',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BrAve Forms',
  },
};
```

3. Save file

4. Build and verify:
```bash
pnpm --filter web build
```

---

## Files to Modify

**Edit:**
- `apps/web/app/layout.tsx`

---

## Verification Checklist

- [ ] Metadata includes manifest link
- [ ] Theme color set to match manifest
- [ ] Viewport configured for mobile
- [ ] Apple Web App meta tags added
- [ ] Build succeeds
- [ ] HTML includes manifest link tag

---

## Testing Steps

1. Build app: `pnpm --filter web build`
2. Start app: `pnpm --filter web start`
3. View page source: Check for `<link rel="manifest" href="/manifest.json">`
4. Check for theme-color meta tag

---

## Evidence Requirements

**Location:** `evidence/ISSUE-039/code/`

**Required Screenshots:**
1. `layout-metadata.png` - layout.tsx showing updated metadata
2. `html-head-manifest.png` - Browser view source showing manifest link

---

## Troubleshooting

**Problem:** TypeScript errors on Metadata
- Import type: `import type { Metadata } from 'next';`
- Check Next.js version supports Metadata API (14+)

**Problem:** Manifest not found in HTML
- Verify metadata export is at component level
- Check build output includes manifest
- Verify Next.js serves static files from public/

---

## Success Criteria

- Metadata configured correctly
- Manifest linked in HTML head
- Theme color meta tag present
- Apple Web App tags added
- Build succeeds
- Evidence collected

---

## Next Issue

**ISSUE-040:** Configure TanStack Query Persistence (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 10 minutes
