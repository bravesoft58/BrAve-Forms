# BF-25: PDF Download for Completed Forms

**Type:** Feature
**Priority:** Medium
**Points:** 2
**Status:** COMPLETE
**Sprint:** 2 (added mid-sprint from user testing)

## Description
Add ability to download completed forms as PDFs from the form view pages.

## Implementation
- Created `PrintButton` client component using `window.print()` (browser Save as PDF)
- Added `@media print` CSS to `globals.css`:
  - Hides sidebar, header, and action buttons
  - Resets layout so form content fills the page
  - Forces light mode for clean PDF output
  - Prevents table rows from breaking across pages
- Added "Download PDF" button to all 5 form view pages

## Files Changed
- `src/components/print-button.tsx` (new)
- `src/app/globals.css` (print styles)
- `src/app/dashboard/projects/[id]/forms/*/[submissionId]/page.tsx` (all 5 form types)

## Acceptance Criteria
- [x] Download PDF button visible on all form view pages
- [x] PDF output contains only form content (no sidebar/header/buttons)
- [x] Tables and sections render cleanly in PDF
- [x] Works across all 5 form types
- [x] Build passes clean
