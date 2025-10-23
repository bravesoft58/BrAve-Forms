# ISSUE-050: Frontend Build Optimization

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-050/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 0 - Sprint 1 Carryover | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-049 (web deployment working)

## What You'll Do

Implement multi-stage Docker build for web container to reduce production image size by 50%+ and improve build times. Target container size below 300MB by removing dev dependencies and optimizing layers.

## Prerequisites

- [ ] ISSUE-049 completed (web deployment functional)
- [ ] Docker/nerdctl available
- [ ] Web app builds successfully with pnpm build

## Step-by-Step Instructions

### Step 1: Analyze Current Container Size (15 min)

```bash
# Check current web image size
nerdctl --namespace k8s.io images | grep braveforms/web

# Expected: >600MB (with dev dependencies)
```

Document baseline metrics:

- Current image size: \_\_\_ MB
- Build time: \_\_\_ seconds
- Layer count: \_\_\_ layers

### Step 2: Create Multi-Stage Dockerfile (45 min)

Edit `apps/web/Dockerfile`:

```dockerfile
# Stage 1: Dependencies (builder)
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY . .

# Build Next.js app
WORKDIR /app/apps/web
RUN pnpm build

# Stage 3: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only production dependencies
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Step 3: Update next.config.js for Standalone Output (15 min)

Edit `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone build
  reactStrictMode: true,
  swcMinify: true, // Use SWC for minification (faster)
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

module.exports = nextConfig;
```

### Step 4: Build Optimized Image (15 min)

```bash
cd apps/web

# Build with multi-stage Dockerfile
nerdctl --namespace k8s.io build -t braveforms/web:optimized .

# Check new image size
nerdctl --namespace k8s.io images | grep braveforms/web
```

Expected output:

```
braveforms/web   optimized   abc123   2 minutes ago   <300MB
braveforms/web   latest      def456   1 hour ago      >600MB
```

### Step 5: Test Optimized Container (15 min)

```bash
# Run optimized container locally
nerdctl --namespace k8s.io run -d \
  --name web-optimized-test \
  -p 3001:3000 \
  braveforms/web:optimized

# Test access
curl http://localhost:3001

# Check logs
nerdctl --namespace k8s.io logs web-optimized-test

# Stop and remove test container
nerdctl --namespace k8s.io stop web-optimized-test
nerdctl --namespace k8s.io rm web-optimized-test
```

### Step 6: Update Deployment with Optimized Image (15 min)

```bash
# Tag optimized as latest
nerdctl --namespace k8s.io tag braveforms/web:optimized braveforms/web:latest

# Restart web deployment
kubectl rollout restart deployment/web -n braveforms

# Verify deployment
kubectl get pods -n braveforms -l app=web
kubectl logs -f deployment/web -n braveforms
```

Access http://localhost:30102 and verify functionality.

### Step 7: Document Optimization Results (15 min)

Create `apps/web/docs/DOCKER_BUILD_OPTIMIZATION.md`:

````markdown
# Docker Build Optimization Results

**Issue:** Sprint 2 ISSUE-050

## Before Optimization

- Image size: \_\_\_ MB
- Build time: \_\_\_ seconds
- Layer count: \_\_\_ layers
- Includes: Dev dependencies, build tools, source code

## After Optimization

- Image size: **_ MB (_**% reduction)
- Build time: **_ seconds (_**% faster)
- Layer count: \_\_\_ layers
- Includes: Production runtime only

## Multi-Stage Build Strategy

1. **Stage 1 (deps):** Install all dependencies
2. **Stage 2 (builder):** Build Next.js app
3. **Stage 3 (runner):** Copy only production artifacts

## Key Optimizations

- Standalone output mode (includes only required dependencies)
- SWC minification (faster than Babel)
- Optimized package imports for Mantine
- Non-root user for security
- Alpine base image (smaller)

## Build Command

```bash
nerdctl --namespace k8s.io build -t braveforms/web:latest apps/web
```
````

## Security Improvements

- Non-root user (nextjs:nodejs)
- Minimal attack surface (no dev tools)
- Read-only file system compatible

````

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

No unit tests required for Docker build optimization. Validation via:
1. Image size measurement
2. Container functionality testing
3. Production deployment verification

### Phase 2: Implement Optimization (Green Phase)

**Run build:**
```bash
cd apps/web
nerdctl --namespace k8s.io build -t braveforms/web:optimized .
````

**Expected:** Build succeeds, image size <300MB

**Screenshot:** Save build output to `evidence/ISSUE-050/deployment/optimized-build-success.png`

### Phase 3: Verification

**Check image size:**

```bash
nerdctl --namespace k8s.io images | grep braveforms/web
```

**Expected:** <300MB (50%+ reduction from baseline)

**Screenshot:** Save comparison to `evidence/ISSUE-050/performance/image-size-comparison.png`

## Files to Modify/Create

**Modify:**

- `apps/web/Dockerfile` (multi-stage build)
- `apps/web/next.config.js` (standalone output)

**Create:**

- `apps/web/docs/DOCKER_BUILD_OPTIMIZATION.md` (optimization results)

## Verification Checklist

- [ ] Multi-stage Dockerfile created with 3 stages
- [ ] next.config.js configured for standalone output
- [ ] Optimized image builds successfully
- [ ] Image size <300MB (50%+ reduction)
- [ ] Container runs and serves web app
- [ ] Deployment updated with optimized image
- [ ] Web app accessible at http://localhost:30102
- [ ] Documentation created with before/after metrics
- [ ] Zero emoji in code or documentation
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-050/

**Required:**

- deployment/
  - baseline-image-size.png (before optimization)
  - optimized-build-success.png (build output)
  - image-size-comparison.png (before/after)
  - container-running.png (nerdctl ps showing optimized container)
- performance/
  - build-time-comparison.png (before/after build times)
  - layer-count.png (docker history showing layers)
- documentation/
  - optimization-results.png (DOCKER_BUILD_OPTIMIZATION.md)

## Troubleshooting

**Problem:** Build fails with "standalone not found"

- **Cause:** Next.js version doesn't support standalone
- **Solution:** Upgrade to Next.js 14+ (already at 14.x)

**Problem:** Container starts but returns 404

- **Cause:** Static files not copied correctly
- **Solution:** Verify COPY --from=builder .next/static step

**Problem:** Image size still >400MB

- **Cause:** Dev dependencies included
- **Solution:** Verify only copying from .next/standalone, not node_modules

## Success Criteria

- [ ] Web container size reduced by 50%+ (target <300MB)
- [ ] Multi-stage build implemented (3 stages)
- [ ] Standalone output configured
- [ ] Container runs successfully in Kubernetes
- [ ] Web app fully functional at http://localhost:30102
- [ ] Documentation created with metrics
- [ ] Build time improved or maintained

## Time Estimate

**2 hours total:**

- Analysis: 15 min
- Dockerfile creation: 45 min
- Config update: 15 min
- Build testing: 15 min
- Container testing: 15 min
- Deployment update: 15 min
- Documentation: 15 min

## Next Issue

**ISSUE-051:** Design Form Schema in Prisma (2h)

- Prerequisites: None (independent)
- Starts: Phase 1 - Forms Engine Backend

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-050/COMPLETION-REPORT.md)

**Time:** 0 hours (proactive implementation during ISSUE-049)

**Summary:**

- Multi-stage Docker build with Next.js standalone output
- Final image size: 187.9MB (38% under 300MB target, 69-76% reduction)
- Non-root user (nextjs:nodejs, UID 1001) for security
- Build time: ~3 minutes
- Startup time: 117ms
- All best practices implemented proactively
