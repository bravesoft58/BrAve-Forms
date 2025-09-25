#!/bin/bash

# BrAve Forms - Kubernetes Local Development Setup (Mac/Linux)
# Requires Docker Desktop with Kubernetes enabled

set -e

ACTION="${1:-deploy}"
BUILD_IMAGES=false
CREATE_SECRETS=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --build-images)
            BUILD_IMAGES=true
            ;;
        --create-secrets)
            CREATE_SECRETS=true
            ;;
    esac
done

echo "================================================"
echo "BrAve Forms - Kubernetes Local Development"
echo "EPA 0.25 inch Rain Threshold Monitoring System"
echo "================================================"
echo ""

# Check Docker is running
if ! docker version &> /dev/null; then
    echo "❌ Docker Desktop is not running!"
    echo "Please start Docker Desktop and enable Kubernetes"
    exit 1
fi

# Check kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed!"
    echo "Install from: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi
echo "✅ kubectl is installed"

# Check Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes is not running!"
    echo "Enable Kubernetes in Docker Desktop settings"
    exit 1
fi
echo "✅ Kubernetes is running"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/../infrastructure/k8s/local"

build_docker_images() {
    echo ""
    echo "Building Docker images..."
    
    # Build backend image
    echo "Building backend image..."
    docker build -f infrastructure/docker/Dockerfile.backend -t brave-forms-backend:local .
    
    # Build web image
    if [ -f "infrastructure/docker/Dockerfile.web" ]; then
        echo "Building web image..."
        docker build -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
    else
        echo "Creating simple web Dockerfile..."
        cat > infrastructure/docker/Dockerfile.web << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY apps/web/package.json ./
RUN npm install
COPY apps/web .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF
        docker build -f infrastructure/docker/Dockerfile.web -t brave-forms-web:local .
    fi
    
    echo "✅ Docker images built successfully"
}

create_secrets() {
    echo ""
    echo "Creating Kubernetes secrets..."
    
    # Check if secrets already exist
    if kubectl get secret brave-forms-secrets -n brave-forms &> /dev/null; then
        echo "Secrets already exist. Delete them first with: kubectl delete secret brave-forms-secrets -n brave-forms"
        return
    fi
    
    # Create secrets from .env.local if exists
    if [ -f ".env.local" ]; then
        echo "Creating secrets from .env.local..."
        kubectl create secret generic brave-forms-secrets --from-env-file=.env.local -n brave-forms
    else
        echo "Creating default secrets (UPDATE THESE!)..."
        kubectl create secret generic brave-forms-secrets \
            --from-literal=database-user=brave \
            --from-literal=database-password=brave_secure_pass \
            --from-literal=redis-password=redis_secure_pass \
            --from-literal=clerk-secret-key=sk_test_CHANGE_ME \
            --from-literal=clerk-publishable-key=pk_test_CHANGE_ME \
            --from-literal=clerk-jwt-key=CHANGE_ME \
            --from-literal=openweather-api-key=CHANGE_ME \
            --from-literal=minio-access-key=minioadmin \
            --from-literal=minio-secret-key=minioadmin \
            -n brave-forms
    fi
    
    echo "✅ Secrets created"
}

deploy_application() {
    echo ""
    echo "Deploying BrAve Forms to Kubernetes..."
    
    # Create namespace
    echo "Creating namespace..."
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    
    # Create ConfigMaps
    echo "Creating ConfigMaps..."
    kubectl apply -f "$K8S_DIR/configmap.yaml"
    
    # Deploy services in order
    echo "Deploying PostgreSQL..."
    kubectl apply -f "$K8S_DIR/postgres-deployment.yaml"
    
    echo "Deploying Redis..."
    kubectl apply -f "$K8S_DIR/redis-deployment.yaml"
    
    echo "Deploying MinIO..."
    kubectl apply -f "$K8S_DIR/minio-deployment.yaml"
    
    # Wait for databases to be ready
    echo "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n brave-forms --timeout=120s
    kubectl wait --for=condition=ready pod -l app=redis -n brave-forms --timeout=60s
    
    echo "Deploying Backend API..."
    kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
    
    echo "Deploying Web Frontend..."
    kubectl apply -f "$K8S_DIR/web-deployment.yaml"
    
    echo "Setting up Ingress..."
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    
    echo "✅ Deployment complete!"
}

show_status() {
    echo ""
    echo "Checking deployment status..."
    
    kubectl get all -n brave-forms
    
    echo ""
    echo "Access Points:"
    echo "📱 Web Frontend: http://localhost:30002"
    echo "🚀 GraphQL API: http://localhost:30001/graphql"
    echo "📦 MinIO Console: http://localhost:30003"
    
    echo ""
    echo "Useful Commands:"
    echo "View logs: kubectl logs -f deployment/backend -n brave-forms"
    echo "Port forward Postgres: kubectl port-forward svc/postgres 5432:5432 -n brave-forms"
    echo "Get pods: kubectl get pods -n brave-forms"
    echo "Delete all: kubectl delete namespace brave-forms"
}

remove_deployment() {
    echo ""
    echo "Removing BrAve Forms from Kubernetes..."
    
    kubectl delete namespace brave-forms --ignore-not-found=true
    
    echo "✅ Deployment removed"
}

# Main execution
case $ACTION in
    deploy)
        [ "$BUILD_IMAGES" = true ] && build_docker_images
        [ "$CREATE_SECRETS" = true ] && create_secrets
        deploy_application
        show_status
        ;;
    status)
        show_status
        ;;
    build)
        build_docker_images
        ;;
    secrets)
        create_secrets
        ;;
    remove)
        remove_deployment
        ;;
    *)
        echo "Usage: ./k8s-local-setup.sh [deploy|status|build|remove] [--build-images] [--create-secrets]"
        ;;
esac

echo ""
echo "================================================"
echo "EPA Compliance: 0.25 inch threshold configured"
echo "================================================"