<!-- 52ea370e-799c-4f55-8242-ae4af9984c7f c50d47da-6803-4e94-9d9d-c9fbe003abb9 -->
# Sprint 3 Review and UI Revamp Proposal

## In-depth sprint assessment

- Scope currently spans 5 phases: Navigation (done), Dashboard (in progress), Forms Builder, Forms Runtime, Testing/Polish.
- Risks: App Router prerendering, auth/runtime boundaries, offline-first data layer maturity, and design quality inconsistencies.
- Observation: Navigation is complete, but design quality of initial components is below target (visual hierarchy, spacing, density, typography, contrast).

## Priority recommendations (next 2 weeks)

1. Unblock build/runtime for Clerk/GraphQL pages

- Apply per-route runtime configs and dynamic imports on affected pages; verify local build.

2. Complete Dashboard subset (incremental)

- Deliver 3 production-quality pages with finalized layout primitives before scaling breadth.

3. Establish design system foundation

- Theme tokens (spacing, radius, shadows), typography scale, color palette, and component primitives.

4. Integrate offline-first data layer on the dashboard

- TanStack Query + IndexedDB persistence; define cache keys and invalidation.

5. Add targeted tests

- Component tests for layout primitives; integration tests for dashboard data flow; visual regression on critical screens.

## Scope adjustments

- Defer full Forms Builder canvas until the design system is in place (focus on core primitives first).
- Timebox Forms Runtime spike to API/data contracts and 1 read-only form view prototype.

## UI remediation plan

Reference: `docs/design/UI_UX_DESIGN_RESEARCH.md` (palette, layout, typography, spacing, touch targets) and the look-and-feel example at `https://dribbble.com/shots/26699836-Product-Operations-Dashboard`. All UI changes should align with these guidelines.

- Theme and tokens (Mantine v7): finalize `theme.ts`
- Typography: 12/14/16/20 scale; strong line-height for readability.
- Spacing scale: 2/4/8/12/16/24; apply consistent paddings/margins.
- Color system: neutral grays, high-contrast action colors; WCAG AA.
- Radius and shadows: subtle depth for affordance, reduce visual noise.
- Layout primitives
- `PageContainer`, `AppHeader`, `AppNavbar`, `AppShell` polishing.
- Grid and stack utilities: predictable gutters, mobile-first breakpoints.
- Components to refactor first
- Buttons, Inputs, Selects, Tables, Cards, Empty states, Banners.
- Replace ad-hoc inline styles with theme-driven styles and variants.
- Accessibility and responsiveness
- Focus states, hit areas (44px), keyboard nav, contrast audits.
- Performance
- Reduce inline styles; memoize heavy components; split vendor chunks (already in next.config.js).

## Deliverables

- Design system v1 documented (tokens + usage) and implemented in `apps/web/lib/theme.ts` and component wrappers.
- 3 dashboard pages, production-quality (list, detail, status/alerts) using the refined components.
- Build unblocked, with runtime configs for affected pages.
- Minimal test suite: unit + component + 1-2 Playwright scenarios.

## Suggested implementation todos

Issue mapping (global, next available after Sprint 5):

- ISSUE-115: single-tenant-mode — Configure fixed org/user context for Sprint 3 (dev only)
- ISSUE-116: setup-runtime — Configure runtime rendering on Clerk/GraphQL routes and verify local build
- ISSUE-117: design-tokens — Implement Mantine theme tokens and typography scale in theme.ts
- ISSUE-118: layout-primitives — Refine App layout primitives (`PageContainer`, `AppHeader`, `AppNavbar`, `AppShell`)
- ISSUE-119: core-components — Refactor Button/Input/Select/Card/Table/Banner using tokens and variants
- ISSUE-120: dashboard-mvp — Build 3 polished dashboard pages with offline-first data
- ISSUE-121: tests-min — Add unit/component/e2e smoke tests for layout and dashboard

- single-tenant-mode: Configure fixed org/user context for Sprint 3 (disable multi-tenant features)

- setup-runtime: Configure runtime rendering on Clerk/GraphQL routes and verify local build
- design-tokens: Define and implement Mantine theme tokens and typography scale
- layout-primitives: Refine `PageContainer`, `AppHeader`, `AppNavbar`, `AppShell`
- core-components: Create/refactor Button, Input, Select, Card, Table, Banner
- dashboard-mvp: Ship 3 production-quality dashboard pages with offline-first data
- tests-min: Add unit/component/e2e smoke tests for layout and dashboard

## Notes on existing code to leverage

- `apps/web/components/Layout/*` can be refactored rather than rebuilt; centralize spacing/typography via theme.
- Keep `providers.tsx` structure; ensure `ClerkProvider` guard respects `NEXT_PUBLIC_SKIP_CLERK_AUTH`.
- Maintain PWA config; ensure runtime caching doesn’t conflict with TanStack Query persistence.

### To-dos

- [ ] Catalog core docs and recent sprint status from `docs/`
- [ ] Map backend modules to resolvers/services and list critical endpoints
- [ ] Reproduce web build issue and enumerate affected routes/configs
- [ ] Locate Prisma schema and verify multi-tenancy patterns and seeds
- [ ] Produce short written brief with risks and next steps