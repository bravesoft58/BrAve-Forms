#!/bin/bash
# BrAve Forms Environment Testing Script
# Tests all critical system connections and configurations

set -e

echo "🚀 BrAve Forms Environment Testing Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

test_status() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ $test_name${NC}: $message"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $test_name${NC}: $message"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "1. Environment Variable Validation"
echo "================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    test_status "Environment File" "PASS" ".env.local found"
    
    # Check critical Clerk keys
    if grep -q "CLERK_SECRET_KEY.*sk_test_" .env.local && ! grep -q "YOUR_KEY_HERE" .env.local; then
        test_status "Clerk Secret Key" "PASS" "Configured correctly"
    else
        test_status "Clerk Secret Key" "FAIL" "Missing or using placeholder value"
    fi
    
    if grep -q "CLERK_PUBLISHABLE_KEY.*pk_test_" .env.local && ! grep -q "YOUR_KEY_HERE" .env.local; then
        test_status "Clerk Publishable Key" "PASS" "Configured correctly"
    else
        test_status "Clerk Publishable Key" "FAIL" "Missing or using placeholder value"
    fi
    
    # Check database URL
    if grep -q "DATABASE_URL.*postgresql.*localhost:5433" .env.local; then
        test_status "Database URL" "PASS" "Port-forwarded configuration detected"
    else
        test_status "Database URL" "FAIL" "Not configured for port-forwarded database"
    fi
    
    # Check Redis URL
    if grep -q "REDIS_URL.*localhost:6380" .env.local; then
        test_status "Redis URL" "PASS" "Port-forwarded configuration detected"
    else
        test_status "Redis URL" "FAIL" "Not configured for port-forwarded Redis"
    fi
    
    # Check EPA compliance settings
    if grep -q "EPA_RAIN_THRESHOLD_INCHES.*0\.25" .env.local; then
        test_status "EPA Rain Threshold" "PASS" "Exact 0.25 inches configured"
    else
        test_status "EPA Rain Threshold" "FAIL" "Not set to exact 0.25 inches requirement"
    fi
    
else
    test_status "Environment File" "FAIL" ".env.local not found"
fi

echo ""
echo "2. Kubernetes Cluster Connectivity"
echo "================================="

# Test Kubernetes connection
if kubectl cluster-info >/dev/null 2>&1; then
    test_status "Kubernetes Connection" "PASS" "Cluster accessible"
    
    # Check BrAve Forms namespace
    if kubectl get namespace brave-forms >/dev/null 2>&1; then
        test_status "Brave Forms Namespace" "PASS" "Namespace exists"
        
        # Check PostgreSQL pod
        if kubectl get pod -n brave-forms -l app=postgres --no-headers 2>/dev/null | grep -q Running; then
            test_status "PostgreSQL Pod" "PASS" "Running"
        else
            test_status "PostgreSQL Pod" "FAIL" "Not running or not found"
        fi
        
        # Check Redis pod
        if kubectl get pod -n brave-forms -l app=redis --no-headers 2>/dev/null | grep -q Running; then
            test_status "Redis Pod" "PASS" "Running"
        else
            test_status "Redis Pod" "FAIL" "Not running or not found"
        fi
        
    else
        test_status "Brave Forms Namespace" "FAIL" "Namespace not found"
    fi
else
    test_status "Kubernetes Connection" "FAIL" "Cannot connect to cluster"
fi

echo ""
echo "3. Port Forwarding Status"
echo "========================"

# Test PostgreSQL port forwarding
if nc -z localhost 5433 2>/dev/null; then
    test_status "PostgreSQL Port Forward" "PASS" "Port 5433 accessible"
else
    test_status "PostgreSQL Port Forward" "FAIL" "Port 5433 not accessible"
    echo "  Run: kubectl port-forward -n brave-forms svc/postgres 5433:5432"
fi

# Test Redis port forwarding
if nc -z localhost 6380 2>/dev/null; then
    test_status "Redis Port Forward" "PASS" "Port 6380 accessible"
else
    test_status "Redis Port Forward" "FAIL" "Port 6380 not accessible"
    echo "  Run: kubectl port-forward -n brave-forms svc/redis 6380:6379"
fi

echo ""
echo "4. Database Connectivity"
echo "======================="

# Test database connection using environment variables
if [ -f ".env.local" ]; then
    source .env.local
    
    # Test PostgreSQL connection
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="${DATABASE_URL#*:*@*:*@*:*/}" psql "${DATABASE_URL}" -c "SELECT 1;" >/dev/null 2>&1; then
            test_status "PostgreSQL Connection" "PASS" "Database accessible"
        else
            test_status "PostgreSQL Connection" "FAIL" "Cannot connect to database"
        fi
    else
        test_status "PostgreSQL Client" "FAIL" "psql not installed"
        echo "  Install with: apt-get install postgresql-client (Linux) or brew install postgresql (Mac)"
    fi
    
    # Test Redis connection
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -h localhost -p 6380 ping >/dev/null 2>&1; then
            test_status "Redis Connection" "PASS" "Redis accessible"
        else
            test_status "Redis Connection" "FAIL" "Cannot connect to Redis"
        fi
    else
        test_status "Redis Client" "FAIL" "redis-cli not installed"
        echo "  Install with: apt-get install redis-tools (Linux) or brew install redis (Mac)"
    fi
fi

echo ""
echo "5. API Keys Validation"
echo "===================="

# Check if weather API key is configured
if [ -f ".env.local" ] && grep -q "OPENWEATHER_API_KEY.*[a-zA-Z0-9]" .env.local && ! grep -q "YOUR_API_KEY_HERE" .env.local; then
    test_status "Weather API Key" "PASS" "OpenWeatherMap key configured"
else
    test_status "Weather API Key" "FAIL" "OpenWeatherMap key missing or placeholder"
    echo "  Get free API key from: https://openweathermap.org/api"
fi

echo ""
echo "6. Node.js and Dependencies"
echo "========================="

# Check Node.js version
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if [ "$(echo "$NODE_VERSION 18.0.0" | tr " " "\n" | sort -V | head -n1)" = "18.0.0" ]; then
        test_status "Node.js Version" "PASS" "v$NODE_VERSION (≥18.0.0)"
    else
        test_status "Node.js Version" "FAIL" "v$NODE_VERSION (<18.0.0 required)"
    fi
else
    test_status "Node.js" "FAIL" "Not installed"
fi

# Check pnpm
if command -v pnpm >/dev/null 2>&1; then
    PNPM_VERSION=$(pnpm --version)
    test_status "pnpm Package Manager" "PASS" "v$PNPM_VERSION installed"
else
    test_status "pnpm Package Manager" "FAIL" "Not installed"
    echo "  Install with: npm install -g pnpm"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    test_status "Dependencies" "PASS" "node_modules directory exists"
else
    test_status "Dependencies" "FAIL" "Dependencies not installed"
    echo "  Run: pnpm install"
fi

echo ""
echo "7. Development Tools"
echo "=================="

# Check TypeScript
if command -v tsc >/dev/null 2>&1 || [ -f "node_modules/.bin/tsc" ]; then
    test_status "TypeScript" "PASS" "Available"
else
    test_status "TypeScript" "FAIL" "Not available"
fi

# Check Jest
if [ -f "node_modules/.bin/jest" ]; then
    test_status "Jest Testing" "PASS" "Available"
else
    test_status "Jest Testing" "FAIL" "Not available"
fi

# Check if GraphQL schema exists
if [ -f "apps/backend/src/schema.gql" ] || find . -name "*.gql" -o -name "*.graphql" | head -1 | grep -q .; then
    test_status "GraphQL Schema" "PASS" "Schema files found"
else
    test_status "GraphQL Schema" "FAIL" "No schema files found"
fi

echo ""
echo "Summary"
echo "======="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Environment is ready for development.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please address the issues above before proceeding.${NC}"
    exit 1
fi