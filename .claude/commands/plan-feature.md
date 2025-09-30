---
description: Use Plan Mode to architect new feature following project patterns
---

Enter Plan Mode and analyze the feature architecture:

1. Search for existing similar features in codebase
2. Design database schema changes:
   - Prisma schema updates
   - PostgreSQL RLS policies for tenant isolation
   - JSONB fields for dynamic data
3. Design GraphQL API:
   - NestJS resolvers with @nestjs/graphql decorators
   - Input/output types
   - ClerkAuthGuard integration
4. Design frontend components:
   - Next.js App Router pages
   - Mantine v7 components
   - Valtio + TanStack Query state management
5. Plan offline sync requirements:
   - Service Worker caching strategy
   - IndexedDB schema (or SQLite for iOS critical data)
   - Conflict resolution strategy
6. Verify multi-tenancy impact:
   - Clerk org_id filtering
   - Prisma middleware updates
7. Assess compliance considerations:
   - EPA/OSHA regulations affected
   - Audit trail requirements

Present complete architecture plan for Developer approval before implementation.