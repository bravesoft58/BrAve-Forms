# Mobile Layout Bug - Navbar Covers Content

**Discovered:** 2025-11-27
**Severity:** HIGH (Blocker for mobile users)
**Status:** FIXED (2025-11-27)
**Affects:** Mobile viewport (390x844)

## Resolution Summary

**Root Cause:** AppShell.Navbar wrapper rendered on mobile even when collapsed, covering main content with `width: 100%`, `position: fixed`, `z-index: 101`.

**Fix Applied:**
1. Created `MobileBottomNav.tsx` - standalone bottom navigation component
2. Modified `AppLayout.tsx` - conditional navbar rendering (only on confirmed desktop)
3. Simplified `AppNavbar.tsx` - removed mobile branch (now desktop-only)
4. Fixed `useMediaQuery` SSR issue - treat `undefined` as mobile (mobile-first)

**Files Changed:**
- `apps/web/components/Layout/MobileBottomNav.tsx` (NEW)
- `apps/web/components/Layout/AppLayout.tsx` (MODIFIED)
- `apps/web/components/Layout/AppNavbar.tsx` (MODIFIED)

**Evidence:**
- `mobile-layout-fix-AFTER.png` - Forms page with all 21 templates visible
- `mobile-form-fill-working.png` - Form fill page rendering correctly
- Playwright MCP click test passed - no z-index blocking

---

## Description

On mobile viewports, the Mantine AppShell navbar is rendered FULL-WIDTH and FIXED, completely covering the main content area. Users see a blank screen because the sidebar navigation is on top of the form templates.

## Evidence

- `mobile-forms-view-v2.png` - Viewport screenshot shows blank content area
- `mobile-full-page-debug.png` - Full page screenshot shows content exists but hidden
- `mobile-after-scroll-to-main.png` - Still blank after scrolling

## Root Cause (CONFIRMED)

```
Navbar CSS on mobile:
- position: fixed
- z-index: 101
- width: 378px (97% of 390px viewport!)
- height: 772px (full viewport height)
- top: 72px, left: 0
- display: flex, visibility: visible
```

The AppShell navbar is configured to be visible and full-width on mobile, when it should be:
- Hidden by default on mobile
- Accessible via hamburger menu toggle
- Or collapsed to icons only

Playwright error confirms: `<nav class="mantine-AppShell-navbar"> intercepts pointer events`

## Reproduction Steps

1. Open http://localhost:3000/dashboard/forms
2. Set viewport to mobile (390x844)
3. Observe: header and bottom nav visible, main content area blank
4. Scroll down: forms eventually appear

## Expected Behavior

Form templates should be immediately visible below the "Forms" heading without scrolling.

## Suggested Fix

Check the following in mobile CSS:
1. AppShell padding/margin on mobile breakpoint
2. Navigation component height calculations
3. Main content area flex/grid properties

## Workaround

Users can scroll down to see content, but this is poor UX.

## Priority

Should be fixed before Q&D pilot deployment for optimal mobile experience.
