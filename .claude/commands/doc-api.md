---
allowed-tools: Read, Grep, Write
argument-hint: <resolver-or-service-path>
description: Generate API documentation for GraphQL resolver or service
---

Generate comprehensive API documentation for: $ARGUMENTS

1. Read the resolver or service file
2. Identify all public methods and GraphQL operations
3. Generate JSDoc documentation including:
   - Purpose and responsibility
   - @param for all parameters with types and descriptions
   - @returns with return type and description
   - @throws for all error conditions
   - Multi-tenancy behavior (orgId filtering)
   - Offline sync behavior if applicable
   - Example usage with sample data
4. Document GraphQL schema if resolver:
   - Query/Mutation/Subscription signature
   - Input types
   - Output types
   - Authentication requirements

Use JSDoc format. NO emoji. NO AI branding.

Present documentation for Developer review before writing to file.