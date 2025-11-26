import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PhotoGalleryViewer } from '../PhotoGalleryViewer';
import { MantineProvider } from '@mantine/core';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PhotoGalleryViewer', () => {
  it('should render component with photos count', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should display photos count text (may be broken into parts in DOM)
    expect(screen.getByText(/6/)).toBeInTheDocument();
    expect(screen.getByText(/photo/)).toBeInTheDocument();
  });

  it('should display GPS Tagged badge in header', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should display GPS Tagged badge
    expect(screen.getByText(/GPS Tagged/i)).toBeInTheDocument();
  });

  it('should render photo grid with correct number of cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should display 6 photo cards (Paper components with cursor pointer)
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    expect(photoCards.length).toBe(6);
  });

  it('should display photo captions from mock data', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should display photo captions
    expect(screen.getByText(/Sediment basin/i)).toBeInTheDocument();
    expect(screen.getByText(/Erosion control measures/i)).toBeInTheDocument();
    expect(screen.getByText(/Silt fence installation/i)).toBeInTheDocument();
    expect(screen.getByText(/Storm drain inlet/i)).toBeInTheDocument();
    expect(screen.getByText(/Material storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Vehicle tracking/i)).toBeInTheDocument();
  });

  it('should display GPS badges on photos with location data', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should display GPS badges (5 of 6 photos have GPS)
    const gpsBadges = screen.getAllByText('GPS');
    expect(gpsBadges.length).toBe(5);
  });

  it('should display photo dates in card view', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

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
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Find clickable photo cards
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    expect(photoCards.length).toBeGreaterThan(0);

    // Cards should be clickable (no error thrown)
    fireEvent.click(photoCards[0]);
  });

  it('should show modal elements when photo card is clicked', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Click first photo
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    fireEvent.click(photoCards[0]);

    // Body should have scroll locked (indicates modal opened)
    expect(document.body).toHaveAttribute('data-scroll-locked', '1');
  });

  it('should render SimpleGrid for responsive layout', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should have SimpleGrid component
    const grid = document.querySelector('.mantine-SimpleGrid-root');
    expect(grid).toBeInTheDocument();
  });

  it('should render photo icon placeholders in cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should have photo icons as placeholders
    const photoIcons = document.querySelectorAll('.tabler-icon-photo');
    expect(photoIcons.length).toBeGreaterThan(0);
  });

  it('should render calendar icons for dates', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should have calendar icons next to dates
    const calendarIcons = document.querySelectorAll('.tabler-icon-calendar');
    expect(calendarIcons.length).toBe(6); // One per photo card
  });

  it('should render map pin icons for GPS photos', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Should have map pin icons (header badge + 5 photo GPS badges)
    const mapPinIcons = document.querySelectorAll('.tabler-icon-map-pin');
    expect(mapPinIcons.length).toBe(6); // Header + 5 GPS photos
  });

  it('should have correct styling for photo cards', () => {
    renderWithMantine(<PhotoGalleryViewer projectId="project_123" />);

    // Cards should have pointer cursor and shadow
    const photoCards = document.querySelectorAll('.mantine-Paper-root[style*="cursor: pointer"]');
    expect(photoCards[0]).toHaveClass('mantine-Paper-root');
    expect(photoCards[0]).toHaveAttribute('data-with-border', 'true');
  });
});
