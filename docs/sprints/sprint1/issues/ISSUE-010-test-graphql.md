# ISSUE-010: Test Backend GraphQL API

**Sprint:** Sprint 1 | **Phase:** 2 - Backend Deployment | **Priority:** P0
**Time:** 30 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Access GraphQL playground and test queries against seeded data.

## Step-by-Step

1. Open: http://localhost:30101/graphql
2. Run query:

```graphql
query {
  organizations {
    id
    name
    projects {
      id
      name
      latitude
      longitude
    }
  }
}
```

3. Verify returns seeded data (ACME Construction, BuildCo LLC)

## Acceptance Criteria

- [ ] GraphQL playground loads
- [ ] Query returns 2 organizations
- [ ] 4 projects total across orgs

## Evidence

`evidence/ISSUE-010/deployment/graphql-query-success.png`
