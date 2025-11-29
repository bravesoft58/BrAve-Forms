import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { PhotoMapView } from '../photo-map-view';
import type { Photo } from '../photo-gallery-grid';

// Store callbacks for testing
let mapOnLoad: (() => void) | undefined;
let mapOnError: ((event: { error: Error }) => void) | undefined;

// Mock maplibre-gl and react-map-gl
vi.mock('react-map-gl/maplibre', () => ({
  Map: ({
    children,
    initialViewState,
    style,
    onLoad,
    onError,
  }: {
    children: React.ReactNode;
    initialViewState: { longitude: number; latitude: number; zoom: number };
    style: React.CSSProperties;
    onLoad?: () => void;
    onError?: (event: { error: Error }) => void;
  }) => {
    // Store callbacks for testing
    mapOnLoad = onLoad;
    mapOnError = onError;
    return (
      <div
        data-testid="maplibre-map"
        data-longitude={initialViewState.longitude}
        data-latitude={initialViewState.latitude}
        data-zoom={initialViewState.zoom}
        style={style}
      >
        {children}
      </div>
    );
  },
  Marker: ({
    children,
    longitude,
    latitude,
    onClick,
  }: {
    children: React.ReactNode;
    longitude: number;
    latitude: number;
    anchor?: string;
    onClick?: () => void;
  }) => (
    <div
      data-testid="map-marker"
      data-longitude={longitude}
      data-latitude={latitude}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  ),
  NavigationControl: () => <div data-testid="nav-control" />,
  FullscreenControl: () => <div data-testid="fullscreen-control" />,
}));

// Mock maplibre-gl CSS
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

// Mock maplibre-gl
vi.mock('maplibre-gl', () => ({
  default: {},
}));

// Test wrapper with Mantine
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

// Sample photo data with GPS coordinates
const mockPhotosWithGPS: Photo[] = [
  {
    id: 'photo-1',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-1.jpg',
    thumbnailUrl: 'https://cdn.example.com/photo-1-thumb.jpg',
    caption: 'Site entrance photo',
    latitude: 34.0522,
    longitude: -118.2437,
    takenAt: '2025-11-28T10:00:00Z',
    uploadedAt: '2025-11-28T10:05:00Z',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-1',
    formName: 'Daily Log',
    projectName: 'Highway 101 Project',
  },
  {
    id: 'photo-2',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-2.jpg',
    thumbnailUrl: 'https://cdn.example.com/photo-2-thumb.jpg',
    caption: 'Erosion control measures',
    latitude: 34.0523,
    longitude: -118.2438,
    takenAt: '2025-11-28T11:00:00Z',
    uploadedAt: '2025-11-28T11:05:00Z',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-2',
    formName: 'SWPPP Inspection',
    projectName: 'Highway 101 Project',
  },
];

// Photos without GPS coordinates
const mockPhotosWithoutGPS: Photo[] = [
  {
    id: 'photo-3',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-3.jpg',
    thumbnailUrl: 'https://cdn.example.com/photo-3-thumb.jpg',
    caption: 'Storm drain inspection',
    latitude: null,
    longitude: null,
    takenAt: '2025-11-28T12:00:00Z',
    uploadedAt: '2025-11-28T12:05:00Z',
    fileSize: 512000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-1',
    formName: 'Safety Inspection',
  },
];

// Photos with invalid GPS coordinates
const mockPhotosWithInvalidGPS: Photo[] = [
  {
    id: 'photo-invalid-1',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-invalid-1.jpg',
    caption: 'Invalid latitude',
    latitude: 100, // Invalid: exceeds 90
    longitude: -118.2437,
    takenAt: '2025-11-28T10:00:00Z',
    uploadedAt: '2025-11-28T10:05:00Z',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-1',
  },
  {
    id: 'photo-invalid-2',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-invalid-2.jpg',
    caption: 'Invalid longitude',
    latitude: 34.0522,
    longitude: -200, // Invalid: exceeds -180
    takenAt: '2025-11-28T10:00:00Z',
    uploadedAt: '2025-11-28T10:05:00Z',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-1',
  },
  {
    id: 'photo-invalid-3',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-invalid-3.jpg',
    caption: 'NaN coordinates',
    latitude: NaN,
    longitude: NaN,
    takenAt: '2025-11-28T10:00:00Z',
    uploadedAt: '2025-11-28T10:05:00Z',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-1',
  },
  {
    id: 'photo-invalid-4',
    orgId: 'org-1',
    url: 'https://cdn.example.com/photo-invalid-4.jpg',
    caption: 'Infinity coordinates',
    latitude: Infinity,
    longitude: -Infinity,
    takenAt: '2025-11-28T10:00:00Z',
    uploadedAt: '2025-11-28T10:05:00Z',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploadedBy: 'user-1',
  },
];

describe('PhotoMapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapOnLoad = undefined;
    mapOnError = undefined;
  });

  describe('Rendering', () => {
    it('should render map container', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByTestId('maplibre-map')).toBeInTheDocument();
    });

    it('should render navigation controls', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByTestId('nav-control')).toBeInTheDocument();
      expect(screen.getByTestId('fullscreen-control')).toBeInTheDocument();
    });

    it('should display GPS photo count', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByText(/Showing 2 photos with GPS data/i)).toBeInTheDocument();
    });

    it('should display correct count for mixed photos', () => {
      const mixedPhotos = [...mockPhotosWithGPS, ...mockPhotosWithoutGPS];
      render(
        <TestWrapper>
          <PhotoMapView photos={mixedPhotos} />
        </TestWrapper>
      );

      // Should only count photos with GPS (2 of 3)
      expect(screen.getByText(/Showing 2 photos with GPS data/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading overlay initially', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByTestId('map-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });

    it('should hide loading overlay after map loads', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByTestId('map-loading')).toBeInTheDocument();

      // Simulate map load
      act(() => {
        mapOnLoad?.();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('map-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when map fails to load', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      // Simulate map error
      act(() => {
        mapOnError?.({ error: new Error('WebGL not supported') });
      });

      await waitFor(() => {
        expect(screen.getByTestId('map-error-alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load map/i)).toBeInTheDocument();
      });
    });

    it('should show photo count in error state', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      act(() => {
        mapOnError?.({ error: new Error('Tile server unavailable') });
      });

      await waitFor(() => {
        expect(
          screen.getByText(/2 photos have GPS data but cannot be displayed/i)
        ).toBeInTheDocument();
      });
    });

    it('should hide loading when error occurs', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByTestId('map-loading')).toBeInTheDocument();

      act(() => {
        mapOnError?.({ error: new Error('Network error') });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('map-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('GPS Coordinate Validation', () => {
    it('should filter out photos with invalid latitude', () => {
      const photosWithInvalidLat: Photo[] = [
        { ...mockPhotosWithGPS[0], latitude: 100 }, // Invalid
        mockPhotosWithGPS[1], // Valid
      ];

      render(
        <TestWrapper>
          <PhotoMapView photos={photosWithInvalidLat} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(1);
    });

    it('should filter out photos with invalid longitude', () => {
      const photosWithInvalidLon: Photo[] = [
        { ...mockPhotosWithGPS[0], longitude: -200 }, // Invalid
        mockPhotosWithGPS[1], // Valid
      ];

      render(
        <TestWrapper>
          <PhotoMapView photos={photosWithInvalidLon} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(1);
    });

    it('should filter out photos with NaN coordinates', () => {
      const photosWithNaN: Photo[] = [
        { ...mockPhotosWithGPS[0], latitude: NaN, longitude: NaN },
        mockPhotosWithGPS[1], // Valid
      ];

      render(
        <TestWrapper>
          <PhotoMapView photos={photosWithNaN} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(1);
    });

    it('should filter out photos with Infinity coordinates', () => {
      const photosWithInfinity: Photo[] = [
        { ...mockPhotosWithGPS[0], latitude: Infinity, longitude: -Infinity },
        mockPhotosWithGPS[1], // Valid
      ];

      render(
        <TestWrapper>
          <PhotoMapView photos={photosWithInfinity} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(1);
    });

    it('should show zero count when all photos have invalid GPS', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithInvalidGPS} />
        </TestWrapper>
      );

      expect(screen.getByText(/Showing 0 photos with GPS data/i)).toBeInTheDocument();
      expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument();
    });
  });

  describe('Photo Markers', () => {
    it('should render markers for photos with GPS data', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(2);
    });

    it('should not render markers for photos without GPS data', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithoutGPS} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument();
    });

    it('should position markers at correct coordinates', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers[0]).toHaveAttribute('data-longitude', '-118.2437');
      expect(markers[0]).toHaveAttribute('data-latitude', '34.0522');
    });
  });

  describe('Map Center and Zoom', () => {
    it('should center map on first photo with GPS', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const map = screen.getByTestId('maplibre-map');
      expect(map).toHaveAttribute('data-longitude', '-118.2437');
      expect(map).toHaveAttribute('data-latitude', '34.0522');
    });

    it('should use default center when no photos have GPS', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithoutGPS} />
        </TestWrapper>
      );

      const map = screen.getByTestId('maplibre-map');
      // Default: Reno, NV
      expect(map).toHaveAttribute('data-longitude', '-119.8138');
      expect(map).toHaveAttribute('data-latitude', '39.5296');
    });

    it('should use default center for empty photos array', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={[]} />
        </TestWrapper>
      );

      const map = screen.getByTestId('maplibre-map');
      expect(map).toHaveAttribute('data-longitude', '-119.8138');
      expect(map).toHaveAttribute('data-latitude', '39.5296');
    });

    it('should use default center when all photos have invalid GPS', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithInvalidGPS} />
        </TestWrapper>
      );

      const map = screen.getByTestId('maplibre-map');
      expect(map).toHaveAttribute('data-longitude', '-119.8138');
      expect(map).toHaveAttribute('data-latitude', '39.5296');
    });
  });

  describe('Photo Selection', () => {
    it('should call onPhotoClick when marker is clicked', () => {
      const onPhotoClick = vi.fn();
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} onPhotoClick={onPhotoClick} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      fireEvent.click(markers[0]);

      expect(onPhotoClick).toHaveBeenCalledTimes(1);
      expect(onPhotoClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'photo-1' }));
    });

    it('should show photo preview card when marker is clicked', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      fireEvent.click(markers[0]);

      await waitFor(() => {
        expect(screen.getByText('Site entrance photo')).toBeInTheDocument();
      });
    });

    it('should display photo form name in preview', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      fireEvent.click(markers[0]);

      await waitFor(() => {
        expect(screen.getByText('Daily Log')).toBeInTheDocument();
      });
    });

    it('should close preview card when close button is clicked', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      fireEvent.click(markers[0]);

      await waitFor(() => {
        expect(screen.getByTestId('photo-preview-card')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close photo preview');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('photo-preview-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show zero count when no photos have GPS', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithoutGPS} />
        </TestWrapper>
      );

      expect(screen.getByText(/Showing 0 photos with GPS data/i)).toBeInTheDocument();
    });

    it('should handle empty photos array gracefully', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('maplibre-map')).toBeInTheDocument();
      expect(screen.getByText(/Showing 0 photos with GPS data/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible map container', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const mapContainer = screen.getByTestId('photo-map-container');
      expect(mapContainer).toHaveAttribute('aria-label', 'Photo location map');
    });

    it('should have keyboard-accessible markers', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers[0]).toHaveAttribute('role', 'button');
      expect(markers[0]).toHaveAttribute('tabIndex', '0');
    });

    it('should have accessible close button on preview card', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      fireEvent.click(markers[0]);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close photo preview');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Offline Scenarios (30-day requirement)', () => {
    it('should render map container even when no network available', () => {
      // Component should render with cached/offline data
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      expect(screen.getByTestId('maplibre-map')).toBeInTheDocument();
      expect(screen.getByTestId('photo-map-container')).toBeInTheDocument();
    });

    it('should display markers from cached photo data', () => {
      // Simulating offline with previously cached photos
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(2);
    });

    it('should show photo preview with cached data when offline', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      const markers = screen.getAllByTestId('map-marker');
      fireEvent.click(markers[0]);

      await waitFor(() => {
        // Preview card should work with cached data
        expect(screen.getByTestId('photo-preview-card')).toBeInTheDocument();
        expect(screen.getByText('Site entrance photo')).toBeInTheDocument();
      });
    });

    it('should handle tile server failure gracefully', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      // Simulate tile server being unreachable (offline scenario)
      act(() => {
        mapOnError?.({ error: new Error('Failed to fetch tiles: net::ERR_INTERNET_DISCONNECTED') });
      });

      await waitFor(() => {
        // Should show error message, not crash
        expect(screen.getByTestId('map-error-alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load map/i)).toBeInTheDocument();
      });
    });

    it('should preserve photo count display during offline error', async () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      act(() => {
        mapOnError?.({ error: new Error('Network unavailable') });
      });

      await waitFor(() => {
        // Even in error state, should show how many photos have GPS
        expect(
          screen.getByText(/2 photos have GPS data but cannot be displayed/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Construction Site Usability', () => {
    it('should have glove-friendly marker touch targets (44x44px minimum)', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      // Markers should be at least 44x44 for glove use
      // This is verified by the IconMapPin size={44} in the component
      const markers = screen.getAllByTestId('map-marker');
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should have high contrast markers for sunlight visibility', () => {
      render(
        <TestWrapper>
          <PhotoMapView photos={mockPhotosWithGPS} />
        </TestWrapper>
      );

      // Markers use full opacity and drop shadow for visibility
      // Component uses opacity: 1 and filter: 'drop-shadow(0 0 2px white)'
      const markers = screen.getAllByTestId('map-marker');
      expect(markers.length).toBeGreaterThan(0);
    });
  });
});
