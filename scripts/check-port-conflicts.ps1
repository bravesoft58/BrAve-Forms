# BrAve Forms - Port Conflict Detection for Rancher Desktop
# Scans all Kubernetes namespaces for NodePort conflicts before deployment

param(
    [int[]]$PortsToCheck = @(30101, 30102, 30103),
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "BrAve Forms - Port Conflict Detection" -ForegroundColor Cyan
Write-Host "Scanning Rancher Desktop Kubernetes Namespaces" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if kubectl is available
try {
    kubectl version --client --short 2>$null | Out-Null
    Write-Host "[OK] kubectl is available" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] kubectl not found!" -ForegroundColor Red
    Write-Host "Please ensure Rancher Desktop Kubernetes is running" -ForegroundColor Yellow
    exit 1
}

# Check if Kubernetes cluster is accessible
try {
    kubectl cluster-info 2>$null | Out-Null
    Write-Host "[OK] Kubernetes cluster is accessible" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Cannot connect to Kubernetes cluster!" -ForegroundColor Red
    Write-Host "Please start Rancher Desktop and enable Kubernetes" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Scanning all namespaces for NodePort services..." -ForegroundColor Yellow
Write-Host ""

# Get all services across all namespaces
try {
    $allServicesJson = kubectl get svc --all-namespaces -o json | ConvertFrom-Json
} catch {
    Write-Host "❌ Failed to retrieve services from Kubernetes" -ForegroundColor Red
    exit 1
}

# Extract NodePort information
$nodePorts = @()
foreach ($item in $allServicesJson.items) {
    if ($item.spec.type -eq "NodePort") {
        foreach ($port in $item.spec.ports) {
            if ($port.nodePort) {
                $nodePorts += [PSCustomObject]@{
                    Namespace = $item.metadata.namespace
                    Service = $item.metadata.name
                    Port = $port.port
                    TargetPort = $port.targetPort
                    NodePort = $port.nodePort
                    Protocol = $port.protocol
                }
            }
        }
    }
}

# Display all found NodePorts
if ($nodePorts.Count -gt 0) {
    Write-Host "[INFO] Found $($nodePorts.Count) NodePort service(s):" -ForegroundColor Cyan
    Write-Host ""
    $nodePorts | Sort-Object NodePort | Format-Table -AutoSize Namespace, Service, NodePort, Port, Protocol
} else {
    Write-Host "[OK] No NodePort services found in cluster" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking BrAve Forms proposed ports: $($PortsToCheck -join ', ')" -ForegroundColor Yellow
Write-Host ""

# Check for conflicts
$conflicts = @()
foreach ($proposedPort in $PortsToCheck) {
    $conflict = $nodePorts | Where-Object { $_.NodePort -eq $proposedPort }
    if ($conflict) {
        $conflicts += [PSCustomObject]@{
            ProposedPort = $proposedPort
            ConflictNamespace = $conflict.Namespace
            ConflictService = $conflict.Service
        }
    }
}

# Report results
if ($conflicts.Count -gt 0) {
    Write-Host "[ERROR] PORT CONFLICTS DETECTED!" -ForegroundColor Red
    Write-Host ""
    $conflicts | Format-Table -AutoSize
    Write-Host ""
    Write-Host "[WARNING] Cannot proceed with deployment using these ports" -ForegroundColor Yellow
    Write-Host "Recommended actions:" -ForegroundColor Yellow
    Write-Host "  1. Choose different ports from the available range (30000-32767)" -ForegroundColor White
    Write-Host "  2. Update infrastructure/k8s/local/*-deployment.yaml files" -ForegroundColor White
    Write-Host "  3. Re-run this script to verify new ports" -ForegroundColor White
    Write-Host ""

    # Suggest available ports
    Write-Host "Suggesting available ports in 301xx range..." -ForegroundColor Cyan
    $usedPorts = $nodePorts.NodePort
    $availablePorts = @()
    for ($i = 30100; $i -le 30120; $i++) {
        if ($i -notin $usedPorts) {
            $availablePorts += $i
            if ($availablePorts.Count -ge 5) { break }
        }
    }
    Write-Host "Available ports: $($availablePorts -join ', ')" -ForegroundColor Green
    Write-Host ""

    exit 1
} else {
    Write-Host "[OK] No port conflicts detected!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Safe to use the following ports for braveforms namespace:" -ForegroundColor Green
    foreach ($port in $PortsToCheck) {
        Write-Host "  - $port" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "[OK] Ready to deploy BrAve Forms to Rancher Desktop" -ForegroundColor Green
    exit 0
}
