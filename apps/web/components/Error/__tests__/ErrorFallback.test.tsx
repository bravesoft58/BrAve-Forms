/**
 * ErrorFallback Component Unit Tests
 *
 * Tests for error fallback UI components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ErrorFallback, CompactErrorFallback } from '../ErrorFallback';

// Wrapper for Mantine components
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ErrorFallback', () => {
  const mockResetError = vi.fn();
  const testError = new Error('Test error message');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================
  describe('Basic Rendering', () => {
    it('should render error fallback container', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    });

    it('should render default title when no feature specified', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Something went wrong');
    });

    it('should render default message when no feature specified', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Something went wrong. Please try again or contact support if the issue persists.'
      );
    });

    it('should render retry button', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('error-retry-button')).toHaveTextContent('Try Again');
    });

    it('should render home button by default', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-home-button')).toBeInTheDocument();
      expect(screen.getByTestId('error-home-button')).toHaveTextContent('Go Home');
    });
  });

  // ============================================================================
  // Feature-Specific Tests
  // ============================================================================
  describe('Feature-Specific Messages', () => {
    it('should show photos feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="photos" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Photo Error');
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to load photos. Check your internet connection and try again.'
      );
    });

    it('should show photo-gallery feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="photo-gallery" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Photo Error');
    });

    it('should show forms feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="forms" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Form Error');
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to load form. Your data is saved locally and will sync when the issue is resolved.'
      );
    });

    it('should show form-builder feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="form-builder" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Form Error');
    });

    it('should show settings feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="settings" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Settings Error');
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to load settings. Please try again.'
      );
    });

    it('should show sync feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="sync" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Sync Error');
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Sync failed. Your data is saved locally and will sync automatically when connection is restored.'
      );
    });

    it('should show offline feature title and message', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} feature="offline" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Sync Error');
    });
  });

  // ============================================================================
  // Custom Props Tests
  // ============================================================================
  describe('Custom Props', () => {
    it('should use custom title when provided', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} title="Custom Title" />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Custom Title');
    });

    it('should use custom message when provided', () => {
      render(
        <TestWrapper>
          <ErrorFallback
            error={testError}
            resetError={mockResetError}
            message="Custom error message"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-message')).toHaveTextContent('Custom error message');
    });

    it('should override feature title with custom title', () => {
      render(
        <TestWrapper>
          <ErrorFallback
            error={testError}
            resetError={mockResetError}
            feature="photos"
            title="Override Title"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent('Override Title');
    });

    it('should hide home button when showHomeButton is false', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} showHomeButton={false} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('error-home-button')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================
  describe('Interactions', () => {
    it('should call resetError when retry button is clicked', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('error-retry-button'));

      expect(mockResetError).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Network Error Tests
  // ============================================================================
  describe('Network Error Detection', () => {
    it('should show network tip for network errors', () => {
      const networkError = new Error('Network request failed');
      render(
        <TestWrapper>
          <ErrorFallback error={networkError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(
        screen.getByText('Tip: Check your internet connection and try again')
      ).toBeInTheDocument();
    });

    it('should show network tip for fetch errors', () => {
      const fetchError = new Error('Failed to fetch');
      render(
        <TestWrapper>
          <ErrorFallback error={fetchError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(
        screen.getByText('Tip: Check your internet connection and try again')
      ).toBeInTheDocument();
    });

    it('should show network tip for offline errors', () => {
      const offlineError = new Error('Device is offline');
      render(
        <TestWrapper>
          <ErrorFallback error={offlineError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(
        screen.getByText('Tip: Check your internet connection and try again')
      ).toBeInTheDocument();
    });

    it('should not show network tip for non-network errors', () => {
      const otherError = new Error('Some other error');
      render(
        <TestWrapper>
          <ErrorFallback error={otherError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(
        screen.queryByText('Tip: Check your internet connection and try again')
      ).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-fallback')).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live="assertive"', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-fallback')).toHaveAttribute('aria-live', 'assertive');
    });
  });

  // ============================================================================
  // Null Error Tests
  // ============================================================================
  describe('Null Error Handling', () => {
    it('should handle null error gracefully', () => {
      render(
        <TestWrapper>
          <ErrorFallback error={null} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CompactErrorFallback Tests
// ============================================================================
describe('CompactErrorFallback', () => {
  const mockResetError = vi.fn();
  const testError = new Error('Test error');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render compact error fallback', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('compact-error-fallback')).toBeInTheDocument();
    });

    it('should show default message', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should show custom message', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback
            error={testError}
            resetError={mockResetError}
            message="Custom failure message"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Custom failure message')).toBeInTheDocument();
    });

    it('should render retry button', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('compact-error-retry')).toBeInTheDocument();
      expect(screen.getByTestId('compact-error-retry')).toHaveTextContent('Retry');
    });
  });

  describe('Interactions', () => {
    it('should call resetError when retry is clicked', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('compact-error-retry'));

      expect(mockResetError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('compact-error-fallback')).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live="polite"', () => {
      render(
        <TestWrapper>
          <CompactErrorFallback error={testError} resetError={mockResetError} />
        </TestWrapper>
      );

      expect(screen.getByTestId('compact-error-fallback')).toHaveAttribute('aria-live', 'polite');
    });
  });
});
