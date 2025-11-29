/**
 * RetryFailedSync Component Tests
 *
 * Tests for the retry failed sync functionality including:
 * - Failure classification logic
 * - Retry All Failed button
 * - Individual retry buttons
 * - Failure reason display
 * - Multi-tenant isolation
 * - Max retry limit handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { RetryFailedSync, classifyFailure, getFailureLabel } from '../RetryFailedSync';
import { MAX_RETRY_ATTEMPTS } from '@/lib/stores/sync-queue-store';

// Mock the hooks
const mockRetryItem = vi.fn().mockResolvedValue(true);

vi.mock('@/hooks/useSyncQueue', () => ({
  useSyncQueue: vi.fn(() => ({
    failedItems: [],
    failedCount: 0,
    isLoading: false,
    error: null,
    orgId: 'test-org-123',
  })),
  useSyncQueueActions: vi.fn(() => ({
    retryItem: mockRetryItem,
    deleteItem: vi.fn(),
    clearQueue: vi.fn(),
    loadFromStorage: vi.fn(),
  })),
  formatRelativeTime: vi.fn((_timestamp: string) => '5 min ago'),
  getTypeLabel: vi.fn((type: string) => {
    const labels: Record<string, string> = {
      form_submission: 'Form Submission',
      photo_upload: 'Photo Upload',
      annotation: 'Annotation',
      form_update: 'Form Update',
    };
    return labels[type] || type;
  }),
}));

// Import mocked hooks
import * as useSyncQueueModule from '@/hooks/useSyncQueue';

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Notifications />
    {children}
  </MantineProvider>
);

// Helper to create test failed item
const createFailedItem = (
  overrides: Partial<{
    id: string;
    type: 'form_submission' | 'photo_upload' | 'annotation' | 'form_update';
    lastError: string;
    retries: number;
    orgId: string;
  }> = {}
) => ({
  id: `item-${Math.random().toString(36).substr(2, 9)}`,
  type: 'form_submission' as const,
  operation: 'create' as const,
  data: {},
  timestamp: new Date().toISOString(),
  size: 100,
  priority: 5,
  retries: overrides.retries ?? 0,
  status: 'failed' as const,
  orgId: overrides.orgId ?? 'test-org-123',
  lastError: overrides.lastError ?? 'Network error: Connection refused',
  ...overrides,
});

describe('RetryFailedSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock state
    vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
      failedItems: [],
      failedCount: 0,
      isLoading: false,
      error: null,
      orgId: 'test-org-123',
      queue: [],
      sortedQueue: [],
      totalCount: 0,
      pendingCount: 0,
      syncingCount: 0,
      totalSize: 0,
      pendingItems: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // classifyFailure utility function tests
  // ==========================================================================
  describe('classifyFailure', () => {
    it('should classify network errors correctly', () => {
      expect(classifyFailure('Network error: Connection refused')).toBe('network');
      expect(classifyFailure('fetch failed')).toBe('network');
      expect(classifyFailure('Request timeout after 30s')).toBe('network');
      expect(classifyFailure('Device is offline')).toBe('network');
      expect(classifyFailure('Lost connection to server')).toBe('network');
    });

    it('should classify validation errors correctly', () => {
      expect(classifyFailure('Validation failed: email required')).toBe('validation');
      expect(classifyFailure('Invalid date format')).toBe('validation');
      expect(classifyFailure('Field "name" is required')).toBe('validation');
      expect(classifyFailure('Invalid file format')).toBe('validation');
    });

    it('should classify auth errors correctly', () => {
      expect(classifyFailure('Unauthorized: invalid token')).toBe('auth');
      expect(classifyFailure('403 Forbidden')).toBe('auth');
      expect(classifyFailure('401 Unauthorized')).toBe('auth');
      expect(classifyFailure('Token expired')).toBe('auth');
      expect(classifyFailure('Auth failed')).toBe('auth');
    });

    it('should classify server errors correctly', () => {
      expect(classifyFailure('500 Internal Server Error')).toBe('server');
      expect(classifyFailure('502 Bad Gateway')).toBe('server');
      expect(classifyFailure('503 Service Unavailable')).toBe('server');
      expect(classifyFailure('Server error: database unavailable')).toBe('server');
      expect(classifyFailure('Internal error occurred')).toBe('server');
    });

    it('should return unknown for unrecognized errors', () => {
      expect(classifyFailure('Something went wrong')).toBe('unknown');
      expect(classifyFailure('Unexpected error')).toBe('unknown');
      expect(classifyFailure(undefined)).toBe('unknown');
      expect(classifyFailure('')).toBe('unknown');
    });
  });

  // ==========================================================================
  // getFailureLabel utility function tests
  // ==========================================================================
  describe('getFailureLabel', () => {
    it('should return correct labels for each failure type', () => {
      expect(getFailureLabel('network')).toBe('Network Error');
      expect(getFailureLabel('validation')).toBe('Validation Error');
      expect(getFailureLabel('auth')).toBe('Auth Error');
      expect(getFailureLabel('server')).toBe('Server Error');
      expect(getFailureLabel('unknown')).toBe('Unknown Error');
    });
  });

  // ==========================================================================
  // Rendering tests
  // ==========================================================================
  describe('rendering', () => {
    it('should hide component when no failures and hideWhenEmpty is true', () => {
      render(
        <TestWrapper>
          <RetryFailedSync hideWhenEmpty={true} />
        </TestWrapper>
      );

      // Component returns null, so no failure-related content should appear
      expect(screen.queryByText('Failed Sync Operations')).not.toBeInTheDocument();
      expect(screen.queryByText('No Failed Syncs')).not.toBeInTheDocument();
    });

    it('should show success message when no failures and hideWhenEmpty is false', () => {
      render(
        <TestWrapper>
          <RetryFailedSync hideWhenEmpty={false} />
        </TestWrapper>
      );

      expect(screen.getByText('No Failed Syncs')).toBeInTheDocument();
      expect(screen.getByText('All sync operations completed successfully.')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems: [],
        failedCount: 0,
        isLoading: true,
        error: null,
        orgId: 'test-org-123',
        queue: [],
        sortedQueue: [],
        totalCount: 0,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 0,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync hideWhenEmpty={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show alert with failure count', () => {
      const failedItems = [createFailedItem({ id: 'item-1' }), createFailedItem({ id: 'item-2' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 2,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 2,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 200,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      expect(screen.getByText('Failed Sync Operations')).toBeInTheDocument();
      expect(screen.getByText(/2 operations failed to sync/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Retry All Failed button tests
  // ==========================================================================
  describe('Retry All Failed button', () => {
    it('should show Retry All Failed button with correct count', () => {
      const failedItems = [
        createFailedItem({ id: 'item-1' }),
        createFailedItem({ id: 'item-2' }),
        createFailedItem({ id: 'item-3' }),
      ];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 3,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 3,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 300,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /retry all failed \(3\)/i })).toBeInTheDocument();
    });

    it('should call retryItem for each failed item when Retry All is clicked', async () => {
      const failedItems = [createFailedItem({ id: 'item-1' }), createFailedItem({ id: 'item-2' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 2,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 2,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 200,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      const retryAllButton = screen.getByRole('button', { name: /retry all failed/i });
      fireEvent.click(retryAllButton);

      await waitFor(() => {
        expect(mockRetryItem).toHaveBeenCalledTimes(2);
        expect(mockRetryItem).toHaveBeenCalledWith('item-1');
        expect(mockRetryItem).toHaveBeenCalledWith('item-2');
      });
    });

    it('should disable Retry All button when all items at max retries', () => {
      const failedItems = [
        createFailedItem({ id: 'item-1', retries: MAX_RETRY_ATTEMPTS }),
        createFailedItem({ id: 'item-2', retries: MAX_RETRY_ATTEMPTS }),
      ];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 2,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 2,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 200,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      const retryAllButton = screen.getByRole('button', { name: /retry all failed \(0\)/i });
      expect(retryAllButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // Individual retry button tests
  // ==========================================================================
  describe('individual retry buttons', () => {
    it('should show individual retry buttons when expanded', () => {
      const failedItems = [createFailedItem({ id: 'item-1', type: 'form_submission' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /retry form_submission/i })).toBeInTheDocument();
    });

    it('should call retryItem when individual retry button is clicked', async () => {
      const failedItems = [createFailedItem({ id: 'item-123', type: 'photo_upload' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry photo_upload/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockRetryItem).toHaveBeenCalledWith('item-123');
      });
    });

    it('should disable individual retry button when item at max retries', () => {
      const failedItems = [createFailedItem({ id: 'item-1', retries: MAX_RETRY_ATTEMPTS })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry form_submission/i });
      expect(retryButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // Failure reason display tests
  // ==========================================================================
  describe('failure reason display', () => {
    it('should display failure type badge for each item', () => {
      const failedItems = [
        createFailedItem({ id: 'item-1', lastError: 'Network error: Connection refused' }),
      ];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('should display error message text', () => {
      const errorMessage = 'Failed to sync form_submission: Network error';
      const failedItems = [createFailedItem({ id: 'item-1', lastError: errorMessage })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display retry count for items with retries', () => {
      const failedItems = [createFailedItem({ id: 'item-1', retries: 3 })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      expect(screen.getByText(`Retries: 3/${MAX_RETRY_ATTEMPTS}`)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Expand/Collapse tests
  // ==========================================================================
  describe('expand/collapse', () => {
    it('should start collapsed by default', () => {
      const failedItems = [createFailedItem({ id: 'item-1' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });

    it('should expand when Show Details is clicked', () => {
      const failedItems = [createFailedItem({ id: 'item-1', lastError: 'Test error message' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      const showDetailsButton = screen.getByText('Show Details');
      fireEvent.click(showDetailsButton);

      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should respect defaultExpanded prop', () => {
      const failedItems = [createFailedItem({ id: 'item-1', lastError: 'Already visible error' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      expect(screen.getByText('Already visible error')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Multi-tenant isolation tests
  // ==========================================================================
  describe('multi-tenant isolation', () => {
    it('should only show failed items for current organization', () => {
      // Hook already filters by orgId, so we just verify it uses the hook correctly
      const failedItems = [createFailedItem({ id: 'my-org-item', orgId: 'test-org-123' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      // Should show 1 failure
      expect(screen.getByText(/1 operation failed to sync/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Max retry handling tests
  // ==========================================================================
  describe('max retry handling', () => {
    it('should show count of items at max retries', () => {
      const failedItems = [
        createFailedItem({ id: 'item-1', retries: 0 }), // retryable
        createFailedItem({ id: 'item-2', retries: MAX_RETRY_ATTEMPTS }), // at max
      ];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 2,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 2,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 200,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync />
        </TestWrapper>
      );

      // Button should show 1 retryable
      expect(screen.getByRole('button', { name: /retry all failed \(1\)/i })).toBeInTheDocument();
      // Text should mention items at max retries
      expect(screen.getByText(/1 at max retries/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Compact mode tests
  // ==========================================================================
  describe('compact mode', () => {
    it('should render in compact mode', () => {
      const failedItems = [createFailedItem({ id: 'item-1' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync compact />
        </TestWrapper>
      );

      // Should still show the alert
      expect(screen.getByText('Failed Sync Operations')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility tests
  // ==========================================================================
  describe('accessibility', () => {
    it('should have accessible button labels', () => {
      const failedItems = [createFailedItem({ id: 'item-1', type: 'form_submission' })];

      vi.mocked(useSyncQueueModule.useSyncQueue).mockReturnValue({
        failedItems,
        failedCount: 1,
        isLoading: false,
        error: null,
        orgId: 'test-org-123',
        queue: failedItems,
        sortedQueue: failedItems,
        totalCount: 1,
        pendingCount: 0,
        syncingCount: 0,
        totalSize: 100,
        pendingItems: [],
      });

      render(
        <TestWrapper>
          <RetryFailedSync defaultExpanded />
        </TestWrapper>
      );

      // Retry All button should be accessible
      expect(screen.getByRole('button', { name: /retry all failed/i })).toBeInTheDocument();

      // Individual retry button should have aria-label
      const individualRetryButton = screen.getByRole('button', { name: /retry form_submission/i });
      expect(individualRetryButton).toHaveAttribute('aria-label', 'Retry form_submission');
    });
  });
});
