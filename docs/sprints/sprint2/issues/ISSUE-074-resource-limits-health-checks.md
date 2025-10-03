# ISSUE-074: Resource Limits and Health Checks

**Sprint:** Sprint 2 | **Phase:** 5 - Architecture Review | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-072 (optimized containers)

## What You'll Do

Define CPU/memory limits for all services in K8s manifests, add /health and /readiness endpoints to backend, configure liveness/readiness probes, test pod restart behavior.

## Step-by-Step Instructions

### Step 1: Add Health Endpoints to Backend (45 min)

Create `apps/backend/src/health/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prisma.pingCheck('database')]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prisma.pingCheck('database'),
      // Add more checks as needed
    ]);
  }
}
```

Install dependencies:

```bash
cd apps/backend
pnpm add @nestjs/terminus
```

### Step 2: Define Resource Limits (45 min)

Update `infrastructure/k8s/local/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: braveforms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: braveforms/backend:latest
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: braveforms-secrets
                  key: database-url
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

Update web, postgres, redis deployments similarly.

### Step 3: Apply Updated Manifests (15 min)

```bash
kubectl apply -f infrastructure/k8s/local/
kubectl rollout status deployment/backend -n braveforms
```

### Step 4: Test Health Checks (15 min)

```bash
# Test health endpoint
curl http://localhost:30101/health

# Expected:
# {"status":"ok","info":{"database":{"status":"up"}}}

# Test readiness
curl http://localhost:30101/health/ready
```

### Step 5: Test Pod Restart Behavior (30 min)

Simulate failures:

```bash
# Kill backend pod
kubectl delete pod -l app=backend -n braveforms

# Watch recreation
kubectl get pods -n braveforms -w

# Verify health checks pass
kubectl describe pod -l app=backend -n braveforms | grep -A 10 "Liveness"
```

### Step 6: Document Resource Allocation (30 min)

Create `docs/infrastructure/RESOURCE_LIMITS.md`:

```markdown
# Kubernetes Resource Limits

## Backend

- Requests: 256Mi RAM, 250m CPU
- Limits: 512Mi RAM, 500m CPU
- Rationale: GraphQL API with Prisma connection pooling

## Web

- Requests: 128Mi RAM, 100m CPU
- Limits: 256Mi RAM, 200m CPU
- Rationale: Static Next.js standalone server

## PostgreSQL

- Requests: 512Mi RAM, 500m CPU
- Limits: 1Gi RAM, 1000m CPU
- Rationale: Database with JSONB queries

## Redis

- Requests: 128Mi RAM, 100m CPU
- Limits: 256Mi RAM, 200m CPU
- Rationale: Queue and cache

## Health Checks

- Liveness: /health (pod restart if fails)
- Readiness: /health/ready (traffic routing)
```

## Files to Create

- `health.controller.ts`
- `health.module.ts`
- Update all K8s deployment manifests
- `docs/infrastructure/RESOURCE_LIMITS.md`

## Verification Checklist

- [ ] Health endpoints functional
- [ ] Resource limits defined for all services
- [ ] Liveness probes configured
- [ ] Readiness probes configured
- [ ] Pod restart behavior tested
- [ ] Documentation created

## Time Estimate: 2 hours

## Sprint Complete

**All 27 issues defined. Sprint 2 ready for execution.**
