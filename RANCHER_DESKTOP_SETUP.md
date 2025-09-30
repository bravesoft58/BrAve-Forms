# BrAve Forms - Rancher Desktop Local Development Setup

## Overview

BrAve Forms uses **Rancher Desktop** for local Kubernetes development with complete container orchestration. This replaces Docker Desktop and provides a production-like environment using containerd + nerdctl + k3s.

**Why Rancher Desktop?**
- Open-source Docker Desktop alternative
- Uses containerd (production Kubernetes standard)
- Includes k3s (lightweight, fast Kubernetes)
- Multi-project namespace isolation
- No licensing restrictions

## Prerequisites

### Required Software

1. **Rancher Desktop** (latest version)
   - Download: https://rancherdesktop.io
   - Runtime: containerd (NOT dockerd)
   - Kubernetes: Enabled

2. **kubectl** (Kubernetes CLI)
   - Included with Rancher Desktop
   - Location: `C:\Program Files\Rancher Desktop\resources\resources\win32\bin\kubectl.exe`
   - Add to PATH for convenience

3. **pnpm** (Package manager)
   - Install: `npm install -g pnpm@8`

### System Requirements

- Windows 10/11 Pro, macOS, or Linux
- 8GB RAM minimum (16GB recommended)
- 20GB free disk space
- WSL2 (Windows only)

## Installation Steps

### 1. Install Rancher Desktop

```powershell
# Windows - Download and run installer from https://rancherdesktop.io
# Or use winget
winget install suse.RancherDesktop
```

### 2. Configure Rancher Desktop

Open Rancher Desktop settings and configure:

**Container Runtime:**
- Engine: **containerd** (NOT dockerd)
- Namespace: k8s.io

**Kubernetes:**
- Enable: **YES**
- Version: Latest stable (1.28+)
- Port: 6443
- Container Runtime: containerd

**WSL (Windows only):**
- Integration: Enabled for default WSL distribution

### 3. Verify Installation

```powershell
# Check Rancher Desktop is running
nerdctl version

# Check Kubernetes cluster
kubectl cluster-info

# Check available namespaces
kubectl get namespaces

# Check for port conflicts (CRITICAL)
.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)
```

Expected output:
```
[OK] Rancher Desktop (nerdctl) is available
[OK] Kubernetes cluster is accessible
[OK] All requested ports are available
```

## BrAve Forms Namespace

BrAve Forms uses a dedicated namespace: **braveforms**

### Namespace Isolation Benefits:
- Complete separation from other projects
- Independent resource quotas
- No port conflicts
- Easy cleanup (delete namespace removes everything)
- Clear kubectl targeting

### Port Assignments:
- **30101** - Backend GraphQL API
- **30102** - Web Frontend
- **30103** - MinIO S3 Console

These ports are verified safe and don't conflict with existing projects (e.g., velocitymesh).

## Quick Start

### First Time Setup

```powershell
# 1. Install dependencies
pnpm install

# 2. Check for port conflicts (MANDATORY)
.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)

# 3. Build container images
.\scripts\k8s-local-setup.ps1 -Action build -BuildImages

# 4. Create secrets (configure .env.local first)
.\scripts\k8s-local-setup.ps1 -Action secrets -CreateSecrets

# 5. Deploy to Kubernetes
.\scripts\k8s-local-setup.ps1 -Action deploy

# 6. Check status
.\scripts\k8s-local-setup.ps1 -Action status
```

### Environment Variables

Create `.env.local` in project root:

```bash
# Database
DATABASE_USER=brave
DATABASE_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# Clerk Authentication (from https://dashboard.clerk.dev)
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_JWT_KEY=your_jwt_verification_key

# Weather APIs
OPENWEATHER_API_KEY=your_openweather_key

# MinIO (Local S3)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_password
```

## Development Workflow

### Daily Development

```powershell
# Check cluster status
kubectl get all -n braveforms

# View logs
kubectl logs -f deployment/backend -n braveforms
kubectl logs -f deployment/web -n braveforms

# Port forward (if needed)
kubectl port-forward svc/postgres 5432:5432 -n braveforms
kubectl port-forward svc/redis 6379:6379 -n braveforms

# Access services
# Web: http://localhost:30102
# API: http://localhost:30101/graphql
# MinIO: http://localhost:30103
```

### Rebuild and Redeploy

```powershell
# Rebuild images
.\scripts\k8s-local-setup.ps1 -Action build -BuildImages

# Restart deployments
kubectl rollout restart deployment/backend -n braveforms
kubectl rollout restart deployment/web -n braveforms

# Watch rollout status
kubectl rollout status deployment/backend -n braveforms
```

### Database Migrations

```powershell
# Port forward to Postgres
kubectl port-forward svc/postgres 5432:5432 -n braveforms

# Run migrations (in another terminal)
pnpm --filter database migrate:dev

# Or exec into backend pod
kubectl exec -it deployment/backend -n braveforms -- pnpm prisma migrate dev
```

### Cleanup

```powershell
# Remove entire deployment
.\scripts\k8s-local-setup.ps1 -Action remove

# Or manually delete namespace
kubectl delete namespace braveforms

# Remove local images
nerdctl -n k8s.io rmi brave-forms-backend:local
nerdctl -n k8s.io rmi brave-forms-web:local
```

## Multi-Project Management

### Checking All Projects

```powershell
# List all namespaces
kubectl get namespaces

# Check all services across all namespaces
kubectl get svc --all-namespaces

# Check NodePort usage
kubectl get svc --all-namespaces -o json | jq '.items[] | select(.spec.type=="NodePort") | {namespace: .metadata.namespace, name: .metadata.name, ports: [.spec.ports[].nodePort]}'
```

### Port Conflict Prevention

**ALWAYS** run port conflict checker before deployment:

```powershell
.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)
```

If conflicts exist:
1. Check which project is using the ports
2. Choose different ports for BrAve Forms
3. Update all manifests and configmaps
4. Update this documentation

### Namespace Context Switching

```powershell
# Set default namespace
kubectl config set-context --current --namespace=braveforms

# Or use -n flag
kubectl get pods -n braveforms
kubectl logs deployment/backend -n braveforms
```

## Container Image Management

### Building Images with nerdctl

```powershell
# Backend image
nerdctl build -n k8s.io -f infrastructure/docker/Dockerfile.backend -t brave-forms-backend:local .

# Web image
nerdctl build -n k8s.io -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .

# List images
nerdctl -n k8s.io images | grep brave-forms

# Remove images
nerdctl -n k8s.io rmi brave-forms-backend:local
```

**Important:** Always use `-n k8s.io` flag to ensure images are built in the Kubernetes namespace.

### Image Pull Policy

All deployments use `imagePullPolicy: Never` to force local image usage. This prevents:
- Accidental pulls from Docker Hub
- Network delays
- Version mismatches

If you see `ImagePullBackOff` errors:
1. Verify image exists: `nerdctl -n k8s.io images`
2. Rebuild image with correct tag
3. Ensure image name matches deployment spec exactly

## Troubleshooting

### Common Issues

#### 1. kubectl Not Found

```powershell
# Add to PATH or use full path
$env:PATH += ";C:\Program Files\Rancher Desktop\resources\resources\win32\bin"
```

#### 2. Port Already in Use

```
Error: NodePort 30101 is already allocated
```

**Solution:**
```powershell
# Check what's using the port
.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101)

# Either:
# A) Stop conflicting service
# B) Choose different port
```

#### 3. ImagePullBackOff

```
Pod Status: ImagePullBackOff
```

**Solution:**
```powershell
# Verify image exists
nerdctl -n k8s.io images | grep brave-forms

# Rebuild if missing
.\scripts\k8s-local-setup.ps1 -Action build -BuildImages

# Check deployment spec matches image name exactly
kubectl describe pod <pod-name> -n braveforms
```

#### 4. Pods Stuck in Pending

```
Pod Status: Pending
```

**Solution:**
```powershell
# Check events
kubectl get events -n braveforms --sort-by='.lastTimestamp'

# Check PVC status
kubectl get pvc -n braveforms

# Verify storage class exists
kubectl get storageclass
```

#### 5. Database Connection Errors

```
Error: connect ECONNREFUSED postgres:5432
```

**Solution:**
```powershell
# Check Postgres pod is running
kubectl get pods -n braveforms -l app=postgres

# Check logs
kubectl logs deployment/postgres -n braveforms

# Verify service is accessible
kubectl get svc postgres -n braveforms

# Test connection from backend pod
kubectl exec -it deployment/backend -n braveforms -- ping postgres
```

#### 6. Secrets Not Found

```
Error: secret "braveforms-secrets" not found
```

**Solution:**
```powershell
# Create secrets
.\scripts\k8s-local-setup.ps1 -Action secrets -CreateSecrets

# Verify secrets exist
kubectl get secrets -n braveforms

# Check secret values (base64 encoded)
kubectl get secret braveforms-secrets -n braveforms -o yaml
```

### Debugging Commands

```powershell
# Get all resources in namespace
kubectl get all -n braveforms

# Describe resource for detailed info
kubectl describe pod <pod-name> -n braveforms
kubectl describe deployment backend -n braveforms

# View events
kubectl get events -n braveforms --sort-by='.lastTimestamp'

# Exec into pod
kubectl exec -it deployment/backend -n braveforms -- /bin/sh

# Check resource usage
kubectl top nodes
kubectl top pods -n braveforms

# View logs with timestamps
kubectl logs deployment/backend -n braveforms --timestamps=true

# Follow logs from multiple pods
kubectl logs -f -l app=backend -n braveforms
```

## Performance Optimization

### Resource Limits

All deployments have sensible resource limits defined:

- **Postgres:** 1GB RAM, 1 CPU
- **Redis:** 256MB RAM, 200m CPU
- **MinIO:** 512MB RAM, 500m CPU
- **Backend:** 1GB RAM, 1 CPU
- **Web:** 512MB RAM, 500m CPU

Adjust in deployment manifests if needed for your system.

### Storage Performance

k3s uses `local-path` storage class which stores data in:
- Windows: `\\wsl$\rancher-desktop-data\data\local-path-provisioner\`
- macOS/Linux: `/var/lib/rancher/k3s/storage/`

For better performance:
- Use SSD for Rancher Desktop data
- Allocate sufficient WSL memory (Windows)
- Monitor disk I/O with `kubectl top nodes`

### Network Performance

- Services use ClusterIP by default (fast internal networking)
- NodePorts (30101-30103) for external access only
- No Ingress controller overhead for local dev

## Best Practices

### 1. Always Check Ports First

```powershell
.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)
```

### 2. Use Namespace Isolation

All commands should target the `braveforms` namespace:
```powershell
kubectl get pods -n braveforms
kubectl logs deployment/backend -n braveforms
```

### 3. Clean Rebuilds

When in doubt, clean rebuild:
```powershell
# Remove deployment
.\scripts\k8s-local-setup.ps1 -Action remove

# Remove images
nerdctl -n k8s.io rmi brave-forms-backend:local
nerdctl -n k8s.io rmi brave-forms-web:local

# Rebuild and redeploy
.\scripts\k8s-local-setup.ps1 -Action deploy -BuildImages -CreateSecrets
```

### 4. Monitor Resource Usage

```powershell
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n braveforms

# Watch in real-time
watch kubectl top pods -n braveforms
```

### 5. Backup Data

Before major changes:
```powershell
# Backup Postgres
kubectl exec deployment/postgres -n braveforms -- pg_dump -U brave brave_forms > backup.sql

# Backup configs
kubectl get configmap braveforms-config -n braveforms -o yaml > configmap-backup.yaml
kubectl get secret braveforms-secrets -n braveforms -o yaml > secrets-backup.yaml
```

## EPA Compliance Testing

### Compliance Validation

```powershell
# Run compliance tests
pnpm test:compliance

# Test offline functionality
pnpm test:offline

# Test weather monitoring
kubectl logs deployment/backend -n braveforms | grep "rain-threshold"
```

### Critical Requirements

- 0.25" rain threshold (EXACT - not 0.24" or 0.26")
- 24-hour inspection deadline (working hours only)
- 30-day offline capability
- Complete data isolation (multi-tenancy)

## Additional Resources

- **Rancher Desktop Docs:** https://docs.rancherdesktop.io
- **kubectl Reference:** https://kubernetes.io/docs/reference/kubectl/
- **k3s Documentation:** https://docs.k3s.io
- **containerd:** https://containerd.io
- **nerdctl:** https://github.com/containerd/nerdctl

## Support

For issues specific to:
- **BrAve Forms:** Check `CLAUDE.md` and project documentation
- **Rancher Desktop:** https://github.com/rancher-sandbox/rancher-desktop/issues
- **Kubernetes:** https://kubernetes.io/docs/tasks/debug/

---

**Remember:** BrAve Forms prevents construction companies from facing $25,000-$50,000 daily EPA fines. All local development must match production compliance standards.
