import { proxy } from 'valtio';
import { syncQueueDB, IndexedDBError } from '@/lib/storage/indexed-db';

/**
 * Sync Queue Store
 *
 * Manages offline sync queue for construction compliance operations:
 * - Form submissions queued for sync
 * - Photo uploads with GPS metadata
 * - Annotations and form updates
 *
 * Priority-based sync ensures compliance-critical items sync first.
 *
 * @security Multi-tenant isolation via orgId on all items
 * @offline Items persist to IndexedDB for 30-day offline capability
 */

/**
 * Maximum number of items allowed in the sync queue
 * Prevents memory exhaustion on devices with limited resources
 */
export const MAX_QUEUE_SIZE = 1000;

/**
 * Maximum number of retry attempts for failed sync items
 * After this limit, items remain failed and require manual intervention
 */
export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Types of items that can be queued for sync
 */
export type SyncQueueItemType =
  | 'form_submission'
  | 'photo_upload'
  | 'annotation'
  | 'form_update';

/**
 * CRUD operations for sync items
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Sync item status
 */
export type SyncItemStatus = 'pending' | 'syncing' | 'failed';

/**
 * Sync queue item structure
 */
export interface SyncQueueItem {
  /** Unique identifier for the queue item */
  id: string;
  /** Type of operation being synced */
  type: SyncQueueItemType;
  /** CRUD operation */
  operation: SyncOperation;
  /** Payload data to sync */
  data: Record<string, unknown>;
  /** ISO timestamp when item was queued */
  timestamp: string;
  /** Size in bytes for storage tracking */
  size: number;
  /** Priority 1-10 (10 = highest, compliance items) */
  priority: number;
  /** Number of sync retry attempts */
  retries: number;
  /** Current sync status */
  status: SyncItemStatus;
  /** Organization ID for multi-tenant isolation */
  orgId: string;
  /** Last error message if sync failed */
  lastError?: string;
}

/**
 * Sync queue store state
 */
interface SyncQueueState {
  /** Queue of items pending sync */
  queue: SyncQueueItem[];
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message from last operation */
  error: string | null;
}

/**
 * Initial store state
 */
const initialState: SyncQueueState = {
  queue: [],
  isLoading: false,
  error: null,
};

/**
 * Sync queue store (Valtio proxy)
 */
export const syncQueueStore = proxy<SyncQueueState>(initialState);

/**
 * Generate unique ID for queue items
 */
function generateId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate priority for a sync queue item
 *
 * Priority levels:
 * - 10: Compliance forms (SWPPP, weather events, flagged compliance)
 * - 8: Photos with compliance metadata
 * - 5: Regular form submissions
 * - 3: Other operations (annotations, updates)
 *
 * @param item - Queue item to calculate priority for
 * @returns Priority value 1-10
 */
export function calculatePriority(item: Partial<SyncQueueItem>): number {
  const data = item.data || {};

  // Compliance forms get highest priority
  if (item.type === 'form_submission') {
    // Check for compliance indicators
    if (
      data.isComplianceForm === true ||
      data.formType === 'swppp_inspection' ||
      data.formType === 'weather_event'
    ) {
      return 10;
    }
    // Regular form submissions
    return 5;
  }

  // Photos with compliance metadata
  if (item.type === 'photo_upload') {
    if (data.hasComplianceMetadata === true) {
      return 8;
    }
    return 5;
  }

  // Other operations (annotations, updates)
  return 3;
}

/**
 * Add item to sync queue
 *
 * @param item - Item to add (id optional, will be generated)
 * @throws Error if queue size limit exceeded
 */
export async function addToQueue(
  item: Omit<SyncQueueItem, 'id'> & { id?: string }
): Promise<void> {
  syncQueueStore.isLoading = true;
  syncQueueStore.error = null;

  try {
    // Check queue size limit
    if (syncQueueStore.queue.length >= MAX_QUEUE_SIZE) {
      const errorMsg = `Queue size limit reached (${MAX_QUEUE_SIZE} items). Please sync existing items before adding more.`;
      syncQueueStore.error = errorMsg;
      console.error(`[SyncQueue] ${errorMsg}`, {
        currentSize: syncQueueStore.queue.length,
        maxSize: MAX_QUEUE_SIZE,
        itemType: item.type,
        orgId: item.orgId,
      });
      return;
    }

    // Generate ID if not provided
    const id = item.id || generateId();

    // Calculate priority based on item type and data
    const priority = calculatePriority(item);

    // Create complete queue item
    const queueItem: SyncQueueItem = {
      ...item,
      id,
      priority,
      status: item.status || 'pending',
      retries: item.retries || 0,
      timestamp: item.timestamp || new Date().toISOString(),
    };

    // Add to in-memory queue
    syncQueueStore.queue.push(queueItem);

    // Persist to IndexedDB
    await syncQueueDB.put(queueItem);
  } catch (error) {
    const errorContext = {
      operation: 'addToQueue',
      itemType: item.type,
      orgId: item.orgId,
      queueSize: syncQueueStore.queue.length,
    };
    const errorMsg =
      error instanceof IndexedDBError
        ? `Failed to add ${item.type} to queue: ${error.message}`
        : `Failed to add ${item.type} to sync queue`;
    syncQueueStore.error = errorMsg;
    console.error(`[SyncQueue] ${errorMsg}`, errorContext, error);
  } finally {
    syncQueueStore.isLoading = false;
  }
}

/**
 * Remove item from sync queue
 *
 * @param id - ID of item to remove
 */
export async function removeFromQueue(id: string): Promise<void> {
  syncQueueStore.isLoading = true;
  syncQueueStore.error = null;

  try {
    // Find and remove from in-memory queue
    const index = syncQueueStore.queue.findIndex((item) => item.id === id);
    const itemType = index !== -1 ? syncQueueStore.queue[index].type : 'unknown';

    if (index !== -1) {
      syncQueueStore.queue.splice(index, 1);
    }

    // Remove from IndexedDB
    await syncQueueDB.delete(id);
  } catch (error) {
    const errorMsg = `Failed to remove item "${id}" from queue: ${error instanceof Error ? error.message : 'Unknown error'}`;
    syncQueueStore.error = errorMsg;
    console.error(`[SyncQueue] ${errorMsg}`, { itemId: id }, error);
  } finally {
    syncQueueStore.isLoading = false;
  }
}

/**
 * Update item sync status
 *
 * @param id - Item ID to update
 * @param status - New status
 * @param errorMessage - Optional error message for failed status
 */
export async function updateItemStatus(
  id: string,
  status: SyncItemStatus,
  errorMessage?: string
): Promise<void> {
  syncQueueStore.isLoading = true;
  syncQueueStore.error = null;

  try {
    // Find item in queue
    const item = syncQueueStore.queue.find((i) => i.id === id);
    if (!item) {
      console.warn(`[SyncQueue] Status update failed: item "${id}" not found`);
      return;
    }

    // Update status
    item.status = status;
    if (errorMessage) {
      item.lastError = errorMessage;
    }

    // Persist to IndexedDB
    await syncQueueDB.put(item);
  } catch (error) {
    const errorMsg = `Failed to update status of "${id}" to "${status}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    syncQueueStore.error = errorMsg;
    console.error(`[SyncQueue] ${errorMsg}`, { itemId: id, newStatus: status }, error);
  } finally {
    syncQueueStore.isLoading = false;
  }
}

/**
 * Retry a failed sync item
 *
 * @param id - Item ID to retry
 * @returns true if retry was successful, false if limit exceeded
 */
export async function retryItem(id: string): Promise<boolean> {
  syncQueueStore.isLoading = true;
  syncQueueStore.error = null;

  try {
    // Find item in queue
    const item = syncQueueStore.queue.find((i) => i.id === id);
    if (!item) {
      console.warn(`[SyncQueue] Retry failed: item "${id}" not found in queue`);
      return false;
    }

    // Check retry limit
    if (item.retries >= MAX_RETRY_ATTEMPTS) {
      const errorMsg = `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached for ${item.type}. Please delete and re-create the item.`;
      syncQueueStore.error = errorMsg;
      console.error(`[SyncQueue] ${errorMsg}`, {
        itemId: id,
        itemType: item.type,
        retries: item.retries,
        maxRetries: MAX_RETRY_ATTEMPTS,
        orgId: item.orgId,
      });
      return false;
    }

    // Increment retry count and reset status
    item.retries += 1;
    item.status = 'pending';
    item.lastError = undefined;

    // Persist to IndexedDB
    await syncQueueDB.put(item);
    return true;
  } catch (error) {
    const errorMsg = `Failed to retry ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    syncQueueStore.error = errorMsg;
    console.error(`[SyncQueue] ${errorMsg}`, { itemId: id }, error);
    return false;
  } finally {
    syncQueueStore.isLoading = false;
  }
}

/**
 * Clear all items from sync queue
 */
export async function clearQueue(): Promise<void> {
  syncQueueStore.isLoading = true;
  syncQueueStore.error = null;

  const previousCount = syncQueueStore.queue.length;

  try {
    // Clear in-memory queue
    syncQueueStore.queue = [];

    // Clear IndexedDB
    await syncQueueDB.clear();
  } catch (error) {
    const errorMsg = `Failed to clear queue (${previousCount} items): ${error instanceof Error ? error.message : 'Unknown error'}`;
    syncQueueStore.error = errorMsg;
    console.error(`[SyncQueue] ${errorMsg}`, { previousCount }, error);
  } finally {
    syncQueueStore.isLoading = false;
  }
}

/**
 * Get queue items sorted by priority (highest first)
 *
 * @returns Copy of queue sorted by priority descending
 */
export function getQueueByPriority(): SyncQueueItem[] {
  // Create copy and sort by priority descending
  return [...syncQueueStore.queue].sort((a, b) => b.priority - a.priority);
}

/**
 * Load queue from IndexedDB on app startup
 */
export async function loadQueueFromStorage(): Promise<void> {
  syncQueueStore.isLoading = true;
  syncQueueStore.error = null;

  try {
    const items = await syncQueueDB.getAll();
    syncQueueStore.queue = items as SyncQueueItem[];
    console.info(`[SyncQueue] Loaded ${items.length} items from IndexedDB`);
  } catch (error) {
    const errorMsg = `Failed to load queue from storage: ${error instanceof Error ? error.message : 'Unknown error'}`;
    syncQueueStore.error = errorMsg;
    console.error(`[SyncQueue] ${errorMsg}`, error);
  } finally {
    syncQueueStore.isLoading = false;
  }
}

/**
 * Get pending items count for a specific organization
 *
 * @param orgId - Organization ID
 * @returns Count of pending items
 */
export function getPendingCountByOrg(orgId: string): number {
  return syncQueueStore.queue.filter(
    (item) => item.orgId === orgId && item.status === 'pending'
  ).length;
}

/**
 * Get failed items count
 *
 * @returns Count of failed items
 */
export function getFailedCount(): number {
  return syncQueueStore.queue.filter((item) => item.status === 'failed').length;
}

/**
 * Reset store to initial state
 * Useful for testing and logout
 */
export function resetSyncQueueStore(): void {
  Object.assign(syncQueueStore, initialState);
}
