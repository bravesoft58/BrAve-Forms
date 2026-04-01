# BF-27: UAT Bug Fixes Round 2 — Password Reset, PDF, Inspector Portal

**Type:** Bug Fix
**Priority:** High
**Points:** 8
**Status:** NOT STARTED
**Sprint:** 2 (added from Andy's UAT feedback 2026-03-26)
**Reported by:** Andy Breen (IT Director, Q&D Group Invesco)

## Source

Andy's email: `Feedback/archive/RE_ BrAve update.msg` (2026-03-26 09:42 EDT)
Screenshots: `Feedback/archive/image001.png` (inspector portal), `Feedback/archive/image002.png` (password reset error)

## Issues Found

### 1. Password Reset — "Auth session missing"
**Symptom:** After clicking the reset link in email and entering new + confirmed passwords, the page shows: `Failed to update password: Auth session missing!`
**Screenshot:** `Feedback/archive/image002.png`
**Likely Cause:** The auth confirm callback (`/auth/confirm`) isn't properly exchanging the recovery token for a session before redirecting to `/reset-password`. The `updateUser()` call requires an active auth session, which the recovery flow should establish automatically via Supabase's `type=recovery` token exchange.
**Acceptance Criteria:**
- [ ] User clicks password reset link in email
- [ ] Lands on `/reset-password` with active auth session
- [ ] Can enter new password and confirm
- [ ] Password updates successfully, user redirected to login or dashboard

### 2. PDF Download — View + Download Buttons
**Symptom:** Clicking "Download PDF" opens the browser Print dialog instead of downloading a file.
**Root Cause:** BF-25 implemented PDF via `window.print()` + `@media print` CSS. No actual PDF generation exists.
**Fix:** Replace single button with two actions:
- **"View"** button — opens form in a clean, readable view (print-friendly layout)
- **"Download PDF"** button — generates and downloads an actual PDF file

**PDF Quality Requirements (non-negotiable):**
- PDFs must match the actual Nevada compliance form layouts — headers, field positions, sections, tables
- Reference the original form PDFs in `Dev Notes/` for exact layout and field placement
- Proper form titles, company/project info headers, signatures block
- Control measure tables, discharge point tables, etc. must render as proper tables (not text dumps)
- Photos should be embedded where applicable
- Must be professional enough to hand to an EPA/OSHA inspector

**Implementation Approach:** Research needed — evaluate `@react-pdf/renderer` (programmatic layout control) vs server-side generation. The forms have complex table layouts so the library choice matters.

**Acceptance Criteria:**
- [ ] "View" button opens a readable form view
- [ ] "Download PDF" button triggers a real file download (not a print dialog)
- [ ] Downloaded PDF faithfully reproduces the Nevada compliance form layout
- [ ] All form data populated correctly — no blank sections for data that exists
- [ ] Tables (control measures, discharge points, etc.) render as proper formatted tables
- [ ] Photos embedded in PDF where the form includes them
- [ ] Works for all 5 form types
- [ ] PDF filename is descriptive (e.g., `NDEP-Stormwater-QDParkingLot-2026-03-19.pdf`)

### 3. Inspector Portal — Form Data Blank
**Symptom:** Inspector QR portal expanded form view shows only General Information (inspector name, date, type). All other sections (weather, discharge points, control measures) show dashes/empty.
**Screenshot:** `Feedback/archive/image001.png` — NDEP Weekly Stormwater log for March 19, Q&D Parking Lot project
**Likely Cause:** The BF-26 `FormDetail` component renderers may only be reading top-level metadata fields and not the nested form data from the `data` JSONB column. Or the inspector query isn't fetching the full `data` column.
**Acceptance Criteria:**
- [ ] Inspector portal shows ALL form data when expanded (weather, discharge points, control measures, etc.)
- [ ] Verified against actual submitted data in the database
- [ ] Works for all 5 form types

## Working (Confirmed by Andy)
- Role toggle (change user role) — fixed in BF-24
- Resend invite — fixed in BF-24
- Form download — working (print dialog issue is UX, not broken)
