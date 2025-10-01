# Sprint 1 Master Plan - Kubernetes Deployment & Apollo Refactor (FINAL)

**Created:** 2025-09-30 20:15:00 EDT
**Last Updated:** 2025-09-30 20:21:00 EDT
**Sprint Duration:** September 30 - October 14, 2025 (2 weeks)
**Sprint Goal:** Deploy to Kubernetes, refactor to TanStack Query, implement core weather API
**Business Value:** Production-ready infrastructure + EPA 0.25" precipitation monitoring
**Velocity Target:** 20 atomic issues (1-3 hours each, junior-dev friendly)

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

## 20 Atomic Issues Breakdown

### Phase 0: Pre-Deployment Verification (Issues 1-3, ~1 hour total)

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

### Phase 1: Kubernetes Deployment (Issues 4-8, ~2-3 hours total)

**ISSUE-004: Create Kubernetes Secrets**

- Priority: P0
- Time: 15 minutes
- Run: `kubectl create secret generic braveforms-secrets --from-env-file=.env.local -n braveforms`
- Verify: `kubectl get secrets -n braveforms`
- Evidence: Screenshot showing secret created

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

### Phase 2: Backend Deployment (Issues 9-10, ~1 hour total)

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

### Phase 3: Web Apollo Removal (Issues 11-15, ~4-5 hours total)

**ISSUE-011: Remove Apollo Client Dependencies**

- Priority: P0 (Blocker for web build)
- Time: 30 minutes
- Delete: `apps/web/app/test-apollo/page.tsx`
- Run: `pnpm --filter web remove @apollo/client apollo3-cache-persist`
- Verify: package.json updated
- Evidence: Git diff of package.json

**ISSUE-012: Create TanStack Query Setup**

- Priority: P0
- Time: 1 hour
- Create: `apps/web/lib/query-client.ts`
- Add: PersistQueryClientProvider to layout.tsx
- Configure: networkMode: 'offlineFirst', gcTime: 30 days
- Evidence: Created files + configuration code

**ISSUE-013: Convert WeatherDashboard to TanStack Query**

- Priority: P0
- Time: 1 hour
- Convert component from Apollo useQuery to TanStack Query
- Create: `apps/web/lib/api/weather.ts` API helper
- Test: Component renders with backend data
- Evidence: Before/after code + screenshot of working component

**ISSUE-014: Convert OrganizationDashboard to TanStack Query**

- Priority: P0
- Time: 1 hour
- Convert component
- Create: `apps/web/lib/api/organizations.ts`
- Test: Renders correctly
- Evidence: Code + screenshot

**ISSUE-015: Convert ProjectSelector to TanStack Query**

- Priority: P0
- Time: 1 hour
- Convert component
- Create: `apps/web/lib/api/projects.ts`
- Verify: All Apollo removed, web builds successfully
- Evidence: `pnpm --filter web build` success screenshot

### Phase 4: Weather API Integration (Issues 16-18, ~4-5 hours total)

**ISSUE-016: Create NOAA API Client**

- Priority: P1
- Time: 2 hours
- Create: `apps/backend/src/modules/weather/clients/noaa.client.ts`
- Implement: `getStationForCoordinates()`, `getPrecipitation()`
- Test: Actual API calls to NOAA
- Evidence: API response screenshots

**ISSUE-017: Implement 0.25" Threshold Detection**

- Priority: P0 (CRITICAL - EPA Compliance)
- Time: 2 hours
- Create: 24-hour rolling window calculation
- Implement: EXACTLY 0.25" threshold (not approximate)
- Test: With exact 0.25" precipitation data
- Evidence: Test results + code citing EPA CGP 2022 Section 4.4

**ISSUE-018: Add Redis Caching to Weather Service**

- Priority: P1
- Time: 1 hour
- Implement: 6-hour TTL for precipitation data
- Test: Cache hit/miss scenarios
- Evidence: Redis cache verification

### Phase 5: PWA & Testing (Issues 19-20, ~2-3 hours total)

**ISSUE-019: Add PWA Configuration**

- Priority: P1
- Time: 2 hours
- Install: `@ducanh2912/next-pwa`
- Create: `manifest.json`
- Configure: Service worker with caching strategies
- Test: Lighthouse PWA audit
- Evidence: PWA configuration + Lighthouse score

**ISSUE-020: Expand Test Coverage to 40%**

- Priority: P1
- Time: 2-3 hours (distributed across issues)
- Add: 50+ tests for weather module, auth, compliance
- Focus: TDD approach for new weather API code
- Verify: Coverage report shows 40%+
- Evidence: Coverage report screenshot

## Total Estimated Time: 25-30 hours (realistic for 2-week sprint)

## Issue Dependencies

```
ISSUE-001 (Port Check)
    ↓
ISSUE-002 (Images) → ISSUE-003 (Secrets)
    ↓                       ↓
ISSUE-004 (Create Secrets)
    ↓
ISSUE-005 (PostgreSQL) → ISSUE-006 (Redis/MinIO)
    ↓
ISSUE-007 (Migrations) → ISSUE-008 (Seed)
    ↓
ISSUE-009 (Backend Deploy) → ISSUE-010 (Test GraphQL)
    ↓
ISSUE-011 (Remove Apollo) → ISSUE-012 (TanStack Setup)
    ↓
ISSUE-013, 014, 015 (Component Conversions)
    ↓
ISSUE-016 (NOAA Client) → ISSUE-017 (0.25" Threshold) → ISSUE-018 (Caching)
    ↓
ISSUE-019 (PWA) ← ISSUE-015 (Web Build Fixed)
    ↓
ISSUE-020 (Testing - distributed)
```

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

- [ ] All P0 issues completed (16 issues)
- [ ] Kubernetes deployment running (backend + web + db)
- [ ] Web build succeeds without Apollo
- [ ] NOAA API integration with actual HTTP calls
- [ ] 0.25" threshold detection working (EXACT, not approximate)
- [ ] Test coverage 40%+ (from 15% baseline)
- [ ] PWA configuration functional
- [ ] Zero emoji violations in code/commits

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

**Sprint Commitment:** 18-20 issues completed (realistic)
**Risk Level:** Medium (infrastructure known, architecture change needed)
**Confidence Level:** 80%

**CRITICAL:** This sprint enables production deployment and core EPA compliance monitoring. Quality over speed.

**Remember:**

- NO emoji in code/commits/documentation
- Evidence-based completion only (real systems, no mocks)
- 0.25" threshold must be EXACT
- Kubernetes namespace isolation maintained
