# ISSUE-035: Deploy Weather Service to Kubernetes

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 16:25:00 EDT
**Dependencies:** ISSUE-034 ✅

---

## What You'll Do

Rebuild backend image with weather service and verify GraphQL query works.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-034 complete (weather service tested)
- Kubernetes running

### Steps

1. Rebuild backend image:
```bash
nerdctl --namespace k8s.io build -t braveforms/backend:latest ./apps/backend
```

2. Restart backend deployment:
```bash
kubectl rollout restart deployment/backend -n braveforms
```

3. Wait for new pod to start:
```bash
kubectl rollout status deployment/backend -n braveforms
```

4. Check logs for startup:
```bash
kubectl logs deployment/backend -n braveforms --tail=50
```

5. Test weather GraphQL query:
```bash
curl -X POST http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { precipitation(lat: 38.8951, lon: -77.0364) { timestamp amountInches stationId } }"}'
```

6. Screenshot successful response

---

## Files to Verify

**Check these:**
- Backend pod running: `kubectl get pods -n braveforms`
- Weather service logs: `kubectl logs deployment/backend -n braveforms | grep weather`

---

## Verification Checklist

- [ ] Backend image rebuilt successfully
- [ ] Deployment restarted
- [ ] New pod running (check with kubectl get pods)
- [ ] Logs show no errors
- [ ] GraphQL query returns precipitation data
- [ ] Response includes timestamp, amountInches, stationId
- [ ] Evidence collected

---

## Testing Steps

1. Check pod status:
```bash
kubectl get pods -n braveforms
```

2. Check GraphQL endpoint:
```bash
curl http://localhost:30101/graphql
```

3. Test weather query with actual coordinates

---

## Evidence Requirements

**Location:** `evidence/ISSUE-035/deployment/`

**Required Screenshots:**
1. `backend-rebuild.png` - Terminal showing successful image build
2. `pods-running.png` - kubectl showing new backend pod
3. `graphql-precipitation-response.png` - Successful weather query response

---

## Troubleshooting

**Problem:** Build fails
- Check Dockerfile syntax
- Verify all TypeScript compiles: `pnpm --filter backend build`
- Check Docker context includes all files

**Problem:** Pod crash loop
- Check logs: `kubectl logs deployment/backend -n braveforms`
- Verify Redis connection
- Check environment variables

**Problem:** GraphQL query fails
- Verify backend is fully started (check logs)
- Check NOAA API is accessible from pod
- Test with simpler query first

**Problem:** NOAA API timeout
- Check internet access from pod
- Verify NOAA API is up: https://api.weather.gov/
- Increase timeout if needed

---

## Success Criteria

- Backend image rebuilt with weather service
- Pod running without errors
- GraphQL precipitation query works
- Returns real NOAA data
- Cache working (Redis connected)
- Evidence collected

---

## Next Issue

**ISSUE-036:** Install PWA Dependencies (10 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 20 minutes
