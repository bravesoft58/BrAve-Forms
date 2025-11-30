/**
 * Storage Utilities
 *
 * Functions for calculating storage usage and managing IndexedDB data.
 * Uses the Storage Estimation API where available.
 */

/**
 * Storage breakdown by category
 */
export interface StorageBreakdown {
  forms: number;
  photos: number;
  cache: number;
  settings: number;
  other: number;
}

/**
 * Complete storage information
 */
export interface StorageInfo {
  usage: number;
  quota: number;
  percentUsed: number;
  breakdown: StorageBreakdown;
  available: number;
}

/**
 * App version information
 */
export interface AppInfo {
  version: string;
  build: string;
  platform: 'web' | 'ios' | 'android';
  environment: 'development' | 'staging' | 'production';
}

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  return `${(bytes / Math.pow(k, index)).toFixed(2)} ${sizes[index]}`;
}

/**
 * Check if Storage API is available
 */
export function isStorageAPIAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage
  );
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Get storage estimate from browser
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!isStorageAPIAvailable()) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch {
    console.warn('Failed to get storage estimate');
    return null;
  }
}

/**
 * Calculate storage percentage used
 */
export function calculatePercentage(usage: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.min(100, (usage / quota) * 100);
}

/**
 * Get storage color based on percentage
 */
export function getStorageColor(percentage: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (percentage >= 90) return 'red';
  if (percentage >= 75) return 'orange';
  if (percentage >= 50) return 'yellow';
  return 'green';
}

/**
 * Estimate storage breakdown by checking localStorage keys
 * This is an approximation since we cannot get exact IndexedDB store sizes
 */
export function estimateStorageBreakdown(totalUsage: number): StorageBreakdown {
  // In a real implementation, this would query IndexedDB stores
  // For now, estimate based on typical usage patterns
  const settingsSize = getLocalStorageSize();

  // Estimate remaining breakdown proportionally
  const remaining = Math.max(0, totalUsage - settingsSize);

  return {
    forms: Math.round(remaining * 0.15), // ~15% forms
    photos: Math.round(remaining * 0.7), // ~70% photos (largest)
    cache: Math.round(remaining * 0.1), // ~10% cache
    settings: settingsSize,
    other: Math.round(remaining * 0.05), // ~5% other
  };
}

/**
 * Get localStorage size in bytes
 */
export function getLocalStorageSize(): number {
  if (typeof localStorage === 'undefined') return 0;

  let total = 0;
  const length = localStorage.length;
  for (let i = 0; i < length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        // Each character is 2 bytes in JavaScript strings (UTF-16)
        total += (key.length + value.length) * 2;
      }
    }
  }
  return total;
}

/**
 * Get complete storage information
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  const estimate = await getStorageEstimate();

  if (!estimate) {
    // Return fallback values when API not available
    const settingsSize = getLocalStorageSize();
    return {
      usage: settingsSize,
      quota: 0,
      percentUsed: 0,
      available: 0,
      breakdown: {
        forms: 0,
        photos: 0,
        cache: 0,
        settings: settingsSize,
        other: 0,
      },
    };
  }

  const { usage, quota } = estimate;
  const percentUsed = calculatePercentage(usage, quota);
  const breakdown = estimateStorageBreakdown(usage);

  return {
    usage,
    quota,
    percentUsed,
    available: Math.max(0, quota - usage),
    breakdown,
  };
}

/**
 * Clear all data from a specific IndexedDB database
 */
export async function clearIndexedDBDatabase(dbName: string): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      request.onblocked = () => {
        console.warn(`Database ${dbName} deletion blocked - close other tabs`);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

/**
 * Clear localStorage settings (preserves critical data)
 */
export function clearLocalStorageCache(): void {
  if (typeof localStorage === 'undefined') return;

  // Keys to preserve (critical settings)
  const preserveKeys = ['braveforms-settings', 'clerk-auth'];

  const keysToRemove: string[] = [];
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      if (!preserveKeys.some((preserve) => key.startsWith(preserve))) {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clear cache data only (preserves forms and photos)
 */
export async function clearCacheData(): Promise<boolean> {
  try {
    // Clear localStorage cache entries
    clearLocalStorageCache();

    // Clear braveforms-cache IndexedDB if it exists
    await clearIndexedDBDatabase('braveforms-cache');

    // Clear service worker caches
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      const cachePromises = cacheKeys
        .filter((key) => key.includes('cache') || key.includes('runtime'))
        .map((key) => caches.delete(key));
      await Promise.all(cachePromises);
    }

    return true;
  } catch {
    console.error('Failed to clear cache data');
    return false;
  }
}

/**
 * Clear all offline data (forms, photos, cache)
 * WARNING: This is destructive and should require double confirmation
 */
export async function clearAllData(): Promise<boolean> {
  try {
    // Clear all localStorage except auth
    if (typeof localStorage !== 'undefined') {
      const preserveKeys = ['clerk-auth'];
      const keysToRemove: string[] = [];

      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          if (!preserveKeys.some((preserve) => key.startsWith(preserve))) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    // Clear all IndexedDB databases
    const dbNames = [
      'braveforms',
      'braveforms-forms',
      'braveforms-photos',
      'braveforms-cache',
      'braveforms-support',
    ];

    for (const dbName of dbNames) {
      await clearIndexedDBDatabase(dbName);
    }

    // Clear all service worker caches
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    return true;
  } catch {
    console.error('Failed to clear all data');
    return false;
  }
}

/**
 * Get app version information
 */
export function getAppInfo(): AppInfo {
  // Check for Capacitor (mobile app)
  const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

  let platform: AppInfo['platform'] = 'web';
  if (isCapacitor) {
    // In real implementation, would use Capacitor Device plugin
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      platform = 'ios';
    } else if (/Android/.test(userAgent)) {
      platform = 'android';
    }
  }

  // Determine environment
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  let environment: AppInfo['environment'] = 'production';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    environment = 'development';
  } else if (hostname.includes('staging') || hostname.includes('preview')) {
    environment = 'staging';
  }

  return {
    version: '1.0.0',
    build: '2025.11.29',
    platform,
    environment,
  };
}
