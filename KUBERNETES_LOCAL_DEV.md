# Kubernetes Local Development with Docker Desktop

## Overview

This guide sets up a production-like Kubernetes environment on your local machine using Docker Desktop's built-in Kubernetes. This matches our production EKS deployment while being easy to run locally.

## Prerequisites

### Required Software
- **Docker Desktop** (with Kubernetes enabled)
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - Mac: https://docs.docker.com/desktop/install/mac-install/
- **kubectl** CLI tool
  - Windows: `winget install kubernetes-cli`
  - Mac: `brew install kubectl`
- **Minimum Resources**
  - 8GB RAM allocated to Docker Desktop
  - 20GB disk space
  - 4 CPU cores

### Enable Kubernetes in Docker Desktop
1. Open Docker Desktop settings
2. Navigate to Kubernetes tab
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"
5. Wait for Kubernetes to start (green indicator)

## Quick Start

### Windows (PowerShell)
```powershell
# Clone repository
git clone https://github.com/brave-forms/brave-forms.git
cd brave-forms

# Build images and deploy
.\scripts\k8s-local-setup.ps1 -BuildImages -CreateSecrets

# Check status
.\scripts\k8s-local-setup.ps1 -Action status
```

### Mac/Linux
```bash
# Clone repository
git clone https://github.com/brave-forms/brave-forms.git
cd brave-forms

# Make script executable
chmod +x scripts/k8s-local-setup.sh

# Build images and deploy
./scripts/k8s-local-setup.sh deploy --build-images --create-secrets

# Check status
./scripts/k8s-local-setup.sh status
```

## Architecture

### Services Deployed
1. **PostgreSQL with TimescaleDB** - Primary database with time-series support
2. **Redis** - Queue management for BullMQ (weather monitoring)
3. **Backend API** - NestJS GraphQL server (2 replicas)
4. **Web Frontend** - Next.js application (2 replicas)
5. **MinIO** - Local S3 replacement for photo storage

### Network Architecture
```
Internet
    ↓
NodePort Services
    ├── :30001 → Backend API (GraphQL)
    ├── :30002 → Web Frontend
    └── :30003 → MinIO Console

Internal Services (ClusterIP)
    ├── postgres:5432
    ├── redis:6379
    └── minio:9000
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:30002 | Main application UI |
| GraphQL | http://localhost:30001/graphql | API playground |
| MinIO | http://localhost:30003 | S3-compatible storage console |

## Configuration

### Environment Variables
Configuration is managed through Kubernetes ConfigMaps and Secrets.

#### ConfigMap (Non-sensitive)
- EPA threshold: **0.25 inches** (EXACT)
- Inspection deadline: 24 hours
- Working hours: 7 AM - 5 PM

#### Secrets (Sensitive)
Create `.env.local` with your actual values:
```env
# Database
DATABASE_USER=brave
DATABASE_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# Clerk (from https://dashboard.clerk.dev)
CLERK_SECRET_KEY=sk_test_your_key
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_JWT_KEY=your_jwt_key

# Weather API
OPENWEATHER_API_KEY=your_api_key

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_password
```

Then create Kubernetes secrets:
```bash
kubectl create secret generic brave-forms-secrets \
  --from-env-file=.env.local \
  -n brave-forms
```

## Common Tasks

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n brave-forms

# Web frontend logs
kubectl logs -f deployment/web -n brave-forms

# PostgreSQL logs
kubectl logs -f deployment/postgres -n brave-forms
```

### Access Database
```bash
# Port forward PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n brave-forms

# Connect with psql
psql -h localhost -U brave -d brave_forms
```

### Run Migrations
```bash
# Port forward database
kubectl port-forward svc/postgres 5432:5432 -n brave-forms

# In another terminal
DATABASE_URL="postgresql://brave:password@localhost:5432/brave_forms" \
  pnpm db:migrate
```

### Debug Pods
```bash
# List all pods
kubectl get pods -n brave-forms

# Describe a pod
kubectl describe pod <pod-name> -n brave-forms

# Execute commands in pod
kubectl exec -it <pod-name> -n brave-forms -- /bin/sh
```

### Scale Services
```bash
# Scale backend to 3 replicas
kubectl scale deployment/backend --replicas=3 -n brave-forms

# Scale web to 1 replica
kubectl scale deployment/web --replicas=1 -n brave-forms
```

## Monitoring

### Health Checks
All services include health probes:
- **Liveness**: Restarts unhealthy pods
- **Readiness**: Removes pods from load balancing when not ready

### Resource Usage
```bash
# View resource usage
kubectl top nodes
kubectl top pods -n brave-forms

# View detailed metrics
kubectl describe node docker-desktop
```

## Troubleshooting

### Pod Won't Start
```bash
# Check pod status
kubectl get pods -n brave-forms

# View pod events
kubectl describe pod <pod-name> -n brave-forms

# Check logs
kubectl logs <pod-name> -n brave-forms --previous
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
kubectl get pod -l app=postgres -n brave-forms

# Check service endpoints
kubectl get endpoints -n brave-forms

# Test connection
kubectl exec -it deployment/backend -n brave-forms -- nc -zv postgres 5432
```

### Storage Issues
```bash
# List persistent volumes
kubectl get pv
kubectl get pvc -n brave-forms

# Check storage class
kubectl get storageclass
```

### Networking Issues
```bash
# Check services
kubectl get svc -n brave-forms

# Test DNS resolution
kubectl exec -it deployment/backend -n brave-forms -- nslookup postgres
```

## Clean Up

### Remove Everything
```bash
# Delete namespace (removes all resources)
kubectl delete namespace brave-forms
```

### Remove Specific Resources
```bash
# Delete a deployment
kubectl delete deployment/backend -n brave-forms

# Delete a pod
kubectl delete pod <pod-name> -n brave-forms

# Delete persistent data
kubectl delete pvc --all -n brave-forms
```

## EPA Compliance Testing

### Verify 0.25" Threshold
```bash
# Check environment variables
kubectl exec deployment/backend -n brave-forms -- env | grep EPA

# Should output:
# EPA_RAIN_THRESHOLD_INCHES=0.25
```

### Test Weather Monitoring
```graphql
# Access GraphQL at http://localhost:30001/graphql
query TestWeatherThreshold {
  checkProjectWeather(
    projectId: "test-123"
    latitude: 40.7128
    longitude: -74.0060
  ) {
    exceeded
    amount
    requiresInspection
  }
}
```

## Production Differences

| Feature | Local K8s | Production EKS |
|---------|-----------|----------------|
| Storage | HostPath | EBS volumes |
| Load Balancer | NodePort | ALB/NLB |
| Database | Container | RDS PostgreSQL |
| Cache | Container | ElastiCache |
| Ingress | NodePort | ALB Ingress |
| TLS | None | ACM certificates |
| Monitoring | Basic | Datadog/CloudWatch |
| Scaling | Manual | Auto-scaling |

## Advanced Features

### Enable Ingress Controller
```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Add to hosts file
# 127.0.0.1 brave-forms.local
# 127.0.0.1 minio.brave-forms.local
```

### Use Skaffold for Development
```bash
# Install Skaffold
# https://skaffold.dev/docs/install/

# Run with hot-reload
skaffold dev
```

### Helm Chart (Future)
```bash
# Install with Helm
helm install brave-forms ./charts/brave-forms \
  --namespace brave-forms \
  --create-namespace \
  --values ./charts/brave-forms/values.local.yaml
```

## Best Practices

1. **Always use namespaces** - Isolates resources
2. **Set resource limits** - Prevents resource exhaustion
3. **Use health checks** - Ensures reliability
4. **Label everything** - Makes management easier
5. **Version images** - Use specific tags, not `latest`
6. **Secure secrets** - Never commit actual values
7. **Monitor resources** - Watch for memory/CPU issues

## Support

### Common Issues
- **Kubernetes won't start**: Restart Docker Desktop
- **Pods pending**: Check resource availability
- **Image pull errors**: Build images first
- **Port conflicts**: Check for other services on ports 30001-30003

### Getting Help
- Check pod logs first
- Review events with `kubectl describe`
- Verify all prerequisites are met
- Ensure Docker Desktop has enough resources

---

**Remember**: EPA threshold is **EXACTLY 0.25 inches** - this is configured in the ConfigMap and cannot be approximated!