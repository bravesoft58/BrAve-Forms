/**
 * Sync Status API helpers
 *
 * Fetches sync status, statistics, and storage estimates for the sync dashboard.
 * Combines data from localStorage (lastSync), navigator.storage API, and backend.
 *
 * @security All queries automatically filtered by orgId from JWT
 * @offline Works offline using localStorage and IndexedDB for cached state
 */

// Sync status types
export type SyncStatusType = 'synced' | 'syncing' | 'offline' | 'error';

/**
 * Sync status returned from API
 */
export interface SyncStatus {
  status: SyncStatusType;
  lastSync: string | null;
  nextSync: string | null;
  isOnline: boolean;
}

/**
 * Sync statistics for today's activity
 */
export interface SyncStats {
  formsSyncedToday: number;
  photosUploadedToday: number;
  pendingItems: number;
  failedItems: number;
}

/**
 * Storage estimate from browser API
 */
export interface StorageEstimate {
  used: number;
  available: number;
}

// Constants for sync configuration
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const LAST_SYNC_KEY = 'braveforms_last_sync';
const PENDING_QUEUE_KEY = 'braveforms_pending_queue';
const FAILED_QUEUE_KEY = 'braveforms_failed_queue';
const SYNC_STATS_KEY = 'braveforms_sync_stats_today';

/**
 * Get the start of today (midnight) for date comparisons
 */
function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Safely get localStorage item with SSR check
 */
function safeGetLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    console.error(`[Sync API] Failed to read localStorage key: ${key}`);
    return null;
  }
}

/**
 * Safely parse JSON with error handling
 */
function safeParseJson<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    console.error('[Sync API] Failed to parse JSON from localStorage');
    return defaultValue;
  }
}

/**
 * Fetch sync status
 *
 * Combines network status, localStorage timestamps, and pending queue state.
 *
 * @param _token - Clerk JWT token (unused for local-only data, kept for consistency)
 * @returns Current sync status with timestamps
 *
 * @offline Works fully offline using localStorage
 */
export async function fetchSyncStatus(_token: string | null): Promise<SyncStatus> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const lastSyncStr = safeGetLocalStorage(LAST_SYNC_KEY);
  const pendingQueue = safeParseJson<unknown[]>(safeGetLocalStorage(PENDING_QUEUE_KEY), []);
  const failedQueue = safeParseJson<unknown[]>(safeGetLocalStorage(FAILED_QUEUE_KEY), []);

  // Determine sync status
  let status: SyncStatusType = 'synced';

  if (!isOnline) {
    status = 'offline';
  } else if (failedQueue.length > 0) {
    status = 'error';
  } else if (pendingQueue.length > 0) {
    status = 'syncing';
  }

  // Calculate next sync time (15 minutes from last sync)
  let nextSync: string | null = null;
  if (lastSyncStr) {
    const lastSyncDate = new Date(lastSyncStr);
    const nextSyncDate = new Date(lastSyncDate.getTime() + SYNC_INTERVAL_MS);
    nextSync = nextSyncDate.toISOString();
  } else if (isOnline) {
    // If never synced, next sync is now
    nextSync = new Date().toISOString();
  }

  return {
    status,
    lastSync: lastSyncStr,
    nextSync,
    isOnline,
  };
}

/**
 * Fetch sync statistics
 *
 * Gets today's sync activity from localStorage counters.
 *
 * @param _token - Clerk JWT token (unused for local-only data, kept for consistency)
 * @returns Today's sync statistics
 *
 * @offline Works fully offline using localStorage
 */
export async function fetchSyncStats(_token: string | null): Promise<SyncStats> {
  const pendingQueue = safeParseJson<unknown[]>(safeGetLocalStorage(PENDING_QUEUE_KEY), []);
  const failedQueue = safeParseJson<unknown[]>(safeGetLocalStorage(FAILED_QUEUE_KEY), []);

  // Get today's stats from localStorage (reset daily)
  const todayKey = `${SYNC_STATS_KEY}_${getStartOfToday().toISOString().split('T')[0]}`;
  const todayStats = safeParseJson<{ forms: number; photos: number }>(
    safeGetLocalStorage(todayKey),
    { forms: 0, photos: 0 }
  );

  return {
    formsSyncedToday: todayStats.forms,
    photosUploadedToday: todayStats.photos,
    pendingItems: pendingQueue.length,
    failedItems: failedQueue.length,
  };
}

/**
 * Get storage estimate from browser API
 *
 * Uses navigator.storage.estimate() to get IndexedDB usage.
 *
 * @returns Storage usage and quota
 *
 * @offline Works offline (reads local storage state)
 */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { used: 0, available: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  } catch (error) {
    console.error('[Sync API] Failed to get storage estimate:', error);
    return { used: 0, available: 0 };
  }
}

/**
 * Calculate days remaining in 30-day offline window
 *
 * @param lastSync - Last sync timestamp or null if never synced
 * @returns Days remaining (0-30)
 */
export function calculateOfflineDaysRemaining(lastSync: Date | string | null): number {
  if (!lastSync) return 30;

  const lastSyncDate = typeof lastSync === 'string' ? new Date(lastSync) : lastSync;
  const daysSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24);

  return Math.max(0, 30 - Math.floor(daysSinceSync));
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "50.00 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Update last sync timestamp
 *
 * @param timestamp - ISO timestamp of sync completion
 */
export function updateLastSync(timestamp: string = new Date().toISOString()): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  } catch (error) {
    console.error('[Sync API] Failed to update last sync:', error);
  }
}

/**
 * Increment today's sync stats
 *
 * @param type - Type of item synced ('form' or 'photo')
 */
export function incrementSyncStat(type: 'form' | 'photo'): void {
  if (typeof window === 'undefined') return;

  try {
    const todayKey = `${SYNC_STATS_KEY}_${getStartOfToday().toISOString().split('T')[0]}`;
    const todayStats = safeParseJson<{ forms: number; photos: number }>(
      safeGetLocalStorage(todayKey),
      { forms: 0, photos: 0 }
    );

    if (type === 'form') {
      todayStats.forms++;
    } else {
      todayStats.photos++;
    }

    localStorage.setItem(todayKey, JSON.stringify(todayStats));
  } catch (error) {
    console.error('[Sync API] Failed to increment sync stat:', error);
  }
}
