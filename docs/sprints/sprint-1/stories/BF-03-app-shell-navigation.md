# BF-03: App Shell + Role-Based Navigation

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 3
**Priority:** HIGH
**Dependencies:** BF-02
**Status:** COMPLETE
**Created:** 2026-03-05
**Completed:** 2026-03-05T23:00:00Z
**Last Updated:** 2026-03-05T23:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 9 (Navigation Restructure)

---

## Summary

Build the app shell layout with sidebar navigation, header with user info and logout, and role-based nav items. Admin sees Dashboard, Projects, Forms, Users, Settings. User sees Dashboard, Projects, Settings. Replace the default Next.js page with the actual app layout.

---

## CEO Directives

Andy's flow chart defines the nav structure:
- ADMIN: Projects, Forms, Users (+ Dashboard, Settings)
- USER: Dashboard with assigned projects only (+ Settings)
- No Form Builder, Weather, Photos, Inspections in nav

---

## Acceptance Criteria

- [x] Dashboard layout with sidebar navigation and header
- [x] Sidebar shows nav items based on user role (admin vs user)
- [x] Admin nav: Dashboard, Projects, Forms, Users, Settings
- [x] User nav: Dashboard, Projects, Settings
- [x] Header displays user name/email and logout button
- [x] Active nav item highlighted
- [x] Responsive -- sidebar collapses on mobile
- [x] `/dashboard` page shows welcome message with user name
- [x] Layout metadata updated (title: "BrAve Forms", not "Create Next App")

---

## Tasks

- [x] T-03.1: Create dashboard layout component with sidebar + header (1.5h)
- [x] T-03.2: Implement role-based nav items with active state (0.5h)
- [x] T-03.3: Create basic dashboard page with welcome message (0.5h)
- [x] T-03.4: Update root layout metadata (title, description) (0.25h)
- [x] T-03.5: Add responsive sidebar behavior (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | CREATE -- Dashboard shell with sidebar + header (~120 lines) |
| `src/app/dashboard/page.tsx` | CREATE -- Dashboard home page (~40 lines) |
| `src/components/layout/Sidebar.tsx` | CREATE -- Sidebar nav component (~80 lines) |
| `src/components/layout/Header.tsx` | CREATE -- Header with user info + logout (~50 lines) |
| `src/app/layout.tsx` | MODIFY -- Update metadata |
| `src/app/page.tsx` | MODIFY -- Redirect to /dashboard or /login |

---

## Key Interfaces

```typescript
// Sidebar nav items
interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Projects', href: '/dashboard/projects', icon: 'FolderKanban' },
  { label: 'Forms', href: '/dashboard/forms', icon: 'FileText', adminOnly: true },
  { label: 'Users', href: '/dashboard/users', icon: 'Users', adminOnly: true },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
];
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Icons | lucide-react | Lightweight, tree-shakable, consistent 24px grid |
| Layout | Next.js App Router layout | Nested layout pattern -- dashboard layout wraps all /dashboard/* |
| Styling | Tailwind CSS 4 | Already configured in project |
| Role check | Server component + getCurrentUser() | No client-side auth check needed for nav rendering |

---

## Comprehensive Validation (2026-03-05T23:00:00Z)

9 files verified, overall 9.5/10 — PASS.

| # | File | Score | Key Finding |
|---|------|:-----:|-------------|
| 1 | dashboard/layout.tsx | 9.5 | Clean server auth gate |
| 2 | dashboard-shell.tsx | 10.0 | Reference composition wrapper |
| 3 | sidebar.tsx | 9.5 | Role filtering + active state correct |
| 4 | header.tsx | 9.5 | Proper POST signout |
| 5 | dashboard/page.tsx | 9.5 | Double getCurrentUser() — App Router constraint |
| 6 | page.tsx | 10.0 | 5-line redirect |
| 7 | layout.tsx | 10.0 | Metadata updated |
| 8 | login-form.tsx | 9.5 | Branding only |
| 9 | signup/page.tsx | 9.5 | Branding only |

---

## Testing

Manual verification:
- Login as admin -- see full nav
- Login as user -- see limited nav
- Click nav items -- correct page loads, active state shows
- Resize browser -- sidebar collapses on mobile
- Logout button works
