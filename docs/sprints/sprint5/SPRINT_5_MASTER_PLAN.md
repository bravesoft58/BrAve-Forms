# Sprint 5 Master Plan - Production-Ready MVP (Photo Gallery + Offline UI + Settings + Form Builder)

**Created:** 2025-10-23
**Sprint Duration:** January 2026 (7-8 weeks)
**Sprint Goal:** Complete 100% production-ready MVP with photo management, offline experience, user settings, and form builder
**Business Value:** 100% production-ready platform - field-tested confidence with professional UX and admin form creation
**Velocity Target:** 41 issues (200 hours total) - includes Phase 0 production fixes and ISSUE-126 carried over from Sprint 4

## Sprint Objectives

1. **Photo Gallery** - Full photo management (grid, lightbox, GPS map, annotations, search)
2. **Offline Experience UI** - Sync visibility (status dashboard, conflict resolution, queue management)
3. **Settings & Profile** - User account management (profile, notifications, help, app settings)
4. **Form Builder** - Complete drag-drop form designer for admins to create custom templates
5. **Production Polish** - Loading states, error handling, responsive fixes, performance optimization
6. **100% MVP Readiness** - All critical P0 features complete for Q&D Construction production pilot

## Strategic Context

Sprint 5 completes the production-ready MVP by addressing the 4 critical P0 gaps identified in the 4-agent requirements synthesis:

1. Photo Gallery (inspectors need efficient photo review)
2. Offline UI (users need sync visibility and conflict resolution)
3. Settings/Profile (users need account management and help)
4. Form Builder (admins need ability to create custom agency-specific templates)

**Sprint 3-4 Foundation:**

- Navigation: Complete (AppShell, Header, Navbar, Breadcrumbs, Dashboard, Projects, Forms)
- Form Rendering: Complete (FormRenderer, 15 field types, conditional logic, computed fields)
- Form Submission: Complete (Mobile/web fill, photo/signature capture, submission detail)
- QR Portal: Complete (Time-limited inspector access, read-only view)
- Templates: Complete (15/15 Q&D Construction agency-specific forms)
- Cloning: Complete ("Copy Yesterday's Log", "Use as Template")

**Sprint 5 Additions:**

- Photo Gallery: Grid view, lightbox, GPS map, annotations, search/filter, before/after pairing
- Offline UI: Sync status dashboard, conflict resolution, queue management, retry failed sync
- Settings: User profile, account settings, notification preferences, help/documentation
- Form Builder: Drag-drop designer, field palette, properties panel, conditional logic, preview
- Polish: Loading states audit, error handling audit, responsive design fixes

**Production Readiness After Sprint 5:**

- Before Sprint 5: 75% MVP (functional pilot with limitations)
- After Sprint 5: 100% MVP (production-ready platform with all core features)
- Deferred to Sprint 6+: Approval Workflows (60h), Analytics (80h), Multi-tenancy (40h)

## 41 Issues Breakdown

### Phase 0: Production-Ready Fixes (6 issues, 36h) - BLOCKING MVP

**NOTE:** These issues were discovered during Sprint 4 development. They replace mock data with real API connections and are critical blockers for production readiness.

**ISSUE-162: Replace Mock Data in Form Submissions (8h)** - P0 - COMPLETE

- Replace hardcoded mock data in form submission list with real GraphQL API calls
- Create TanStack Query hooks for form submissions (useFormSubmissions, useProjectSubmissions)
- Connect SubmittedFormsList component to real backend data
- Add proper loading and error states
- Dependencies: Sprint 4 complete
- Status: COMPLETE (November 2025)
- Success: Form submissions fetched from real API

**ISSUE-163: Fix Status Enum Mismatch (2h)** - P0 - COMPLETE

- Fix status enum values (frontend used lowercase, backend uses UPPERCASE)
- Update TransformedSubmission interface to use FormSubmissionStatus enum
- Update getSubmissionStatusColor to use correct UPPERCASE values
- Dependencies: ISSUE-162
- Status: COMPLETE (November 2025)
- Success: Status badges and filters work correctly

**ISSUE-164: Replace Mock Data in Dashboard (4h)** - P0 - COMPLETE

- Replace hardcoded statistics in dashboard widgets with real GraphQL API calls
- Create dashboard API helpers (fetchDashboardStats, fetchRecentActivity)
- Create useDashboard hooks for TanStack Query
- Update StatsWidget, RecentSubmissions, ProjectsOverview components
- Dependencies: ISSUE-162 complete
- Status: COMPLETE (November 2025)
- Success: Dashboard shows real project/submission statistics

**ISSUE-164.5: Forms Page UX Improvements (30min)** - P1 - COMPLETE

- Add "Create Template" button to Forms page linking to Form Builder
- Remove unused demo page with MantineProvider error
- Dependencies: ISSUE-164 complete
- Status: COMPLETE (November 2025)
- Success: Forms page has clear path to Form Builder

**ISSUE-165: Connect QR Inspector Portal to Backend (8h)** - P0 - COMPLETE

- Replace mock data in QR Inspector Portal with real GraphQL queries
- Create inspector API helpers with time-limited JWT token validation
- Create useInspectorPortal hooks for token validation and inspection data
- Handle expired/invalid token states with user-friendly messages
- Dependencies: ISSUE-162 complete, QR Portal UI complete
- Status: COMPLETE (November 2025)
- Success: Inspector portal displays real inspection data

**ISSUE-166: Implement GPS Field Functionality (6h)** - P0 - COMPLETE

- Implement real GPS coordinate capture using Geolocation API (web) and Capacitor plugin (mobile)
- Create geolocation.ts utility with getCurrentPosition, permission handling
- Create functional GPSField component with capture button and accuracy indicator
- Handle permission denied, timeout, and unavailable GPS gracefully
- Dependencies: Form schema supports GPS field type
- Status: COMPLETE (November 2025)
- Code Review: Increased timeout to 60s, added coordinate validation with null island detection
- Success: GPS fields capture real coordinates with accuracy display

**ISSUE-167: Implement Photo Upload to Storage (8h)** - P0 - COMPLETE

- Implement real photo upload to MinIO (local) or S3 (production)
- Create photo-upload.ts service with compression, EXIF extraction
- Create functional PhotoField component with capture, gallery, and upload
- Handle file size limits, upload progress, and offline queue
- Dependencies: MinIO/S3 configured, Backend upload mutation exists
- Status: COMPLETE (November 2025)
- Code Review: Fixed env var, added offline queue, cross-tenant validation, GPS validation
- Success: Photos upload to real storage with thumbnails

### Phase 1: Photo Gallery (6 issues, 20h)

**ISSUE-128: Photo Gallery Grid View (4h)** - P0

- Create /photos and /photos/[projectId] routes
- Grid layout with masonry/responsive columns
- Photo thumbnails with metadata preview (date, user, form)
- Filter by project, form type, date range
- Sort by date (newest/oldest), form name
- Infinite scroll for large photo sets
- Dependencies: Sprint 4 complete
- Success: Photo gallery displays all project photos in grid

**ISSUE-129: Photo Lightbox Viewer (3h)** - P0

- Install Yet Another React Lightbox (MIT license, actively maintained)
- Click photo thumbnail to open lightbox modal
- Full-size image display with zoom controls (Zoom plugin)
- Swipe left/right to navigate photos (mobile)
- Arrow keys for navigation (desktop)
- Display EXIF metadata (timestamp, GPS, camera)
- Download original photo button
- Share photo link button
- Use responsive images (srcset/sizes for performance)
- Dependencies: ISSUE-143
- Success: Lightbox functional with navigation

**ISSUE-130: GPS Map Integration (4h)** - P0

- Install MapLibre GL JS + react-map-gl (BSD license, open source, free)
- Map view toggle (grid/map)
- Display photo locations as pins on map
- Cluster pins when zoomed out
- Click pin to preview photo
- Show photo route/path if multiple photos
- Filter map by date range
- Use free tile provider (Stadia Maps, OpenStreetMap, or self-hosted)
- Offline support: Self-host tiles for construction sites without connectivity
- Dependencies: ISSUE-144
- Success: GPS map displays photo locations with offline capability

**ISSUE-131: Photo Annotations (4h)** - P1

- Install Annotorious (@annotorious/react, BSD license, actively maintained)
- Annotation toolbar (arrow, text, highlight, drawing shapes)
- Draw annotations on photo using Annotorious API
- Save annotated version (new file, preserve original)
- Annotation metadata (who, when, what)
- View annotation history
- Delete annotations
- TypeScript support (full type safety)
- Dependencies: ISSUE-135
- Success: Photo annotations functional with modern library

**ISSUE-132: Photo Search & Filter (3h)** - P0

- Search by photo description/tags
- Filter by user (who took photo)
- Filter by form type (inspection, daily log, etc.)
- Filter by date range (calendar picker)
- Filter by GPS location (within radius)
- Filter by weather conditions (rain, sun, etc.)
- Clear all filters button
- Dependencies: ISSUE-156
- Success: Photo search and filters functional

**ISSUE-133: Before/After Photo Pairing (2h)** - P1

- Link two photos as before/after pair
- Side-by-side comparison view
- Slider to fade between before/after
- Tag photos as "before" or "after"
- Filter to show only paired photos
- Dependencies: ISSUE-158
- Success: Before/after pairing functional

### Phase 2: Offline Experience UI (7 issues, 24h)

**ISSUE-134: Sync Status Dashboard (4h)** - P0

- Create /sync/status route
- Display current sync status (synced, syncing, offline, error)
- Show last sync timestamp
- Show next auto-sync time
- Show sync statistics (items synced today, total pending)
- Show storage usage (local IndexedDB size)
- 30-day offline capability countdown
- Dependencies: Phase 1 complete
- Success: Sync status dashboard displays accurate data

**ISSUE-135: Sync Queue Management (4h)** - P0

- Create /sync/queue route
- List all pending sync operations (table view)
- Show operation type (form submission, photo upload, etc.)
- Show operation timestamp (when queued)
- Show operation size (data size)
- Show operation priority (compliance forms first)
- Retry individual operation button
- Delete queued operation button (with confirmation)
- Dependencies: ISSUE-144
- Success: Sync queue displays all pending operations

**ISSUE-136: Conflict Resolution UI (6h)** - P0

- Create /sync/conflicts route
- Detect conflicts (local vs server version mismatch)
- Display conflict comparison modal (side-by-side)
- Show field-level differences (highlighted)
- Resolution options: Keep Local, Keep Server, Merge, Cancel
- Merge editor for manual conflict resolution
- Conflict history log (who resolved, when, how)
- Dependencies: ISSUE-135
- Success: Conflict resolution UI functional

**ISSUE-137: Offline Storage Indicators (2h)** - P0

- Storage meter in sync dashboard (used/available)
- Warning when approaching 30-day capacity
- Alert when <5 days remaining
- Storage cleanup suggestions (delete old drafts)
- Export old data to free space
- Dependencies: ISSUE-156
- Success: Storage indicators accurate

**ISSUE-138: Manual Sync Trigger (2h)** - P0

- "Sync Now" button in header (next to offline banner)
- Sync progress modal with percentage
- Cancel sync button (stop in-progress sync)
- Sync error display (with retry option)
- Success toast notification
- Dependencies: ISSUE-158
- Success: Manual sync trigger functional

**ISSUE-139: Retry Failed Sync (2h)** - P0

- Identify failed sync operations
- Display failed items in sync queue (red badge)
- "Retry All Failed" button
- Retry individual failed item
- Show failure reason (network error, validation error, etc.)
- Dependencies: ISSUE-143
- Success: Retry failed sync functional

**ISSUE-140: Offline Experience Tests (4h)** - P0

- Test offline detection (network toggle)
- Test auto-save to IndexedDB
- Test sync queue persistence
- Test conflict detection and resolution
- Test 30-day storage capacity
- Test manual sync trigger
- Test retry failed sync
- Dependencies: ISSUE-144
- Success: All offline tests passing

### Phase 3: Settings & Profile (5 issues, 12h)

**ISSUE-141: User Profile Page (3h)** - P0

- Create /settings/profile route
- Display user info (name, email, avatar)
- Edit profile form (name, avatar upload)
- Change password form
- Delete account button (with confirmation)
- Profile completion percentage
- Dependencies: Phase 2 complete
- Success: User profile page functional

**ISSUE-142: Account Settings (3h)** - P0

- Create /settings/account route
- Email notification preferences (on/off toggles)
- Push notification preferences (mobile)
- Language selection dropdown (en, es - future)
- Timezone selection
- Date format preference (MM/DD/YYYY, DD/MM/YYYY)
- Time format preference (12h, 24h)
- Dependencies: ISSUE-156
- Success: Account settings functional

**ISSUE-143: Notification Preferences (2h)** - P0

- Create /settings/notifications route
- Email notifications toggle (daily summary, form submitted, etc.)
- Push notifications toggle (weather alerts, inspection due, etc.)
- SMS notifications toggle (critical alerts only)
- Notification frequency (real-time, hourly, daily)
- Quiet hours configuration (no notifications 10pm-7am)
- Dependencies: ISSUE-158
- Success: Notification preferences functional

**ISSUE-144: Help & Documentation (2h)** - P0

- Create /settings/help route
- FAQ accordion (common questions)
- Video tutorials (embedded YouTube/Vimeo)
- PDF user guides (download links)
- Contact support form (email support team)
- Report a bug form (with screenshot upload)
- Feature request form
- Dependencies: ISSUE-143
- Success: Help page functional

**ISSUE-145: App Settings (2h)** - P0

- Create /settings/app route
- Theme toggle (light/dark mode) - P2 future
- Compact view toggle (dense/comfortable)
- Auto-save interval (15s, 30s, 60s)
- Offline mode preference (WiFi only, cellular allowed)
- Cache management (clear cache button)
- App version display (with update check button)
- Dependencies: ISSUE-144
- Success: App settings functional

### Phase 4: Polish & Testing (4 issues, 4h)

**ISSUE-146: Loading States Audit (1h)** - P0

- Audit all pages for loading skeletons
- Add LoadingSkeleton to missing pages
- Add LoadingOverlay to long operations
- Add inline spinners to buttons during submit
- Test loading states on slow network (Chrome throttle)
- Dependencies: Phase 3 complete
- Success: All pages have loading states

**ISSUE-147: Error Handling Audit (1h)** - P0

- Audit all pages for error boundaries
- Add ErrorBoundary to missing routes
- Add ErrorAlert for API failures
- Add inline field validation errors
- Test error recovery (retry, go back, etc.)
- Dependencies: ISSUE-156
- Success: All pages have error handling

**ISSUE-148: Responsive Design Fixes (1h)** - P0

- Test all pages on mobile (375px, 768px, 1024px)
- Fix layout breaks on small screens
- Fix touch target sizes (<48x48dp)
- Fix horizontal scroll issues
- Fix modal overflow on mobile
- Test on real devices (iOS, Android)
- Dependencies: ISSUE-158
- Success: All pages responsive

**ISSUE-149: Sprint 5 Completion Report (1h)** - P0

- Gather evidence from all 35 issues
- Document photo gallery features
- Document offline UI features
- Document settings features
- Document form builder features
- Performance metrics (load times, sync times)
- Known issues / deferred items
- Sprint 6 planning notes
- Dependencies: All issues complete
- Success: Sprint 5 completion report created

**ISSUE-126: Load Testing (4h)** - P1 (Carried over from Sprint 4)

- Load testing for 100+ concurrent users
- Stress test API endpoints under heavy load
- Test database query performance at scale
- Test photo upload throughput
- Test sync queue performance with large backlog
- Document performance baselines and bottlenecks
- Dependencies: ISSUE-149
- Success: Load testing complete with documented results
- Note: Deferred from Sprint 4 - not needed for Q&D pilot (5-25 users), needed before enterprise scaling

### Phase 5: Form Builder (12 issues, 100h)

**ISSUE-150: Form Builder Architecture Setup (6h)** - P0

- Install @dnd-kit/core drag-drop library
- Create formBuilderStore with Valtio
- Set up FormBuilderState interface (currentForm, selectedFieldId, isDragging, history)
- Implement formBuilderActions (createForm, addField, updateField, deleteField)
- Create /admin/forms/new and /admin/forms/[id]/edit routes
- Set up form builder page layout (3-column: palette, canvas, properties)
- Dependencies: ISSUE-160 complete
- Success: Form builder architecture initialized

**ISSUE-151: Field Palette Component (8h)** - P0

- Create FieldPalette sidebar component
- Display 18 field types (text, number, email, phone, date, time, etc.)
- Implement draggable field items using @dnd-kit useDraggable
- Add field type icons and descriptions
- Group fields by category (Basic, Advanced, Specialized)
- Search/filter palette fields
- Drag preview with field icon
- Dependencies: ISSUE-155
- Success: Field palette displays all 18 field types, draggable to canvas

**ISSUE-152: Form Canvas with Drag-Drop (12h)** - P0

- Create FormCanvas drop zone component
- Implement DndContext from @dnd-kit/core
- Use SortableContext for field reordering (verticalListSortingStrategy)
- Handle drag-start, drag-over, drag-end events
- Add field from palette on drop
- Reorder fields via drag-drop
- Visual drop indicators (blue line between fields)
- Empty state with "Drag fields here" message
- Dependencies: ISSUE-156
- Success: Drag fields from palette to canvas, reorder fields

**ISSUE-153: Properties Panel Component (10h)** - P0

- Create PropertiesPanel right sidebar
- Display selected field properties
- Field label input (required)
- Placeholder text input
- Help text textarea
- Required toggle
- Field type display (read-only)
- Default value input
- Validation rules section (min/max length, pattern)
- Dependencies: ISSUE-158
- Success: Properties panel displays/edits selected field properties

**ISSUE-154: Conditional Logic Builder (12h)** - P0

- Create ConditionalLogicBuilder component in properties panel
- "Show this field if..." condition builder
- Field selection dropdown (show if field X)
- Operator selection (equals, not equals, contains, greater than, etc.)
- Value input (comparison value)
- Add multiple conditions (AND/OR logic)
- Condition preview in field card
- Test conditional logic in preview mode
- Dependencies: ISSUE-159
- Success: Conditional logic functional (fields show/hide based on conditions)

**ISSUE-155: Calculated Fields Editor (10h)** - P0

- Install expr-eval (MIT license, 5KB, secure, simple)
- Create CalculatedFieldEditor component
- Formula input with autocomplete (field references)
- Support operators: +, -, \*, /, ( )
- Support functions: SUM, AVG, MIN, MAX (use expr-eval Parser)
- Field reference syntax: {field_name}
- Formula validation (syntax errors using expr-eval)
- Live preview of calculated result
- Unit selection (currency, percentage, number)
- Security: expr-eval safer than mathjs (no import/createUnit risks)
- Dependencies: ISSUE-160
- Success: Calculated fields functional (auto-compute based on other fields)

**ISSUE-156: Field Settings Tabs (8h)** - P0

- Create tabbed interface in properties panel
- Tab 1: Basic (label, placeholder, help text)
- Tab 2: Validation (required, min/max, pattern, custom rules)
- Tab 3: Logic (conditional logic builder)
- Tab 4: Calculations (calculated field editor)
- Tab 5: Advanced (custom CSS, data binding, API integration)
- Save settings to formBuilderStore on change
- Dependencies: ISSUE-155
- Success: All field settings accessible via tabs

**ISSUE-158: Form Preview Component (8h)** - P0

- Create FormPreview modal component
- Toggle between mobile (375px) and desktop (1024px) preview
- Render form using FormRenderer component
- Live preview (updates as fields change)
- Test conditional logic in preview
- Test calculated fields in preview
- Close preview button
- Full-screen preview option
- Dependencies: ISSUE-156
- Success: Form preview displays accurate mobile/desktop rendering

**ISSUE-159: Save/Publish Workflow (6h)** - P0

- Implement "Save Draft" button (saves to PostgreSQL as draft)
- Implement "Publish" button (marks form as active template)
- Form metadata modal (title, description, category, tags)
- Validation before publish (all required fields have labels)
- Success toast notifications
- Auto-save every 30 seconds
- Publish confirmation modal
- Dependencies: ISSUE-158
- Success: Forms save as drafts and publish as active templates

**ISSUE-160: Undo/Redo History (6h)** - P0

- Implement history array in formBuilderStore
- Save form state snapshot on every change
- Undo button (Ctrl+Z / Cmd+Z)
- Redo button (Ctrl+Shift+Z / Cmd+Shift+Z)
- History limit (50 snapshots)
- History indicator (undo/redo available state)
- Clear history on publish
- Dependencies: ISSUE-159
- Success: Undo/redo functional for all form builder actions

**ISSUE-161: Form Validation Engine (8h)** - P0

- Validate form before publish (all fields have labels)
- Detect circular dependencies in calculated fields
- Validate conditional logic (referenced fields exist)
- Detect unreachable fields (always hidden by conditions)
- Validation error display in properties panel
- Validation summary modal (list all errors)
- Block publish if validation fails
- Dependencies: ISSUE-160
- Success: Form validation prevents invalid forms from publishing

**ISSUE-161: Form Builder Tests & Polish (6h)** - P0

- Test drag-drop functionality (palette to canvas, reorder)
- Test field property editing (all 18 field types)
- Test conditional logic (show/hide fields)
- Test calculated fields (all operators and functions)
- Test save/publish workflow
- Test undo/redo history
- Test form validation engine
- Test form validation (detect errors)
- Test mobile/desktop preview
- Coverage target: >80%
- Dependencies: ISSUE-161 (Form Validation Engine)
- Success: All form builder tests passing

## Critical Path

**Week 1 Focus (20h):**

- Phase 1: Photo Gallery (ISSUE-128 through ISSUE-133) - 20h
  - Day 1-2: Photo gallery grid + lightbox (7h)
  - Day 3-4: GPS map + annotations (8h)
  - Day 5: Search/filter + before/after pairing (5h)

**Week 2 Focus (24h):**

- Phase 2: Offline Experience (ISSUE-129 through ISSUE-135) - 24h
  - Day 1-2: Sync status dashboard + queue management (8h)
  - Day 3-4: Conflict resolution UI + storage indicators (8h)
  - Day 5: Manual sync + retry failed + testing (8h)

**Week 3 Focus (16h):**

- Phase 3: Settings & Profile (ISSUE-136 through ISSUE-140) - 12h
  - Day 1-2: User profile + account settings (6h)
  - Day 3: Notification preferences + help (4h)
  - Day 4: App settings (2h)
- Phase 4: Polish & Testing (ISSUE-141 through ISSUE-144) - 4h
  - Day 5: Loading states + error handling + responsive fixes + completion report (4h)

**Week 4 Focus (24h):**

- Phase 5: Form Builder - Part 1 (ISSUE-145 through ISSUE-148) - 36h
  - Day 1: Form builder architecture setup (6h)
  - Day 2-3: Field palette component (8h)
  - Day 4-5: Form canvas with drag-drop (12h) - continues into Week 5

**Week 5 Focus (26h):**

- Phase 5: Form Builder - Part 2 (ISSUE-148 through ISSUE-151) - 40h
  - Day 1-2: Form canvas completion + properties panel (10h)
  - Day 3-4: Conditional logic builder (12h)
  - Day 5: Calculated fields editor start (4h) - continues into Week 6

**Week 6 Focus (26h):**

- Phase 5: Form Builder - Part 3 (ISSUE-150 through ISSUE-153) - 30h
  - Day 1-2: Calculated fields editor completion (6h)
  - Day 3: Field settings tabs (8h)
  - Day 4: Form preview component (8h)
  - Day 5: Save/publish workflow (6h)

**Week 7 Focus (20h):**

- Phase 5: Form Builder - Part 4 (ISSUE-154 through ISSUE-156) - 20h
  - Day 1: Undo/redo history (6h)
  - Day 2: Form validation engine (8h)
  - Day 3-4: Form builder tests (6h)

**Week 8 Focus (10h):**

- Final polish and integration testing
  - Day 1-2: End-to-end testing of all 5 phases (6h)
  - Day 3: Bug fixes and refinement (4h)

## Success Criteria

**Must Complete (P0 - 30 issues, 88%):**

- [ ] Photo gallery grid view and lightbox (ISSUE-128, ISSUE-129)
- [ ] GPS map integration (ISSUE-130)
- [ ] Photo search and filters (ISSUE-132)
- [ ] Sync status dashboard (ISSUE-129)
- [ ] Sync queue management (ISSUE-130)
- [ ] Conflict resolution UI (ISSUE-131)
- [ ] Offline storage indicators (ISSUE-132)
- [ ] Manual sync trigger (ISSUE-133)
- [ ] Retry failed sync (ISSUE-134)
- [ ] Offline experience tests (ISSUE-135)
- [ ] User profile page (ISSUE-136)
- [ ] Account settings (ISSUE-137)
- [ ] Notification preferences (ISSUE-138)
- [ ] Help & documentation (ISSUE-139)
- [ ] App settings (ISSUE-140)
- [ ] Loading states audit (ISSUE-141)
- [ ] Error handling audit (ISSUE-142)
- [ ] Responsive design fixes (ISSUE-143)
- [ ] Form builder architecture (ISSUE-145)
- [ ] Field palette component (ISSUE-146)
- [ ] Form canvas with drag-drop (ISSUE-147)
- [ ] Properties panel (ISSUE-148)
- [ ] Conditional logic builder (ISSUE-149)
- [ ] Calculated fields editor (ISSUE-150)
- [ ] Field settings tabs (ISSUE-151)
- [ ] Form preview component (ISSUE-152)
- [ ] Save/publish workflow (ISSUE-153)
- [ ] Undo/redo history (ISSUE-154)
- [ ] Form validation engine (ISSUE-155)
- [ ] Form builder tests (ISSUE-156)

**Should Complete (P1 - 5 issues, 14%):**

- [ ] Photo annotations (ISSUE-131) - nice-to-have for inspectors
- [ ] Before/after photo pairing (ISSUE-128) - nice-to-have for progress tracking
- [ ] Load testing (ISSUE-126) - carried over from Sprint 4, needed before enterprise scaling

**Sprint 5 Readiness:**

After Sprint 5 completion:

- Navigation: 100% ✓
- Form Rendering: 100% ✓
- Form Submission: 100% ✓
- QR Portal: 100% ✓
- Templates: 100% ✓
- Photo Gallery: 100% ✓ (NEW)
- Offline UI: 100% ✓ (NEW)
- Settings/Profile: 100% ✓ (NEW)
- Form Builder: 100% ✓ (NEW)

**Production MVP: 100% Complete**

Deferred to Sprint 6+:

- Approval Workflows (60h) - email approvals initially
- Analytics Dashboard (80h) - manual reporting initially
- Multi-tenancy (40h) - single org for Q&D pilot

## Dependencies

**Sprint 4 Prerequisites:**

- QR Inspector Portal complete (ISSUE-100 through ISSUE-105)
- All 15 Q&D templates seeded (ISSUE-106 through ISSUE-116)
- Cross-browser testing complete (ISSUE-119)
- Performance optimization complete (ISSUE-121)

**Sprint 5 Phase Dependencies:**

- Phase 1 (Photo Gallery) → depends on Sprint 4 complete
- Phase 2 (Offline UI) → depends on Phase 1 complete
- Phase 3 (Settings) → depends on Phase 2 complete
- Phase 4 (Polish) → depends on Phase 3 complete
- Phase 5 (Form Builder) → depends on Phase 4 complete

**External Dependencies:**

- MapLibre GL JS + react-map-gl (BSD license, free, ISSUE-130)
- Free map tiles provider: Stadia Maps, OpenStreetMap, or self-hosted (ISSUE-130)
- Annotorious (@annotorious/react, BSD license, ISSUE-131)
- Yet Another React Lightbox (MIT license, ISSUE-129)
- expr-eval (MIT license, ISSUE-150)
- IndexedDB storage API (browser native, already in use, ISSUE-132)
- @dnd-kit/core drag-drop library (MIT license, ISSUE-145, ISSUE-147)

**All dependencies are 100% open source with permissive licenses (MIT/BSD)**
**Total cost: $0** (vs Mapbox which would be $5-20/month usage-based)

## Technical Specifications

**Photo Gallery Stack:**

- Grid Layout: CSS Grid + Masonry layout
- Lightbox: Yet Another React Lightbox (MIT, actively maintained, React 19 compatible)
- Map: MapLibre GL JS + react-map-gl (BSD, open source, offline tiles support)
- Annotations: Annotorious (@annotorious/react, BSD, TypeScript, actively maintained)
- Search: Debounced input with backend GraphQL query

**Why these choices:**

- Yet Another React Lightbox: react-image-lightbox is deprecated/unsupported
- MapLibre GL JS: Mapbox GL v2+ is proprietary (not open source), MapLibre is free + offline capable
- Annotorious: react-image-annotate unmaintained (5 years), Annotorious actively maintained

**Offline UI Stack:**

- Sync Queue: IndexedDB + Valtio store
- Conflict Resolution: Custom React component with diff viewer
- Storage Indicators: IndexedDB API (navigator.storage.estimate())
- Manual Sync: BullMQ background job trigger

**Settings Stack:**

- Forms: React Hook Form + Zod validation
- Avatar Upload: Same photo upload flow as forms
- Preferences: Stored in PostgreSQL user settings table
- Help Docs: Markdown files or embedded videos

**Form Builder Stack:**

- Drag-Drop: @dnd-kit/core with DndContext, SortableContext (MIT, 10KB, best-in-class)
- State Management: Valtio formBuilderStore with history (MIT, auto-reactivity via proxies)
- Field Types: 18 field types (text, number, email, phone, date, time, dropdown, radio, checkbox, textarea, photo, signature, file, location, rating, slider, section, calculated)
- Conditional Logic: Custom builder with field references, operators, AND/OR
- Calculated Fields: expr-eval expression parser (MIT, 5KB, SUM/AVG/MIN/MAX functions)
- Validation: Custom validation engine (circular dependency detection, unreachable fields)
- Storage: PostgreSQL (form templates table with JSONB schema column)

**Why these choices:**

- @dnd-kit/core: Modern, performant, accessible (preferred over react-beautiful-dnd, react-dnd)
- Valtio: Auto-reactivity perfect for form builder (frequent field updates)
- expr-eval: Simpler license (MIT vs mathjs Apache 2.0 + LGPL), lighter (5KB vs heavy), more secure (no import/createUnit risks)

## Performance Targets

**Photo Gallery:**

- Grid load time: <2s for 100 photos
- Lightbox open: <500ms
- Map render: <1s for 100 pins
- Annotation save: <1s

**Offline UI:**

- Sync status load: <500ms
- Queue render: <1s for 100 items
- Conflict resolution: <2s to load comparison
- Manual sync: <5s for 10 items

**Settings:**

- Page load: <1s
- Form submit: <2s
- Avatar upload: <5s

**Form Builder:**

- Initial load: <2s
- Drag-drop response: <100ms
- Field property update: <500ms
- Undo/redo: <200ms
- Preview render: <1s
- Auto-save: <2s
- Publish: <3s
- Conditional logic evaluation: <100ms
- Calculated field compute: <200ms

## Evidence Requirements

**Photo Gallery Evidence:**

- Screenshots: Grid view, lightbox, GPS map, annotations
- Video: Photo navigation, search/filter workflow
- Performance: Load time metrics, map render time

**Offline UI Evidence:**

- Screenshots: Sync dashboard, queue, conflict resolution
- Video: Manual sync workflow, retry failed sync
- Testing: Offline mode tests (network toggle)

**Settings Evidence:**

- Screenshots: All settings pages
- Video: Profile update workflow
- Testing: Preference persistence tests

**Form Builder Evidence:**

- Screenshots: Field palette, form canvas, properties panel, preview
- Video: Complete form creation workflow (drag-drop, configure, preview, publish)
- Testing: Drag-drop tests, conditional logic tests, calculated field tests
- Performance: Drag-drop latency metrics, preview render time
- Validation: Test circular dependency detection, unreachable field detection

## Risk Mitigation

**Risk: Photo Gallery Performance (Large Photo Sets)**

- Mitigation: Infinite scroll + lazy loading + thumbnail CDN
- Fallback: Pagination if infinite scroll too slow

**Risk: Offline Conflict Resolution Complexity**

- Mitigation: Start with simple "Keep Local" or "Keep Server" options
- Defer advanced merge editor to Sprint 6 if too complex

**Risk: Settings Preferences Storage**

- Mitigation: Use PostgreSQL user settings table (already exists)
- Fallback: localStorage for non-critical preferences

**Risk: Time Constraints (160h in 7-8 weeks)**

- Mitigation: Mark ISSUE-131 (annotations) and ISSUE-133 (before/after) as P1 (defer if needed)
- Form Builder is P0 (critical for 100% MVP), cannot be deferred
- Minimum viable: 30 P0 issues (140h) vs all 34 issues (160h)
- If time pressured: Remove photo annotations and before/after pairing (20h savings)

**Risk: Form Builder Complexity (Drag-Drop + Conditional Logic)**

- Mitigation: Use proven @dnd-kit library (battle-tested by React community)
- Start with simple conditional logic (equals, not equals) before advanced operators
- Defer calculated fields IF too complex (mark as P1, implement in Sprint 6)
- Fallback: Manual form creation via database (admin workaround)

**Risk: Calculated Fields Parser Complexity**

- Mitigation: Use expr-eval (MIT license, 5KB, simple and secure)
- expr-eval chosen over mathjs for simpler licensing (no LGPL copyleft), smaller size, better security
- Limit to basic operators (+, -, \*, /) and simple functions (SUM, AVG, MIN, MAX)
- Defer advanced functions (IF, ROUND) to Sprint 6 if needed
- Validation prevents infinite loops and circular dependencies

## Sprint 6+ Preview

**Deferred Features (Future Sprints):**

- Sprint 6: Approval Workflows (60h, 3 weeks)
  - Approval routing configuration
  - Approval queue
  - Review form with comments
  - Approve/reject interface
  - Email notifications
  - Approval status tracking

- Sprint 7: Analytics Dashboard (80h, 4 weeks)
  - Form completion metrics
  - User activity analytics
  - Project analytics
  - Compliance metrics
  - Custom reports builder
  - Scheduled reports

- Sprint 8: Issues & Actions Management (60h, 3 weeks)
  - Issue tracking (open, in-progress, resolved)
  - Action items with assignments
  - Issue photos and evidence
  - Issue workflow automation
  - Issue search and filtering

**Multi-Tenancy (Future - Post-Pilot):**

- Sprint 9-10: Re-enable multi-tenancy (40h, 2 weeks)
  - Restore Clerk Organizations
  - Add org switcher UI back
  - Update all queries to filter by orgId
  - Test tenant isolation
  - Migrate Q&D data to proper org

**Advanced Form Builder (Future Enhancements):**

- Sprint 11+: Advanced calculated fields (IF, NESTED functions)
- Sprint 11+: Form versioning and change tracking
- Sprint 11+: Form templates marketplace
- Sprint 11+: Custom field types (plugins)

---

**Last Updated:** 2025-11-27
**Sprint Duration:** 7-8 weeks (200 hours)
**Total Issues:** 41.5 (includes Phase 0 production fixes, ISSUE-164.5, and ISSUE-126 carried over from Sprint 4)
**Status:** IN PROGRESS - Phase 0 started (3.5/6.5 issues complete)

**Issue Breakdown:**

- Phase 0: Production-Ready Fixes (6.5 issues, 36.5h) - 3.5 COMPLETE, 3 READY
- Phase 1: Photo Gallery (6 issues, 20h) - READY
- Phase 2: Offline Experience UI (7 issues, 24h) - READY
- Phase 3: Settings & Profile (5 issues, 12h) - READY
- Phase 4: Polish & Testing (5 issues, 8h) - READY (includes ISSUE-126)
- Phase 5: Form Builder (12 issues, 100h) - READY

**Major Additions:**

- Phase 0: Production-Ready Fixes (6 issues, 36h) - Replace mock data with real API connections
- Phase 5: Form Builder (12 issues, 100h) - Complete drag-drop form designer
- Production MVP: 100% complete (was 95% without Form Builder and real data connections)
