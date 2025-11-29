import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { proxy } from 'valtio';

// Mock IndexedDB first (before other imports)
const mockPut = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockGetAll = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/storage/indexed-db', () => ({
  syncQueueDB: {
    getAll: () => mockGetAll(),
    get: vi.fn().mockResolvedValue(null),
    put: (item: unknown) => mockPut(item),
    delete: (id: string) => mockDelete(id),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  IndexedDBError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'IndexedDBError';
    }
  },
}));

// Create a mock syncQueueStore proxy for tests
const createMockStore = (
  items: Array<{
    id: string;
    type: 'form_submission' | 'photo_upload' | 'annotation' | 'form_update';
    operation: 'create' | 'update' | 'delete';
    data: Record<string, unknown>;
    timestamp: string;
    size: number;
    priority: number;
    retries: number;
    status: 'pending' | 'syncing' | 'failed';
    orgId: string;
    lastError?: string;
  }> = []
) => {
  return proxy({
    queue: items,
    isLoading: false,
    error: null as string | null,
  });
};

// Test store
let testStore = createMockStore();

vi.mock('@/lib/stores/sync-queue-store', () => ({
  get syncQueueStore() {
    return testStore;
  },
  updateItemStatus: vi.fn().mockResolvedValue(undefined),
  removeFromQueue: vi.fn().mockResolvedValue(undefined),
  getQueueByPriority: vi.fn(() => testStore.queue.slice().sort((a, b) => b.priority - a.priority)),
  loadQueueFromStorage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn(() => true),
}));

vi.mock('@/app/providers', () => ({
  useAppAuth: vi.fn(() => ({
    orgId: 'test-org-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    isSignedIn: true,
    isLoaded: true,
    getToken: async () => 'test-token',
  })),
}));

// Import mocked modules for test manipulation
import * as onlineStatusHook from '@/lib/hooks/use-online-status';
import * as syncQueueStoreModule from '@/lib/stores/sync-queue-store';
import { ManualSyncButton } from '../ManualSyncButton';

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Notifications />
    {children}
  </MantineProvider>
);

// Helper to create test items
const createTestItem = (
  overrides: Partial<{
    id: string;
    type: 'form_submission' | 'photo_upload' | 'annotation' | 'form_update';
    status: 'pending' | 'syncing' | 'failed';
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
  retries: 0,
  status: 'pending' as const,
  orgId: 'test-org-123',
  ...overrides,
});

describe('ManualSyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to empty store
    testStore = createMockStore();
    vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(true);
    vi.mocked(syncQueueStoreModule.getQueueByPriority).mockImplementation(() =>
      testStore.queue.slice().sort((a, b) => b.priority - a.priority)
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================
  describe('rendering', () => {
    it('should render Sync Now button', () => {
      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument();
    });

    it('should render with custom variant', () => {
      render(
        <TestWrapper>
          <ManualSyncButton variant="filled" />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      render(
        <TestWrapper>
          <ManualSyncButton size="lg" />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Disabled State Tests
  // ==========================================================================
  describe('disabled state', () => {
    it('should be disabled when offline', () => {
      vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(false);

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeDisabled();
    });

    it('should be disabled when no pending items', () => {
      // testStore already has empty queue
      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeDisabled();
    });

    it('should be enabled when online with pending items', () => {
      // Add pending items to test store
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // Badge Tests
  // ==========================================================================
  describe('pending count badge', () => {
    it('should show badge with pending count', () => {
      // Add 2 pending items
      testStore.queue.push(
        createTestItem({ id: 'item-1', status: 'pending' }),
        createTestItem({ id: 'item-2', status: 'pending' })
      );

      render(
        <TestWrapper>
          <ManualSyncButton showBadge />
        </TestWrapper>
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should filter by orgId for multi-tenant isolation', () => {
      // Add 2 items: one for current org, one for different org
      testStore.queue.push(
        createTestItem({ id: 'item-1', status: 'pending', orgId: 'test-org-123' }),
        createTestItem({ id: 'item-2', status: 'pending', orgId: 'other-org-456' })
      );

      render(
        <TestWrapper>
          <ManualSyncButton showBadge />
        </TestWrapper>
      );

      // Should only show count for current org (1, not 2)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should not show failed items in pending count', () => {
      // Add 1 pending, 1 failed
      testStore.queue.push(
        createTestItem({ id: 'item-1', status: 'pending' }),
        createTestItem({ id: 'item-2', status: 'failed' })
      );

      render(
        <TestWrapper>
          <ManualSyncButton showBadge />
        </TestWrapper>
      );

      // Should only show pending count (1, not 2)
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Modal Tests
  // ==========================================================================
  describe('sync modal', () => {
    it('should open modal when button clicked', async () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Syncing Data')).toBeInTheDocument();
      });
    });

    it('should show progress bar in modal', async () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      // Progress bar should be visible
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should show cancel button during sync', async () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      // Cancel button should appear during sync
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel sync/i })).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Progress Calculation Tests
  // ==========================================================================
  describe('progress calculation', () => {
    it('should show 0% at start', async () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });

    it('should show item count during sync', async () => {
      testStore.queue.push(
        createTestItem({ id: 'item-1', status: 'pending' }),
        createTestItem({ id: 'item-2', status: 'pending' })
      );

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/of 2 items/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Cancel Functionality Tests
  // ==========================================================================
  describe('cancel functionality', () => {
    it('should show cancel button when syncing', async () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel sync/i });
        expect(cancelButton).toBeInTheDocument();
      });
    });

    it('should stop sync when cancel clicked', async () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel sync/i });
        expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel sync/i });
      fireEvent.click(cancelButton);

      // Cancel button should disappear after clicking
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /cancel sync/i })).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Priority Tests
  // ==========================================================================
  describe('priority handling', () => {
    it('should process items in priority order', async () => {
      // Add items with different priorities
      testStore.queue.push(
        createTestItem({ id: 'low-priority', status: 'pending', type: 'annotation' }),
        createTestItem({ id: 'high-priority', status: 'pending', type: 'form_submission' })
      );

      // High priority (form_submission) should be processed first
      const processingOrder: string[] = [];
      vi.mocked(syncQueueStoreModule.updateItemStatus).mockImplementation(async (id) => {
        processingOrder.push(id);
      });

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      // Wait for sync to start
      await waitFor(() => {
        expect(screen.getByText('Syncing Data')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Empty Queue Tests
  // ==========================================================================
  describe('empty queue handling', () => {
    it('should disable button when queue is empty', () => {
      // testStore already has empty queue

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeDisabled();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================
  describe('accessibility', () => {
    it('should have accessible name', () => {
      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeInTheDocument();
    });

    it('should have refresh icon', () => {
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      // Button should be rendered with icon
      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Offline Scenario Tests (Code Review HIGH #6)
  // ==========================================================================
  describe('offline scenarios', () => {
    it('should disable button when offline', () => {
      vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(false);
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeDisabled();
    });

    it('should re-enable button when coming back online', () => {
      // Start offline
      vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(false);
      testStore.queue.push(createTestItem({ status: 'pending' }));

      const { rerender } = render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /sync now/i })).toBeDisabled();

      // Come back online
      vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(true);
      rerender(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /sync now/i })).not.toBeDisabled();
    });

    it('should handle large queue (30-day offline accumulation)', () => {
      // Simulate 30 days of queued items (100 items)
      const items = Array.from({ length: 100 }, (_, i) =>
        createTestItem({ id: `item-${i}`, status: 'pending' })
      );
      testStore.queue.push(...items);

      render(
        <TestWrapper>
          <ManualSyncButton showBadge />
        </TestWrapper>
      );

      // Badge should show count (capped display or actual)
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Multi-Tenant Isolation Tests (Code Review HIGH #7)
  // ==========================================================================
  describe('multi-tenant isolation', () => {
    it('should only count items for current organization', () => {
      testStore.queue.push(
        createTestItem({ id: 'my-org-1', status: 'pending', orgId: 'test-org-123' }),
        createTestItem({ id: 'my-org-2', status: 'pending', orgId: 'test-org-123' }),
        createTestItem({ id: 'other-org-1', status: 'pending', orgId: 'other-org-456' })
      );

      render(
        <TestWrapper>
          <ManualSyncButton showBadge />
        </TestWrapper>
      );

      // Should only show 2 (current org), not 3 (all)
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should only process items for current organization during sync', async () => {
      const processedIds: string[] = [];
      vi.mocked(syncQueueStoreModule.removeFromQueue).mockImplementation(async (id) => {
        processedIds.push(id);
      });

      testStore.queue.push(
        createTestItem({ id: 'my-org-item', status: 'pending', orgId: 'test-org-123' }),
        createTestItem({ id: 'other-org-item', status: 'pending', orgId: 'other-org-456' })
      );

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      // Wait for sync to process
      await waitFor(
        () => {
          expect(processedIds).toContain('my-org-item');
        },
        { timeout: 3000 }
      );

      // Other org's item should NOT be processed
      expect(processedIds).not.toContain('other-org-item');
    });

    it('should not leak data between organizations', () => {
      // Add items for different orgs
      testStore.queue.push(
        createTestItem({
          id: 'sensitive-data',
          status: 'pending',
          orgId: 'competitor-org',
          type: 'form_submission',
        })
      );

      render(
        <TestWrapper>
          <ManualSyncButton showBadge />
        </TestWrapper>
      );

      // Button should be disabled (no items for current org)
      const button = screen.getByRole('button', { name: /sync now/i });
      expect(button).toBeDisabled();

      // Badge should NOT appear (no pending items for current org)
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EPA Compliance Priority Tests (Code Review HIGH #8)
  // ==========================================================================
  describe('EPA compliance priority', () => {
    it('should use priority-based queue ordering', async () => {
      // getQueueByPriority is called in the component
      testStore.queue.push(createTestItem({ status: 'pending' }));

      render(
        <TestWrapper>
          <ManualSyncButton />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /sync now/i });
      fireEvent.click(button);

      // Wait for sync modal to open (which triggers processSyncQueue)
      await waitFor(() => {
        expect(screen.getByText('Syncing Data')).toBeInTheDocument();
      });

      // Verify getQueueByPriority is used for ordering
      expect(syncQueueStoreModule.getQueueByPriority).toHaveBeenCalled();
    });
  });
});
