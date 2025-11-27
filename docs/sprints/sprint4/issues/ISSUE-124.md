# ISSUE-124: Performance Optimization & Lighthouse Audit

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-123 (browser testing complete)
**Status:** COMPLETE (2025-11-27)

## What You'll Do

Run Lighthouse audit on all pages, optimize form load time (<2 seconds), optimize QR portal load (<1 second), optimize photo upload (<5 seconds), optimize bundle size (code splitting, lazy loading), and optimize images (WebP format).

## Prerequisites

- [ ] ISSUE-123 complete
- [ ] Chrome DevTools installed
- [ ] All pages functional

## Step-by-Step Instructions

### Step 1: Run Lighthouse Audits (45 min)

**Pages to Audit:**

- / (home page)
- /forms (forms list)
- /forms/template/01-general-daily-log/fill (form filling)
- /inspector/[token] (QR portal)
- /projects/[id] (project page)

**Target Scores:**

- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

### Step 2: Optimize Performance (1h)

**next.config.js optimizations:**

```js
module.exports = {
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    };
    return config;
  },
};
```

### Step 3: Verify Metrics (15 min)

**Required Metrics:**

- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Total Blocking Time: <300ms
- Cumulative Layout Shift: <0.1

## Files Created

- docs/sprints/sprint4/LIGHTHOUSE_AUDIT.md
- apps/web/next.config.js (updated)
- evidence/ISSUE-124/ (5 Lighthouse reports)

## Success Criteria

- [ ] Lighthouse scores >90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Form load time <2s
- [ ] QR portal load <1s
- [ ] Photo upload <5s
- [ ] Evidence collected

## Time Estimate: 2 hours

## Next Issue

**ISSUE-125:** Security Audit & Penetration Testing (3h)
