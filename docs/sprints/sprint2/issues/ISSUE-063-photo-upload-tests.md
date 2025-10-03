# ISSUE-063: Photo Upload Unit Tests

**Sprint:** Sprint 2 | **Phase:** 2 - Photo Documentation | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-061 (implementation complete)

## What You'll Do

Test EXIF extraction logic, storage decision tree, compression quality. Target 80% coverage for photo module.

## Step-by-Step Instructions

### Step 1: Create Test Suite (90 min)

Create `apps/backend/src/modules/photos/__tests__/photo-upload.spec.ts`:

```typescript
describe('Photo Upload Service', () => {
  describe('EXIF Extraction', () => {
    it('should extract GPS coordinates from photo', () => {});
    it('should handle photos without EXIF data', () => {});
    it('should extract timestamp and device model', () => {});
  });

  describe('Storage Decision Tree', () => {
    it('should store small photos (<100KB) in PostgreSQL', () => {});
    it('should store large photos (>100KB) in S3', () => {});
    it('should compress images to 85% quality', () => {});
  });

  describe('Compression', () => {
    it('should reduce file size', () => {});
    it('should maintain acceptable quality', () => {});
    it('should preserve aspect ratio', () => {});
  });

  describe('Multi-Tenant Isolation', () => {
    it('should filter photos by orgId', () => {});
  });
});
```

### Step 2: Run Coverage Report (15 min)

```bash
pnpm test:cov photos/
```

Target: >80% coverage

### Step 3: Document Results (15 min)

## Time Estimate: 2 hours

## Next Issue

**ISSUE-064:** Photo Workflow Integration Tests (2h)
