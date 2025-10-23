# ISSUE-064: Photo Workflow Integration Tests

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-064/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 2 - Photo Documentation | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-062 (queries working)

## What You'll Do

Test end-to-end upload with GPS, photo attachment to form fields, multi-tenant isolation (photos scoped to org).

## Step-by-Step Instructions

### Step 1: Create Integration Test Suite (90 min)

```typescript
describe('Photo Workflow Integration', () => {
  describe('End-to-End Upload', () => {
    it('should upload photo with GPS EXIF extraction', async () => {
      // Upload photo file
      // Verify GPS coordinates stored
      // Verify photo in database
    });

    it('should attach photo to form field', async () => {
      // Create form submission
      // Upload photo
      // Link photo to form field
      // Verify linkage
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should prevent cross-org photo access', async () => {
      // Upload photo for org_1
      // Attempt to query from org_2
      // Should return empty/null
    });
  });

  describe('Presigned URLs', () => {
    it('should generate valid S3 presigned URLs', async () => {});
    it('should expire after 1 hour', async () => {});
  });
});
```

### Step 2: Run Integration Tests (15 min)

### Step 3: Verify Multi-Tenant Isolation (15 min)

## Time Estimate: 2 hours

## Next Issue

**ISSUE-065:** Form Submission Schema Design (2h)

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-064/COMPLETION-REPORT.md)

**Time:** ~2 hours

**Commit:** 8bf2dba (same as ISSUE-063)

**Summary:**

- 7 end-to-end integration tests passing
- Full workflow: EXIF → Compression → Storage → Database
- GPS and non-GPS photo handling
- Filtering: date range, GPS bounds, pagination
- Multi-tenant isolation verified
- S3 storage routing for large images (>=100KB)
