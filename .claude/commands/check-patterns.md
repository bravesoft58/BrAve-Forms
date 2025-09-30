---
allowed-tools: Read, Grep, Glob
argument-hint: <file-path>
description: Verify file follows established project patterns
---

Analyze $ARGUMENTS and verify it follows project patterns:

1. Find similar files in the same module: Search for patterns
2. Check import paths match project structure
3. Verify naming conventions (camelCase, PascalCase, kebab-case)
4. Check error handling follows project patterns
5. Verify input validation is present
6. Scan for emoji or AI branding comments
7. If database model: Check orgId field and RLS considerations
8. If GraphQL resolver: Check @nestjs/graphql decorators usage
9. If React component: Check Mantine v7 and offline considerations

Report any pattern violations with:
- What is wrong (with file path and line number)
- Why it is wrong
- Example of correct pattern from existing code