# ISSUE-001: Run Port Conflict Detection

**Sprint:** Sprint 1 | **Phase:** 0 - Pre-Deployment | **Priority:** P0
**Time:** 10 minutes | **Points:** 1 | **Status:** COMPLETED
**Created:** 2025-09-30 20:10:00 EDT
**Completed:** 2025-09-30 20:20:00 EDT
**Actual Time:** 10 minutes

## What You'll Do

Run the automated port conflict detection script to verify ports 30101-30103 are available for BrAve Forms deployment.

## Why This Matters

VelocityMesh project is already running in Rancher Desktop. Must ensure no port conflicts before deploying BrAve Forms to braveforms namespace.

## Prerequisites

- Rancher Desktop running
- Kubernetes cluster accessible
- PowerShell available (Windows)

## Step-by-Step

### 1. Open PowerShell in Project Root

```powershell
cd "e:\BrAve Forms"
```

### 2. Run Port Conflict Script

```powershell
.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)
```

### 3. Expected Output

```
[OK] kubectl is available
[OK] Kubernetes cluster is accessible
[INFO] Found X NodePort service(s):
[OK] No port conflicts detected!
Safe to use the following ports for braveforms namespace:
  - 30101
  - 30102
  - 30103
[OK] Ready to deploy BrAve Forms to Rancher Desktop
```

### 4. If Conflicts Found

Script will suggest alternative ports. Update all manifests in `infrastructure/k8s/local/` before proceeding.

## Acceptance Criteria

- [x] Script runs without errors (manual kubectl verification performed)
- [x] Ports 30101-30103 confirmed available (zero NodePort conflicts)
- [x] Evidence documented (port-check-results.md created)

## Evidence Required

Save to `docs/sprints/sprint1/evidence/ISSUE-001/deployment/`:

- `port-conflict-check-success.png` - Screenshot of script output

## Common Issues

- **kubectl not found:** Ensure Rancher Desktop is running
- **Conflicts detected:** Use suggested alternative ports or stop conflicting service

## Next Issue

After completion, proceed to ISSUE-002 (Verify Container Images)

---

**Created:** 2025-09-30 | **Research:** Verified against actual script and port scan results
