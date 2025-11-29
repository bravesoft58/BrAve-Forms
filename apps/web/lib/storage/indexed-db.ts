/**
 * IndexedDB Storage Wrapper
 *
 * Provides typed wrappers for IndexedDB operations used by the offline sync queue.
 * Supports 30-day offline capability for construction field operations.
 *
 * @warning iOS IndexedDB is transient - OS can reclaim storage.
 * Critical compliance data should use SQLite on mobile.
 *
 * @security All data includes orgId for multi-tenant isolation
 */

const DB_NAME = 'brave-forms-offline';
const DB_VERSION = 1;

/**
 * Custom error class for IndexedDB operations with enhanced context
 */
export class IndexedDBError extends Error {
  public readonly operation: string;
  public readonly storeName: string;
  public readonly originalError?: DOMException | null;

  constructor(
    message: string,
    operation: string,
    storeName: string,
    originalError?: DOMException | null
  ) {
    const contextMessage = `IndexedDB ${operation} failed on store "${storeName}": ${message}`;
    super(contextMessage);
    this.name = 'IndexedDBError';
    this.operation = operation;
    this.storeName = storeName;
    this.originalError = originalError;

    // Log error with context for debugging
    console.error(`[IndexedDB Error]`, {
      operation,
      storeName,
      message,
      originalError: originalError?.message,
      code: originalError?.code,
    });
  }
}

/**
 * Detect if running on iOS
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check for iOS IndexedDB limitations and log warning
 * iOS may reclaim IndexedDB storage under low-storage conditions
 */
export function checkIOSIndexedDBWarning(): void {
  if (isIOSDevice()) {
    console.warn(
      '[BrAve Forms] Running on iOS: IndexedDB storage may be reclaimed by the OS under low storage conditions. ' +
        'Critical compliance data (inspections, photos, audit trails) should be stored using SQLite for persistence. ' +
        'See: CLAUDE.md iOS Storage Persistence section.'
    );
  }
}

/**
 * Store names in the database
 */
const STORES = {
  SYNC_QUEUE: 'sync-queue',
  FORMS: 'forms',
  PHOTOS: 'photos',
} as const;

// Track if iOS warning has been shown
let iosWarningShown = false;

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (typeof indexedDB === 'undefined') {
      reject(
        new IndexedDBError(
          'IndexedDB is not available in this environment',
          'open',
          DB_NAME,
          null
        )
      );
      return;
    }

    // Show iOS warning once on first database access
    if (!iosWarningShown) {
      checkIOSIndexedDBWarning();
      iosWarningShown = true;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(
        new IndexedDBError(
          request.error?.message || 'Failed to open database',
          'open',
          DB_NAME,
          request.error
        )
      );
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sync queue store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        store.createIndex('orgId', 'orgId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create forms store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.FORMS)) {
        const store = db.createObjectStore(STORES.FORMS, { keyPath: 'id' });
        store.createIndex('orgId', 'orgId', { unique: false });
      }

      // Create photos store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
        const store = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
        store.createIndex('orgId', 'orgId', { unique: false });
        store.createIndex('formId', 'formId', { unique: false });
      }
    };
  });
}

/**
 * Generic store wrapper for IndexedDB operations
 */
interface StoreWrapper<T> {
  getAll(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  put(item: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Create a store wrapper for the given store name
 */
function createStoreWrapper<T>(storeName: string): StoreWrapper<T> {
  return {
    async getAll(): Promise<T[]> {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () =>
          reject(
            new IndexedDBError(
              request.error?.message || 'Failed to get all items',
              'getAll',
              storeName,
              request.error
            )
          );
        request.onsuccess = () => resolve(request.result as T[]);
      });
    },

    async get(id: string): Promise<T | undefined> {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onerror = () =>
          reject(
            new IndexedDBError(
              request.error?.message || `Failed to get item with id "${id}"`,
              'get',
              storeName,
              request.error
            )
          );
        request.onsuccess = () => resolve(request.result as T | undefined);
      });
    },

    async put(item: T): Promise<void> {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onerror = () =>
          reject(
            new IndexedDBError(
              request.error?.message || 'Failed to put item',
              'put',
              storeName,
              request.error
            )
          );
        request.onsuccess = () => resolve();
      });
    },

    async delete(id: string): Promise<void> {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onerror = () =>
          reject(
            new IndexedDBError(
              request.error?.message || `Failed to delete item with id "${id}"`,
              'delete',
              storeName,
              request.error
            )
          );
        request.onsuccess = () => resolve();
      });
    },

    async clear(): Promise<void> {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () =>
          reject(
            new IndexedDBError(
              request.error?.message || 'Failed to clear store',
              'clear',
              storeName,
              request.error
            )
          );
        request.onsuccess = () => resolve();
      });
    },
  };
}

/**
 * Sync queue store wrapper
 */
export const syncQueueDB = createStoreWrapper<{
  id: string;
  type: string;
  operation: string;
  data: Record<string, unknown>;
  timestamp: string;
  size: number;
  priority: number;
  retries: number;
  status: string;
  orgId: string;
  lastError?: string;
}>(STORES.SYNC_QUEUE);

/**
 * Forms store wrapper (for offline form data)
 */
export const formsDB = createStoreWrapper<{
  id: string;
  orgId: string;
  data: Record<string, unknown>;
  savedAt: string;
}>(STORES.FORMS);

/**
 * Photos store wrapper (for offline photo data)
 */
export const photosDB = createStoreWrapper<{
  id: string;
  orgId: string;
  formId?: string;
  blob?: Blob;
  thumbnail?: string;
  metadata: Record<string, unknown>;
  savedAt: string;
}>(STORES.PHOTOS);

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Get estimated storage usage
 * Uses Storage API if available
 */
export async function getStorageUsage(): Promise<{
  used: number;
  available: number;
  percentage: number;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const available = estimate.quota || 0;
    return {
      used,
      available,
      percentage: available > 0 ? (used / available) * 100 : 0,
    };
  }
  return { used: 0, available: 0, percentage: 0 };
}
