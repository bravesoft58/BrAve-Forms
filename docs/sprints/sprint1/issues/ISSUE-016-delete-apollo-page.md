# ISSUE-016: Delete Test Apollo Page and Old Mutations

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P1
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 15:40:00 EDT
**Dependencies:** ISSUE-015 (Weather dashboard converted) ✅

---

## What You'll Do

Remove the test Apollo page and old mutation files that are no longer needed after TanStack Query migration.

---

## Step-by-Step Instructions

### Step 1: Delete Test Apollo Page (5 min)

1. Delete folder: `apps/web/app/test-apollo/`
   - This contains the Apollo testing page
   - No longer needed after migration

```bash
rm -rf apps/web/app/test-apollo
```

### Step 2: Delete Old Mutation Files (3 min)

If they exist, delete:

```bash
rm -f apps/web/graphql/mutations/createOrganization.ts
rm -f apps/web/graphql/mutations/updateProject.ts
rm -f apps/web/graphql/mutations/createInspection.ts
```

Or delete the entire mutations folder if all mutations are in backend:

```bash
rm -rf apps/web/graphql/mutations
```

### Step 3: Clean Up GraphQL Folder (2 min)

Check `apps/web/graphql/` folder:
- Keep `queries/` if still used by backend
- Delete empty folders
- Delete unused query files

### Step 4: Update Navigation (if needed) (3 min)

Check if navigation links to test-apollo page:

1. Open `apps/web/components/Navigation.tsx` or similar
2. Remove any links to `/test-apollo`
3. Remove menu items for Apollo testing

### Step 5: Run Build Check (2 min)

```bash
cd apps/web
pnpm build
```

Verify no errors about missing files.

---

## Files to Delete

1. `apps/web/app/test-apollo/` - Entire folder
2. `apps/web/graphql/mutations/` - Mutation files (if they exist)
3. Any navigation links to test pages

---

## Verification Checklist

- [ ] `test-apollo` folder deleted
- [ ] Old mutation files deleted
- [ ] No navigation links to test pages
- [ ] Build succeeds without errors
- [ ] No import errors in console

---

## Testing Steps

1. Delete files as specified above
2. Run: `pnpm --filter web build`
3. Check output - should complete successfully
4. Start dev server: `pnpm --filter web dev`
5. Navigate to main pages - verify no broken links
6. Check browser console - no 404 errors

---

## Expected Output

**Before:**
- `apps/web/app/test-apollo/page.tsx` exists
- Old mutation files present
- Build warnings about unused files

**After:**
- Test files removed
- Clean build output
- No unused imports

---

## Evidence Requirements

### Screenshot 1: Files Deleted
- File: `evidence/ISSUE-016/deployment/files-deleted.png`
- Show: Directory listing showing test-apollo removed

### Screenshot 2: Build Success
- File: `evidence/ISSUE-016/deployment/build-success.png`
- Show: `pnpm build` completing successfully

---

## Troubleshooting

### Issue: Build fails with missing import
**Solution:**
1. Find file importing deleted code
2. Remove the import statement
3. Update file to use TanStack Query equivalent

### Issue: Navigation still links to test page
**Solution:**
1. Find navigation component
2. Remove test page link
3. Rebuild

---

## Success Criteria

- ✅ All test Apollo files deleted
- ✅ Build succeeds without errors
- ✅ No broken navigation links
- ✅ Clean console output

---

## Next Issue

**ISSUE-017:** Remove Apollo Client from package.json (10 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1 (Cleanup)
**Estimated Time:** 15 minutes
