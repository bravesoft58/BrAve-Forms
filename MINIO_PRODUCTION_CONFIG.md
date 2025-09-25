# MinIO Production Configuration for BrAve Forms

## Overview
This document provides production configuration guidelines for deploying MinIO S3-compatible storage for BrAve Forms photo management.

## Environment Variables

### Required Production Settings
```bash
# MinIO Server Configuration
MINIO_ROOT_USER=your-secure-admin-user
MINIO_ROOT_PASSWORD=your-very-secure-password-min-8-chars
MINIO_BROWSER_REDIRECT_URL=https://console.your-domain.com

# Storage Configuration
MINIO_STORAGE_CLASS_STANDARD=EC:4  # Erasure coding for redundancy
MINIO_CACHE_DRIVES=/mnt/cache1,/mnt/cache2  # Optional: Cache drives
MINIO_CACHE_EXCLUDE="*.tmp,*.log"

# Security
MINIO_SERVER_URL=https://api.your-domain.com
MINIO_BROWSER_REDIRECT_URL=https://console.your-domain.com
MINIO_CERT_PASSWD_FILE=/etc/ssl/certs/minio-cert-password

# Performance
MINIO_API_REQUESTS_MAX=1000
MINIO_API_REQUESTS_DEADLINE=10s
MINIO_API_CORS_ALLOW_ORIGIN=https://your-brave-forms-domain.com
```

### BrAve Forms Application Settings
```bash
# S3/MinIO Client Configuration
S3_ENDPOINT=https://api.your-domain.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=brave-forms-service-account
AWS_SECRET_ACCESS_KEY=your-service-account-secret
S3_BUCKET_NAME=brave-forms-photos

# Performance Tuning
S3_MAX_CONCURRENT_REQUESTS=10
S3_MULTIPART_UPLOAD_THRESHOLD=5242880  # 5MB
S3_MULTIPART_CHUNK_SIZE=1048576        # 1MB
```

## Kubernetes Deployment

### MinIO StatefulSet Configuration
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: minio
  namespace: brave-forms
spec:
  serviceName: minio
  replicas: 4  # For production redundancy
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:RELEASE.2024-09-01T00-00-00Z
        command:
        - /bin/bash
        - -c
        args:
        - minio server http://minio-{0...3}.minio.brave-forms.svc.cluster.local/data --console-address ":9001"
        env:
        - name: MINIO_ROOT_USER
          valueFrom:
            secretKeyRef:
              name: minio-secret
              key: root-user
        - name: MINIO_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: minio-secret
              key: root-password
        ports:
        - containerPort: 9000
          name: api
        - containerPort: 9001
          name: console
        volumeMounts:
        - name: data
          mountPath: /data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /minio/health/live
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /minio/health/ready
            port: 9000
          initialDelaySeconds: 15
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Ti  # Adjust based on needs
      storageClass: fast-ssd
```

### MinIO Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: brave-forms
spec:
  selector:
    app: minio
  ports:
  - name: api
    port: 9000
    targetPort: 9000
  - name: console
    port: 9001
    targetPort: 9001
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: minio-headless
  namespace: brave-forms
spec:
  clusterIP: None
  selector:
    app: minio
  ports:
  - name: api
    port: 9000
    targetPort: 9000
```

### MinIO Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: minio-api
  namespace: brave-forms
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.your-domain.com
    secretName: minio-api-tls
  rules:
  - host: api.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: minio
            port:
              number: 9000

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: minio-console
  namespace: brave-forms
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - console.your-domain.com
    secretName: minio-console-tls
  rules:
  - host: console.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: minio
            port:
              number: 9001
```

### MinIO Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: minio-secret
  namespace: brave-forms
type: Opaque
stringData:
  root-user: "your-admin-username"
  root-password: "your-very-secure-password"
```

## Bucket Policies and IAM

### Service Account for BrAve Forms
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam:::user/brave-forms-service"
      },
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::brave-forms-photos"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam:::user/brave-forms-service"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::brave-forms-photos/*"
    }
  ]
}
```

### Read-Only Inspector Access Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam:::user/inspector-readonly"
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::brave-forms-photos/inspections/*"
    }
  ]
}
```

## Storage Lifecycle Configuration

### Automated Tiering Policy
```json
{
  "Rules": [
    {
      "ID": "BraveFormsLifecycle",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "photos/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 2555,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2920
      }
    },
    {
      "ID": "ComplianceRetention",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "compliance/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

## Monitoring and Alerting

### Prometheus Configuration
```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: minio-metrics
  namespace: brave-forms
spec:
  selector:
    matchLabels:
      app: minio
  endpoints:
  - port: api
    path: /minio/v2/metrics/cluster
    interval: 30s
```

### Key Metrics to Monitor
- Storage usage and capacity
- Request rate and latency
- Error rates
- Bucket operations
- Network throughput
- CPU and memory usage

### Alerting Rules
```yaml
groups:
- name: minio
  rules:
  - alert: MinIOStorageUsageHigh
    expr: (minio_cluster_usage_total_bytes / minio_cluster_capacity_total_bytes) * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "MinIO storage usage is above 80%"
  
  - alert: MinIOHighErrorRate
    expr: rate(minio_http_requests_total{code=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "MinIO is experiencing high error rates"
```

## Backup and Disaster Recovery

### Cross-Site Replication
```bash
# Configure replication to secondary site
mc admin bucket remote add minio/brave-forms-photos \
  https://backup-site-endpoint/brave-forms-photos-replica \
  --service replication --region us-west-1
```

### Automated Backup Script
```bash
#!/bin/bash
# Daily backup script for critical buckets
mc mirror --overwrite minio/brave-forms-photos backup-storage/brave-forms-photos-$(date +%Y%m%d)
mc mirror --overwrite minio/compliance-archive backup-storage/compliance-archive-$(date +%Y%m%d)
```

## CDN Integration

### Cloudflare Configuration
```javascript
// Cloudflare Worker for S3 signed URL proxy
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname.startsWith('/photos/')) {
    // Proxy to MinIO with caching
    const minioUrl = `https://api.your-domain.com${url.pathname}${url.search}`
    const response = await fetch(minioUrl)
    
    // Add cache headers
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=86400')
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    })
  }
  
  return fetch(request)
}
```

## Security Hardening

### SSL/TLS Configuration
```yaml
# Add to MinIO deployment
env:
- name: MINIO_OPTS
  value: "--certs-dir /etc/ssl/certs"
volumeMounts:
- name: ssl-certs
  mountPath: /etc/ssl/certs
  readOnly: true
volumes:
- name: ssl-certs
  secret:
    secretName: minio-ssl-certs
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: minio-network-policy
  namespace: brave-forms
spec:
  podSelector:
    matchLabels:
      app: minio
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: brave-forms
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 9000
    - protocol: TCP
      port: 9001
```

## Performance Tuning

### OS-Level Optimizations
```bash
# In MinIO container init
echo 'net.core.rmem_default = 262144' >> /etc/sysctl.conf
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_default = 262144' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
sysctl -p
```

### Storage Class Configuration
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd-minio
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
allowVolumeExpansion: true
reclaimPolicy: Retain
```

## Testing and Validation

### Production Readiness Checklist
- [ ] SSL certificates installed and valid
- [ ] Backup and replication configured
- [ ] Monitoring and alerting active
- [ ] Load testing completed
- [ ] Disaster recovery tested
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation updated

### Performance Targets
- Upload throughput: > 50MB/s
- Concurrent users: > 100
- API response time: < 200ms (95th percentile)
- Availability: > 99.9%
- Recovery time: < 30 minutes

## Cost Optimization

### Storage Tiering Strategy
1. **Hot Storage (0-30 days):** Standard SSD
2. **Warm Storage (30-90 days):** Standard HDD  
3. **Cold Storage (90+ days):** Archive tier
4. **Compliance Archive:** Deep archive tier

### Resource Limits
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
    storage: "100Gi"
  limits:
    memory: "4Gi"
    cpu: "2000m"
    storage: "10Ti"
```

This production configuration provides a robust, scalable, and secure MinIO deployment for BrAve Forms photo storage with enterprise-grade features and compliance requirements.