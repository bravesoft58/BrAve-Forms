# ISSUE-037: Create Service Worker Configuration

**Sprint:** Sprint 1 | **Phase:** Phase 5 - PWA & Offline | **Priority:** P1
**Time:** 25 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 16:35:00 EDT
**Dependencies:** ISSUE-036 ✅

---

## What You'll Do

Configure Next.js PWA plugin with caching strategies for offline support.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-036 complete (next-pwa installed)

### Steps

1. Open `apps/web/next.config.js`

2. Add PWA configuration:
```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable in dev
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 6 * 60 * 60, // 6 hours (matches Redis TTL)
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|png)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  // ... existing Next.js config
  reactStrictMode: true,
  swcMinify: true,
});
```

3. Save file

4. Test build:
```bash
pnpm --filter web build
```

---

## Files to Modify

**Edit:**
- `apps/web/next.config.js`

---

## Verification Checklist

- [ ] PWA plugin configured with withPWA wrapper
- [ ] Service worker destination set to 'public'
- [ ] Disabled in development mode
- [ ] Runtime caching strategies defined (fonts, API, images)
- [ ] Cache expiration configured
- [ ] Build succeeds
- [ ] Service worker files generated in public/

---

## Testing Steps

1. Build production: `pnpm --filter web build`
2. Check for service worker files:
```bash
ls apps/web/public/sw.js
ls apps/web/public/workbox-*.js
```
3. Verify no build errors

---

## Evidence Requirements

**Location:** `evidence/ISSUE-037/code/`

**Required Screenshots:**
1. `pwa-config.png` - next.config.js with PWA configuration
2. `sw-files-generated.png` - public/ directory showing service worker files

---

## Troubleshooting

**Problem:** Build fails with PWA errors
- Check syntax of runtimeCaching array
- Verify withPWA wraps entire config
- Check package is installed correctly

**Problem:** Service worker not generated
- Check `dest: 'public'` is correct
- Verify build is production: `NODE_ENV=production pnpm --filter web build`
- Check `disable` is not set to true

**Problem:** Config syntax errors
- Verify JavaScript object syntax
- Check all commas and brackets
- Use linter: `pnpm --filter web lint`

---

## Success Criteria

- next.config.js configured with PWA
- Service worker generated in public/
- Caching strategies configured (NetworkFirst for API, CacheFirst for static)
- Build succeeds without errors
- Evidence collected

---

## Next Issue

**ISSUE-038:** Create PWA Manifest File (15 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 25 minutes
