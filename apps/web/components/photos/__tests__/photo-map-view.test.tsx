import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { PhotoMapView } from '../photo-map-view';
import type { Photo } from '../photo-gallery-grid';

// Mock maplibre-gl and react-map-gl
vi.mock('react-map-gl/maplibre', () => ({
  Map: ({
    children,
    initialViewState,
    style,
  }: {
    children: React.ReactNode;
    initialViewState: { longitude: number; latitude: number; zoom: number };
    style: React.CSSProperties;
  }) => (
    <div
      data-testid="maplibre-map"
      data-longitude={initialViewState.longitude}
      data-latitude={initialViewState.latitude}
      data-zoom={initialViewState.zoom}
      style={style}
    >
      {children}
    </div>
  ),
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

describe('PhotoMapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
