# ISSUE-128: DigitalOcean Production Deployment

**Created:** 2025-11-27
**Status:** COMPLETE
**Priority:** P0 - Critical
**Estimated Hours:** 4h
**Actual Hours:** 4h
**Phase:** 4 - Production Deployment

## Summary

Deploy BrAve Forms to DigitalOcean droplet with SSL certificates, production Docker containers, and database seeding for Q&D Construction pilot.

## Acceptance Criteria

- [x] DigitalOcean droplet provisioned (4GB RAM / 2 vCPU)
- [x] Docker and Docker Compose installed
- [x] SSL certificates configured for domains
- [x] PostgreSQL with TimescaleDB running
- [x] Redis running with authentication
- [x] Backend API deployed and healthy
- [x] Web frontend deployed with standalone output
- [x] Database migrations applied
- [x] Template seeding complete (20 templates)
- [x] Nginx reverse proxy configured
- [x] Health checks passing for all containers

## Implementation Details

### Server Configuration

- **Provider:** DigitalOcean
- **Region:** NYC3
- **IP Address:** 159.89.246.229
- **Droplet Size:** 4GB RAM / 2 vCPU ($24/month)
- **OS:** Ubuntu 24.04 LTS

### Domain Configuration

- **Web Frontend:** https://forms.brave-soft.com
- **API Backend:** https://api.brave-soft.com
- **SSL Provider:** Let's Encrypt (Certbot)

### Docker Services

| Service  | Image                             | Port            | Status  |
| -------- | --------------------------------- | --------------- | ------- |
| postgres | timescale/timescaledb:latest-pg15 | 5432 (internal) | Healthy |
| redis    | redis:7-alpine                    | 6379 (internal) | Healthy |
| backend  | brave-forms-backend               | 4000            | Healthy |
| web      | brave-forms-web                   | 3000            | Healthy |

### Files Created/Modified

- `docker-compose.prod.yml` - Production Docker Compose configuration
- `apps/backend/Dockerfile` - Backend production build
- `apps/web/Dockerfile` - Web frontend production build (standalone output)
- `.env.production` (server only) - Production environment variables
- `/etc/nginx/sites-available/braveforms` - Nginx reverse proxy config

### Database Seeding

Successfully seeded:

- 20 form templates (11 Q&D Construction + 9 agency-specific)
- 1 default organization
- Default user permissions

### Deployment Commands

```bash
# SSH to server
ssh -i ~/.ssh/braveforms_do deploy@159.89.246.229

# Navigate to project
cd ~/brave-forms

# Build and deploy
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Run migrations
docker exec braveforms-backend npx prisma migrate deploy

# Seed templates
docker exec braveforms-backend node dist/seed-templates.js

# Check status
docker ps
docker logs braveforms-backend --tail 50
docker logs braveforms-web --tail 50
```

### Health Check Verification

```bash
# Backend GraphQL
curl -s https://api.brave-soft.com/graphql -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}'
# Returns: {"data":{"__typename":"Query"}}

# Web Frontend
curl -s -I https://forms.brave-soft.com/sign-in
# Returns: HTTP/1.1 200 OK
```

## Evidence

### Commits

- `694f6f8` - feat(deploy): add DigitalOcean production deployment configuration
- `e942d89` - fix(web): resolve case sensitivity issue blocking Linux builds
- `4089034` - fix(deploy): update backend health check to use GraphQL endpoint
- `a9c94fa` - fix: update backend health check to use CMD-SHELL format
- `bd0fe3c` - fix: use wget instead of curl for container health checks

### Screenshots

- Container status: All 4 containers running and healthy
- SSL certificates: Valid for forms.brave-soft.com and api.brave-soft.com
- GraphQL playground: Accessible at https://api.brave-soft.com/graphql

## Testing

- [x] Backend health check endpoint working
- [x] GraphQL introspection returning schema
- [x] Web frontend loading (requires authentication)
- [x] Database connection verified
- [x] Redis connection verified
- [x] SSL certificates valid and auto-renewing

## Notes

- Production uses standalone Next.js output for minimal container size
- Health checks use wget (Alpine) instead of curl
- Nginx handles SSL termination and reverse proxy
- Auto-renewal configured for Let's Encrypt certificates

## Related Issues

- ISSUE-129: Clerk Authentication Implementation
- Sprint 4 Phase 4: Production Deployment

## Completion

**Completed:** 2025-11-27
**Verified By:** Production health checks passing
