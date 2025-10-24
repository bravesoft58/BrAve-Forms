# ISSUE-125: GPS Map Integration (4h)

**Sprint:** Sprint 5 | **Phase:** 1 - Photo Gallery | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-124 (Photo Lightbox Viewer)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Integrate MapLibre GL JS for displaying photo locations on interactive map with clustering, offline tile support, and GPS route visualization.

## Prerequisites

- [ ] ISSUE-124 complete (Photo lightbox functional)
- [ ] Photos have GPS metadata (latitude/longitude)
- [ ] Free tile provider selected (Stadia Maps recommended)
- [ ] Code editor open to apps/web directory

## Libraries/Dependencies

**MapLibre GL JS:**

- **Version:** ^4.0.0
- **License:** BSD 3-Clause (fully open source)
- **Why:** Mapbox GL v2+ changed to proprietary license, MapLibre is free fork backed by Linux Foundation
- **Cost:** FREE (vs $5-20/month for Mapbox)
- **Offline:** Self-hostable tiles for construction sites
- **Install:**
  ```bash
  pnpm add maplibre-gl react-map-gl
  ```

**Free Tile Providers:**

1. **Stadia Maps** (recommended): 200k tiles/month free
2. **MapTiler**: 100k tiles/month free
3. **OpenStreetMap**: Unlimited, no API key
4. **Self-Hosted**: For offline capability

## Step-by-Step Instructions

### Step 1: Install MapLibre GL JS (15 min)

```bash
cd apps/web
pnpm add maplibre-gl react-map-gl
```

Verify installation:

```bash
grep "maplibre-gl" package.json
grep "react-map-gl" package.json
```

### Step 2: Create PhotoMapView Component (120 min)

Create `apps/web/components/photos/photo-map-view.tsx`:

```typescript
'use client';

import { Map, Marker, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Photo } from '@braveforms/types';
import { useState } from 'react';
import { Stack, Card, Image, Text, Group } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';

interface PhotoMapViewProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
}

export function PhotoMapView({ photos, onPhotoClick }: PhotoMapViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Filter photos with GPS data
  const photosWithGPS = photos.filter(
    (photo) => photo.metadata?.exif?.gps?.latitude && photo.metadata?.exif?.gps?.longitude
  );

  // Calculate center and zoom from photos
  const center = photosWithGPS.length > 0
    ? {
        longitude: photosWithGPS[0].metadata.exif.gps.longitude,
        latitude: photosWithGPS[0].metadata.exif.gps.latitude,
      }
    : { longitude: -119.8138, latitude: 39.5296 }; // Default: Reno, NV

  return (
    <Stack gap="md">
      <div style={{ height: '600px', width: '100%', position: 'relative' }}>
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: center.longitude,
            latitude: center.latitude,
            zoom: 14,
          }}
          mapStyle="https://tiles.stadiamaps.com/styles/osm_bright.json"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />

          {photosWithGPS.map((photo) => (
            <Marker
              key={photo.id}
              longitude={photo.metadata.exif.gps.longitude}
              latitude={photo.metadata.exif.gps.latitude}
              anchor="bottom"
              onClick={() => {
                setSelectedPhoto(photo);
                onPhotoClick?.(photo);
              }}
            >
              <IconMapPin
                size={32}
                color="#ff0000"
                style={{ cursor: 'pointer' }}
              />
            </Marker>
          ))}
        </Map>

        {selectedPhoto && (
          <Card
            shadow="md"
            padding="md"
            radius="md"
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              maxWidth: 300,
              zIndex: 10,
            }}
          >
            <Card.Section>
              <Image
                src={selectedPhoto.thumbnailUrl || selectedPhoto.url}
                alt={selectedPhoto.description || 'Photo'}
                height={150}
                fit="cover"
              />
            </Card.Section>

            <Stack gap="xs" mt="md">
              <Text size="sm" fw={500}>
                {selectedPhoto.description || 'No description'}
              </Text>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedPhoto.formName}
                </Text>
              </Group>
            </Stack>
          </Card>
        )}
      </div>

      <Text size="sm" c="dimmed">
        Showing {photosWithGPS.length} photos with GPS data
      </Text>
    </Stack>
  );
}
```

### Step 3: Add Map/Grid Toggle to Photo Gallery (45 min)

Update `apps/web/app/photos/page.tsx`:

```typescript
'use client';

import { PageContainer } from '@/components/layout/page-container';
import { PhotoGalleryGrid } from '@/components/photos/photo-gallery-grid';
import { PhotoMapView } from '@/components/photos/photo-map-view';
import { PhotoFilters } from '@/components/photos/photo-filters';
import { useState } from 'react';
import { SegmentedControl, Group } from '@mantine/core';
import { IconGrid, IconMap } from '@tabler/icons-react';

export default function AllPhotosPage() {
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [filters, setFilters] = useState({
    projectId: null,
    formType: null,
    dateRange: null,
  });

  return (
    <PageContainer title="All Photos">
      <Group justify="space-between" mb="md">
        <PhotoFilters filters={filters} onChange={setFilters} />

        <SegmentedControl
          value={view}
          onChange={(value) => setView(value as 'grid' | 'map')}
          data={[
            {
              value: 'grid',
              label: (
                <Group gap="xs">
                  <IconGrid size={16} />
                  <span>Grid</span>
                </Group>
              ),
            },
            {
              value: 'map',
              label: (
                <Group gap="xs">
                  <IconMap size={16} />
                  <span>Map</span>
                </Group>
              ),
            },
          ]}
        />
      </Group>

      {view === 'grid' ? (
        <PhotoGalleryGrid filters={filters} />
      ) : (
        <PhotoMapView photos={[]} />
      )}
    </PageContainer>
  );
}
```

### Step 4: Add Clustering for Many Photos (45 min)

Create `apps/web/components/photos/photo-cluster-marker.tsx`:

```typescript
'use client';

import { Marker } from 'react-map-gl/maplibre';
import { Badge } from '@mantine/core';

interface PhotoClusterMarkerProps {
  longitude: number;
  latitude: number;
  count: number;
  onClick: () => void;
}

export function PhotoClusterMarker({
  longitude,
  latitude,
  count,
  onClick,
}: PhotoClusterMarkerProps) {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <Badge
        size="lg"
        radius="xl"
        color="blue"
        style={{ cursor: 'pointer' }}
        onClick={onClick}
      >
        {count}
      </Badge>
    </Marker>
  );
}
```

Update PhotoMapView with clustering logic:

```typescript
// Add clustering calculation
const clusterPhotos = (photos: Photo[], zoom: number) => {
  const clusterRadius = zoom > 12 ? 0.001 : 0.01;
  const clusters: Array<{ photos: Photo[]; center: [number, number] }> = [];

  // Simple clustering algorithm
  photos.forEach((photo) => {
    const gps = photo.metadata.exif.gps;
    const existingCluster = clusters.find((cluster) => {
      const [lng, lat] = cluster.center;
      return (
        Math.abs(lng - gps.longitude) < clusterRadius &&
        Math.abs(lat - gps.latitude) < clusterRadius
      );
    });

    if (existingCluster) {
      existingCluster.photos.push(photo);
    } else {
      clusters.push({
        photos: [photo],
        center: [gps.longitude, gps.latitude],
      });
    }
  });

  return clusters;
};
```

### Step 5: Test Map Integration (35 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access photo gallery
# Navigate to http://localhost:30102/photos
```

**Verify:**

- [ ] Map displays with free Stadia Maps tiles
- [ ] Photo markers appear at correct GPS locations
- [ ] Clicking marker shows photo preview
- [ ] Zoom controls work
- [ ] Fullscreen mode works
- [ ] Clustering activates when zoomed out
- [ ] Toggle between grid/map view works
- [ ] No Mapbox API calls in network tab

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/components/photos/__tests__/photo-map-view.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoMapView } from '../photo-map-view';

describe('PhotoMapView', () => {
  const mockPhotos = [
    {
      id: 'photo-1',
      url: 'https://example.com/photo1.jpg',
      metadata: {
        exif: {
          gps: {
            latitude: 39.5296,
            longitude: -119.8138,
          },
        },
      },
    },
  ];

  it('should render map with markers', () => {
    render(<PhotoMapView photos={mockPhotos} />);

    expect(screen.getByRole('img')).toBeInTheDocument(); // Map canvas
  });

  it('should display photo count with GPS', () => {
    render(<PhotoMapView photos={mockPhotos} />);

    expect(screen.getByText(/Showing 1 photos with GPS data/)).toBeInTheDocument();
  });

  it('should cluster photos when zoomed out', () => {
    // Test clustering logic
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test photo-map-view
```

**Screenshot:** Save to `evidence/ISSUE-125/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test photo-map-view
```

**Screenshot:** Save to `evidence/ISSUE-125/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/components/photos/photo-map-view.tsx
- apps/web/components/photos/photo-cluster-marker.tsx
- apps/web/components/photos/**tests**/photo-map-view.test.tsx

**Modify:**

- apps/web/app/photos/page.tsx (add map/grid toggle)
- apps/web/package.json (add maplibre-gl, react-map-gl)

## Verification Checklist

- [ ] MapLibre GL JS installed
- [ ] Map displays with free tiles (Stadia Maps)
- [ ] Photo markers show GPS locations
- [ ] Marker click shows photo preview
- [ ] Clustering works for dense photos
- [ ] Toggle grid/map view works
- [ ] No Mapbox API calls (cost $0)
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-125/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests)
  - coverage-report.png (>80%)
- screenshots/
  - map-view-markers.png (map with photo pins)
  - marker-preview.png (photo preview card)
  - clustering.png (clustered markers when zoomed out)
  - network-tab.png (no Mapbox API calls, only Stadia Maps)

## Troubleshooting

**Problem:** Map not displaying

- **Cause:** MapLibre CSS not imported
- **Solution:** Import 'maplibre-gl/dist/maplibre-gl.css' in component

**Problem:** Tiles not loading

- **Cause:** Tile provider URL incorrect or rate limited
- **Solution:** Verify Stadia Maps URL, switch to OpenStreetMap if needed

**Problem:** Markers not appearing

- **Cause:** GPS data null or undefined
- **Solution:** Filter photos with valid GPS before mapping

**Problem:** Clustering not working

- **Cause:** Cluster radius too small
- **Solution:** Adjust clusterRadius based on zoom level

## Success Criteria

- [ ] Map displays photo GPS locations
- [ ] Free tile provider used (no API billing)
- [ ] Markers clickable to preview photo
- [ ] Clustering reduces visual clutter
- [ ] Toggle between grid/map works
- [ ] Offline tile support planned (self-hosted)
- [ ] Performance <1s map render for 100 pins
- [ ] Tests pass with >80% coverage

## Time Estimate

**4 hours total:**

- Install MapLibre: 15 min
- Create PhotoMapView: 120 min
- Add map/grid toggle: 45 min
- Add clustering: 45 min
- Testing: 35 min

## Next Issue

**ISSUE-126:** Photo Annotations (4h)

- Prerequisites: ISSUE-125 complete (map view ready)
- Uses: Annotorious library (BSD license)
- Allows: Drawing annotations on photos
