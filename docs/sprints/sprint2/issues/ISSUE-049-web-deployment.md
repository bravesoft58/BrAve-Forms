# ISSUE-049: Deploy Web Frontend to Kubernetes

**Sprint:** Sprint 2 | **Phase:** 0 - Sprint 1 Carryover | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-02
**Dependencies:** ISSUE-047 (build must succeed)

## What You'll Do

Deploy the Next.js web frontend to Kubernetes with standalone build, configure NodePort 30102, and verify full stack integration with backend GraphQL API.

## Prerequisites

- [ ] ISSUE-047 complete (build succeeds without errors)
- [ ] Backend deployed to Kubernetes (from Sprint 1)
- [ ] PostgreSQL, Redis, MinIO running in braveforms namespace

## Step-by-Step Instructions

### Step 1: Create Web Deployment Manifest (1 hour)

Create `infrastructure/k8s/local/web-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: braveforms
  labels:
    app: web
    tier: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
        tier: frontend
    spec:
      containers:
        - name: web
          image: brave-forms-web:local
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NEXT_PUBLIC_BACKEND_URL
              value: 'http://backend:4000/graphql'
            - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
              valueFrom:
                secretKeyRef:
                  name: braveforms-secrets
                  key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            - name: CLERK_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: braveforms-secrets
                  key: CLERK_SECRET_KEY
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: braveforms
  labels:
    app: web
spec:
  type: NodePort
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30102
      protocol: TCP
      name: http
  selector:
    app: web
```
