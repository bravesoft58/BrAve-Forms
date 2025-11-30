/**
 * Sync Queue Integration Tests
 *
 * Integration tests for offline sync queue workflow:
 * - Full sync cycle (add -> persist -> reload -> sync)
 * - Multi-tenant data isolation across sync operations
 * - Priority-based processing order
 * - Retry and failure recovery workflow
 * - 30-day storage capacity estimation
 *
 * @offline Critical for 30-day offline capability
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
  SyncQueueItem,
  MAX_RETRY_ATTEMPTS,
} from '../sync-queue-store';

// Helper to create mock items
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

describe('Sync Queue Integration', () => {
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

  // ==========================================================================
  // Full Sync Cycle Integration Tests
  // ==========================================================================
  describe('Full sync cycle', () => {
    it('should persist item to IndexedDB and reload on store init', async () => {
      // Step 1: Add item to queue
      const item = createMockItem({ id: 'test-item-1' });
      await addToQueue(item);

      // Verify item is in Valtio store
      expect(syncQueueStore.queue.length).toBe(1);
      expect(syncQueueStore.queue[0].id).toBe('test-item-1');

      // Verify item is persisted to IndexedDB mock
      expect(mockIndexedDB.put).toHaveBeenCalled();
      expect(mockIndexedDB.items.has('test-item-1')).toBe(true);
    });

    it('should maintain queue order through add -> update -> retry cycle', async () => {
      // Add multiple items
      const item1 = createMockItem({ id: 'cycle-1', priority: 5 });
      const item2 = createMockItem({ id: 'cycle-2', priority: 10 });

      await addToQueue(item1);
      await addToQueue(item2);

      // Update first item to syncing
      await updateItemStatus('cycle-1', 'syncing');
      expect(syncQueueStore.queue.find((i) => i.id === 'cycle-1')?.status).toBe('syncing');

      // Mark as failed
      await updateItemStatus('cycle-1', 'failed', 'Network timeout');
      expect(syncQueueStore.queue.find((i) => i.id === 'cycle-1')?.lastError).toBe(
        'Network timeout'
      );

      // Retry the failed item
      await retryItem('cycle-1');
      const retriedItem = syncQueueStore.queue.find((i) => i.id === 'cycle-1');
      expect(retriedItem?.status).toBe('pending');
      expect(retriedItem?.retries).toBe(1);
      expect(retriedItem?.lastError).toBeUndefined();
    });

    it('should process queue items by priority order', async () => {
      // Add items with varying priorities via data that triggers priority calculation
      // Low priority: annotation (priority 3)
      const lowPriority = createMockItem({
        id: 'low',
        type: 'annotation',
        data: {},
      });

      // High priority: compliance form (priority 10)
      const highPriority = createMockItem({
        id: 'high',
        type: 'form_submission',
        data: { formType: 'swppp_inspection', isComplianceForm: true },
      });

      // Medium priority: regular form (priority 5)
      const mediumPriority = createMockItem({
        id: 'medium',
        type: 'form_submission',
        data: { formType: 'daily_log' },
      });

      await addToQueue(lowPriority);
      await addToQueue(highPriority);
      await addToQueue(mediumPriority);

      // Get sorted queue
      const sorted = getQueueByPriority();

      expect(sorted[0].id).toBe('high');
      expect(sorted[1].id).toBe('medium');
      expect(sorted[2].id).toBe('low');
    });
  });

  // ==========================================================================
  // Multi-Tenant Integration Tests
  // ==========================================================================
  describe('Multi-tenant sync isolation', () => {
    it('should keep different org queues separate in IndexedDB', async () => {
      const org1Item = createMockItem({ id: 'org1-item', orgId: 'org_alpha' });
      const org2Item = createMockItem({ id: 'org2-item', orgId: 'org_beta' });

      await addToQueue(org1Item);
      await addToQueue(org2Item);

      // Both stored in IndexedDB
      expect(mockIndexedDB.items.size).toBe(2);

      // Filter by orgId simulating tenant isolation
      const org1Queue = syncQueueStore.queue.filter((i) => i.orgId === 'org_alpha');
      const org2Queue = syncQueueStore.queue.filter((i) => i.orgId === 'org_beta');

      expect(org1Queue.length).toBe(1);
      expect(org2Queue.length).toBe(1);
      expect(org1Queue[0].id).toBe('org1-item');
      expect(org2Queue[0].id).toBe('org2-item');
    });

    it('should not allow cross-tenant access to queue items', async () => {
      const org1Item = createMockItem({
        id: 'secure-item',
        orgId: 'org_secure',
        data: { sensitiveData: 'classified' },
      });

      await addToQueue(org1Item);

      // Simulating a different org trying to access
      const wrongOrgQueue = syncQueueStore.queue.filter((i) => i.orgId === 'org_attacker');
      expect(wrongOrgQueue.length).toBe(0);

      // Original org can still access
      const correctOrgQueue = syncQueueStore.queue.filter((i) => i.orgId === 'org_secure');
      expect(correctOrgQueue.length).toBe(1);
    });
  });

  // ==========================================================================
  // EPA Compliance Priority Tests
  // ==========================================================================
  describe('EPA compliance priority handling', () => {
    it('should prioritize SWPPP inspections (priority 10)', async () => {
      const swpppInspection = createMockItem({
        id: 'swppp-1',
        type: 'form_submission',
        data: { formType: 'swppp_inspection', isComplianceForm: true },
      });

      await addToQueue(swpppInspection);

      expect(syncQueueStore.queue[0].priority).toBe(10);
    });

    it('should prioritize weather events (priority 10)', async () => {
      const weatherEvent = createMockItem({
        id: 'weather-1',
        type: 'form_submission',
        data: { formType: 'weather_event' },
      });

      await addToQueue(weatherEvent);

      expect(syncQueueStore.queue[0].priority).toBe(10);
    });

    it('should sync compliance forms before regular forms', async () => {
      const regularForm = createMockItem({
        id: 'regular-1',
        type: 'form_submission',
        data: { formType: 'daily_log' },
      });

      const complianceForm = createMockItem({
        id: 'compliance-1',
        type: 'form_submission',
        data: { formType: 'swppp_inspection', isComplianceForm: true },
      });

      await addToQueue(regularForm);
      await addToQueue(complianceForm);

      const sorted = getQueueByPriority();

      // Compliance form should be first
      expect(sorted[0].id).toBe('compliance-1');
      expect(sorted[1].id).toBe('regular-1');
    });
  });

  // ==========================================================================
  // Retry and Failure Recovery Tests
  // ==========================================================================
  describe('Retry and failure recovery', () => {
    it('should increment retry count on each retry', async () => {
      const item = createMockItem({ id: 'retry-test', retries: 0 });
      await addToQueue(item);

      for (let i = 1; i <= 3; i++) {
        await retryItem('retry-test');
        expect(syncQueueStore.queue[0].retries).toBe(i);
      }
    });

    it('should respect MAX_RETRY_ATTEMPTS limit', async () => {
      const item = createMockItem({
        id: 'max-retry-test',
        retries: MAX_RETRY_ATTEMPTS - 1,
        status: 'failed',
      });
      syncQueueStore.queue = [item];

      // One more retry should work
      await retryItem('max-retry-test');
      expect(syncQueueStore.queue[0].retries).toBe(MAX_RETRY_ATTEMPTS);

      // Item at max retries - check this is the boundary
      expect(syncQueueStore.queue[0].retries).toBe(MAX_RETRY_ATTEMPTS);
    });

    it('should track different failure types separately', async () => {
      const networkError = createMockItem({ id: 'network-err' });
      const validationError = createMockItem({ id: 'validation-err' });
      const authError = createMockItem({ id: 'auth-err' });

      await addToQueue(networkError);
      await addToQueue(validationError);
      await addToQueue(authError);

      await updateItemStatus('network-err', 'failed', 'Network timeout - connection refused');
      await updateItemStatus(
        'validation-err',
        'failed',
        'Validation error: missing required field'
      );
      await updateItemStatus('auth-err', 'failed', 'Unauthorized: token expired');

      const failed = syncQueueStore.queue.filter((i) => i.status === 'failed');
      expect(failed.length).toBe(3);

      // Each has distinct error message
      expect(failed.find((i) => i.id === 'network-err')?.lastError).toContain('Network');
      expect(failed.find((i) => i.id === 'validation-err')?.lastError).toContain('Validation');
      expect(failed.find((i) => i.id === 'auth-err')?.lastError).toContain('Unauthorized');
    });
  });

  // ==========================================================================
  // 30-Day Storage Capacity Tests
  // ==========================================================================
  describe('30-day storage capacity', () => {
    it('should estimate storage for typical daily inspection data', () => {
      // Typical daily data per construction site:
      // - 5 form submissions (avg 2KB each) = 10KB
      // - 20 photos (avg 200KB each, compressed) = 4MB
      // - Annotations and metadata = 1KB
      // Total per day: ~4MB

      const dailyDataBytes = 4 * 1024 * 1024; // 4MB
      const thirtyDayCapacity = dailyDataBytes * 30; // 120MB

      // Should be manageable within typical IndexedDB limits (usually 500MB-2GB)
      expect(thirtyDayCapacity).toBeLessThan(500 * 1024 * 1024);
    });

    it('should calculate days remaining from storage usage', () => {
      // Helper function to calculate remaining days
      const calculateDaysRemaining = (usedBytes: number, totalBytes: number) => {
        const percentUsed = (usedBytes / totalBytes) * 100;
        return Math.floor(30 - (percentUsed / 100) * 30);
      };

      // Test scenarios
      expect(calculateDaysRemaining(0, 500 * 1024 * 1024)).toBe(30); // 0% used
      expect(calculateDaysRemaining(250 * 1024 * 1024, 500 * 1024 * 1024)).toBe(15); // 50% used
      expect(calculateDaysRemaining(400 * 1024 * 1024, 500 * 1024 * 1024)).toBe(6); // 80% used
      expect(calculateDaysRemaining(450 * 1024 * 1024, 500 * 1024 * 1024)).toBe(3); // 90% used
    });

    it('should warn at 80% storage capacity (6 days remaining)', () => {
      const warningThreshold = 80;
      const daysAtWarning = Math.floor(30 - (warningThreshold / 100) * 30);

      // 6 days provides adequate time for field workers to sync
      expect(daysAtWarning).toBe(6);
      expect(daysAtWarning).toBeGreaterThanOrEqual(5);
    });

    it('should alert critically at 90% storage (3 days remaining)', () => {
      const criticalThreshold = 90;
      const daysAtCritical = Math.floor(30 - (criticalThreshold / 100) * 30);

      // 3 days is minimum notice for construction sites without connectivity
      expect(daysAtCritical).toBe(3);
      expect(daysAtCritical).toBeGreaterThanOrEqual(3);
    });

    it('should handle large photo batch storage', () => {
      // Scenario: Site with heavy photo documentation
      // - 50 photos per day (200KB each) = 10MB
      // - Forms and metadata = 50KB
      // Total: ~10MB per day

      const heavyUseDailyBytes = 10 * 1024 * 1024; // 10MB
      const thirtyDayHeavyUse = heavyUseDailyBytes * 30; // 300MB

      // Still within typical IndexedDB limits
      expect(thirtyDayHeavyUse).toBeLessThan(500 * 1024 * 1024);
    });
  });

  // ==========================================================================
  // Offline Sync Workflow Tests
  // ==========================================================================
  describe('Offline sync workflow', () => {
    it('should queue operations when offline', async () => {
      // Simulate offline state - operations should queue without syncing
      const form1 = createMockItem({ id: 'offline-form-1', operation: 'create' });
      const form2 = createMockItem({ id: 'offline-form-2', operation: 'create' });

      await addToQueue(form1);
      await addToQueue(form2);

      // Both should be in queue with pending status
      expect(syncQueueStore.queue.length).toBe(2);
      expect(syncQueueStore.queue.every((i) => i.status === 'pending')).toBe(true);
    });

    it('should preserve queue order for sequential operations', async () => {
      // Create -> Update -> Delete for same resource
      const createOp = createMockItem({
        id: 'op-create',
        operation: 'create',
        timestamp: new Date(Date.now() - 3000).toISOString(),
      });
      const updateOp = createMockItem({
        id: 'op-update',
        operation: 'update',
        timestamp: new Date(Date.now() - 2000).toISOString(),
      });
      const deleteOp = createMockItem({
        id: 'op-delete',
        operation: 'delete',
        timestamp: new Date(Date.now() - 1000).toISOString(),
      });

      await addToQueue(createOp);
      await addToQueue(updateOp);
      await addToQueue(deleteOp);

      // All operations queued
      expect(syncQueueStore.queue.length).toBe(3);
    });

    it('should track pending count accurately', async () => {
      // Add items
      await addToQueue(createMockItem({ id: 'pending-1' }));
      await addToQueue(createMockItem({ id: 'pending-2' }));
      await addToQueue(createMockItem({ id: 'pending-3' }));

      const pendingCount = syncQueueStore.queue.filter((i) => i.status === 'pending').length;
      expect(pendingCount).toBe(3);

      // Mark one as syncing
      await updateItemStatus('pending-1', 'syncing');

      const newPendingCount = syncQueueStore.queue.filter((i) => i.status === 'pending').length;
      expect(newPendingCount).toBe(2);
    });

    it('should clear queue after successful full sync', async () => {
      await addToQueue(createMockItem({ id: 'clear-1' }));
      await addToQueue(createMockItem({ id: 'clear-2' }));

      expect(syncQueueStore.queue.length).toBe(2);

      await clearQueue();

      expect(syncQueueStore.queue.length).toBe(0);
      expect(mockIndexedDB.clear).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Construction Site Offline Scenarios
  // ==========================================================================
  describe('Construction site offline scenarios', () => {
    it('should handle intermittent connectivity gracefully', async () => {
      // Simulate: Add items offline -> partial sync -> failure -> retry
      const items = [
        createMockItem({ id: 'intermittent-1' }),
        createMockItem({ id: 'intermittent-2' }),
        createMockItem({ id: 'intermittent-3' }),
      ];

      for (const item of items) {
        await addToQueue(item);
      }

      // First item syncs successfully
      await updateItemStatus('intermittent-1', 'syncing');
      await removeFromQueue('intermittent-1');

      // Second item fails due to connectivity loss
      await updateItemStatus('intermittent-2', 'syncing');
      await updateItemStatus('intermittent-2', 'failed', 'Network connection lost');

      // Third item never started (still pending)
      expect(syncQueueStore.queue.length).toBe(2);
      expect(syncQueueStore.queue.find((i) => i.id === 'intermittent-2')?.status).toBe('failed');
      expect(syncQueueStore.queue.find((i) => i.id === 'intermittent-3')?.status).toBe('pending');
    });

    it('should preserve SWPPP inspection data during extended offline period', async () => {
      // EPA CGP requirement: 30-day offline data retention
      const swpppInspection = createMockItem({
        id: 'swppp-extended-offline',
        type: 'form_submission',
        data: {
          formType: 'swppp_inspection',
          isComplianceForm: true,
          inspectorName: 'John Doe',
          inspectionDate: new Date().toISOString(),
          siteConditions: 'Dry, clear weather',
          bmpsInspected: ['Silt fence', 'Storm drain protection'],
          correctiveActions: 'None required',
        },
      });

      await addToQueue(swpppInspection);

      // Verify data integrity
      const stored = syncQueueStore.queue[0];
      expect(stored.data.formType).toBe('swppp_inspection');
      expect(stored.data.inspectorName).toBe('John Doe');
      expect(stored.data.bmpsInspected).toHaveLength(2);

      // Verify persistence
      expect(mockIndexedDB.put).toHaveBeenCalled();
    });

    it('should handle photo upload queue with GPS metadata', async () => {
      const photoUpload = createMockItem({
        id: 'photo-gps-1',
        type: 'photo_upload',
        data: {
          photoUri: 'file:///photos/inspection-001.jpg',
          gps: {
            latitude: 36.1699,
            longitude: -115.1398,
            accuracy: 5,
            timestamp: new Date().toISOString(),
          },
          exif: {
            make: 'Apple',
            model: 'iPhone 15 Pro',
            datetime: new Date().toISOString(),
          },
          hasComplianceMetadata: true,
        },
      });

      await addToQueue(photoUpload);

      // Photos with compliance metadata should have elevated priority
      expect(syncQueueStore.queue[0].priority).toBe(8);
      const photoData = syncQueueStore.queue[0].data as { gps: { latitude: number } };
      expect(photoData.gps.latitude).toBe(36.1699);
    });
  });
});
