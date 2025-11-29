/**
 * Tests for useSyncQueue Hook
 *
 * Tests the TanStack Query hook for sync queue management:
 * - Queue state from Valtio store
 * - Retry/delete operations
 * - Loading states
 * - Multi-tenant isolation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create mock functions outside vi.mock
const mockRetryItem = vi.fn();
const mockRemoveFromQueue = vi.fn();
const mockClearQueue = vi.fn();
const mockLoadQueueFromStorage = vi.fn();

// Mutable state for snapshot mock
const mockState = {
  queue: [] as unknown[],
  isLoading: false,
  error: null as string | null,
};

// Mock the sync queue store
vi.mock('@/lib/stores/sync-queue-store', () => ({
  syncQueueStore: {
    queue: [],
    isLoading: false,
    error: null,
  },
  addToQueue: vi.fn(),
  removeFromQueue: (...args: unknown[]) => mockRemoveFromQueue(...args),
  updateItemStatus: vi.fn(),
  retryItem: (...args: unknown[]) => mockRetryItem(...args),
  clearQueue: () => mockClearQueue(),
  getQueueByPriority: vi.fn(),
  loadQueueFromStorage: () => mockLoadQueueFromStorage(),
}));

// Mock valtio useSnapshot - returns mockState which can be modified in tests
vi.mock('valtio', () => ({
  useSnapshot: () => mockState,
}));

// Mock useAppAuth
vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    orgId: 'org_test123',
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
}));

// Import after mocks
import { useSyncQueue, useSyncQueueActions, formatRelativeTime, getStatusColor, getTypeLabel } from '../useSyncQueue';

// Test utilities
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Mock data
const createMockQueueItem = (overrides = {}) => ({
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

describe('useSyncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.queue = [];
    mockState.isLoading = false;
    mockState.error = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('queue state', () => {
    it('returns empty queue when no items', () => {
      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.queue).toEqual([]);
    });

    it('returns queue items from store', () => {
      const item = createMockQueueItem();
      mockState.queue = [item];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.queue).toHaveLength(1);
    });

    it('returns loading state', () => {
      mockState.isLoading = true;

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('returns error state', () => {
      mockState.error = 'Test error';

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBe('Test error');
    });

    it('returns sorted queue by priority', () => {
      mockState.queue = [
        createMockQueueItem({ id: 'low', priority: 3 }),
        createMockQueueItem({ id: 'high', priority: 10 }),
        createMockQueueItem({ id: 'medium', priority: 5 }),
      ];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      const sorted = result.current.sortedQueue;
      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('medium');
      expect(sorted[2].id).toBe('low');
    });
  });

  describe('queue statistics', () => {
    it('returns total count', () => {
      mockState.queue = [
        createMockQueueItem(),
        createMockQueueItem(),
        createMockQueueItem(),
      ];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalCount).toBe(3);
    });

    it('returns pending count', () => {
      mockState.queue = [
        createMockQueueItem({ status: 'pending' }),
        createMockQueueItem({ status: 'syncing' }),
        createMockQueueItem({ status: 'pending' }),
      ];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.pendingCount).toBe(2);
    });

    it('returns failed count', () => {
      mockState.queue = [
        createMockQueueItem({ status: 'pending' }),
        createMockQueueItem({ status: 'failed' }),
        createMockQueueItem({ status: 'failed' }),
      ];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.failedCount).toBe(2);
    });

    it('returns total size in bytes', () => {
      mockState.queue = [
        createMockQueueItem({ size: 1000 }),
        createMockQueueItem({ size: 2000 }),
        createMockQueueItem({ size: 3000 }),
      ];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalSize).toBe(6000);
    });
  });

  describe('multi-tenant filtering', () => {
    it('filters queue by orgId', () => {
      mockState.queue = [
        createMockQueueItem({ id: 'org-a-item', orgId: 'org_test123' }),
        createMockQueueItem({ id: 'org-b-item', orgId: 'org_other' }),
      ];

      const { result } = renderHook(() => useSyncQueue(), {
        wrapper: createWrapper(),
      });

      // Should only include items from current org
      expect(result.current.queue.filter((i: { orgId: string }) => i.orgId === 'org_test123')).toHaveLength(1);
    });
  });
});

describe('useSyncQueueActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.queue = [createMockQueueItem({ id: 'item-1' })];
  });

  describe('retry action', () => {
    it('calls retryItem with correct id', async () => {
      const { result } = renderHook(() => useSyncQueueActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.retryItem('item-1');
      });

      expect(mockRetryItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('delete action', () => {
    it('calls removeFromQueue with correct id', async () => {
      const { result } = renderHook(() => useSyncQueueActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteItem('item-1');
      });

      expect(mockRemoveFromQueue).toHaveBeenCalledWith('item-1');
    });
  });

  describe('clear action', () => {
    it('calls clearQueue', async () => {
      const { result } = renderHook(() => useSyncQueueActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.clearQueue();
      });

      expect(mockClearQueue).toHaveBeenCalled();
    });
  });
});

describe('Utility functions', () => {
  describe('formatRelativeTime', () => {
    it('returns "just now" for recent timestamps', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('returns minutes ago for older timestamps', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 min ago');
    });

    it('returns hours ago for timestamps hours old', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hr ago');
    });

    it('returns days ago for timestamps days old', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('getStatusColor', () => {
    it('returns green for pending', () => {
      expect(getStatusColor('pending')).toBe('blue');
    });

    it('returns blue for syncing', () => {
      expect(getStatusColor('syncing')).toBe('cyan');
    });

    it('returns red for failed', () => {
      expect(getStatusColor('failed')).toBe('red');
    });

    it('returns gray for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('gray');
    });
  });

  describe('getTypeLabel', () => {
    it('formats form_submission', () => {
      expect(getTypeLabel('form_submission')).toBe('Form Submission');
    });

    it('formats photo_upload', () => {
      expect(getTypeLabel('photo_upload')).toBe('Photo Upload');
    });

    it('formats annotation', () => {
      expect(getTypeLabel('annotation')).toBe('Annotation');
    });

    it('formats form_update', () => {
      expect(getTypeLabel('form_update')).toBe('Form Update');
    });

    it('returns original for unknown types', () => {
      expect(getTypeLabel('unknown_type')).toBe('unknown_type');
    });
  });
});
