# ISSUE-104: Photo Gallery Viewer

**Sprint:** Sprint 4 | **Phase:** 1 - QR Inspector Portal | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-103 (Form submission viewer)
**Status:** COMPLETE

## What You'll Do

Create interactive photo gallery with lightbox, GPS map, and metadata display for inspector portal.

## Prerequisites

- [ ] ISSUE-103 complete (Submission viewer functional)
- [ ] Inspector portal accessible at /inspector/[token]
- [ ] Web frontend running at http://localhost:30102
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Install Photo Gallery Dependencies (5 min)

```bash
cd apps/web
pnpm add react-leaflet leaflet
pnpm add -D @types/leaflet
```

### Step 2: Create Photo Lightbox Component (40 min)

Create `apps/web/components/Inspector/PhotoLightbox.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { SubmissionPhoto } from '@/lib/api/inspector-submissions';

interface PhotoLightboxProps {
  photo: SubmissionPhoto;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function PhotoLightbox({
  photo,
  onClose,
  onNext,
  onPrevious,
}: PhotoLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // Max 3x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `photo-${photo.id}.jpg`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
        aria-label="Close"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Previous Button */}
      {onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 text-white hover:text-gray-300"
          aria-label="Previous"
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 text-white hover:text-gray-300"
          aria-label="Next"
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Photo Container */}
      <div
        className="relative max-w-7xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.caption || 'Photo'}
          className="max-w-full max-h-screen object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        />

        {/* Controls Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 rounded-lg px-6 py-3 flex items-center gap-4">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="text-white hover:text-gray-300 disabled:text-gray-600"
            aria-label="Zoom Out"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
              />
            </svg>
          </button>

          {/* Zoom Level */}
          <span className="text-white text-sm">{Math.round(zoomLevel * 100)}%</span>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="text-white hover:text-gray-300 disabled:text-gray-600"
            aria-label="Zoom In"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
              />
            </svg>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="text-white hover:text-gray-300 ml-4"
            aria-label="Download"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>

        {/* Metadata */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg px-4 py-2 max-w-md">
          {photo.caption && (
            <p className="text-white text-sm mb-2">{photo.caption}</p>
          )}
          <p className="text-gray-300 text-xs">
            Taken: {new Date(photo.takenAt).toLocaleString()}
          </p>
          {photo.gpsLatitude && photo.gpsLongitude && (
            <p className="text-gray-300 text-xs">
              GPS: {photo.gpsLatitude.toFixed(6)}, {photo.gpsLongitude.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Create GPS Map Component (40 min)

Create `apps/web/components/Inspector/GPSMap.tsx`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GPSMapProps {
  latitude: number;
  longitude: number;
  caption?: string;
}

export function GPSMap({ latitude, longitude, caption }: GPSMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 15);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map);

    if (caption) {
      marker.bindPopup(caption).openPopup();
    }

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, caption]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-64 rounded-lg border border-gray-300"
    />
  );
}
```

### Step 4: Create Photo Gallery Component (30 min)

Create `apps/web/components/Inspector/PhotoGallery.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { SubmissionPhoto } from '@/lib/api/inspector-submissions';
import { PhotoLightbox } from './PhotoLightbox';
import { GPSMap } from './GPSMap';

interface PhotoGalleryProps {
  photos: SubmissionPhoto[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showMap, setShowMap] = useState<SubmissionPhoto | null>(null);

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! + 1) % photos.length);
  };

  const handlePrevious = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! - 1 + photos.length) % photos.length);
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No photos available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photo Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Photos ({photos.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="space-y-2">
              <div className="relative group">
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedPhotoIndex(index)}
                />

                {/* Overlay Icons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                    />
                  </svg>
                </div>

                {/* GPS Indicator */}
                {photo.gpsLatitude && photo.gpsLongitude && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMap(photo);
                    }}
                    className="absolute top-2 right-2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700"
                    aria-label="Show on map"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Caption */}
              {photo.caption && (
                <p className="text-xs text-gray-600 line-clamp-2">{photo.caption}</p>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-500">
                {new Date(photo.takenAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* GPS Map Modal */}
      {showMap && showMap.gpsLatitude && showMap.gpsLongitude && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-75 flex items-center justify-center"
          onClick={() => setShowMap(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Photo Location</h3>
              <button
                onClick={() => setShowMap(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <GPSMap
              latitude={showMap.gpsLatitude}
              longitude={showMap.gpsLongitude}
              caption={showMap.caption}
            />

            <div className="mt-4 text-sm text-gray-600">
              <p>
                Coordinates: {showMap.gpsLatitude.toFixed(6)},{' '}
                {showMap.gpsLongitude.toFixed(6)}
              </p>
              <p>Taken: {new Date(showMap.takenAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          photo={photos[selectedPhotoIndex]}
          onClose={() => setSelectedPhotoIndex(null)}
          onNext={photos.length > 1 ? handleNext : undefined}
          onPrevious={photos.length > 1 ? handlePrevious : undefined}
        />
      )}
    </div>
  );
}
```

### Step 5: Add Photo Gallery to Submission Detail (5 min)

Modify `apps/web/app/inspector/[token]/submissions/[id]/page.tsx`:

```typescript
// Add import at top
import { PhotoGallery } from '@/components/Inspector/PhotoGallery';

// Replace the Photos section (around line 60) with:
{submission.photos.length > 0 && (
  <PhotoGallery photos={submission.photos} />
)}
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/__tests__/photo-gallery.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoGallery } from '@/components/Inspector/PhotoGallery';
import { PhotoLightbox } from '@/components/Inspector/PhotoLightbox';
import { SubmissionPhoto } from '@/lib/api/inspector-submissions';

jest.mock('@/components/Inspector/GPSMap', () => ({
  GPSMap: () => <div data-testid="gps-map">GPS Map</div>,
}));

describe('PhotoGallery', () => {
  const mockPhotos: SubmissionPhoto[] = [
    {
      id: 'photo-1',
      url: 'https://example.com/photo1.jpg',
      thumbnailUrl: 'https://example.com/photo1-thumb.jpg',
      caption: 'Site entrance',
      gpsLatitude: 40.7128,
      gpsLongitude: -74.006,
      takenAt: new Date('2025-10-20T10:00:00Z'),
    },
    {
      id: 'photo-2',
      url: 'https://example.com/photo2.jpg',
      thumbnailUrl: 'https://example.com/photo2-thumb.jpg',
      caption: 'BMP installation',
      gpsLatitude: 40.7138,
      gpsLongitude: -74.007,
      takenAt: new Date('2025-10-20T11:00:00Z'),
    },
  ];

  it('should render photo grid', () => {
    render(<PhotoGallery photos={mockPhotos} />);

    expect(screen.getByText('Photos (2)')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('should display photo captions', () => {
    render(<PhotoGallery photos={mockPhotos} />);

    expect(screen.getByText('Site entrance')).toBeInTheDocument();
    expect(screen.getByText('BMP installation')).toBeInTheDocument();
  });

  it('should show GPS indicator for photos with GPS data', () => {
    render(<PhotoGallery photos={mockPhotos} />);

    const gpsButtons = screen.getAllByLabelText('Show on map');
    expect(gpsButtons).toHaveLength(2);
  });

  it('should open lightbox when photo clicked', () => {
    render(<PhotoGallery photos={mockPhotos} />);

    const photos = screen.getAllByRole('img');
    fireEvent.click(photos[0]);

    // Lightbox should be rendered (tested separately)
  });

  it('should show "No photos" message when empty', () => {
    render(<PhotoGallery photos={[]} />);

    expect(screen.getByText('No photos available')).toBeInTheDocument();
  });

  it('should open GPS map modal when GPS button clicked', () => {
    render(<PhotoGallery photos={mockPhotos} />);

    const gpsButtons = screen.getAllByLabelText('Show on map');
    fireEvent.click(gpsButtons[0]);

    expect(screen.getByTestId('gps-map')).toBeInTheDocument();
    expect(screen.getByText('Photo Location')).toBeInTheDocument();
  });
});

describe('PhotoLightbox', () => {
  const mockPhoto: SubmissionPhoto = {
    id: 'photo-1',
    url: 'https://example.com/photo1.jpg',
    thumbnailUrl: 'https://example.com/photo1-thumb.jpg',
    caption: 'Test photo',
    gpsLatitude: 40.7128,
    gpsLongitude: -74.006,
    takenAt: new Date('2025-10-20T10:00:00Z'),
  };

  it('should render photo in lightbox', () => {
    render(<PhotoLightbox photo={mockPhoto} onClose={jest.fn()} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockPhoto.url);
  });

  it('should display caption and metadata', () => {
    render(<PhotoLightbox photo={mockPhoto} onClose={jest.fn()} />);

    expect(screen.getByText('Test photo')).toBeInTheDocument();
    expect(screen.getByText(/GPS:/)).toBeInTheDocument();
    expect(screen.getByText(/Taken:/)).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<PhotoLightbox photo={mockPhoto} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onNext when next button clicked', () => {
    const onNext = jest.fn();
    render(
      <PhotoLightbox photo={mockPhoto} onClose={jest.fn()} onNext={onNext} />
    );

    const nextButton = screen.getByLabelText('Next');
    fireEvent.click(nextButton);

    expect(onNext).toHaveBeenCalled();
  });

  it('should call onPrevious when previous button clicked', () => {
    const onPrevious = jest.fn();
    render(
      <PhotoLightbox
        photo={mockPhoto}
        onClose={jest.fn()}
        onPrevious={onPrevious}
      />
    );

    const prevButton = screen.getByLabelText('Previous');
    fireEvent.click(prevButton);

    expect(onPrevious).toHaveBeenCalled();
  });

  it('should zoom in when zoom in button clicked', () => {
    render(<PhotoLightbox photo={mockPhoto} onClose={jest.fn()} />);

    const zoomInButton = screen.getByLabelText('Zoom In');
    fireEvent.click(zoomInButton);

    expect(screen.getByText('125%')).toBeInTheDocument();
  });

  it('should zoom out when zoom out button clicked', () => {
    render(<PhotoLightbox photo={mockPhoto} onClose={jest.fn()} />);

    const zoomOutButton = screen.getByLabelText('Zoom Out');
    fireEvent.click(zoomOutButton);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should download photo when download button clicked', () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    render(<PhotoLightbox photo={mockPhoto} onClose={jest.fn()} />);

    const downloadButton = screen.getByLabelText('Download');
    fireEvent.click(downloadButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test photo-gallery
```

**Screenshot:** Save failing test to `evidence/ISSUE-104/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-5.

Run tests:

```bash
pnpm test photo-gallery
```

Expected: All tests pass

**Screenshot:** Save passing tests to `evidence/ISSUE-104/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/components/Inspector/PhotoLightbox.tsx
- apps/web/components/Inspector/GPSMap.tsx
- apps/web/components/Inspector/PhotoGallery.tsx
- apps/web/**tests**/photo-gallery.test.tsx

**Modify:**

- apps/web/app/inspector/[token]/submissions/[id]/page.tsx (use PhotoGallery)

## Verification Checklist

- [ ] Photo gallery grid renders
- [ ] Lightbox opens on photo click
- [ ] Zoom in/out functional
- [ ] Download button works
- [ ] GPS map displays location
- [ ] Next/Previous navigation works
- [ ] Keyboard shortcuts work (Escape, Arrow keys)
- [ ] Tests passing (15+ tests)
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-104/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests - 15+ tests)
  - coverage-report.png (>80% coverage)
- ui/
  - photo-grid.png (gallery grid view)
  - lightbox.png (photo lightbox with zoom)
  - gps-map.png (GPS map modal)
- code/
  - photo-gallery-component.png (PhotoGallery implementation)

## Troubleshooting

**Problem:** Leaflet map not rendering

- **Cause:** CSS not imported
- **Solution:** Import 'leaflet/dist/leaflet.css' in GPSMap component

**Problem:** Marker icon not showing

- **Cause:** Leaflet default icon path issue
- **Solution:** Configure icon path in useEffect

**Problem:** Lightbox not closing on backdrop click

- **Cause:** Event propagation not stopped
- **Solution:** Add e.stopPropagation() to inner div

**Problem:** Zoom buttons not working

- **Cause:** Transform not applying
- **Solution:** Ensure style={{ transform: `scale(${zoomLevel})` }}

## Success Criteria

- [ ] Photo grid displays thumbnails
- [ ] Lightbox opens with full-size photo
- [ ] Zoom in/out functional (0.5x to 3x)
- [ ] Download original photo works
- [ ] GPS map shows location (if EXIF data exists)
- [ ] Next/Previous navigation works
- [ ] Keyboard shortcuts functional
- [ ] Tests pass with >80% coverage
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Install dependencies: 5 min
- Create photo lightbox: 40 min
- Create GPS map: 40 min
- Create photo gallery: 30 min
- Add to submission detail: 5 min

## Next Issue

**ISSUE-105:** QR Portal Tests (2h)

- Prerequisites: This issue complete (all QR portal features implemented)
- Creates: Comprehensive test suite for QR portal
- Validates: Token security, read-only enforcement, mobile tablet layout
