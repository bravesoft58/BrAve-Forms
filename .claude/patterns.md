# BrAve Forms - Project Patterns

## Section 1: Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | App Router, frontend + server actions |
| React | 19.2.3 | UI framework |
| Tailwind CSS | 4.x | Styling |
| @supabase/ssr | 0.9.0 | Supabase SSR client (browser + server) |
| @supabase/supabase-js | 2.98.0 | Supabase JS client |
| TypeScript | 5.x | Type safety |
| PostgreSQL | 15.8.1 | Database (Supabase hosted) |
| pnpm | - | Package manager |

## Section 2: Schema Patterns

- **UUIDs**: `gen_random_uuid()` built-in (no uuid-ossp extension needed)
- **Enums**: Text columns with CHECK constraints (not PostgreSQL native enums) -- easier to modify
- **Timestamps**: `timestamptz` with `default now()`, `updated_at` via trigger function
- **Soft deletes**: Not used -- hard deletes with `on delete cascade`
- **RLS**: Enabled on all public tables. Use security definer functions for performance.
- **Naming**: snake_case for tables/columns, descriptive names (`daily_dust_log` not `dust_log`)

## Section 3: Code Patterns

- **Supabase client**: `src/lib/supabase/client.ts` (browser), `server.ts` (server), `proxy.ts` (session refresh + auth redirects)
- **Proxy (middleware)**: `src/proxy.ts` -- Next.js 16 renamed middleware.ts → proxy.ts. Delegates to `src/lib/supabase/proxy.ts`.
- **Auth helper**: `src/lib/auth.ts` -- `getCurrentUser()` returns user with profile/role
- **Server actions**: `src/app/{route}/actions.ts` -- form actions with `AuthState` return type
- **Layout**: Default Next.js App Router layout with Geist font
- **No test framework configured yet** -- no tests directory exists

## Section 4: Architecture References

- PRD: `docs/requirements/comprehensive_prd.md`
- Andy's Salvage Plan: `docs/requirements/ANDY_SALVAGE_PLAN.md` (priority doc)
- Sprint Plan: `docs/requirements/SALVAGE_SPRINT_PLAN.md`
- DB Design (v1, over-engineered): `docs/design/database design document.md`
- UX Design: `docs/design/brave-forms-ux-design-doc.md`
- Use Cases: `docs/design/brave-forms-use-cases.md`
- NFR: `docs/design/brave-forms-nfr.md`

## Section 5: Worktree Config

- **Main branch**: master
- **Branch naming**: `feature/{story-id}-short-description`
- **Worktree root**: Not configured -- use standard git branching (small project, single developer)
- **Commit format**: Conventional Commits

## Section 6: Testing

- No test framework configured
- Manual verification via Supabase dashboard SQL editor for DB stories
- Future: likely Vitest + Testing Library for component tests

## Section 7: Docs Structure

```
docs/
  requirements/    # PRD, salvage plan, EPA/OSHA rules
  design/          # Use cases, UX, NFR, DB design, UI standards
  reference/       # Andy's QA notes
  forms/           # Nevada form specs (empty)
  sprints/         # Sprint planning and story files
    sprint-1/
      README.md
      stories/     # BF-01 through BF-08
```

## Section 8: Docker/Infrastructure

- No Docker -- fully managed Supabase cloud + Vercel
- Supabase project ref: ytsghlfjgdhczfbggpdl
- Supabase region: us-east-1
- Vercel deployment: auto-deploy on push to master
- Live URL: https://brave-forms.vercel.app

## Section 9: Product Context

- **What it is**: Construction compliance forms platform for Q&D Construction (Nevada)
- **What it isn't**: Generic form builder, multi-tenant SaaS, mobile app
- **5 forms**: Daily Dust Log, NDEP Stormwater, NDOT Stormwater, NDEP SAD, NNPH Dust Permit
- **Users**: Admins (site admin), Users (assigned projects), Inspectors (QR, no account)
- **Offline-first**: Planned but not Sprint 1 scope
- **Scale**: Single-tenant pilot for Q&D, ~dozen users
