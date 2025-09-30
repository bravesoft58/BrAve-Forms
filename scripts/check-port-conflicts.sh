#!/bin/bash

# BrAve Forms - Port Conflict Detection for Rancher Desktop
# Scans all Kubernetes namespaces for NodePort conflicts before deployment

set -e

# Default ports to check
PORTS_TO_CHECK=(30101 30102 30103)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}BrAve Forms - Port Conflict Detection${NC}"
echo -e "${CYAN}Scanning Rancher Desktop Kubernetes Namespaces${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found!${NC}"
    echo -e "${YELLOW}Please ensure Rancher Desktop Kubernetes is running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ kubectl is available${NC}"

# Check if Kubernetes cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster!${NC}"
    echo -e "${YELLOW}Please start Rancher Desktop and enable Kubernetes${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Kubernetes cluster is accessible${NC}"

echo ""
echo -e "${YELLOW}Scanning all namespaces for NodePort services...${NC}"
echo ""

# Get all NodePort services
nodeports=$(kubectl get svc --all-namespaces -o json | jq -r '
  .items[] |
  select(.spec.type == "NodePort") |
  .spec.ports[] |
  select(.nodePort != null) |
  "\(.metadata.namespace // "default")|\(.metadata.name // "unknown")|\(.port)|\(.targetPort)|\(.nodePort)|\(.protocol)"
' 2>/dev/null)

if [ -z "$nodeports" ]; then
    echo -e "${GREEN}✅ No NodePort services found in cluster${NC}"
else
    echo -e "${CYAN}📊 Found NodePort service(s):${NC}"
    echo ""
    echo -e "${WHITE}NAMESPACE\tSERVICE\t\tNODEPORT\tPORT\tPROTOCOL${NC}"
    echo "$nodeports" | while IFS='|' read -r namespace service port targetPort nodePort protocol; do
        printf "%-15s\t%-15s\t%-8s\t%-6s\t%s\n" "$namespace" "$service" "$nodePort" "$port" "$protocol"
    done
fi

echo ""
echo -e "${YELLOW}Checking BrAve Forms proposed ports: ${PORTS_TO_CHECK[*]}${NC}"
echo ""

# Check for conflicts
conflicts=()
for proposed_port in "${PORTS_TO_CHECK[@]}"; do
    conflict=$(echo "$nodeports" | grep "|$proposed_port|" || true)
    if [ -n "$conflict" ]; then
        IFS='|' read -r namespace service port targetPort nodePort protocol <<< "$conflict"
        conflicts+=("$proposed_port:$namespace:$service")
    fi
done

# Report results
if [ ${#conflicts[@]} -gt 0 ]; then
    echo -e "${RED}❌ PORT CONFLICTS DETECTED!${NC}"
    echo ""
    echo -e "${WHITE}PROPOSED_PORT\tCONFLICT_NAMESPACE\tCONFLICT_SERVICE${NC}"
    for conflict in "${conflicts[@]}"; do
        IFS=':' read -r port namespace service <<< "$conflict"
        printf "%-15s\t%-20s\t%s\n" "$port" "$namespace" "$service"
    done
    echo ""
    echo -e "${YELLOW}⚠️  Cannot proceed with deployment using these ports${NC}"
    echo -e "${YELLOW}Recommended actions:${NC}"
    echo -e "${WHITE}  1. Choose different ports from the available range (30000-32767)${NC}"
    echo -e "${WHITE}  2. Update infrastructure/k8s/local/*-deployment.yaml files${NC}"
    echo -e "${WHITE}  3. Re-run this script to verify new ports${NC}"
    echo ""

    # Suggest available ports
    echo -e "${CYAN}Suggesting available ports in 301xx range...${NC}"
    used_ports=$(echo "$nodeports" | cut -d'|' -f5)
    available_ports=()
    for i in $(seq 30100 30120); do
        if ! echo "$used_ports" | grep -q "^$i$"; then
            available_ports+=($i)
            if [ ${#available_ports[@]} -ge 5 ]; then
                break
            fi
        fi
    done
    echo -e "${GREEN}Available ports: ${available_ports[*]}${NC}"
    echo ""

    exit 1
else
    echo -e "${GREEN}✅ No port conflicts detected!${NC}"
    echo ""
    echo -e "${GREEN}Safe to use the following ports for braveforms namespace:${NC}"
    for port in "${PORTS_TO_CHECK[@]}"; do
        echo -e "${WHITE}  - $port${NC}"
    done
    echo ""
    echo -e "${GREEN}✅ Ready to deploy BrAve Forms to Rancher Desktop${NC}"
    exit 0
fi
