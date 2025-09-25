#!/bin/bash
# BrAve Forms Port Forwarding Setup Script
# Sets up port forwarding for local development against Kubernetes cluster

set -e

echo "🔗 BrAve Forms Port Forwarding Setup"
echo "===================================="

# Configuration
NAMESPACE="brave-forms"
POSTGRES_LOCAL_PORT="5433"
REDIS_LOCAL_PORT="6380"
MINIO_LOCAL_PORT="30900"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to start port forwarding in background
start_port_forward() {
    local service=$1
    local local_port=$2
    local remote_port=$3
    local description=$4
    
    echo -e "${BLUE}🔗 Setting up port forwarding for $description...${NC}"
    
    if ! check_port $local_port; then
        echo "   Skipping $service (port already in use)"
        return 1
    fi
    
    # Start port forwarding in background
    kubectl port-forward -n $NAMESPACE svc/$service $local_port:$remote_port > /dev/null 2>&1 &
    local pid=$!
    
    # Wait a moment and check if it started successfully
    sleep 2
    if ps -p $pid > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description port forwarding started (PID: $pid)${NC}"
        echo "   Local: localhost:$local_port -> Remote: $service:$remote_port"
        echo $pid > "/tmp/port-forward-$service.pid"
        return 0
    else
        echo -e "${RED}❌ Failed to start $description port forwarding${NC}"
        return 1
    fi
}

# Function to check if kubectl is available and cluster is accessible
check_kubernetes() {
    echo -e "${BLUE}🔍 Checking Kubernetes connectivity...${NC}"
    
    if ! command -v kubectl >/dev/null 2>&1; then
        echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
        exit 1
    fi
    
    if ! kubectl cluster-info >/dev/null 2>&1; then
        echo -e "${RED}❌ Cannot connect to Kubernetes cluster.${NC}"
        echo "   Make sure your kubeconfig is set up correctly."
        exit 1
    fi
    
    if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
        echo -e "${RED}❌ Namespace '$NAMESPACE' not found.${NC}"
        echo "   Make sure the BrAve Forms infrastructure is deployed."
        exit 1
    fi
    
    echo -e "${GREEN}✅ Kubernetes cluster is accessible${NC}"
}

# Function to check if required services exist
check_services() {
    echo -e "${BLUE}🔍 Checking required services...${NC}"
    
    local services=("postgres" "redis")
    local missing_services=()
    
    for service in "${services[@]}"; do
        if kubectl get svc -n $NAMESPACE $service >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Service '$service' found${NC}"
        else
            echo -e "${RED}❌ Service '$service' not found${NC}"
            missing_services+=($service)
        fi
    done
    
    if [ ${#missing_services[@]} -gt 0 ]; then
        echo -e "${RED}Missing services: ${missing_services[*]}${NC}"
        echo "Deploy the infrastructure first with: kubectl apply -f infrastructure/k8s/"
        exit 1
    fi
}

# Function to stop existing port forwarding
stop_existing_port_forwards() {
    echo -e "${BLUE}🛑 Stopping existing port forwards...${NC}"
    
    local services=("postgres" "redis" "minio")
    
    for service in "${services[@]}"; do
        if [ -f "/tmp/port-forward-$service.pid" ]; then
            local pid=$(cat "/tmp/port-forward-$service.pid")
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid
                echo -e "${YELLOW}⚠️  Stopped existing $service port forward (PID: $pid)${NC}"
            fi
            rm -f "/tmp/port-forward-$service.pid"
        fi
    done
    
    # Kill any kubectl port-forward processes for our namespace
    pkill -f "kubectl port-forward.*$NAMESPACE" || true
    
    sleep 1
}

# Function to create connection test script
create_test_script() {
    echo -e "${BLUE}📝 Creating connection test script...${NC}"
    
    cat > /tmp/test-connections.sh << 'EOF'
#!/bin/bash
echo "Testing port forwarded connections..."

# Test PostgreSQL
if nc -z localhost 5433; then
    echo "✅ PostgreSQL (localhost:5433) - Connected"
else
    echo "❌ PostgreSQL (localhost:5433) - Failed"
fi

# Test Redis
if nc -z localhost 6380; then
    echo "✅ Redis (localhost:6380) - Connected"
else
    echo "❌ Redis (localhost:6380) - Failed"
fi

# Test with actual clients if available
if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="CHANGE_ME_SECURE_PASSWORD" psql -h localhost -p 5433 -U brave -d brave_forms -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL client connection - Works"
    else
        echo "❌ PostgreSQL client connection - Failed"
    fi
fi

if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -h localhost -p 6380 ping >/dev/null 2>&1; then
        echo "✅ Redis client connection - Works"
    else
        echo "❌ Redis client connection - Failed"
    fi
fi
EOF

    chmod +x /tmp/test-connections.sh
    echo -e "${GREEN}✅ Connection test script created at /tmp/test-connections.sh${NC}"
}

# Function to show status and next steps
show_status() {
    echo ""
    echo -e "${GREEN}🎉 Port Forwarding Setup Complete!${NC}"
    echo "=================================="
    echo ""
    echo "Active Port Forwards:"
    echo "• PostgreSQL: localhost:5433 → postgres:5432"
    echo "• Redis: localhost:6380 → redis:6379"
    echo ""
    echo "Your .env.local should contain:"
    echo "DATABASE_URL=\"postgresql://brave:CHANGE_ME_SECURE_PASSWORD@localhost:5433/brave_forms?schema=public\""
    echo "REDIS_URL=\"redis://localhost:6380\""
    echo ""
    echo "Next Steps:"
    echo "1. Test connections: /tmp/test-connections.sh"
    echo "2. Run environment test: ./scripts/test-environment.sh"
    echo "3. Start development server: pnpm dev"
    echo ""
    echo "To stop port forwarding:"
    echo "• Kill this script with Ctrl+C"
    echo "• Or run: pkill -f 'kubectl port-forward.*brave-forms'"
    echo ""
    echo -e "${BLUE}💡 Tip: Keep this terminal open while developing${NC}"
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Cleaning up port forwards...${NC}"
    stop_existing_port_forwards
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "Starting port forwarding setup for local development..."
    echo ""
    
    # Pre-flight checks
    check_kubernetes
    check_services
    
    # Clean up any existing port forwards
    stop_existing_port_forwards
    
    # Set up new port forwards
    local success_count=0
    
    if start_port_forward "postgres" $POSTGRES_LOCAL_PORT "5432" "PostgreSQL Database"; then
        ((success_count++))
    fi
    
    if start_port_forward "redis" $REDIS_LOCAL_PORT "6379" "Redis Cache"; then
        ((success_count++))
    fi
    
    if [ $success_count -eq 0 ]; then
        echo -e "${RED}❌ No port forwards could be established${NC}"
        exit 1
    fi
    
    # Create connection test script
    create_test_script
    
    # Show status and next steps
    show_status
    
    # Keep the script running to maintain port forwards
    echo -e "${BLUE}🔄 Port forwards are active. Press Ctrl+C to stop.${NC}"
    
    # Wait for interrupt signal
    while true; do
        sleep 5
        
        # Check if port forwards are still alive
        if [ -f "/tmp/port-forward-postgres.pid" ]; then
            local postgres_pid=$(cat "/tmp/port-forward-postgres.pid")
            if ! ps -p $postgres_pid > /dev/null 2>&1; then
                echo -e "${RED}❌ PostgreSQL port forward died, restarting...${NC}"
                start_port_forward "postgres" $POSTGRES_LOCAL_PORT "5432" "PostgreSQL Database"
            fi
        fi
        
        if [ -f "/tmp/port-forward-redis.pid" ]; then
            local redis_pid=$(cat "/tmp/port-forward-redis.pid")
            if ! ps -p $redis_pid > /dev/null 2>&1; then
                echo -e "${RED}❌ Redis port forward died, restarting...${NC}"
                start_port_forward "redis" $REDIS_LOCAL_PORT "6379" "Redis Cache"
            fi
        fi
    done
}

# Check for command line arguments
case "${1:-start}" in
    "start")
        main
        ;;
    "stop")
        stop_existing_port_forwards
        echo -e "${GREEN}✅ All port forwards stopped${NC}"
        ;;
    "status")
        echo "Port Forward Status:"
        echo "==================="
        
        local services=("postgres:5433" "redis:6380")
        for service_port in "${services[@]}"; do
            local service=$(echo $service_port | cut -d: -f1)
            local port=$(echo $service_port | cut -d: -f2)
            
            if [ -f "/tmp/port-forward-$service.pid" ]; then
                local pid=$(cat "/tmp/port-forward-$service.pid")
                if ps -p $pid > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ $service (localhost:$port) - Running (PID: $pid)${NC}"
                else
                    echo -e "${RED}❌ $service (localhost:$port) - Process died${NC}"
                fi
            else
                echo -e "${YELLOW}⚠️  $service (localhost:$port) - Not started${NC}"
            fi
        done
        ;;
    "test")
        if [ -f "/tmp/test-connections.sh" ]; then
            /tmp/test-connections.sh
        else
            echo "Connection test script not found. Run './scripts/setup-port-forwarding.sh start' first."
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status|test}"
        echo ""
        echo "Commands:"
        echo "  start   - Start port forwarding (default)"
        echo "  stop    - Stop all port forwarding"
        echo "  status  - Show current status"
        echo "  test    - Test connections"
        exit 1
        ;;
esac