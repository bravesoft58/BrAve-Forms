# System Architecture Document (SAD)
## BrAve Forms Platform v1.0

**Document Version:** 1.0  
**Date:** August 2025  
**Status:** Final - Board Approved  
**Classification:** Technical Architecture - Authoritative Reference

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Principles and Patterns](#3-architecture-principles-and-patterns)
4. [System Components Architecture](#4-system-components-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Data Architecture](#6-data-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Infrastructure Architecture](#9-infrastructure-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Monitoring and Observability](#11-monitoring-and-observability)
12. [Performance Architecture](#12-performance-architecture)
13. [Disaster Recovery Architecture](#13-disaster-recovery-architecture)
14. [Architecture Decision Records](#14-architecture-decision-records)
15. [Migration and Evolution Strategy](#15-migration-and-evolution-strategy)

---

## 1. Executive Summary

### 1.1 Purpose

This System Architecture Document defines the comprehensive technical architecture for the BrAve Forms Platform v1.0, a web-first construction compliance and forms management system designed to reduce daily documentation time from 2-3 hours to under 30 minutes while ensuring regulatory compliance across federal, state, and local jurisdictions.

### 1.2 Scope

The architecture encompasses:
- **Multi-platform mobile application** using Capacitor 6 + React
- **Microservices backend** with NestJS and GraphQL/REST APIs
- **Clerk authentication** with 30-day offline token extension
- **PostgreSQL 15 with TimescaleDB** for time-series weather data and JSONB for flexible form schemas
- **Weather-triggered compliance** with 0.25" rain threshold automation
- **QR-based inspector portals** requiring no app installation
- **30-day offline operation** with intelligent synchronization
- **Multi-tenant architecture** supporting 10,000+ concurrent users

### 1.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Cross-Platform Framework** | Capacitor 6 + React | 90%+ code reuse, superior offline support, 3-4 month MVP |
| **Authentication Provider** | Clerk | 2-3 months faster development, SOC 2 compliance, built-in SSO |
| **Backend Framework** | NestJS + TypeScript | Enterprise patterns, microservices support, strong typing |
| **Database** | PostgreSQL 15 with TimescaleDB + JSONB | Time-series optimization for weather data, flexible schemas, ACID compliance |
| **Mobile State Management** | TanStack Query v5 + Valtio | Built-in offline support, minimal boilerplate |
| **Message Queue** | BullMQ + Redis | Simple setup, $5-100/month cost, sufficient for scale |
| **File Storage** | Hybrid (PostgreSQL + S3) | Cost optimization, 40-70% savings vs pure cloud |

### 1.4 Architecture Goals

- **Performance**: <200ms API response, <2s mobile app launch
- **Availability**: 99.9% uptime SLA (43.2 minutes/month downtime)
- **Scalability**: 10,000+ concurrent users, 1M+ form submissions/month
- **Security**: SOC 2 Type II compliance, zero-trust model
- **Offline**: 30-day disconnected operation capability
- **Integration**: Weather APIs, regulatory systems, ERP platforms

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  iOS App  │  Android App  │  Progressive Web App  │  Web Portal │
│          (Capacitor 6 + React + Mantine v7)                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                ┌─────▼─────────┐
                │  API Gateway  │
                │  (GraphQL +   │
                │   REST APIs)  │
                └─────┬─────────┘
                      │
┌─────────────────────┼─────────────────────────────────────────┐
│                  Application Services Layer                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│ │Auth Service  │ │Forms Service │ │Compliance    │           │
│ │(Clerk + JWT) │ │(NestJS)      │ │Engine        │           │
│ └──────────────┘ └──────────────┘ └──────────────┘           │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│ │Weather       │ │QR Service    │ │Notification  │           │
│ │Integration   │ │              │ │Service       │           │
│ └──────────────┘ └──────────────┘ └──────────────┘           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┼─────────────────────────────────────────┐
│                     Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│ PostgreSQL 15+TimescaleDB │ Redis Cache │ S3 Storage │ BullMQ Queue │
└─────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┼─────────────────────────────────────────┐
│                External Integrations                           │
├─────────────────────────────────────────────────────────────────┤
│  NOAA Weather  │  OpenWeatherMap  │  EPA APIs  │  QuickBooks   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 System Context

```mermaid
graph TB
    subgraph "BrAve Forms Platform"
        Core[Core Platform]
    end
    
    subgraph "Users"
        Foreman[Construction Foreman]
        Inspector[Environmental Inspector]
        Admin[Compliance Admin]
        PM[Project Manager]
    end
    
    subgraph "External Systems"
        Weather[Weather Services]
        Regulatory[Regulatory APIs]
        ERP[ERP Systems]
        Storage[Cloud Storage]
    end
    
    Foreman -->|Mobile App| Core
    Inspector -->|QR Portal| Core
    Admin -->|Web Dashboard| Core
    PM -->|Mobile/Web| Core
    
    Core <-->|Real-time| Weather
    Core <-->|Submissions| Regulatory
    Core <-->|Sync| ERP
    Core -->|Photos| Storage
```

### 2.3 Deployment Overview

- **Multi-Region Deployment**: Primary US-East, Secondary US-West
- **Container Orchestration**: Kubernetes 1.28+ (cloud-agnostic)
- **CDN**: Cloudflare for global edge caching
- **Database**: Managed PostgreSQL with read replicas
- **Monitoring**: Prometheus + Grafana stack

---

## 3. Architecture Principles and Patterns

### 3.1 Core Architectural Principles

#### Web-First Design
- **Offline-First**: All features designed to work without connectivity
- **Progressive Enhancement**: Basic web features work everywhere, mobile enhancements when available
- **Responsive Design**: Single codebase adapts to all screen sizes
- **Performance Optimization**: Fast loading and efficient resource usage

#### Domain-Driven Design (DDD)
- **Bounded Contexts**: Clear separation of business domains
- **Aggregates**: Form submissions, projects, inspections as aggregate roots
- **Value Objects**: GPS coordinates, weather data, compliance rules
- **Domain Events**: Weather triggers, compliance violations, sync events

#### Microservices Architecture
```yaml
service_boundaries:
  authentication:
    provider: Clerk
    customization: Offline token extension
    responsibility: User identity, sessions, organizations
  
  forms_management:
    technology: NestJS
    responsibility: Form templates, submissions, validation
    database: PostgreSQL with JSONB
  
  compliance_engine:
    technology: NestJS
    responsibility: Rules evaluation, violation tracking
    integrations: EPA, OSHA, state systems
  
  weather_service:
    technology: NestJS
    responsibility: Weather monitoring, alerts
    integrations: NOAA, OpenWeatherMap
  
  notification_service:
    technology: NestJS
    responsibility: Push, SMS, email notifications
    queue: BullMQ
```

### 3.2 Design Patterns

#### Repository Pattern
```typescript
// Offline-first repository with sync capability
export class OfflineFirstRepository<T> {
  constructor(
    private localDb: SQLiteDatabase,
    private remoteApi: ApiClient,
    private syncQueue: SyncQueue
  ) {}
  
  async find(id: string): Promise<T> {
    // Try local first
    const local = await this.localDb.findOne(id);
    if (local) return local;
    
    // If online, fetch from remote
    if (this.isOnline()) {
      const remote = await this.remoteApi.get(id);
      await this.localDb.save(remote);
      return remote;
    }
    
    return null;
  }
  
  async save(entity: T): Promise<T> {
    // Always save locally first
    const saved = await this.localDb.save(entity);
    
    // Queue for sync if online
    if (this.isOnline()) {
      await this.syncQueue.add(entity);
    } else {
      await this.syncQueue.addOffline(entity);
    }
    
    return saved;
  }
}
```

#### Event-Driven Architecture
```yaml
event_flows:
  weather_compliance:
    trigger: "0.25 inch rain detected"
    events:
      - WeatherThresholdExceeded
      - ComplianceTaskCreated
      - NotificationSent
      - InspectionDeadlineSet
    subscribers:
      - ComplianceEngine
      - NotificationService
      - TaskScheduler
      - AuditLogger
  
  form_submission:
    trigger: "Form submitted"
    events:
      - FormSubmitted
      - ValidationCompleted
      - ComplianceChecked
      - DataSynced
    subscribers:
      - ValidationService
      - ComplianceEngine
      - SyncService
      - ReportingService
```

### 3.3 Multi-Tenant Architecture

#### Tenant Isolation Strategy
```sql
-- Row-level security with Clerk organization context
CREATE POLICY tenant_isolation ON form_submissions
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Tenant identification from Clerk
CREATE TABLE tenant_mapping (
  clerk_org_id VARCHAR(255) PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  tier VARCHAR(20) DEFAULT 'standard', -- standard, professional, enterprise
  isolation_level VARCHAR(20) DEFAULT 'row', -- row, schema, database
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. System Components Architecture

### 4.1 Frontend Architecture

#### Mobile Application Stack
```yaml
framework: Capacitor 6.0+
ui_library: React 18.2+
component_library: Mantine v7
state_management:
  server_state: TanStack Query v5
  local_state: Valtio
  form_state: React Hook Form + Zod
offline_storage: SQLite (via Capacitor)
capabilities:
  - Native camera access
  - GPS location services
  - Push notifications
  - Background sync
  - Offline operation (30 days)
```

#### Component Architecture
```typescript
// Layered component structure
src/
├── components/           # Reusable UI components
│   ├── common/          # Buttons, inputs, modals
│   ├── forms/           # Form-specific components
│   ├── compliance/      # Compliance widgets
│   └── offline/         # Offline indicators
├── features/            # Feature modules
│   ├── auth/           # Clerk integration
│   ├── projects/       # Project management
│   ├── inspections/    # SWPPP inspections
│   ├── weather/        # Weather monitoring
│   └── sync/           # Offline sync
├── hooks/              # Custom React hooks
│   ├── useOfflineStatus.ts
│   ├── useWeatherAlerts.ts
│   └── useComplianceRules.ts
└── services/           # API and business logic
    ├── api/            # GraphQL/REST clients
    ├── offline/        # Offline management
    └── sync/           # Sync orchestration
```

### 4.2 Backend Services Architecture

#### Service Decomposition
```yaml
services:
  api_gateway:
    technology: GraphQL (Apollo Server 4) + REST
    responsibilities:
      - Request routing
      - Rate limiting (1000 req/min)
      - Authentication verification
      - Response caching
    
  auth_service:
    provider: Clerk
    extensions:
      - Offline token generation
      - 30-day session extension
      - Device fingerprinting
      - Organization management
    
  forms_service:
    framework: NestJS 10+
    features:
      - Dynamic form builder
      - JSONB schema storage
      - Conditional logic engine
      - Validation framework
      - Version control
    
  compliance_engine:
    framework: NestJS 10+
    capabilities:
      - Multi-jurisdiction rules
      - EPA CGP 2022 compliance
      - OSHA standards
      - State regulations
      - Violation tracking
    
  weather_service:
    framework: NestJS 10+
    integrations:
      - NOAA Weather API (primary)
      - OpenWeatherMap (backup)
      - 15-minute polling interval
      - 0.25" rain threshold monitoring
    
  notification_service:
    framework: NestJS 10+
    channels:
      - Push (FCM/APNS)
      - SMS (Twilio)
      - Email (SendGrid)
      - In-app notifications
    queue: BullMQ
```

#### Inter-Service Communication
```typescript
// Event-driven communication via BullMQ
export class WeatherComplianceOrchestrator {
  constructor(
    private weatherService: WeatherService,
    private complianceEngine: ComplianceEngine,
    private notificationService: NotificationService,
    private queue: Queue
  ) {}
  
  async processWeatherEvent(event: WeatherEvent) {
    // Check threshold (0.25" rain)
    if (event.precipitation >= 0.25) {
      // Create compliance task
      const task = await this.complianceEngine.createInspectionTask({
        type: 'SWPPP_POST_RAIN',
        deadline: addHours(new Date(), 24),
        projectId: event.projectId,
        triggerAmount: event.precipitation
      });
      
      // Queue notifications
      await this.queue.add('send-notification', {
        type: 'URGENT_COMPLIANCE',
        recipients: task.assignedTo,
        message: `Rain event ${event.precipitation}" requires inspection within 24 hours`,
        channels: ['push', 'sms']
      });
      
      // Log for audit
      await this.auditLog.record({
        event: 'WEATHER_COMPLIANCE_TRIGGERED',
        data: { event, task }
      });
    }
  }
}
```

### 4.3 Data Processing Pipeline

#### Photo Processing Architecture
```yaml
photo_pipeline:
  stages:
    - capture:
        device: Mobile camera
        format: JPEG/PNG
        max_size: 10MB
    
    - validation:
        checks:
          - File format
          - Size limits
          - Malware scan
    
    - optimization:
        compression: Progressive JPEG
        target_size: <2MB
        quality: 85%
    
    - metadata:
        extraction:
          - GPS coordinates
          - Timestamp
          - Device info
          - Clerk user ID
    
    - thumbnails:
        sizes: [150, 300, 600, 1200]
        format: WebP where supported
    
    - storage:
        strategy:
          small: PostgreSQL bytea (<100KB)
          medium: PostgreSQL Large Objects (100KB-50MB)
          large: S3/Backblaze B2 (>50MB)
    
    - distribution:
        cdn: Cloudflare
        cache_duration: 1 year for processed
```

---

## 5. Technology Stack

### 5.1 Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Capacitor | 6.0+ | Cross-platform mobile |
| **UI Library** | React | 18.2+ | Component architecture |
| **Component Library** | Mantine | v7 | 120+ mobile-optimized components |
| **State Management** | TanStack Query | v5 | Server state with offline support |
| **Local State** | Valtio | Latest | Proxy-based reactivity |
| **Forms** | React Hook Form | Latest | Performance-optimized forms |
| **Validation** | Zod | Latest | Schema validation |
| **Styling** | CSS Modules + Tailwind | Latest | Scoped styles + utilities |
| **Build Tool** | Vite | 5.0+ | Fast builds and HMR |

### 5.2 Backend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Framework** | NestJS | 10+ | Enterprise Node.js framework |
| **Language** | TypeScript | 5.3+ | Type safety |
| **API** | GraphQL + REST | Apollo 4 | Flexible data fetching |
| **Authentication** | Clerk | Latest | Managed auth service |
| **Database** | PostgreSQL + TimescaleDB | 15+ | Primary data store with time-series |
| **Cache** | Redis | 7+ | Session and API caching |
| **Queue** | BullMQ | Latest | Job processing |
| **File Storage** | S3/Backblaze B2 | - | Object storage |

### 5.3 Infrastructure Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Container** | Docker | Application packaging |
| **Orchestration** | Kubernetes | Container management |
| **CI/CD** | GitHub Actions | Automated deployment |
| **CDN** | Cloudflare | Edge caching |
| **Monitoring** | Prometheus + Grafana | Metrics and visualization |
| **Logging** | ELK Stack | Centralized logging |
| **APM** | OpenTelemetry | Distributed tracing |
| **Error Tracking** | Sentry | Real-time error monitoring |

### 5.4 Development Tools

```yaml
development_environment:
  ide: Visual Studio Code
  extensions:
    - ESLint
    - Prettier
    - TypeScript
    - GraphQL
    - Docker
  
  package_manager: pnpm
  
  version_control:
    platform: GitHub
    strategy: GitFlow
    
  code_quality:
    linting: ESLint with Airbnb config
    formatting: Prettier
    type_checking: TypeScript strict mode
    git_hooks: Husky + lint-staged
  
  testing:
    unit: Jest
    integration: Supertest
    e2e: Playwright
    mobile: Detox
    
  documentation:
    api: OpenAPI 3.0 / GraphQL Schema
    components: Storybook
    architecture: C4 Model + Mermaid
```

---

## 6. Data Architecture

### 6.1 Data Model Design

#### Core Schema
```sql
-- Multi-tenant organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(20) DEFAULT 'standard',
    compliance_level VARCHAR(20) DEFAULT 'basic',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects with location and weather tracking
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    number VARCHAR(100),
    location JSONB, -- GPS coordinates stored as {lat, lng} in JSONB
    weather_station_id VARCHAR(100),
    compliance_config JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_org_projects ON projects(organization_id),
    INDEX idx_location ON projects USING GIST(location)
);

-- Dynamic forms with JSONB
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- SWPPP, SAFETY, DAILY, CUSTOM
    version INTEGER DEFAULT 1,
    schema_version VARCHAR(20),
    template_data JSONB NOT NULL, -- Form structure
    validation_rules JSONB,
    compliance_mapping JSONB,
    created_by VARCHAR(255), -- Clerk user ID
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_template ON forms USING gin(template_data jsonb_path_ops)
);

-- Form submissions with hybrid storage
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id),
    project_id UUID REFERENCES projects(id),
    submitted_by VARCHAR(255), -- Clerk user ID
    
    -- Extracted fields for performance
    submitted_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    compliance_status VARCHAR(50),
    weather_triggered BOOLEAN DEFAULT FALSE,
    
    -- Flexible data storage
    submission_data JSONB NOT NULL,
    attachments JSONB[], -- Photo references
    signatures JSONB[], -- Digital signatures
    
    -- Audit fields
    sync_status VARCHAR(20) DEFAULT 'pending',
    device_id VARCHAR(100),
    offline_created BOOLEAN DEFAULT FALSE,
    
    INDEX idx_project_submissions ON form_submissions(project_id, submitted_at DESC),
    INDEX idx_compliance ON form_submissions(compliance_status) WHERE compliance_status IS NOT NULL,
    INDEX idx_submission_data ON form_submissions USING gin(submission_data)
) PARTITION BY RANGE (submitted_at);

-- Weather events for compliance tracking
CREATE TABLE weather_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    event_type VARCHAR(50), -- RAIN, WIND, TEMPERATURE
    value DECIMAL(10,2),
    unit VARCHAR(20),
    threshold_exceeded BOOLEAN,
    compliance_triggered BOOLEAN,
    recorded_at TIMESTAMP DEFAULT NOW(),
    source VARCHAR(50), -- NOAA, OpenWeatherMap
    
    INDEX idx_project_weather ON weather_events(project_id, recorded_at DESC),
    INDEX idx_compliance_events ON weather_events(compliance_triggered) WHERE compliance_triggered = true
);
```

### 6.2 Data Storage Strategy

#### Hybrid Storage Architecture
```yaml
storage_tiers:
  hot_data:
    description: Active project data
    storage: PostgreSQL primary
    retention: 90 days
    access_pattern: Read/Write heavy
    
  warm_data:
    description: Recent historical data
    storage: PostgreSQL with compression
    retention: 1 year
    access_pattern: Read occasional
    
  cold_data:
    description: Compliance archives
    storage: S3 Glacier
    retention: 7 years
    access_pattern: Rare access
    
  photo_storage:
    small_files:
      size: <100KB
      storage: PostgreSQL bytea
      use_case: Thumbnails, signatures
      
    medium_files:
      size: 100KB-50MB
      storage: PostgreSQL Large Objects
      use_case: Documents, standard photos
      
    large_files:
      size: >50MB
      storage: S3/Backblaze B2
      use_case: High-res photos, videos
      lifecycle:
        0-30_days: Standard tier ($23/TB)
        30-365_days: Infrequent access ($12.5/TB)
        1_year_plus: Glacier ($4/TB)
```

### 6.3 Offline Data Architecture

#### Local Storage Schema
```typescript
// SQLite schema for offline storage
interface OfflineSchema {
  tables: {
    forms: {
      id: string;
      formId: string;
      data: string; // JSON stringified
      status: 'draft' | 'pending_sync' | 'synced';
      createdAt: number;
      modifiedAt: number;
    };
    
    photos: {
      id: string;
      formId: string;
      uri: string; // Local file URI
      metadata: string; // JSON metadata
      syncStatus: 'pending' | 'uploading' | 'completed';
      size: number;
    };
    
    syncQueue: {
      id: string;
      entityType: string;
      entityId: string;
      operation: 'create' | 'update' | 'delete';
      data: string;
      priority: number;
      attempts: number;
      lastAttempt: number;
    };
  };
  
  capacity: {
    maxStorage: '2GB',
    maxDays: 30,
    pruningStrategy: 'LRU'
  };
}
```

### 6.4 Data Synchronization

#### Sync Strategy
```typescript
class SyncOrchestrator {
  private syncPriorities = {
    CRITICAL_COMPLIANCE: 1,    // SWPPP, safety incidents
    COMPLETED_FORMS: 2,         // Finished inspections
    PHOTOS: 3,                  // Photo uploads
    DRAFT_FORMS: 4,            // In-progress work
    ANALYTICS: 5               // Usage metrics
  };
  
  async performSync(options: SyncOptions) {
    // 1. Check connectivity
    if (!await this.isOnline()) return;
    
    // 2. Get pending items by priority
    const queue = await this.getSyncQueue();
    
    // 3. Process in batches
    for (const batch of this.batchByPriority(queue)) {
      try {
        // 4. Sync with conflict resolution
        const results = await this.syncBatch(batch);
        
        // 5. Handle conflicts
        for (const conflict of results.conflicts) {
          await this.resolveConflict(conflict);
        }
        
        // 6. Update local state
        await this.updateLocalRecords(results.succeeded);
        
        // 7. Retry failures
        await this.queueRetries(results.failed);
      } catch (error) {
        await this.handleSyncError(error);
      }
    }
  }
  
  private resolveConflict(conflict: SyncConflict) {
    switch (conflict.type) {
      case 'FORM_EDIT':
        return this.mergeFormChanges(conflict);
      case 'STATUS_CHANGE':
        return this.lastWriteWins(conflict);
      case 'DELETION':
        return this.softDelete(conflict);
      default:
        return this.manualResolution(conflict);
    }
  }
}
```

---

## 7. Integration Architecture

### 7.1 External System Integrations

#### Weather Service Integration
```yaml
weather_integration:
  primary_service:
    provider: NOAA Weather API
    endpoint: https://api.weather.gov
    authentication: None (public)
    rate_limit: Reasonable use
    data_points:
      - Current conditions
      - 7-day forecast  
      - Precipitation (0.25" threshold)
      - Wind speed (30mph threshold)
      - Weather alerts
    polling_interval: 15 minutes
    
  backup_service:
    provider: OpenWeatherMap
    endpoint: https://api.openweathermap.org
    authentication: API key
    rate_limit: 1000 calls/day (free)
    failover_trigger: NOAA unavailable
    
  implementation:
    pattern: Circuit breaker
    timeout: 5 seconds
    retry: 3 attempts
    cache: 15 minutes
```

#### Regulatory API Integration
```typescript
// EPA e-Reporting integration
export class EPAIntegrationService {
  async submitNOI(data: NOISubmission): Promise<SubmissionResult> {
    // Transform to EPA XML schema
    const xml = this.transformToEPASchema(data);
    
    // Validate against XSD
    await this.validateXML(xml, EPA_SCHEMA.NOI);
    
    // Submit via CDX
    const response = await this.cdxClient.submit({
      documentType: 'NOI',
      programId: 'NPDES_CONSTRUCTION',
      payload: xml,
      signature: await this.signDocument(xml)
    });
    
    // Store submission receipt
    await this.auditLog.record({
      type: 'EPA_SUBMISSION',
      documentId: response.documentId,
      timestamp: response.timestamp,
      status: response.status
    });
    
    return response;
  }
}
```

#### Business System Integrations
```yaml
erp_integrations:
  quickbooks:
    api_version: v3
    authentication: OAuth 2.0
    sync_frequency: Hourly
    data_flow:
      - Projects (bi-directional)
      - Time entries (BrAve → QB)
      - Expenses (BrAve → QB)
      - Invoices (QB → BrAve)
    
  procore:
    api_version: v1.0
    authentication: OAuth 2.0
    sync_frequency: 15 minutes
    data_flow:
      - Projects (read-only)
      - Documents (bi-directional)
      - RFIs (read-only)
      - Submittals (read-only)
    
  sage_300_cre:
    protocol: REST/SOAP hybrid
    authentication: API key
    sync_frequency: Daily
    data_flow:
      - Job costs (BrAve → Sage)
      - Timesheets (BrAve → Sage)
```

### 7.2 Integration Patterns

#### API Gateway Pattern
```typescript
@Injectable()
export class APIGateway {
  constructor(
    private readonly graphqlServer: ApolloServer,
    private readonly restRouter: Express.Router,
    private readonly rateLimiter: RateLimiter,
    private readonly cache: CacheManager
  ) {}
  
  async handleRequest(request: Request): Promise<Response> {
    // 1. Rate limiting
    await this.rateLimiter.check(request);
    
    // 2. Authentication via Clerk
    const session = await this.verifyClerkSession(request);
    
    // 3. Check cache
    const cached = await this.cache.get(request);
    if (cached) return cached;
    
    // 4. Route to appropriate handler
    const response = request.isGraphQL 
      ? await this.graphqlServer.handle(request)
      : await this.restRouter.handle(request);
    
    // 5. Cache response
    await this.cache.set(request, response);
    
    return response;
  }
}
```

#### Event Bus Architecture
```yaml
event_bus:
  implementation: BullMQ + Redis
  
  producers:
    - WeatherService
    - ComplianceEngine
    - FormService
    - NotificationService
    
  events:
    weather.threshold.exceeded:
      payload: {projectId, type, value, threshold}
      subscribers: [ComplianceEngine, NotificationService]
      
    compliance.violation.detected:
      payload: {projectId, rule, severity, deadline}
      subscribers: [NotificationService, ReportingService]
      
    form.submission.completed:
      payload: {formId, projectId, submittedBy}
      subscribers: [ComplianceEngine, SyncService]
      
  delivery:
    guarantee: at-least-once
    retry: exponential backoff
    dlq: after 5 attempts
```

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

#### Clerk Integration Architecture
```typescript
// Clerk authentication with offline extension
export class HybridAuthService {
  constructor(
    private clerkClient: ClerkClient,
    private jwtService: JwtService,
    private deviceTrust: DeviceTrustService
  ) {}
  
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (this.isOnline()) {
      // Online: Use Clerk
      const clerkSession = await this.clerkClient.signIn(credentials);
      
      // Generate offline token for 30-day capability
      const offlineToken = await this.generateOfflineToken({
        userId: clerkSession.userId,
        organizationId: clerkSession.organizationId,
        permissions: clerkSession.permissions,
        expiresIn: '30d'
      });
      
      return {
        session: clerkSession,
        offlineToken,
        deviceId: await this.deviceTrust.register()
      };
    } else {
      // Offline: Validate cached credentials
      return this.validateOfflineCredentials(credentials);
    }
  }
  
  private async generateOfflineToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.sign({
      ...payload,
      iat: Date.now(),
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000),
      offline: true,
      version: 1
    }, {
      algorithm: 'RS256',
      keyid: 'offline-key-1'
    });
  }
}
```

#### Authorization Model
```yaml
rbac_model:
  roles:
    super_admin:
      permissions: ["*"]
      scope: platform
      
    org_admin:
      permissions: 
        - organization.manage
        - users.manage
        - projects.all
      scope: organization
      
    project_manager:
      permissions:
        - projects.manage
        - forms.all
        - reports.generate
      scope: project
      
    foreman:
      permissions:
        - forms.create
        - forms.submit
        - photos.upload
      scope: project
      
    inspector:
      permissions:
        - forms.read
        - violations.create
        - reports.generate
      scope: project (read-only)
      
  attribute_based_access:
    - time_based: Business hours only
    - location_based: Geofence validation
    - device_based: Trusted devices only
```

### 8.2 Data Security

#### Encryption Architecture
```yaml
encryption:
  at_rest:
    algorithm: AES-256-GCM
    key_management: AWS KMS / HashiCorp Vault
    scope:
      - Database: Transparent Data Encryption
      - File storage: Server-side encryption
      - Backups: Separate encryption keys
      - Mobile: SQLCipher for SQLite
      
  in_transit:
    protocol: TLS 1.3
    cipher_suites:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
    certificate: Let's Encrypt with auto-renewal
    
  field_level:
    sensitive_fields:
      - SSN: AES-256-GCM
      - Bank accounts: Tokenization
      - Medical info: AES-256-GCM
    key_rotation: Quarterly
```

#### Zero-Trust Architecture
```typescript
export class ZeroTrustGateway {
  async authorizeRequest(request: Request): Promise<AuthorizationResult> {
    const trustScore = await this.calculateTrustScore({
      user: await this.verifyUserIdentity(request),
      device: await this.verifyDeviceCompliance(request),
      network: await this.assessNetworkRisk(request),
      behavior: await this.analyzeUserBehavior(request),
      context: await this.evaluateRequestContext(request)
    });
    
    const requiredScore = this.getResourceSensitivity(request.resource);
    
    if (trustScore < requiredScore) {
      await this.triggerAdditionalVerification(request);
    }
    
    return {
      authorized: trustScore >= requiredScore,
      score: trustScore,
      factors: this.getTrustFactors()
    };
  }
}
```

### 8.3 Security Controls

#### Application Security
```yaml
security_controls:
  input_validation:
    - XSS prevention: DOMPurify
    - SQL injection: Parameterized queries
    - Command injection: Input sanitization
    - Path traversal: Path validation
    
  api_security:
    - Rate limiting: 1000 req/min/user
    - API versioning: URI-based
    - Request signing: HMAC-SHA256
    - CORS: Whitelist origins
    
  session_management:
    - Access token: 15 minutes
    - Refresh token: 7 days
    - Offline token: 30 days
    - Idle timeout: 15 minutes
    - Concurrent sessions: 5 max
    
  security_headers:
    - Content-Security-Policy
    - X-Frame-Options: DENY
    - X-Content-Type-Options: nosniff
    - Strict-Transport-Security
    - X-XSS-Protection: 1; mode=block
```

---

## 9. Infrastructure Architecture

### 9.1 Cloud-Agnostic Deployment

#### Container Architecture
```yaml
containerization:
  base_images:
    node: node:20-alpine
    nginx: nginx:alpine
    postgres: postgres:16-alpine
    redis: redis:7-alpine
    
  services:
    api:
      replicas: 3-10 (auto-scaling)
      resources:
        requests: {cpu: 500m, memory: 512Mi}
        limits: {cpu: 1000m, memory: 1Gi}
      health_checks:
        liveness: /health
        readiness: /ready
        
    worker:
      replicas: 2-5
      resources:
        requests: {cpu: 250m, memory: 256Mi}
        limits: {cpu: 500m, memory: 512Mi}
      
    database:
      replicas: 1 primary + 2 read replicas
      resources:
        requests: {cpu: 2000m, memory: 4Gi}
        limits: {cpu: 4000m, memory: 8Gi}
      storage: 100Gi SSD (expandable)
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: braveforms-api
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: braveforms-api
  template:
    metadata:
      labels:
        app: braveforms-api
        version: v1.0.0
    spec:
      containers:
      - name: api
        image: braveforms/api:v1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: CLERK_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: clerk-credentials
              key: secret_key
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 9.2 Network Architecture

#### Multi-Region Setup
```yaml
regions:
  primary:
    location: us-east-1
    components:
      - API servers (3-10 instances)
      - PostgreSQL primary
      - Redis cluster
      - S3 storage
    
  secondary:
    location: us-west-2
    components:
      - API servers (2-5 instances)
      - PostgreSQL read replica
      - Redis replica
      - S3 cross-region replication
    
  disaster_recovery:
    location: eu-west-1
    components:
      - Cold standby
      - Database backups
      - Configuration sync
```

#### CDN and Edge Architecture
```yaml
cdn_configuration:
  provider: Cloudflare
  
  cache_rules:
    static_assets:
      path: /static/*
      ttl: 31536000 # 1 year
      
    api_responses:
      path: /api/v1/reference/*
      ttl: 3600 # 1 hour
      
    images:
      path: /photos/*
      ttl: 86400 # 1 day
      transform: auto-webp
      
  security:
    waf: enabled
    ddos_protection: enabled
    rate_limiting: 10000 req/min
    bot_management: challenge suspicious
```

### 9.3 Storage Architecture

#### Multi-Tier Storage
```yaml
storage_tiers:
  database:
    type: Managed PostgreSQL
    size: 100GB-10TB
    iops: 3000-10000
    backup: Continuous
    
  cache:
    type: Redis Cluster
    size: 8GB-32GB
    eviction: allkeys-lru
    persistence: AOF
    
  object_storage:
    photos:
      hot: S3 Standard (0-30 days)
      warm: S3 IA (30-365 days)
      cold: S3 Glacier (365+ days)
    
    documents:
      primary: S3 Standard
      backup: Cross-region replication
      
  mobile_offline:
    type: SQLite
    size: 2GB max
    encryption: SQLCipher
    sync: Incremental
```

---

## 10. Deployment Architecture

### 10.1 CI/CD Pipeline

#### Pipeline Architecture
```yaml
pipeline:
  source_control:
    platform: GitHub
    branching: GitFlow
    protection:
      - main: Requires 2 approvals
      - develop: Requires 1 approval
      
  stages:
    build:
      - Lint (ESLint, Prettier)
      - Type check (TypeScript)
      - Unit tests (Jest, 80% coverage)
      - Security scan (Snyk)
      - Docker build
      
    test:
      - Integration tests (Supertest)
      - E2E tests (Playwright)
      - Performance tests (K6)
      - Mobile tests (Detox)
      
    staging:
      - Deploy to staging
      - Smoke tests
      - Security audit
      - Performance validation
      
    production:
      - Approval gate
      - Blue-green deployment
      - Health checks
      - Rollback ready
```

#### Deployment Strategy
```typescript
// Blue-Green Deployment
export class DeploymentOrchestrator {
  async deploy(version: string): Promise<DeploymentResult> {
    // 1. Deploy to green environment
    const green = await this.deployToGreen(version);
    
    // 2. Run health checks
    await this.healthCheck(green);
    
    // 3. Run smoke tests
    await this.smokeTest(green);
    
    // 4. Switch traffic (canary)
    await this.switchTraffic({
      green: 10,  // 10% initial
      blue: 90
    });
    
    // 5. Monitor metrics
    const metrics = await this.monitorMetrics(15 * 60 * 1000); // 15 min
    
    // 6. Decision point
    if (metrics.errorRate < 0.01) {
      // Full switch
      await this.switchTraffic({ green: 100, blue: 0 });
      return { status: 'success', version };
    } else {
      // Rollback
      await this.rollback();
      return { status: 'rollback', reason: metrics };
    }
  }
}
```

### 10.2 Environment Configuration

#### Environment Matrix
| Environment | Purpose | Data | Refresh |
|-------------|---------|------|---------|
| **Development** | Local development | Synthetic | On-demand |
| **Testing** | Automated tests | Test fixtures | Per test run |
| **Staging** | Pre-production validation | Production subset | Weekly |
| **Production** | Live system | Real data | N/A |
| **DR** | Disaster recovery | Replicated | Real-time |

### 10.3 Release Management

#### Versioning Strategy
```yaml
versioning:
  scheme: Semantic Versioning
  format: MAJOR.MINOR.PATCH
  
  examples:
    - 1.0.0: Initial release
    - 1.1.0: New feature (backward compatible)
    - 1.1.1: Bug fix
    - 2.0.0: Breaking change
    
  api_versioning:
    strategy: URI-based
    format: /api/v{major}
    deprecation: 6 months notice
    sunset: 12 months
```

---

## 11. Monitoring and Observability

### 11.1 Metrics Architecture

#### Application Metrics
```yaml
metrics:
  business:
    - forms_completed_per_day
    - average_completion_time
    - compliance_violations_prevented
    - sync_success_rate
    - offline_usage_hours
    
  performance:
    - api_response_time_p50_p95_p99
    - database_query_duration
    - mobile_app_launch_time
    - photo_upload_duration
    - offline_sync_time
    
  infrastructure:
    - cpu_utilization
    - memory_usage
    - disk_io
    - network_throughput
    - container_restarts
    
  collection:
    tool: Prometheus
    interval: 30 seconds
    retention: 90 days
    
  visualization:
    tool: Grafana
    dashboards:
      - Executive Overview
      - Technical Operations
      - Compliance Metrics
      - User Experience
```

### 11.2 Logging Architecture

```yaml
logging:
  structure:
    format: JSON
    fields:
      - timestamp
      - level
      - service
      - traceId
      - userId
      - organizationId
      - message
      - metadata
      
  levels:
    ERROR: System errors, exceptions
    WARN: Potential issues
    INFO: Normal operations
    DEBUG: Detailed diagnostics
    
  collection:
    agent: Fluent Bit
    aggregation: Elasticsearch
    visualization: Kibana
    
  retention:
    hot: 7 days (SSD)
    warm: 30 days (HDD)
    cold: 1 year (S3)
    
  audit_logs:
    retention: 7 years
    immutable: true
    encryption: required
```

### 11.3 Distributed Tracing

```typescript
// OpenTelemetry implementation
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export class TracedService {
  private tracer = trace.getTracer('braveforms', '1.0.0');
  
  async processFormSubmission(formData: FormData): Promise<Result> {
    const span = this.tracer.startSpan('form.submission.process');
    
    try {
      // Add span attributes
      span.setAttributes({
        'form.id': formData.id,
        'form.type': formData.type,
        'user.id': formData.userId,
        'organization.id': formData.organizationId
      });
      
      // Process with child spans
      const validation = await this.validateWithSpan(formData);
      const compliance = await this.checkComplianceWithSpan(formData);
      const storage = await this.storeWithSpan(formData);
      
      span.setStatus({ code: SpanStatusCode.OK });
      return { success: true };
      
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
      });
      span.recordException(error);
      throw error;
      
    } finally {
      span.end();
    }
  }
}
```

---

## 12. Performance Architecture

### 12.1 Performance Requirements

| Metric | Target | Critical |
|--------|--------|----------|
| **API Response Time** | <200ms P95 | <500ms |
| **Mobile App Launch** | <2s cold start | <4s |
| **Page Load Time** | <2s initial | <3s |
| **Database Query** | <50ms P95 | <100ms |
| **Photo Upload (5MB)** | <5s on 4G | <10s |
| **Offline Sync (100 records)** | <30s | <60s |
| **Concurrent Users** | 10,000+ | 5,000 |

### 12.2 Performance Optimization

#### Caching Strategy
```yaml
caching_layers:
  cdn:
    provider: Cloudflare
    cache_duration:
      static: 1 year
      images: 30 days
      api: 1 hour
      
  application:
    tool: Redis
    strategies:
      - Session data: 15 minutes
      - API responses: 5 minutes
      - User permissions: 1 hour
      - Reference data: 24 hours
      
  database:
    query_cache: enabled
    result_cache: 60 seconds
    prepared_statements: pooled
    
  mobile:
    http_cache: 100MB
    image_cache: 500MB
    data_cache: SQLite
```

#### Database Optimization
```sql
-- Strategic indexes for performance
CREATE INDEX CONCURRENTLY idx_submissions_project_date 
  ON form_submissions(project_id, submitted_at DESC);

CREATE INDEX CONCURRENTLY idx_submissions_compliance 
  ON form_submissions(compliance_status) 
  WHERE compliance_status IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_submissions_gin 
  ON form_submissions USING gin(submission_data jsonb_path_ops);

-- Partitioning for scale
CREATE TABLE form_submissions_2025_q1 
  PARTITION OF form_submissions
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Materialized view for dashboards
CREATE MATERIALIZED VIEW compliance_dashboard AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  COUNT(CASE WHEN fs.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN fs.compliance_status = 'violation' THEN 1 END) as violations,
  MAX(fs.submitted_at) as last_submission
FROM projects p
LEFT JOIN form_submissions fs ON p.id = fs.project_id
GROUP BY p.id, p.name
WITH DATA;

CREATE UNIQUE INDEX ON compliance_dashboard(project_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY compliance_dashboard;
```

### 12.3 Scalability Patterns

#### Horizontal Scaling
```yaml
auto_scaling:
  metrics:
    - CPU > 70% for 5 minutes
    - Memory > 80% for 5 minutes
    - Request queue > 100
    - Response time P95 > 500ms
    
  api_servers:
    min: 3
    max: 50
    scale_up_rate: 5/minute
    scale_down_rate: 2/minute
    
  workers:
    min: 2
    max: 20
    scale_up_rate: 2/minute
    scale_down_rate: 1/minute
```

---

## 13. Disaster Recovery Architecture

### 13.1 Recovery Objectives

| Component | RTO | RPO | Priority |
|-----------|-----|-----|----------|
| **Authentication** | 15 min | 0 min | Critical |
| **Core API** | 30 min | 15 min | Critical |
| **Database** | 1 hour | 15 min | Critical |
| **File Storage** | 2 hours | 1 hour | High |
| **Queue System** | 2 hours | 1 hour | Medium |
| **Analytics** | 8 hours | 24 hours | Low |

### 13.2 Backup Strategy

```yaml
backup_configuration:
  database:
    strategy:
      full: Daily at 2 AM
      incremental: Every 15 minutes
      transaction_log: Continuous
    retention:
      daily: 7 days
      weekly: 4 weeks
      monthly: 12 months
    storage:
      primary: Same region
      secondary: Cross-region
      archive: S3 Glacier
      
  files:
    photos:
      frequency: Real-time
      method: S3 cross-region replication
    documents:
      frequency: Hourly
      method: Incremental sync
      
  configuration:
    method: Git repository
    frequency: On change
    storage: Multiple remotes
```

### 13.3 Disaster Scenarios

```yaml
disaster_scenarios:
  regional_outage:
    detection: <1 minute
    response: Automatic DNS failover
    recovery: Secondary region activation
    data_loss: <15 minutes
    
  database_corruption:
    detection: <5 minutes
    response: Restore from backup
    recovery: <1 hour
    data_loss: <15 minutes
    
  security_breach:
    detection: Real-time
    response: Immediate isolation
    recovery: <4 hours
    procedure: Incident response plan
    
  data_center_loss:
    detection: <30 seconds
    response: Multi-region failover
    recovery: <30 minutes
    data_loss: 0 (synchronous replication)
```

---

## 14. Architecture Decision Records

### ADR-001: Capacitor over React Native
**Date**: July 2025  
**Status**: Accepted  
**Context**: Need cross-platform mobile framework  
**Decision**: Use Capacitor 6 with React  
**Rationale**:
- 90%+ code reuse vs 70% with React Native
- Superior form handling for web
- Better offline support with service workers
- 3-4 month MVP timeline vs 6-8 months
- Web developers can contribute immediately

### ADR-002: Clerk for Authentication
**Date**: July 2025  
**Status**: Accepted  
**Context**: Build vs buy authentication  
**Decision**: Use Clerk managed service  
**Rationale**:
- Saves 2-3 months development time
- SOC 2 compliance included
- Built-in SSO and organization management
- Cost-effective at scale ($0-299/month)
- Reduces security risk

### ADR-003: PostgreSQL with JSONB
**Date**: July 2025  
**Status**: Accepted  
**Context**: Dynamic form schema storage  
**Decision**: PostgreSQL 15 with TimescaleDB + JSONB  
**Rationale**:
- Flexible schemas without NoSQL downsides
- ACID compliance for critical data
- Proven scale to billions of records
- Rich querying with GIN indexes
- Single database simplifies operations

### ADR-004: BullMQ over Kafka
**Date**: August 2025  
**Status**: Accepted  
**Context**: Message queue selection  
**Decision**: BullMQ with Redis  
**Rationale**:
- 15-minute setup vs days for Kafka
- $5-100/month vs $500+ for Kafka
- Sufficient for 100K messages/day
- Built-in dashboard
- Upgrade path to Kafka if needed

### ADR-005: Hybrid Photo Storage
**Date**: August 2025  
**Status**: Accepted  
**Context**: Photo storage optimization  
**Decision**: PostgreSQL for small, S3 for large  
**Rationale**:
- 40-70% cost savings
- Simplified backup for small files
- CDN integration for large files
- Progressive loading support
- Proven pattern in production

---

## 15. Migration and Evolution Strategy

### 15.1 Technology Evolution Path

```yaml
evolution_roadmap:
  year_1:
    focus: Core platform stability
    technologies:
      - Current stack optimization
      - Performance tuning
      - Security hardening
      
  year_2:
    focus: Scale and intelligence
    technologies:
      - Machine learning for predictions
      - GraphQL federation
      - Event streaming (consider Kafka)
      - Kubernetes operators
      
  year_3:
    focus: Platform ecosystem
    technologies:
      - API marketplace
      - Plugin architecture
      - Blockchain for audit trails
      - Edge computing for offline
      
  year_5:
    focus: Next generation
    technologies:
      - AI-driven compliance
      - Quantum-resistant encryption
      - Decentralized architecture
      - Metaverse integration
```

### 15.2 Migration Strategies

#### Database Migration
```typescript
// Zero-downtime migration strategy
export class DatabaseMigrator {
  async performMigration(migration: Migration): Promise<void> {
    // 1. Create new schema
    await this.createNewSchema(migration.targetSchema);
    
    // 2. Start dual writes
    await this.enableDualWrites({
      old: migration.sourceSchema,
      new: migration.targetSchema
    });
    
    // 3. Backfill historical data
    await this.backfillData({
      batchSize: 1000,
      parallel: 5,
      validation: true
    });
    
    // 4. Verify data consistency
    await this.verifyConsistency();
    
    // 5. Switch reads to new schema
    await this.switchReads(migration.targetSchema);
    
    // 6. Stop writes to old schema
    await this.disableOldWrites(migration.sourceSchema);
    
    // 7. Archive old schema
    await this.archiveSchema(migration.sourceSchema);
  }
}
```

### 15.3 Deprecation Strategy

```yaml
deprecation_process:
  announcement:
    timeline: 6 months before
    channels:
      - API documentation
      - Email to affected users
      - In-app notifications
      
  migration_support:
    documentation: Migration guides
    tools: Automated migration scripts
    support: Dedicated support channel
    
  sunset:
    grace_period: 3 months
    fallback: Temporary bridges
    final: Complete removal
```

---

## Appendices

### Appendix A: Technology Versions

| Component | Version | EOL Date |
|-----------|---------|----------|
| Node.js | 20 LTS | April 2026 |
| TypeScript | 5.3+ | Current |
| React | 18.2+ | Current |
| Capacitor | 6.0+ | Current |
| NestJS | 10+ | Current |
| PostgreSQL | 15 | November 2027 |
| Redis | 7+ | Current |
| Kubernetes | 1.28+ | August 2024 |

### Appendix B: API Endpoints

```yaml
api_structure:
  graphql:
    endpoint: /graphql
    playground: /graphql (dev only)
    
  rest:
    base: /api/v1
    endpoints:
      - GET /projects
      - POST /forms
      - GET /inspections
      - POST /photos/upload
      - GET /weather/current
      - POST /sync
      
  webhooks:
    - /webhooks/clerk
    - /webhooks/weather
    - /webhooks/compliance
```

### Appendix C: Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/braveforms
DATABASE_POOL_SIZE=20

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=xxx

# Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=braveforms-uploads
AWS_REGION=us-east-1

# Weather APIs
NOAA_API_URL=https://api.weather.gov
OPENWEATHER_API_KEY=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
PROMETHEUS_PORT=9090

# Feature Flags
ENABLE_OFFLINE_MODE=true
ENABLE_WEATHER_ALERTS=true
ENABLE_QR_ACCESS=true
```

### Appendix D: Security Checklist

- [ ] TLS 1.3 enforced
- [ ] OWASP Top 10 addressed
- [ ] SOC 2 controls implemented
- [ ] Encryption at rest configured
- [ ] Key rotation scheduled
- [ ] Audit logging enabled
- [ ] Penetration testing completed
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] DDoS protection enabled

---

## Document Control

**Version:** 1.0  
**Status:** FINAL - Board Approved  
**Created:** August 2025  
**Last Updated:** August 2025  
**Next Review:** November 2025  
**Owner:** Engineering Team  

### Approval Matrix

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CTO | | Aug 2025 | Approved |
| VP Engineering | | Aug 2025 | Approved |
| Lead Architect | | Aug 2025 | Approved |
| Security Officer | | Aug 2025 | Approved |
| Product Manager | | Aug 2025 | Approved |

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | July 2025 | Architecture Team | Initial draft |
| 0.5 | July 2025 | All Teams | Incorporated feedback |
| 0.9 | August 2025 | Tech Lead | Final review |
| 1.0 | August 2025 | All Stakeholders | Board approved |

---

*This System Architecture Document serves as the authoritative technical reference for the BrAve Forms Platform v1.0. It has been validated against all product requirements, verified for technical accuracy, and approved for implementation. Any architectural changes require formal review and approval through the Architecture Review Board.*

**END OF DOCUMENT**