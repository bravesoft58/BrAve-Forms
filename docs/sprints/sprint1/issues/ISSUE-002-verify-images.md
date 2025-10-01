# ISSUE-002: Verify Container Images Exist

**Sprint:** Sprint 1 | **Phase:** 0 - Pre-Deployment | **Priority:** P0
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Verify backend and web container images are built and available in Rancher Desktop's k8s.io namespace.

## Why This Matters

Kubernetes deployments use `imagePullPolicy: Never` to force local images. If images don't exist, pods will fail with ImagePullBackOff error.

## Prerequisites

- Rancher Desktop running
- nerdctl available in PATH

## Step-by-Step

### 1. Check Existing Images

```bash
nerdctl -n k8s.io images | grep brave-forms
```

**Expected:** Should see `brave-forms-backend:local` (built 5 hours ago per audit)

### 2. If Backend Image Missing

```bash
nerdctl -n k8s.io build -f infrastructure/docker/Dockerfile.backend -t brave-forms-backend:local .
```

### 3. Build Web Image

```bash
nerdctl -n k8s.io build -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
```

### 4. Verify Both Images Exist

```bash
nerdctl -n k8s.io images | grep brave-forms
```

**Expected Output:**

```
brave-forms-backend    local    <hash>    <time>    linux/amd64    630MB
brave-forms-web        local    <hash>    <time>    linux/amd64    <size>
```

## Acceptance Criteria

- [ ] Backend image exists (`brave-forms-backend:local`)
- [ ] Web image exists (`brave-forms-web:local`)
- [ ] Images built in k8s.io namespace
- [ ] Screenshot of `nerdctl images` output saved

## Evidence Required

Save to `docs/sprints/sprint1/evidence/ISSUE-002/deployment/`:

- `nerdctl-images-list.png` - Screenshot showing both images

## Common Issues

- **nerdctl not found:** Add Rancher Desktop bin to PATH
- **Wrong namespace:** Always use `-n k8s.io` flag
- **Build fails:** Check Dockerfiles exist in `infrastructure/docker/`

## Next Issue

After completion, proceed to ISSUE-003 (Configure Environment Secrets)

---

**Research:** Backend image verified to exist from codebase audit
