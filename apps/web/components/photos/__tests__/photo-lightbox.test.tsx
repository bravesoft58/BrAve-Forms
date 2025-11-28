import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { PhotoLightbox } from '../photo-lightbox';
import type { Photo } from '../photo-gallery-grid';

// Mock yet-another-react-lightbox
vi.mock('yet-another-react-lightbox', () => ({
  default: ({
    open,
    close,
    slides,
    index,
    render: renderProp,
  }: {
    open: boolean;
    close: () => void;
    slides: Array<{ src: string; alt: string }>;
    index: number;
    render?: { slideFooter?: (props: { slide: { src: string } }) => React.ReactNode };
  }) => {
    if (!open) return null;
    // Handle empty slides array gracefully
    if (!slides || slides.length === 0) return null;
    const currentSlide = slides[index];
    if (!currentSlide) return null;
    return (
      <div data-testid="lightbox-container" role="dialog" aria-modal="true">
        <button data-testid="close-button" onClick={close} aria-label="Close">
          Close
        </button>
        <img src={currentSlide.src} alt={currentSlide.alt} data-testid="lightbox-image" />
        {renderProp?.slideFooter?.({ slide: currentSlide })}
        <button data-testid="prev-button" aria-label="Previous">
          Previous
        </button>
        <button data-testid="next-button" aria-label="Next">
          Next
        </button>
      </div>
    );
  },
}));

// Mock zoom plugin
vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({
  default: {},
}));

// Mock CSS import
vi.mock('yet-another-react-lightbox/styles.css', () => ({}));

// Test wrapper with Mantine
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

// Sample photo data matching our Photo interface
const mockPhotos: Photo[] = [
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

describe('PhotoLightbox', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render lightbox when open is true', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByTestId('lightbox-container')).toBeInTheDocument();
    });

    it('should not render lightbox when open is false', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={false} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('lightbox-container')).not.toBeInTheDocument();
    });

    it('should display full-size photo at correct index', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={1} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const image = screen.getByTestId('lightbox-image');
      expect(image).toHaveAttribute('src', 'https://cdn.example.com/photo-2.jpg');
      expect(image).toHaveAttribute('alt', 'Erosion control measures');
    });

    it('should use caption as alt text', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByAltText('Site entrance photo')).toBeInTheDocument();
    });

    it('should use default alt text when caption is missing', () => {
      const photosWithoutCaption: Photo[] = [
        {
          ...mockPhotos[0],
          caption: undefined,
        },
      ];

      render(
        <TestWrapper>
          <PhotoLightbox
            photos={photosWithoutCaption}
            index={0}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const image = screen.getByTestId('lightbox-image');
      expect(image).toHaveAttribute('alt', expect.stringContaining('Nov'));
    });
  });

  describe('Photo Metadata Display', () => {
    it('should display photo caption in footer', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText('Site entrance photo')).toBeInTheDocument();
    });

    it('should display form name badge', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText('Daily Log')).toBeInTheDocument();
    });

    it('should display GPS coordinates for photos with location', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText(/34\.0522/)).toBeInTheDocument();
      expect(screen.getByText(/-118\.2437/)).toBeInTheDocument();
    });

    it('should not display GPS info for photos without coordinates', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={2} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByText(/GPS:/)).not.toBeInTheDocument();
    });

    it('should display formatted date', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText(/Nov 28, 2025/)).toBeInTheDocument();
    });

    it('should display file size in human-readable format', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // 1024000 bytes = 1000.0 KB
      expect(screen.getByText(/1000\.0 KB/)).toBeInTheDocument();
    });
  });

  describe('Lightbox Controls', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('close-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have navigation buttons', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByTestId('prev-button')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Download Action', () => {
    it('should render download button', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/download/i)).toBeInTheDocument();
    });

    it('should have download button that is clickable', async () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const downloadButton = screen.getByLabelText(/download/i);
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).not.toBeDisabled();

      // Verify button is clickable (doesn't throw)
      fireEvent.click(downloadButton);
    });
  });

  describe('Share Action', () => {
    it('should render share button', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
    });

    it('should copy URL to clipboard when share is clicked and Web Share API unavailable', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
        share: undefined,
      });

      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByLabelText(/share/i));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('https://cdn.example.com/photo-1.jpg');
      });
    });
  });

  describe('Empty State', () => {
    it('should handle empty photos array gracefully', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={[]} index={0} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Should not crash, lightbox container should not render with invalid index
      expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
    });

    it('should handle out-of-bounds index gracefully', () => {
      render(
        <TestWrapper>
          <PhotoLightbox photos={mockPhotos} index={100} open={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Should not crash
      expect(screen.queryByTestId('lightbox-container')).toBeInTheDocument();
    });
  });
});
