# ISSUE-009 Backend Deployment - BLOCKED

**Timestamp:** 2025-10-01 10:00:00 EDT
**Status:** BLOCKED
**Time Spent:** 30 minutes
**Blocker Identified:** 2025-10-01 09:45:00 EDT

## Summary

Backend deployment to Kubernetes blocked by missing dependencies in container image. Image requires rebuild with proper production configuration.

## Deployment Attempts

### Attempt 1: Initial Deployment

**Command:**
```bash
kubectl apply -f infrastructure/k8s/local/backend-deployment.yaml
```

**Result:** Pods pending due to insufficient CPU

**Error:**
```
0/1 nodes are available: 1 Insufficient cpu. preemption: 0/1 nodes are available: 1 No preemption victims found for incoming pod.
```

**CPU Allocation:**
- Total CPU: ~14000m
- Allocated: 13950m (99%)
- Backend request: 200m per replica × 2 replicas = 400m
- Root cause: velocitymesh namespace consuming most CPU

### Attempt 2: Reduce CPU Request

**Fix:** Reduced CPU request from 200m to 50m

**Changes:**
```yaml
resources:
  requests:
    cpu: "50m"  # Reduced from 200m
    memory: "256Mi"
```

**Command:**
```bash
kubectl delete deployment backend -n braveforms
kubectl apply -f infrastructure/k8s/local/backend-deployment.yaml
```

**Result:** Pods scheduled but CreateContainerConfigError

### Attempt 3: Add Missing Secret Keys

**Error:** Missing Clerk and OpenWeather API keys in secret

**Fix:** Added placeholder values to secret:
```bash
kubectl create secret generic brave-forms-secrets -n braveforms \
  --from-literal=clerk-secret-key=placeholder_clerk_key \
  --from-literal=clerk-publishable-key=placeholder_clerk_pub_key \
  --from-literal=clerk-jwt-key=placeholder_clerk_jwt_key \
  --from-literal=openweather-api-key=placeholder_weather_key
```

**Result:** Pods start but crash with MODULE_NOT_FOUND error

### Attempt 4: Container Crash (BLOCKER)

**Error:**
```
Error: Cannot find module '@nestjs/core'
Require stack:
- /app/dist/main.js

Node.js v20.19.5
```

**Pod Status:**
```
NAME                       READY   STATUS             RESTARTS      AGE
backend-8655578d79-9dtbg   0/1     CrashLoopBackOff   4 (44s ago)   2m25s
```

**Root Cause:** Container image missing node_modules

## Root Cause Analysis

### Image Build Issue

**Current Image:** brave-forms-backend:local (built 19 hours ago)

**Dockerfile Analysis:**
```dockerfile
FROM node:18-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY apps/backend/package.json ./
RUN pnpm install
COPY apps/backend .
CMD ["pnpm", "dev"]
```

**Problem:** Development Dockerfile but container trying to run production build

**Evidence:**
- Container attempts to run `/app/dist/main.js` (production)
- Dockerfile uses `CMD ["pnpm", "dev"]` (development)
- Missing production build step
- Missing proper node_modules copy or production install

### Required Fix

**Image needs rebuild with:**
1. Production build step (`pnpm build`)
2. Proper dependency installation for production
3. Correct CMD to run built application
4. Multi-stage build to reduce image size

**OR**

Use development mode consistently:
1. Ensure `pnpm dev` command works
2. Mount source code (not suitable for Kubernetes)
3. Install all dependencies including devDependencies

## Blocker Details

**Type:** Infrastructure / Build System
**Impact:** Cannot complete ISSUE-009, ISSUE-010
**Estimated Fix Time:** 1-2 hours (rebuild image, test, deploy)

**Alternatives:**
1. Rebuild image with production configuration
2. Fix Dockerfile for proper dev/prod modes
3. Use pre-built image from CI/CD (not available yet)

## Sprint Impact

**Issues Affected:**
- ISSUE-009: Deploy Backend (BLOCKED)
- ISSUE-010: Test GraphQL API (BLOCKED - depends on 009)

**Issues Unaffected:**
- ISSUE-011-015: Apollo removal (web frontend, no backend needed)
- ISSUE-016-018: Weather API (backend code changes, test later)
- ISSUE-019-020: PWA and testing (frontend focused)

**Recommendation:** Continue with ISSUE-011 (Apollo removal) while backend image is rebuilt

## Temporary Workarounds Attempted

**None Successful:**
- Reducing CPU requests: Solved scheduling but not crash
- Adding placeholder secrets: Solved config error but not crash
- Scaling to 1 replica: Did not resolve module issue

## Next Steps

**To Unblock:**

1. Fix Dockerfile for production:
   ```dockerfile
   FROM node:18-alpine AS builder
   RUN npm install -g pnpm
   WORKDIR /app
   COPY . .
   RUN pnpm install --frozen-lockfile
   RUN pnpm --filter @brave-forms/backend build

   FROM node:18-alpine
   RUN npm install -g pnpm
   WORKDIR /app
   COPY --from=builder /app/apps/backend/dist ./dist
   COPY --from=builder /app/apps/backend/package.json ./
   COPY --from=builder /app/node_modules ./node_modules
   CMD ["node", "dist/main.js"]
   ```

2. Rebuild image:
   ```bash
   nerdctl -n k8s.io build -f apps/backend/Dockerfile.production -t brave-forms-backend:local .
   ```

3. Redeploy:
   ```bash
   kubectl delete deployment backend -n braveforms
   kubectl apply -f infrastructure/k8s/local/backend-deployment.yaml
   ```

4. Verify startup:
   ```bash
   kubectl logs -f deployment/backend -n braveforms
   ```

## Infrastructure State

**Working Components:**
- PostgreSQL: Running, migrated, seeded
- Redis: Running, password authenticated
- MinIO: Running, console accessible on port 30103

**Blocked Components:**
- Backend API: CrashLoopBackOff
- Web Frontend: Build failing (separate issue, Apollo imports)

**Secret Status:**
```
brave-forms-secrets contains:
- database-user, database-password (PostgreSQL)
- redis-password (Redis)
- minio-access-key, minio-secret-key (MinIO)
- clerk-secret-key, clerk-publishable-key, clerk-jwt-key (placeholders)
- openweather-api-key (placeholder)
```

## Evidence Collected

**Pod Status:**
```bash
kubectl get pods -n braveforms -l app=backend
NAME                       READY   STATUS             RESTARTS      AGE
backend-8655578d79-9dtbg   0/1     CrashLoopBackOff   4 (44s ago)   2m25s
```

**Container Logs:**
```
Error: Cannot find module '@nestjs/core'
Node.js v20.19.5
```

**Node CPU Allocation:**
```
Allocated resources:
  cpu                13950m (99%)   32600m (232%)
  memory             26618Mi (55%)  48818Mi (101%)
```

---

**Evidence Type:** Deployment blocker documentation
**Status:** BLOCKED - Image rebuild required
**Sprint 1 Progress:** 8/20 issues complete (40%), 2 blocked
**Recommendation:** Proceed with Apollo removal (ISSUE-011) in parallel
