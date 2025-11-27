# ISSUE-123: Cross-Browser & Mobile Device Testing

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-122 (database review complete)
**Status:** COMPLETE (2025-11-27)

## What You'll Do

Manual testing on Chrome, Firefox, Safari, Edge (desktop), Mobile Chrome, Mobile Safari, actual iOS device (iPhone 12+), actual Android device (Pixel 6+), tablet (iPad), glove-friendly touch targets, and sunlight visibility verification.

## Prerequisites

- [ ] ISSUE-122 complete
- [ ] Access to desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Access to iOS device (iPhone 12+)
- [ ] Access to Android device (Pixel 6+)
- [ ] Access to tablet device (iPad)

## Step-by-Step Instructions

### Step 1: Desktop Browser Testing (45 min)

Test on: Chrome Latest, Firefox Latest, Safari Latest, Edge Latest

**Checklist (per browser):**

- [ ] Form filling works (all 15 field types)
- [ ] Photo upload works
- [ ] Signature capture works
- [ ] QR portal loads (inspector access)
- [ ] Form submission completes
- [ ] Offline mode indicator shows
- [ ] No console errors

### Step 2: Mobile Browser Testing (45 min)

Test on: Mobile Chrome (Android), Mobile Safari (iOS)

**Checklist (per browser):**

- [ ] Form fills with glove-friendly targets (48px minimum)
- [ ] Camera integration works (Capacitor)
- [ ] GPS EXIF extraction works
- [ ] Signature with finger works
- [ ] Offline mode works (30-day capability)
- [ ] High contrast visible in sunlight

### Step 3: Actual Device Testing (30 min)

**iPhone 12 Pro (iOS 17+):**

- [ ] Photo of form filling in sunlight
- [ ] Photo of signature capture
- [ ] Photo of offline mode indicator
- [ ] Video of form submission workflow (1min)

**Google Pixel 6 (Android 13+):**

- [ ] Photo of form filling in sunlight
- [ ] Photo of signature capture
- [ ] Photo of offline mode indicator
- [ ] Video of form submission workflow (1min)

**iPad Air (Inspector Tablet):**

- [ ] QR portal read-only access
- [ ] Photo gallery lightbox
- [ ] Submission list filtering

### Step 4: Document Results

Create: `docs/sprints/sprint4/CROSS_BROWSER_TESTING.md`
Create: `docs/sprints/sprint4/MOBILE_DEVICE_TESTING.md`

## Files Created

- docs/sprints/sprint4/CROSS_BROWSER_TESTING.md
- docs/sprints/sprint4/MOBILE_DEVICE_TESTING.md
- evidence/ISSUE-123/ (20+ photos/videos)

## Success Criteria

- [ ] 4 desktop browsers tested
- [ ] 2 mobile browsers tested
- [ ] 3 actual devices tested (iPhone, Android, iPad)
- [ ] Glove-friendly touch targets verified (48px)
- [ ] Sunlight visibility verified
- [ ] Evidence photos/videos collected

## Time Estimate: 2 hours

## Next Issue

**ISSUE-124:** Performance Optimization & Lighthouse Audit (2h)
