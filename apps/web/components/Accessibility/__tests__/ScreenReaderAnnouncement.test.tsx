/**
 * ScreenReaderAnnouncement Component Tests
 *
 * Tests for screen reader announcement utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
  ScreenReaderAnnouncement,
  OperationStatusAnnouncement,
  NavigationAnnouncement,
  FormErrorAnnouncement,
  useAnnouncer,
} from '../ScreenReaderAnnouncement';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ScreenReaderAnnouncement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render message in live region', () => {
      render(<ScreenReaderAnnouncement message="Test announcement" />, { wrapper });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Test announcement');
    });

    it('should have aria-live="polite" by default', () => {
      render(<ScreenReaderAnnouncement message="Test announcement" />, { wrapper });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should support aria-live="assertive"', () => {
      render(<ScreenReaderAnnouncement message="Critical announcement" politeness="assertive" />, {
        wrapper,
      });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-atomic="true"', () => {
      render(<ScreenReaderAnnouncement message="Test announcement" />, { wrapper });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should be visually hidden', () => {
      const { container } = render(<ScreenReaderAnnouncement message="Test announcement" />, {
        wrapper,
      });

      // Check for Mantine's VisuallyHidden styles
      const hiddenElement = container.firstChild;
      expect(hiddenElement).toBeInTheDocument();
    });
  });

  describe('auto-clear behavior', () => {
    it('should clear message after delay when clearAfterAnnounce is true', () => {
      render(
        <ScreenReaderAnnouncement
          message="Test announcement"
          clearAfterAnnounce={true}
          clearDelay={1000}
        />,
        { wrapper }
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Test announcement');

      // Advance timers and flush state updates
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(liveRegion).toHaveTextContent('');
    });

    it('should not clear message when clearAfterAnnounce is false', () => {
      render(
        <ScreenReaderAnnouncement message="Persistent announcement" clearAfterAnnounce={false} />,
        { wrapper }
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Persistent announcement');

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(liveRegion).toHaveTextContent('Persistent announcement');
    });

    it('should use custom clearDelay', () => {
      render(<ScreenReaderAnnouncement message="Test announcement" clearDelay={2000} />, {
        wrapper,
      });

      const liveRegion = screen.getByRole('status');

      // Should still have message at 1000ms
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(liveRegion).toHaveTextContent('Test announcement');

      // Should clear at 2000ms
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(liveRegion).toHaveTextContent('');
    });
  });

  describe('message updates', () => {
    it('should display different messages', () => {
      // Test that different messages render correctly
      const { unmount } = render(
        <ScreenReaderAnnouncement message="First message" clearAfterAnnounce={false} />,
        { wrapper }
      );

      expect(screen.getByRole('status')).toHaveTextContent('First message');
      unmount();

      // Render with second message
      render(<ScreenReaderAnnouncement message="Second message" clearAfterAnnounce={false} />, {
        wrapper,
      });

      expect(screen.getByRole('status')).toHaveTextContent('Second message');
    });

    it('should handle empty message', () => {
      render(<ScreenReaderAnnouncement message="" clearAfterAnnounce={false} />, { wrapper });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('');
    });
  });
});

describe('OperationStatusAnnouncement', () => {
  it('should show loading message', () => {
    render(<OperationStatusAnnouncement status="loading" />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Loading...');
  });

  it('should show success message', () => {
    render(<OperationStatusAnnouncement status="success" />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Operation completed successfully');
  });

  it('should show error message with assertive politeness', () => {
    render(<OperationStatusAnnouncement status="error" />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Operation failed');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('should show empty for idle status', () => {
    render(<OperationStatusAnnouncement status="idle" />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('');
  });

  it('should use custom messages', () => {
    render(
      <OperationStatusAnnouncement
        status="loading"
        messages={{
          loading: 'Uploading photos...',
          success: 'Photos uploaded',
          error: 'Upload failed',
        }}
      />,
      { wrapper }
    );

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Uploading photos...');
  });
});

describe('NavigationAnnouncement', () => {
  it('should announce page navigation', () => {
    render(<NavigationAnnouncement pageTitle="Photo Gallery" />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Navigated to Photo Gallery');
  });

  it('should format page title correctly', () => {
    const { unmount } = render(<NavigationAnnouncement pageTitle="Photo Gallery" />, { wrapper });

    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Photo Gallery');
    unmount();

    // Test with different page title
    render(<NavigationAnnouncement pageTitle="Settings" />, { wrapper });

    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Settings');
  });
});

describe('FormErrorAnnouncement', () => {
  it('should announce single error', () => {
    render(<FormErrorAnnouncement errorCount={1} />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Form has 1 validation error');
  });

  it('should announce multiple errors with plural form', () => {
    render(<FormErrorAnnouncement errorCount={3} />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Form has 3 validation errors');
  });

  it('should show empty message for zero errors', () => {
    render(<FormErrorAnnouncement errorCount={0} />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('');
  });

  it('should use assertive politeness for errors', () => {
    render(<FormErrorAnnouncement errorCount={1} />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('should use custom message format', () => {
    const customFormat = (count: number) => `${count} field(s) need attention`;

    render(<FormErrorAnnouncement errorCount={2} messageFormat={customFormat} />, { wrapper });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('2 field(s) need attention');
  });
});

describe('useAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide announce function', () => {
    const { result } = renderHook(() => useAnnouncer());

    expect(result.current.announce).toBeInstanceOf(Function);
  });

  it('should provide Announcer component', () => {
    const { result } = renderHook(() => useAnnouncer());

    expect(result.current.Announcer).toBeInstanceOf(Function);
  });

  it('should announce messages', async () => {
    const { result } = renderHook(() => useAnnouncer());

    const TestComponent = () => {
      const { announce, Announcer } = result.current;
      return (
        <MantineProvider>
          <button onClick={() => announce('Test message')}>Announce</button>
          <Announcer />
        </MantineProvider>
      );
    };

    const { rerender } = render(<TestComponent />);

    // Trigger announcement
    act(() => {
      result.current.announce('Test message');
    });

    // Need to rerender to see the updated announcement
    rerender(<TestComponent />);

    // Use microtask to handle the queueMicrotask in announce
    await act(async () => {
      await Promise.resolve();
    });

    rerender(<TestComponent />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('Test message');
  });

  it('should support different politeness levels', async () => {
    const { result } = renderHook(() => useAnnouncer());

    const TestComponent = () => {
      const { Announcer } = result.current;
      return (
        <MantineProvider>
          <Announcer />
        </MantineProvider>
      );
    };

    const { rerender } = render(<TestComponent />);

    act(() => {
      result.current.announce('Critical message', 'assertive');
    });

    await act(async () => {
      await Promise.resolve();
    });

    rerender(<TestComponent />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });
});
