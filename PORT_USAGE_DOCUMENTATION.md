# Port Usage Documentation - BrAve Forms Project

## Currently Used Ports by Other Projects

### RAG/Haystack Project Ports (In Use):
- **3000**: rag-frontend (Haystack frontend)
- **3001**: rag-grafana-enhanced (Grafana)  
- **3100**: rag-loki (Loki logging)
- **3200**: rag-tempo (Tempo tracing)
- **5672**: rag-rabbitmq (RabbitMQ)
- **8000**: rag-api-gateway (API Gateway)
- **8080**: rag-cadvisor (cAdvisor monitoring)
- **8501**: rag-streamlit-ui (Streamlit UI)
- **9090**: rag-prometheus (Prometheus)
- **9095**: rag-tempo (Tempo metrics)
- **9411**: rag-jaeger (Jaeger)
- **14250**: rag-jaeger (Jaeger gRPC)
- **14268-14269**: rag-jaeger (Jaeger HTTP)
- **15672**: rag-rabbitmq (RabbitMQ Management)
- **15692**: rag-rabbitmq (RabbitMQ Prometheus)
- **16686**: rag-jaeger (Jaeger UI)
- **4317-4318**: rag-tempo (OTLP)
- **6831-6832**: rag-jaeger (Jaeger UDP)

### Internal Docker Services (Not Exposed):
- **7474**: rag-neo4j (Neo4j, not exposed)
- **8001-8007**: Various RAG microservices (internal)
- **3592-3593**: rag-cerbos (internal)

## BrAve Forms Port Allocation Strategy

### Kubernetes Services (Internal):
- **5432**: PostgreSQL (in Kubernetes, needs port-forward)
- **6379**: Redis (in Kubernetes, needs port-forward)

### Recommended Port Mappings for BrAve Forms:

#### Database & Cache (Port-Forward):
- **5433**: PostgreSQL (forward from 5432) - AVOID CONFLICT with 5432 if local PostgreSQL exists
- **6380**: Redis (forward from 6379) - AVOID CONFLICT with 6379 if local Redis exists

#### Application Ports:
- **3002**: BrAve Forms Backend/GraphQL API (was 3001, but that's taken by Grafana)
- **3003**: BrAve Forms Web Frontend (was 3000, but that's taken by rag-frontend)
- **3004**: BrAve Forms Mobile Dev Server (if needed)
- **9000**: MinIO S3 Storage (for local development)
- **9001**: MinIO Console

#### Development Tools:
- **4000**: GraphQL Playground (alternative port)
- **5555**: Prisma Studio (default)

## Port-Forward Commands for BrAve Forms

```bash
# PostgreSQL - Use port 5433 to avoid conflicts
kubectl port-forward -n brave-forms svc/postgres 5433:5432

# Redis - Use port 6380 to avoid conflicts  
kubectl port-forward -n brave-forms svc/redis 6380:6379

# MinIO (if deployed)
kubectl port-forward -n brave-forms svc/minio 9000:9000
kubectl port-forward -n brave-forms svc/minio 9001:9001
```

## Environment Variable Updates Required

Update `.env.local` with these ports:
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/brave_forms?schema=public"
REDIS_URL="redis://localhost:6380"
BACKEND_PORT="3002"
WEB_PORT="3003"
NEXT_PUBLIC_API_URL="http://localhost:3002/graphql"
NEXT_PUBLIC_APP_URL="http://localhost:3003"
```

## Checking Port Usage

```bash
# Check if a port is in use on Windows
netstat -an | findstr :PORT

# Check if a port is in use on Linux/Mac
lsof -i :PORT

# List all Docker container ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# List all Kubernetes services
kubectl get svc --all-namespaces
```

## Conflict Resolution

If you encounter port conflicts:
1. Check this document first
2. Use `netstat` or `docker ps` to verify
3. Choose an alternative port from the 3xxx or 4xxx range
4. Update the `.env.local` file accordingly
5. Update this document with the new port allocation

## Reserved Port Ranges

- **3000-3099**: Frontend applications
- **4000-4099**: API services  
- **5000-5099**: Development tools
- **6000-6099**: Cache/Database forwards
- **8000-8099**: Already heavily used by RAG project
- **9000-9099**: Storage services

---
Last Updated: Sprint 1 - December 2024