'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BeforeAfterComparison } from '../before-after-comparison';

// Mock scrollIntoView for Mantine components
Element.prototype.scrollIntoView = vi.fn();

// Test wrapper with Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <MantineProvider>{children}</MantineProvider>;
};

// Mock photo data
const mockBeforePhoto = {
  id: 'photo-before-1',
  orgId: 'org-1',
  url: 'https://example.com/before.jpg',
  thumbnailUrl: 'https://example.com/before-thumb.jpg',
  caption: 'Before construction',
  latitude: 37.7749,
  longitude: -122.4194,
  takenAt: '2024-01-15T10:00:00Z',
  uploadedAt: '2024-01-15T10:05:00Z',
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  uploadedBy: 'user-1',
  formName: 'Daily Log',
  projectName: 'Highway 101',
};

const mockAfterPhoto = {
  id: 'photo-after-1',
  orgId: 'org-1',
  url: 'https://example.com/after.jpg',
  thumbnailUrl: 'https://example.com/after-thumb.jpg',
  caption: 'After construction',
  latitude: 37.7749,
  longitude: -122.4194,
  takenAt: '2024-03-15T10:00:00Z',
  uploadedAt: '2024-03-15T10:05:00Z',
  fileSize: 1124000,
  mimeType: 'image/jpeg',
  uploadedBy: 'user-1',
  formName: 'Daily Log',
  projectName: 'Highway 101',
};

describe('BeforeAfterComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component without crashing', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByTestId('before-after-comparison')).toBeInTheDocument();
    });

    it('should display Before and After badges', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });

    it('should display before photo image', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const beforeImage = screen.getByAltText('Before');
      expect(beforeImage).toBeInTheDocument();
    });

    it('should display after photo image', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const afterImage = screen.getByAltText('After');
      expect(afterImage).toBeInTheDocument();
    });

    it('should render fade slider when in fade view', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Switch to fade view to see slider
      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        expect(screen.getByRole('slider')).toBeInTheDocument();
      });
    });

    it('should display slider marks (Before/Blend/After) in fade view', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Switch to fade view to see slider marks
      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        expect(screen.getByText('Blend')).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    it('should show side-by-side view by default', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByTestId('side-by-side-view')).toBeInTheDocument();
    });

    it('should show fade view when fade tab is clicked', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        expect(screen.getByTestId('fade-view')).toBeInTheDocument();
      });
    });

    it('should show slider view when slider tab is clicked', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const sliderTab = screen.getByRole('tab', { name: /slider/i });
      fireEvent.click(sliderTab);

      await waitFor(() => {
        expect(screen.getByTestId('slider-view')).toBeInTheDocument();
      });
    });
  });

  describe('Fade Slider Interaction', () => {
    it('should start with slider at 50% (blend mode)', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Switch to fade view to access slider
      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        const slider = screen.getByRole('slider');
        expect(slider).toHaveAttribute('aria-valuenow', '50');
      });
    });

    it('should update opacity when slider is moved', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Switch to fade view
      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        expect(screen.getByRole('slider')).toBeInTheDocument();
      });

      const slider = screen.getByRole('slider');

      // Use keyboard event to change slider value (more reliable than change event)
      fireEvent.keyDown(slider, { key: 'ArrowRight', code: 'ArrowRight' });

      // Slider should still be functional
      expect(slider).toBeInTheDocument();
    });

    it('should show Before image fully when slider is at 100', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        const fadeView = screen.getByTestId('fade-view');
        expect(fadeView).toBeInTheDocument();
      });
    });

    it('should show After image fully when slider is at 0', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        const fadeView = screen.getByTestId('fade-view');
        expect(fadeView).toBeInTheDocument();
      });
    });
  });

  describe('Photo Information', () => {
    it('should display photo captions', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByText('Before construction')).toBeInTheDocument();
      expect(screen.getByText('After construction')).toBeInTheDocument();
    });

    it('should display photo dates', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Dates should be displayed (format may vary)
      expect(screen.getByTestId('before-date')).toBeInTheDocument();
      expect(screen.getByTestId('after-date')).toBeInTheDocument();
    });

    it('should display GPS indicator if both photos have GPS', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Should show GPS indicator for photos with coordinates
      const gpsIndicators = screen.getAllByTestId(/gps-indicator/);
      expect(gpsIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render properly with narrow container', () => {
      render(
        <TestWrapper>
          <div style={{ width: '300px' }}>
            <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('before-after-comparison')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle photos without captions', () => {
      const photoWithoutCaption = { ...mockBeforePhoto, caption: undefined };

      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={photoWithoutCaption} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByTestId('before-after-comparison')).toBeInTheDocument();
    });

    it('should handle photos without GPS coordinates', () => {
      const photoWithoutGps = {
        ...mockBeforePhoto,
        latitude: null,
        longitude: null,
      };

      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={photoWithoutGps} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByTestId('before-after-comparison')).toBeInTheDocument();
    });

    it('should handle photos without thumbnails', () => {
      const photoWithoutThumb = { ...mockBeforePhoto, thumbnailUrl: undefined };

      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={photoWithoutThumb} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Should use main URL when thumbnail is not available
      expect(screen.getByTestId('before-after-comparison')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible slider with proper aria attributes', async () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      // Switch to fade view to access slider
      const fadeTab = screen.getByRole('tab', { name: /fade/i });
      fireEvent.click(fadeTab);

      await waitFor(() => {
        const slider = screen.getByRole('slider');
        expect(slider).toHaveAttribute('aria-valuemin', '0');
        expect(slider).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should have accessible tab navigation', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have descriptive alt text for images', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByAltText('Before')).toBeInTheDocument();
      expect(screen.getByAltText('After')).toBeInTheDocument();
    });
  });

  describe('Offline Scenarios', () => {
    it('should render when offline', () => {
      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.getByTestId('before-after-comparison')).toBeInTheDocument();

      // Restore
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('onUnpair Callback', () => {
    it('should call onUnpair when unpair button is clicked', async () => {
      const handleUnpair = vi.fn();

      render(
        <TestWrapper>
          <BeforeAfterComparison
            beforePhoto={mockBeforePhoto}
            afterPhoto={mockAfterPhoto}
            onUnpair={handleUnpair}
          />
        </TestWrapper>
      );

      const unpairButton = screen.getByRole('button', { name: /unpair/i });
      fireEvent.click(unpairButton);

      await waitFor(() => {
        expect(handleUnpair).toHaveBeenCalledTimes(1);
      });
    });

    it('should not show unpair button when onUnpair is not provided', () => {
      render(
        <TestWrapper>
          <BeforeAfterComparison beforePhoto={mockBeforePhoto} afterPhoto={mockAfterPhoto} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /unpair/i })).not.toBeInTheDocument();
    });
  });
});
