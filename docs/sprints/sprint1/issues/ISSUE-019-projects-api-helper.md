# ISSUE-019: Create Projects API Helper

**Sprint:** Sprint 1 | **Phase:** Phase 3 - Apollo Removal | **Priority:** P1
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 15:15:00 EDT
**Dependencies:** ISSUE-018 ✅

---

## What You'll Do

Create fetch helper function for project data with orgId parameter.

---

## Step-by-Step Instructions

### Steps

1. Create `apps/web/lib/api/projects.ts`

2. Add GraphQL fetch helper:
```typescript
export async function fetchProjects(orgId: string) {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetProjects($orgId: String!) {
        projects(orgId: $orgId) { id name location }
      }`,
      variables: { orgId }
    })
  });
  const json = await response.json();
  return json.data.projects;
}
```

3. Export helper

4. Save file

---

## Files to Modify

**Create:**
- `apps/web/lib/api/projects.ts`

---

## Verification Checklist

- [ ] File created at correct path
- [ ] Function accepts orgId parameter
- [ ] Return type correct (projects array)
- [ ] GraphQL query includes variables
- [ ] Export statement present
- [ ] TypeScript compiles without errors

---

## Testing Steps

1. Run type check: `pnpm --filter web type-check`
2. Verify no errors
3. Check file exists: `ls apps/web/lib/api/projects.ts`

---

## Evidence Requirements

**Location:** `evidence/ISSUE-019/code/`

**Required Screenshots:**
1. `projects-api-helper.png` - Full file content with syntax highlighting

---

## Troubleshooting

**Problem:** TypeScript errors
- Check import/export syntax
- Verify GraphQL query format
- Check fetch API usage

**Problem:** File location wrong
- Must be in `apps/web/lib/api/` directory
- Create parent directories if needed

---

## Success Criteria

- File created with correct function
- Accepts orgId parameter
- Returns projects array from GraphQL response
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-020:** Convert ProjectSelector to TanStack Query (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 15 minutes
