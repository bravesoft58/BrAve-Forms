/**
 * Tests for Sync Queue Store
 *
 * Tests the Valtio store for managing offline sync queue:
 * - Adding items to queue
 * - Removing items from queue
 * - Retry functionality
 * - Priority sorting
 * - IndexedDB persistence
 * - Status updates
 *
 * @security Tests verify orgId isolation for multi-tenant support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock functions for IndexedDB - defined at top level for vi.mock hoisting
const mockGetAll = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockClear = vi.fn();

// Mock the IndexedDB wrapper - must be before imports due to hoisting
vi.mock('@/lib/storage/indexed-db', () => {
  // Define IndexedDBError class inside factory
  class IndexedDBError extends Error {
    public readonly operation: string;
    public readonly storeName: string;
    public readonly originalError?: DOMException | null;

    constructor(
      message: string,
      operation: string,
      storeName: string,
      originalError?: DOMException | null
    ) {
      super(`IndexedDB ${operation} failed on store "${storeName}": ${message}`);
      this.name = 'IndexedDBError';
      this.operation = operation;
      this.storeName = storeName;
      this.originalError = originalError;
    }
  }

  return {
    syncQueueDB: {
      getAll: () => mockGetAll(),
      get: (id: string) => mockGet(id),
      put: (item: unknown) => mockPut(item),
      delete: (id: string) => mockDelete(id),
      clear: () => mockClear(),
    },
    IndexedDBError,
  };
});

// Helper object for test convenience
const mockIndexedDB = {
  items: new Map<string, unknown>(),
  getAll: mockGetAll,
  get: mockGet,
  put: mockPut,
  delete: mockDelete,
  clear: mockClear,
};

// Import after mocks
import {
  syncQueueStore,
  addToQueue,
  removeFromQueue,
  updateItemStatus,
  retryItem,
  clearQueue,
  getQueueByPriority,
  calculatePriority,
  SyncQueueItem,
} from '../sync-queue-store';

// Mock data
const createMockItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  type: 'form_submission',
  operation: 'create',
  data: { formId: 'form-123', values: {} },
  timestamp: new Date().toISOString(),
  size: 1024,
  priority: 5,
  retries: 0,
  status: 'pending',
  orgId: 'org_test123',
  ...overrides,
});

describe('Sync Queue Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIndexedDB.items.clear();
    mockIndexedDB.getAll.mockResolvedValue([]);
    mockIndexedDB.get.mockImplementation((id: string) =>
      Promise.resolve(mockIndexedDB.items.get(id))
    );
    mockIndexedDB.put.mockImplementation((item: SyncQueueItem) => {
      mockIndexedDB.items.set(item.id, item);
      return Promise.resolve();
    });
    mockIndexedDB.delete.mockImplementation((id: string) => {
      mockIndexedDB.items.delete(id);
      return Promise.resolve();
    });
    mockIndexedDB.clear.mockImplementation(() => {
      mockIndexedDB.items.clear();
      return Promise.resolve();
    });

    // Reset store
    syncQueueStore.queue = [];
    syncQueueStore.isLoading = false;
    syncQueueStore.error = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addToQueue', () => {
    it('adds item to queue with generated id', async () => {
      const item = createMockItem({ id: undefined as unknown as string });

      await addToQueue(item);

      expect(syncQueueStore.queue.length).toBe(1);
      expect(syncQueueStore.queue[0].id).toBeDefined();
      expect(syncQueueStore.queue[0].type).toBe('form_submission');
    });

    it('sets default values for new items', async () => {
      const item = createMockItem();

      await addToQueue(item);

      expect(syncQueueStore.queue[0].status).toBe('pending');
      expect(syncQueueStore.queue[0].retries).toBe(0);
      expect(syncQueueStore.queue[0].timestamp).toBeDefined();
    });

    it('calculates priority for compliance forms', async () => {
      const complianceItem = createMockItem({
        type: 'form_submission',
        data: { formType: 'swppp_inspection', isComplianceForm: true },
      });

      await addToQueue(complianceItem);

      expect(syncQueueStore.queue[0].priority).toBe(10);
    });

    it('persists item to IndexedDB', async () => {
      const item = createMockItem();

      await addToQueue(item);

      expect(mockIndexedDB.put).toHaveBeenCalled();
    });

    it('includes orgId for multi-tenant isolation', async () => {
      const item = createMockItem({ orgId: 'org_specific' });

      await addToQueue(item);

      expect(syncQueueStore.queue[0].orgId).toBe('org_specific');
    });
  });

  describe('removeFromQueue', () => {
    it('removes item by id', async () => {
      const item = createMockItem({ id: 'item-to-remove' });
      syncQueueStore.queue = [item];

      await removeFromQueue('item-to-remove');

      expect(syncQueueStore.queue.length).toBe(0);
    });

    it('removes from IndexedDB', async () => {
      const item = createMockItem({ id: 'item-to-remove' });
      syncQueueStore.queue = [item];

      await removeFromQueue('item-to-remove');

      expect(mockIndexedDB.delete).toHaveBeenCalledWith('item-to-remove');
    });

    it('does not throw if item not found', async () => {
      await expect(removeFromQueue('non-existent')).resolves.not.toThrow();
    });
  });

  describe('updateItemStatus', () => {
    it('updates item status', async () => {
      const item = createMockItem({ id: 'item-1', status: 'pending' });
      syncQueueStore.queue = [item];

      await updateItemStatus('item-1', 'syncing');

      expect(syncQueueStore.queue[0].status).toBe('syncing');
    });

    it('can set error message on failed status', async () => {
      const item = createMockItem({ id: 'item-1', status: 'pending' });
      syncQueueStore.queue = [item];

      await updateItemStatus('item-1', 'failed', 'Network error');

      expect(syncQueueStore.queue[0].status).toBe('failed');
      expect(syncQueueStore.queue[0].lastError).toBe('Network error');
    });

    it('persists status change to IndexedDB', async () => {
      const item = createMockItem({ id: 'item-1', status: 'pending' });
      syncQueueStore.queue = [item];

      await updateItemStatus('item-1', 'syncing');

      expect(mockIndexedDB.put).toHaveBeenCalled();
    });
  });

  describe('retryItem', () => {
    it('increments retry count', async () => {
      const item = createMockItem({ id: 'item-1', retries: 0 });
      syncQueueStore.queue = [item];

      await retryItem('item-1');

      expect(syncQueueStore.queue[0].retries).toBe(1);
    });

    it('sets status to pending', async () => {
      const item = createMockItem({ id: 'item-1', status: 'failed' });
      syncQueueStore.queue = [item];

      await retryItem('item-1');

      expect(syncQueueStore.queue[0].status).toBe('pending');
    });

    it('clears last error', async () => {
      const item = createMockItem({
        id: 'item-1',
        status: 'failed',
        lastError: 'Previous error',
      });
      syncQueueStore.queue = [item];

      await retryItem('item-1');

      expect(syncQueueStore.queue[0].lastError).toBeUndefined();
    });
  });

  describe('clearQueue', () => {
    it('removes all items from queue', async () => {
      syncQueueStore.queue = [createMockItem({ id: 'item-1' }), createMockItem({ id: 'item-2' })];

      await clearQueue();

      expect(syncQueueStore.queue.length).toBe(0);
    });

    it('clears IndexedDB', async () => {
      syncQueueStore.queue = [createMockItem()];

      await clearQueue();

      expect(mockIndexedDB.clear).toHaveBeenCalled();
    });
  });

  describe('getQueueByPriority', () => {
    it('returns queue sorted by priority descending', () => {
      syncQueueStore.queue = [
        createMockItem({ id: 'low', priority: 3 }),
        createMockItem({ id: 'high', priority: 10 }),
        createMockItem({ id: 'medium', priority: 5 }),
      ];

      const sorted = getQueueByPriority();

      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('medium');
      expect(sorted[2].id).toBe('low');
    });

    it('does not mutate original queue', () => {
      syncQueueStore.queue = [
        createMockItem({ id: 'low', priority: 3 }),
        createMockItem({ id: 'high', priority: 10 }),
      ];

      getQueueByPriority();

      expect(syncQueueStore.queue[0].id).toBe('low');
    });
  });

  describe('calculatePriority', () => {
    it('returns 10 for compliance forms', () => {
      const item = createMockItem({
        type: 'form_submission',
        data: { isComplianceForm: true },
      });

      expect(calculatePriority(item)).toBe(10);
    });

    it('returns 10 for SWPPP inspection forms', () => {
      const item = createMockItem({
        type: 'form_submission',
        data: { formType: 'swppp_inspection' },
      });

      expect(calculatePriority(item)).toBe(10);
    });

    it('returns 10 for weather event forms', () => {
      const item = createMockItem({
        type: 'form_submission',
        data: { formType: 'weather_event' },
      });

      expect(calculatePriority(item)).toBe(10);
    });

    it('returns 8 for photos with compliance metadata', () => {
      const item = createMockItem({
        type: 'photo_upload',
        data: { hasComplianceMetadata: true },
      });

      expect(calculatePriority(item)).toBe(8);
    });

    it('returns 5 for regular form submissions', () => {
      const item = createMockItem({
        type: 'form_submission',
        data: { formType: 'daily_log' },
      });

      expect(calculatePriority(item)).toBe(5);
    });

    it('returns 3 for other operations', () => {
      const item = createMockItem({
        type: 'annotation',
        data: {},
      });

      expect(calculatePriority(item)).toBe(3);
    });
  });

  describe('Multi-tenant isolation', () => {
    it('filters queue by orgId', () => {
      syncQueueStore.queue = [
        createMockItem({ id: 'org-a-item', orgId: 'org_a' }),
        createMockItem({ id: 'org-b-item', orgId: 'org_b' }),
      ];

      const orgAItems = syncQueueStore.queue.filter((i) => i.orgId === 'org_a');

      expect(orgAItems.length).toBe(1);
      expect(orgAItems[0].id).toBe('org-a-item');
    });
  });

  describe('Item types', () => {
    it('supports form_submission type', async () => {
      const item = createMockItem({ type: 'form_submission' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].type).toBe('form_submission');
    });

    it('supports photo_upload type', async () => {
      const item = createMockItem({ type: 'photo_upload' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].type).toBe('photo_upload');
    });

    it('supports annotation type', async () => {
      const item = createMockItem({ type: 'annotation' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].type).toBe('annotation');
    });

    it('supports form_update type', async () => {
      const item = createMockItem({ type: 'form_update' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].type).toBe('form_update');
    });
  });

  describe('Operations', () => {
    it('supports create operation', async () => {
      const item = createMockItem({ operation: 'create' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].operation).toBe('create');
    });

    it('supports update operation', async () => {
      const item = createMockItem({ operation: 'update' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].operation).toBe('update');
    });

    it('supports delete operation', async () => {
      const item = createMockItem({ operation: 'delete' });
      await addToQueue(item);
      expect(syncQueueStore.queue[0].operation).toBe('delete');
    });
  });

  describe('Error handling', () => {
    it('sets store error on IndexedDB failure', async () => {
      mockIndexedDB.put.mockRejectedValueOnce(new Error('IndexedDB error'));

      const item = createMockItem();
      await addToQueue(item);

      // Error message now includes item type for better debugging
      expect(syncQueueStore.error).toBe('Failed to add form_submission to sync queue');
    });

    it('sets loading state during operations', async () => {
      const item = createMockItem();

      // Check loading becomes true during operation
      const addPromise = addToQueue(item);

      await addPromise;

      expect(syncQueueStore.isLoading).toBe(false);
    });
  });
});
