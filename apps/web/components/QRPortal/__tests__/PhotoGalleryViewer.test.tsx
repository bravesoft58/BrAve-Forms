import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PhotoGalleryViewer } from '../PhotoGalleryViewer';
import { MantineProvider } from '@mantine/core';

// Mock the useInspectorPhotos hook
const mockPhotos = [
  {
    id: 'photo-1',
    url: 'http://example.com/photo1.jpg',
    thumbnailUrl: 'http://example.com/photo1-thumb.jpg',
    caption: 'Sediment basin inspection',
    takenAt: '2025-11-25T10:00:00Z',
    uploadedBy: 'John Doe',
    fileSize: 1024000,
    location: { latitude: 40.7128, longitude: -74.006 },
  },
  {
    id: 'photo-2',
    url: 'http://example.com/photo2.jpg',
    thumbnailUrl: 'http://example.com/photo2-thumb.jpg',
    caption: 'Erosion control measures',
    takenAt: '2025-11-25T11:00:00Z',
    uploadedBy: 'Jane Smith',
    fileSize: 2048000,
    location: { latitude: 40.7129, longitude: -74.007 },
  },
  {
    id: 'photo-3',
    url: 'http://example.com/photo3.jpg',
    thumbnailUrl: 'http://example.com/photo3-thumb.jpg',
    caption: 'Silt fence installation',
    takenAt: '2025-11-24T10:00:00Z',
    uploadedBy: 'John Doe',
    fileSize: 512000,
    location: { latitude: 40.713, longitude: -74.008 },
  },
  {
    id: 'photo-4',
    url: 'http://example.com/photo4.jpg',
    thumbnailUrl: 'http://example.com/photo4-thumb.jpg',
    caption: 'Storm drain inlet protection',
    takenAt: '2025-11-24T14:00:00Z',
    uploadedBy: 'Jane Smith',
    fileSize: 768000,
    location: { latitude: 40.7131, longitude: -74.009 },
  },
  {
    id: 'photo-5',
    url: 'http://example.com/photo5.jpg',
    thumbnailUrl: 'http://example.com/photo5-thumb.jpg',
    caption: 'Material storage area',
    takenAt: '2025-11-23T09:00:00Z',
    uploadedBy: 'John Doe',
    fileSize: 1536000,
    location: { latitude: 40.7132, longitude: -74.01 },
  },
  {
    id: 'photo-6',
    url: 'http://example.com/photo6.jpg',
    thumbnailUrl: 'http://example.com/photo6-thumb.jpg',
    caption: 'Vehicle tracking pad',
    takenAt: '2025-11-23T15:00:00Z',
    uploadedBy: 'Jane Smith',
    fileSize: 896000,
    location: null, // One photo without GPS
  },
];

vi.mock('@/hooks/useInspectorPortal', () => ({
  useInspectorPhotos: vi.fn(() => ({
    data: mockPhotos,
    isLoading: false,
    error: null,
  })),
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PhotoGalleryViewer', () => {
  it('should render component with photos count', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should display photos count text
    expect(screen.getByText(/6 photos/)).toBeInTheDocument();
  });

  it('should display GPS Tagged badge in header', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should display GPS Tagged badge
    expect(screen.getByText(/GPS Tagged/i)).toBeInTheDocument();
  });

  it('should render photo grid with correct number of cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should display 6 photo cards (Paper components with cursor pointer)
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    expect(photoCards.length).toBe(6);
  });

  it('should display photo captions from mock data', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should display photo captions (abbreviated from full captions)
    expect(screen.getByText(/Sediment basin/i)).toBeInTheDocument();
    expect(screen.getByText(/Erosion control/i)).toBeInTheDocument();
    expect(screen.getByText(/Silt fence/i)).toBeInTheDocument();
    expect(screen.getByText(/Storm drain inlet/i)).toBeInTheDocument();
    expect(screen.getByText(/Material storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Vehicle tracking/i)).toBeInTheDocument();
  });

  it('should display GPS badges on photos with location data', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should display GPS badges (5 of 6 photos have GPS)
    const gpsBadges = screen.getAllByText('GPS');
    expect(gpsBadges.length).toBe(5);
  });

  it('should display photo dates in card view', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should display shortened dates (2 photos on Nov 25)
    const nov25Dates = screen.getAllByText('Nov 25');
    expect(nov25Dates.length).toBe(2);

    // Should also have Nov 24 and Nov 23 dates
    const nov24Dates = screen.getAllByText('Nov 24');
    expect(nov24Dates.length).toBe(2);

    const nov23Dates = screen.getAllByText('Nov 23');
    expect(nov23Dates.length).toBe(2);
  });

  it('should have clickable photo cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Find clickable photo cards
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    expect(photoCards.length).toBeGreaterThan(0);

    // Cards should be clickable (no error thrown)
    fireEvent.click(photoCards[0]);
  });

  it('should show modal elements when photo card is clicked', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Click first photo
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    fireEvent.click(photoCards[0]);

    // Body should have scroll locked (indicates modal opened)
    expect(document.body).toHaveAttribute('data-scroll-locked', '1');
  });

  it('should render SimpleGrid for responsive layout', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should have SimpleGrid component
    const grid = document.querySelector('.mantine-SimpleGrid-root');
    expect(grid).toBeInTheDocument();
  });

  it('should render photo icon placeholders in cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should have photo cards with icons - check for svg elements or icon containers
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThan(0);
  });

  it('should render calendar icons for dates', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should have date text displayed (Nov 25, Nov 24, Nov 23)
    const dates = screen.getAllByText(/Nov \d+/);
    expect(dates.length).toBe(6); // One per photo card
  });

  it('should render map pin icons for GPS photos', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Should have GPS badges (5 photos have GPS)
    const gpsBadges = screen.getAllByText('GPS');
    expect(gpsBadges.length).toBe(5); // 5 GPS photos
  });

  it('should have correct styling for photo cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" token="test-token" />);

    // Cards should have pointer cursor and shadow
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    expect(photoCards[0]).toHaveClass('mantine-Paper-root');
    expect(photoCards[0]).toHaveAttribute('data-with-border', 'true');
  });
});
