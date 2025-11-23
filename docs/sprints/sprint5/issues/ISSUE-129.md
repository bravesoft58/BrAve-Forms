# ISSUE-129: Photo Lightbox Viewer (3h)

**Sprint:** Sprint 5 | **Phase:** 1 - Photo Gallery | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-128 (Photo Gallery Grid View)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Integrate Yet Another React Lightbox for full-size photo viewing with zoom, navigation, EXIF metadata display, and download/share capabilities.

## Prerequisites

- [ ] ISSUE-128 complete (Photo gallery grid view)
- [ ] Yet Another React Lightbox installed
- [ ] Photos accessible via grid view
- [ ] Code editor open to apps/web directory

## Libraries/Dependencies

**Yet Another React Lightbox:**

- **Version:** ^3.0.0
- **License:** MIT (open source)
- **Why:** Recommended by Mantine community, React 19/18 compatible, actively maintained
- **Alternatives Rejected:** react-image-lightbox (deprecated, no longer supported)
- **Install:**
  ```bash
  pnpm add yet-another-react-lightbox
  ```

## Step-by-Step Instructions

### Step 1: Install Yet Another React Lightbox (10 min)

```bash
cd apps/web
pnpm add yet-another-react-lightbox

# Optional plugins
pnpm add yet-another-react-lightbox@^3.0.0
```

Verify installation:

```bash
grep "yet-another-react-lightbox" package.json
```

### Step 2: Create PhotoLightbox Component (90 min)

Create `apps/web/components/photos/photo-lightbox.tsx`:

```typescript
'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { Photo } from '@braveforms/types';
import { Stack, Text, Group, Badge } from '@mantine/core';

interface PhotoLightboxProps {
  photos: Photo[];
  index: number;
  open: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, index, open, onClose }: PhotoLightboxProps) {
  const slides = photos.map((photo) => ({
    src: photo.url,
    alt: photo.description || 'Photo',
    width: photo.metadata?.width || 1920,
    height: photo.metadata?.height || 1080,
  }));

  const renderSlideCaption = (photo: Photo) => (
    <Stack gap="xs" p="md" bg="dark.8" style={{ opacity: 0.9 }}>
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          {photo.description || 'No description'}
        </Text>
        <Badge>{photo.formName}</Badge>
      </Group>

      {photo.metadata?.exif && (
        <Group gap="md">
          <Text size="xs" c="dimmed">
            {new Date(photo.metadata.exif.timestamp).toLocaleString()}
          </Text>
          {photo.metadata.exif.gps && (
            <Text size="xs" c="dimmed">
              GPS: {photo.metadata.exif.gps.latitude.toFixed(6)}, {photo.metadata.exif.gps.longitude.toFixed(6)}
            </Text>
          )}
          {photo.metadata.exif.camera && (
            <Text size="xs" c="dimmed">
              {photo.metadata.exif.camera}
            </Text>
          )}
        </Group>
      )}
    </Stack>
  );

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={index}
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      carousel={{
        preload: 2,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      render={{
        slideFooter: ({ slide }) => {
          const photo = photos[slides.findIndex((s) => s.src === slide.src)];
          return photo ? renderSlideCaption(photo) : null;
        },
      }}
    />
  );
}
```

### Step 3: Integrate Lightbox with Gallery Grid (45 min)

Update `apps/web/components/photos/photo-gallery-grid.tsx`:

```typescript
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { SimpleGrid, Card, Image, Text, Stack, Loader, Center } from '@mantine/core';
import { useInView } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { Photo } from '@braveforms/types';
import { PhotoLightbox } from './photo-lightbox';

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
  const [lightboxIndex, setLightboxIndex] = useState(-1);

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
    <>
      <Stack gap="lg">
        <SimpleGrid
          cols={{ base: 2, sm: 3, md: 4, lg: 6 }}
          spacing="md"
        >
          {photos.map((photo: Photo, index: number) => (
            <Card
              key={photo.id}
              shadow="sm"
              padding="xs"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => setLightboxIndex(index)}
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

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  );
}
```

### Step 4: Add Download and Share Actions (45 min)

Update `apps/web/components/photos/photo-lightbox.tsx` with toolbar:

```typescript
import { ActionIcon, Group } from '@mantine/core';
import { IconDownload, IconShare } from '@tabler/icons-react';
import Toolbar from 'yet-another-react-lightbox/plugins/toolbar';

// Add to PhotoLightbox component:
const handleDownload = (photo: Photo) => {
  const link = document.createElement('a');
  link.href = photo.url;
  link.download = `photo-${photo.id}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleShare = async (photo: Photo) => {
  if (navigator.share) {
    await navigator.share({
      title: photo.description || 'Photo',
      url: photo.url,
    });
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(photo.url);
  }
};

return (
  <Lightbox
    open={open}
    close={onClose}
    slides={slides}
    index={index}
    plugins={[Zoom, Toolbar]}
    toolbar={{
      buttons: [
        <ActionIcon
          key="download"
          variant="subtle"
          onClick={() => handleDownload(photos[index])}
        >
          <IconDownload size={20} />
        </ActionIcon>,
        <ActionIcon
          key="share"
          variant="subtle"
          onClick={() => handleShare(photos[index])}
        >
          <IconShare size={20} />
        </ActionIcon>,
      ],
    }}
    // ... rest of config
  />
);
```

### Step 5: Test Lightbox Functionality (30 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access photo gallery
# Navigate to http://localhost:30102/photos
```

**Verify:**

- [ ] Clicking photo thumbnail opens lightbox
- [ ] Lightbox displays full-size photo
- [ ] Arrow keys navigate left/right (desktop)
- [ ] Swipe left/right navigates (mobile)
- [ ] Zoom controls work (scroll to zoom)
- [ ] EXIF metadata displays in caption
- [ ] Download button downloads photo
- [ ] Share button shares or copies URL
- [ ] ESC key closes lightbox

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/components/photos/__tests__/photo-lightbox.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoLightbox } from '../photo-lightbox';

describe('PhotoLightbox', () => {
  const mockPhotos = [
    {
      id: 'photo-1',
      url: 'https://example.com/photo1.jpg',
      description: 'Test photo',
      formName: 'Daily Log',
      metadata: {
        width: 1920,
        height: 1080,
        exif: {
          timestamp: '2025-10-23T12:00:00Z',
          gps: { latitude: 39.5, longitude: -119.8 },
          camera: 'iPhone 15 Pro',
        },
      },
    },
  ];

  it('should open lightbox when triggered', () => {
    render(
      <PhotoLightbox
        photos={mockPhotos}
        index={0}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByAltText('Test photo')).toBeInTheDocument();
  });

  it('should display EXIF metadata', () => {
    render(
      <PhotoLightbox
        photos={mockPhotos}
        index={0}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/GPS:/)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 15 Pro/)).toBeInTheDocument();
  });

  it('should close on ESC key', () => {
    const onClose = jest.fn();
    render(
      <PhotoLightbox
        photos={mockPhotos}
        index={0}
        open={true}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test photo-lightbox
```

**Screenshot:** Save to `evidence/ISSUE-129/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test photo-lightbox
```

**Screenshot:** Save to `evidence/ISSUE-129/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/components/photos/photo-lightbox.tsx
- apps/web/components/photos/**tests**/photo-lightbox.test.tsx

**Modify:**

- apps/web/components/photos/photo-gallery-grid.tsx (integrate lightbox)
- apps/web/package.json (add yet-another-react-lightbox dependency)

## Verification Checklist

- [ ] Yet Another React Lightbox installed
- [ ] Lightbox opens on thumbnail click
- [ ] Full-size photos display correctly
- [ ] Navigation works (arrows, swipe, keyboard)
- [ ] Zoom functionality works
- [ ] EXIF metadata displays
- [ ] Download action works
- [ ] Share action works
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-129/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests)
  - coverage-report.png (>80%)
- screenshots/
  - lightbox-desktop.png (full-size photo with metadata)
  - lightbox-mobile.png (mobile view with swipe)
  - zoom-functionality.png (zoomed photo)
  - download-action.png (download in progress)

## Troubleshooting

**Problem:** Lightbox not opening

- **Cause:** State management issue with lightboxIndex
- **Solution:** Verify setLightboxIndex(-1) for closed, index >= 0 for open

**Problem:** EXIF metadata not displaying

- **Cause:** Photo metadata missing or null
- **Solution:** Check backend returns metadata.exif object, add null checks

**Problem:** Zoom not working

- **Cause:** Zoom plugin not imported
- **Solution:** Import and include Zoom in plugins array

**Problem:** Download fails on mobile

- **Cause:** Browser security restrictions
- **Solution:** Use blob download method or open in new tab

## Success Criteria

- [ ] Lightbox displays full-size photos
- [ ] Navigation works (keyboard, swipe, arrows)
- [ ] Zoom controls functional
- [ ] EXIF metadata visible
- [ ] Download action downloads original photo
- [ ] Share action copies URL or opens native share
- [ ] Performance <500ms to open lightbox
- [ ] Tests pass with >80% coverage

## Time Estimate

**3 hours total:**

- Install library: 10 min
- Create PhotoLightbox component: 90 min
- Integrate with gallery grid: 45 min
- Add download/share actions: 45 min
- Testing: 30 min

## Next Issue

**ISSUE-130:** [Next issue title]

- Prerequisites: ISSUE-129 complete (lightbox ready)
- Uses: MapLibre GL JS (free, open source)
- Displays: Photo locations on map with clustering
