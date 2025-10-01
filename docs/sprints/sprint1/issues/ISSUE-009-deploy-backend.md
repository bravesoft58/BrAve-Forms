# ISSUE-009: Deploy Backend to Kubernetes

**Sprint:** Sprint 1 | **Phase:** 2 - Backend Deployment | **Priority:** P0
**Time:** 30 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Deploy NestJS GraphQL backend to Kubernetes and verify it starts successfully.

## Step-by-Step

```bash
kubectl apply -f infrastructure/k8s/local/backend-deployment.yaml
kubectl wait --for=condition=ready pod -l app=backend -n braveforms --timeout=180s
kubectl logs -f deployment/backend -n braveforms
```

## Acceptance Criteria

- [ ] Backend pod running
- [ ] Logs show "Nest application successfully started"
- [ ] No errors in logs

## Evidence

`evidence/ISSUE-009/deployment/backend-running.png`
