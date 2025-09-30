# Kubernetes Local Development with Rancher Desktop

## DEPRECATED: Docker Desktop Support Removed

This project has migrated from Docker Desktop to **Rancher Desktop** for local Kubernetes development.

## Migration Complete

All Docker Desktop references have been removed in favor of:
- **Rancher Desktop** - Open-source Docker Desktop alternative
- **containerd** - Production Kubernetes container runtime
- **nerdctl** - Docker-compatible CLI for containerd
- **k3s** - Lightweight Kubernetes distribution

## Current Documentation

Please refer to the comprehensive setup guide:

### [RANCHER_DESKTOP_SETUP.md](./RANCHER_DESKTOP_SETUP.md)

This guide covers:
- Rancher Desktop installation and configuration
- Multi-project namespace isolation (braveforms)
- Port conflict detection and management
- Container image building with nerdctl
- Kubernetes deployment workflow
- Troubleshooting and best practices
- EPA compliance testing

## Quick Migration

If you previously used Docker Desktop:

1. **Uninstall Docker Desktop** (optional)
   ```powershell
   # Windows
   winget uninstall Docker.DockerDesktop
   ```

2. **Install Rancher Desktop**
   ```powershell
   # Windows
   winget install suse.RancherDesktop
   ```

3. **Configure Rancher Desktop**
   - Container Runtime: **containerd** (NOT dockerd)
   - Kubernetes: **Enabled**

4. **Update Project**
   ```powershell
   # Check for port conflicts FIRST
   .\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)

   # Build and deploy
   .\scripts\k8s-local-setup.ps1 -Action deploy -BuildImages -CreateSecrets
   ```

## Key Changes

### Namespace
- Old: `brave-forms`
- New: `braveforms` (single word for easier CLI usage)

### Ports
- Backend API: `30001` → `30101`
- Web Frontend: `30002` → `30102`
- MinIO Console: `30003` → `30103`

### Storage Class
- Old: `hostpath` (Docker Desktop)
- New: `local-path` (k3s default)

### Image Building
- Old: `docker build`
- New: `nerdctl build -n k8s.io`

### Image Pull Policy
- Old: `IfNotPresent`
- New: `Never` (forces local image usage)

## Why Rancher Desktop?

### Benefits:
- **Open Source:** No licensing restrictions
- **Production-Like:** Uses containerd (de facto Kubernetes standard)
- **Fast:** k3s is lightweight and optimized
- **Multi-Project:** Better namespace isolation
- **Active Development:** Regular updates and community support

### Docker Desktop Limitations:
- Licensing requirements for commercial use
- Heavier resource usage
- dockerd not used in production Kubernetes
- Less flexible configuration

## Access Points

New service URLs:

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:30102 | Main application UI |
| GraphQL API | http://localhost:30101/graphql | API playground |
| MinIO Console | http://localhost:30103 | S3-compatible storage |

## Common Commands

Replace Docker Desktop commands:

```powershell
# Old (Docker Desktop)
docker ps
docker build -t image:tag .
docker images
kubectl get pods -n brave-forms

# New (Rancher Desktop)
nerdctl ps
nerdctl build -n k8s.io -t image:tag .
nerdctl -n k8s.io images
kubectl get pods -n braveforms
```

## Troubleshooting

If you encounter issues:

1. **Verify Rancher Desktop is running**
   ```powershell
   nerdctl version
   kubectl cluster-info
   ```

2. **Check port conflicts**
   ```powershell
   .\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)
   ```

3. **Rebuild images**
   ```powershell
   .\scripts\k8s-local-setup.ps1 -Action build -BuildImages
   ```

4. **Clean reinstall**
   ```powershell
   # Remove old deployment
   kubectl delete namespace braveforms

   # Remove images
   nerdctl -n k8s.io rmi brave-forms-backend:local
   nerdctl -n k8s.io rmi brave-forms-web:local

   # Deploy fresh
   .\scripts\k8s-local-setup.ps1 -Action deploy -BuildImages -CreateSecrets
   ```

## Support

For detailed setup instructions, troubleshooting, and best practices:

### [RANCHER_DESKTOP_SETUP.md](./RANCHER_DESKTOP_SETUP.md)

---

**Migration Date:** 2025-09-30
**Rancher Desktop Version:** Latest (containerd + k3s)
**Namespace:** braveforms
**EPA Compliance:** 0.25" threshold (EXACT)
