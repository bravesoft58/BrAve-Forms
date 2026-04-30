# Sprint 3: Multi-Tenant Foundation

**Sprint Goal:** Convert BrAve Forms from single-tenant (Q&D only) to multi-organization with full data isolation, scoped role model, and audited super-admin access — so Andy can onboard additional prospects for parallel UAT without risk of cross-tenant data leakage.
**Duration:** 2026-04-24 to 2026-05-07 (2 weeks; Phase 5b scheduled +7 days after 5a lands in prod)
**Capacity:** 22 SP (single release)
**Priority:** CRITICAL -- gates any second-prospect UAT
**Risk Level:** MEDIUM-HIGH -- production DB migrations + RLS rewrite

---

## Why This Sprint

1. **Andy's request**: open BrAve Forms to additional prospects for parallel testing alongside Q&D.
2. **Data leaks exist today** regardless of multi-tenant plans:
   - `profiles_select` RLS uses `USING true` — every authed user can list every profile in the DB.
   - Both Storage buckets are `public: true` — any leaked URL is permanent unauthenticated access.
3. **`is_admin()` is globally scoped** — adding an Acme admin today would give them read/write access to every Q&D project, form, photo, and document.

---

## Scope Confirmed With Tim (2026-04-24)

- Multi-organization (a user can belong to more than one org).
- Orgs are provisioned by super-admin only (no self-serve signup).
- `projects.company_name` stays (initialized from org name on insert, editable after).
- Super-admin = read-only cross-org view + every cross-org read logged.
- Active-org context = HTTP-only cookie, server-read on every request.
- Fold the BF-28/29 user-deletion FK fix into Phase 5.
- Zero breaking changes for Q&D — all users and data migrate into one `Q&D Construction` org.
- Clean rollback at every phase with no data loss (three-layer escape plan).

---

## Stories

| Story | Title | SP | Priority | Dependencies | Status |
|-------|-------|----|----------|-------------|--------|
| [BF-30](stories/BF-30-multi-tenant-schema.md) | Multi-tenant schema + Q&D backfill | 3 | CRITICAL | None | COMPLETE (2026-04-25, merged 3b43db6) |
| [BF-31](stories/BF-31-multi-tenant-rls.md) | RLS rewrite with org-scoped helpers; fix profiles-select leak | 5 | CRITICAL | BF-30 | COMPLETE (2026-04-30, applied + Option A admin-tier addendum, verify 9.0/10 → 9.5/10 post-fix) |
| [BF-32](stories/BF-32-private-storage.md) | Storage privatization + signed URLs | 3 | CRITICAL | BF-31 | NOT STARTED |
| [BF-33](stories/BF-33-org-switcher-invite-admin.md) | Org switcher, invite flow rewrite, super-admin routes | 5 | HIGH | BF-31 | NOT STARTED |
| [BF-34](stories/BF-34-role-refactor-fk-fix-tests.md) | Org-scoped role checks, service-audited client, FK fix, cross-tenant Playwright suite | 5 | HIGH | BF-33 | NOT STARTED |
| [BF-35](stories/BF-35-drop-global-role.md) | Drop `is_admin()` + `profiles.role` with pre-drop backup | 1 | MEDIUM | BF-34 + 7-day stability | SCHEDULED |
| [BF-36](stories/BF-36-uat-hotfix-multi-tenant.md) | UAT hotfix: create-project NOT NULL + qr_tokens RLS | 2 | P0 | BF-30 | COMPLETE (2026-04-29, merged 594c5ef, verify 9.83/10) |
| [BF-37](stories/BF-37-dust-log-uat-polish.md) | Daily Dust Log UAT polish (5 items) | 3 | HIGH | None | DONE (2026-04-29, merged 7364d90, verify 9.5/10, Andy UAT signed off 2026-04-30) |
| **Total** | | **27** | | | **13/27 SP done — 4/8 stories complete** |

---

## Execution Order

Strict sequential dependency — each phase builds on the previous migration.

1. **BF-30** — additive schema only. No code changes, no user-visible change.
2. **BF-31** — RLS rewrite. `is_admin()` kept alive as compatibility shim; no code yet references the new helpers. Q&D users must see zero difference.
3. **BF-32** — storage in two steps: deploy signed-URL code on still-public buckets first, flip buckets private after 24h of stability.
4. **BF-33** — new UI behind `NEXT_PUBLIC_MULTI_TENANT=1` env flag. Flag stays `=0` in production until go/no-go gate passes.
5. **BF-34** — role-check refactor, FK fix, test harness. End of reversible work.
6. **BF-35** — scheduled +7 days after 34 lands, only after CI grep gate confirms no code references `is_admin()` or `profiles.role`.

---

## Escape Plan (Three Layers)

| Layer | Reverts | Time | Data Loss |
|---|---|---|---|
| L1 — Vercel rollback | Code only | ~30 seconds | None |
| L2 — Inverse migration | Last phase's schema | 2-5 minutes | None thru BF-34; BF-35 needs the backup table |
| L3 — PITR | Whole DB to point-in-time | 15-60 minutes | Anything after the target timestamp |

**Hard rules:**
- Every migration has a paired inverse in `supabase/migrations/_rollback/`.
- No destructive drops before BF-35.
- Pre-phase Supabase snapshot + `pg_dump` before each forward migration.
- Every phase lands on a Supabase branch first; merge to prod only after 24h green on preview.
- User-facing changes gate behind `NEXT_PUBLIC_MULTI_TENANT` flag for instant UX revert.

---

## Critical Data Preservation

Q&D is the first tester org. Migration must preserve:
- All 6 existing `profiles` rows (users migrate into Q&D org as members/admins/owner per current role).
- All 5 existing `projects` rows (get `organization_id` = Q&D org).
- All 11 form submissions, photos, documents, QR tokens, project assignments.
- Tim's super-admin designation (`platform_role='super_admin'`).
- Every existing login still works.
- Every existing URL still works.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Phase 2 RLS over-restricts Q&D | Users locked out | Supabase branch + two-org assertion script before merge |
| Private bucket flip breaks photo display | Visible regression | Deploy signed-URL code first; flip bucket 24h later |
| Cookie spoof of active org | Cross-tenant | `current_org_ids()` filters invalid values, proxy resets on every request |
| `is_admin()` drop breaks hidden caller | Broken page | CI grep gate + 7-day delay + pre-drop backup table kept 30 days |
| Signed URL TTL too short for PDF render | PDF photos 403 | 3600s TTL; render completes in seconds |
| Super-admin forgets audit log | Silent cross-tenant view | Single wrapper client; no other service-role path in `/admin/*` |

---

## Research Basis

| Area | Source | Finding |
|------|--------|---------|
| Shared-schema multi-tenancy pattern | Supabase docs, industry standard | Single DB, tenant_id FK, RLS-enforced isolation |
| Existing RLS policies | Direct DB query (2026-04-24) | 9 tables + 6 storage policies; every helper uses `is_admin()` |
| Storage paths in use | `form_photos`, `project_documents` rows | All use `projects/{project_id}/...` — clean flip to private |
| Embedded URL risk in form JSONB | `SELECT ... WHERE data::text LIKE '%supabase.co%'` | Zero matches — Phase 3 has no data migration dependency |
| BF-29 password-reset flow | Sprint 2 | Unchanged; OTP + interstitial survives multi-tenant refactor |

---

## Sprint Retrospective

*(Completed at sprint end)*

- [ ] All stories marked COMPLETE or explicitly deferred
- [ ] Cross-tenant Playwright suite passing clean
- [ ] First prospect org provisioned via `/admin/organizations/new`
- [ ] Q&D UAT unchanged (Andy smoke-test)
- [ ] Velocity calculated
- [ ] Lessons documented

---

**Plan source:** `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (approved 2026-04-24)
**Last Updated:** 2026-04-30
