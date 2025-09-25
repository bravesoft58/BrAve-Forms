# BrAve Forms - Kubernetes Local Development Setup (Windows)
# Requires Docker Desktop with Kubernetes enabled

param(
    [string]$Action = "deploy",
    [switch]$BuildImages = $false,
    [switch]$CreateSecrets = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "BrAve Forms - Kubernetes Local Development" -ForegroundColor Cyan
Write-Host "EPA 0.25 inch Rain Threshold Monitoring System" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker Desktop is running
try {
    docker version | Out-Null
} catch {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and enable Kubernetes" -ForegroundColor Yellow
    exit 1
}

# Check kubectl is available
try {
    kubectl version --client | Out-Null
    Write-Host "✅ kubectl is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor Yellow
    exit 1
}

# Check Kubernetes is running
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Kubernetes is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Kubernetes is not running!" -ForegroundColor Red
    Write-Host "Enable Kubernetes in Docker Desktop settings" -ForegroundColor Yellow
    exit 1
}

$K8S_DIR = Join-Path $PSScriptRoot "..\infrastructure\k8s\local"

function Build-DockerImages {
    Write-Host ""
    Write-Host "Building Docker images..." -ForegroundColor Cyan
    
    # Build backend image
    Write-Host "Building backend image..." -ForegroundColor Yellow
    docker build -f infrastructure/docker/Dockerfile.backend -t brave-forms-backend:local .
    
    # Build web image (create Dockerfile.web if not exists)
    if (Test-Path "infrastructure/docker/Dockerfile.web") {
        Write-Host "Building web image..." -ForegroundColor Yellow
        docker build -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
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
        docker build -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
    }
    
    Write-Host "✅ Docker images built successfully" -ForegroundColor Green
}

function Create-Secrets {
    Write-Host ""
    Write-Host "Creating Kubernetes secrets..." -ForegroundColor Cyan
    
    # Check if secrets already exist
    $secretExists = kubectl get secret brave-forms-secrets -n brave-forms 2>$null
    if ($secretExists) {
        Write-Host "Secrets already exist. Delete them first with: kubectl delete secret brave-forms-secrets -n brave-forms" -ForegroundColor Yellow
        return
    }
    
    # Create secrets from .env.local if exists
    if (Test-Path ".env.local") {
        Write-Host "Creating secrets from .env.local..." -ForegroundColor Yellow
        kubectl create secret generic brave-forms-secrets --from-env-file=.env.local -n brave-forms
    } else {
        Write-Host "Creating default secrets (UPDATE THESE!)..." -ForegroundColor Yellow
        kubectl create secret generic brave-forms-secrets `
            --from-literal=database-user=brave `
            --from-literal=database-password=brave_secure_pass `
            --from-literal=redis-password=redis_secure_pass `
            --from-literal=clerk-secret-key=sk_test_CHANGE_ME `
            --from-literal=clerk-publishable-key=pk_test_CHANGE_ME `
            --from-literal=clerk-jwt-key=CHANGE_ME `
            --from-literal=openweather-api-key=CHANGE_ME `
            --from-literal=minio-access-key=minioadmin `
            --from-literal=minio-secret-key=minioadmin `
            -n brave-forms
    }
    
    Write-Host "✅ Secrets created" -ForegroundColor Green
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
    kubectl wait --for=condition=ready pod -l app=postgres -n brave-forms --timeout=120s
    kubectl wait --for=condition=ready pod -l app=redis -n brave-forms --timeout=60s
    
    Write-Host "Deploying Backend API..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\backend-deployment.yaml"
    
    Write-Host "Deploying Web Frontend..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\web-deployment.yaml"
    
    Write-Host "Setting up Ingress..." -ForegroundColor Yellow
    kubectl apply -f "$K8S_DIR\ingress.yaml"
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
}

function Show-Status {
    Write-Host ""
    Write-Host "Checking deployment status..." -ForegroundColor Cyan
    
    kubectl get all -n brave-forms
    
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "📱 Web Frontend: http://localhost:30002" -ForegroundColor Green
    Write-Host "🚀 GraphQL API: http://localhost:30001/graphql" -ForegroundColor Green
    Write-Host "📦 MinIO Console: http://localhost:30003" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "View logs: kubectl logs -f deployment/backend -n brave-forms" -ForegroundColor Yellow
    Write-Host "Port forward Postgres: kubectl port-forward svc/postgres 5432:5432 -n brave-forms" -ForegroundColor Yellow
    Write-Host "Get pods: kubectl get pods -n brave-forms" -ForegroundColor Yellow
    Write-Host "Delete all: kubectl delete namespace brave-forms" -ForegroundColor Yellow
}

function Remove-Deployment {
    Write-Host ""
    Write-Host "Removing BrAve Forms from Kubernetes..." -ForegroundColor Cyan
    
    kubectl delete namespace brave-forms --ignore-not-found=true
    
    Write-Host "✅ Deployment removed" -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "deploy" {
        if ($BuildImages) { Build-DockerImages }
        if ($CreateSecrets) { Create-Secrets }
        Deploy-Application
        Show-Status
    }
    "status" {
        Show-Status
    }
    "build" {
        Build-DockerImages
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