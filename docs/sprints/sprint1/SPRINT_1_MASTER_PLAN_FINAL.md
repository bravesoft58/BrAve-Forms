# Sprint 1 Master Plan - Kubernetes Deployment & Apollo Refactor (FINAL)

**Created:** 2025-09-30 20:15:00 EDT
**Last Updated:** 2025-10-01 16:00:00 EDT (ATOMIC BREAKDOWN APPLIED)
**Sprint Duration:** September 30 - October 14, 2025 (2 weeks)
**Sprint Goal:** Deploy to Kubernetes, refactor to TanStack Query, implement core weather API
**Business Value:** Production-ready infrastructure + EPA 0.25" precipitation monitoring
**Velocity Target:** 46 atomic issues (15-30 minutes each, junior-dev friendly)

## Research Completed

**Infrastructure Audit Findings (2025-09-30 19:00:00 EDT):**

- ✅ Complete Rancher Desktop + K8s setup exists
- ✅ Port conflict detection automated
- ✅ 9 Kubernetes manifests ready
- ✅ Backend container image already built (brave-forms-backend:local)
- ✅ Prisma schema complete (8 models, 1 migration)
- ✅ braveforms namespace created but empty
- ✅ Ports 30101-30103 verified safe (no conflicts with velocitymesh)

**Current Status:**

- Kubernetes: Ready, namespace empty
- Backend: 25% code complete, container image built
- Web: 10% complete, build failing (Apollo imports)
- Mobile: 0% complete
- Database: Schema exists, not deployed

**Key Documentation:**

- Rancher Desktop Setup: `docs/archive/RANCHER_DESKTOP_SETUP.md`
- Port Scan Results: `docs/archive/RANCHER_PORT_SCAN_RESULTS.md`
- K8s Deployment Script: `scripts/k8s-local-setup.ps1`
- Port Conflict Script: `scripts/check-port-conflicts.ps1`

## Sprint Objectives

1. **Deploy Kubernetes Infrastructure** - Full stack running locally
2. **Migrate Apollo → TanStack Query** - Fix web build, enable PWA offline-first
3. **Implement Weather API Integration** - Actual NOAA API calls, 0.25" threshold
4. **Enable PWA Configuration** - Service worker, offline capability
5. **Increase Test Coverage** - From 15% to 40%

## 46 Atomic Issues Breakdown

**NOTE:** For detailed step-by-step instructions with code snippets, see [SPRINT_1_ATOMIC_BREAKDOWN.md](SPRINT_1_ATOMIC_BREAKDOWN.md)

### Phase 0: Pre-Deployment Verification (Issues 1-4, ~1 hour total)

**ISSUE-001: Run Port Conflict Detection**

- Priority: P0
- Time: 10 minutes
- Run: `.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)`
- Verify: Ports 30101-30103 available
- Evidence: Screenshot of successful check

**ISSUE-002: Verify Container Images Exist**

- Priority: P0
- Time: 15 minutes
- Run: `nerdctl -n k8s.io images | grep brave-forms`
- Check: backend image exists (already built)
- Build web image if missing: `nerdctl -n k8s.io build -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .`
- Evidence: Screenshot of `nerdctl images` output

**ISSUE-003: Configure Environment Secrets**

- Priority: P0
- Time: 30 minutes
- Verify `.env.local` has all required keys (Clerk, Weather API, etc.)
- Update placeholder values with real credentials
- Test: Environment file validation
- Evidence: Checklist of configured secrets (values redacted)

**ISSUE-004: Create Kubernetes Secrets**

- Priority: P0
- Time: 15 minutes
- Run: `kubectl create secret generic braveforms-secrets --from-env-file=.env.local -n braveforms`
- Verify: `kubectl get secrets -n braveforms`
- Evidence: Screenshot showing secret created

### Phase 1: Kubernetes Deployment (Issues 5-10, ~3 hours total)

**ISSUE-005: Deploy PostgreSQL to Kubernetes**

- Priority: P0
- Time: 30 minutes
- Run: `kubectl apply -f infrastructure/k8s/local/postgres-deployment.yaml`
- Wait: `kubectl wait --for=condition=ready pod -l app=postgres -n braveforms --timeout=120s`
- Verify: `kubectl get pods -n braveforms -l app=postgres`
- Evidence: Screenshot of pod running

**ISSUE-006: Deploy Redis and MinIO**

- Priority: P0
- Time: 20 minutes
- Run: `kubectl apply -f infrastructure/k8s/local/redis-deployment.yaml`
- Run: `kubectl apply -f infrastructure/k8s/local/minio-deployment.yaml`
- Verify: All 3 infrastructure pods running
- Evidence: `kubectl get all -n braveforms` screenshot

**ISSUE-007: Run Prisma Migrations in Kubernetes**

- Priority: P0
- Time: 30 minutes
- Port-forward: `kubectl port-forward svc/postgres 5432:5432 -n braveforms`
- Run: `cd packages/database && pnpm prisma migrate deploy`
- Verify: All tables created
- Evidence: Screenshot of migration success + table list

**ISSUE-008: Create and Run Seed Script**

- Priority: P0
- Time: 45 minutes
- Create: `apps/backend/prisma/seed.ts` with 2 orgs, 4 projects
- Run: `pnpm --filter backend seed`
- Verify: Data in Prisma Studio
- Evidence: Screenshot of seeded data

### Phase 2: Backend Deployment & Testing (Issues 9-12, ~2 hours total)

**ISSUE-009: Deploy Backend to Kubernetes**

- Priority: P0
- Time: 30 minutes
- Run: `kubectl apply -f infrastructure/k8s/local/backend-deployment.yaml`
- Wait for pod ready
- Check logs: `kubectl logs -f deployment/backend -n braveforms`
- Evidence: Backend logs showing successful startup

**ISSUE-010: Test Backend GraphQL API**

- Priority: P0
- Time: 30 minutes
- Access: http://localhost:30101/graphql
- Run test query to fetch organizations
- Verify: Returns seeded data
- Evidence: Screenshot of GraphQL playground with successful query

**ISSUE-011: Remove Apollo Client Dependencies**

- Priority: P0
- Time: 15 minutes
- Run: `pnpm --filter web remove @apollo/client apollo3-cache-persist graphql-tag`
- Clean install: `pnpm install`
- Evidence: package.json diff

**ISSUE-012: Verify TanStack Query Setup**

- Priority: P0
- Time: 15 minutes (verification only - already implemented)
- Review: `apps/web/lib/query/client.ts`
- Verify: 30-day persistence configured
- Evidence: Configuration verification

### Phase 3: Apollo to TanStack Query Migration (Issues 13-21, ~3 hours total)

**ISSUE-013: Create Weather API Helper** (15 min)
**ISSUE-014: Convert Organizations useQuery** (20 min)
**ISSUE-015: Convert Weather Dashboard** (20 min)
**ISSUE-016: Delete Test Apollo Page** (15 min)
**ISSUE-017: Remove Apollo Dependencies** (10 min)
**ISSUE-018: Test Organization Dashboard** (15 min)
**ISSUE-019: Create Projects API Helper** (15 min)
**ISSUE-020: Convert Project Selector** (25 min)
**ISSUE-021: Verify Web Build** (20 min)

See [SPRINT_1_ATOMIC_BREAKDOWN.md](SPRINT_1_ATOMIC_BREAKDOWN.md) for detailed step-by-step instructions.

### Phase 4: Weather API Integration (Issues 22-35, ~5 hours total)

**ISSUE-022: Research NOAA API** (20 min)
**ISSUE-023: Create NOAA TypeScript Types** (15 min)
**ISSUE-024: Implement getStationForCoordinates** (20 min)
**ISSUE-025: Implement getPrecipitation** (25 min)
**ISSUE-026: Add NOAA Error Handling** (20 min)
**ISSUE-027: Test with Real NOAA API** (20 min)
**ISSUE-028: Precipitation Accumulation Function** (20 min)
**ISSUE-029: EXACTLY 0.25" Threshold Check** (15 min - CRITICAL EPA)
**ISSUE-030: Inspection Deadline Calculator** (25 min)
**ISSUE-031: Unit Tests for Threshold** (30 min)
**ISSUE-032: Unit Tests for Deadlines** (20 min)
**ISSUE-033: Redis Caching for Weather** (30 min)
**ISSUE-034: Test Cache Hit/Miss** (30 min)
**ISSUE-035: Deploy Weather Service to K8s** (20 min)

See [SPRINT_1_ATOMIC_BREAKDOWN.md](SPRINT_1_ATOMIC_BREAKDOWN.md) for detailed implementation.

### Phase 5: PWA & Offline (Issues 36-41, ~2 hours total)

**ISSUE-036: Install PWA Dependencies** (10 min)
**ISSUE-037: Service Worker Config** (25 min)
**ISSUE-038: Create PWA Manifest File** (15 min)
**ISSUE-039: Add Manifest to HTML Head** (10 min)
**ISSUE-040: Configure TanStack Query Persistence** (20 min)
**ISSUE-041: Test with Lighthouse PWA Audit** (25 min)

### Phase 6: Test Coverage (Issues 42-46, ~2 hours total)

**ISSUE-042: Weather Service Unit Tests** (25 min)
**ISSUE-043: Weather Resolver Unit Tests** (20 min)
**ISSUE-044: Organizations Resolver Tests** (20 min)
**ISSUE-045: Projects Resolver Tests** (20 min)
**ISSUE-046: Full Coverage Report** (15 min)

## Total Estimated Time: 18-20 hours (realistic for 2-week sprint with 12 issues already complete)

## Issue Dependencies

**Sequential Flow (46 issues):**

```
Phase 0: Pre-deployment (ISSUE-001 → 002 → 003 → 004)
    ↓
Phase 1: Kubernetes (ISSUE-005 → 006 → 007 → 008 → 009 → 010)
    ↓
Phase 2: Apollo Removal (ISSUE-011 → 012)
    ↓
Phase 3: TanStack Migration (ISSUE-013 → 014 → 015 → 016 → 017 → 018 → 019 → 020 → 021)
    ↓
Phase 4: Weather API (ISSUE-022 → 023 → ... → 035) [14 sequential tasks]
    ↓
Phase 5: PWA (ISSUE-036 → 037 → 038 → 039 → 040 → 041)
    ↓
Phase 6: Testing (ISSUE-042 → 043 → 044 → 045 → 046)
```

**Current Progress:** 12/46 issues complete (26%)

## Definition of Done (Per Issue)

- [ ] Code written and committed
- [ ] Tests written (if applicable, TDD approach)
- [ ] Manual testing completed
- [ ] Screenshot/evidence collected in `evidence/ISSUE-###/`
- [ ] README updated (if changes affect setup)
- [ ] Next issue's prerequisites met
- [ ] NO emoji in any files
- [ ] NO AI branding in commits

## Evidence Requirements

Every issue MUST collect evidence in `docs/sprints/sprint1/evidence/ISSUE-###/`:

- **deployment/**: Screenshots of running services, kubectl output
- **test-results/**: Test passing (green phase)
- **performance/**: API response times, cache metrics
- **compliance/**: 0.25" threshold accuracy proof (ISSUE-017)

## Success Metrics

- [ ] All 46 atomic issues completed (15-30 min each)
- [ ] Kubernetes deployment running (backend + web + db + redis + minio)
- [ ] Web build succeeds without Apollo (TanStack Query migration complete)
- [ ] NOAA API integration with actual HTTP calls (14 weather tasks)
- [ ] 0.25" threshold detection working (EXACT, not approximate - ISSUE-029)
- [ ] Test coverage 40%+ (from 15% baseline - Phase 6)
- [ ] PWA configuration functional (Phase 5)
- [ ] Zero emoji violations in code/commits
- [ ] All evidence collected in `evidence/ISSUE-###/` folders

## Risk Mitigation

| Risk                        | Probability | Impact | Mitigation                                       |
| --------------------------- | ----------- | ------ | ------------------------------------------------ |
| Kubernetes deployment fails | Low         | High   | Full documentation exists, images pre-built      |
| Apollo migration breaks UI  | Medium      | High   | Incremental conversion (one component at a time) |
| NOAA API complex            | Medium      | Medium | 2-hour research spike budgeted                   |
| Test coverage too ambitious | Medium      | Low    | Focus on critical paths (weather, auth)          |

## Kubernetes Quick Reference

**Daily Commands:**

```bash
# Check status
kubectl get all -n braveforms

# View logs
kubectl logs -f deployment/backend -n braveforms
kubectl logs -f deployment/web -n braveforms

# Port forward PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n braveforms

# Restart deployment
kubectl rollout restart deployment/backend -n braveforms
```

**Access Points:**

- Backend GraphQL: http://localhost:30101/graphql
- Web Frontend: http://localhost:30102
- MinIO Console: http://localhost:30103

**Clean Restart:**

```bash
kubectl delete namespace braveforms
.\scripts\k8s-local-setup.ps1 -Action deploy -BuildImages -CreateSecrets
```

## Next Sprint Preview

**Sprint 2: Advanced Features & Forms Engine (Oct 14-25)**

- Dynamic form builder (React Hook Form + Zod)
- Inspection workflow automation
- Photo upload with GPS EXIF
- BullMQ weather monitoring job (every 6 hours)
- Increase test coverage to 60%

---

**Sprint Commitment:** 46 atomic issues (12 complete, 34 remaining)
**Risk Level:** Low (atomic tasks reduce complexity)
**Confidence Level:** 90% (well-defined, junior-dev friendly)
**Current Progress:** 26% complete, 18-20 hours remaining work

**CRITICAL:** This sprint enables production deployment and core EPA compliance monitoring. Quality over speed.

**Remember:**

- NO emoji in code/commits/documentation
- Evidence-based completion only (real systems, no mocks)
- 0.25" threshold must be EXACT (ISSUE-029)
- Kubernetes namespace isolation maintained
- All 46 atomic issue files exist in `docs/sprints/sprint1/issues/`
- See [SPRINT_1_ATOMIC_BREAKDOWN.md](SPRINT_1_ATOMIC_BREAKDOWN.md) for detailed instructions
