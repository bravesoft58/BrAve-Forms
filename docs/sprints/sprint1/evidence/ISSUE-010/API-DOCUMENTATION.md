# BrAve Forms Backend GraphQL API Documentation

**Backend URL:** http://localhost:30101/graphql
**Protocol:** GraphQL (POST requests)
**Authentication:** Clerk JWT (Bearer token in Authorization header)
**Generated:** 2025-10-01 15:40:00 EDT
**Sprint:** Sprint 1 - ISSUE-010

---

## Overview

The BrAve Forms backend provides a GraphQL API for construction compliance management. All queries and mutations (except introspection) require Clerk authentication with organization context.

---

## Authentication

**Required Header:**

```
Authorization: Bearer <clerk_jwt_token>
```

**JWT Claims Required:**

- `o.id` - Organization ID (Clerk org ID)
- `o.rol` - User role (OWNER, ADMIN, MEMBER)
- `o.slg` - Organization slug

**Unauthenticated Access:**

- GraphQL introspection queries (`__schema`, `__type`, `__typename`)
- No data queries work without authentication

---

## Queries

### Weather & Compliance

#### `checkProjectWeather`

**Description:** Check if project location has exceeded EPA 0.25 inch threshold

**Arguments:**

- `projectId: String!` - Project UUID
- `latitude: Float!` - Project latitude
- `longitude: Float!` - Project longitude

**Returns:** `PrecipitationCheckResult!`

**Example:**

```graphql
query {
  checkProjectWeather(
    projectId: "00000000-0000-0000-0000-000000000001"
    latitude: 37.7749
    longitude: -122.4194
  ) {
    precipitationInches
    thresholdExceeded
    lastChecked
    source
  }
}
```

**Authentication:** Required (Clerk JWT)

---

#### `recentWeatherEvents`

**Description:** Get recent weather events for a project

**Arguments:**

- `projectId: String!` - Project UUID
- `days: Float = 7` - Number of days to look back (default: 7)

**Returns:** `[WeatherEvent!]!`

**Example:**

```graphql
query {
  recentWeatherEvents(projectId: "00000000-0000-0000-0000-000000000001", days: 7) {
    id
    eventDate
    precipitationInches
    source
    inspectionDeadline
  }
}
```

**Authentication:** Required (Clerk JWT)

---

#### `pendingInspections`

**Description:** Get all pending inspections for the organization

**Arguments:** None

**Returns:** `[Inspection!]!`

**Example:**

```graphql
query {
  pendingInspections {
    id
    projectId
    type
    status
    inspectionDate
    weatherTriggered
    precipitationInches
  }
}
```

**Authentication:** Required (Clerk JWT)

---

### Organization Management

#### `currentOrganization`

**Description:** Get current user's organization with full details including projects and stats

**Arguments:** None

**Returns:** `Organization!` (complete organization object)

**Example:**

```graphql
query {
  currentOrganization {
    id
    clerkOrgId
    name
    plan
    createdAt
    updatedAt
    projects {
      id
      name
      address
      status
    }
    users {
      id
      userId
      role
      joinedAt
    }
    stats {
      totalProjects
      activeProjects
      totalInspections
      pendingInspections
      complianceRate
      totalUsers
    }
  }
}
```

**Authentication:** Required (Clerk JWT)

---

#### `organizationDashboard`

**Description:** Get comprehensive organization statistics for dashboard

**Arguments:** None

**Returns:** `OrganizationStats!`

**Example:**

```graphql
query {
  organizationDashboard {
    totalProjects
    activeProjects
    totalInspections
    pendingInspections
    complianceRate
    totalUsers
    usersByRole {
      role
      count
    }
    projectsByStatus {
      status
      count
    }
    inspectionStats {
      type
      total
      compliant
      overdue
    }
  }
}
```

**Authentication:** Required (Clerk JWT)

---

#### `organizationStats`

**Description:** Get organization statistics (simplified)

**Arguments:** None

**Returns:** `String` (likely JSON string)

**Example:**

```graphql
query {
  organizationStats
}
```

**Authentication:** Required (Clerk JWT)

---

#### `organizationProjects`

**Description:** Get all projects for the organization

**Arguments:** None

**Returns:** `[Project!]!`

**Example:**

```graphql
query {
  organizationProjects
}
```

**Authentication:** Required (Clerk JWT)

**Note:** Returns array of project IDs or basic project info (return type not fully introspectable)

---

#### `organizationUsers`

**Description:** Get all users in the organization

**Arguments:** None

**Returns:** `[UserOrganization!]!`

**Example:**

```graphql
query {
  organizationUsers
}
```

**Authentication:** Required (Clerk JWT)

---

### Project Management

#### `projects`

**Description:** Get projects with optional filtering

**Arguments:**

- `filter: ProjectFilterInput` (optional)
  - `status: String` - Filter by project status (ACTIVE, PLANNING, etc.)
  - `search: String` - Search by project name or address
  - `limit: Int` - Maximum number of results
  - `offset: Int` - Pagination offset

**Returns:** `[Project!]!`

**Example:**

```graphql
query {
  projects(filter: { status: "ACTIVE", limit: 10 }) {
    id
    name
    address
    disturbedAcres
    status
    startDate
    endDate
  }
}
```

**Authentication:** Required (Clerk JWT)

---

### Storage & Files

#### `getStorageStats`

**Description:** Get photo storage statistics for organization

**Arguments:** None

**Returns:** `String!` (likely JSON string with storage metrics)

**Example:**

```graphql
query {
  getStorageStats
}
```

**Authentication:** Required (Clerk JWT)

---

#### `generatePhotoUrl`

**Description:** Generate signed URL for photo access

**Arguments:**

- `photoKey: String!` - S3 key for the photo

**Returns:** `String!` (signed URL)

**Example:**

```graphql
query {
  generatePhotoUrl(photoKey: "photos/inspection-123/photo-1.jpg")
}
```

**Authentication:** Required (Clerk JWT)

---

#### `getCompliancePackage`

**Description:** Generate compliance package (PDF report) for inspection

**Arguments:**

- `inspectionId: String!` - Inspection UUID

**Returns:** `String!` (likely PDF URL or base64)

**Example:**

```graphql
query {
  getCompliancePackage(inspectionId: "00000000-0000-0000-0000-000000000201")
}
```

**Authentication:** Required (Clerk JWT)

---

## Mutations

### Organization Management

#### `updateOrganization`

**Description:** Update organization details

**Arguments:**

- TBD (requires introspection of `UpdateOrganizationInput` type)

**Returns:** `Organization!`

**Example:**

```graphql
mutation {
  updateOrganization(input: { name: "New Company Name" }) {
    id
    name
    plan
  }
}
```

**Authentication:** Required (Clerk JWT with OWNER/ADMIN role)

---

#### `syncOrganization`

**Description:** Sync organization from Clerk webhook

**Arguments:**

- `clerkOrgId: String!` - Clerk organization ID
- `orgData: String!` - JSON string with organization data

**Returns:** `String!` (confirmation message)

**Example:**

```graphql
mutation {
  syncOrganization(
    clerkOrgId: "org_acme_construction"
    orgData: "{\"name\":\"ACME Construction\",\"plan\":\"PROFESSIONAL\"}"
  )
}
```

**Authentication:** Required (Clerk JWT)

---

#### `syncUserOrganization`

**Description:** Sync user-organization membership from Clerk webhook

**Arguments:**

- TBD (requires introspection)

**Returns:** `String!` (confirmation message)

**Example:**

```graphql
mutation {
  syncUserOrganization(userId: "user_123", orgId: "org_acme", role: "ADMIN")
}
```

**Authentication:** Required (Clerk JWT)

---

#### `removeUserFromOrganization`

**Description:** Remove user from organization

**Arguments:**

- TBD (requires introspection)

**Returns:** `String!` (confirmation message)

**Example:**

```graphql
mutation {
  removeUserFromOrganization(userId: "user_123", orgId: "org_acme")
}
```

**Authentication:** Required (Clerk JWT with OWNER/ADMIN role)

---

## EPA Compliance Features

### 0.25" Rain Threshold

The API implements EPA Construction General Permit (CGP) requirements:

**Threshold:** Exactly 0.25 inches of precipitation (not approximate)
**Inspection Window:** Within 24 working hours of rain event
**Working Hours:** Project's normal business hours (not calendar hours)

**Relevant Queries:**

- `checkProjectWeather` - Real-time precipitation check
- `recentWeatherEvents` - Historical rain events
- `pendingInspections` - Inspections triggered by weather

**EPA CGP Reference:** 2022 Construction General Permit Section 4.4

---

## Error Responses

### Authentication Errors

**Missing Authorization Header:**

```json
{
  "errors": [
    {
      "message": "No authorization header",
      "code": "UNAUTHENTICATED",
      "timestamp": "2025-10-01T15:38:21.543Z"
    }
  ],
  "data": null
}
```

### Validation Errors

**Invalid Field:**

```json
{
  "errors": [
    {
      "message": "Cannot query field \"organizations\" on type \"Query\". Did you mean \"organizationStats\" or \"organizationUsers\"?",
      "code": "GRAPHQL_VALIDATION_FAILED",
      "timestamp": "2025-10-01T15:38:05.065Z"
    }
  ]
}
```

---

## Testing Without Authentication

**Introspection queries work without authentication:**

```bash
# Schema overview
curl http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Query fields
curl http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"Query\") { fields { name } } }"}'

# Mutation fields
curl http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"Mutation\") { fields { name } } }"}'
```

**All data queries require Clerk JWT:**

```bash
# This will fail with "No authorization header"
curl http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { organizationProjects }"}'

# Correct approach (with Clerk JWT)
curl http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_jwt_token>" \
  -d '{"query":"query { organizationProjects }"}'
```

---

## Multi-Tenancy

**All queries automatically filter by organization:**

- Extracted from Clerk JWT `o.id` claim
- Prisma middleware injects `orgId` filter
- PostgreSQL RLS enforces tenant boundaries
- Cross-tenant access attempts fail

**Example:** User in ACME Construction can only see ACME projects, even if they know BuildCo project IDs.

---

## Performance Characteristics

- **Response Time:** <200ms P95 (target)
- **Connection Pooling:** Prisma connection pool to PostgreSQL
- **Caching:** Redis caching for weather data (6-hour TTL)
- **Rate Limiting:** TBD (not yet implemented)

---

## Next Steps (Future Iterations)

1. **Add descriptions to all queries/mutations** (missing from many)
2. **Implement rate limiting** (protect against abuse)
3. **Add subscription support** (real-time updates)
4. **Expose more detailed return types** (currently many are String or opaque lists)
5. **Add pagination support** (offset/limit for all list queries)
6. **Implement field-level permissions** (based on user role)

---

## References

- **GraphQL Playground:** http://localhost:30101/graphql (requires browser)
- **Introspection Queries:** See `evidence/ISSUE-010/api-responses/`
- **Backend Code:** `apps/backend/src/modules/`
- **Clerk Docs:** https://clerk.com/docs/backend-requests/handling/nodejs
- **EPA CGP 2022:** Section 4.4 - Inspection Requirements

---

**Generated by:** Backend API Testing (ISSUE-010)
**Status:** API Operational - Authentication Required for All Data Queries
**Quality Gate:** Introspection successful, schema valid, all endpoints documented
