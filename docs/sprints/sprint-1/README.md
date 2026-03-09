# Sprint 1: Foundation + First Form

**Sprint Goal:** Stand up the complete data layer, auth, project management, and Daily Dust Log form. By sprint end, a user can create a project with permits, fill out a dust log, view completed logs, and use "Use Previous" to pre-fill the next entry.
**Duration:** 2026-03-05 to 2026-03-12
**Capacity:** 30 SP
**Priority:** CRITICAL -- establishes all infrastructure for subsequent sprints
**Risk Level:** MEDIUM

---

## Stories

| Story | Title | SP | Priority | Dependencies | Status |
|-------|-------|----|----------|-------------|--------|
| [BF-01](stories/BF-01-database-schema-rls.md) | Database schema + RLS policies | 5 | CRITICAL | None | COMPLETE |
| [BF-02](stories/BF-02-supabase-auth.md) | Supabase Auth + protected routes | 3 | CRITICAL | None | COMPLETE |
| [BF-03](stories/BF-03-app-shell-navigation.md) | App shell + role-based navigation | 3 | HIGH | BF-02 | COMPLETE |
| [BF-04](stories/BF-04-project-creation.md) | Project creation (full fields + permits) | 5 | HIGH | BF-01, BF-03 | COMPLETE |
| [BF-05](stories/BF-05-project-list-detail.md) | Project list + detail page with tabs | 5 | HIGH | BF-01, BF-03 | COMPLETE |
| [BF-06](stories/BF-06-daily-dust-log-form.md) | Daily Dust Log form (editable) | 5 | HIGH | BF-01, BF-05 | COMPLETE |
| [BF-07](stories/BF-07-dust-log-view-history.md) | Dust Log read-only view + form history + Use Previous | 3 | MEDIUM | BF-06 | COMPLETE |
| [BF-08](stories/BF-08-e2e-verification.md) | End-to-end verification | 1 | MEDIUM | BF-01 through BF-07 | COMPLETE |
| **Total** | | **30** | | | |

---

## Sprint Progress

| Metric | Value |
|--------|-------|
| Stories Complete | 8/8 |
| Story Points Complete | 30/30 (100%) |
| Tests at Sprint Start | 0 (no test suite yet) |

---

## Execution Order

Stories should be executed in this order based on dependencies and priority:

1. **BF-01** + **BF-02** -- No dependencies, can run in parallel
2. **BF-03** -- Depends on BF-02 (auth context needed for role-based nav)
3. **BF-04** + **BF-05** -- Both depend on BF-01 + BF-03, can parallel
4. **BF-06** -- Depends on BF-01 + BF-05 (needs project detail page to host form)
5. **BF-07** -- Depends on BF-06
6. **BF-08** -- Final verification, depends on all

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Supabase RLS complexity | Schema work takes longer than estimated | Start with permissive policies, tighten incrementally |
| First sprint -- no velocity baseline | May over/under-commit | 30 SP is moderate; will calibrate Sprint 2 |
| Supabase Auth learning curve | Auth stories blocked | Auth wiring already scaffolded in src/lib/supabase/ |

---

## Research Basis

| Area | Scope | Key Finding |
|------|-------|-------------|
| Stack | Next.js 16 + Supabase vs NestJS + Prisma | Supabase eliminates entire backend layer -- no API routes needed for CRUD, RLS handles authorization at DB level |
| Auth | Supabase Auth vs Clerk | Supabase Auth native integration with RLS, no extra service, simpler for single-tenant pilot |
| Forms | useActionState + Zod 3 | Server-side Zod validation via Server Actions. RHF dropped due to Zod v4 resolver conflicts. |
| Storage | Supabase Storage | Built-in, replaces S3/MinIO. Storage buckets + RLS for access control |

---

## Sprint Retrospective

*(Completed 2026-03-09)*

- [x] All stories marked COMPLETE or explicitly deferred
- [x] Velocity calculated and recorded
- [x] Lessons documented
- [x] Backlog updated with any new stories discovered

### Velocity

| Metric | Value |
|--------|-------|
| Stories planned | 8 |
| Stories completed | 8 (100%) |
| Story points planned | 30 |
| Story points completed | 30 (100%) |
| Calendar time | 5 days (Mar 5-9) |
| Tests added | 0 (no test suite -- manual E2E verification) |

### Lessons Documented

1. Next.js 16 renames middleware.ts to proxy.ts -- caught early via docs
2. useSearchParams() requires Suspense boundary -- split server page + client form pattern
3. Supabase join returns array type, needs `as unknown as` cast for TypeScript
4. Date-only strings parsed as UTC midnight by `new Date()` -- append "T00:00:00" for local time
5. Zod pinned to ~3.24.x -- 3.25+ bundles Zod 4 internally causing resolver conflicts
6. pnpm is the package manager -- npm install fails due to .pnpm structure
7. Worktree workflow works well for feature isolation (adopted BF-05 onward)

### Bugs Found and Fixed

| Bug | Severity | Fix |
|-----|----------|-----|
| BL-001 | LOW | Added placeholder pages for /dashboard/users and /dashboard/settings |
| BL-002 | LOW | Fixed timezone-shifted dates (append "T00:00:00" to date strings) |
| BL-003 | LOW | Sort inconsistency resolved by BL-002 fix |

### What Went Well

- Full foundation built in 5 days: schema, auth, projects, first form
- E2E verification passed 10/10 steps on first run
- Salvage plan alignment -- no scope creep beyond Andy's requirements

### What Could Improve

- No automated test suite yet -- all verification manual
- Should add permit numbers during project creation (data gap, not code bug)

---

**Last Updated:** 2026-03-09T15:00:00Z
