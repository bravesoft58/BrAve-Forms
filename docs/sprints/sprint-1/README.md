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
| [BF-07](stories/BF-07-dust-log-view-history.md) | Dust Log read-only view + form history + Use Previous | 3 | MEDIUM | BF-06 | NOT STARTED |
| [BF-08](stories/BF-08-e2e-verification.md) | End-to-end verification | 1 | MEDIUM | BF-01 through BF-07 | NOT STARTED |
| **Total** | | **30** | | | |

---

## Sprint Progress

| Metric | Value |
|--------|-------|
| Stories Complete | 6/8 |
| Story Points Complete | 26/30 (87%) |
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

*(Completed at sprint end)*

- [ ] All stories marked COMPLETE or explicitly deferred
- [ ] Velocity calculated and recorded
- [ ] Lessons documented
- [ ] Backlog updated with any new stories discovered

---

**Last Updated:** 2026-03-07T15:00:00Z
