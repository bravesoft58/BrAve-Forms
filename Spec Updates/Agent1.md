
I'll now analyze both documents to create a comprehensive UI requirements inventory for BrAve Forms.

## Complete UI Requirements Analysis for BrAve Forms Platform

Based on my analysis of the comprehensive PRD and UX design documents, here is the exhaustive UI inventory:

---

## SECTION 1: COMPLETE UI PAGE/COMPONENT INVENTORY

### Epic 1: Forms Management Engine (P0 - Core Product)

#### 1.1 Form Builder UI (Admin/Office Users)
**Pages:**
- `/forms/builder/new` - Create new form from scratch
- `/forms/builder/[id]` - Edit existing form
- `/forms/templates` - Template library browser
- `/forms/templates/[category]` - Filtered template view

**Components:**
- Drag-and-drop form canvas
- Field type selector (15+ types: text, number, date, photo, signature, GPS, etc.)
- Field properties panel
- Form preview (mobile + web)
- Conditional logic builder
- Calculated field formula editor
- Validation rules configuration
- Form publishing workflow
- Template clone/customize interface

**API Dependencies:**
- `createForm` mutation
- `updateForm` mutation
- `getFormTemplate` query
- `publishForm` mutation
- `cloneFormTemplate` mutation

#### 1.2 Form Template Library (All Users)
**Pages:**
- `/forms/templates/browse` - Browse all templates
- `/forms/templates/categories` - Category navigation
- `/forms/templates/[id]/preview` - Template preview

**Components:**
- Template grid/list view
- Category filter sidebar
- Search bar with autocomplete
- Template preview modal
- Template usage analytics
- "Use Template" action button
- "Customize Template" button
- Template rating/review system (Phase 3)

**50+ Templates Organized By:**
- Daily Logs (10 templates)
- Safety Inspection Forms (15 templates)
- Quality Control Forms (10 templates)
- Equipment Forms (8 templates)
- Environmental Compliance Forms (7 templates)

**API Dependencies:**
- `getFormTemplates` query (paginated)
- `searchFormTemplates` query
- `getTemplateCategories` query
- `cloneTemplate` mutation

#### 1.3 Mobile Form Filling (Field Users)
**Pages:**
- `/projects/[id]/forms` - Project form list
- `/forms/[formId]/fill` - Form filling interface
- `/forms/drafts` - Saved draft forms
- `/forms/submitted` - Submitted form history

**Components:**
- Form field renderer (dynamic based on 15+ field types)
- Progress indicator (% complete)
- Auto-save indicator (saves every 30 seconds)
- Photo capture integration
- Digital signature pad
- GPS location capture
- Voice-to-text input
- Form validation messages
- Submit confirmation dialog
- Draft save button

**API Dependencies:**
- `getForm` query (with offline caching)
- `createFormSubmission` mutation (queued if offline)
- `saveDraft` mutation
- `uploadPhoto` mutation
- `getGPSLocation` (device API)

### Epic 2: Photo Documentation (P0 - Core Product)

#### 2.1 Photo Capture UI
**Pages:**
- `/forms/[formId]/fill#photo-field` - In-form photo capture
- `/photos/capture` - Standalone photo capture
- `/photos/gallery` - Project photo gallery

**Components:**
- Camera interface (Capacitor camera plugin)
- Photo annotation tools (arrows, text, highlights)
- Before/after photo pairing
- Photo preview with metadata (GPS, timestamp, EXIF)
- Multi-photo upload queue
- Compression indicator
- Upload progress bar

**API Dependencies:**
- `capturePhoto` (Capacitor plugin)
- `uploadPhoto` mutation (with compression)
- `getPhotoMetadata` query
- `annotatePhoto` mutation

#### 2.2 Photo Organization
**Pages:**
- `/photos` - All photos dashboard
- `/photos/[projectId]` - Project photos
- `/photos/search` - Photo search interface
- `/photos/[photoId]` - Photo detail view

**Components:**
- Photo grid/masonry layout
- GPS map view (pins for photo locations)
- Date range filter
- Form type filter
- Search by tags/descriptions
- Batch selection/download
- Photo export options (PDF, ZIP)

**API Dependencies:**
- `getPhotos` query (paginated, filtered)
- `searchPhotos` query
- `getPhotosByGPS` query
- `exportPhotos` mutation

### Epic 3: Offline-First Mobile Architecture (P0 - Core Product)

#### 3.1 Sync Management UI
**Pages:**
- `/sync/status` - Sync status dashboard
- `/sync/queue` - Pending sync operations
- `/sync/conflicts` - Conflict resolution

**Components:**
- Offline banner (yellow, fixed top)
- Sync status indicator (green/yellow/red dot)
- Sync progress percentage
- Queued action list
- Retry failed sync button
- Conflict comparison modal (local vs server)
- Sync settings (WiFi-only, auto-sync)

**API Dependencies:**
- Background sync API (Service Worker)
- `syncQueue` query (local IndexedDB)
- `resolveConflict` mutation

### Epic 4: Form Workflow & Approvals (P1 - Advanced Forms)

#### 4.1 Approval Workflow UI
**Pages:**
- `/approvals/pending` - Pending approval queue
- `/approvals/[submissionId]` - Review submission
- `/approvals/history` - Approval history

**Components:**
- Approval routing configuration
- Approval chain visualization
- Review form with comments
- Approve/Reject buttons
- Comment thread
- Notification bell (pending approvals count)
- Email notification settings

**API Dependencies:**
- `getPendingApprovals` query
- `approveSubmission` mutation
- `rejectSubmission` mutation
- `addApprovalComment` mutation

#### 4.2 Form Versioning UI
**Pages:**
- `/forms/[id]/versions` - Version history
- `/forms/[id]/versions/[versionId]` - Specific version view
- `/forms/[id]/audit-trail` - Complete audit log

**Components:**
- Version timeline visualization
- Version comparison (diff view)
- Version restore button
- Audit trail table (who, what, when)
- Change log viewer

**API Dependencies:**
- `getFormVersions` query
- `getFormVersion` query
- `restoreFormVersion` mutation
- `getAuditTrail` query

### Epic 5: Compliance Automation (P1 - Bonus Feature)

#### 5.1 Weather Monitoring UI
**Pages:**
- `/weather/dashboard` - Weather overview (all projects)
- `/weather/[projectId]` - Project weather history
- `/weather/alerts` - Active weather alerts

**Components:**
- Weather alert card (0.25" rain trigger)
- Countdown timer (24 hours to inspection)
- Precipitation graph (7-day history)
- Weather station map
- Notification preferences
- Alert history log

**API Dependencies:**
- `getWeatherAlerts` query
- `getWeatherHistory` query (NOAA API)
- `dismissAlert` mutation

#### 5.2 QR Inspector Portal (P1 - Bonus Feature)
**Pages:**
- `/inspector/[qrCode]` - Inspector landing page (no auth)
- `/inspector/[qrCode]/forms` - Form submission list
- `/inspector/[qrCode]/photos` - Photo gallery
- `/inspector/[qrCode]/report` - Generate report

**Components:**
- QR code scanner
- Time-limited access banner
- Read-only form viewer
- Photo lightbox
- Report generation form
- Export to PDF button
- Violation documentation form

**API Dependencies:**
- `validateQRCode` query
- `getInspectorData` query (read-only)
- `generateInspectionReport` mutation

#### 5.3 Compliance Dashboard
**Pages:**
- `/compliance/dashboard` - Compliance status overview
- `/compliance/swppp` - SWPPP inspections
- `/compliance/osha` - OSHA safety forms
- `/compliance/reports` - Regulatory reports

**Components:**
- Compliance status cards (green/yellow/red)
- Inspection due dates calendar
- Violation tracker
- BMP maintenance log
- Regulatory report generator
- EPA/OSHA form templates

**API Dependencies:**
- `getComplianceStatus` query
- `getInspectionSchedule` query
- `generateComplianceReport` mutation

### Epic 6: Form Analytics & Reporting (P2 - Advanced Features)

#### 6.1 Analytics Dashboard
**Pages:**
- `/analytics/overview` - High-level metrics
- `/analytics/forms` - Form completion analytics
- `/analytics/users` - User activity analytics
- `/analytics/projects` - Project analytics

**Components:**
- Completion rate charts
- Average completion time graphs
- Overdue forms table
- User performance metrics
- Photo documentation volume
- Custom date range selector
- Export analytics button

**API Dependencies:**
- `getFormAnalytics` query
- `getUserAnalytics` query
- `getProjectAnalytics` query
- `exportAnalytics` mutation

#### 6.2 Custom Reports
**Pages:**
- `/reports/builder` - Drag-and-drop report builder
- `/reports/scheduled` - Scheduled reports
- `/reports/library` - Saved reports

**Components:**
- Report field selector
- Filter configuration
- Grouping/aggregation options
- Report preview
- Schedule configuration
- Export format selector (PDF, Excel, CSV)

**API Dependencies:**
- `createReport` mutation
- `scheduleReport` mutation
- `getReports` query
- `generateReport` mutation

### Epic 7: Issues & Actions Management (P2 - Competitive Parity)

#### 7.1 Issue Tracking UI
**Pages:**
- `/issues` - All issues dashboard
- `/issues/[id]` - Issue detail view
- `/issues/create` - Create new issue
- `/issues/[formSubmissionId]` - Issues from form

**Components:**
- Issue creation form (from inspection)
- Issue status kanban board (open, in progress, closed)
- Assignee dropdown
- Due date picker
- Priority selector
- Photo evidence upload
- Comment thread
- Resolution verification

**API Dependencies:**
- `createIssue` mutation
- `getIssues` query (filtered, paginated)
- `updateIssueStatus` mutation
- `assignIssue` mutation

---

## SECTION 2: PRIMARY NAVIGATION STRUCTURE

### Mobile Bottom Navigation (5 Tabs)
1. **Home** (`/dashboard`) - Dashboard with quick actions
2. **Projects** (`/projects`) - Active projects list
3. **New** (`/create`) - Quick create (form/photo/issue)
4. **Forms** (`/forms`) - Form submissions and templates
5. **More** (`/menu`) - Settings, profile, help

### Desktop Sidebar Navigation
```
├── Dashboard
├── Projects
│   ├── Active Projects
│   ├── Favorites
│   └── Archived
├── Forms
│   ├── Templates
│   ├── Drafts
│   ├── Submitted
│   └── Form Builder
├── Photos
│   ├── All Photos
│   ├── By Project
│   └── Search
├── Inspections
│   ├── Required Today
│   ├── Overdue
│   ├── Scheduled
│   └── History
├── Compliance (if applicable)
│   ├── Weather Alerts
│   ├── SWPPP
│   ├── OSHA
│   └── Reports
├── Issues (P2)
│   ├── My Issues
│   ├── Team Issues
│   └── Create Issue
├── Analytics (P2)
│   ├── Overview
│   ├── Forms Analytics
│   └── Custom Reports
└── Settings
    ├── Profile
    ├── Team Management
    ├── Notifications
    ├── Sync Status
    └── Help
```

---

## SECTION 3: SPRINT 3-4 COVERAGE ANALYSIS

### Currently Planned in Sprint 3-4:
✅ **FormRenderer Component** - Mobile form filling
✅ **Photo Capture Integration** - Camera + GPS
✅ **QR Inspector Portal** - Read-only access
✅ **Basic Form Submission** - Submit workflow

### MISSING from Sprint 3-4 (Critical Gaps):

#### Navigation Layer (Critical P0)
❌ Dashboard/Home page
❌ Projects list page
❌ Forms library page
❌ Bottom navigation bar (mobile)
❌ Sidebar navigation (desktop)
❌ Breadcrumb navigation
❌ User navigation (profile, logout)

#### Form Management UI (Critical P0)
❌ Form Builder (drag-and-drop interface)
❌ Template Library browser
❌ Drafts page
❌ Submitted forms page
❌ Form history/versioning

#### Photo Management UI (Critical P0)
❌ Photo gallery page
❌ Photo search/filter
❌ Photo annotation tools
❌ Before/after pairing UI

#### Offline Experience UI (Critical P0)
❌ Offline banner
❌ Sync status indicator
❌ Sync queue management
❌ Conflict resolution UI

#### Settings & Configuration (Critical P0)
❌ User settings page
❌ Project settings
❌ Notification preferences
❌ Team management

#### Admin/Office User UI (High Priority)
❌ Analytics dashboard
❌ Reports builder
❌ Approval workflow UI
❌ User management

---

## SECTION 4: RECOMMENDED SPRINT ALLOCATION

### Sprint 3: Core Navigation + Form Management (REVISED)
**Duration:** 2 weeks  
**Focus:** Get users INTO the app and TO the forms

**Pages:**
1. Dashboard/Home (`/dashboard`)
2. Projects List (`/projects`)
3. Project Detail (`/projects/[id]`)
4. Forms List (`/forms`)
5. Template Library Browser (`/forms/templates`)
6. Settings Page (`/settings`)

**Components:**
- Bottom navigation (mobile)
- Sidebar navigation (desktop)
- Project card component
- Form list item component
- Template grid/list view
- User navigation dropdown

**Estimated Effort:** 80 hours (40 hours/week × 2 weeks)

---

### Sprint 4: Form Filling + Photo Workflows (CURRENT PLAN - Enhanced)
**Duration:** 2 weeks  
**Focus:** Complete the form filling experience

**Pages:**
1. Form Filling Page (`/forms/[id]/fill`) - **Already planned**
2. Drafts Page (`/forms/drafts`)
3. Submitted Forms Page (`/forms/submitted`)
4. Photo Gallery (`/photos`)
5. QR Inspector Portal (`/inspector/[code]`) - **Already planned**

**Components:**
- FormRenderer (15+ field types) - **Already planned**
- Photo capture integration - **Already planned**
- Form progress indicator
- Auto-save indicator
- Photo annotation tools
- Photo gallery grid
- QR scanner

**Estimated Effort:** 80 hours

---

### Sprint 5: Offline Experience + Sync
**Duration:** 2 weeks  
**Focus:** Make everything work offline

**Pages:**
1. Sync Status Page (`/sync/status`)
2. Sync Queue Management (`/sync/queue`)
3. Conflict Resolution (`/sync/conflicts`)

**Components:**
- Offline banner (yellow, fixed top)
- Sync status indicator (green/yellow/red)
- Sync progress UI
- Queued action list
- Conflict comparison modal
- Retry failed sync button

**Estimated Effort:** 80 hours (complex offline logic)

---

### Sprint 6: Form Builder (Admin UI)
**Duration:** 2 weeks  
**Focus:** Enable custom form creation

**Pages:**
1. Form Builder (`/forms/builder/new`)
2. Edit Form (`/forms/builder/[id]`)
3. Form Preview (`/forms/builder/[id]/preview`)

**Components:**
- Drag-and-drop canvas
- Field type selector (15+ types)
- Field properties panel
- Conditional logic builder
- Validation rules UI
- Form preview (mobile + desktop)
- Publish workflow

**Estimated Effort:** 100 hours (most complex UI)

---

### Sprint 7: Approvals + Workflow
**Duration:** 2 weeks  
**Focus:** Multi-user collaboration

**Pages:**
1. Approvals Dashboard (`/approvals/pending`)
2. Review Submission (`/approvals/[id]`)
3. Approval History (`/approvals/history`)

**Components:**
- Approval routing config
- Review form with comments
- Approve/Reject buttons
- Notification bell
- Email notification settings

**Estimated Effort:** 60 hours

---

### Sprint 8: Compliance Automation (Bonus)
**Duration:** 2 weeks  
**Focus:** Weather triggers + compliance

**Pages:**
1. Weather Dashboard (`/weather/dashboard`)
2. Weather Alerts (`/weather/alerts`)
3. Compliance Dashboard (`/compliance/dashboard`)

**Components:**
- Weather alert card (0.25" trigger)
- Countdown timer (24 hours)
- Precipitation graph
- SWPPP form templates
- OSHA form templates

**Estimated Effort:** 60 hours

---

### Sprint 9: Analytics + Reporting (Phase 2)
**Duration:** 2 weeks  
**Focus:** Data insights

**Pages:**
1. Analytics Overview (`/analytics/overview`)
2. Form Analytics (`/analytics/forms`)
3. Report Builder (`/reports/builder`)
4. Scheduled Reports (`/reports/scheduled`)

**Components:**
- Completion rate charts
- Average time graphs
- Overdue forms table
- Custom report builder
- Export options

**Estimated Effort:** 80 hours

---

### Sprint 10: Issues & Actions (Competitive Parity)
**Duration:** 2 weeks  
**Focus:** Issue tracking from forms

**Pages:**
1. Issues Dashboard (`/issues`)
2. Issue Detail (`/issues/[id]`)
3. Create Issue (`/issues/create`)

**Components:**
- Issue kanban board
- Issue creation from form
- Assignee/priority selectors
- Photo evidence upload
- Comment thread

**Estimated Effort:** 60 hours

---

## SECTION 5: COMPLETE UI COMPONENT COUNT

### Total Pages Required: **50+ pages**
- P0 (Critical): 25 pages
- P1 (High): 15 pages
- P2 (Medium): 10 pages

### Total Reusable Components: **150+ components**
- Forms Components: 40 (field types, validation, rendering)
- Navigation Components: 15 (bottom nav, sidebar, breadcrumbs)
- Photo Components: 10 (capture, gallery, annotation)
- Offline Components: 8 (sync status, queue, conflicts)
- Compliance Components: 12 (weather, alerts, QR portal)
- Analytics Components: 15 (charts, graphs, reports)
- Common UI Components: 50+ (buttons, cards, modals, etc. - Mantine v7)

### Estimated Total Development Effort:
- **Sprint 3-10: 600+ hours (15 weeks)**
- Sprint 3 (Navigation): 80 hours
- Sprint 4 (Form Filling): 80 hours
- Sprint 5 (Offline): 80 hours
- Sprint 6 (Form Builder): 100 hours
- Sprint 7 (Approvals): 60 hours
- Sprint 8 (Compliance): 60 hours
- Sprint 9 (Analytics): 80 hours
- Sprint 10 (Issues): 60 hours

---

## CRITICAL FINDINGS

**Sprint 3-4 Current Plan is INCOMPLETE:**
- Covers **ONLY 8% of required UI** (form filling + QR portal)
- Missing **100% of navigation layer** (users can't navigate)
- Missing **100% of form management UI** (can't browse templates, view history)
- Missing **100% of offline UI** (no sync status, conflict resolution)
- Missing **100% of settings/admin UI**

**Recommended Action:**
1. **Sprint 3 MUST include navigation layer** (dashboard, projects, bottom nav, sidebar)
2. **Sprint 4 keeps current plan** but adds drafts/submitted pages
3. **Sprint 5 adds offline experience** (sync UI, conflict resolution)
4. **Sprint 6+ follows roadmap** for advanced features

**This represents a 10-sprint effort (20 weeks) for production-ready UI**, not the 2-sprint (4 weeks) currently planned.

Would you like me to create detailed wireframes or user flow diagrams for any specific section?