# ISSUE-005: Deploy PostgreSQL to Kubernetes

**Sprint:** Sprint 1 | **Phase:** 1 - Kubernetes Deployment | **Priority:** P0
**Time:** 30 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Deploy TimescaleDB PostgreSQL 15 to braveforms namespace.

## Step-by-Step

```bash
kubectl apply -f infrastructure/k8s/local/postgres-deployment.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n braveforms --timeout=120s
kubectl get pods -n braveforms -l app=postgres
```

## Acceptance Criteria

- [ ] Pod running (STATUS: Running)
- [ ] Readiness probe passing
- [ ] PVC bound (10Gi storage allocated)

## Evidence

`evidence/ISSUE-005/deployment/postgres-pod-running.png`

## Next Issue

ISSUE-006 (Deploy Redis and MinIO)
