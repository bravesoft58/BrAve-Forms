# ISSUE-128: Photo Gallery Grid View (4h)

**Sprint:** Sprint 5 | **Phase:** 1 - Photo Gallery | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Completed:** 2025-11-28
**Dependencies:** Sprint 4 complete
**Status:** COMPLETE

## Completion Summary

### Implementation Details

- Created PhotoGalleryGrid component with Mantine SimpleGrid responsive layout
- Implemented infinite scroll using react-intersection-observer + TanStack Query useInfiniteQuery
- Created PhotoFilters component with project, form type, date range, and GPS-only filters
- Created API route for photos with GraphQL backend integration
- TDD approach: 13 tests passing with full coverage of core functionality

### Files Created

- apps/web/components/photos/photo-gallery-grid.tsx (main grid component)
- apps/web/components/photos/photo-filters.tsx (filter controls)
- apps/web/components/photos/index.ts (exports)
- `apps/web/components/photos/__tests__/photo-gallery-grid.test.tsx` (13 tests)
- apps/web/app/photos/page.tsx (all photos page)
- apps/web/app/photos/[projectId]/page.tsx (project photos page)
- apps/web/app/api/photos/route.ts (API route)

### Test Results

- 13/13 tests passing
- Tests cover: rendering, loading states, empty states, error states, photo cards, GPS badges, click handlers, keyboard navigation, filtering

### Key Features Implemented

- Responsive grid: 2 columns (mobile) to 5 columns (xl screens)
- Infinite scroll with load-more sentinel
- GPS badge indicator for photos with coordinates
- Project/form type/date range/GPS-only filters
- Proper accessibility (role="button", tabIndex, keyboard navigation)
- Error and empty state handling

---

## What You'll Do

Create photo gallery grid view with masonry layout, filtering, sorting, and infinite scroll for efficient photo management across projects.

## Prerequisites

- [ ] Sprint 4 complete (form submission with photos)
- [ ] Web app accessible at http://localhost:30102
- [ ] Photos stored in PostgreSQL with S3 URLs
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Create Photo Gallery Routes (30 min)

Create photo gallery page routes:

```bash
cd apps/web/app
mkdir -p photos/[projectId]
```

Create `apps/web/app/photos/page.tsx`:

```typescript
'use client';

import { PageContainer } from '@/components/layout/page-container';
import { PhotoGalleryGrid } from '@/components/photos/photo-gallery-grid';
import { PhotoFilters } from '@/components/photos/photo-filters';
import { useState } from 'react';

export default function AllPhotosPage() {
  const [filters, setFilters] = useState({
    projectId: null,
    formType: null,
    dateRange: null,
  });

  return (
    <PageContainer title="All Photos">
      <PhotoFilters filters={filters} onChange={setFilters} />
      <PhotoGalleryGrid filters={filters} />
    </PageContainer>
  );
}
```

Create `apps/web/app/photos/[projectId]/page.tsx`:

```typescript
'use client';

import { PageContainer } from '@/components/layout/page-container';
import { PhotoGalleryGrid } from '@/components/photos/photo-gallery-grid';
import { useParams } from 'next/navigation';

export default function ProjectPhotosPage() {
  const { projectId } = useParams();

  return (
    <PageContainer title="Project Photos">
      <PhotoGalleryGrid projectId={projectId as string} />
    </PageContainer>
  );
}
```

### Step 2: Create PhotoGalleryGrid Component (90 min)

Create `apps/web/components/photos/photo-gallery-grid.tsx`:

```typescript
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { SimpleGrid, Card, Image, Text, Group, Stack, Loader, Center } from '@mantine/core';
import { useInView } from '@mantine/hooks';
import { useEffect } from 'react';
import { Photo } from '@braveforms/types';

interface PhotoGalleryGridProps {
  projectId?: string;
  filters?: {
    formType?: string;
    dateRange?: [Date, Date];
    userId?: string;
  };
}

export function PhotoGalleryGrid({ projectId, filters }: PhotoGalleryGridProps) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['photos', projectId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        skip: String(pageParam * 20),
        take: '20',
        ...(projectId && { projectId }),
        ...(filters?.formType && { formType: filters.formType }),
        ...(filters?.userId && { userId: filters.userId }),
      });

      const response = await fetch(`/api/photos?${params}`);
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  const photos = data?.pages.flatMap((page) => page.photos) || [];

  return (
    <Stack gap="lg">
      <SimpleGrid
        cols={{ base: 2, sm: 3, md: 4, lg: 6 }}
        spacing="md"
      >
        {photos.map((photo: Photo) => (
          <Card
            key={photo.id}
            shadow="sm"
            padding="xs"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
          >
            <Card.Section>
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.description || 'Photo'}
                height={160}
                fit="cover"
              />
            </Card.Section>

            <Stack gap={4} mt="xs">
              <Text size="xs" c="dimmed" truncate>
                {new Date(photo.createdAt).toLocaleDateString()}
              </Text>
              <Text size="xs" fw={500} truncate>
                {photo.formName || 'Unknown Form'}
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {hasNextPage && (
        <div ref={ref}>
          {isFetchingNextPage && (
            <Center>
              <Loader size="sm" />
            </Center>
          )}
        </div>
      )}
    </Stack>
  );
}
```

### Step 3: Create PhotoFilters Component (60 min)

Create `apps/web/components/photos/photo-filters.tsx`:

```typescript
'use client';

import { Group, Select, Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconX } from '@tabler/icons-react';

interface PhotoFiltersProps {
  filters: {
    projectId?: string;
    formType?: string;
    dateRange?: [Date, Date];
  };
  onChange: (filters: any) => void;
}

export function PhotoFilters({ filters, onChange }: PhotoFiltersProps) {
  const clearFilters = () => {
    onChange({
      projectId: null,
      formType: null,
      dateRange: null,
    });
  };

  return (
    <Group mb="md">
      <Select
        placeholder="All Projects"
        value={filters.projectId}
        onChange={(value) => onChange({ ...filters, projectId: value })}
        data={[
          { value: 'project-1', label: 'Project Alpha' },
          { value: 'project-2', label: 'Project Beta' },
        ]}
        clearable
      />

      <Select
        placeholder="All Form Types"
        value={filters.formType}
        onChange={(value) => onChange({ ...filters, formType: value })}
        data={[
          { value: 'daily-log', label: 'Daily Log' },
          { value: 'safety-inspection', label: 'Safety Inspection' },
          { value: 'swppp-inspection', label: 'SWPPP Inspection' },
        ]}
        clearable
      />

      <DatePickerInput
        type="range"
        placeholder="Date Range"
        value={filters.dateRange}
        onChange={(value) => onChange({ ...filters, dateRange: value })}
        clearable
      />

      <Button
        variant="subtle"
        leftSection={<IconX size={16} />}
        onClick={clearFilters}
      >
        Clear Filters
      </Button>
    </Group>
  );
}
```

### Step 4: Create Photos API Route (30 min)

Create `apps/web/app/api/photos/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const skip = parseInt(searchParams.get('skip') || '0');
  const take = parseInt(searchParams.get('take') || '20');
  const projectId = searchParams.get('projectId');
  const formType = searchParams.get('formType');

  // TODO: Replace with actual GraphQL query
  const photos = []; // Fetch from backend

  return NextResponse.json({
    photos,
    hasMore: photos.length === take,
  });
}
```

### Step 5: Test Photo Gallery Grid (30 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Wait for restart
kubectl rollout status deployment/web -n braveforms

# Access photo gallery
# Navigate to http://localhost:30102/photos
```

**Verify:**

- [ ] Grid displays photos in masonry layout
- [ ] Infinite scroll loads more photos
- [ ] Filters work correctly
- [ ] Responsive on mobile (2 cols) and desktop (6 cols)
- [ ] Photo thumbnails load quickly

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/components/photos/__tests__/photo-gallery-grid.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhotoGalleryGrid } from '../photo-gallery-grid';

describe('PhotoGalleryGrid', () => {
  const queryClient = new QueryClient();

  it('should display photos in grid layout', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PhotoGalleryGrid />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('should load more photos on scroll', async () => {
    // Test infinite scroll
  });

  it('should filter photos by project', async () => {
    // Test filtering
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test photo-gallery-grid
```

**Screenshot:** Save to `evidence/ISSUE-159/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test photo-gallery-grid
```

**Screenshot:** Save to `evidence/ISSUE-159/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/app/photos/page.tsx
- apps/web/app/photos/[projectId]/page.tsx
- apps/web/components/photos/photo-gallery-grid.tsx
- apps/web/components/photos/photo-filters.tsx
- apps/web/app/api/photos/route.ts
- apps/web/components/photos/**tests**/photo-gallery-grid.test.tsx

## Verification Checklist

- [ ] Photo gallery routes created
- [ ] Grid view displays photos
- [ ] Infinite scroll functional
- [ ] Filters work (project, form type, date range)
- [ ] Responsive design (2-6 columns)
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-159/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests)
  - coverage-report.png (>80%)
- screenshots/
  - photo-grid-desktop.png (6-column grid)
  - photo-grid-mobile.png (2-column grid)
  - infinite-scroll.png (loading more photos)
  - filters-applied.png (filtered view)

## Troubleshooting

**Problem:** Infinite scroll not triggering

- **Cause:** useInView hook not detecting viewport intersection
- **Solution:** Ensure ref is attached to bottom div, check Mantine hooks import

**Problem:** Photos not loading

- **Cause:** API route returning empty array
- **Solution:** Implement GraphQL query to backend, verify photo data exists

**Problem:** Grid layout breaks on mobile

- **Cause:** SimpleGrid cols not responsive
- **Solution:** Use `cols={{ base: 2, sm: 3, md: 4, lg: 6 }}` for responsive columns

## Success Criteria

- [ ] Photo gallery grid displays all photos
- [ ] Infinite scroll loads 20 photos at a time
- [ ] Filters reduce visible photos correctly
- [ ] Responsive layout works on all screen sizes
- [ ] Performance <2s for 100 photos
- [ ] Tests pass with >80% coverage

## Time Estimate

**4 hours total:**

- Create routes: 30 min
- PhotoGalleryGrid component: 90 min
- PhotoFilters component: 60 min
- API route: 30 min
- Testing: 30 min

## Next Issue

**ISSUE-129:** [Next issue title]

- Prerequisites: ISSUE-128 complete (grid view ready)
- Uses: Yet Another React Lightbox library
- Displays: Full-size photo with navigation
