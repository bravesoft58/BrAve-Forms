# ISSUE-090: Remove Organization Switching UI

**Sprint:** Sprint 3 | **Phase:** 3 - Single-Tenant Simplification | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** Sprint 2 complete

## What You'll Do

Remove all organization switching UI components from the frontend to simplify the interface for Q&D Construction single-tenant deployment.

## Prerequisites

- [ ] Sprint 2 complete (web frontend deployed)
- [ ] Web app accessible at http://localhost:30102
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Remove OrganizationSelector Component (15 min)

Search for organization selector usage:

```bash
cd apps/web
grep -r "OrganizationSelector" --include="*.tsx" --include="*.ts"
```

**Files to check:**

- `components/navigation/` - Navigation components
- `components/header/` - Header components
- `app/layout.tsx` - Root layout

**Action:** Delete or comment out OrganizationSelector component usage

### Step 2: Remove Select-Organization Page (10 min)

```bash
# Delete select-organization route
rm -rf apps/web/app/select-organization/
```

Verify no imports reference this route:

```bash
grep -r "select-organization" apps/web/
```

### Step 3: Update Navigation Components (15 min)

Edit `apps/web/components/dashboard-nav.tsx` (or equivalent):

**Before:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <OrganizationSelector />
  </DropdownMenuTrigger>
</DropdownMenu>
```

**After:**

```tsx
// Organization selector removed for single-tenant deployment
// Q&D Construction (org_qd_default)
```

### Step 4: Update Layout Component (10 min)

Edit `apps/web/app/layout.tsx`:

Remove any org switching logic from layout:

```tsx
// Before
const currentOrg = useOrganization();

// After - removed (hard-coded in backend)
```

### Step 5: Test UI Changes (10 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Wait for restart
kubectl rollout status deployment/web -n braveforms

# Access web app
# Navigate to http://localhost:30102
```

**Verify:**

- [ ] No organization dropdown visible in navigation
- [ ] No "Select Organization" page accessible
- [ ] Dashboard loads without org selection prompt
- [ ] User can navigate all pages normally

## TDD Workflow (Not Applicable)

UI removal doesn't require TDD - visual verification sufficient.

### Manual Testing:

1. Login to web app
2. Check navigation header - no org dropdown
3. Try to access /select-organization - should 404 or redirect
4. Navigate to dashboard, forms, submissions - all work

**Screenshot:** Save navigation header to `evidence/ISSUE-076/test-results/no-org-selector.png`

## Files to Modify/Delete

**Delete:**

- apps/web/app/select-organization/page.tsx (entire directory)
- apps/web/components/OrganizationSelector.tsx (if exists)

**Modify:**

- apps/web/components/dashboard-nav.tsx (remove org dropdown)
- apps/web/app/layout.tsx (remove org switching logic)

**Search locations:**

- apps/web/components/navigation/
- apps/web/components/header/
- apps/web/components/ui/

## Verification Checklist

- [ ] OrganizationSelector component removed
- [ ] select-organization route deleted
- [ ] Navigation has no org dropdown
- [ ] Dashboard loads without org selection
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] Web app accessible at http://localhost:30102
- [ ] Zero emoji in modified files
- [ ] Zero AI branding in commits

## Evidence Requirements

**Location:** evidence/ISSUE-076/

**Required:**

- test-results/
  - no-org-selector.png (navigation header screenshot)
  - dashboard-no-org-prompt.png (dashboard loads directly)
- code/
  - files-deleted.png (git status showing deletions)
  - navigation-component-diff.png (git diff of dashboard-nav.tsx)

## Troubleshooting

**Problem:** Build errors after removing component

- **Cause:** Other files still importing OrganizationSelector
- **Solution:** Search for all imports: `grep -r "OrganizationSelector" apps/web/`

**Problem:** Page redirects to /select-organization

- **Cause:** Middleware or layout logic
- **Solution:** Check middleware.ts and layout.tsx for org checks

**Problem:** TypeScript errors about missing org context

- **Cause:** Components expecting org from context
- **Solution:** Remove org context usage (will hard-code in ISSUE-077)

## Success Criteria

- [ ] OrganizationSelector component deleted or commented out
- [ ] select-organization page deleted
- [ ] Navigation UI shows no org dropdown
- [ ] Dashboard accessible without org selection
- [ ] Web app builds and deploys successfully
- [ ] No console errors related to org switching

## Time Estimate

**1 hour total:**

- Search and identify org UI: 15 min
- Delete select-organization page: 10 min
- Update navigation components: 15 min
- Update layout component: 10 min
- Test and verify: 10 min

## Next Issue

**ISSUE-091:** Hard-Code Default Organization ID (2h)

- Prerequisites: This issue complete (UI simplified)
- Uses: No org switching to simplify backend constant
