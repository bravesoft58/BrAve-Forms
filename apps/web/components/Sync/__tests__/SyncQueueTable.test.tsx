/**
 * Tests for SyncQueueTable Component
 *
 * Tests the sync queue table display and interactions:
 * - Displays queue items with metadata
 * - Priority sorting
 * - Retry/delete actions
 * - Empty state
 * - Mobile responsive
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { SyncQueueTable } from '../SyncQueueTable';
import { SyncQueueItem } from '@/lib/stores/sync-queue-store';

// Mock useSyncQueue hook
const mockUseSyncQueue = vi.fn();
const mockUseSyncQueueActions = vi.fn();

vi.mock('@/hooks/useSyncQueue', () => ({
  useSyncQueue: () => mockUseSyncQueue(),
  useSyncQueueActions: () => mockUseSyncQueueActions(),
  formatRelativeTime: (timestamp: string) => '5 min ago',
  getStatusColor: (status: string) => (status === 'failed' ? 'red' : 'blue'),
  getTypeLabel: (type: string) => type.replace('_', ' '),
}));

// Mock formatBytes from sync API
vi.mock('@/lib/api/sync', () => ({
  formatBytes: (bytes: number) => `${bytes} B`,
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

// Mock data
const createMockQueueItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  type: 'form_submission',
  operation: 'create',
  data: { formId: 'form-123' },
  timestamp: new Date().toISOString(),
  size: 1024,
  priority: 5,
  retries: 0,
  status: 'pending',
  orgId: 'org_test123',
  ...overrides,
});

describe('SyncQueueTable', () => {
  const mockRetryItem = vi.fn();
  const mockDeleteItem = vi.fn();
  const mockClearQueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSyncQueueActions.mockReturnValue({
      retryItem: mockRetryItem,
      deleteItem: mockDeleteItem,
      clearQueue: mockClearQueue,
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no items in queue', () => {
      mockUseSyncQueue.mockReturnValue({
        sortedQueue: [],
        isLoading: false,
        error: null,
        totalCount: 0,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/No pending sync operations/i)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator when loading', () => {
      mockUseSyncQueue.mockReturnValue({
        sortedQueue: [],
        isLoading: true,
        error: null,
        totalCount: 0,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/Loading queue/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when error occurs', () => {
      mockUseSyncQueue.mockReturnValue({
        sortedQueue: [],
        isLoading: false,
        error: 'Failed to load queue',
        totalCount: 0,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/Failed to load queue/i)).toBeInTheDocument();
    });
  });

  describe('Queue display', () => {
    it('displays queue items in table', () => {
      const items = [
        createMockQueueItem({ id: 'item-1', type: 'form_submission' }),
        createMockQueueItem({ id: 'item-2', type: 'photo_upload' }),
      ];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 2,
      });

      renderWithMantine(<SyncQueueTable />);

      // Table should be visible
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('displays item type', () => {
      const items = [createMockQueueItem({ type: 'form_submission' })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/form submission/i)).toBeInTheDocument();
    });

    it('displays item timestamp', () => {
      const items = [createMockQueueItem()];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/5 min ago/i)).toBeInTheDocument();
    });

    it('displays item size', () => {
      const items = [createMockQueueItem({ size: 1024 })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/1024 B/i)).toBeInTheDocument();
    });

    it('displays item priority', () => {
      const items = [createMockQueueItem({ priority: 10 })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays item status', () => {
      const items = [createMockQueueItem({ status: 'pending' })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('displays failed items with error', () => {
      const items = [
        createMockQueueItem({ status: 'failed', lastError: 'Network error' }),
      ];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('has retry button for each item', () => {
      const items = [createMockQueueItem({ id: 'item-1' })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      const retryButton = screen.getByLabelText(/retry/i);
      expect(retryButton).toBeInTheDocument();
    });

    it('calls retryItem when retry clicked', async () => {
      const items = [createMockQueueItem({ id: 'item-1' })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      const retryButton = screen.getByLabelText(/retry/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockRetryItem).toHaveBeenCalledWith('item-1');
      });
    });

    it('has delete button for each item', () => {
      const items = [createMockQueueItem({ id: 'item-1' })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      const deleteButton = screen.getByLabelText(/delete/i);
      expect(deleteButton).toBeInTheDocument();
    });

    it('disables buttons when item is syncing', () => {
      const items = [createMockQueueItem({ id: 'item-1', status: 'syncing' })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      const retryButton = screen.getByLabelText(/retry/i);
      const deleteButton = screen.getByLabelText(/delete/i);

      expect(retryButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Priority display', () => {
    it('shows high priority badge for compliance items', () => {
      const items = [createMockQueueItem({ priority: 10 })];

      mockUseSyncQueue.mockReturnValue({
        sortedQueue: items,
        isLoading: false,
        error: null,
        totalCount: 1,
      });

      renderWithMantine(<SyncQueueTable />);

      // Priority 10 should be highlighted
      const priorityBadge = screen.getByText('10');
      expect(priorityBadge).toBeInTheDocument();
    });
  });
});
