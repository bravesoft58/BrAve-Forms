# BF-05: Project List + Detail Page with Tabs

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 5
**Priority:** HIGH
**Dependencies:** BF-01, BF-03
**Status:** NOT STARTED
**Created:** 2026-03-05
**Last Updated:** 2026-03-05T00:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 13 (Project Detail Page Restructure), Salvage Sprint S2-004

---

## Summary

Build the project list page showing all projects (admin) or assigned projects (user), and the project detail page with tab layout per Andy's spec: Permits, Documents, one tab per required form type, and Team. The project detail page is the container where forms live.

---

## CEO Directives

- USER sees ONLY projects they are assigned to
- ADMIN sees all projects
- Project detail tabs are dynamic -- only show form tabs for forms required on that project
- Andy's container structure: Permits, Documents, [form tabs], Team

---

## Acceptance Criteria

- [ ] `/dashboard/projects` page lists projects as cards (name, address, status, start date)
- [ ] Admin sees all projects, User sees only assigned projects (via RLS or query filter)
- [ ] Click project card navigates to `/dashboard/projects/[id]`
- [ ] Project detail page shows header: Project Name, Address, Status badge, Edit button
- [ ] Tab navigation: Permits, Documents, [dynamic form type tabs], Team
- [ ] Permits tab shows list of project permits with type and permit number
- [ ] Documents tab shows placeholder (file upload in future sprint)
- [ ] Form tabs show placeholder content (form log component built in BF-06/07)
- [ ] Team tab shows placeholder (user assignment in future sprint)
- [ ] Only required form tabs appear (based on project_form_requirements)
- [ ] Empty state for projects list when none exist

---

## Tasks

- [ ] T-05.1: Create project list page with card layout (1h)
- [ ] T-05.2: Implement project list query (admin: all, user: assigned via project_users) (0.5h)
- [ ] T-05.3: Create project detail page with header and tab navigation (1.5h)
- [ ] T-05.4: Build Permits tab content (list of project permits) (0.5h)
- [ ] T-05.5: Build placeholder tabs for Documents, Team, and form types (0.5h)
- [ ] T-05.6: Query project_form_requirements to determine which form tabs to show (0.5h)
- [ ] T-05.7: Test navigation flow and role-based filtering (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/projects/page.tsx` | CREATE -- Project list page (~60 lines) |
| `src/components/projects/ProjectCard.tsx` | CREATE -- Project card component (~40 lines) |
| `src/app/dashboard/projects/[id]/page.tsx` | CREATE -- Project detail page with tabs (~100 lines) |
| `src/components/projects/ProjectTabs.tsx` | CREATE -- Tab navigation component (~80 lines) |
| `src/components/projects/PermitsTab.tsx` | CREATE -- Permits tab content (~40 lines) |
| `src/lib/queries/projects.ts` | CREATE -- Supabase queries for projects (~50 lines) |

---

## Key Interfaces

```typescript
// src/lib/queries/projects.ts
export async function getProjects(userId: string, role: string): Promise<Project[]>
export async function getProject(id: string): Promise<ProjectWithRelations>
export async function getProjectFormRequirements(projectId: string): Promise<FormRequirement[]>

// Tab configuration derived from form requirements
interface TabConfig {
  id: string;
  label: string;
  formType?: FormType; // undefined for non-form tabs (Permits, Documents, Team)
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Data fetching | Server Components + Supabase server client | No client-side fetching needed for initial load |
| Tab component | URL-based tabs (searchParams or path segments) | Bookmarkable, works with server components |
| Role filtering | RLS policy on projects + project_users join | DB-level filtering, no client-side leakage |
| Card layout | CSS Grid with Tailwind | Responsive grid, simple |

---

## Testing

Manual verification:
- Admin user sees all projects in list
- Regular user sees only assigned projects (requires seed data with project_users records)
- Click project -> detail page loads with correct data
- Tabs reflect actual form requirements (e.g., project with SAD permit shows Dust Log tab)
- Project with no permits shows only Permits, Documents, Team tabs (no form tabs)
