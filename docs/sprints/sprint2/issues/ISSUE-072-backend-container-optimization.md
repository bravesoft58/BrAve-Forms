# ISSUE-072: Backend Container Optimization

**Sprint:** Sprint 2 | **Phase:** 5 - Architecture Review | **Priority:** P0
**Time:** 3 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** Sprint 1 backend deployment

## What You'll Do

Implement multi-stage Dockerfile for backend (builder → runner), remove dev dependencies from production, analyze and reduce image size. Target: <500MB backend container.

## Step-by-Step Instructions

### Step 1: Analyze Current Container Size (15 min)

```bash
nerdctl --namespace k8s.io images | grep braveforms/backend
```

Document baseline:

- Current size: \_\_\_ MB
- Build time: \_\_\_ seconds

### Step 2: Create Multi-Stage Dockerfile (90 min)

Create `apps/backend/Dockerfile`:

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@8

COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

COPY . .

WORKDIR /app/apps/backend
RUN pnpm build

# Stage 3: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy only production dependencies
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### Step 3: Build Optimized Image (30 min)

```bash
cd apps/backend
nerdctl --namespace k8s.io build -t braveforms/backend:optimized .

# Check size
nerdctl --namespace k8s.io images | grep braveforms/backend
```

Target: <500MB

### Step 4: Test Optimized Container (30 min)

```bash
# Run locally
nerdctl --namespace k8s.io run -d \
  --name backend-optimized-test \
  -p 3002:3001 \
  braveforms/backend:optimized

# Check logs
nerdctl --namespace k8s.io logs backend-optimized-test

# Test GraphQL
curl http://localhost:3002/graphql

# Cleanup
nerdctl --namespace k8s.io stop backend-optimized-test
nerdctl --namespace k8s.io rm backend-optimized-test
```

### Step 5: Update Kubernetes Deployment (15 min)

```bash
# Tag as latest
nerdctl --namespace k8s.io tag braveforms/backend:optimized braveforms/backend:latest

# Restart deployment
kubectl rollout restart deployment/backend -n braveforms
```

### Step 6: Document Results (30 min)

Create `apps/backend/docs/DOCKER_OPTIMIZATION.md` with before/after metrics.

## Files to Create

- `apps/backend/Dockerfile` (multi-stage)
- `apps/backend/docs/DOCKER_OPTIMIZATION.md`

## Verification Checklist

- [ ] Multi-stage Dockerfile created
- [ ] Backend container <500MB
- [ ] Container runs successfully
- [ ] GraphQL API functional
- [ ] Documentation created with metrics

## Time Estimate: 3 hours

## Next Issue

**ISSUE-073:** Separation of Concerns Review (3h)
