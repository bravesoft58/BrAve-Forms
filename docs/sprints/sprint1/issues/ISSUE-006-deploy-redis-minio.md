# ISSUE-006: Deploy Redis and MinIO

**Sprint:** Sprint 1 | **Phase:** 1 - Kubernetes Deployment | **Priority:** P0
**Time:** 20 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Deploy Redis (caching) and MinIO (S3-compatible storage) to Kubernetes.

## Step-by-Step

```bash
kubectl apply -f infrastructure/k8s/local/redis-deployment.yaml
kubectl apply -f infrastructure/k8s/local/minio-deployment.yaml
kubectl get all -n braveforms
```

## Acceptance Criteria

- [ ] Redis pod running
- [ ] MinIO pod running
- [ ] All 3 infrastructure pods ready (postgres, redis, minio)

## Evidence

`evidence/ISSUE-006/deployment/all-infrastructure-running.png`

## Next Issue

ISSUE-007 (Run Prisma Migrations)
