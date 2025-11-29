/**
 * Tests for Sync Queue Page
 *
 * Tests the sync queue management page:
 * - Statistics display
 * - Queue table rendering
 * - Clear all functionality
 * - Warning alerts
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SyncQueuePage from '../page';

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

// Mock formatBytes
vi.mock('@/lib/api/sync', () => ({
  formatBytes: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  },
}));

// Mock SyncQueueTable component
vi.mock('@/components/Sync', () => ({
  SyncQueueTable: () => <div data-testid="sync-queue-table">Queue Table</div>,
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MantineProvider>
  );
}

describe('SyncQueuePage', () => {
  const mockClearQueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSyncQueueActions.mockReturnValue({
      clearQueue: mockClearQueue,
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    // Default mock values
    mockUseSyncQueue.mockReturnValue({
      totalCount: 5,
      pendingCount: 3,
      failedCount: 1,
      syncingCount: 1,
      totalSize: 10240,
      isLoading: false,
      error: null,
      sortedQueue: [],
    });

    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  describe('Page rendering', () => {
    it('renders page title', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Sync Queue')).toBeInTheDocument();
    });

    it('renders queue table', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByTestId('sync-queue-table')).toBeInTheDocument();
    });
  });

  describe('Statistics cards', () => {
    it('displays total queued count', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Total Queued')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays pending count', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays failed count', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays total size formatted', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Total Size')).toBeInTheDocument();
      // 10240 bytes = 10 KB
      expect(screen.getByText('10.00 KB')).toBeInTheDocument();
    });
  });

  describe('Alerts', () => {
    it('shows syncing alert when operations are syncing', () => {
      mockUseSyncQueue.mockReturnValue({
        totalCount: 5,
        pendingCount: 3,
        failedCount: 0,
        syncingCount: 2,
        totalSize: 10240,
        isLoading: false,
        error: null,
        sortedQueue: [],
      });

      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Sync in Progress')).toBeInTheDocument();
      expect(screen.getByText(/2 operations currently syncing/i)).toBeInTheDocument();
    });

    it('shows failed alert when operations have failed', () => {
      mockUseSyncQueue.mockReturnValue({
        totalCount: 5,
        pendingCount: 3,
        failedCount: 3,
        syncingCount: 0,
        totalSize: 10240,
        isLoading: false,
        error: null,
        sortedQueue: [],
      });

      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Failed Operations')).toBeInTheDocument();
      expect(screen.getByText(/3 operations failed to sync/i)).toBeInTheDocument();
    });

    it('does not show alerts when no syncing or failed', () => {
      mockUseSyncQueue.mockReturnValue({
        totalCount: 5,
        pendingCount: 5,
        failedCount: 0,
        syncingCount: 0,
        totalSize: 10240,
        isLoading: false,
        error: null,
        sortedQueue: [],
      });

      renderWithProviders(<SyncQueuePage />);

      expect(screen.queryByText('Sync in Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed Operations')).not.toBeInTheDocument();
    });
  });

  describe('Clear all functionality', () => {
    it('has clear all button', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('calls clearQueue when confirmed', async () => {
      renderWithProviders(<SyncQueuePage />);

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockClearQueue).toHaveBeenCalled();
      });
    });

    it('disables clear button when queue is empty', () => {
      mockUseSyncQueue.mockReturnValue({
        totalCount: 0,
        pendingCount: 0,
        failedCount: 0,
        syncingCount: 0,
        totalSize: 0,
        isLoading: false,
        error: null,
        sortedQueue: [],
      });

      renderWithProviders(<SyncQueuePage />);

      const clearButton = screen.getByText('Clear All').closest('button');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Priority legend', () => {
    it('shows priority level explanation', () => {
      renderWithProviders(<SyncQueuePage />);

      expect(screen.getByText('Priority Levels')).toBeInTheDocument();
      expect(screen.getByText('Compliance (SWPPP, Weather)')).toBeInTheDocument();
      expect(screen.getByText(/Forms.*Photos/)).toBeInTheDocument();
      expect(screen.getByText('Other Updates')).toBeInTheDocument();
    });
  });
});
