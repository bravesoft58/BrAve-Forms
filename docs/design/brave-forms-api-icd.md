# API Specifications & Interface Control Document (ICD)
## BrAve Forms Platform v1.0

**Document Version:** 1.0  
**Date:** August 2025  
**Classification:** Technical Specification - System Integration  
**Status:** Final - Development Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [API Architecture Overview](#2-api-architecture-overview)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [REST API Specifications](#4-rest-api-specifications)
5. [GraphQL API Specifications](#5-graphql-api-specifications)
6. [WebSocket Interfaces](#6-websocket-interfaces)
7. [Webhook Specifications](#7-webhook-specifications)
8. [External Integration Interfaces](#8-external-integration-interfaces)
9. [Mobile Offline Sync API](#9-mobile-offline-sync-api)
10. [Error Handling & Status Codes](#10-error-handling--status-codes)
11. [Rate Limiting & Throttling](#11-rate-limiting--throttling)
12. [API Versioning Strategy](#12-api-versioning-strategy)
13. [Data Formats & Standards](#13-data-formats--standards)
14. [Security Requirements](#14-security-requirements)
15. [Testing & Validation](#15-testing--validation)

---

## 1. Executive Summary

### 1.1 Purpose

This Interface Control Document defines all API specifications, data exchange formats, and integration protocols for the BrAve Forms Platform. It serves as the authoritative reference for system-to-system communication, ensuring compatibility between mobile applications, web clients, backend services, and external integrations.

### 1.2 Scope

The document covers:
- RESTful API endpoints for CRUD operations
- GraphQL schema for flexible data queries
- WebSocket protocols for real-time updates
- Webhook specifications for event notifications
- External integration interfaces (Weather APIs, EPA, ERP systems)
- Mobile offline synchronization protocols
- Authentication flows via Clerk

### 1.3 Key Design Principles

- **Offline-First**: All APIs support disconnected operation with sync capabilities
- **Multi-Tenant**: Strict data isolation by organization
- **Version Stability**: Backward compatibility for 12 months minimum
- **Performance**: Sub-200ms response time target
- **Security**: Zero-trust model with field-level encryption

---

## 2. API Architecture Overview

### 2.1 System Interfaces

```yaml
api_gateway:
  base_url: https://api.braveforms.com
  environments:
    production: https://api.braveforms.com
    staging: https://api-staging.braveforms.com
    development: http://localhost:4000
    
  protocols:
    primary: HTTPS (TLS 1.3)
    graphql: /graphql
    rest: /api/v1
    websocket: wss://ws.braveforms.com
    
  authentication:
    provider: Clerk
    methods:
      - Bearer JWT tokens
      - API keys (external systems)
      - Offline tokens (30-day validity)
```

### 2.2 API Gateway Architecture

```typescript
interface APIGatewayConfig {
  endpoints: {
    graphql: {
      path: '/graphql',
      methods: ['POST'],
      rateLimit: 1000, // requests per minute
      authentication: 'required'
    },
    rest: {
      basePath: '/api/v1',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      rateLimit: 1000,
      authentication: 'required'
    },
    webhooks: {
      basePath: '/webhooks',
      methods: ['POST'],
      authentication: 'signature',
      ipWhitelist: true
    },
    health: {
      path: '/health',
      methods: ['GET'],
      authentication: 'none',
      rateLimit: 10000
    }
  }
}
```

### 2.3 Service Communication Matrix

| Source Service | Target Service | Protocol | Authentication | Sync/Async |
|---------------|---------------|----------|---------------|------------|
| Mobile App | API Gateway | HTTPS/GraphQL | JWT | Sync |
| Web App | API Gateway | HTTPS/GraphQL | JWT | Sync |
| API Gateway | Clerk | HTTPS | API Key | Sync |
| Forms Service | Compliance Engine | gRPC | mTLS | Async |
| Weather Service | NOAA API | HTTPS | None | Sync |
| Notification Service | Twilio/SendGrid | HTTPS | API Key | Async |
| Sync Service | Mobile App | HTTPS | JWT | Batch |

---

## 3. Authentication & Authorization

### 3.1 Authentication Flow

```typescript
interface AuthenticationFlow {
  // Standard online authentication via Clerk
  online: {
    endpoint: 'POST /auth/login',
    request: {
      email: string,
      password: string,
      organizationCode?: string
    },
    response: {
      accessToken: string,      // 15 minute expiry
      refreshToken: string,     // 7 day expiry
      offlineToken?: string,    // 30 day expiry
      user: {
        id: string,
        email: string,
        role: string,
        organizationId: string,
        permissions: string[]
      }
    }
  },
  
  // Offline authentication for disconnected operation
  offline: {
    endpoint: 'POST /auth/offline',
    request: {
      offlineToken: string,
      deviceId: string,
      deviceFingerprint: string
    },
    response: {
      valid: boolean,
      permissions: string[],
      expiresAt: string
    }
  },
  
  // Token refresh
  refresh: {
    endpoint: 'POST /auth/refresh',
    request: {
      refreshToken: string
    },
    response: {
      accessToken: string,
      refreshToken: string
    }
  }
}
```

### 3.2 JWT Token Structure

```typescript
interface ClerkJWTPayload {
  // Standard JWT claims
  iss: string,           // Issuer (Clerk)
  sub: string,           // Subject (user ID)
  aud: string[],         // Audience
  exp: number,           // Expiration timestamp
  iat: number,           // Issued at timestamp
  nbf: number,           // Not before timestamp
  
  // Clerk-specific user claims
  azp: string,           // Authorized party
  email: string,         // User email
  email_verified: boolean,
  
  // Organization context (critical for multi-tenancy)
  org_id: string,        // Organization ID (o.id claim)
  org_role: string,      // Organization role (o.rol claim)
  org_slug: string,      // Organization slug (o.slg claim)
  
  // Additional metadata
  permissions: string[], // User permissions
  metadata: {           
    offline_extended?: boolean,
    device_trusted?: boolean
  }
}
```

### 3.3 Authorization Headers

```http
# Standard API Request with Clerk JWT
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
# JWT includes org claims: o.id, o.rol, o.slg

# API Key (External Systems)
X-API-Key: bf_live_sk_a1b2c3d4e5f6g7h8i9j0

# Organization Context (extracted from JWT)
X-Organization-ID: org_2lkjMLKJLKJlkj

# Offline Mode
X-Offline-Token: offline_eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
X-Device-ID: device_abc123def456
```

### 3.4 Permission Scopes

```yaml
scopes:
  # Organization management
  organization.read: View organization settings
  organization.write: Modify organization settings
  organization.delete: Delete organization
  
  # User management
  users.read: View users
  users.write: Create/modify users
  users.delete: Remove users
  
  # Project operations
  projects.read: View projects
  projects.write: Create/modify projects
  projects.delete: Delete projects
  
  # Form operations
  forms.read: View forms
  forms.write: Create/submit forms
  forms.approve: Approve form submissions
  
  # Compliance operations
  compliance.read: View compliance status
  compliance.write: Update compliance records
  compliance.inspect: Create violations
  
  # Photo management
  photos.read: View photos
  photos.write: Upload photos
  photos.delete: Delete photos
```

---

## 4. REST API Specifications

### 4.1 Resource Endpoints

#### Projects Resource

```yaml
/api/v1/projects:
  GET:
    description: List all projects for organization
    parameters:
      - status: active|completed|archived
      - page: integer (default: 1)
      - limit: integer (default: 20, max: 100)
      - sort: name|created_at|updated_at
    response:
      200:
        data: Project[]
        meta: {
          total: integer,
          page: integer,
          limit: integer,
          hasMore: boolean
        }
    
  POST:
    description: Create new project
    request:
      body:
        name: string (required)
        number: string
        location: {
          latitude: number,
          longitude: number
        }
        complianceLevel: basic|standard|enhanced
        startDate: ISO8601
        endDate: ISO8601
    response:
      201:
        data: Project
        
/api/v1/projects/{projectId}:
  GET:
    description: Get project details
    response:
      200:
        data: Project
        
  PUT:
    description: Update project
    request:
      body: ProjectUpdate
    response:
      200:
        data: Project
        
  DELETE:
    description: Archive project
    response:
      204: No Content
```

#### Forms Resource

```yaml
/api/v1/forms:
  GET:
    description: List form templates
    parameters:
      - category: SWPPP|SAFETY|DAILY|CUSTOM
      - projectId: UUID
      - status: draft|active|archived
    response:
      200:
        data: FormTemplate[]
        
  POST:
    description: Create form template
    request:
      body:
        name: string
        category: string
        templateData: {
          fields: Field[],
          sections: Section[],
          logic: ConditionalLogic[]
        }
        validationRules: ValidationRule[]
    response:
      201:
        data: FormTemplate

/api/v1/forms/{formId}/submissions:
  GET:
    description: List form submissions
    parameters:
      - projectId: UUID
      - submittedBy: string
      - status: pending|completed|rejected
      - dateFrom: ISO8601
      - dateTo: ISO8601
    response:
      200:
        data: FormSubmission[]
        
  POST:
    description: Submit form
    request:
      body:
        formId: UUID
        projectId: UUID
        submissionData: object
        attachments: Attachment[]
        signatures: Signature[]
        offlineCreated: boolean
        deviceId: string
    response:
      201:
        data: FormSubmission
```

#### Weather Monitoring

```yaml
/api/v1/weather/current:
  GET:
    description: Get current weather for project
    parameters:
      - projectId: UUID (required)
    response:
      200:
        data: {
          temperature: number,
          precipitation: number,
          windSpeed: number,
          conditions: string,
          alerts: WeatherAlert[],
          source: NOAA|OpenWeatherMap,
          timestamp: ISO8601
        }

/api/v1/weather/triggers:
  GET:
    description: Get active weather triggers
    parameters:
      - projectId: UUID
    response:
      200:
        data: WeatherTrigger[]
        
  POST:
    description: Configure weather trigger
    request:
      body:
        projectId: UUID
        type: RAIN|WIND|TEMPERATURE
        threshold: number
        action: string
        notificationChannels: string[]
    response:
      201:
        data: WeatherTrigger
```

#### Photo Management

```yaml
/api/v1/photos/upload:
  POST:
    description: Upload photo
    headers:
      Content-Type: multipart/form-data
    request:
      body:
        photo: binary (max 10MB)
        projectId: UUID
        formSubmissionId: UUID
        metadata: {
          timestamp: ISO8601,
          location: {
            latitude: number,
            longitude: number
          },
          tags: string[]
        }
    response:
      201:
        data: {
          photoId: UUID,
          url: string,
          thumbnailUrl: string,
          size: integer,
          processingStatus: pending|completed
        }

/api/v1/photos/{photoId}:
  GET:
    description: Get photo details
    response:
      200:
        data: Photo
        
  DELETE:
    description: Delete photo
    response:
      204: No Content
```

### 4.2 Pagination Standards

```typescript
interface PaginationRequest {
  page?: number;      // Default: 1
  limit?: number;     // Default: 20, Max: 100
  cursor?: string;    // For cursor-based pagination
  sort?: string;      // Format: field:asc|desc
}

interface PaginationResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
  links: {
    self: string;
    first: string;
    last: string;
    next?: string;
    previous?: string;
  };
}
```

---

## 5. GraphQL API Specifications

### 5.1 Schema Definition

```graphql
# Root Types
type Query {
  # Organization queries
  organization(id: ID!): Organization
  organizations(filter: OrganizationFilter): [Organization!]!
  
  # Project queries
  project(id: ID!): Project
  projects(
    filter: ProjectFilter
    pagination: PaginationInput
    sort: SortInput
  ): ProjectConnection!
  
  # Form queries
  form(id: ID!): Form
  forms(filter: FormFilter): [Form!]!
  formSubmission(id: ID!): FormSubmission
  formSubmissions(
    filter: FormSubmissionFilter
    pagination: PaginationInput
  ): FormSubmissionConnection!
  
  # Compliance queries
  complianceStatus(projectId: ID!): ComplianceStatus
  violations(projectId: ID!, status: ViolationStatus): [Violation!]!
  
  # Weather queries
  currentWeather(projectId: ID!): Weather
  weatherHistory(
    projectId: ID!
    dateFrom: DateTime!
    dateTo: DateTime!
  ): [Weather!]!
}

type Mutation {
  # Project mutations
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  archiveProject(id: ID!): Boolean!
  
  # Form mutations
  createForm(input: CreateFormInput!): Form!
  submitForm(input: SubmitFormInput!): FormSubmission!
  approveFormSubmission(id: ID!): FormSubmission!
  rejectFormSubmission(id: ID!, reason: String!): FormSubmission!
  
  # Photo mutations
  uploadPhoto(input: UploadPhotoInput!): Photo!
  deletePhoto(id: ID!): Boolean!
  
  # Compliance mutations
  createViolation(input: CreateViolationInput!): Violation!
  resolveViolation(id: ID!, resolution: String!): Violation!
  
  # Sync mutations (for offline support)
  syncBatch(input: SyncBatchInput!): SyncResult!
}

type Subscription {
  # Real-time updates
  projectUpdated(projectId: ID!): Project
  formSubmitted(projectId: ID!): FormSubmission
  weatherAlert(projectId: ID!): WeatherAlert
  complianceViolation(projectId: ID!): Violation
}
```

### 5.2 Core Types

```graphql
type Organization {
  id: ID!
  clerkOrgId: String!
  name: String!
  tier: OrganizationTier!
  complianceLevel: ComplianceLevel!
  settings: JSON
  projects: [Project!]!
  users: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Project {
  id: ID!
  organization: Organization!
  name: String!
  number: String
  location: Location
  weatherStation: WeatherStation
  complianceConfig: ComplianceConfig
  status: ProjectStatus!
  forms: [Form!]!
  submissions: [FormSubmission!]!
  photos: [Photo!]!
  team: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Form {
  id: ID!
  name: String!
  category: FormCategory!
  version: Int!
  templateData: JSON!
  validationRules: JSON
  complianceMapping: JSON
  submissions: [FormSubmission!]!
  createdBy: User!
  createdAt: DateTime!
}

type FormSubmission {
  id: ID!
  form: Form!
  project: Project!
  submittedBy: User!
  submissionData: JSON!
  attachments: [Attachment!]!
  signatures: [Signature!]!
  status: SubmissionStatus!
  complianceStatus: ComplianceStatus
  weatherTriggered: Boolean!
  syncStatus: SyncStatus!
  offlineCreated: Boolean!
  submittedAt: DateTime!
}

type Weather {
  id: ID!
  project: Project!
  temperature: Float
  precipitation: Float!
  windSpeed: Float
  conditions: String
  alerts: [WeatherAlert!]!
  source: WeatherSource!
  recordedAt: DateTime!
}

type WeatherAlert {
  id: ID!
  type: WeatherAlertType!
  severity: AlertSeverity!
  message: String!
  threshold: Float!
  value: Float!
  complianceRequired: Boolean!
  deadline: DateTime
}
```

### 5.3 Input Types

```graphql
input CreateProjectInput {
  name: String!
  number: String
  location: LocationInput
  complianceLevel: ComplianceLevel
  startDate: DateTime
  endDate: DateTime
  teamMemberIds: [ID!]
}

input SubmitFormInput {
  formId: ID!
  projectId: ID!
  submissionData: JSON!
  attachmentIds: [ID!]
  signatures: [SignatureInput!]
  offlineCreated: Boolean
  deviceId: String
}

input SyncBatchInput {
  deviceId: String!
  lastSyncTimestamp: DateTime!
  formSubmissions: [OfflineFormSubmission!]
  photos: [OfflinePhoto!]
  conflictResolution: ConflictResolutionStrategy
}

input OfflineFormSubmission {
  localId: String!
  formId: ID!
  projectId: ID!
  submissionData: JSON!
  createdAt: DateTime!
  modifiedAt: DateTime!
  signatures: [SignatureInput!]
}
```

### 5.4 Query Examples

```graphql
# Get project with compliance status
query GetProjectCompliance($projectId: ID!) {
  project(id: $projectId) {
    id
    name
    complianceStatus {
      overallStatus
      swpppStatus
      lastInspection
      violations {
        id
        type
        severity
        deadline
        status
      }
    }
    currentWeather {
      precipitation
      alerts {
        type
        message
        complianceRequired
      }
    }
  }
}

# Submit form with attachments
mutation SubmitInspectionForm($input: SubmitFormInput!) {
  submitForm(input: $input) {
    id
    status
    complianceStatus
    validationErrors {
      field
      message
    }
  }
}

# Subscribe to weather alerts
subscription WeatherAlerts($projectId: ID!) {
  weatherAlert(projectId: $projectId) {
    type
    severity
    message
    complianceRequired
    deadline
  }
}
```

---

## 6. WebSocket Interfaces

### 6.1 WebSocket Connection

```typescript
interface WebSocketConfig {
  endpoint: 'wss://ws.braveforms.com',
  protocols: ['graphql-ws'],
  authentication: {
    type: 'connectionParams',
    params: {
      authorization: string, // Bearer token
      organizationId: string,
      deviceId?: string
    }
  },
  heartbeat: {
    interval: 30000, // 30 seconds
    timeout: 60000   // 60 seconds
  }
}
```

### 6.2 Real-Time Events

```typescript
// WebSocket message types
enum WSMessageType {
  CONNECTION_INIT = 'connection_init',
  CONNECTION_ACK = 'connection_ack',
  SUBSCRIBE = 'subscribe',
  NEXT = 'next',
  ERROR = 'error',
  COMPLETE = 'complete',
  PING = 'ping',
  PONG = 'pong'
}

// Subscription events
interface SubscriptionEvents {
  // Form events
  'form.submitted': {
    formId: string,
    projectId: string,
    submittedBy: string,
    timestamp: string
  },
  
  // Weather events
  'weather.alert': {
    projectId: string,
    alertType: 'RAIN' | 'WIND' | 'TEMPERATURE',
    value: number,
    threshold: number,
    complianceRequired: boolean
  },
  
  // Compliance events
  'compliance.violation': {
    projectId: string,
    violationType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    deadline: string
  },
  
  // Sync events
  'sync.conflict': {
    deviceId: string,
    entityType: string,
    entityId: string,
    conflictType: string
  }
}
```

---

## 7. Webhook Specifications

### 7.1 Webhook Configuration

```yaml
webhook_endpoints:
  base_path: /webhooks
  
  endpoints:
    clerk_events: /webhooks/clerk
    weather_updates: /webhooks/weather
    compliance_notifications: /webhooks/compliance
    sync_callbacks: /webhooks/sync
    
  security:
    signature_header: X-Webhook-Signature
    signature_algorithm: HMAC-SHA256
    timestamp_tolerance: 300 # seconds
    ip_whitelist: optional
```

### 7.2 Webhook Payloads

```typescript
// Clerk webhook events
interface ClerkWebhook {
  type: 'user.created' | 'user.updated' | 'user.deleted' | 
        'organization.created' | 'organization.updated' |
        'session.created' | 'session.revoked',
  data: {
    id: string,
    object: 'user' | 'organization' | 'session',
    created_at: number,
    updated_at: number,
    attributes: object
  },
  event_attributes: {
    http_request: {
      client_ip: string,
      user_agent: string
    }
  }
}

// Compliance webhook
interface ComplianceWebhook {
  event: 'violation.created' | 'violation.resolved' | 
         'inspection.due' | 'inspection.completed',
  projectId: string,
  organizationId: string,
  data: {
    type: string,
    severity: string,
    deadline?: string,
    resolvedAt?: string,
    inspector?: string
  },
  timestamp: string,
  signature: string
}

// Weather webhook
interface WeatherWebhook {
  event: 'threshold.exceeded' | 'alert.issued' | 'forecast.updated',
  projectId: string,
  weatherData: {
    type: 'RAIN' | 'WIND' | 'TEMPERATURE',
    value: number,
    threshold: number,
    unit: string,
    source: string
  },
  complianceActions: {
    required: boolean,
    type?: string,
    deadline?: string
  },
  timestamp: string
}
```

### 7.3 Webhook Security

```typescript
// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook retry policy
interface WebhookRetryPolicy {
  maxAttempts: 5,
  backoffStrategy: 'exponential',
  initialDelay: 1000,  // 1 second
  maxDelay: 3600000,   // 1 hour
  retryOn: [408, 429, 500, 502, 503, 504]
}
```

---

## 8. External Integration Interfaces

### 8.1 Weather Service Integration

```yaml
noaa_weather_api:
  base_url: https://api.weather.gov
  authentication: none
  
  endpoints:
    points:
      method: GET
      path: /points/{latitude},{longitude}
      response:
        properties: {
          forecast: string,
          forecastHourly: string,
          observationStations: string
        }
    
    forecast:
      method: GET
      path: /gridpoints/{office}/{gridX},{gridY}/forecast
      response:
        periods: [{
          temperature: number,
          windSpeed: string,
          shortForecast: string,
          detailedForecast: string
        }]
    
    alerts:
      method: GET
      path: /alerts/active
      parameters:
        point: {latitude},{longitude}
      response:
        features: [{
          properties: {
            event: string,
            severity: string,
            urgency: string,
            description: string
          }
        }]

openweathermap_api:
  base_url: https://api.openweathermap.org/data/2.5
  authentication: api_key
  
  endpoints:
    current:
      method: GET
      path: /weather
      parameters:
        lat: number
        lon: number
        appid: string
      response:
        main: {
          temp: number,
          humidity: number
        },
        wind: {
          speed: number,
          deg: number
        },
        rain: {
          "1h": number
        }
```

### 8.2 EPA e-Reporting Integration

```xml
<!-- EPA NOI Submission Schema -->
<NOI xmlns="http://www.epa.gov/npdes/cgp">
  <PermitInformation>
    <NPDESId>string</NPDESId>
    <MasterGeneralPermitNumber>string</MasterGeneralPermitNumber>
  </PermitInformation>
  
  <FacilityInformation>
    <FacilityName>string</FacilityName>
    <FacilityAddress>
      <Street>string</Street>
      <City>string</City>
      <State>string</State>
      <ZipCode>string</ZipCode>
    </FacilityAddress>
    <Latitude>decimal</Latitude>
    <Longitude>decimal</Longitude>
  </FacilityInformation>
  
  <ProjectInformation>
    <ProjectStartDate>date</ProjectStartDate>
    <ProjectEndDate>date</ProjectEndDate>
    <DisturbedAcreage>decimal</DisturbedAcreage>
  </ProjectInformation>
  
  <SWPPPInformation>
    <SWPPPPreparedDate>date</SWPPPPreparedDate>
    <QualifiedPersonnel>
      <Name>string</Name>
      <Title>string</Title>
      <Certification>string</Certification>
    </QualifiedPersonnel>
  </SWPPPInformation>
</NOI>
```

### 8.3 QuickBooks Integration

```typescript
interface QuickBooksIntegration {
  oauth: {
    authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scope: 'com.intuit.quickbooks.accounting'
  },
  
  api: {
    baseUrl: 'https://api.intuit.com/v3/company/{companyId}',
    
    endpoints: {
      // Create time activity
      timeActivity: {
        method: 'POST',
        path: '/timeactivity',
        request: {
          NameOf: 'Employee',
          EmployeeRef: { value: string },
          StartTime: string,
          EndTime: string,
          ItemRef: { value: string },
          CustomerRef: { value: string },
          Description: string
        }
      },
      
      // Create expense
      purchase: {
        method: 'POST',
        path: '/purchase',
        request: {
          PaymentType: 'Cash' | 'Check' | 'CreditCard',
          AccountRef: { value: string },
          TotalAmt: number,
          Line: [{
            Amount: number,
            DetailType: 'AccountBasedExpenseLineDetail',
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: string },
              CustomerRef: { value: string }
            }
          }]
        }
      }
    }
  }
}
```

---

## 9. Mobile Offline Sync API

### 9.1 Sync Protocol

```typescript
interface SyncProtocol {
  // Initial sync request
  initSync: {
    endpoint: 'POST /api/v1/sync/init',
    request: {
      deviceId: string,
      lastSyncTimestamp: string,
      organizationId: string,
      schemaVersion: string
    },
    response: {
      syncToken: string,
      serverTimestamp: string,
      pendingChanges: number,
      schemaUpdates: boolean
    }
  },
  
  // Push local changes
  pushChanges: {
    endpoint: 'POST /api/v1/sync/push',
    request: {
      syncToken: string,
      deviceId: string,
      changes: {
        created: Entity[],
        updated: Entity[],
        deleted: string[]
      },
      conflictResolution: 'client_wins' | 'server_wins' | 'merge'
    },
    response: {
      accepted: string[],
      rejected: string[],
      conflicts: Conflict[]
    }
  },
  
  // Pull server changes
  pullChanges: {
    endpoint: 'POST /api/v1/sync/pull',
    request: {
      syncToken: string,
      deviceId: string,
      lastSyncTimestamp: string,
      entityTypes: string[],
      pageSize: number,
      pageToken?: string
    },
    response: {
      changes: {
        created: Entity[],
        updated: Entity[],
        deleted: string[]
      },
      nextPageToken?: string,
      serverTimestamp: string
    }
  },
  
  // Complete sync
  completeSync: {
    endpoint: 'POST /api/v1/sync/complete',
    request: {
      syncToken: string,
      deviceId: string,
      finalTimestamp: string
    },
    response: {
      success: boolean,
      nextSyncToken: string,
      syncStats: {
        pushed: number,
        pulled: number,
        conflicts: number,
        duration: number
      }
    }
  }
}
```

### 9.2 Conflict Resolution

```typescript
interface ConflictResolution {
  strategies: {
    LAST_WRITE_WINS: {
      description: 'Latest timestamp wins',
      fields: ['status', 'simple_values']
    },
    CLIENT_WINS: {
      description: 'Mobile changes take priority',
      fields: ['draft_data', 'local_edits']
    },
    SERVER_WINS: {
      description: 'Server data takes priority',
      fields: ['compliance_status', 'violations']
    },
    FIELD_MERGE: {
      description: 'Merge at field level',
      fields: ['form_data', 'complex_objects']
    },
    MANUAL: {
      description: 'User chooses resolution',
      fields: ['critical_data', 'signatures']
    }
  },
  
  conflictRecord: {
    id: string,
    entityType: string,
    entityId: string,
    clientVersion: object,
    serverVersion: object,
    baseVersion: object,
    strategy: string,
    resolution?: object,
    resolvedBy?: string,
    resolvedAt?: string
  }
}
```

### 9.3 Batch Sync Operations

```typescript
interface BatchSyncOperations {
  // Batch upload for photos
  batchPhotoUpload: {
    endpoint: 'POST /api/v1/sync/photos/batch',
    request: {
      deviceId: string,
      photos: [{
        localId: string,
        projectId: string,
        formSubmissionId?: string,
        imageData: string, // Base64
        metadata: {
          timestamp: string,
          location: Location,
          size: number
        }
      }],
      compressionLevel: 'low' | 'medium' | 'high'
    },
    response: {
      uploaded: [{
        localId: string,
        serverId: string,
        url: string,
        thumbnailUrl: string
      }],
      failed: [{
        localId: string,
        error: string
      }]
    }
  },
  
  // Delta sync for efficiency
  deltaSync: {
    endpoint: 'POST /api/v1/sync/delta',
    request: {
      deviceId: string,
      entityChecksums: [{
        entityType: string,
        entityId: string,
        checksum: string,
        modifiedAt: string
      }]
    },
    response: {
      unchanged: string[],
      changed: Entity[],
      deleted: string[],
      checksumMismatches: string[]
    }
  }
}
```

---

## 10. Error Handling & Status Codes

### 10.1 HTTP Status Codes

```yaml
success_codes:
  200: OK - Request succeeded
  201: Created - Resource created successfully
  204: No Content - Request succeeded with no response body
  
client_errors:
  400: Bad Request - Invalid request format or parameters
  401: Unauthorized - Authentication required or failed
  403: Forbidden - Insufficient permissions
  404: Not Found - Resource does not exist
  409: Conflict - Resource conflict (duplicate, version mismatch)
  422: Unprocessable Entity - Validation errors
  429: Too Many Requests - Rate limit exceeded
  
server_errors:
  500: Internal Server Error - Unexpected server error
  502: Bad Gateway - Upstream service error
  503: Service Unavailable - Temporary service outage
  504: Gateway Timeout - Upstream service timeout
```

### 10.2 Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string,        // Machine-readable error code
    message: string,     // Human-readable message
    details?: {
      field?: string,    // Field that caused error
      reason?: string,   // Detailed reason
      suggestion?: string // How to fix
    }[],
    requestId: string,   // Unique request identifier
    timestamp: string,   // ISO8601 timestamp
    documentation?: string // Link to documentation
  }
}

// Example error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Form submission validation failed",
    "details": [
      {
        "field": "inspection_date",
        "reason": "Date cannot be in the future",
        "suggestion": "Use today's date or earlier"
      },
      {
        "field": "rainfall_amount",
        "reason": "Value exceeds maximum allowed (10 inches)",
        "suggestion": "Verify measurement and re-enter"
      }
    ],
    "requestId": "req_abc123def456",
    "timestamp": "2025-08-29T10:30:00Z",
    "documentation": "https://docs.braveforms.com/errors/validation"
  }
}
```

### 10.3 Error Codes

```typescript
enum ErrorCodes {
  // Authentication errors (AUTH_*)
  AUTH_INVALID_CREDENTIALS = 'Invalid email or password',
  AUTH_TOKEN_EXPIRED = 'Authentication token has expired',
  AUTH_TOKEN_INVALID = 'Invalid authentication token',
  AUTH_OFFLINE_TOKEN_EXPIRED = 'Offline token has expired',
  AUTH_DEVICE_NOT_TRUSTED = 'Device not recognized',
  
  // Validation errors (VAL_*)
  VAL_REQUIRED_FIELD = 'Required field missing',
  VAL_INVALID_FORMAT = 'Invalid data format',
  VAL_OUT_OF_RANGE = 'Value outside allowed range',
  VAL_DUPLICATE_ENTRY = 'Duplicate entry exists',
  
  // Business logic errors (BIZ_*)
  BIZ_PROJECT_ARCHIVED = 'Cannot modify archived project',
  BIZ_COMPLIANCE_DEADLINE_PASSED = 'Compliance deadline has passed',
  BIZ_WEATHER_TRIGGER_ACTIVE = 'Weather compliance already triggered',
  BIZ_INSUFFICIENT_PERMISSIONS = 'User lacks required permissions',
  
  // Sync errors (SYNC_*)
  SYNC_CONFLICT_UNRESOLVED = 'Sync conflict requires resolution',
  SYNC_VERSION_MISMATCH = 'Client/server version incompatible',
  SYNC_QUOTA_EXCEEDED = 'Sync storage quota exceeded',
  SYNC_DEVICE_LIMIT = 'Maximum device limit reached',
  
  // Integration errors (INT_*)
  INT_WEATHER_SERVICE_DOWN = 'Weather service unavailable',
  INT_EPA_SUBMISSION_FAILED = 'EPA submission rejected',
  INT_QUICKBOOKS_AUTH_FAILED = 'QuickBooks authentication failed',
  
  // System errors (SYS_*)
  SYS_DATABASE_ERROR = 'Database operation failed',
  SYS_STORAGE_ERROR = 'File storage operation failed',
  SYS_RATE_LIMIT = 'Rate limit exceeded',
  SYS_MAINTENANCE_MODE = 'System under maintenance'
}
```

---

## 11. Rate Limiting & Throttling

### 11.1 Rate Limit Configuration

```yaml
rate_limits:
  default:
    requests_per_minute: 1000
    requests_per_hour: 10000
    requests_per_day: 100000
    
  by_endpoint:
    authentication:
      /auth/login: 10/minute
      /auth/refresh: 100/minute
      /auth/logout: 100/minute
      
    high_volume:
      /api/v1/forms: 1000/minute
      /api/v1/sync: 5000/minute
      /graphql: 1000/minute
      
    resource_intensive:
      /api/v1/photos/upload: 100/minute
      /api/v1/reports/generate: 10/minute
      /api/v1/sync/batch: 50/minute
      
    external_apis:
      /api/v1/weather: 100/minute  # NOAA limits
      /api/v1/epa/submit: 10/minute
      
  by_tier:
    free: {
      requests_per_day: 10000,
      photo_uploads_per_day: 100,
      api_calls_per_minute: 100
    },
    standard: {
      requests_per_day: 100000,
      photo_uploads_per_day: 1000,
      api_calls_per_minute: 500
    },
    professional: {
      requests_per_day: 1000000,
      photo_uploads_per_day: 10000,
      api_calls_per_minute: 1000
    },
    enterprise: {
      requests_per_day: unlimited,
      photo_uploads_per_day: unlimited,
      api_calls_per_minute: 5000
    }
```

### 11.2 Rate Limit Headers

```http
# Response headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1630454400
X-RateLimit-Reset-After: 3600
X-RateLimit-Bucket: api_default
X-RateLimit-Retry-After: 60

# 429 response
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": "1 minute",
      "retryAfter": 60
    }
  }
}
```

---

## 12. API Versioning Strategy

### 12.1 Versioning Approach

```yaml
versioning_strategy:
  method: URI-based versioning
  format: /api/v{major_version}
  
  current_versions:
    stable: v1
    beta: v2-beta
    deprecated: none
    
  lifecycle:
    alpha: Internal testing only
    beta: Public preview, breaking changes possible
    stable: Production ready, no breaking changes
    deprecated: 6 months notice before sunset
    sunset: 12 months after deprecation
    
  compatibility:
    backward_compatible_changes:
      - Adding new endpoints
      - Adding optional parameters
      - Adding response fields
      - Adding enum values
      
    breaking_changes:
      - Removing endpoints
      - Removing required parameters
      - Changing response structure
      - Changing authentication method
```

### 12.2 Version Migration

```typescript
interface VersionMigration {
  deprecation_notice: {
    headers: {
      'X-API-Deprecation': 'true',
      'X-API-Deprecation-Date': '2026-08-29',
      'X-API-Sunset-Date': '2027-02-28',
      'X-API-Migration-Guide': 'https://docs.braveforms.com/migration/v1-v2'
    }
  },
  
  compatibility_layer: {
    v1_to_v2_mapping: {
      '/api/v1/forms': '/api/v2/forms',
      '/api/v1/projects/{id}/forms': '/api/v2/forms?projectId={id}'
    },
    
    response_transformation: {
      v2_to_v1: (v2Response) => {
        // Transform v2 response to v1 format
        return {
          data: v2Response.results,
          meta: {
            total: v2Response.pagination.total,
            page: v2Response.pagination.current_page
          }
        }
      }
    }
  }
}
```

---

## 13. Data Formats & Standards

### 13.1 Standard Data Types

```typescript
// Date/Time - ISO 8601
type DateTime = string; // "2025-08-29T10:30:00Z"
type Date = string;     // "2025-08-29"
type Time = string;     // "10:30:00"

// Identifiers
type UUID = string;     // "550e8400-e29b-41d4-a716-446655440000"
type ID = string;       // Internal identifier

// Geographic
interface Location {
  latitude: number;     // -90 to 90
  longitude: number;    // -180 to 180
  accuracy?: number;    // meters
  altitude?: number;    // meters
  timestamp?: DateTime;
}

// Money
interface Money {
  amount: number;       // Cents (integer)
  currency: string;     // ISO 4217 code
}

// File
interface FileReference {
  id: string;
  filename: string;
  mimeType: string;
  size: number;         // bytes
  url: string;
  thumbnailUrl?: string;
  checksum?: string;    // SHA-256
}
```

### 13.2 Request/Response Standards

```yaml
content_types:
  json: application/json
  form_data: multipart/form-data
  xml: application/xml
  pdf: application/pdf
  
character_encoding: UTF-8

compression:
  request: gzip, deflate
  response: gzip, br
  
size_limits:
  request_body: 10MB
  json_payload: 1MB
  file_upload: 10MB per file
  batch_request: 50MB total
  
field_naming: camelCase
null_values: Omit null fields in responses
empty_arrays: Include as []
```

### 13.3 Common Response Formats

```typescript
// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// List response with pagination
interface ListResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  links: {
    self: string;
    next?: string;
    previous?: string;
    first: string;
    last: string;
  };
}

// Batch operation response
interface BatchResponse {
  success: true;
  results: {
    succeeded: Array<{
      id: string;
      status: 'success';
      data?: any;
    }>;
    failed: Array<{
      id: string;
      status: 'failed';
      error: ErrorDetail;
    }>;
  };
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}
```

---

## 14. Security Requirements

### 14.1 Transport Security

```yaml
tls_configuration:
  minimum_version: TLS 1.3
  cipher_suites:
    - TLS_AES_256_GCM_SHA384
    - TLS_AES_128_GCM_SHA256
    - TLS_CHACHA20_POLY1305_SHA256
  
  certificate:
    provider: Let's Encrypt
    renewal: Automatic (30 days before expiry)
    validation: Domain validation
    
  hsts:
    max_age: 31536000
    include_subdomains: true
    preload: true
```

### 14.2 API Security Headers

```http
# Security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
```

### 14.3 Input Validation

```typescript
interface ValidationRules {
  strings: {
    maxLength: 1000,
    pattern: /^[\w\s\-\.]+$/,
    sanitization: 'html_escape'
  },
  
  numbers: {
    min: -999999,
    max: 999999,
    precision: 2
  },
  
  files: {
    maxSize: 10485760, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    virusScan: true
  },
  
  sql_injection_prevention: 'parameterized_queries',
  xss_prevention: 'output_encoding',
  xxe_prevention: 'disable_external_entities'
}
```

---

## 15. Testing & Validation

### 15.1 API Testing Requirements

```yaml
test_coverage:
  unit_tests: 80% minimum
  integration_tests: All endpoints
  contract_tests: All external integrations
  load_tests: 1000 concurrent users
  security_tests: OWASP Top 10
  
test_environments:
  development: http://localhost:4000
  staging: https://api-staging.braveforms.com
  production: https://api.braveforms.com
  
test_data:
  synthetic: Generated test data
  anonymized: Production-like data
  edge_cases: Boundary conditions
```

### 15.2 API Documentation

```yaml
documentation:
  format: OpenAPI 3.0
  location: https://api.braveforms.com/docs
  
  includes:
    - Endpoint descriptions
    - Request/response examples
    - Error codes
    - Rate limits
    - Authentication guide
    - Webhook setup
    - SDK references
    
  code_examples:
    languages:
      - JavaScript/TypeScript
      - Python
      - Java
      - C#
      - cURL
```

### 15.3 Monitoring & Metrics

```yaml
monitoring:
  metrics:
    - Response time (p50, p95, p99)
    - Error rate
    - Request volume
    - Endpoint usage
    - Authentication failures
    
  alerts:
    - Error rate > 1%
    - Response time p95 > 500ms
    - 5xx errors > 10/minute
    - Authentication failures > 100/hour
    
  logging:
    - All API requests
    - Error details
    - Authentication events
    - Rate limit violations
    - External API calls
```

---

## Appendix A: Status Code Quick Reference

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST creating resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Malformed request syntax |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate or version conflict |
| 422 | Unprocessable | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server failure |
| 503 | Service Unavailable | Temporary outage/maintenance |

---

## Appendix B: Common Headers

```http
# Request Headers
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
X-API-Version: v1
X-Request-ID: {uuid}
X-Device-ID: {device_id}
X-Organization-ID: {org_id}

# Response Headers
Content-Type: application/json
X-Request-ID: {uuid}
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-Response-Time: 125ms
Cache-Control: no-cache
ETag: "686897696a7c8761"
```

---

## Appendix C: GraphQL Introspection Query

```graphql
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
  }
}
```

---

## Document Control

**Version:** 1.0  
**Status:** Final - Development Ready  
**Created:** August 2025  
**Last Updated:** August 2025  
**Review Cycle:** Quarterly  
**Owner:** Engineering Team  

### Approval Matrix

| Role | Name | Date | Signature |
|------|------|------|-----------|
| API Architect | | Aug 2025 | Approved |
| Backend Lead | | Aug 2025 | Approved |
| Mobile Lead | | Aug 2025 | Approved |
| Security Lead | | Aug 2025 | Approved |
| Integration Lead | | Aug 2025 | Approved |

---

**END OF DOCUMENT**

*This Interface Control Document defines all API specifications for the BrAve Forms Platform. It serves as the contract between system components and external integrations. Any changes to these interfaces require version management and stakeholder notification per the versioning strategy defined herein.*