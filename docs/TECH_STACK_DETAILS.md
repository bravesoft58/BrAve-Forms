# BrAve Forms - Technical Stack Details

**Version:** 1.0
**Last Updated:** September 30, 2025
**Purpose:** Comprehensive technical stack documentation
**Primary Authority:** This document is referenced by CLAUDE.md

---

## Overview

BrAve Forms is a construction compliance management platform built for EPA/OSHA regulatory adherence with 30-day offline capability and field-optimized user experience.

---

## Backend Stack

### Core Framework

**NestJS 10.x**

- **Approach:** GraphQL code-first with decorators
- **Pattern:** `@nestjs/graphql` with `@Resolver()`, `@Query()`, `@Mutation()` decorators
- **Module Structure:** Feature-based modules with dependency injection
- **Guards:** `@UseGuards(ClerkAuthGuard)` for all protected routes

**TypeScript 5.x**

- **Config:** Strict mode enabled
- **Target:** ES2022
- **Module:** ESNext with CommonJS interop
- **Decorators:** Experimental decorators enabled for NestJS

### Database Layer

**PostgreSQL 15**

- **Extension:** TimescaleDB for time-series weather data
- **Features:** Row-Level Security (RLS) for multi-tenancy
- **Connection:** Connection pooling via Prisma
- **Performance:** Indexed on orgId, projectId, userId for tenant isolation

**Prisma 5.x ORM**

- **Schema:** `packages/database/schema.prisma`
- **Features:** JSONB support for dynamic form schemas
- **Multi-tenancy:** Custom middleware for automatic `orgId` filtering (no built-in support)
- **Migrations:** `pnpm db:migrate` for schema changes
- **Studio:** `pnpm --filter database studio` for GUI management

**Multi-Tenancy Implementation:**

```typescript
// Custom Prisma middleware pattern
prisma.$use(async (params, next) => {
  // Automatically inject orgId filter on all queries
  if (params.model && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      orgId: getCurrentOrgId(),
    };
  }
  return next(params);
});
```

### Queue & Background Jobs

**BullMQ with Redis**

- **Use Cases:**
  - Photo processing (EXIF extraction, compression, CDN upload)
  - Weather monitoring (0.25" rain threshold checks)
  - Report generation (PDF creation, email delivery)
  - Offline sync operations (conflict resolution)
- **Queues:**
  - `photo-processing` - High priority
  - `weather-monitoring` - Real-time checks
  - `report-generation` - Background batch
  - `offline-sync` - User-triggered

### Authentication

**Clerk Organizations**

- **JWT Claims:** `o.id` (org ID), `o.rol` (role), `o.slg` (slug)
- **Mode:** Organizations-only (personal accounts disabled by default since Aug 2024)
- **Integration:** `@clerk/nextjs` for frontend, custom JWT validation in NestJS
- **Roles:** OWNER, ADMIN, MEMBER (custom roles via metadata)

**Security Pattern:**

```typescript
@UseGuards(ClerkAuthGuard)
@Resolver(() => Project)
export class ProjectsResolver {
  @Query(() => [Project])
  async projects(@CurrentUser() user: CurrentUser) {
    // user.orgId automatically extracted from JWT
    return this.projectsService.findByOrgId(user.orgId);
  }
}
```

---

## Frontend Stack

### Web Application

**Next.js 14 (App Router)**

- **Structure:** `apps/web/app/` directory-based routing
- **Rendering:** Server Components + Client Components hybrid
- **API:** GraphQL via Apollo Client 4.x
- **Deployment:** Standalone output for Docker containers

**Known Issues:**

- Pre-rendering fails for pages using Clerk/Apollo hooks
- Workaround: `export const dynamic = 'force-dynamic'` on affected pages
- See: `WEB_FRONTEND_STATUS.md` for current build status

**State Management:**

- **Valtio:** Local state management (reactive proxy-based)
- **TanStack Query v5:** Server state with offline persistence
  - Required: `@tanstack/query-async-storage-persister`
  - Pattern: Query cache persists to IndexedDB
  - Rehydration on app startup

**UI Components:**

- **Mantine v7:** Component library
- **Pattern:** Theme customization in `apps/web/app/theme.ts`
- **Accessibility:** WCAG AA compliant
- **Field Optimization:** Large touch targets for glove use

**Forms:**

- **React Hook Form:** Form state management
- **Zod:** Schema validation
- **Pattern:** Dynamic form engine for EPA/OSHA compliance forms
- **Offline:** Form data queued in IndexedDB when offline

### Mobile Application

**Capacitor 6 (Released April 2024)**

- **Platform:** iOS 13+, Android 10+
- **Runtime:** WKWebView (iOS), WebView (Android)
- **Structure:** `apps/mobile/src/` shared with web app

**Plugins Used:**

- **@capacitor/camera:** Photo capture with GPS EXIF data
- **@capacitor/geolocation:** Location tracking for inspections
- **@capacitor/preferences:** Secure key-value storage
- **@capacitor-community/sqlite:** Critical compliance data storage

**Offline Strategy:**

- **30-Day Capability:** Custom implementation required (not built-in)
- **Storage:**
  - **SQLite:** Critical compliance data (inspections, photos, audit trails)
  - **IndexedDB:** Cache/performance data only
  - **Reason:** iOS reclaims IndexedDB under low storage conditions
- **Sync:** Delta sync with conflict resolution on reconnect

**Field Optimizations:**

- Large touch targets (glove-friendly)
- High contrast UI (sunlight readability)
- Weather-resistant operation (works in rain/dust)
- Interrupted operation handling (battery, connectivity loss)

---

## Infrastructure Stack

### Local Development

**Rancher Desktop**

- **Container Runtime:** containerd (production-standard)
- **Orchestration:** k3s (lightweight Kubernetes)
- **CLI:** nerdctl (Docker CLI compatible)
- **Namespace:** braveforms (isolated from other projects)

**Kubernetes Configuration:**

- **Services:**
  - Backend API (Port 30101)
  - Web Frontend (Port 30102)
  - PostgreSQL (Port 30103)
  - Redis, MinIO (internal only)
- **Ingress:** Traefik for local routing
- **Secrets:** Manual creation via `k8s-local-setup.ps1 -CreateSecrets`

**Build Commands:**

```bash
# Build images
nerdctl --namespace k8s.io build -t braveforms/backend:latest ./apps/backend
nerdctl --namespace k8s.io build -t braveforms/web:latest ./apps/web

# Deploy to k3s
kubectl apply -f infrastructure/k8s/local/
```

### Production Infrastructure

**Kubernetes (AWS EKS)**

- **Region:** Multi-region for high availability
- **Node Groups:** Spot + On-Demand mix for cost optimization
- **Autoscaling:** Horizontal Pod Autoscaler (HPA) for 10,000+ concurrent users
- **Monitoring:** Datadog APM + Sentry error tracking

**Infrastructure as Code (IaC):**

- **Terraform 1.5+:** All infrastructure defined as code
- **State:** Remote state in S3 with DynamoDB locking
- **Modules:** Reusable modules for VPC, EKS, RDS, S3

**CI/CD Pipeline (GitHub Actions):**

```yaml
Workflow:
1. Lint + Type Check
2. Unit Tests (80% coverage requirement)
3. Build Docker Images
4. Push to ECR
5. Deploy to Staging
6. E2E Tests (Playwright)
7. Manual Approval Gate
8. Deploy to Production
9. Health Check Verification
```

### Storage & CDN

**PostgreSQL RDS:**

- **Instance:** Multi-AZ deployment
- **Backups:** Automated daily backups + point-in-time recovery
- **Encryption:** At-rest and in-transit
- **RLS:** Row-Level Security for multi-tenancy

**Photo Storage:**

- **Primary:** AWS S3 (50TB+ capacity)
- **CDN:** CloudFront for global delivery
- **Optimization:** Progressive JPEG compression
- **Lifecycle:** Hot → Warm → Cold storage tiering
- **Metadata:** PostgreSQL (EXIF, GPS, timestamps)

**Redis ElastiCache:**

- **Use:** BullMQ queues, session cache, rate limiting
- **Mode:** Cluster mode for HA
- **Persistence:** RDB + AOF snapshots

---

## Development Tools

### Package Management

**pnpm 8.x**

- **Workspaces:** Monorepo with shared dependencies
- **Structure:**
  ```
  apps/
    - backend/
    - web/
    - mobile/
  packages/
    - database/
    - types/
    - compliance/
  ```
- **Commands:**
  - `pnpm install` - Install all dependencies
  - `pnpm --filter backend dev` - Run specific workspace
  - `pnpm -r build` - Build all workspaces

### Testing

**Backend (Jest)**

- **Unit Tests:** `*.spec.ts` files co-located with source
- **Integration Tests:** `tests/integration/` directory
- **E2E Tests:** `tests/e2e/` with Supertest
- **Coverage Target:** >80% for new code
- **Command:** `pnpm --filter backend test`

**Frontend (Vitest)**

- **Unit Tests:** `*.test.tsx` files
- **Component Tests:** React Testing Library
- **Coverage Target:** >80% for new code
- **Command:** `pnpm --filter web test`

**E2E Testing (Playwright)**

- **Browsers:** Chromium, Firefox, WebKit
- **Scenarios:** Critical user flows + compliance workflows
- **Command:** `pnpm test:e2e`

### Code Quality

**ESLint + Prettier**

- **Config:** Shared config in root `.eslintrc.js`
- **Rules:** TypeScript strict rules + React best practices
- **Format on Save:** Enabled in VS Code
- **Pre-commit:** Husky + lint-staged enforces formatting

**Git Hooks (Husky)**

- **Pre-commit:** Lint + format staged files
- **Commit-msg:** Validate conventional commit format
- **Pre-push:** Run type-check (optional, can be slow)

---

## Technology-Specific Notes

### React Hook Form with Zod

**Pattern for Dynamic Forms:**

```typescript
const formSchema = z.object({
  // Dynamic schema based on EPA/OSHA form definition
  fields: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('text'), value: z.string() }),
      z.object({ type: z.literal('number'), value: z.number() }),
      z.object({ type: z.literal('photo'), value: z.string().url() }),
    ])
  ),
});

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: loadFromIndexedDB(), // Offline persistence
});
```

### Service Workers for Offline

**Strategy:** Custom 30-day offline implementation

```typescript
// Cache strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          // Cache API responses for offline use
          return caches.open('api-v1').then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    })
  );
});
```

**Sync on Reconnect:**

- Background Sync API for queued operations
- Conflict resolution for concurrent edits
- Delta sync to minimize bandwidth

### Weather APIs

**NOAA (Primary):**

- **Endpoint:** National Weather Service API
- **Rate Limit:** Generous for non-commercial
- **Precision:** 0.01" for exact 0.25" threshold checks
- **Reliability:** Government-operated, high uptime

**OpenWeatherMap (Fallback):**

- **Use:** NOAA API failures
- **Rate Limit:** 1000 calls/day (free tier)
- **Precision:** 0.1mm (convert to inches)

**0.25" Rain Trigger Logic:**

```typescript
// EPA CGP requirement: Exactly 0.25", not approximated
const checkRainThreshold = (precipitationInches: number): boolean => {
  return precipitationInches >= 0.25; // MUST be exact, not 0.24 or 0.26
};

// 24-hour accumulation within working hours
const scheduleInspection = (stormEvent: StormEvent): void => {
  if (checkRainThreshold(stormEvent.totalPrecipitation)) {
    // Schedule within 24 working hours of event end
    const deadline = addWorkingHours(stormEvent.endTime, 24);
    createInspectionTask(stormEvent.projectId, deadline);
  }
};
```

### Sprint 5 Libraries (Photo Gallery + Form Builder)

#### Mapping & Geolocation

**MapLibre GL JS (NOT Mapbox GL JS)**

- **License:** BSD 3-Clause (fully open source)
- **Why Chosen:** Mapbox GL JS v2+ changed to proprietary license (Dec 2020)
- **Cost:** FREE vs Mapbox's $5-20/month usage-based tile billing
- **Governance:** Linux Foundation (Amazon, Meta, Microsoft backing)
- **Features:** WebGL2 renderer, vector tiles, modern performance
- **Offline Support:** Self-host tiles for construction sites without connectivity
- **React Integration:** react-map-gl supports both Mapbox and MapLibre (zero code change)

**Installation:**

```bash
pnpm add maplibre-gl react-map-gl
```

**Code Example:**

```typescript
import { Map } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

<Map
  mapLib={maplibregl}
  initialViewState={{ longitude: -122.4, latitude: 37.8, zoom: 14 }}
  mapStyle="https://tiles.stadiamaps.com/styles/osm_bright.json" // Free tiles
  mapboxAccessToken={undefined} // No Mapbox token needed
/>
```

**Free Tile Providers:**

- Stadia Maps (OSM Bright, Alidade)
- MapTiler (OSM Bright, Basic)
- OpenStreetMap (direct OSM tiles)
- Self-hosted (for offline capability)

---

#### Photo Annotation

**Annotorious (@annotorious/react)**

- **License:** BSD 3-Clause (fully open source)
- **Why Chosen:** react-image-annotate is unmaintained (last update 5 years ago)
- **Status:** Actively maintained (updates through Sept 2025)
- **Features:** Annotations, tags, drawing tools, TypeScript support
- **React Support:** Official @annotorious/react bindings

**Installation:**

```bash
pnpm add @annotorious/react @annotorious/annotorious
```

**Code Example:**

```typescript
import { Annotorious } from '@annotorious/react';

<Annotorious>
  <img src={photoUrl} alt="Inspection photo" />
</Annotorious>
```

---

#### Image Lightbox

**Yet Another React Lightbox**

- **License:** MIT (fully open source)
- **Why Chosen:** react-image-lightbox is deprecated and no longer supported
- **Compatibility:** React 19, 18, 17, 16.8+
- **Features:** Keyboard/mouse/touch navigation, preloading, responsive images (srcset/sizes)
- **Plugins:** Zoom, thumbnails, video support
- **Recommendation:** Endorsed by Mantine community

**Installation:**

```bash
pnpm add yet-another-react-lightbox
```

**Code Example:**

```typescript
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

<Lightbox
  open={open}
  close={() => setOpen(false)}
  slides={photos}
  plugins={[Zoom, Thumbnails]}
/>
```

---

#### Expression Parser (Form Builder Calculated Fields)

**expr-eval (NOT mathjs)**

- **License:** MIT (simple, permissive, NO copyleft)
- **Why Chosen:**
  - **Simpler License:** mathjs has Apache 2.0 + LGPL-2.1+ component (copyleft concerns)
  - **Smaller Size:** 5KB minified vs mathjs's heavy package
  - **Better Security:** No import/createUnit functions that pose risks in mathjs
- **Features:** Operators (+, -, \*, /), Functions (SUM, AVG, MIN, MAX)
- **Use Case:** Calculated fields in form builder (auto-compute totals, averages)

**Installation:**

```bash
pnpm add expr-eval
```

**Code Example:**

```typescript
import { Parser } from 'expr-eval';

const parser = new Parser();

// Basic arithmetic
parser.evaluate('2 * 3 + 4'); // 10

// With variables (field references)
parser.evaluate('field1 + field2', { field1: 10, field2: 20 }); // 30

// Functions
parser.evaluate('SUM(a, b, c)', { a: 10, b: 20, c: 30 }); // 60
parser.evaluate('AVG(x, y)', { x: 100, y: 200 }); // 150
```

**Security Considerations:**

- mathjs has `import` and `createUnit` functions that can alter built-in functionality
- expr-eval has simpler, more secure API with no dangerous functions
- Always sanitize user input before evaluation

---

#### Drag & Drop (Form Builder)

**@dnd-kit/core**

- **License:** MIT (fully open source)
- **Why Chosen:** Best-in-class for 2025 (modern, performant, accessible)
- **Size:** 10KB minified, zero dependencies
- **Performance:** Minimal re-renders, optimized for React
- **Accessibility:** Built-in ARIA support
- **Better Than:** react-beautiful-dnd, react-dnd, react-sortable-hoc

**Installation:**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Code Example (Form Builder Canvas):**

```typescript
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

<DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={fields.map((f) => f.id)}
    strategy={verticalListSortingStrategy}
  >
    {/* Sortable field list */}
  </SortableContext>
</DndContext>
```

**Integration with React Hook Form:**

- Well-documented useFieldArray integration
- Working examples available on StackBlitz and CodeSandbox
- Community-tested with form builders

---

## Performance Targets

### API Performance

- **Response Time:** P95 < 200ms
- **Throughput:** 10,000 requests/second
- **Database Queries:** P95 < 50ms
- **Error Rate:** <0.1%

### Frontend Performance

- **First Contentful Paint (FCP):** <1.5s
- **Time to Interactive (TTI):** <3s
- **App Startup:** <3 seconds (mobile)
- **Photo Upload:** <15 seconds per batch

### Offline Sync

- **Sync Duration:** <2 minutes for day's data
- **Conflict Resolution:** <5 seconds per conflict
- **Storage Capacity:** 30 days of inspection data

---

## Security & Compliance

### Authentication Security

- **JWT Validation:** HS256 signing with Clerk public key
- **Token Expiration:** 1 hour (refresh every 50 minutes)
- **Org Context:** Every request validates orgId in JWT claims
- **RBAC:** Role-based access control via Clerk metadata

### Data Security

- **Encryption at Rest:** AES-256 (RDS, S3)
- **Encryption in Transit:** TLS 1.3
- **PII Handling:** Minimal collection, GDPR compliant
- **Audit Trail:** All compliance actions logged immutably

### Multi-Tenant Isolation

**Three-Layer Defense:**

1. **Application Layer:** Clerk orgId in JWT → All queries filtered
2. **ORM Layer:** Prisma middleware auto-injects orgId filter
3. **Database Layer:** PostgreSQL RLS policies enforce tenant boundaries

**Test:** Cross-tenant access attempts MUST fail (tested in every PR)

---

## Version Compatibility

### Minimum Versions

- **Node.js:** 18.x LTS
- **pnpm:** 8.x
- **PostgreSQL:** 15.x
- **Redis:** 7.x
- **Kubernetes:** 1.27+
- **iOS:** 13+
- **Android:** 10+ (API level 29)

### Breaking Changes

**Next.js 14 App Router:**

- Pages using Clerk hooks fail at build time (requires runtime rendering)
- Workaround: `export const dynamic = 'force-dynamic'`
- See: WEB_FRONTEND_STATUS.md

**Capacitor 6:**

- Breaking changes from v5 (plugin API updates)
- iOS storage: IndexedDB is transient (use SQLite for critical data)

---

## References

- **CLAUDE.md:** Primary development guidance
- **WEB_FRONTEND_STATUS.md:** Current frontend build issues
- **TECHNICAL_DEBT_AND_KNOWN_ISSUES.md:** Known limitations
- **EPA CGP 2022:** Compliance requirements (0.25" rain threshold)

---

**Last Updated:** September 30, 2025
**Maintained By:** Development Team
**Review Frequency:** Quarterly or when major versions change
