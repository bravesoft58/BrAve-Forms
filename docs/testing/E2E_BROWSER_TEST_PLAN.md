# Comprehensive E2E Browser Test Plan for BrAve Forms

**Version:** 1.0  
**Last Updated:** 2025-11-30  
**Status:** Active - Extensible for ongoing development

---

## Table of Contents

1. [Autonomous Execution Requirements](#1-autonomous-execution-requirements-critical)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Page Inventory Matrix](#3-page-inventory-matrix)
4. [Agent-Specific Test Perspectives](#4-agent-specific-test-perspectives)
5. [Complete User Flow Test Scenarios](#5-complete-user-flow-test-scenarios)
6. [Component-Level Test Matrices](#6-component-level-test-matrices)
7. [Visual Regression Baseline](#7-visual-regression-baseline)
8. [Extensibility Templates](#8-extensibility-templates)
9. [Final Report Template](#9-final-report-template)

---

## 1. Autonomous Execution Requirements (CRITICAL)

### Execution Principles

The testing agent MUST run autonomously without human intervention:

- **No stopping for confirmation** - proceed through all tests automatically
- **Error handling** - log errors, take screenshot, continue to next test
- **Self-recovery** - if a page fails to load, retry 3x then skip and document
- **Evidence collection** - auto-capture screenshots at each test step
- **Progress tracking** - maintain running log of pass/fail/skip status
- **Final report generation** - auto-generate summary document upon completion
- **Time limit handling** - set reasonable timeouts (30s per page, 5min per workflow)
- **State cleanup** - reset to known state between test scenarios

### Error Recovery Strategy

1. **Page Load Failures:**
   - Retry 3 times with 5-second delays
   - If still failing, capture screenshot, log error, mark as SKIPPED
   - Continue to next test

2. **Element Not Found:**
   - Wait up to 10 seconds for element to appear
   - Try multiple selectors (data-testid, aria-label, text content)
   - If not found, capture screenshot, log, mark as FAILED
   - Continue to next test

3. **Authentication Failures:**
   - Retry login up to 3 times
   - If persistent, log credentials issue, mark workflow as FAILED
   - Continue with next user account

4. **Network Errors:**
   - Wait 5 seconds, retry request
   - If offline, switch to offline mode tests
   - Log network status, continue

### Output Requirements

**Directory Structure:**

```
evidence/e2e-tests/{YYYY-MM-DD_HH-MM-SS}/
├── screenshots/
│   ├── {page-name}_{step-number}_{timestamp}.png
│   └── errors/
│       └── {error-name}_{timestamp}.png
├── test-log.md (running log)
├── FINAL-REPORT.md (summary)
└── metrics.json (test statistics)
```

**Running Log Format:**

```markdown
## Test Execution Log

**Started:** {timestamp}
**Agent Type:** {UAT|Usability|UX/UI}

### Test: {Test Name}

- **Status:** PASS|FAIL|SKIP
- **Duration:** {seconds}s
- **Screenshot:** screenshots/{filename}.png
- **Notes:** {any observations}
```

**Final Report Must Include:**

- Total tests executed
- Pass/Fail/Skip counts
- Duration breakdown
- Error summary with screenshots
- Recommendations for fixes
- Coverage percentage

---

## 2. Test Environment Setup

### Browser Configuration

- **Primary Browser:** Chrome (latest stable)
- **Viewport Sizes:**
  - Desktop: 1920x1080
  - Tablet: 768x1024
  - Mobile: 375x812 (iPhone X)
- **Headless Mode:** Optional (for CI/CD)
- **DevTools:** Open for network monitoring

### Authentication Setup

- **Provider:** Clerk (real authentication, not mocked)
- **Base URL:** `http://localhost:3000` (development) or configured production URL
- **Test User Accounts:**

| Role  | Email               | Username | Password       | Organization |
| ----- | ------------------- | -------- | -------------- | ------------ |
| Admin | `admin@example.com` | `admin1` | `adminexample` | Default Org  |
| User  | `user@example.com`  | `user1`  | `userexample`  | Default Org  |

**Note:** These accounts must exist in Clerk before testing begins.

### Backend Configuration

- **Mode:** Hybrid (real API + mocks where needed)
- **GraphQL Endpoint:** Configured via environment variables
- **Database:** Pre-seeded with test data OR tests create their own
- **Mock Services:** Weather API, external services

### Test Data Requirements

**Pre-seeded Data (if available):**

- At least 2 organizations (for multi-tenancy tests)
- 3-5 form templates (various categories)
- 2-3 projects per organization
- Some existing submissions

**Test Data Created During Execution:**

- New organizations
- New form templates
- New projects
- New submissions
- New photos

### Screenshot Configuration

- **Format:** PNG
- **Full Page:** Yes (capture entire scrollable area)
- **Quality:** High (for visual regression)
- **Naming Convention:** `{page-slug}_{step-number}_{timestamp}.png`

### Timeout Configuration

- **Page Load:** 30 seconds
- **Element Wait:** 10 seconds
- **API Request:** 15 seconds
- **Workflow Completion:** 5 minutes
- **Total Test Suite:** 2 hours (hard limit)

---

## 3. Page Inventory Matrix

### Route Status Legend

- ✅ **Active** - Fully implemented and testable
- 🚧 **Placeholder** - Page exists but minimal functionality
- 🔒 **Protected** - Requires authentication
- 🌐 **Public** - Accessible without auth

### Complete Page Inventory

| Route                                | Status         | Auth | UAT | Usability | UX/UI | Notes                        |
| ------------------------------------ | -------------- | ---- | --- | --------- | ----- | ---------------------------- |
| `/`                                  | ✅ Active      | 🌐   | [ ] | [ ]       | [ ]   | Redirects to /dashboard      |
| `/sign-in`                           | ✅ Active      | 🌐   | [ ] | [ ]       | [ ]   | Clerk SignIn component       |
| `/sign-up`                           | ✅ Active      | 🌐   | [ ] | [ ]       | [ ]   | Clerk SignUp component       |
| `/dashboard`                         | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Main dashboard with widgets  |
| `/dashboard/projects`                | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Projects list with filters   |
| `/dashboard/projects/[id]`           | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Project detail with tabs     |
| `/dashboard/forms`                   | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Template selector            |
| `/dashboard/forms/[templateId]/fill` | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Form fill page               |
| `/dashboard/settings`                | 🚧 Placeholder | 🔒   | [ ] | [ ]       | [ ]   | Settings page (Sprint 4)     |
| `/dashboard/weather`                 | 🚧 Placeholder | 🔒   | [ ] | [ ]       | [ ]   | Weather dashboard (Sprint 4) |
| `/dashboard/photos/upload`           | 🚧 Placeholder | 🔒   | [ ] | [ ]       | [ ]   | Photo upload (Sprint 5)      |
| `/dashboard/inspections/new`         | 🚧 Placeholder | 🔒   | [ ] | [ ]       | [ ]   | New inspection (Sprint 3)    |
| `/submissions`                       | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Submissions list             |
| `/submissions/[id]`                  | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Submission detail            |
| `/sync/status`                       | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Sync status dashboard        |
| `/sync/queue`                        | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Sync queue management        |
| `/sync/conflicts`                    | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Conflict resolution          |
| `/inspector/[token]`                 | ✅ Active      | 🌐   | [ ] | [ ]       | [ ]   | Public QR portal             |
| `/forms/builder`                     | ✅ Active      | 🔒   | [ ] | [ ]       | [ ]   | Form builder tool            |

**Total Routes:** 19  
**Active:** 15  
**Placeholder:** 4

---

## 4. Agent-Specific Test Perspectives

### 4.1 UAT Agent Test Criteria

**Focus:** Functional correctness, data integrity, business logic validation

**Test Categories:**

1. **Element Interactions**
   - All buttons clickable and trigger expected actions
   - All inputs accept and validate data correctly
   - All dropdowns display options and allow selection
   - All links navigate to correct pages
   - All forms submit with correct data

2. **Data Validation**
   - Form submissions save correctly
   - API responses match expected structure
   - Data persists after page refresh
   - Multi-step workflows maintain state
   - Draft saves work correctly

3. **Error Handling**
   - Invalid inputs show error messages
   - Network errors handled gracefully
   - 404 pages display correctly
   - API errors show user-friendly messages
   - Offline mode queues operations

4. **Business Logic**
   - EPA compliance rules enforced (0.25" rain threshold)
   - Multi-tenant data isolation verified
   - Role-based permissions enforced
   - Workflow state transitions correct
   - Calculations accurate (computed fields)

5. **Integration Points**
   - Clerk authentication works
   - GraphQL queries return correct data
   - File uploads complete successfully
   - GPS coordinates captured correctly
   - Photo metadata preserved

### 4.2 Usability Agent Test Criteria

**Focus:** Workflow efficiency, accessibility, construction-site optimization

**Test Categories:**

1. **Touch Target Sizing**
   - All interactive elements ≥48px height/width
   - Buttons have adequate padding
   - Links have sufficient click area
   - Form inputs are easily tappable
   - Mobile navigation items properly sized

2. **Workflow Efficiency**
   - Common tasks complete in <3 steps
   - Navigation paths are logical
   - No unnecessary clicks required
   - Keyboard shortcuts work (Ctrl+S, Ctrl+Enter)
   - Auto-save reduces data loss risk

3. **Accessibility**
   - ARIA labels present on all interactive elements
   - Keyboard navigation works (Tab, Enter, Escape)
   - Screen reader compatibility
   - Focus indicators visible
   - Color contrast meets WCAG AA (4.5:1)

4. **Construction Site Optimization**
   - Sunlight readability (high contrast)
   - Glove-friendly touch targets
   - Large, clear fonts (13px minimum)
   - Minimal scrolling required
   - Offline-first design reduces frustration

5. **Error Prevention**
   - Clear validation messages
   - Confirmation dialogs for destructive actions
   - Undo/redo capabilities where appropriate
   - Draft auto-save prevents data loss
   - Clear error recovery paths

### 4.3 UX/UI Agent Test Criteria

**Focus:** Visual design, aesthetics, responsive behavior, animations

**Test Categories:**

1. **Visual Consistency**
   - Color palette consistent (blue/orange construction theme)
   - Typography hierarchy clear (14px body, 16px headings)
   - Spacing consistent (Mantine spacing scale)
   - Button styles match across pages
   - Icon usage consistent

2. **Layout and Alignment**
   - Elements properly aligned
   - Grid layouts responsive
   - No horizontal scrolling on mobile
   - Content doesn't overflow containers
   - Whitespace used effectively

3. **Responsive Design**
   - Desktop layout (≥1024px) displays correctly
   - Tablet layout (768-1023px) adapts properly
   - Mobile layout (<768px) stacks appropriately
   - Navigation adapts (sidebar → bottom nav)
   - Touch targets adjust for viewport

4. **Animations and Transitions**
   - Page transitions smooth (<300ms)
   - Loading states show progress
   - Hover effects provide feedback
   - Button press animations
   - No janky animations

5. **Loading States**
   - Skeleton loaders for content
   - Progress indicators for long operations
   - Loading spinners appropriately sized
   - Error states visually distinct
   - Empty states helpful and clear

6. **Visual Polish**
   - No layout shifts during load
   - Images load with proper aspect ratios
   - Shadows and borders consistent
   - Icons properly sized (18px standard)
   - Brand colors used appropriately

---

## 5. Complete User Flow Test Scenarios

### 5.1 Authentication Workflows

#### Test: Login with Admin Credentials

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to `/sign-in`
2. Verify page loads correctly
3. Enter email: `admin@example.com`
4. Enter password: `adminexample`
5. Click "Sign In" button
6. Verify redirect to `/dashboard`
7. Verify user menu shows admin email
8. Capture screenshot

**Expected Results:**

- Login successful
- Dashboard displays correctly
- User authenticated as admin

**Usability Checks:**

- Form fields are easily accessible
- Error messages clear if login fails
- Loading state visible during authentication

#### Test: Login with User Credentials

**Agent:** UAT  
**Steps:**

1. Navigate to `/sign-in`
2. Enter email: `user@example.com`
3. Enter password: `userexample`
4. Click "Sign In"
5. Verify redirect to `/dashboard`
6. Verify user menu shows user email

**Expected Results:**

- Login successful
- User has appropriate permissions

#### Test: Login Failure Scenarios

**Agent:** UAT, Usability  
**Scenarios:**

1. Wrong password
2. Non-existent email
3. Empty fields
4. Invalid email format

**Expected Results:**

- Clear error messages displayed
- Form doesn't submit
- User can retry without page reload

#### Test: Logout and Session Termination

**Agent:** UAT  
**Steps:**

1. Login as admin
2. Click user menu in header
3. Click "Sign Out"
4. Verify redirect to `/sign-in`
5. Verify session terminated (cannot access protected routes)

**Expected Results:**

- Logout successful
- Session cleared
- Protected routes redirect to sign-in

#### Test: Session Persistence

**Agent:** UAT  
**Steps:**

1. Login as admin
2. Close browser tab
3. Reopen browser, navigate to app
4. Verify still logged in (if "Remember Me" was checked)

**Expected Results:**

- Session persists if configured
- Token refresh works correctly

#### Test: Sign-Up New Account Flow

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to `/sign-up`
2. Fill in registration form
3. Submit registration
4. Verify email verification prompt (if required)
5. Complete verification
6. Verify redirect to dashboard

**Expected Results:**

- Account created successfully
- User can login with new credentials

### 5.2 Organization and Multi-Tenancy Testing (CRITICAL)

#### Test: Create New Organization

**Agent:** UAT  
**Prerequisites:** Logged in as admin  
**Steps:**

1. Navigate to organization settings (or create org page)
2. Click "Create Organization" or "New Organization"
3. Enter organization name: "Test Org Alpha"
4. Enter organization slug: "test-org-alpha"
5. Submit form
6. Verify organization created
7. Verify user is admin of new org
8. Capture screenshot

**Expected Results:**

- Organization created successfully
- User assigned as admin
- Organization appears in org switcher

#### Test: Add User to Organization

**Agent:** UAT  
**Prerequisites:** Organization "Test Org Alpha" exists  
**Steps:**

1. Navigate to organization settings
2. Go to "Members" or "Team" tab
3. Click "Invite User" or "Add Member"
4. Enter email: `user@example.com`
5. Select role: "Member" or "Admin"
6. Send invitation
7. Verify invitation sent
8. Logout, login as user@example.com
9. Accept invitation (if required)
10. Verify user can access organization

**Expected Results:**

- User added to organization
- User can see organization in switcher
- User has appropriate permissions

#### Test: Switch Between Organizations

**Agent:** UAT, Usability  
**Prerequisites:** User belongs to multiple organizations  
**Steps:**

1. Login as user with multiple orgs
2. Verify org switcher visible
3. Click current organization name
4. Select different organization
5. Verify page reloads/updates
6. Verify data changes to new org's data
7. Verify URL updates (if org-specific)

**Expected Results:**

- Organization switch successful
- Data updates immediately
- No data leakage between orgs

#### Test: Data Isolation - Projects

**Agent:** UAT (CRITICAL)  
**Prerequisites:**

- Org A: "Test Org Alpha" with admin@example.com
- Org B: "Test Org Beta" with user@example.com
- Org A has created at least 1 project

**Steps:**

1. Login as admin@example.com (Org A)
2. Navigate to `/dashboard/projects`
3. Note project names/IDs visible
4. Create new project: "Org A Project"
5. Logout
6. Login as user@example.com (Org B)
7. Navigate to `/dashboard/projects`
8. Verify "Org A Project" is NOT visible
9. Verify only Org B projects visible
10. Capture screenshots of both org views

**Expected Results:**

- Org B cannot see Org A projects
- Only own organization's projects visible
- API responses filtered by orgId

#### Test: Data Isolation - Form Templates

**Agent:** UAT (CRITICAL)  
**Steps:**

1. Login as admin@example.com (Org A)
2. Navigate to `/forms/builder`
3. Create template: "Org A Template"
4. Save and publish template
5. Navigate to `/dashboard/forms`
6. Verify "Org A Template" visible
7. Logout
8. Login as user@example.com (Org B)
9. Navigate to `/dashboard/forms`
10. Verify "Org A Template" is NOT visible
11. Verify only Org B templates visible

**Expected Results:**

- Templates isolated by organization
- No cross-org template visibility

#### Test: Data Isolation - Form Submissions

**Agent:** UAT (CRITICAL)  
**Steps:**

1. Login as admin@example.com (Org A)
2. Fill and submit a form
3. Navigate to `/submissions`
4. Note submission ID
5. Logout
6. Login as user@example.com (Org B)
7. Navigate to `/submissions`
8. Verify Org A submission NOT visible
9. Verify search doesn't return Org A submissions
10. Try to access Org A submission directly via URL: `/submissions/{org-a-submission-id}`
11. Verify 404 or access denied

**Expected Results:**

- Submissions isolated by organization
- Direct URL access blocked
- Search filtered by orgId

#### Test: Data Isolation - Photos

**Agent:** UAT (CRITICAL)  
**Steps:**

1. Login as admin@example.com (Org A)
2. Upload photo to Org A project
3. Navigate to project photos tab
4. Note photo visible
5. Logout
6. Login as user@example.com (Org B)
7. Navigate to Org B project photos
8. Verify Org A photo NOT visible
9. Try to access Org A photo URL directly
10. Verify access denied or 404

**Expected Results:**

- Photos isolated by organization
- Direct URL access blocked

#### Test: Data Isolation - Inspector QR Tokens

**Agent:** UAT (CRITICAL)  
**Steps:**

1. Login as admin@example.com (Org A)
2. Generate QR code for Org A project
3. Copy QR token/URL
4. Logout
5. Login as user@example.com (Org B)
6. Try to access Org A QR token URL: `/inspector/{org-a-token}`
7. Verify access denied or invalid token error
8. Verify Org B cannot see Org A project data

**Expected Results:**

- QR tokens scoped to organization
- Cross-org access blocked

#### Test: Organization Settings Management

**Agent:** UAT  
**Steps:**

1. Login as org admin
2. Navigate to organization settings
3. Edit organization name
4. Save changes
5. Verify changes persist
6. Verify all users see updated name

**Expected Results:**

- Settings save correctly
- Changes visible to all org members

#### Test: User Roles Within Organization

**Agent:** UAT  
**Steps:**

1. Login as org admin
2. Add user as "Member" (not admin)
3. Logout, login as member
4. Verify member cannot access admin-only features
5. Verify member can access member features
6. Logout, login as org admin
7. Change member role to "Admin"
8. Logout, login as member (now admin)
9. Verify admin features accessible

**Expected Results:**

- Role-based permissions enforced
- Role changes take effect immediately

#### Test: Remove User from Organization

**Agent:** UAT  
**Steps:**

1. Login as org admin
2. Navigate to organization members
3. Remove user from organization
4. Verify user removed from list
5. Logout, login as removed user
6. Verify organization no longer accessible
7. Verify user cannot see org data

**Expected Results:**

- User removed successfully
- Access revoked immediately

### 5.3 Profile and Settings Management

#### Test: View User Profile

**Agent:** UAT, UX/UI  
**Steps:**

1. Login as any user
2. Click user menu → "Profile"
3. Verify profile page loads
4. Verify user information displayed correctly
5. Verify edit button/link present

**Expected Results:**

- Profile displays correctly
- All user fields visible

#### Test: Edit User Profile

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to profile page
2. Click "Edit" button
3. Change first name
4. Change last name
5. Update phone number (if field exists)
6. Save changes
7. Verify changes persist
8. Verify changes reflected in header/user menu

**Expected Results:**

- Profile updates successfully
- Changes visible immediately

#### Test: Change Password

**Agent:** UAT  
**Steps:**

1. Navigate to settings or profile
2. Click "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Submit form
7. Logout
8. Login with new password
9. Verify login successful

**Expected Results:**

- Password changed successfully
- Old password no longer works
- New password works

#### Test: Organization/Team Settings

**Agent:** UAT  
**Steps:**

1. Navigate to organization settings
2. View team members list
3. Verify member roles displayed
4. Verify invite functionality works
5. Verify member management works

**Expected Results:**

- Settings page functional
- Team management works

#### Test: Notification Preferences

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to settings
2. Find notification preferences section
3. Toggle email notifications
4. Toggle push notifications (if available)
5. Save preferences
6. Verify preferences persist

**Expected Results:**

- Preferences save correctly
- Notifications respect preferences

#### Test: Role-Based Permission Differences

**Agent:** UAT  
**Steps:**

1. Login as admin
2. Note available features/menus
3. Logout
4. Login as regular user
5. Compare available features
6. Verify user cannot access admin-only features
7. Verify user can access user features

**Expected Results:**

- Permissions enforced correctly
- UI reflects role differences

### 5.4 Form Template Management (Form Builder)

#### Test: Create New Template from Scratch

**Agent:** UAT, Usability, UX/UI  
**Steps:**

1. Navigate to `/forms/builder`
2. Verify form builder loads
3. Enter template name: "Test Template"
4. Enter description: "Test description"
5. Select category: "CUSTOM"
6. Add first field: Text field
7. Configure field label: "Test Field"
8. Set field as required
9. Add second field: Number field
10. Add third field: Date field
11. Save template
12. Verify template saved
13. Navigate to `/dashboard/forms`
14. Verify new template appears in list

**Expected Results:**

- Template created successfully
- All fields configured correctly
- Template appears in template list

**Usability Checks:**

- Drag-and-drop works smoothly
- Field configuration panel intuitive
- Save button clearly visible

**UX/UI Checks:**

- Form builder layout clean
- Field palette easy to use
- Preview updates in real-time

#### Test: Edit Existing Template

**Agent:** UAT  
**Steps:**

1. Navigate to `/dashboard/forms`
2. Select existing template
3. Click "Edit" or navigate to builder with template ID
4. Modify template name
5. Add new field
6. Remove existing field
7. Save changes
8. Verify changes persist
9. Verify version number incremented (if versioning enabled)

**Expected Results:**

- Template edits save correctly
- Changes reflected in template list

#### Test: Add Fields to Existing Template

**Agent:** UAT, Usability  
**Steps:**

1. Open template in builder
2. Drag new field from palette
3. Drop into form canvas
4. Configure field properties
5. Save template
6. Verify field added

**Expected Results:**

- Field added successfully
- Field appears in form preview

#### Test: Remove Fields from Template

**Agent:** UAT  
**Steps:**

1. Open template in builder
2. Select field to remove
3. Click delete/remove button
4. Confirm deletion
5. Save template
6. Verify field removed

**Expected Results:**

- Field removed successfully
- Template saves without field

#### Test: Reorder Fields in Template

**Agent:** UAT, Usability  
**Steps:**

1. Open template with multiple fields
2. Drag field to new position
3. Drop field
4. Verify field order updated
5. Save template
6. Verify order persists

**Expected Results:**

- Field reordering works
- Order persists after save

#### Test: Set Field Validation Rules

**Agent:** UAT  
**Steps:**

1. Open template in builder
2. Select text field
3. Open field properties panel
4. Set minLength: 5
5. Set maxLength: 100
6. Set pattern: "^[A-Za-z]+$"
7. Set custom error message
8. Save template
9. Fill form with invalid data
10. Verify validation error shows

**Expected Results:**

- Validation rules save correctly
- Validation works when filling form

#### Test: Set Conditional Logic Between Fields

**Agent:** UAT  
**Steps:**

1. Create template with two fields:
   - Field A: Select field with options ["Yes", "No"]
   - Field B: Text field
2. Set Field B conditional: Show if Field A equals "Yes"
3. Save template
4. Fill form:
   - Select "No" for Field A
   - Verify Field B hidden
   - Select "Yes" for Field A
   - Verify Field B appears
5. Verify conditional logic works

**Expected Results:**

- Conditional logic configured correctly
- Fields show/hide based on conditions

#### Test: Save Template as Draft

**Agent:** UAT  
**Steps:**

1. Create new template
2. Add some fields
3. Click "Save Draft"
4. Verify draft saved
5. Navigate away
6. Return to builder
7. Verify draft loads

**Expected Results:**

- Draft saves successfully
- Draft can be resumed

#### Test: Publish Template

**Agent:** UAT  
**Steps:**

1. Open draft template
2. Complete all required fields
3. Click "Publish"
4. Verify template published
5. Navigate to `/dashboard/forms`
6. Verify template appears as published
7. Verify template can be used to fill forms

**Expected Results:**

- Template publishes successfully
- Published template available for use

#### Test: Clone/Duplicate Template

**Agent:** UAT  
**Steps:**

1. Navigate to template list
2. Find template to clone
3. Click "Clone" or "Duplicate"
4. Verify new template created with same fields
5. Modify cloned template name
6. Save cloned template
7. Verify original template unchanged

**Expected Results:**

- Template cloned successfully
- Clone is independent of original

#### Test: Archive/Delete Template

**Agent:** UAT  
**Steps:**

1. Navigate to template list
2. Select template
3. Click "Archive" or "Delete"
4. Confirm action
5. Verify template removed from active list
6. Verify archived templates in separate list (if applicable)

**Expected Results:**

- Template archived/deleted successfully
- Archived templates don't appear in active list

### 5.5 Form Filling Workflows

#### Test: Select Template and Start New Form

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to `/dashboard/forms`
2. Browse template list
3. Select template
4. Click template card or "Fill Form" button
5. Verify redirect to `/dashboard/forms/{templateId}/fill`
6. Verify form loads with all fields
7. Verify form title and description displayed

**Expected Results:**

- Form page loads correctly
- All template fields rendered

**Usability Checks:**

- Template selection intuitive
- Form loads quickly (<2 seconds)

#### Test: Fill All 15 Field Types

**Agent:** UAT (CRITICAL)  
**Field Types to Test:**

1. **Text Field**
   - Enter text: "Test text value"
   - Verify value saved

2. **Textarea Field**
   - Enter multi-line text
   - Verify line breaks preserved

3. **Number Field**
   - Enter number: 42
   - Enter invalid: "abc"
   - Verify validation error

4. **Date Field**
   - Select date from date picker
   - Verify date format correct (YYYY-MM-DD)

5. **Time Field**
   - Select time from time picker
   - Verify time format correct (HH:MM)

6. **Select Field (Dropdown)**
   - Click dropdown
   - Select option
   - Verify selection saved

7. **Radio Field**
   - Click radio option
   - Verify only one can be selected
   - Verify selection saved

8. **Checkbox Field**
   - Click checkbox
   - Verify checked state toggles
   - Verify value saved

9. **Checkboxes Field (Multiple)**
   - Select multiple options
   - Verify all selections saved

10. **Photo Field**
    - Click "Take Photo" or "Upload"
    - Select/upload image file
    - Verify photo preview appears
    - Verify photo saved

11. **Signature Field**
    - Click signature area
    - Draw signature (or use touch)
    - Verify signature saved
    - Verify signature displays on review

12. **GPS Field**
    - Click "Get Location"
    - Grant location permission
    - Verify coordinates captured
    - Verify accuracy displayed

13. **File Field**
    - Click "Choose File"
    - Select file
    - Verify file name displayed
    - Verify file uploaded

14. **Computed Field**
    - Fill fields that compute value
    - Verify computed value updates automatically
    - Verify computed value read-only

15. **Repeater Field**
    - Click "Add Item"
    - Fill repeater fields
    - Add multiple items
    - Remove item
    - Verify all items saved

**Expected Results:**

- All field types work correctly
- Values save properly
- Validation works

#### Test: Save Form as Draft Mid-Completion

**Agent:** UAT, Usability  
**Steps:**

1. Start filling form
2. Fill 50% of fields
3. Click "Save Draft" button
4. Verify draft saved message appears
5. Navigate away from form
6. Return to form
7. Verify draft loads with previous values
8. Continue filling form
9. Submit form

**Expected Results:**

- Draft saves successfully
- Draft can be resumed
- No data loss

**Usability Checks:**

- Save draft button easily accessible
- Draft status clearly indicated

#### Test: Resume Draft Form

**Agent:** UAT  
**Steps:**

1. Navigate to `/dashboard/forms`
2. Look for "Drafts" section or indicator
3. Click on draft form
4. Verify form loads with saved values
5. Continue filling form
6. Submit form

**Expected Results:**

- Draft loads correctly
- All values restored

#### Test: Submit Completed Form

**Agent:** UAT  
**Steps:**

1. Fill form completely
2. Fill all required fields
3. Verify no validation errors
4. Click "Submit" button
5. Verify loading state during submission
6. Verify success message or redirect
7. Navigate to `/submissions`
8. Verify submission appears in list

**Expected Results:**

- Form submits successfully
- Submission saved to database
- Submission appears in list

#### Test: Validation Error Handling

**Agent:** UAT, Usability  
**Steps:**

1. Start filling form
2. Leave required field empty
3. Click "Submit"
4. Verify validation error appears
5. Verify error message clear and helpful
6. Fill required field
7. Enter invalid format (e.g., text in number field)
8. Verify format validation error
9. Fix all errors
10. Submit successfully

**Expected Results:**

- Validation errors display correctly
- Error messages helpful
- Form doesn't submit with errors

**Usability Checks:**

- Errors visible and clear
- Easy to identify which fields have errors

#### Test: Auto-Save Functionality

**Agent:** UAT, Usability  
**Steps:**

1. Start filling form
2. Fill one field
3. Wait 30 seconds (auto-save interval)
4. Verify "Draft saved" indicator appears
5. Fill more fields
6. Wait for next auto-save
7. Navigate away
8. Return to form
9. Verify all values restored

**Expected Results:**

- Auto-save works every 30 seconds
- No data loss during auto-save
- Draft indicator shows last save time

**Usability Checks:**

- Auto-save doesn't interrupt user
- Save indicator unobtrusive

#### Test: Copy Yesterday's Log Feature

**Agent:** UAT  
**Steps:**

1. Navigate to `/submissions`
2. Verify "Copy Yesterday's Log" button visible
3. Click button
4. Verify new form opens with yesterday's data pre-filled
5. Modify some fields
6. Submit form
7. Verify new submission created

**Expected Results:**

- Yesterday's data copied correctly
- Can modify and submit

#### Test: Use Previous Submission as Template

**Agent:** UAT  
**Steps:**

1. Navigate to `/submissions`
2. Open existing submission
3. Click "Use as Template" button
4. Verify form opens with submission data pre-filled
5. Modify fields as needed
6. Submit new form
7. Verify new submission created

**Expected Results:**

- Previous submission data copied
- Can create new submission from template

### 5.6 Form Submission Management

#### Test: View Submissions List with Filters

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to `/submissions`
2. Verify submissions list displays
3. Test date filter:
   - Select start date
   - Select end date
   - Verify list filters
4. Test template filter:
   - Select template from dropdown
   - Verify list filters
5. Test status filter:
   - Select status (Draft, Submitted, Approved, Rejected)
   - Verify list filters
6. Test search:
   - Enter search term
   - Verify search results
7. Clear all filters
8. Verify full list restored

**Expected Results:**

- All filters work correctly
- Search works
- Clear filters resets view

**Usability Checks:**

- Filters easy to use
- Results update quickly

#### Test: View Submission Details

**Agent:** UAT, UX/UI  
**Steps:**

1. Navigate to `/submissions`
2. Click on submission row or "View" button
3. Verify submission detail page loads
4. Verify all form data displayed
5. Verify metadata displayed (submitted by, date, status)
6. Verify photos display correctly
7. Verify signatures display correctly

**Expected Results:**

- Detail page loads correctly
- All data visible
- Formatting correct

**UX/UI Checks:**

- Layout clean and readable
- Data organized logically

#### Test: Print Submission

**Agent:** UAT  
**Steps:**

1. Open submission detail page
2. Click "Print" button
3. Verify print preview opens
4. Verify all data included in print
5. Verify formatting suitable for printing

**Expected Results:**

- Print preview works
- All data printable

#### Test: Export Submission (if available)

**Agent:** UAT  
**Steps:**

1. Open submission detail page
2. Click "Export" or "Download PDF" button
3. Verify file downloads
4. Open downloaded file
5. Verify content correct

**Expected Results:**

- Export works correctly
- File format correct

#### Test: Approve/Reject Submissions (Admin)

**Agent:** UAT  
**Prerequisites:** Login as admin  
**Steps:**

1. Navigate to submissions list
2. Find submission with status "Submitted"
3. Click "Approve" or "Reject" button
4. If reject, enter rejection reason
5. Confirm action
6. Verify submission status updated
7. Verify status badge reflects change

**Expected Results:**

- Approval/rejection works
- Status updates correctly
- Rejection reason saved

### 5.7 Project Management

#### Test: Create New Project

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to `/dashboard/projects`
2. Click "New Project" button
3. Fill project form:
   - Name: "Test Project"
   - Address: "123 Test St, Test City, ST 12345"
   - Start date: Select date
   - Status: "ACTIVE"
4. Submit form
5. Verify project created
6. Verify redirect to project detail page
7. Verify project appears in projects list

**Expected Results:**

- Project created successfully
- All fields saved correctly

**Usability Checks:**

- Form easy to fill
- Validation clear

#### Test: Edit Project Details

**Agent:** UAT  
**Steps:**

1. Navigate to project detail page
2. Click "Edit Project" button
3. Modify project name
4. Modify address
5. Save changes
6. Verify changes persist
7. Verify changes reflected on detail page

**Expected Results:**

- Project edits save correctly
- Changes visible immediately

#### Test: Archive Project

**Agent:** UAT  
**Steps:**

1. Navigate to project detail page
2. Click "Archive" button
3. Confirm archiving
4. Verify project archived
5. Navigate to projects list
6. Filter by "Archived"
7. Verify archived project appears

**Expected Results:**

- Project archived successfully
- Archived project in correct list

#### Test: Project Tabs Navigation

**Agent:** UAT, Usability  
**Tabs to Test:**

1. **Forms Tab**
   - Click "Forms" tab
   - Verify template selector displays
   - Verify submitted forms list displays

2. **Photos Tab**
   - Click "Photos" tab
   - Verify photo gallery displays
   - Verify upload button present

3. **Team Tab**
   - Click "Team" tab
   - Verify team members list
   - Verify invite member functionality

4. **Weather Tab**
   - Click "Weather" tab
   - Verify weather data displays
   - Verify alerts visible

5. **Compliance Tab**
   - Click "Compliance" tab
   - Verify compliance status
   - Verify pending inspections

**Expected Results:**

- All tabs load correctly
- Content displays properly

**Usability Checks:**

- Tab switching smooth
- Active tab clearly indicated

#### Test: Team Member Management

**Agent:** UAT  
**Steps:**

1. Navigate to project → Team tab
2. Click "Add Team Member" or "Invite"
3. Enter user email
4. Select role
5. Send invitation
6. Verify member added to list
7. Remove team member
8. Verify member removed

**Expected Results:**

- Team management works
- Members added/removed correctly

#### Test: Generate QR Code for Inspectors

**Agent:** UAT  
**Steps:**

1. Navigate to project detail page
2. Click "Generate QR Code" or QR icon
3. Verify QR code modal/popup displays
4. Verify QR code image renders
5. Verify token/URL displayed
6. Copy QR code URL
7. Open URL in incognito/private window
8. Verify inspector portal loads
9. Verify read-only access

**Expected Results:**

- QR code generates correctly
- QR code links to inspector portal
- Portal loads with correct permissions

### 5.8 Photo Management

#### Test: Upload Photos to Project

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to project → Photos tab
2. Click "Upload Photos" button
3. Select multiple image files
4. Verify upload progress indicator
5. Wait for uploads to complete
6. Verify photos appear in gallery
7. Verify photo metadata captured (GPS, timestamp)

**Expected Results:**

- Photos upload successfully
- Photos appear in gallery
- Metadata preserved

**Usability Checks:**

- Upload progress visible
- Multiple file selection works
- Large files handled gracefully

#### Test: View Photo Gallery

**Agent:** UAT, UX/UI  
**Steps:**

1. Navigate to project photos
2. Verify gallery grid displays
3. Verify photos load correctly
4. Verify thumbnails display
5. Click on photo
6. Verify lightbox opens
7. Navigate between photos in lightbox
8. Close lightbox

**Expected Results:**

- Gallery displays correctly
- Lightbox works smoothly

**UX/UI Checks:**

- Grid layout clean
- Photos properly sized
- Lightbox transitions smooth

#### Test: Filter Photos by Date/Location/GPS Radius

**Agent:** UAT  
**Steps:**

1. Navigate to photos gallery
2. Open filters panel
3. Select date range
4. Verify photos filter
5. Enter GPS coordinates
6. Set radius (e.g., 100 meters)
7. Verify photos within radius display
8. Clear filters
9. Verify all photos restored

**Expected Results:**

- All filters work correctly
- Filtering accurate

#### Test: Add Annotations to Photos

**Agent:** UAT, Usability  
**Steps:**

1. Open photo in lightbox or detail view
2. Click "Add Annotation" or "Annotate"
3. Draw annotation on photo
4. Add text label
5. Save annotation
6. Verify annotation saved
7. Verify annotation displays on photo

**Expected Results:**

- Annotations save correctly
- Annotations display correctly

**Usability Checks:**

- Annotation tool easy to use
- Touch-friendly on mobile

#### Test: Before/After Photo Comparison

**Agent:** UAT, UX/UI  
**Steps:**

1. Navigate to photos
2. Select two photos
3. Click "Compare" or "Before/After"
4. Verify comparison view opens
5. Verify slider works to compare
6. Verify photos aligned properly

**Expected Results:**

- Comparison view works
- Slider functional

**UX/UI Checks:**

- Comparison view intuitive
- Slider smooth

#### Test: Photo Lightbox View

**Agent:** UAT, UX/UI  
**Steps:**

1. Click photo thumbnail
2. Verify lightbox opens
3. Verify full-size photo displays
4. Click next/previous arrows
5. Verify navigation works
6. Press Escape key
7. Verify lightbox closes
8. Click outside lightbox
9. Verify closes

**Expected Results:**

- Lightbox works correctly
- Navigation smooth
- Multiple close methods work

**UX/UI Checks:**

- Lightbox transitions smooth
- Full-screen display clear

#### Test: Map View of Geotagged Photos

**Agent:** UAT  
**Steps:**

1. Navigate to photos
2. Click "Map View" button
3. Verify map displays
4. Verify photo markers on map
5. Click marker
6. Verify photo popup displays
7. Click photo in popup
8. Verify lightbox opens

**Expected Results:**

- Map view works
- Markers accurate
- Photo popups functional

### 5.9 Sync and Offline Workflows

#### Test: View Sync Status Dashboard

**Agent:** UAT, UX/UI  
**Steps:**

1. Navigate to `/sync/status`
2. Verify dashboard loads
3. Verify current status displayed (synced/syncing/offline/error)
4. Verify last sync timestamp
5. Verify next auto-sync timestamp
6. Verify statistics displayed:
   - Forms synced today
   - Photos uploaded today
   - Pending items
   - Failed items
7. Verify storage usage displayed
8. Verify offline days remaining displayed

**Expected Results:**

- Dashboard displays all information
- Status accurate

**UX/UI Checks:**

- Dashboard layout clear
- Status indicators visually distinct

#### Test: Manual Sync Trigger

**Agent:** UAT, Usability  
**Steps:**

1. Navigate to sync status or dashboard
2. Click "Sync" button
3. Verify sync starts
4. Verify loading indicator appears
5. Wait for sync to complete
6. Verify success message
7. Verify status updates to "synced"
8. Verify queue cleared

**Expected Results:**

- Manual sync works
- Status updates correctly

**Usability Checks:**

- Sync button easily accessible
- Progress visible

#### Test: View Sync Queue

**Agent:** UAT  
**Steps:**

1. Navigate to `/sync/queue`
2. Verify queue table displays
3. Verify queued items listed
4. Verify item details visible:
   - Type (form, photo, etc.)
   - Status (pending, syncing, failed)
   - Priority
   - Size
   - Created timestamp
5. Verify statistics summary displayed

**Expected Results:**

- Queue displays correctly
- All items visible

#### Test: Retry Failed Sync Items

**Agent:** UAT  
**Steps:**

1. Navigate to sync queue
2. Find failed item
3. Click "Retry" button
4. Verify item retries
5. Verify status updates
6. Wait for completion
7. Verify success or failure

**Expected Results:**

- Retry works correctly
- Status updates

#### Test: Clear Sync Queue

**Agent:** UAT  
**Steps:**

1. Navigate to sync queue
2. Verify items in queue
3. Click "Clear All" button
4. Confirm action
5. Verify queue cleared
6. Verify statistics updated

**Expected Results:**

- Queue clears successfully
- Confirmation prevents accidental clearing

#### Test: Conflict Detection and Resolution

**Agent:** UAT, Usability  
**Steps:**

1. Make changes offline
2. Make conflicting changes online (different device/user)
3. Come back online
4. Trigger sync
5. Verify conflict detected
6. Navigate to `/sync/conflicts`
7. Verify conflict listed
8. Click "View & Resolve"
9. Verify comparison modal opens
10. Compare local vs server versions
11. Choose resolution strategy:
    - Keep Local
    - Keep Server
    - Merge (field-by-field)
12. Resolve conflict
13. Verify conflict resolved
14. Verify data correct

**Expected Results:**

- Conflicts detected correctly
- Resolution works
- Data integrity maintained

**Usability Checks:**

- Conflict comparison clear
- Resolution process intuitive

#### Test: Offline Form Submission (Queued)

**Agent:** UAT  
**Steps:**

1. Disconnect network (or use browser offline mode)
2. Navigate to form fill page
3. Fill form completely
4. Submit form
5. Verify submission queued message
6. Verify submission appears in sync queue
7. Reconnect network
8. Verify auto-sync triggers
9. Verify submission syncs
10. Verify submission appears in submissions list

**Expected Results:**

- Offline submission queued
- Syncs when online
- No data loss

#### Test: Auto-Sync on Reconnect

**Agent:** UAT  
**Steps:**

1. Work offline (create forms, upload photos)
2. Verify items queued
3. Reconnect network
4. Verify auto-sync starts automatically
5. Verify sync status updates
6. Verify queued items sync
7. Verify success notifications

**Expected Results:**

- Auto-sync works on reconnect
- All queued items sync
- User notified of completion

### 5.10 Inspector Portal (QR Access)

#### Test: QR Code Scan Access (Read-Only)

**Agent:** UAT  
**Steps:**

1. Generate QR code for project (as admin)
2. Copy QR code URL/token
3. Open URL in incognito/private window (simulating QR scan)
4. Verify inspector portal loads
5. Verify "VIEW ONLY" badge displayed
6. Verify project information displayed
7. Verify tabs available:
   - Form Submissions
   - Photos
   - Project Info
8. Verify no edit buttons present
9. Verify read-only access enforced

**Expected Results:**

- Portal loads correctly
- Read-only access enforced
- All viewable data accessible

#### Test: View Form Submissions as Inspector

**Agent:** UAT  
**Steps:**

1. Access inspector portal via QR
2. Click "Form Submissions" tab
3. Verify submissions list displays
4. Click on submission
5. Verify submission detail displays
6. Verify can view all data
7. Verify cannot edit
8. Verify print button works

**Expected Results:**

- Submissions viewable
- Read-only enforced

#### Test: View Photos as Inspector

**Agent:** UAT  
**Steps:**

1. Access inspector portal
2. Click "Photos" tab
3. Verify photo gallery displays
4. Click on photo
5. Verify lightbox opens
6. Verify can view all photos
7. Verify cannot upload/edit

**Expected Results:**

- Photos viewable
- Upload/edit disabled

#### Test: View Project Info as Inspector

**Agent:** UAT  
**Steps:**

1. Access inspector portal
2. Click "Project Info" tab
3. Verify project details display:
   - Name
   - Address
   - Status
   - Start date
   - Permit number
   - Disturbed area
4. Verify all information accurate

**Expected Results:**

- Project info displays correctly
- All fields visible

#### Test: Token Expiration Handling

**Agent:** UAT  
**Steps:**

1. Access inspector portal with valid token
2. Note expiration time (typically 24 hours)
3. Wait for token to expire (or use expired token)
4. Try to access portal
5. Verify expiration message displays
6. Verify cannot access data
7. Verify message instructs to request new QR code

**Expected Results:**

- Expired tokens rejected
- Clear error message
- Security maintained

#### Test: Offline Inspector Access

**Agent:** UAT  
**Steps:**

1. Access inspector portal (online)
2. Verify data loads
3. Disconnect network
4. Try to navigate portal
5. Verify cached data accessible (if implemented)
6. Verify offline indicator displays
7. Reconnect network
8. Verify data refreshes

**Expected Results:**

- Offline access works (if implemented)
- Cached data accessible
- Online data refreshes

### 5.11 Compliance Workflows

#### Test: View Compliance Overview

**Agent:** UAT  
**Steps:**

1. Navigate to project → Compliance tab
2. Verify compliance overview displays
3. Verify status indicators:
   - Overall compliance status
   - Pending inspections count
   - Weather alerts
   - Permit status
4. Verify compliance score/percentage (if available)

**Expected Results:**

- Overview displays correctly
- Status accurate

#### Test: Weather Alerts (0.25" Rain Threshold)

**Agent:** UAT (CRITICAL - EPA Compliance)  
**Steps:**

1. Navigate to compliance or weather dashboard
2. Verify weather monitoring active
3. Simulate or wait for rain event ≥0.25"
4. Verify alert triggers
5. Verify alert displays:
   - Rain amount
   - Time period
   - Inspection required notice
6. Verify inspection scheduled (if auto-scheduling)
7. Verify 24-hour inspection window indicated

**Expected Results:**

- Alert triggers at exactly 0.25"
- Alert clear and actionable
- Inspection window enforced

**Note:** This is critical for EPA CGP compliance. Must be exact threshold, not approximate.

#### Test: Pending Inspections List

**Agent:** UAT  
**Steps:**

1. Navigate to dashboard or compliance tab
2. Find "Pending Tasks" or "Pending Inspections" widget
3. Verify pending inspections listed
4. Verify inspection details:
   - Type (storm, scheduled, etc.)
   - Due date/time
   - Project
5. Click on inspection
6. Verify inspection form opens
7. Complete inspection
8. Verify inspection removed from pending list

**Expected Results:**

- Pending inspections display correctly
- Can access inspection forms
- List updates after completion

#### Test: EPA/OSHA Compliance Status

**Agent:** UAT  
**Steps:**

1. Navigate to compliance dashboard
2. Verify EPA compliance status:
   - SWPPP compliance
   - CGP compliance
   - Inspection frequency
3. Verify OSHA compliance status:
   - Safety compliance
   - Incident reports
4. Verify status indicators (pass/fail/warning)
5. Verify compliance history/charts

**Expected Results:**

- Compliance status accurate
- Status indicators clear
- History accessible

---

## 6. Component-Level Test Matrices

### 6.1 Navigation Components

#### AppNavbar (Desktop Sidebar)

**Location:** Left sidebar on desktop (≥1024px)

**UAT Tests:**

- [ ] All nav items clickable
- [ ] Active route highlighted
- [ ] Navigation works correctly
- [ ] Icons display correctly

**Usability Tests:**

- [ ] Nav items ≥40px height
- [ ] Hover effects provide feedback
- [ ] Active state clearly visible
- [ ] Keyboard navigation works (Tab, Enter)

**UX/UI Tests:**

- [ ] Icons 18px size
- [ ] Text 13px size
- [ ] Spacing consistent
- [ ] Hover animation smooth

#### MobileBottomNav (Mobile Bottom Navigation)

**Location:** Fixed bottom on mobile (<768px)

**UAT Tests:**

- [ ] All nav items clickable
- [ ] Active route highlighted
- [ ] Navigation works correctly

**Usability Tests:**

- [ ] Touch targets ≥48px height
- [ ] Safe area insets respected (notched devices)
- [ ] Active state clearly visible
- [ ] Icons and labels readable

**UX/UI Tests:**

- [ ] Fixed position doesn't overlap content
- [ ] Icons 20px size
- [ ] Text 11px size
- [ ] Border top visible

#### AppHeader (Top Header)

**Location:** Top of page, all viewports

**UAT Tests:**

- [ ] Logo clickable (navigates home)
- [ ] Search expands/collapses
- [ ] Sync indicator displays status
- [ ] User menu opens/closes
- [ ] Menu items navigate correctly
- [ ] Sign out works

**Usability Tests:**

- [ ] All buttons ≥48px touch targets
- [ ] Search accessible via keyboard
- [ ] User menu keyboard navigable
- [ ] Sync status tooltip informative

**UX/UI Tests:**

- [ ] Header height 64px
- [ ] Logo 24px size
- [ ] Icons 18px size
- [ ] Search expansion smooth
- [ ] Menu dropdown styled correctly

### 6.2 Form Field Components

#### TextField

**UAT Tests:**

- [ ] Accepts text input
- [ ] Validation works (minLength, maxLength, pattern)
- [ ] Required field validation
- [ ] Error messages display
- [ ] Value saves correctly

**Usability Tests:**

- [ ] Input height ≥44px
- [ ] Placeholder text helpful
- [ ] Error messages clear
- [ ] Keyboard accessible

**UX/UI Tests:**

- [ ] Input styling consistent
- [ ] Focus state visible
- [ ] Error state visually distinct

#### TextareaField

**UAT Tests:**

- [ ] Accepts multi-line text
- [ ] Line breaks preserved
- [ ] Character count (if implemented)
- [ ] Validation works

**Usability Tests:**

- [ ] Resizable (if enabled)
- [ ] Minimum height adequate
- [ ] Scrollable if content exceeds height

**UX/UI Tests:**

- [ ] Styling matches TextField
- [ ] Consistent with design system

#### NumberField

**UAT Tests:**

- [ ] Accepts numeric input only
- [ ] Min/max validation works
- [ ] Decimal numbers supported (if applicable)
- [ ] Invalid input rejected

**Usability Tests:**

- [ ] Numeric keyboard on mobile
- [ ] Clear error messages
- [ ] Increment/decrement buttons (if present)

**UX/UI Tests:**

- [ ] Input styling consistent
- [ ] Number formatting correct

#### DateField

**UAT Tests:**

- [ ] Date picker opens
- [ ] Date selection works
- [ ] Date format correct (YYYY-MM-DD)
- [ ] Validation works (min/max dates)
- [ ] Value saves correctly

**Usability Tests:**

- [ ] Date picker accessible
- [ ] Keyboard input works
- [ ] Mobile date picker native (if available)

**UX/UI Tests:**

- [ ] Date picker styled correctly
- [ ] Selected date clearly visible

#### TimeField

**UAT Tests:**

- [ ] Time picker opens
- [ ] Time selection works
- [ ] Time format correct (HH:MM)
- [ ] 12/24 hour format (if configurable)
- [ ] Value saves correctly

**Usability Tests:**

- [ ] Time picker accessible
- [ ] Mobile native time picker (if available)

**UX/UI Tests:**

- [ ] Time picker styled correctly

#### SelectField (Dropdown)

**UAT Tests:**

- [ ] Dropdown opens on click
- [ ] Options display correctly
- [ ] Selection works
- [ ] Selected value displays
- [ ] Search/filter works (if implemented)

**Usability Tests:**

- [ ] Dropdown easily clickable
- [ ] Options easily selectable
- [ ] Keyboard navigation works
- [ ] Mobile native select (if available)

**UX/UI Tests:**

- [ ] Dropdown styled correctly
- [ ] Options clearly visible
- [ ] Selected state distinct

#### RadioField

**UAT Tests:**

- [ ] Radio options display
- [ ] Only one selectable
- [ ] Selection works
- [ ] Required validation works

**Usability Tests:**

- [ ] Radio buttons ≥44px touch targets
- [ ] Labels clickable
- [ ] Keyboard navigation works

**UX/UI Tests:**

- [ ] Radio buttons styled correctly
- [ ] Selected state clear

#### CheckboxField

**UAT Tests:**

- [ ] Checkbox toggles
- [ ] Checked state saves
- [ ] Required validation works (must be checked)

**Usability Tests:**

- [ ] Checkbox ≥44px touch target
- [ ] Label clickable
- [ ] Keyboard accessible (Space to toggle)

**UX/UI Tests:**

- [ ] Checkbox styled correctly
- [ ] Checked state visually distinct

#### CheckboxesField (Multiple)

**UAT Tests:**

- [ ] Multiple selections possible
- [ ] All selections save
- [ ] Required validation works (at least one)

**Usability Tests:**

- [ ] Each checkbox ≥44px
- [ ] Labels clickable
- [ ] Keyboard navigation works

**UX/UI Tests:**

- [ ] Checkboxes styled consistently
- [ ] Layout clear

#### PhotoField

**UAT Tests:**

- [ ] File input accepts images
- [ ] Image preview displays
- [ ] Multiple images supported (if applicable)
- [ ] Image uploads successfully
- [ ] GPS metadata captured (if enabled)
- [ ] Image saves to form data

**Usability Tests:**

- [ ] Upload button easily clickable
- [ ] File selection intuitive
- [ ] Progress indicator visible
- [ ] Preview clear

**UX/UI Tests:**

- [ ] Preview thumbnail sized correctly
- [ ] Upload area visually clear

#### SignatureField

**UAT Tests:**

- [ ] Signature canvas displays
- [ ] Drawing works (mouse/touch)
- [ ] Signature saves as image
- [ ] Clear button works
- [ ] Signature displays on review

**Usability Tests:**

- [ ] Canvas easily accessible
- [ ] Touch-friendly on mobile
- [ ] Clear button easily accessible

**UX/UI Tests:**

- [ ] Canvas sized appropriately
- [ ] Signature preview clear

#### GpsField

**UAT Tests:**

- [ ] "Get Location" button works
- [ ] Location permission requested
- [ ] Coordinates captured
- [ ] Accuracy displayed
- [ ] Timestamp captured
- [ ] Coordinates save correctly

**Usability Tests:**

- [ ] Button easily clickable
- [ ] Permission request clear
- [ ] Coordinates clearly displayed

**UX/UI Tests:**

- [ ] Location display formatted clearly
- [ ] Map preview (if available) displays correctly

#### RepeaterField

**UAT Tests:**

- [ ] "Add Item" button works
- [ ] New item fields display
- [ ] Multiple items can be added
- [ ] "Remove" button works
- [ ] All items save correctly
- [ ] Item order preserved

**Usability Tests:**

- [ ] Add/remove buttons easily accessible
- [ ] Item fields clearly grouped
- [ ] Keyboard navigation works

**UX/UI Tests:**

- [ ] Items visually separated
- [ ] Layout clear

#### FileField

**UAT Tests:**

- [ ] File input accepts files
- [ ] File name displays
- [ ] File uploads successfully
- [ ] File saves to form data

**Usability Tests:**

- [ ] File selection intuitive
- [ ] Progress indicator visible

**UX/UI Tests:**

- [ ] File display clear

#### ComputedField

**UAT Tests:**

- [ ] Computed value calculates correctly
- [ ] Updates when dependencies change
- [ ] Read-only enforced
- [ ] Value saves correctly

**Usability Tests:**

- [ ] Field clearly marked as computed
- [ ] Value updates visible

**UX/UI Tests:**

- [ ] Computed field visually distinct (read-only styling)

### 6.3 Dashboard Widgets

#### QuickActions Widget

**UAT Tests:**

- [ ] All action buttons clickable
- [ ] Navigation works correctly
- [ ] Sync button triggers sync
- [ ] Offline status displays correctly

**Usability Tests:**

- [ ] Buttons ≥48px touch targets
- [ ] Labels clear
- [ ] Icons helpful

**UX/UI Tests:**

- [ ] Layout clean
- [ ] Button styles consistent

#### WeatherAlertsWidget

**UAT Tests:**

- [ ] Alerts display correctly
- [ ] 0.25" threshold enforced
- [ ] Alert details accurate
- [ ] Click navigates to weather page

**Usability Tests:**

- [ ] Alerts clearly visible
- [ ] Actionable

**UX/UI Tests:**

- [ ] Alert styling attention-grabbing
- [ ] Color coding clear (red/yellow)

#### PendingTasksList

**UAT Tests:**

- [ ] Tasks list displays
- [ ] Task details correct
- [ ] Click navigates to task
- [ ] Tasks update after completion

**Usability Tests:**

- [ ] Tasks easily clickable
- [ ] Due dates clear

**UX/UI Tests:**

- [ ] List layout clean
- [ ] Priority indicators visible

#### RecentActivityList

**UAT Tests:**

- [ ] Activities list displays
- [ ] Activity details correct
- [ ] Click navigates to activity
- [ ] Limit respected (e.g., 5 items)

**Usability Tests:**

- [ ] Activities easily clickable
- [ ] Timestamps clear

**UX/UI Tests:**

- [ ] List layout clean
- [ ] Activity types distinguishable

### 6.4 Photo Gallery Components

#### PhotoGalleryGrid

**UAT Tests:**

- [ ] Photos display in grid
- [ ] Thumbnails load correctly
- [ ] Click opens lightbox
- [ ] Grid responsive

**Usability Tests:**

- [ ] Thumbnails easily clickable
- [ ] Grid scrollable

**UX/UI Tests:**

- [ ] Grid layout clean
- [ ] Thumbnails properly sized

#### PhotoLightbox

**UAT Tests:**

- [ ] Lightbox opens on photo click
- [ ] Full-size image displays
- [ ] Navigation works (next/previous)
- [ ] Close works (X button, Escape, click outside)

**Usability Tests:**

- [ ] Navigation buttons easily accessible
- [ ] Close button clear

**UX/UI Tests:**

- [ ] Lightbox transitions smooth
- [ ] Full-screen display clear

#### PhotoFilters

**UAT Tests:**

- [ ] Filters apply correctly
- [ ] Date filter works
- [ ] GPS radius filter works
- [ ] Clear filters works

**Usability Tests:**

- [ ] Filter controls intuitive
- [ ] Results update quickly

**UX/UI Tests:**

- [ ] Filter panel clearly visible
- [ ] Active filters indicated

### 6.5 Sync Status Indicators

#### SyncStatusBadge

**UAT Tests:**

- [ ] Status displays correctly (synced/syncing/offline/error)
- [ ] Status updates in real-time
- [ ] Click navigates to sync status page

**Usability Tests:**

- [ ] Status clearly visible
- [ ] Color coding intuitive

**UX/UI Tests:**

- [ ] Badge styled correctly
- [ ] Icons appropriate

### 6.6 QR Portal Components

#### SubmissionViewer

**UAT Tests:**

- [ ] Submissions list displays
- [ ] Submission details viewable
- [ ] Read-only enforced
- [ ] Print works

**Usability Tests:**

- [ ] Submissions easily clickable
- [ ] Details clearly displayed

**UX/UI Tests:**

- [ ] Layout clean
- [ ] Read-only styling clear

#### PhotoGalleryViewer

**UAT Tests:**

- [ ] Photos display
- [ ] Lightbox works
- [ ] Read-only enforced
- [ ] No upload/edit buttons

**Usability Tests:**

- [ ] Photos easily viewable
- [ ] Navigation intuitive

**UX/UI Tests:**

- [ ] Gallery layout clean

---

## 7. Visual Regression Baseline

### Screenshot Capture Points

**Per Page, Capture:**

1. Initial page load (before interactions)
2. After each major interaction
3. Error states
4. Loading states
5. Empty states
6. Success states

**Viewport Configurations:**

- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x812

**Pages Requiring Screenshots:**

- All 19 routes listed in Page Inventory
- Each component in isolation (if testable)
- Each workflow step

**Screenshot Naming:**
`{page-slug}_{viewport}_{step-number}_{timestamp}.png`

Example: `dashboard_desktop_01_2025-11-30_16-30-45.png`

---

## 8. Extensibility Templates

### Template: New Page Test

```markdown
### Page: /new-page-route

**Status:** [ ] Active [ ] Placeholder  
**Auth Required:** [ ] Yes [ ] No

#### UAT Agent Tests

- [ ] Page loads correctly
- [ ] All interactive elements work
- [ ] Data displays correctly
- [ ] Forms submit correctly
- [ ] Error handling works

#### Usability Agent Tests

- [ ] Touch targets ≥48px
- [ ] Navigation intuitive
- [ ] Accessibility compliant
- [ ] Keyboard navigation works

#### UX/UI Agent Tests

- [ ] Visual consistency maintained
- [ ] Responsive design works
- [ ] Loading states appropriate
- [ ] Animations smooth
```

### Template: New Component Test

```markdown
### Component: ComponentName

**Location:** Used on pages: [list]

#### UAT Agent Tests

- [ ] Component renders correctly
- [ ] Props work as expected
- [ ] Events fire correctly
- [ ] State management works

#### Usability Agent Tests

- [ ] Touch targets adequate
- [ ] Accessible
- [ ] Clear labeling

#### UX/UI Agent Tests

- [ ] Styling consistent
- [ ] Responsive
- [ ] Animations smooth
```

---

## 9. Final Report Template

```markdown
# E2E Browser Test Execution Report

**Execution Date:** {timestamp}  
**Agent Type:** {UAT|Usability|UX/UI|All}  
**Duration:** {total time}  
**Browser:** Chrome {version}

## Executive Summary

- **Total Tests:** {count}
- **Passed:** {count} ({percentage}%)
- **Failed:** {count} ({percentage}%)
- **Skipped:** {count} ({percentage}%)
- **Coverage:** {percentage}% of pages/components

## Test Results by Category

### Authentication

- Passed: {count}
- Failed: {count}
- Issues: [list]

### Multi-Tenancy

- Passed: {count}
- Failed: {count}
- Critical Issues: [list]

### Form Management

- Passed: {count}
- Failed: {count}
- Issues: [list]

[... continue for all categories]

## Critical Issues

1. **Issue Title**
   - Severity: Critical
   - Page: {page}
   - Description: {details}
   - Screenshot: {path}
   - Recommendation: {fix}

## Recommendations

1. {recommendation}
2. {recommendation}

## Evidence

- Screenshots: `evidence/e2e-tests/{timestamp}/screenshots/`
- Log: `evidence/e2e-tests/{timestamp}/test-log.md`
- Metrics: `evidence/e2e-tests/{timestamp}/metrics.json`
```

---

## Appendix A: Test Execution Order

### Recommended Execution Sequence

1. **Setup Phase**
   - Verify test environment
   - Login with test accounts
   - Verify test data exists

2. **Authentication Tests**
   - Login/logout
   - Session management

3. **Multi-Tenancy Tests** (CRITICAL - Run Early)
   - Create organizations
   - Data isolation verification

4. **Core Functionality**
   - Dashboard
   - Projects
   - Forms
   - Submissions

5. **Advanced Features**
   - Photo management
   - Sync/offline
   - Inspector portal

6. **Compliance Features**
   - Weather alerts
   - Inspections
   - Compliance status

7. **Cleanup Phase**
   - Remove test data (if needed)
   - Generate final report

---

## Appendix B: Known Limitations

### Placeholder Pages (Not Fully Testable)

- `/dashboard/settings` - Sprint 4
- `/dashboard/weather` - Sprint 4
- `/dashboard/photos/upload` - Sprint 5
- `/dashboard/inspections/new` - Sprint 3 Phase 5

### Features Not Yet Implemented

- Organization creation UI (may be admin-only)
- User invitation UI (may be admin-only)
- Advanced photo editing
- Form template versioning UI

### Test Data Dependencies

- Some tests require pre-seeded data
- Multi-tenancy tests require multiple organizations
- Weather tests may require simulated weather data

---

## Appendix C: Troubleshooting Guide

### Common Issues

**Issue:** Page fails to load

- **Solution:** Check network, verify backend running, retry 3x

**Issue:** Element not found

- **Solution:** Wait longer, try alternative selectors, check if element conditionally rendered

**Issue:** Authentication fails

- **Solution:** Verify credentials correct, check Clerk configuration, verify test accounts exist

**Issue:** Data isolation test fails

- **Solution:** Verify orgId filtering in API, check JWT claims, verify Prisma middleware active

---

## Document Maintenance

**Update Frequency:** After each sprint/feature release  
**Last Updated:** 2025-11-30  
**Next Review:** After Sprint 5 completion

**Change Log:**

- 2025-11-30: Initial comprehensive test plan created

---

**End of Document**
