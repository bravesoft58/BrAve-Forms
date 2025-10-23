# ISSUE-062: Photo Metadata Queries

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-062/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 2 - Photo Documentation | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-061 (storage complete)

## What You'll Do

Add getPhotosByForm and getPhotosByProject queries, implement filter by date range, add pagination support.

## Step-by-Step Instructions

### Step 1: Create Photo Queries Service (60 min)

```typescript
@Injectable()
export class PhotoQueriesService {
  async findByForm(formId: string, orgId: string): Promise<Photo[]> {
    return this.prisma.photo.findMany({
      where: {
        orgId,
        formSubmissionId: formId, // FK to form_submissions
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProject(projectId: string, orgId: string): Promise<Photo[]> {
    return this.prisma.photo.findMany({
      where: {
        orgId,
        projectId, // FK to projects
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDateRange(
    orgId: string,
    startDate: Date,
    endDate: Date,
    skip: number,
    take: number
  ): Promise<{ photos: Photo[]; total: number }> {
    const where = {
      orgId,
      createdAt: { gte: startDate, lte: endDate },
    };

    const [photos, total] = await Promise.all([
      this.prisma.photo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.photo.count({ where }),
    ]);

    return { photos, total };
  }
}
```

### Step 2: Add GraphQL Queries (30 min)

```typescript
@Query(() => [Photo])
async photosByForm(
  @Args('formId', { type: () => ID }) formId: string,
  @CurrentUser() user: ClerkUser,
): Promise<Photo[]> {
  return this.photoQueriesService.findByForm(formId, user.orgId);
}

@Query(() => PhotosConnection)
async photosByDateRange(
  @Args('startDate') startDate: Date,
  @Args('endDate') endDate: Date,
  @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  @Args('take', { type: () => Int, defaultValue: 50 }) take: number,
  @CurrentUser() user: ClerkUser,
): Promise<PhotosConnection> {
  const { photos, total } = await this.photoQueriesService.findByDateRange(
    user.orgId,
    startDate,
    endDate,
    skip,
    take,
  );

  return { photos, total, skip, take, hasMore: skip + photos.length < total };
}
```

### Step 3: Test Queries in Playground (30 min)

```graphql
query GetPhotosByForm {
  photosByForm(formId: "clXXXXXXXX") {
    id
    filename
    latitude
    longitude
    createdAt
  }
}

query GetPhotosByDateRange {
  photosByDateRange(
    startDate: "2025-10-01T00:00:00Z"
    endDate: "2025-10-02T23:59:59Z"
    skip: 0
    take: 10
  ) {
    photos {
      id
      filename
    }
    total
    hasMore
  }
}
```

## Files to Create

- `photo-queries.service.ts`
- `photo-queries.spec.ts`

## Time Estimate: 2 hours

## Next Issue

**ISSUE-063:** Photo Upload Unit Tests (2h)

## Status: COMPLETE (2025-10-03)

**Commit:** 8f1f70f528938666cce507078b3c2826017fa18f

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-062/COMPLETION-REPORT.md)

**Implementation Details:**

- Enhanced PhotosService.getPhotosByProject() with advanced filtering
- Date range filter: startDate, endDate
- GPS filter: hasGps boolean (filters to photos with lat+lon)
- Pagination: take, skip parameters
- Multi-tenant isolation via orgId
- Enhanced PhotosResolver with photosByProject query
- Results ordered by takenAt descending (newest first)

**Phase 2 - Photo Documentation:** 4/6 issues complete (67%)
