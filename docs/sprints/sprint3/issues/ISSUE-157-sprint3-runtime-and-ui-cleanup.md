# ISSUE-157: Sprint 3 – Runtime fixes and UI clean-up (in-progress record)

Date: 2025-10-30

Scope: Implement dev single-tenant mode, fix prerender/runtime issues in App Router, align theme and layout primitives with UI/UX guidance, and begin visual polish so Dashboard and core layouts present professionally.

Reference docs
- UI/UX research: `docs/design/UI_UX_DESIGN_RESEARCH.md` (palette, spacing, typography, hit targets)
- Web build status: `docs/archive/WEB_FRONTEND_STATUS.md`

---

## Changes implemented

### 1) Dev-only single-tenant mode (backend)
- Injects a fixed `orgId`/`userId` into GraphQL context when `DEV_SINGLE_TENANT=true`.
- Files:
  - `apps/backend/src/modules/auth/guards/clerk-auth.guard.ts`

Key snippet:
```ts
// When DEV_SINGLE_TENANT=true, bypass Clerk and inject fixed user/org
const devSingleTenant = process.env.DEV_SINGLE_TENANT === 'true';
if (devSingleTenant && request) {
  request.user = {
    userId: process.env.DEV_USER_ID || 'dev-user',
    orgId: process.env.DEV_ORG_ID || 'system',
    orgRole: process.env.DEV_ORG_ROLE || 'ADMIN',
  };
  return true;
}
```

Env vars used (dev only):
```
DEV_SINGLE_TENANT=true
DEV_ORG_ID=system
DEV_USER_ID=dev-user
DEV_ORG_ROLE=ADMIN
```

Outcome: Unblocks local development without multi-tenant auth while Sprint 3 is focused on UI/UX.

---

### 2) Web auth skip in dev (frontend)
- Default to skip Clerk in non-production unless explicitly disabled.
- Files:
  - `apps/web/app/providers.tsx`

Key snippet:
```ts
const skipAuth =
  process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH !== 'false');
```

Env vars (dev):
```
NEXT_PUBLIC_SKIP_CLERK_AUTH=true
```

---

### 3) Runtime rendering and prerender safety
- Prevent build-time prerender on routes using auth/runtime data.
- Files:
  - `apps/web/app/dashboard/page.tsx` → `dynamic = 'force-dynamic'`, `revalidate = 0`, `fetchCache = 'force-no-store'`
  - `apps/web/app/forms/builder/page.tsx` (already `force-dynamic`)
  - `apps/web/app/select-organization/page.tsx` (already `force-dynamic`)

Outcome: Avoids Clerk/Apollo-like hook execution during prerender.

---

### 4) Theme tokens aligned to research doc
- Construction palette (blue/orange), typography scale, spacing (8px base), radius/shadows, input/button sizes (≥48px).
- Files:
  - `apps/web/lib/theme.ts`

Highlights:
```ts
spacing: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
headings: { h1: 32px, h2: 24px, h3: 20px, h4: 18px, h5: 16px, h6: 14px },
components.Button.styles.root = { minHeight: '48px' };
components.TextInput.styles.input = { minHeight: '48px' };
```

---

### 5) Layout primitives

#### 5.1 `PageContainer`
- Use heading scale appropriate for page titles and remove ad‑hoc inline scale inconsistencies.
- Files:
  - `apps/web/components/Layout/PageContainer.tsx`

Change:
```tsx
<Title order={1}>{title}</Title>
```

#### 5.2 `AppHeader` visual polish
- Increase header height to 64px, larger search and user actions, bigger touch targets, slightly stronger brand text, subtle bottom shadow.
- Files:
  - `apps/web/components/Layout/AppHeader.tsx`

Key adjustments:
```tsx
<Group h={64} ... style={{ height: rem(64), boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
// ActionIcon sizes 48; search field width ~280px; brand text ~16px; logo tile 28px
```

#### 5.3 `AppLayout` fix
- Reverted to stable Mantine `AppShell` composition to ensure header/navbar render as expected.
- Files:
  - `apps/web/components/Layout/AppLayout.tsx`

Change summary:
```tsx
<AppShell header={{ height: 64 }} navbar={{ width: 280, breakpoint: 'md' }} padding="md">
  <AppShell.Header><AppHeader /></AppShell.Header>
  <AppShell.Navbar><AppNavbar /></AppShell.Navbar>
  <AppShell.Main>
    <OfflineBanner />
    {children}
  </AppShell.Main>
</AppShell>
```

Outcome: Consistent shell across routes; header/nav visible.

---

## Quick verification steps
1) Set dev env:
```
DEV_SINGLE_TENANT=true
DEV_ORG_ID=system
DEV_USER_ID=dev-user
DEV_ORG_ROLE=ADMIN
NEXT_PUBLIC_SKIP_CLERK_AUTH=true
```
2) Start web and backend in dev.
3) Visit:
   - `http://localhost:30102/` (k8s) or app dev `http://localhost:3000/`
4) Check:
   - Header is 64px with larger brand, 48px icons.
   - Sidebar present on desktop; bottom nav on mobile.
   - Dashboard route loads without prerender errors.

Notes: If you see a blank page, capture the first console error and web logs for exact route/component failing.

---

## Outstanding items (next)
1) Navbar visual states: active emphasis, spacing, and hover color alignment.
2) Core components refresh: Button, Input, Select, Card, Table, Banner to remove inline styles and fully adopt tokens.
3) Dashboard cards and empty states to match the Dribbble reference link from the UI/UX doc.
4) Add minimal tests: layout smoke, component snapshot, and one Playwright route check.
5) Resolve any residual App Router/Clerk build edge cases (if present after upgrades).

---

## Risks and mitigations
- App Router prerendering: mitigated with route `dynamic` configs.
- Dev auth assumptions: guarded behind `DEV_SINGLE_TENANT` and `NEXT_PUBLIC_SKIP_CLERK_AUTH` flags; production unaffected.
- Visual variability: will converge via tokenized components to avoid page-level inline styles.

---

## Files touched (by path)
- Backend:
  - `apps/backend/src/modules/auth/guards/clerk-auth.guard.ts`
- Frontend configuration:
  - `apps/web/app/providers.tsx`
  - `apps/web/app/dashboard/page.tsx`
  - `apps/web/app/forms/builder/page.tsx` (reviewed)
  - `apps/web/app/select-organization/page.tsx` (reviewed)
  - `apps/web/lib/theme.ts`
- Layout primitives:
  - `apps/web/components/Layout/PageContainer.tsx`
  - `apps/web/components/Layout/AppHeader.tsx`
  - `apps/web/components/Layout/AppLayout.tsx`

---

## Acceptance checklist (for this issue)
- [x] Dev single-tenant override implemented and gated by env vars.
- [x] Runtime configs applied to auth/data-heavy routes.
- [x] Theme tokens reflect the research doc (spacing, typography, colors, sizes).
- [x] `PageContainer` heading scale corrected.
- [x] `AppHeader` tightened (64px, 48px controls, subtle shadow).
- [x] App shell renders header/navbar consistently.
- [ ] Navbar active/hover states polished.
- [ ] Core components refactored to tokens (phase 1 set).
- [ ] Dashboard visual alignment with reference design.
- [ ] Basic tests added (unit + e2e smoke).


