# ISSUE-006 Redis and MinIO Deployment - Evidence

**Timestamp:** 2025-10-01 08:45:00 EDT
**Status:** COMPLETED
**Time Taken:** 20 minutes
**Evidence Collected:** 2025-10-01 08:36:00 - 08:45:00 EDT

## Summary

Successfully deployed Redis 7 (caching) and MinIO (S3-compatible storage) to braveforms namespace. All three infrastructure pods (PostgreSQL, Redis, MinIO) are now running and ready.

## Deployment Steps

### 1. Deploy Redis

**Command:**
```bash
kubectl apply -f infrastructure/k8s/local/redis-deployment.yaml
```

**Result:**
```
persistentvolumeclaim/redis-pvc created
service/redis created
deployment.apps/redis created
```

### 2. Deploy MinIO

**Command:**
```bash
kubectl apply -f infrastructure/k8s/local/minio-deployment.yaml
```

**Result:**
```
persistentvolumeclaim/minio-pvc created
service/minio created
service/minio-console created
deployment.apps/minio created
```

### 3. Fix Secret Key Mismatch Issues

**Issue 1: Redis Missing Password Key**

**Error:** `couldn't find key redis-password in Secret braveforms/brave-forms-secrets`

**Fix:**
```bash
kubectl delete secret brave-forms-secrets -n braveforms
kubectl create secret generic brave-forms-secrets -n braveforms \
  --from-literal=database-user=brave \
  --from-literal=database-password=brave_secure_pass \
  --from-literal=redis-password=redis_secure_pass \
  --from-literal=minio-access-key=minio_admin \
  --from-literal=minio-secret-key=minio_secure_pass
```

**Issue 2: MinIO Key Names**

**Error:** `couldn't find key minio-access-key in Secret braveforms/brave-forms-secrets`

**Root Cause:** MinIO deployment expects `minio-access-key` and `minio-secret-key`, not `minio-root-user` and `minio-root-password`

**Fix:** Recreated secret with correct key names (see above)

### 4. Recreate All Pods

**Command:**
```bash
kubectl delete pod -l app=postgres -n braveforms
kubectl delete pod -l app=redis -n braveforms
kubectl delete pod -l app=minio -n braveforms
```

**Wait for Ready:**
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n braveforms --timeout=60s
kubectl wait --for=condition=ready pod -l app=redis -n braveforms --timeout=60s
kubectl wait --for=condition=ready pod -l app=minio -n braveforms --timeout=60s
```

**Result:**
```
pod/postgres-7cc8847c5b-nhgfh condition met
pod/redis-6fb8786468-6jbsv condition met
pod/minio-f8c96978d-j68x6 condition met
```

## Verification

### All Infrastructure Pods Running

**Command:**
```bash
kubectl get all -n braveforms
```

**Output:**
```
NAME                            READY   STATUS    RESTARTS   AGE
pod/minio-f8c96978d-j68x6       1/1     Running   0          21s
pod/postgres-7cc8847c5b-nhgfh   1/1     Running   0          23s
pod/redis-6fb8786468-6jbsv      1/1     Running   0          22s

NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
service/minio           ClusterIP   10.43.229.166   <none>        9000/TCP,9001/TCP   5m8s
service/minio-console   NodePort    10.43.156.28    <none>        9001:30103/TCP      5m8s
service/postgres        ClusterIP   10.43.37.92     <none>        5432/TCP            11h
service/redis           ClusterIP   10.43.154.201   <none>        6379/TCP            5m12s

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/minio      1/1     1            1           5m8s
deployment.apps/postgres   1/1     1            1           11h
deployment.apps/redis      1/1     1            1           5m12s

NAME                                  DESIRED   CURRENT   READY   AGE
replicaset.apps/minio-f8c96978d       1         1         1       5m8s
replicaset.apps/postgres-7cc8847c5b   1         1         1       11h
replicaset.apps/redis-6fb8786468      1         1         1       5m12s
```

**Status:** ALL RUNNING

### Infrastructure Summary

**PostgreSQL (TimescaleDB 15):**
- Pod: postgres-7cc8847c5b-nhgfh
- Service: postgres.braveforms.svc.cluster.local:5432
- Status: Running (1/1 Ready)
- Purpose: Primary database with TimescaleDB for time-series weather data

**Redis 7:**
- Pod: redis-6fb8786468-6jbsv
- Service: redis.braveforms.svc.cluster.local:6379
- Status: Running (1/1 Ready)
- Purpose: Caching and BullMQ job queue backend

**MinIO (S3-compatible):**
- Pod: minio-f8c96978d-j68x6
- Service: minio.braveforms.svc.cluster.local:9000
- Console: http://localhost:30103 (NodePort)
- Status: Running (1/1 Ready)
- Purpose: Photo storage and object storage

## Service Configurations

### Redis Configuration

**Image:** redis:7-alpine
**Port:** 6379
**Authentication:** Password-protected (redis_secure_pass)
**Persistence:** Appendonly mode enabled (/data volume)
**Resource Limits:**
- CPU: 100m request, 200m limit
- Memory: 128Mi request, 256Mi limit

**Connection String (internal):**
```
redis://:redis_secure_pass@redis.braveforms.svc.cluster.local:6379
```

### MinIO Configuration

**Image:** minio/minio:latest
**Ports:**
- API: 9000 (ClusterIP)
- Console: 9001 (NodePort 30103)
**Credentials:**
- Access Key: minio_admin
- Secret Key: minio_secure_pass
**Storage:** /data volume (10Gi PVC)
**Resource Limits:**
- CPU: 200m request, 500m limit
- Memory: 256Mi request, 512Mi limit

**Access URLs:**
- Internal API: http://minio.braveforms.svc.cluster.local:9000
- External Console: http://localhost:30103

## Acceptance Criteria Verification

From ISSUE-006 requirements:

- [x] Redis pod running - VERIFIED (redis-6fb8786468-6jbsv)
- [x] MinIO pod running - VERIFIED (minio-f8c96978d-j68x6)
- [x] All 3 infrastructure pods ready - VERIFIED (postgres, redis, minio all 1/1 Ready)

## Troubleshooting Summary

### Secret Key Mismatches (Resolved)

**Issue:** Deployments expected specific key names in Kubernetes secret

**Solution:** Updated `brave-forms-secrets` secret with all required keys:
- `database-user` and `database-password` (PostgreSQL)
- `redis-password` (Redis)
- `minio-access-key` and `minio-secret-key` (MinIO)

**Lesson:** Always verify secret key names match deployment manifest expectations

## Next Steps

**Immediate:**

1. ISSUE-006 COMPLETE
2. Proceed to ISSUE-007: Run Prisma Migrations

**For ISSUE-007:**
1. Port forward to PostgreSQL: `kubectl port-forward svc/postgres 5432:5432 -n braveforms`
2. Run migrations: `pnpm --filter @brave-forms/database prisma migrate deploy`
3. Verify tables created

## Architecture Validation

**Multi-Tenancy:**
- PostgreSQL ready for RLS policies
- Redis will cache per-tenant data
- MinIO will use tenant-prefixed object keys

**EPA Compliance:**
- TimescaleDB for efficient time-series weather data
- Redis for 6-hour weather cache (NOAA API rate limiting)
- MinIO for GPS-tagged photo storage with EXIF data

**Performance:**
- All services have resource limits for predictable performance
- PVCs ensure data persistence across pod restarts
- ClusterIP services for internal communication

---

**Evidence Type:** Kubernetes infrastructure deployment verification
**Conclusion:** All infrastructure services deployed successfully and operational
**Sprint 1 Progress:** 6/20 issues complete (30%)
