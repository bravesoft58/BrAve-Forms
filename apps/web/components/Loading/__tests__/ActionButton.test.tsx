/**
 * ActionButton Component Unit Tests
 *
 * Tests for ActionButton with loading state management.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ActionButton, LoadingButton } from '../ActionButton';

// Wrapper for Mantine components
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ActionButton', () => {
  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================
  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <TestWrapper>
          <ActionButton onClick={async () => {}}>Save</ActionButton>
        </TestWrapper>
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should have correct test id', () => {
      render(
        <TestWrapper>
          <ActionButton onClick={async () => {}}>Click Me</ActionButton>
        </TestWrapper>
      );

      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('should pass through button props', () => {
      render(
        <TestWrapper>
          <ActionButton onClick={async () => {}} color="red" variant="outline">
            Delete
          </ActionButton>
        </TestWrapper>
      );

      const button = screen.getByTestId('action-button');
      expect(button).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================
  describe('Loading State', () => {
    it('should show loading state during async operation', async () => {
      let resolvePromise: () => void;
      const asyncAction = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction}>Submit</ActionButton>
        </TestWrapper>
      );

      const button = screen.getByTestId('action-button');

      // Click the button
      fireEvent.click(button);

      // Button should be in loading state
      await waitFor(() => {
        expect(button).toHaveAttribute('data-loading', 'true');
      });

      // Resolve the promise
      resolvePromise!();

      // Loading should be complete
      await waitFor(() => {
        expect(button).not.toHaveAttribute('data-loading', 'true');
      });
    });

    it('should show loadingText when provided', async () => {
      let resolvePromise: () => void;
      const asyncAction = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction} loadingText="Saving...">
            Save
          </ActionButton>
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('action-button'));

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!();
    });

    it('should disable button while loading by default', async () => {
      let resolvePromise: () => void;
      const asyncAction = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction}>Submit</ActionButton>
        </TestWrapper>
      );

      const button = screen.getByTestId('action-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Cleanup
      resolvePromise!();
    });
  });

  // ============================================================================
  // Callback Tests
  // ============================================================================
  describe('Callbacks', () => {
    it('should call onSuccess when action succeeds', async () => {
      const onSuccess = vi.fn();
      const asyncAction = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction} onSuccess={onSuccess}>
            Submit
          </ActionButton>
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('action-button'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onError when action fails', async () => {
      const onError = vi.fn();
      const error = new Error('Test error');
      const asyncAction = vi.fn().mockRejectedValue(error);

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction} onError={onError}>
            Submit
          </ActionButton>
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('action-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should convert non-Error rejections to Error', async () => {
      const onError = vi.fn();
      const asyncAction = vi.fn().mockRejectedValue('String error');

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction} onError={onError}>
            Submit
          </ActionButton>
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('action-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  // ============================================================================
  // Disabled State Tests
  // ============================================================================
  describe('Disabled State', () => {
    it('should respect external disabled prop', () => {
      render(
        <TestWrapper>
          <ActionButton onClick={async () => {}} disabled>
            Submit
          </ActionButton>
        </TestWrapper>
      );

      expect(screen.getByTestId('action-button')).toBeDisabled();
    });

    it('should prevent multiple clicks while loading', async () => {
      let resolvePromise: () => void;
      const asyncAction = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <TestWrapper>
          <ActionButton onClick={asyncAction}>Submit</ActionButton>
        </TestWrapper>
      );

      const button = screen.getByTestId('action-button');

      // Click multiple times
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only call once
      expect(asyncAction).toHaveBeenCalledTimes(1);

      // Cleanup
      resolvePromise!();
    });
  });
});

// ============================================================================
// LoadingButton Tests
// ============================================================================
describe('LoadingButton', () => {
  it('should render with children', () => {
    render(
      <TestWrapper>
        <LoadingButton>Submit</LoadingButton>
      </TestWrapper>
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(
      <TestWrapper>
        <LoadingButton loading>Submit</LoadingButton>
      </TestWrapper>
    );

    const button = screen.getByTestId('loading-button');
    expect(button).toHaveAttribute('data-loading', 'true');
  });

  it('should show loadingText when loading', () => {
    render(
      <TestWrapper>
        <LoadingButton loading loadingText="Processing...">
          Submit
        </LoadingButton>
      </TestWrapper>
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(
      <TestWrapper>
        <LoadingButton loading>Submit</LoadingButton>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-button')).toBeDisabled();
  });
});
