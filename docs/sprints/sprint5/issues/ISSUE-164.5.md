# ISSUE-164.5: Forms Page UX Improvements (30min)

**Sprint:** Sprint 5 | **Phase:** 0 - Production-Ready Fixes | **Priority:** P1
**Time:** 30 minutes | **Complexity:** Low
**Created:** 2025-11-27
**Dependencies:** ISSUE-164 complete
**Status:** COMPLETE
**Completed:** 2025-11-27

## What Was Done

Two UX improvements discovered during Playwright testing of the dashboard:

### 1. Added "Create Template" Button to Forms Page

The Forms page displayed 21 templates but had no way to navigate to the Form Builder. This was an oversight - users expecting to create custom templates had no clear path.

**Fix:** Added a "Create Template" button in the Forms page header that links to `/dashboard/forms/builder`.

**File Modified:** `apps/web/app/dashboard/forms/page.tsx`

```typescript
actions={
  <Button
    component={Link}
    href="/dashboard/forms/builder"
    leftSection={<IconPlus size={16} />}
    size="sm"
  >
    Create Template
  </Button>
}
```

### 2. Removed Unused Demo Page

The `/demo` page had a MantineProvider error (pre-existing bug) and was not part of the authenticated app flow. It was a marketing/showcase page created during Sprint 2 that is no longer needed.

**Files Removed:**

- `apps/web/app/demo/page.tsx`
- `apps/web/app/demo/layout.tsx`

## Verification

- Forms page now shows "Create Template" button in header
- Button correctly navigates to Form Builder at `/dashboard/forms/builder`
- Demo page removed (no more MantineProvider errors)
- Lint and commit hooks passed

## Evidence

**Commit:** `d584709` - fix: add Create Template button to Forms page and remove demo page

## Time Estimate

**30 minutes total:**

- Add Create Template button: 15 min
- Remove demo page: 5 min
- Test and commit: 10 min

## Next Issue

**ISSUE-165:** Connect QR Inspector Portal to Backend
