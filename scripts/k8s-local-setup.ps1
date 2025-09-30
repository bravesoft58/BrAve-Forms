# BrAve Forms - Kubernetes Local Development Setup (Windows)
# Requires Rancher Desktop with Kubernetes enabled

param(
    [string]$Action = "deploy",
    [switch]$BuildImages = $false,
    [switch]$CreateSecrets = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "BrAve Forms - Kubernetes Local Development" -ForegroundColor Cyan
Write-Host "EPA 0.25 inch Rain Threshold Monitoring System" -ForegroundColor Yellow
Write-Host "Rancher Desktop + k3s + containerd" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Rancher Desktop (nerdctl) is available
try {
    nerdctl version | Out-Null
    Write-Host "[OK] Rancher Desktop (nerdctl) is available" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Rancher Desktop (nerdctl) is not running!" -ForegroundColor Red
    Write-Host "Please install and start Rancher Desktop" -ForegroundColor Yellow
    Write-Host "Download from: https://rancherdesktop.io" -ForegroundColor Yellow
    exit 1
}

# Check kubectl is available
try {
    kubectl version --client | Out-Null
    Write-Host "[OK] kubectl is installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] kubectl is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor Yellow
    exit 1
}

# Check Kubernetes is running
try {
    kubectl cluster-info | Out-Null
    Write-Host "[OK] Kubernetes cluster is accessible" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Kubernetes is not running!" -ForegroundColor Red
    Write-Host "Enable Kubernetes in Rancher Desktop settings" -ForegroundColor Yellow
    exit 1
}

# Check for port conflicts before deployment
Write-Host ""
Write-Host "Checking for port conflicts..." -ForegroundColor Yellow
& "$PSScriptRoot\check-port-conflicts.ps1" -PortsToCheck @(30101, 30102, 30103)
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Port conflicts detected. Cannot proceed with deployment." -ForegroundColor Red
    exit 1
}

$K8S_DIR = Join-Path $PSScriptRoot "..\infrastructure\k8s\local"

function Build-ContainerImages {
    Write-Host ""
    Write-Host "Building container images with nerdctl..." -ForegroundColor Cyan

    # Build backend image
    Write-Host "Building backend image..." -ForegroundColor Yellow
    nerdctl build -n k8s.io -f infrastructure/docker/Dockerfile.backend -t brave-forms-backend:local .

    # Build web image (create Dockerfile.web if not exists)
    if (Test-Path "infrastructure/docker/Dockerfile.web") {
        Write-Host "Building web image..." -ForegroundColor Yellow
        nerdctl build -n k8s.io -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
    } else {
        Write-Host "Creating simple web Dockerfile..." -ForegroundColor Yellow
        @"
FROM node:20-alpine
WORKDIR /app
COPY apps/web/package.json ./
RUN npm install
COPY apps/web .
EXPOSE 3000
CMD ["npm", "run", "dev"]
"@ | Out-File -FilePath "infrastructure/docker/Dockerfile.web" -Encoding UTF8
        nerdctl build -n k8s.io -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
    }

    Write-Host "[OK] Container images built successfully" -ForegroundColor Green
}

function Create-Secrets {
    Write-Host ""
    Write-Host "Creating Kubernetes secrets..." -ForegroundColor Cyan

    # Check if secrets already exist
    $secretExists = kubectl get secret braveforms-secrets -n braveforms 2>$null
    if ($secretExists) {
        Write-Host "[WARNING] Secrets already exist. Delete them first with: kubectl delete secret braveforms-secrets -n braveforms" -ForegroundColor Yellow
        return
    }

    # Create secrets from .env.local if exists
    if (Test-Path ".env.local") {
        Write-Host "Creating secrets from .env.local..." -ForegroundColor Yellow
        kubectl create secret generic braveforms-secrets --from-env-file=.env.local -n braveforms
    } else {
        Write-Host "Creating default secrets (UPDATE THESE!)..." -ForegroundColor Yellow
        kubectl create secret generic braveforms-secrets `
            --from-literal=database-user=brave `
            --from-literal=database-password=brave_secure_pass `
            --from-literal=redis-password=redis_secure_pass `
            --from-literal=clerk-secret-key=sk_test_CHANGE_ME `
            --from-literal=clerk-publishable-key=pk_test_CHANGE_ME `
            --from-literal=clerk-jwt-key=CHANGE_ME `
            --from-literal=openweather-api-key=CHANGE_ME `
            --from-literal=minio-access-key=minioadmin `
            --from-literal=minio-secret-key=minioadmin `
            -n braveforms
    }

    Write-Host "[OK] Secrets created" -ForegroundColor Green
}

function Deploy-Application {
    Write-Host ""
    Write-Host "Deploying BrAve Forms to Kubernetes..." -ForegroundColor Cyan

    # Create namespace
    Write-Host "Creating namespace..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\namespace.yaml"

    # Create ConfigMaps
    Write-Host "Creating ConfigMaps..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\configmap.yaml"

    # Deploy services in order
    Write-Host "Deploying PostgreSQL..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\postgres-deployment.yaml"

    Write-Host "Deploying Redis..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\redis-deployment.yaml"

    Write-Host "Deploying MinIO..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\minio-deployment.yaml"

    # Wait for databases to be ready
    Write-Host "Waiting for databases to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=ready pod -l app=postgres -n braveforms --timeout=120s
    kubectl wait --for=condition=ready pod -l app=redis -n braveforms --timeout=60s

    Write-Host "Deploying Backend API..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\backend-deployment.yaml"

    Write-Host "Deploying Web Frontend..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\web-deployment.yaml"

    Write-Host "Setting up Ingress..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\ingress.yaml"

    Write-Host "[OK] Deployment complete!" -ForegroundColor Green
}

function Show-Status {
    Write-Host ""
    Write-Host "Checking deployment status..." -ForegroundColor Cyan

    kubectl get all -n braveforms

    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "[Web] Frontend: http://localhost:30102" -ForegroundColor Green
    Write-Host "[API] GraphQL: http://localhost:30101/graphql" -ForegroundColor Green
    Write-Host "[S3] MinIO Console: http://localhost:30103" -ForegroundColor Green

    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "View logs: kubectl logs -f deployment/backend -n braveforms" -ForegroundColor Yellow
    Write-Host "Port forward Postgres: kubectl port-forward svc/postgres 5432:5432 -n braveforms" -ForegroundColor Yellow
    Write-Host "Get pods: kubectl get pods -n braveforms" -ForegroundColor Yellow
    Write-Host "Delete all: kubectl delete namespace braveforms" -ForegroundColor Yellow
}

function Remove-Deployment {
    Write-Host ""
    Write-Host "Removing BrAve Forms from Kubernetes..." -ForegroundColor Cyan

    kubectl delete namespace braveforms --ignore-not-found=true

    Write-Host "[OK] Deployment removed" -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "deploy" {
        if ($BuildImages) { Build-ContainerImages }
        if ($CreateSecrets) { Create-Secrets }
        Deploy-Application
        Show-Status
    }
    "status" {
        Show-Status
    }
    "build" {
        Build-ContainerImages
    }
    "secrets" {
        Create-Secrets
    }
    "remove" {
        Remove-Deployment
    }
    default {
        Write-Host "Usage: .\k8s-local-setup.ps1 [-Action deploy|status|build|remove] [-BuildImages] [-CreateSecrets]" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "EPA Compliance: 0.25 inch threshold configured" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan