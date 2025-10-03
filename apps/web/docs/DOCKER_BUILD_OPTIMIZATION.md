# Docker Build Optimization Results

**Issue:** Sprint 2 ISSUE-050
**Completed:** 2025-10-03 (During ISSUE-049)
**Developer:** Development Team

## Summary

Frontend build optimization was completed during ISSUE-049 (Web Deployment) implementation. The multi-stage Docker build with Next.js standalone output was implemented proactively, achieving all ISSUE-050 objectives before this issue was formally started.

## Before Optimization (Baseline - Theoretical)

**Without multi-stage build:**

- Image size: ~600-800MB (estimated)
- Build time: ~5-7 minutes
- Layer count: 20+ layers
- Includes: Dev dependencies, build tools, source code, node_modules

## After Optimization (ISSUE-049 Implementation)

**Actual Results:**

- Image size: **187.9MB**
- Compressed size: **56.15MB**
- Build time: ~3 minutes
- Layer count: 12 layers (optimized)
- Includes: Production runtime only

**Reduction:** 69-76% size reduction (compared to theoretical baseline)

## Multi-Stage Build Strategy

### Stage 1: Dependencies (deps)

```dockerfile
FROM node:18-alpine AS deps
```

- Install pnpm 8
- Copy package.json files
- Install production dependencies only
- Minimal layer size

### Stage 2: Builder

```dockerfile
FROM node:18-alpine AS builder
```

- Install all dependencies (dev + prod for build)
- Copy source code
- Build Next.js app with standalone output
- Generate optimized production bundle

### Stage 3: Runner (Production)

```dockerfile
FROM node:18-alpine AS runner
```

- Copy only standalone build artifacts
- Create non-root user (nextjs:nodejs, UID 1001)
- Set production environment variables
- Minimal attack surface

## Key Optimizations

### 1. Standalone Output Mode

**Configuration:** `next.config.js` line 203

```javascript
output: 'standalone',
```

- Includes only required dependencies
- Excludes dev dependencies and unused packages
- Self-contained server with minimal footprint

### 2. SWC Minification

**Configuration:** `next.config.js` line 91

```javascript
swcMinify: true,
```

- Faster than Babel (5-10x)
- Better minification (smaller bundles)
- Lower memory usage during build

### 3. Optimized Package Imports

**Configuration:** Webpack splitChunks

- Mantine components: Separate chunk (priority 30)
- TanStack Query: Separate chunk (priority 20)
- Better browser caching
- Faster page loads

### 4. Alpine Base Image

- node:18-alpine vs node:18 (full)
- ~50MB vs ~300MB base image
- Reduced attack surface
- Faster image pulls

### 5. Security Hardening

- Non-root user (nextjs:nodejs)
- Read-only file system compatible
- No dev tools in production image
- Minimal packages (security updates easier)

## Performance Metrics

### Image Size Comparison

| Metric            | Value                          |
| ----------------- | ------------------------------ |
| Uncompressed      | 187.9MB                        |
| Compressed        | 56.15MB                        |
| Compression Ratio | 3.35:1                         |
| Target (<300MB)   | ✅ ACHIEVED (38% under target) |

### Build Performance

| Metric           | Value                    |
| ---------------- | ------------------------ |
| Build time       | ~3 minutes               |
| Layer count      | 12 layers                |
| Cache efficiency | High (multi-stage reuse) |
| Rebuild time     | <1 minute (with cache)   |

### Runtime Performance

| Metric            | Value                 |
| ----------------- | --------------------- |
| Container startup | 117ms (Next.js ready) |
| Memory footprint  | ~256MB (running)      |
| Response time     | <734ms (page load)    |

## Build Command

```bash
# From repository root
nerdctl --namespace k8s.io build \
  -t brave-forms-web:local \
  -f apps/web/Dockerfile .
```

## Deployment

```bash
# Apply Kubernetes deployment
kubectl apply -f infrastructure/k8s/local/web-deployment.yaml

# Verify deployment
kubectl get pods -n braveforms -l app=web
```

## Security Benefits

### 1. Non-Root User

- User: nextjs (UID 1001)
- Group: nodejs (GID 1001)
- Prevents privilege escalation
- Container runtime security best practice

### 2. Minimal Attack Surface

- No shell (Alpine minimal)
- No dev tools (webpack, babel, etc.)
- No source code (only compiled artifacts)
- Reduced vulnerability window

### 3. Read-Only Compatible

- All files owned by nextjs user
- No write operations required at runtime
- Can run with read-only root filesystem
- Enhanced security posture

## Troubleshooting

### Issue: Image size still large

**Check:**

```bash
nerdctl --namespace k8s.io images | grep brave-forms-web
```

**Expected:** <200MB uncompressed

**Solution:** Verify standalone output is enabled in next.config.js

### Issue: Container fails to start

**Check logs:**

```bash
kubectl logs -f deployment/web -n braveforms
```

**Common causes:**

- Missing .next/standalone directory (build failed)
- Missing .next/static directory (not copied)
- Environment variables not set

### Issue: Build fails

**Check Dockerfile:**

- Verify all COPY paths are correct
- Ensure pnpm install succeeds in builder stage
- Check Next.js build output for errors

## Lessons Learned

1. **Standalone output is essential** - Without it, image size would be 4-5x larger
2. **Multi-stage builds save time** - Cached layers speed up rebuilds significantly
3. **Alpine base matters** - 50MB vs 300MB base image is a huge difference
4. **Security by default** - Non-root user from the start, not as an afterthought

## Comparison to Industry Standards

| Approach                       | Image Size | Our Approach            |
| ------------------------------ | ---------- | ----------------------- |
| Single-stage with dev deps     | 600-800MB  | ❌ Not used             |
| Multi-stage without standalone | 300-400MB  | ❌ Not used             |
| **Multi-stage + standalone**   | **~200MB** | ✅ **USED (187.9MB)**   |
| Distroless                     | ~150MB     | ❌ Overkill for Next.js |

Our implementation is **best practice** for Next.js production deployments.

## References

- Next.js Standalone Output: https://nextjs.org/docs/app/api-reference/next-config-js/output
- Docker Multi-Stage Builds: https://docs.docker.com/build/building/multi-stage/
- Alpine Linux: https://alpinelinux.org/
- ISSUE-049 Completion Report: docs/sprints/sprint2/evidence/ISSUE-049/COMPLETION-REPORT.md

---

**Created:** 2025-10-03 09:30:00 EDT
**Last Updated:** 2025-10-03 09:30:00 EDT
**Status:** Production-ready, deployed to Kubernetes
