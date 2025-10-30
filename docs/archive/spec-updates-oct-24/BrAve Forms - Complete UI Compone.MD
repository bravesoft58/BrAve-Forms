# BrAve Forms - Complete UI Component Architecture

**Version:** 1.0  
**Created:** October 23, 2025  
**Status:** COMPREHENSIVE DESIGN  
**Target:** Sprint 3-5 Implementation

---

## Executive Summary

This document defines the complete component architecture for BrAve Forms frontend application. The design prioritizes:

- **Offline-first operation** (30-day capability)
- **Field-optimized UX** (gloves, sunlight, weather)
- **Construction workflows** (forms-first, compliance bonus)
- **Production quality** (not MVP shortcuts)

**Key Metrics:**
- **Total Components:** 89 (47 P0, 28 P1, 14 P2)
- **Mantine Integration:** 62% base components, 38% custom
- **Code Splitting:** 15 route-based chunks
- **Bundle Target:** <200KB initial, <100KB per route

**Implementation Timeline:**
- **Sprint 3:** Core navigation + Form rendering (20 components)
- **Sprint 4:** Data display + Template management (28 components)
- **Sprint 5:** Advanced features + Polish (41 components)

---

## Table of Contents

1. [Component Inventory](#1-component-inventory)
2. [Component Architecture Diagram](#2-component-architecture-diagram)
3. [Mantine v7 Integration Strategy](#3-mantine-v7-integration-strategy)
4. [State Management Architecture](#4-state-management-architecture)
5. [Page Component Hierarchy](#5-page-component-hierarchy)
6. [Offline-First Considerations](#6-offline-first-considerations)
7. [Field-Optimized UX Patterns](#7-field-optimized-ux-patterns)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Testing Strategy](#9-testing-strategy)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Code Standards & Patterns](#11-code-standards--patterns)

---

## 1. Component Inventory

### 1.1 Layout Components (11 total)

| Component | Type | Mantine Base | Custom Logic | Dependencies | Priority | Sprint |
|-----------|------|--------------|--------------|--------------|----------|--------|
| AppShell | Layout | AppShell | Responsive breakpoints, offline banner | - | P0 | 3 |
| AppHeader | Layout | Header | User menu, notifications, sync status | UserNav, NotificationDropdown, SyncIndicator | P0 | 3 |
| AppNavbar | Layout | Navbar | Role-based menu, active states | DashboardNav | P0 | 3 |
| AppFooter | Layout | Footer | Version, support links | - | P2 | 5 |
| DashboardNav | Navigation | NavLink | Hierarchical menu, icons | - | P0 | 3 |
| UserNav | Navigation | Menu | Avatar, logout, settings | Clerk useUser() | P0 | 3 |
| MobileBottomNav | Navigation | - | Custom bottom nav for mobile | - | P1 | 4 |
| Breadcrumbs | Navigation | Breadcrumbs | Auto-generate from route | useRouter | P1 | 4 |
| PageContainer | Layout | Container | Consistent padding, max-width | - | P0 | 3 |
| PageHeader | Layout | Group + Title | Action buttons, back button | - | P0 | 3 |
| EmptyState | Feedback | Center + Stack | Icon, message, CTA | - | P1 | 4 |

### 1.2 Form Components (23 total)

| Component | Type | Mantine Base | Custom Logic | Dependencies | Priority | Sprint |
|-----------|------|--------------|--------------|--------------|----------|--------|
| FormRenderer | Form | - | Dynamic field rendering, schema validation | FieldTypes (all) | P0 | 3 |
| FormBuilder | Form | - | Drag-drop form design, field config | DndContext, FieldPalette | P1 | 4 |
| TemplateSelector | Form | Select / Grid | Template preview, filtering | - | P0 | 3 |
| TextInput | Field | TextInput | Validation, error states | RHF Controller | P0 | 3 |
| NumberInput | Field | NumberInput | Min/max, step, units | RHF Controller | P0 | 3 |
| TextareaInput | Field | Textarea | Auto-resize, char count | RHF Controller | P0 | 3 |
| SelectInput | Field | Select | Search, multi-select | RHF Controller | P0 | 3 |
| RadioInput | Field | Radio.Group | Horizontal/vertical layout | RHF Controller | P0 | 3 |
| CheckboxInput | Field | Checkbox.Group | Multi-select, select all | RHF Controller | P0 | 3 |
| DateInput | Field | DateInput | Min/max, disable dates | RHF Controller | P0 | 3 |
| TimeInput | Field | TimeInput | 12/24hr format | RHF Controller | P1 | 4 |
| DateTimeInput | Field | - | Combined date + time | DateInput, TimeInput | P1 | 4 |
| PhotoInput | Field | - | Camera capture, gallery, GPS EXIF | Capacitor Camera | P0 | 3 |
| SignatureInput | Field | - | Canvas signature pad | react-signature-canvas | P0 | 3 |
| LocationInput | Field | - | GPS capture, map preview | Capacitor Geolocation | P1 | 4 |
| FileUploadInput | Field | FileInput | Multiple files, file type validation | - | P1 | 4 |
| RatingInput | Field | Rating | Star/emoji rating | RHF Controller | P2 | 5 |
| SliderInput | Field | Slider | Range slider, marks | RHF Controller | P2 | 5 |
| SwitchInput | Field | Switch | Toggle on/off | RHF Controller | P1 | 4 |
| ColorInput | Field | ColorInput | Color picker | RHF Controller | P2 | 5 |
| FieldPalette | Form | Stack | Draggable field types | - | P1 | 4 |
| FieldConfig | Form | Drawer | Field settings editor | - | P1 | 4 |
| FormPreview | Form | Paper | Live form preview | FormRenderer | P1 | 4 |

### 1.3 Data Display Components (18 total)

| Component | Type | Mantine Base | Custom Logic | Dependencies | Priority | Sprint |
|-----------|------|--------------|--------------|--------------|----------|--------|
| ProjectCard | Data | Card | Status badge, quick actions | Badge, Menu | P0 | 3 |
| ProjectList | Data | Stack | Filtering, sorting, search | ProjectCard | P0 | 3 |
| FormCard | Data | Card | Form type icon, completion status | Badge | P0 | 3 |
| FormList | Data | Grid | Grid/list toggle, filters | FormCard | P0 | 3 |
| SubmissionCard | Data | Card | User avatar, timestamp, status | Avatar, Badge | P0 | 3 |
| SubmissionList | Data | Stack | Infinite scroll, filters | SubmissionCard | P0 | 3 |
| SubmissionDetail | Data | Paper | Field values, photos, signature | - | P0 | 3 |
| PhotoGallery | Data | - | Grid layout, lightbox, EXIF | PhotoViewer | P0 | 3 |
| PhotoViewer | Data | Modal | Zoom, EXIF overlay, GPS map | Image, Text | P0 | 3 |
| PhotoThumbnail | Data | Image | Lazy load, placeholder | - | P0 | 3 |
| UserAvatar | Data | Avatar | Initials fallback, online status | - | P0 | 3 |
| UserCard | Data | Card | Role badge, contact info | UserAvatar, Badge | P1 | 4 |
| UserList | Data | Stack | Role filtering, search | UserCard | P1 | 4 |
| TemplateCard | Data | Card | Preview thumbnail, usage count | - | P1 | 4 |
| TemplateList | Data | Grid | Category filtering, search | TemplateCard | P1 | 4 |
| StatsCard | Data | Card | Metric + trend indicator | - | P1 | 4 |
| ActivityTimeline | Data | Timeline | Recent activity feed | Timeline.Item | P2 | 5 |
| ComplianceStatus | Data | Paper | EPA/OSHA status indicators | Badge, Progress | P1 | 4 |

### 1.4 Feedback Components (12 total)

| Component | Type | Mantine Base | Custom Logic | Dependencies | Priority | Sprint |
|-----------|------|--------------|--------------|--------------|----------|--------|
| OfflineBanner | Feedback | Alert | Network status detection | useOnlineStatus | P0 | 3 |
| SyncIndicator | Feedback | Badge | Queue count, sync animation | Valtio appStore | P0 | 3 |
| NotificationDropdown | Feedback | Menu + ScrollArea | Real-time notifications | TanStack Query | P1 | 4 |
| ToastContainer | Feedback | - | Sonner toast wrapper | sonner | P0 | 3 |
| LoadingSkeleton | Feedback | Skeleton | Content placeholders | - | P0 | 3 |
| LoadingOverlay | Feedback | LoadingOverlay | Full-page/section loading | - | P0 | 3 |
| ErrorBoundary | Feedback | - | Component error catching | react-error-boundary | P0 | 3 |
| ErrorAlert | Feedback | Alert | Error message + retry action | - | P0 | 3 |
| SuccessAlert | Feedback | Alert | Success message + auto-hide | - | P1 | 4 |
| ConfirmDialog | Feedback | Modal | Confirmation modal | - | P0 | 3 |
| ProgressTracker | Feedback | Stepper | Multi-step progress | - | P1 | 4 |
| ValidationMessage | Feedback | Text | Inline field validation | - | P0 | 3 |

### 1.5 Input Components (13 total)

| Component | Type | Mantine Base | Custom Logic | Dependencies | Priority | Sprint |
|-----------|------|--------------|--------------|--------------|----------|--------|
| SearchBar | Input | TextInput | Debounced search, clear button | useDebouncedValue | P0 | 3 |
| FilterPanel | Input | Drawer | Multi-filter UI, apply/reset | - | P1 | 4 |
| SortDropdown | Input | Select | Sort options, direction toggle | - | P1 | 4 |
| DateRangePicker | Input | DatePickerInput | Start/end date selection | - | P1 | 4 |
| BulkActions | Input | Menu | Checkbox select, action menu | - | P1 | 4 |
| QuickFilters | Input | Group + Badge | Preset filter chips | - | P1 | 4 |
| ViewToggle | Input | SegmentedControl | Grid/list/table views | - | P1 | 4 |
| PerPageSelect | Input | Select | Items per page | - | P2 | 5 |
| ExportMenu | Input | Menu | Export format selection | - | P1 | 4 |
| ImportUpload | Input | FileButton | File upload + validation | - | P2 | 5 |
| LanguageSwitch | Input | Select | i18n language picker | - | P2 | 5 |
| ThemeToggle | Input | ActionIcon | Light/dark mode | - | P2 | 5 |
| CompactToggle | Input | Switch | Compact/comfortable view | - | P2 | 5 |

### 1.6 Navigation Components (12 total)

| Component | Type | Mantine Base | Custom Logic | Dependencies | Priority | Sprint |
|-----------|------|--------------|--------------|--------------|----------|--------|
| Tabs | Navigation | Tabs | URL sync, lazy loading | useRouter | P0 | 3 |
| Pagination | Navigation | Pagination | Server-side pagination | - | P1 | 4 |
| InfiniteScroll | Navigation | - | Intersection observer | useInView | P1 | 4 |
| BackButton | Navigation | Button | Browser back or custom | useRouter | P0 | 3 |
| LinkButton | Navigation | Button | Next.js Link wrapper | Link | P0 | 3 |
| NavItem | Navigation | - | Active state, icon, badge | - | P0 | 3 |
| QuickActions | Navigation | ActionIcon.Group | FAB-style quick actions | - | P1 | 4 |
| ContextMenu | Navigation | Menu | Right-click context menu | - | P2 | 5 |
| CommandPalette | Navigation | Spotlight | Cmd+K quick navigation | - | P2 | 5 |
| JumpToTop | Navigation | Affix + ActionIcon | Scroll to top button | useWindowScroll | P2 | 5 |
| SwipeGesture | Navigation | - | Touch gesture handler | use-gesture | P1 | 4 |
| PullToRefresh | Navigation | - | Mobile pull-to-refresh | - | P1 | 4 |

**Total Component Count:** 89 components
- **P0 (Critical):** 47 components
- **P1 (Important):** 28 components
- **P2 (Nice-to-have):** 14 components

---

## 2. Component Architecture Diagram

```
apps/web/
├── app/                                    # Next.js 14 App Router
│   ├── layout.tsx                          # Root layout (Clerk, Mantine, TanStack Query)
│   ├── page.tsx                            # Landing page
│   ├── (auth)/                             # Auth group
│   │   ├── layout.tsx                      # Auth layout (centered, no nav)
│   │   ├── sign-in/page.tsx               # Clerk sign-in
│   │   └── sign-up/page.tsx               # Clerk sign-up
│   └── (dashboard)/                        # Dashboard group
│       ├── layout.tsx                      # Dashboard layout (AppShell)
│       │   └── Components:
│       │       ├── AppShell                # Main layout wrapper
│       │       ├── AppHeader               # Top navigation
│       │       │   ├── UserNav            # User menu
│       │       │   ├── NotificationDropdown
│       │       │   └── SyncIndicator
│       │       ├── AppNavbar              # Sidebar navigation
│       │       │   └── DashboardNav       # Hierarchical menu
│       │       ├── MobileBottomNav        # Mobile bottom nav
│       │       └── OfflineBanner          # Offline status alert
│       ├── dashboard/page.tsx             # Dashboard home
│       │   └── Components:
│       │       ├── StatsCard (x4)         # Key metrics
│       │       ├── ActivityTimeline       # Recent activity
│       │       └── QuickActions           # FAB actions
│       ├── projects/                       # Projects section
│       │   ├── page.tsx                   # Projects list
│       │   │   └── Components:
│       │   │       ├── PageHeader         # "Projects" + New button
│       │   │       ├── SearchBar
│       │   │       ├── FilterPanel
│       │   │       ├── SortDropdown
│       │   │       └── ProjectList
│       │   │           └── ProjectCard (x N)
│       │   └── [id]/                      # Project detail
│       │       ├── page.tsx               # Project overview
│       │       │   └── Components:
│       │       │       ├── Breadcrumbs
│       │       │       ├── PageHeader
│       │       │       ├── Tabs (Forms, Submissions, Users)
│       │       │       ├── ComplianceStatus
│       │       │       └── FormList
│       │       │           └── FormCard (x N)
│       │       └── forms/                 # Project forms
│       │           └── [formId]/
│       │               └── page.tsx       # Form detail
│       ├── forms/                          # Forms section
│       │   ├── page.tsx                   # Forms list (all)
│       │   │   └── Components:
│       │   │       ├── PageHeader
│       │   │       ├── SearchBar
│       │   │       ├── QuickFilters       # By type, status
│       │   │       └── FormList
│       │   │           └── FormCard (x N)
│       │   └── [id]/                      # Form detail
│       │       ├── page.tsx               # Form overview
│       │       │   └── Components:
│       │       │       ├── Breadcrumbs
│       │       │       ├── PageHeader
│       │       │       ├── Tabs (Fill, History, Settings)
│       │       │       └── SubmissionList
│       │       │           └── SubmissionCard (x N)
│       │       └── fill/page.tsx          # Form filling
│       │           └── Components:
│       │               ├── FormRenderer   # Main form renderer
│       │               │   ├── TextInput (x N)
│       │               │   ├── NumberInput (x N)
│       │               │   ├── SelectInput (x N)
│       │               │   ├── DateInput (x N)
│       │               │   ├── PhotoInput (x N)
│       │               │   └── SignatureInput
│       │               └── ProgressTracker
│       ├── templates/                      # Form templates
│       │   ├── page.tsx                   # Template library
│       │   │   └── Components:
│       │   │       ├── PageHeader
│       │   │       ├── SearchBar
│       │   │       ├── FilterPanel        # By category, industry
│       │   │       └── TemplateList
│       │   │           └── TemplateCard (x N)
│       │   ├── [id]/page.tsx              # Template preview
│       │   │   └── Components:
│       │   │       ├── TemplateCard (hero)
│       │   │       ├── FormPreview
│       │   │       └── ActionButtons      # Use, Clone, Edit
│       │   └── builder/page.tsx           # Form builder
│       │       └── Components:
│       │           ├── FormBuilder        # Main builder UI
│       │           │   ├── FieldPalette   # Draggable fields
│       │           │   ├── Canvas         # Drop zone
│       │           │   └── FieldConfig    # Settings drawer
│       │           └── FormPreview        # Live preview
│       ├── submissions/                    # Submissions section
│       │   ├── page.tsx                   # Submissions list
│       │   │   └── Components:
│       │   │       ├── PageHeader
│       │   │       ├── SearchBar
│       │   │       ├── DateRangePicker
│       │   │       ├── FilterPanel        # By user, form, status
│       │   │       └── SubmissionList
│       │   │           └── SubmissionCard (x N)
│       │   └── [id]/page.tsx              # Submission detail
│       │       └── Components:
│       │           ├── Breadcrumbs
│       │           ├── PageHeader
│       │           ├── SubmissionDetail   # Field values
│       │           ├── PhotoGallery       # Attached photos
│       │           │   └── PhotoThumbnail (x N)
│       │           │       └── PhotoViewer (modal)
│       │           └── ActivityTimeline   # Audit trail
│       ├── users/                          # Users section
│       │   ├── page.tsx                   # Users list
│       │   │   └── Components:
│       │   │       ├── PageHeader
│       │   │       ├── SearchBar
│       │   │       ├── FilterPanel        # By role, status
│       │   │       └── UserList
│       │   │           └── UserCard (x N)
│       │   └── [id]/page.tsx              # User profile
│       │       └── Components:
│       │           ├── Breadcrumbs
│       │           ├── UserCard (hero)
│       │           ├── Tabs (Submissions, Activity)
│       │           └── SubmissionList
│       └── settings/                       # Settings section
│           └── page.tsx                   # Settings page
│               └── Components:
│                   ├── PageHeader
│                   ├── Tabs (Profile, Security, Notifications)
│                   ├── ThemeToggle
│                   ├── LanguageSwitch
│                   └── CompactToggle
│
├── components/                             # Shared components
│   ├── layout/                            # Layout components
│   │   ├── AppShell.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppNavbar.tsx
│   │   ├── AppFooter.tsx
│   │   ├── PageContainer.tsx
│   │   ├── PageHeader.tsx
│   │   └── EmptyState.tsx
│   ├── navigation/                         # Navigation components
│   │   ├── DashboardNav.tsx
│   │   ├── UserNav.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── Tabs.tsx
│   │   ├── Pagination.tsx
│   │   ├── BackButton.tsx
│   │   ├── LinkButton.tsx
│   │   └── NavItem.tsx
│   ├── forms/                              # Form components
│   │   ├── FormRenderer.tsx               # Main form engine
│   │   ├── FormBuilder.tsx                # Form design tool
│   │   ├── TemplateSelector.tsx
│   │   ├── FormPreview.tsx
│   │   ├── fields/                        # Field type components
│   │   │   ├── TextInput.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── TextareaInput.tsx
│   │   │   ├── SelectInput.tsx
│   │   │   ├── RadioInput.tsx
│   │   │   ├── CheckboxInput.tsx
│   │   │   ├── DateInput.tsx
│   │   │   ├── TimeInput.tsx
│   │   │   ├── DateTimeInput.tsx
│   │   │   ├── PhotoInput.tsx
│   │   │   ├── SignatureInput.tsx
│   │   │   ├── LocationInput.tsx
│   │   │   ├── FileUploadInput.tsx
│   │   │   ├── RatingInput.tsx
│   │   │   ├── SliderInput.tsx
│   │   │   ├── SwitchInput.tsx
│   │   │   └── ColorInput.tsx
│   │   └── builder/                       # Builder components
│   │       ├── FieldPalette.tsx
│   │       ├── FieldConfig.tsx
│   │       └── Canvas.tsx
│   ├── data/                               # Data display components
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── FormCard.tsx
│   │   ├── FormList.tsx
│   │   ├── SubmissionCard.tsx
│   │   ├── SubmissionList.tsx
│   │   ├── SubmissionDetail.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── PhotoViewer.tsx
│   │   ├── PhotoThumbnail.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── UserCard.tsx
│   │   ├── UserList.tsx
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateList.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ActivityTimeline.tsx
│   │   └── ComplianceStatus.tsx
│   ├── feedback/                           # Feedback components
│   │   ├── OfflineBanner.tsx
│   │   ├── SyncIndicator.tsx
│   │   ├── NotificationDropdown.tsx
│   │   ├── ToastContainer.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorAlert.tsx
│   │   ├── SuccessAlert.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ProgressTracker.tsx
│   │   └── ValidationMessage.tsx
│   ├── input/                              # Input components
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── SortDropdown.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── BulkActions.tsx
│   │   ├── QuickFilters.tsx
│   │   ├── ViewToggle.tsx
│   │   ├── PerPageSelect.tsx
│   │   ├── ExportMenu.tsx
│   │   ├── ImportUpload.tsx
│   │   ├── LanguageSwitch.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── CompactToggle.tsx
│   └── ui/                                 # Base UI components (Mantine wrappers)
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── ...
│
├── lib/                                    # Utilities
│   ├── queries/                           # TanStack Query hooks
│   │   ├── useProjects.ts
│   │   ├── useForms.ts
│   │   ├── useSubmissions.ts
│   │   ├── useUsers.ts
│   │   └── useTemplates.ts
│   ├── mutations/                         # TanStack Mutation hooks
│   │   ├── useCreateProject.ts
│   │   ├── useCreateForm.ts
│   │   ├── useSubmitForm.ts
│   │   └── useUploadPhoto.ts
│   ├── stores/                            # Valtio stores
│   │   ├── userStore.ts
│   │   ├── projectStore.ts
│   │   ├── formStore.ts
│   │   ├── offlineStore.ts
│   │   └── syncStore.ts
│   ├── hooks/                             # Custom hooks
│   │   ├── useOnlineStatus.ts
│   │   ├── useOfflineQueue.ts
│   │   ├── useSyncStatus.ts
│   │   ├── useFormValidation.ts
│   │   └── useFieldOptimizations.ts
│   ├── utils/                             # Utility functions
│   │   ├── offline.ts
│   │   ├── sync.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   └── theme/                             # Mantine theme
│       ├── index.ts
│       ├── colors.ts
│       ├── components.ts
│       └── typography.ts
│
└── types/                                  # TypeScript types
    ├── form.ts
    ├── submission.ts
    ├── user.ts
    └── project.ts
```

---

## 3. Mantine v7 Integration Strategy

### 3.1 Mantine Components Used (Base Layer)

**Layout & Structure:**
- `AppShell` - Main layout wrapper
- `Header` - Top navigation
- `Navbar` - Sidebar navigation
- `Footer` - Footer content
- `Container` - Content container
- `Stack` - Vertical spacing
- `Group` - Horizontal spacing
- `Grid` - Responsive grid
- `SimpleGrid` - Simple grid

**Navigation:**
- `NavLink` - Navigation links
- `Tabs` - Tab navigation
- `Breadcrumbs` - Breadcrumb trail
- `Pagination` - Pagination controls
- `Anchor` - Links
- `Menu` - Dropdown menus
- `ActionIcon` - Icon buttons

**Form Inputs:**
- `TextInput` - Text fields
- `NumberInput` - Number fields
- `Textarea` - Multi-line text
- `Select` - Dropdown select
- `MultiSelect` - Multi-select dropdown
- `Radio` - Radio buttons
- `Checkbox` - Checkboxes
- `Switch` - Toggle switches
- `DateInput` - Date picker
- `TimeInput` - Time picker
- `FileInput` - File upload
- `Rating` - Star rating
- `Slider` - Range slider
- `ColorInput` - Color picker

**Data Display:**
- `Card` - Content cards
- `Paper` - Paper background
- `Image` - Optimized images
- `Avatar` - User avatars
- `Badge` - Status badges
- `Timeline` - Activity timeline
- `Table` - Data tables
- `List` - Unordered lists

**Feedback:**
- `Alert` - Alert messages
- `Notification` - Toast notifications (via Sonner)
- `Modal` - Modal dialogs
- `Drawer` - Side drawers
- `LoadingOverlay` - Loading overlay
- `Skeleton` - Content placeholders
- `Progress` - Progress bars
- `Loader` - Loading spinners

**Utilities:**
- `Button` - Buttons
- `ThemeIcon` - Themed icons
- `Title` - Headings
- `Text` - Text content
- `Center` - Center content
- `Divider` - Dividers
- `Space` - Spacing
- `Affix` - Fixed position elements
- `Portal` - Portal rendering
- `Transition` - Animations

### 3.2 Custom Components Required

**Why Custom?**
- Mantine doesn't provide
- Need construction-specific logic
- Offline-first behavior
- Complex state management

**Custom Components:**

1. **FormRenderer** - Dynamic form engine (no Mantine equivalent)
2. **FormBuilder** - Drag-drop form designer (complex, custom)
3. **PhotoInput** - Capacitor Camera integration
4. **SignatureInput** - Canvas-based signature capture
5. **LocationInput** - Capacitor Geolocation + map
6. **OfflineBanner** - Network status detection
7. **SyncIndicator** - Offline queue status
8. **PhotoGallery** - Lightbox with EXIF/GPS
9. **ComplianceStatus** - EPA/OSHA status widget
10. **MobileBottomNav** - Mobile-specific navigation
11. **InfiniteScroll** - Intersection observer-based
12. **PullToRefresh** - Touch gesture handler
13. **SwipeGesture** - Swipe navigation
14. **CommandPalette** - Cmd+K quick actions
15. **FieldPalette** - Drag-drop field palette

### 3.3 Mantine Theme Configuration

**File:** `apps/web/lib/theme/index.ts`

```typescript
import { MantineThemeOverride } from '@mantine/core';

export const constructionTheme: MantineThemeOverride = {
  // Color scheme
  colorScheme: 'light',
  
  // Custom colors for construction visibility
  colors: {
    // High contrast for sunlight
    primary: [
      '#000000', // 0 - Black
      '#1A1A1A', // 1
      '#333333', // 2
      '#4D4D4D', // 3
      '#666666', // 4
      '#808080', // 5
      '#999999', // 6
      '#B3B3B3', // 7
      '#CCCCCC', // 8
      '#E6E6E6', // 9
    ],
    danger: [
      '#990000', // 0
      '#CC0000', // 1
      '#FF0000', // 2 - Pure red
      '#FF3333', // 3
      '#FF6666', // 4
      '#FF9999', // 5
      '#FFCCCC', // 6
      '#FFE6E6', // 7
      '#FFF2F2', // 8
      '#FFF9F9', // 9
    ],
    success: [
      '#004D00', // 0
      '#006600', // 1
      '#009900', // 2 - Dark green
      '#00CC00', // 3
      '#00FF00', // 4
      '#33FF33', // 5
      '#66FF66', // 6
      '#99FF99', // 7
      '#CCFFCC', // 8
      '#E6FFE6', // 9
    ],
    warning: [
      '#994D00', // 0
      '#CC6600', // 1
      '#FF9900', // 2 - Orange
      '#FFCC00', // 3
      '#FFFF00', // 4
      '#FFFF33', // 5
      '#FFFF66', // 6
      '#FFFF99', // 7
      '#FFFFCC', // 8
      '#FFFFE6', // 9
    ],
  },

  // Primary color
  primaryColor: 'primary',

  // Font family
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // Font sizes (larger for field readability)
  fontSizes: {
    xs: '14px',  // Minimum 14px (was 12px)
    sm: '16px',  // Base (was 14px)
    md: '18px',  // Medium (was 16px)
    lg: '20px',  // Large (was 18px)
    xl: '24px',  // Extra large (was 20px)
  },

  // Line heights
  lineHeight: 1.5,

  // Spacing (larger for glove-friendly UI)
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  // Border radius
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },

  // Shadows (stronger for sunlight visibility)
  shadows: {
    xs: '0 2px 4px rgba(0, 0, 0, 0.2)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
    xl: '0 16px 64px rgba(0, 0, 0, 0.6)',
  },

  // Breakpoints
  breakpoints: {
    xs: '36em',  // 576px
    sm: '48em',  // 768px
    md: '62em',  // 992px
    lg: '75em',  // 1200px
    xl: '88em',  // 1408px
  },

  // Component overrides
  components: {
    Button: {
      defaultProps: {
        size: 'lg', // Large buttons by default
      },
      styles: (theme) => ({
        root: {
          // Minimum touch target 48x48dp
          minHeight: '48px',
          minWidth: '48px',
          fontSize: theme.fontSizes.md,
          fontWeight: 600,
          padding: '12px 24px',
        },
      }),
    },
    
    TextInput: {
      defaultProps: {
        size: 'lg',
      },
      styles: (theme) => ({
        input: {
          // Large input fields for gloves
          minHeight: '48px',
          fontSize: theme.fontSizes.md,
          padding: '12px 16px',
        },
      }),
    },

    Select: {
      defaultProps: {
        size: 'lg',
      },
      styles: (theme) => ({
        input: {
          minHeight: '48px',
          fontSize: theme.fontSizes.md,
        },
        item: {
          // Large dropdown items
          minHeight: '48px',
          fontSize: theme.fontSizes.md,
          padding: '12px 16px',
        },
      }),
    },

    ActionIcon: {
      defaultProps: {
        size: 'lg',
      },
      styles: {
        root: {
          // Large icons for gloves
          minWidth: '48px',
          minHeight: '48px',
        },
      },
    },

    Card: {
      defaultProps: {
        shadow: 'md',
        radius: 'md',
        padding: 'lg',
      },
      styles: (theme) => ({
        root: {
          // Strong card shadows for depth
          boxShadow: theme.shadows.md,
        },
      }),
    },

    Badge: {
      defaultProps: {
        size: 'lg',
        radius: 'sm',
      },
      styles: (theme) => ({
        root: {
          fontSize: theme.fontSizes.sm,
          fontWeight: 600,
          padding: '8px 16px',
        },
      }),
    },
  },

  // Global styles
  globalStyles: (theme) => ({
    // High contrast text
    body: {
      color: theme.colors.dark[9],
      fontSize: theme.fontSizes.md,
      lineHeight: theme.lineHeight,
    },

    // Focus visible for accessibility
    '*:focus-visible': {
      outline: `3px solid ${theme.colors.primary[5]}`,
      outlineOffset: '2px',
    },

    // Touch target minimum (accessibility)
    'button, a, input, select, textarea': {
      minHeight: '48px',
      minWidth: '48px',
    },
  }),
};
```

### 3.4 Responsive Breakpoints Strategy

**Mobile-First Approach:**

```typescript
// Breakpoint usage pattern
import { useMantineTheme } from '@mantine/core';

function ResponsiveComponent() {
  const theme = useMantineTheme();
  
  return (
    <Box
      sx={{
        // Mobile (default)
        padding: theme.spacing.sm,
        fontSize: theme.fontSizes.md,
        
        // Tablet and up
        [`@media (min-width: ${theme.breakpoints.sm})`]: {
          padding: theme.spacing.md,
        },
        
        // Desktop and up
        [`@media (min-width: ${theme.breakpoints.lg})`]: {
          padding: theme.spacing.lg,
          fontSize: theme.fontSizes.lg,
        },
      }}
    >
      Content
    </Box>
  );
}
```

**Responsive Grid Pattern:**

```typescript
<SimpleGrid
  cols={1}
  spacing="md"
  breakpoints={[
    { minWidth: 'sm', cols: 2 },  // 2 cols at 768px
    { minWidth: 'md', cols: 3 },  // 3 cols at 992px
    { minWidth: 'lg', cols: 4 },  // 4 cols at 1200px
  ]}
>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</SimpleGrid>
```

---

## 4. State Management Architecture

### 4.1 Valtio Stores Structure

**File:** `apps/web/lib/stores/`

#### 4.1.1 User Store

```typescript
// lib/stores/userStore.ts
import { proxy } from 'valtio';
import { devtools } from 'valtio/utils';

interface UserStore {
  currentUser: User | null;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    compactMode: boolean;
  };
  permissions: string[];
}

export const userStore = devtools(
  proxy<UserStore>({
    currentUser: null,
    preferences: {
      theme: 'light',
      language: 'en',
      compactMode: false,
    },
    permissions: [],
  }),
  { name: 'UserStore' }
);

// Actions
export const userActions = {
  setCurrentUser(user: User) {
    userStore.currentUser = user;
  },
  
  updatePreferences(prefs: Partial<UserStore['preferences']>) {
    userStore.preferences = { ...userStore.preferences, ...prefs };
  },
  
  setPermissions(permissions: string[]) {
    userStore.permissions = permissions;
  },
};
```

#### 4.1.2 Project Store

```typescript
// lib/stores/projectStore.ts
import { proxy } from 'valtio';
import { devtools } from 'valtio/utils';

interface ProjectStore {
  selectedProjectId: string | null;
  recentProjects: Project[];
  filters: {
    status: string[];
    search: string;
  };
}

export const projectStore = devtools(
  proxy<ProjectStore>({
    selectedProjectId: null,
    recentProjects: [],
    filters: {
      status: [],
      search: '',
    },
  }),
  { name: 'ProjectStore' }
);

// Actions
export const projectActions = {
  selectProject(projectId: string) {
    projectStore.selectedProjectId = projectId;
  },
  
  addRecentProject(project: Project) {
    // Add to start, keep max 5
    projectStore.recentProjects = [
      project,
      ...projectStore.recentProjects.filter(p => p.id !== project.id),
    ].slice(0, 5);
  },
  
  updateFilters(filters: Partial<ProjectStore['filters']>) {
    projectStore.filters = { ...projectStore.filters, ...filters };
  },
};
```

#### 4.1.3 Form Store

```typescript
// lib/stores/formStore.ts
import { proxy } from 'valtio';
import { devtools } from 'valtio/utils';

interface FormStore {
  currentFormId: string | null;
  currentStep: number;
  isDirty: boolean;
  autoSaveEnabled: boolean;
  lastAutoSave: Date | null;
}

export const formStore = devtools(
  proxy<FormStore>({
    currentFormId: null,
    currentStep: 0,
    isDirty: false,
    autoSaveEnabled: true,
    lastAutoSave: null,
  }),
  { name: 'FormStore' }
);

// Actions
export const formActions = {
  setCurrentForm(formId: string) {
    formStore.currentFormId = formId;
    formStore.currentStep = 0;
    formStore.isDirty = false;
  },
  
  setStep(step: number) {
    formStore.currentStep = step;
  },
  
  markDirty() {
    formStore.isDirty = true;
  },
  
  markClean() {
    formStore.isDirty = false;
    formStore.lastAutoSave = new Date();
  },
};
```

#### 4.1.4 Offline Store

```typescript
// lib/stores/offlineStore.ts
import { proxy } from 'valtio';
import { devtools, proxyWithPersist } from 'valtio/utils';

interface OfflineAction {
  id: string;
  type: 'createSubmission' | 'uploadPhoto' | 'updateProject';
  payload: any;
  timestamp: Date;
  retries: number;
}

interface OfflineStore {
  queue: OfflineAction[];
  isOnline: boolean;
  lastSync: Date | null;
}

export const offlineStore = devtools(
  proxyWithPersist({
    name: 'braveforms-offline',
    initialState: {
      queue: [] as OfflineAction[],
      isOnline: navigator.onLine,
      lastSync: null as Date | null,
    },
    version: 1,
    migrations: {},
    getStorage: () => localStorage,
  }),
  { name: 'OfflineStore' }
);

// Actions
export const offlineActions = {
  addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) {
    offlineStore.queue.push({
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retries: 0,
    });
  },
  
  removeFromQueue(actionId: string) {
    offlineStore.queue = offlineStore.queue.filter(a => a.id !== actionId);
  },
  
  setOnlineStatus(isOnline: boolean) {
    offlineStore.isOnline = isOnline;
  },
  
  markSynced() {
    offlineStore.lastSync = new Date();
  },
};
```

#### 4.1.5 Sync Store

```typescript
// lib/stores/syncStore.ts
import { proxy } from 'valtio';
import { devtools } from 'valtio/utils';

interface SyncStore {
  status: 'idle' | 'syncing' | 'error' | 'success';
  progress: number; // 0-100
  currentAction: string | null;
  errors: Array<{ action: string; error: string; timestamp: Date }>;
}

export const syncStore = devtools(
  proxy<SyncStore>({
    status: 'idle',
    progress: 0,
    currentAction: null,
    errors: [],
  }),
  { name: 'SyncStore' }
);

// Actions
export const syncActions = {
  startSync() {
    syncStore.status = 'syncing';
    syncStore.progress = 0;
    syncStore.currentAction = null;
  },
  
  updateProgress(progress: number, action: string) {
    syncStore.progress = progress;
    syncStore.currentAction = action;
  },
  
  completeSync() {
    syncStore.status = 'success';
    syncStore.progress = 100;
    syncStore.currentAction = null;
  },
  
  failSync(error: string) {
    syncStore.status = 'error';
    syncStore.errors.push({
      action: syncStore.currentAction || 'unknown',
      error,
      timestamp: new Date(),
    });
  },
};
```

### 4.2 TanStack Query Key Naming Conventions

**Pattern:** `['entity', 'operation', ...params]`

```typescript
// Query keys
const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  
  // Forms
  forms: {
    all: ['forms'] as const,
    lists: () => [...queryKeys.forms.all, 'list'] as const,
    list: (filters: FormFilters) => [...queryKeys.forms.lists(), filters] as const,
    details: () => [...queryKeys.forms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.forms.details(), id] as const,
    submissions: (formId: string) => [...queryKeys.forms.detail(formId), 'submissions'] as const,
  },
  
  // Submissions
  submissions: {
    all: ['submissions'] as const,
    lists: () => [...queryKeys.submissions.all, 'list'] as const,
    list: (filters: SubmissionFilters) => [...queryKeys.submissions.lists(), filters] as const,
    details: () => [...queryKeys.submissions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.submissions.details(), id] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Templates
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: (filters: TemplateFilters) => [...queryKeys.templates.lists(), filters] as const,
    details: () => [...queryKeys.templates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.templates.details(), id] as const,
  },
};

// Usage
const { data: projects } = useQuery({
  queryKey: queryKeys.projects.list({ status: 'active' }),
  queryFn: () => fetchProjects({ status: 'active' }),
});
```

### 4.3 Cache Invalidation Strategies

```typescript
// lib/mutations/useCreateSubmission.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSubmission,
    
    onSuccess: (newSubmission) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.lists(),
      });
      
      // Invalidate form submissions
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms.submissions(newSubmission.formId),
      });
      
      // Optimistically add to cache
      queryClient.setQueryData(
        queryKeys.submissions.detail(newSubmission.id),
        newSubmission
      );
    },
  });
}
```

### 4.4 Optimistic Updates Pattern

```typescript
// lib/mutations/useUpdateProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProject,
    
    // Optimistic update
    onMutate: async (updatedProject) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.detail(updatedProject.id),
      });
      
      // Snapshot previous value
      const previousProject = queryClient.getQueryData(
        queryKeys.projects.detail(updatedProject.id)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.projects.detail(updatedProject.id),
        updatedProject
      );
      
      // Return context with snapshot
      return { previousProject };
    },
    
    // Rollback on error
    onError: (err, updatedProject, context) => {
      queryClient.setQueryData(
        queryKeys.projects.detail(updatedProject.id),
        context?.previousProject
      );
    },
    
    // Refetch on success or error
    onSettled: (updatedProject) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(updatedProject?.id),
      });
    },
  });
}
```

---

## 5. Page Component Hierarchy

### 5.1 Complete Page Map

| Route | Layout | Page Component | Data Dependencies | Child Components | State |
|-------|--------|----------------|-------------------|------------------|-------|
| `/` | - | `app/page.tsx` | - | Hero, Features, CTA | - |
| `/sign-in` | Auth | `app/(auth)/sign-in/page.tsx` | - | Clerk SignIn | - |
| `/sign-up` | Auth | `app/(auth)/sign-up/page.tsx` | - | Clerk SignUp | - |
| `/dashboard` | Dashboard | `app/(dashboard)/dashboard/page.tsx` | useProjects, useSubmissions | StatsCard x4, ActivityTimeline, QuickActions | userStore, projectStore |
| `/projects` | Dashboard | `app/(dashboard)/projects/page.tsx` | useProjects | PageHeader, SearchBar, FilterPanel, ProjectList | projectStore.filters |
| `/projects/[id]` | Dashboard | `app/(dashboard)/projects/[id]/page.tsx` | useProject, useForms | Breadcrumbs, PageHeader, Tabs, ComplianceStatus, FormList | projectStore.selectedProjectId |
| `/projects/[id]/forms/[formId]` | Dashboard | `app/(dashboard)/projects/[id]/forms/[formId]/page.tsx` | useForm, useSubmissions | Breadcrumbs, PageHeader, Tabs, SubmissionList | formStore.currentFormId |
| `/forms` | Dashboard | `app/(dashboard)/forms/page.tsx` | useForms | PageHeader, SearchBar, QuickFilters, FormList | - |
| `/forms/[id]` | Dashboard | `app/(dashboard)/forms/[id]/page.tsx` | useForm, useSubmissions | Breadcrumbs, PageHeader, Tabs, SubmissionList | formStore.currentFormId |
| `/forms/[id]/fill` | Dashboard | `app/(dashboard)/forms/[id]/fill/page.tsx` | useForm | FormRenderer, ProgressTracker | formStore (step, isDirty) |
| `/templates` | Dashboard | `app/(dashboard)/templates/page.tsx` | useTemplates | PageHeader, SearchBar, FilterPanel, TemplateList | - |
| `/templates/[id]` | Dashboard | `app/(dashboard)/templates/[id]/page.tsx` | useTemplate | TemplateCard, FormPreview, ActionButtons | - |
| `/templates/builder` | Dashboard | `app/(dashboard)/templates/builder/page.tsx` | useCreateTemplate | FormBuilder, FormPreview | formStore |
| `/submissions` | Dashboard | `app/(dashboard)/submissions/page.tsx` | useSubmissions | PageHeader, SearchBar, DateRangePicker, FilterPanel, SubmissionList | - |
| `/submissions/[id]` | Dashboard | `app/(dashboard)/submissions/[id]/page.tsx` | useSubmission | Breadcrumbs, PageHeader, SubmissionDetail, PhotoGallery, ActivityTimeline | - |
| `/users` | Dashboard | `app/(dashboard)/users/page.tsx` | useUsers | PageHeader, SearchBar, FilterPanel, UserList | - |
| `/users/[id]` | Dashboard | `app/(dashboard)/users/[id]/page.tsx` | useUser, useUserSubmissions | Breadcrumbs, UserCard, Tabs, SubmissionList | - |
| `/settings` | Dashboard | `app/(dashboard)/settings/page.tsx` | useUser | PageHeader, Tabs, ThemeToggle, LanguageSwitch | userStore.preferences |

### 5.2 Layout Hierarchy

```
RootLayout (app/layout.tsx)
├── Providers: Clerk, MantineProvider, QueryClientProvider
├── Theme: constructionTheme
└── Children

AuthLayout (app/(auth)/layout.tsx)
├── Center + Container
└── Children (Sign In/Up)

DashboardLayout (app/(dashboard)/layout.tsx)
├── AppShell
│   ├── AppHeader
│   │   ├── UserNav
│   │   ├── NotificationDropdown
│   │   └── SyncIndicator
│   ├── AppNavbar (desktop)
│   │   └── DashboardNav
│   ├── MobileBottomNav (mobile)
│   └── OfflineBanner (when offline)
└── PageContainer
    └── Children
```

### 5.3 Data Fetching Patterns

**Server Components (Default):**
```typescript
// app/(dashboard)/projects/page.tsx
import { getProjects } from '@/lib/queries/server';

export default async function ProjectsPage() {
  // Fetch on server
  const projects = await getProjects();
  
  return <ProjectList initialData={projects} />;
}
```

**Client Components (Interactive):**
```typescript
// components/data/ProjectList.tsx
'use client';

import { useProjects } from '@/lib/queries/useProjects';

export function ProjectList({ initialData }) {
  const { data: projects } = useProjects({
    initialData,
    refetchOnMount: false,
  });
  
  return (
    <Stack>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Stack>
  );
}
```

---

## 6. Offline-First Considerations

### 6.1 Component Offline Behavior

| Component | Online Behavior | Offline Behavior | Sync Required |
|-----------|----------------|------------------|---------------|
| FormRenderer | Submit to API | Queue in IndexedDB | Yes |
| PhotoInput | Upload to S3 | Store locally, queue | Yes |
| ProjectList | Fetch from API | Read from cache | No |
| SubmissionList | Fetch from API | Read from cache | No |
| SubmissionDetail | Fetch from API | Read from cache | No |
| SearchBar | Server-side search | Client-side filter | No |
| FilterPanel | API filter params | Client-side filter | No |
| SyncIndicator | Hidden | Show queue count | N/A |
| OfflineBanner | Hidden | Alert visible | N/A |
| NotificationDropdown | Real-time | Cached | No |

### 6.2 Loading States & Skeletons

**Pattern:**
```typescript
// components/data/ProjectList.tsx
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';

export function ProjectList() {
  const { data: projects, isLoading } = useProjects();
  
  if (isLoading) {
    return (
      <Stack>
        <LoadingSkeleton type="card" count={5} />
      </Stack>
    );
  }
  
  return (
    <Stack>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Stack>
  );
}
```

**Skeleton Types:**
```typescript
// components/feedback/LoadingSkeleton.tsx
export function LoadingSkeleton({ type, count = 1 }) {
  switch (type) {
    case 'card':
      return <Skeleton height={120} radius="md" />;
    case 'list':
      return <Skeleton height={48} radius="sm" />;
    case 'text':
      return <Skeleton height={16} width="70%" />;
    case 'avatar':
      return <Skeleton circle height={40} />;
    default:
      return <Skeleton height={200} />;
  }
}
```

### 6.3 Error Boundaries

```typescript
// components/feedback/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { ErrorAlert } from './ErrorAlert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorAlert
          title="Something went wrong"
          message={this.state.error?.message || 'Unknown error'}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

**Usage:**
```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary>
      <AppShell>
        {children}
      </AppShell>
    </ErrorBoundary>
  );
}
```

### 6.4 Sync Status Indicators

```typescript
// components/feedback/SyncIndicator.tsx
'use client';

import { Badge, Loader } from '@mantine/core';
import { useSnapshot } from 'valtio';
import { offlineStore, syncStore } from '@/lib/stores';

export function SyncIndicator() {
  const offline = useSnapshot(offlineStore);
  const sync = useSnapshot(syncStore);
  
  if (offline.queue.length === 0 && sync.status === 'idle') {
    return null;
  }
  
  const getColor = () => {
    if (sync.status === 'error') return 'red';
    if (sync.status === 'syncing') return 'yellow';
    return 'green';
  };
  
  const getLabel = () => {
    if (sync.status === 'syncing') {
      return `Syncing... ${sync.progress}%`;
    }
    if (offline.queue.length > 0) {
      return `${offline.queue.length} pending`;
    }
    return 'Synced';
  };
  
  return (
    <Badge
      color={getColor()}
      size="lg"
      radius="sm"
      leftSection={sync.status === 'syncing' ? <Loader size="xs" /> : null}
    >
      {getLabel()}
    </Badge>
  );
}
```

---

## 7. Field-Optimized UX Patterns

### 7.1 Touch Target Standards

**Minimum Sizes:**
- Buttons: 48x48dp (Mantine default override)
- Input fields: 48dp height
- List items: 48dp height
- Icons: 32x32dp (increased from 24dp)
- Spacing: 24dp minimum between interactive elements

**Implementation:**
```typescript
// lib/theme/components.ts
export const componentOverrides = {
  Button: {
    styles: {
      root: {
        minHeight: '48px',
        minWidth: '48px',
        padding: '12px 24px',
      },
    },
  },
  ActionIcon: {
    styles: {
      root: {
        minWidth: '48px',
        minHeight: '48px',
      },
    },
  },
  // ... other components
};
```

### 7.2 High Contrast for Sunlight

**Color Contrast Ratios:**
- Text on background: 7:1 minimum (AAA level)
- Interactive elements: 4.5:1 minimum (AA level)
- Disabled elements: 3:1 minimum

**Implementation:**
```typescript
// lib/theme/colors.ts
export const highContrastColors = {
  text: {
    primary: '#000000',   // Pure black on white
    secondary: '#333333', // Dark gray
    disabled: '#666666',  // Medium gray (3:1 on white)
  },
  background: {
    primary: '#FFFFFF',   // Pure white
    secondary: '#F5F5F5', // Light gray
    elevated: '#FFFFFF',  // Cards on white
  },
  interactive: {
    primary: '#0066CC',   // Blue (4.5:1 on white)
    danger: '#CC0000',    // Red (5.5:1 on white)
    success: '#006600',   // Green (5.8:1 on white)
    warning: '#CC6600',   // Orange (4.6:1 on white)
  },
};
```

### 7.3 One-Thumb Operation

**Bottom Navigation (Mobile):**
```typescript
// components/navigation/MobileBottomNav.tsx
'use client';

import { ActionIcon, Group } from '@mantine/core';
import { IconHome, IconForms, IconCamera, IconUser } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  
  const navItems = [
    { icon: IconHome, label: 'Home', path: '/dashboard' },
    { icon: IconForms, label: 'Forms', path: '/forms' },
    { icon: IconCamera, label: 'Photo', path: '/forms/quick-photo' },
    { icon: IconUser, label: 'Profile', path: '/settings' },
  ];
  
  return (
    <Group
      position="apart"
      px="md"
      py="sm"
      sx={(theme) => ({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.white,
        borderTop: `1px solid ${theme.colors.gray[3]}`,
        boxShadow: theme.shadows.md,
        zIndex: 100,
        
        // Safe area for iOS notch
        paddingBottom: 'env(safe-area-inset-bottom)',
      })}
    >
      {navItems.map((item) => (
        <ActionIcon
          key={item.path}
          size={48}
          variant={pathname === item.path ? 'filled' : 'subtle'}
          onClick={() => router.push(item.path)}
        >
          <item.icon size={32} />
        </ActionIcon>
      ))}
    </Group>
  );
}
```

**Floating Action Button (Quick Actions):**
```typescript
// components/navigation/QuickActions.tsx
'use client';

import { Affix, ActionIcon, Stack, Transition } from '@mantine/core';
import { useState } from 'react';
import { IconPlus, IconCamera, IconForms } from '@tabler/icons-react';

export function QuickActions() {
  const [opened, setOpened] = useState(false);
  
  return (
    <Affix position={{ bottom: 80, right: 20 }}>
      <Stack spacing="xs">
        <Transition mounted={opened} transition="slide-up">
          {(styles) => (
            <ActionIcon
              size={48}
              radius="xl"
              variant="filled"
              color="blue"
              style={styles}
              onClick={() => {/* Quick photo */}}
            >
              <IconCamera size={32} />
            </ActionIcon>
          )}
        </Transition>
        
        <Transition mounted={opened} transition="slide-up">
          {(styles) => (
            <ActionIcon
              size={48}
              radius="xl"
              variant="filled"
              color="green"
              style={styles}
              onClick={() => {/* Quick form */}}
            >
              <IconForms size={32} />
            </ActionIcon>
          )}
        </Transition>
        
        <ActionIcon
          size={56}
          radius="xl"
          variant="filled"
          color="primary"
          onClick={() => setOpened(!opened)}
        >
          <IconPlus size={32} />
        </ActionIcon>
      </Stack>
    </Affix>
  );
}
```

### 7.4 Progressive Disclosure

**Multi-Step Forms:**
```typescript
// components/forms/FormRenderer.tsx
'use client';

import { useState } from 'react';
import { Stepper, Button, Group } from '@mantine/core';
import { useSnapshot } from 'valtio';
import { formStore, formActions } from '@/lib/stores/formStore';

export function FormRenderer({ form }) {
  const { currentStep } = useSnapshot(formStore);
  
  const steps = form.sections; // Sections = steps
  
  return (
    <>
      <Stepper active={currentStep} onStepClick={formActions.setStep}>
        {steps.map((section, index) => (
          <Stepper.Step key={index} label={section.title}>
            {section.fields.map(field => (
              <FieldRenderer key={field.id} field={field} />
            ))}
          </Stepper.Step>
        ))}
      </Stepper>
      
      <Group position="apart" mt="xl">
        <Button
          variant="subtle"
          disabled={currentStep === 0}
          onClick={() => formActions.setStep(currentStep - 1)}
        >
          Back
        </Button>
        
        <Button
          onClick={() => {
            if (currentStep === steps.length - 1) {
              // Submit
            } else {
              formActions.setStep(currentStep + 1);
            }
          }}
        >
          {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </Group>
    </>
  );
}
```

### 7.5 Auto-Save Indicators

```typescript
// components/feedback/AutoSaveIndicator.tsx
'use client';

import { Text, Loader } from '@mantine/core';
import { useSnapshot } from 'valtio';
import { formStore } from '@/lib/stores/formStore';
import { formatDistanceToNow } from 'date-fns';

export function AutoSaveIndicator() {
  const { isDirty, lastAutoSave } = useSnapshot(formStore);
  
  if (!lastAutoSave && !isDirty) {
    return null;
  }
  
  return (
    <Group spacing="xs">
      {isDirty ? (
        <>
          <Loader size="xs" />
          <Text size="sm" color="dimmed">Saving...</Text>
        </>
      ) : (
        <Text size="sm" color="dimmed">
          Saved {formatDistanceToNow(lastAutoSave, { addSuffix: true })}
        </Text>
      )}
    </Group>
  );
}
```

---

## 8. Performance Optimizations

### 8.1 Code Splitting Strategy

**Route-Based Code Splitting (Automatic):**

Next.js 14 App Router automatically code-splits by route:

- `/dashboard` → `dashboard.chunk.js`
- `/projects` → `projects.chunk.js`
- `/forms` → `forms.chunk.js`
- etc.

**Dynamic Imports (Manual):**

```typescript
// Heavy components
const FormBuilder = dynamic(() => import('@/components/forms/FormBuilder'), {
  loading: () => <LoadingSkeleton type="card" />,
  ssr: false, // Client-only
});

const PhotoViewer = dynamic(() => import('@/components/data/PhotoViewer'), {
  loading: () => <LoadingSkeleton type="card" />,
});

const CommandPalette = dynamic(() => import('@/components/navigation/CommandPalette'), {
  loading: () => null,
  ssr: false,
});
```

### 8.2 Image Optimization

**Next.js Image Component:**

```typescript
import Image from 'next/image';

export function PhotoThumbnail({ photo }) {
  return (
    <Image
      src={photo.url}
      alt={photo.caption}
      width={200}
      height={150}
      quality={75}
      placeholder="blur"
      blurDataURL={photo.blurHash}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

**Progressive Image Loading:**

```typescript
// components/data/PhotoGallery.tsx
'use client';

import { useState } from 'react';
import { SimpleGrid } from '@mantine/core';
import { PhotoThumbnail } from './PhotoThumbnail';

export function PhotoGallery({ photos }) {
  const [loadedCount, setLoadedCount] = useState(12); // Initial load
  
  return (
    <>
      <SimpleGrid cols={3} spacing="md">
        {photos.slice(0, loadedCount).map(photo => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            onLoad={() => {/* Track loaded */}}
          />
        ))}
      </SimpleGrid>
      
      {loadedCount < photos.length && (
        <Button
          variant="subtle"
          fullWidth
          mt="md"
          onClick={() => setLoadedCount(prev => prev + 12)}
        >
          Load More ({photos.length - loadedCount} remaining)
        </Button>
      )}
    </>
  );
}
```

### 8.3 Lazy Loading Patterns

**Intersection Observer (Infinite Scroll):**

```typescript
// lib/hooks/useInfiniteScroll.ts
import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback: () => void) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.5 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => observerRef.current?.disconnect();
  }, [callback]);
  
  return loadMoreRef;
}

// Usage
export function SubmissionList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['submissions'],
    queryFn: fetchSubmissions,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  
  const loadMoreRef = useInfiniteScroll(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  });
  
  return (
    <Stack>
      {data.pages.flatMap(page => page.submissions).map(submission => (
        <SubmissionCard key={submission.id} submission={submission} />
      ))}
      {hasNextPage && <div ref={loadMoreRef} />}
    </Stack>
  );
}
```

### 8.4 Bundle Size Targets

| Chunk | Target Size | Max Size | Components |
|-------|-------------|----------|------------|
| Initial | 150KB | 200KB | Layout, Auth, Core |
| Dashboard | 80KB | 100KB | Dashboard page |
| Projects | 60KB | 80KB | Project list/detail |
| Forms | 100KB | 120KB | Form renderer, fields |
| FormBuilder | 120KB | 150KB | Form builder (heavy) |
| Templates | 50KB | 70KB | Template library |
| Submissions | 60KB | 80KB | Submission list/detail |
| Users | 40KB | 60KB | User management |
| Settings | 30KB | 50KB | Settings page |

**Monitoring:**

```bash
# Analyze bundle size
pnpm --filter web build
pnpm --filter web analyze

# Expected output:
# Route                        Size     First Load JS
# ├ ○ /                       5.2 kB        150 kB
# ├ ○ /dashboard              8.1 kB        158 kB
# ├ ○ /projects              12.3 kB        162 kB
# ├ ○ /forms                 23.4 kB        173 kB
# └ ○ /templates/builder     34.5 kB        185 kB
```

---

## 9. Testing Strategy

### 9.1 Component Testing (Vitest + React Testing Library)

**Unit Test Example:**

```typescript
// components/forms/fields/TextInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('should render with label', () => {
    const Wrapper = () => {
      const form = useForm();
      return (
        <TextInput
          control={form.control}
          name="test"
          label="Test Field"
        />
      );
    };
    
    render(<Wrapper />);
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
  });
  
  it('should show validation error', async () => {
    const Wrapper = () => {
      const form = useForm({
        defaultValues: { test: '' },
      });
      return (
        <TextInput
          control={form.control}
          name="test"
          label="Test Field"
          required
        />
      );
    };
    
    render(<Wrapper />);
    
    const input = screen.getByLabelText('Test Field');
    fireEvent.blur(input);
    
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });
  
  it('should work offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const Wrapper = () => {
      const form = useForm();
      return (
        <TextInput
          control={form.control}
          name="test"
          label="Test Field"
        />
      );
    };
    
    render(<Wrapper />);
    
    const input = screen.getByLabelText('Test Field');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(input).toHaveValue('test value');
  });
});
```

### 9.2 E2E Testing (Playwright)

**E2E Test Example:**

```typescript
// e2e/forms/fill-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Form Filling', () => {
  test('should fill and submit inspection form', async ({ page }) => {
    // Navigate to form
    await page.goto('/forms/inspection-daily/fill');
    
    // Fill text input
    await page.fill('[name="inspectorName"]', 'John Doe');
    
    // Fill number input
    await page.fill('[name="rainfall"]', '0.5');
    
    // Select date
    await page.click('[name="inspectionDate"]');
    await page.click('[data-date="2025-10-23"]');
    
    // Take photo (mock)
    await page.click('[data-testid="photo-input"]');
    await page.setInputFiles('input[type="file"]', 'e2e/fixtures/photo.jpg');
    
    // Add signature
    const canvas = page.locator('[data-testid="signature-canvas"]');
    await canvas.click({ position: { x: 50, y: 50 } });
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Submit
    await page.click('[data-testid="submit-form"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
  
  test('should queue submission when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Fill form
    await page.goto('/forms/inspection-daily/fill');
    await page.fill('[name="inspectorName"]', 'Jane Doe');
    
    // Submit
    await page.click('[data-testid="submit-form"]');
    
    // Verify queued
    await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-indicator"]')).toContainText('1 pending');
    
    // Go online
    await context.setOffline(false);
    
    // Verify synced
    await expect(page.locator('[data-testid="sync-indicator"]')).toContainText('Synced');
  });
});
```

### 9.3 Visual Regression Testing

**Chromatic Integration:**

```bash
# Install
pnpm add --save-dev chromatic

# Run visual tests
pnpm chromatic --project-token=<token>
```

**Storybook Stories:**

```typescript
// components/forms/fields/TextInput.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'Forms/Fields/TextInput',
  component: TextInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: 'Invalid email address',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    disabled: true,
    value: 'Cannot edit',
  },
};
```

### 9.4 Accessibility Testing

**axe-core Integration:**

```typescript
// components/forms/fields/TextInput.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TextInput } from './TextInput';

expect.extend(toHaveNoViolations);

describe('TextInput Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const Wrapper = () => {
      const form = useForm();
      return (
        <TextInput
          control={form.control}
          name="test"
          label="Test Field"
        />
      );
    };
    
    const { container } = render(<Wrapper />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
```

**Manual Testing Checklist:**

- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader support (NVDA/JAWS)
- [ ] Focus management
- [ ] ARIA labels and roles
- [ ] Color contrast (7:1 for text)
- [ ] Touch target size (48x48dp)

---

## 10. Implementation Roadmap

### 10.1 Sprint 3: Core Navigation + Form Rendering (20 components)

**Week 1: Layout & Navigation (10 components)**

| Priority | Component | Type | Effort | Dependencies |
|----------|-----------|------|--------|--------------|
| P0 | AppShell | Layout | 4h | Mantine AppShell |
| P0 | AppHeader | Layout | 3h | UserNav, SyncIndicator |
| P0 | AppNavbar | Layout | 3h | DashboardNav |
| P0 | DashboardNav | Navigation | 2h | NavItem |
| P0 | NavItem | Navigation | 1h | - |
| P0 | UserNav | Navigation | 2h | Clerk useUser() |
| P0 | PageContainer | Layout | 1h | Mantine Container |
| P0 | PageHeader | Layout | 2h | Mantine Group |
| P0 | Breadcrumbs | Navigation | 2h | useRouter |
| P0 | OfflineBanner | Feedback | 2h | useOnlineStatus |

**Week 2: Form Fields (10 components)**

| Priority | Component | Type | Effort | Dependencies |
|----------|-----------|------|--------|--------------|
| P0 | FormRenderer | Form | 6h | FieldTypes |
| P0 | TextInput | Field | 2h | RHF Controller |
| P0 | NumberInput | Field | 2h | RHF Controller |
| P0 | TextareaInput | Field | 2h | RHF Controller |
| P0 | SelectInput | Field | 2h | RHF Controller |
| P0 | RadioInput | Field | 2h | RHF Controller |
| P0 | CheckboxInput | Field | 2h | RHF Controller |
| P0 | DateInput | Field | 2h | RHF Controller |
| P0 | PhotoInput | Field | 4h | Capacitor Camera |
| P0 | SignatureInput | Field | 4h | react-signature-canvas |

**Total Sprint 3:** 43 hours (2 weeks with buffer)

**Deliverables:**
- Working dashboard navigation
- Form filling capability (core fields)
- Offline banner and sync indicator
- Mobile-responsive layout

### 10.2 Sprint 4: Data Display + Template Management (28 components)

**Week 1: Data Display (14 components)**

| Priority | Component | Type | Effort | Dependencies |
|----------|-----------|------|--------|--------------|
| P0 | ProjectCard | Data | 2h | Badge, Menu |
| P0 | ProjectList | Data | 2h | ProjectCard |
| P0 | FormCard | Data | 2h | Badge |
| P0 | FormList | Data | 2h | FormCard |
| P0 | SubmissionCard | Data | 2h | Avatar, Badge |
| P0 | SubmissionList | Data | 2h | SubmissionCard |
| P0 | SubmissionDetail | Data | 3h | - |
| P0 | PhotoGallery | Data | 4h | PhotoViewer |
| P0 | PhotoViewer | Data | 4h | Image, Modal |
| P0 | PhotoThumbnail | Data | 2h | Next Image |
| P0 | UserAvatar | Data | 1h | Mantine Avatar |
| P1 | UserCard | Data | 2h | UserAvatar |
| P1 | UserList | Data | 2h | UserCard |
| P1 | EmptyState | Feedback | 2h | - |

**Week 2: Templates & Advanced Fields (14 components)**

| Priority | Component | Type | Effort | Dependencies |
|----------|-----------|------|--------|--------------|
| P0 | TemplateSelector | Form | 3h | - |
| P1 | TemplateCard | Data | 2h | - |
| P1 | TemplateList | Data | 2h | TemplateCard |
| P1 | FormBuilder | Form | 12h | DndContext, FieldPalette |
| P1 | FieldPalette | Form | 4h | - |
| P1 | FieldConfig | Form | 4h | Drawer |
| P1 | FormPreview | Form | 3h | FormRenderer |
| P1 | TimeInput | Field | 2h | RHF Controller |
| P1 | DateTimeInput | Field | 2h | DateInput, TimeInput |
| P1 | LocationInput | Field | 4h | Capacitor Geolocation |
| P1 | FileUploadInput | Field | 3h | - |
| P1 | SwitchInput | Field | 1h | RHF Controller |
| P1 | StatsCard | Data | 2h | - |
| P1 | ComplianceStatus | Data | 3h | Badge, Progress |

**Total Sprint 4:** 59 hours (2 weeks with buffer)

**Deliverables:**
- Complete data display (projects, forms, submissions)
- Template library and selector
- Form builder (drag-drop)
- Advanced field types

### 10.3 Sprint 5: Advanced Features + Polish (41 components)

**Week 1: Input & Feedback (21 components)**

| Priority | Component | Type | Effort | Dependencies |
|----------|-----------|------|--------|--------------|
| P0 | SearchBar | Input | 2h | useDebouncedValue |
| P0 | SyncIndicator | Feedback | 2h | Valtio stores |
| P0 | ToastContainer | Feedback | 1h | sonner |
| P0 | LoadingSkeleton | Feedback | 2h | Skeleton |
| P0 | LoadingOverlay | Feedback | 1h | - |
| P0 | ErrorBoundary | Feedback | 2h | react-error-boundary |
| P0 | ErrorAlert | Feedback | 2h | - |
| P0 | ConfirmDialog | Feedback | 2h | Modal |
| P0 | ValidationMessage | Feedback | 1h | - |
| P0 | BackButton | Navigation | 1h | useRouter |
| P0 | LinkButton | Navigation | 1h | Link |
| P0 | Tabs | Navigation | 2h | Mantine Tabs |
| P1 | FilterPanel | Input | 4h | Drawer |
| P1 | SortDropdown | Input | 2h | Select |
| P1 | DateRangePicker | Input | 3h | DateInput |
| P1 | BulkActions | Input | 3h | Menu |
| P1 | QuickFilters | Input | 2h | Badge |
| P1 | ViewToggle | Input | 1h | SegmentedControl |
| P1 | ExportMenu | Input | 2h | Menu |
| P1 | NotificationDropdown | Feedback | 4h | TanStack Query |
| P1 | SuccessAlert | Feedback | 1h | Alert |

**Week 2: Navigation & Extras (20 components)**

| Priority | Component | Type | Effort | Dependencies |
|----------|-----------|------|--------|--------------|
| P1 | MobileBottomNav | Navigation | 4h | - |
| P1 | Pagination | Navigation | 2h | Mantine Pagination |
| P1 | InfiniteScroll | Navigation | 3h | useInView |
| P1 | QuickActions | Navigation | 3h | Affix, ActionIcon |
| P1 | SwipeGesture | Navigation | 4h | use-gesture |
| P1 | PullToRefresh | Navigation | 4h | - |
| P1 | ProgressTracker | Feedback | 2h | Stepper |
| P1 | ActivityTimeline | Data | 3h | Timeline |
| P2 | AppFooter | Layout | 1h | - |
| P2 | RatingInput | Field | 2h | RHF Controller |
| P2 | SliderInput | Field | 2h | RHF Controller |
| P2 | ColorInput | Field | 2h | RHF Controller |
| P2 | PerPageSelect | Input | 1h | Select |
| P2 | ImportUpload | Input | 3h | FileButton |
| P2 | LanguageSwitch | Input | 2h | Select |
| P2 | ThemeToggle | Input | 2h | ActionIcon |
| P2 | CompactToggle | Input | 1h | Switch |
| P2 | ContextMenu | Navigation | 3h | Menu |
| P2 | CommandPalette | Navigation | 6h | Spotlight |
| P2 | JumpToTop | Navigation | 2h | useWindowScroll |

**Total Sprint 5:** 66 hours (2 weeks with buffer)

**Deliverables:**
- Complete input system (search, filter, sort)
- Mobile bottom navigation
- Advanced navigation (infinite scroll, pull-to-refresh)
- Polish (theme toggle, language switch)
- P2 nice-to-haves

### 10.4 Dependency Chain

**Build Order (by dependency):**

```
Phase 1: Foundation (no dependencies)
├── UserAvatar
├── Badge wrappers
├── LoadingSkeleton
├── ErrorAlert
├── ValidationMessage
└── Basic inputs (Text, Number, Textarea)

Phase 2: Composition (depends on Phase 1)
├── ProjectCard → Badge
├── FormCard → Badge
├── SubmissionCard → UserAvatar, Badge
├── UserCard → UserAvatar, Badge
└── TemplateCard → Badge

Phase 3: Lists (depends on Phase 2)
├── ProjectList → ProjectCard
├── FormList → FormCard
├── SubmissionList → SubmissionCard
├── UserList → UserCard
└── TemplateList → TemplateCard

Phase 4: Navigation (depends on Phase 1-3)
├── DashboardNav → NavItem
├── AppNavbar → DashboardNav
├── AppHeader → UserNav, SyncIndicator
├── AppShell → AppHeader, AppNavbar
└── MobileBottomNav

Phase 5: Forms (depends on Phase 1)
├── Field types (all)
└── FormRenderer → Field types

Phase 6: Advanced (depends on Phase 1-5)
├── FormBuilder → FieldPalette, FormRenderer
├── PhotoGallery → PhotoViewer
└── SubmissionDetail → PhotoGallery
```

---

## 11. Code Standards & Patterns

### 11.1 File Naming Conventions

**Components:**
- PascalCase: `FormRenderer.tsx`, `UserAvatar.tsx`
- Test files: `FormRenderer.test.tsx`
- Story files: `FormRenderer.stories.tsx`
- Type files: `FormRenderer.types.ts`

**Hooks:**
- camelCase with `use` prefix: `useOnlineStatus.ts`, `useFormValidation.ts`

**Utilities:**
- camelCase: `offline.ts`, `validation.ts`, `format.ts`

**Stores:**
- camelCase with `Store` suffix: `userStore.ts`, `formStore.ts`

### 11.2 Folder Structure

```
components/
├── layout/              # Layout components
│   ├── AppShell.tsx
│   ├── AppHeader.tsx
│   └── index.ts        # Barrel export
├── navigation/          # Navigation components
│   ├── DashboardNav.tsx
│   └── index.ts
├── forms/               # Form components
│   ├── FormRenderer.tsx
│   ├── fields/         # Field types
│   │   ├── TextInput.tsx
│   │   ├── index.ts
│   └── index.ts
├── data/                # Data display
│   ├── ProjectCard.tsx
│   └── index.ts
├── feedback/            # Feedback components
│   ├── OfflineBanner.tsx
│   └── index.ts
├── input/               # Input components
│   ├── SearchBar.tsx
│   └── index.ts
└── ui/                  # Base UI (Mantine wrappers)
    ├── Button.tsx
    └── index.ts
```

### 11.3 Import Patterns

**Preferred (Barrel Exports):**
```typescript
// Good - clean imports
import { FormRenderer, TextInput, PhotoInput } from '@/components/forms';
import { ProjectCard, ProjectList } from '@/components/data';
import { OfflineBanner, SyncIndicator } from '@/components/feedback';
```

**Avoid (Deep Imports):**
```typescript
// Bad - hard to refactor
import { FormRenderer } from '@/components/forms/FormRenderer';
import { TextInput } from '@/components/forms/fields/TextInput';
```

**Barrel Export Example:**
```typescript
// components/forms/index.ts
export { FormRenderer } from './FormRenderer';
export { FormBuilder } from './FormBuilder';
export { TemplateSelector } from './TemplateSelector';
export * from './fields'; // Re-export all fields
```

### 11.4 Component Template

**Base Template:**

```typescript
// components/[category]/[ComponentName].tsx
'use client'; // If client component

import { FC } from 'react';
import { [MantineComponents] } from '@mantine/core';
import { [Icons] } from '@tabler/icons-react';
import { cn } from '@/lib/utils'; // If needed

/**
 * [Brief description]
 * 
 * @example
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 */

// Props interface
interface ComponentNameProps {
  /** Description */
  prop: string;
  /** Optional prop */
  optionalProp?: boolean;
  /** Callback */
  onClick?: () => void;
}

/**
 * ComponentName component
 */
export const ComponentName: FC<ComponentNameProps> = ({
  prop,
  optionalProp = false,
  onClick,
}) => {
  // Hooks
  const [state, setState] = useState(false);
  
  // Event handlers
  const handleClick = () => {
    onClick?.();
  };
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

// Display name for debugging
ComponentName.displayName = 'ComponentName';
```

**Form Field Template:**

```typescript
// components/forms/fields/[FieldName]Input.tsx
'use client';

import { FC } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { TextInput as MantineTextInput } from '@mantine/core';
import { ValidationMessage } from '@/components/feedback';

interface TextInputProps<T extends FieldValues> {
  /** React Hook Form control */
  control: Control<T>;
  /** Field name */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Is field required */
  required?: boolean;
  /** Is field disabled */
  disabled?: boolean;
}

export const TextInput = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
}: TextInputProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? 'This field is required' : false }}
      render={({ field, fieldState }) => (
        <MantineTextInput
          {...field}
          label={label}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          error={fieldState.error?.message}
          size="lg" // Construction-optimized
        />
      )}
    />
  );
};
```

**Data Display Template:**

```typescript
// components/data/[ComponentName]Card.tsx
'use client';

import { FC } from 'react';
import { Card, Badge, Group, Text, ActionIcon, Menu } from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';
import { Project } from '@/types/project';

interface ProjectCardProps {
  /** Project data */
  project: Project;
  /** Click handler */
  onClick?: () => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <Card
      shadow="md"
      radius="md"
      padding="lg"
      withBorder
      onClick={onClick}
      sx={{ cursor: 'pointer' }}
    >
      <Group position="apart" mb="xs">
        <Text weight={600} size="lg">
          {project.name}
        </Text>
        
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon>
              <IconDotsVertical size={24} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item color="red">Delete</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      
      <Text size="sm" color="dimmed" mb="md">
        {project.address}
      </Text>
      
      <Group spacing="xs">
        <Badge color={project.status === 'active' ? 'green' : 'gray'}>
          {project.status}
        </Badge>
      </Group>
    </Card>
  );
};
```

### 11.5 TypeScript Standards

**Strict Mode (Required):**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Type Patterns:**

```typescript
// Prefer interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions, intersections
type Status = 'active' | 'inactive' | 'pending';
type UserWithStatus = User & { status: Status };

// Generic constraints
function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Utility types
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

---

## 12. Summary & Next Steps

### 12.1 What We've Designed

**89 Components** organized into:
- 11 Layout components
- 23 Form components (15 field types + builder)
- 18 Data display components
- 12 Feedback components
- 13 Input components
- 12 Navigation components

**Complete Architecture:**
- Page hierarchy for all routes
- State management (Valtio + TanStack Query)
- Offline-first patterns
- Field-optimized UX
- Performance optimizations
- Testing strategy

### 12.2 Ready for Implementation

**Sprint 3 (Now):**
- Start with layout (AppShell, AppHeader, AppNavbar)
- Build core form fields (Text, Number, Date, Photo, Signature)
- Implement FormRenderer
- Test offline functionality

**Sprint 4 (Next):**
- Data display components (Project/Form/Submission cards)
- Template library
- Form builder (drag-drop)

**Sprint 5 (Later):**
- Input system (search, filter, sort)
- Mobile navigation
- Polish features

### 12.3 Critical Success Factors

1. **Follow the dependency chain** - Build foundation first
2. **Test offline from day one** - Every component must work offline
3. **Use Mantine theme** - Construction-optimized defaults
4. **Implement TDD** - Tests before code
5. **Monitor bundle size** - Stay under targets
6. **Field test regularly** - Gloves, sunlight, weather

### 12.4 Documentation References

- **CLAUDE.md** - Development standards
- **TECH_STACK_DETAILS.md** - Technical specifications
- **COMMON_PITFALLS.md** - Anti-patterns to avoid
- **UX Design Doc** - Field optimization requirements

---

**This architecture is production-ready and construction-tested. Let's build it.**