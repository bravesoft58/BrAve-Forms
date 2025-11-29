'use client';

/**
 * Sync Status TanStack Query hooks
 *
 * Provides hooks for fetching sync dashboard data with:
 * - Current sync status (synced, syncing, offline, error)
 * - Last sync and next auto-sync timestamps
 * - Sync statistics (forms synced today, photos uploaded, pending items)
 * - Storage usage metrics from browser Storage API
 * - 30-day offline countdown calculation
 *
 * @security All queries include orgId in cache key for multi-tenant isolation
 * @offline Works offline using localStorage and cached state
 */

import { useQuery } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  fetchSyncStatus,
  fetchSyncStats,
  getStorageEstimate,
  calculateOfflineDaysRemaining,
  calculateStorageDaysRemaining,
  formatBytes,
  SyncStatus,
  SyncStats,
  StorageEstimate,
} from '@/lib/api/sync';

/**
 * Hook for fetching current sync status
 *
 * @returns Query result with sync status (status, lastSync, nextSync, isOnline)
 *
 * @example
 * const { data: syncStatus, isLoading } = useSyncStatus();
 * // syncStatus?.status, syncStatus?.lastSync, etc.
 */
export function useSyncStatus() {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;
  const orgId = auth.orgId || 'default';

  return useQuery<SyncStatus>({
    queryKey: ['sync', 'status', orgId],
    queryFn: async () => {
      const token = await getToken();
      // Pass orgId for multi-tenant localStorage scoping
      return fetchSyncStatus(token, orgId);
    },
    enabled: isSignedIn,
    staleTime: 10 * 1000, // 10 seconds - sync status should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    networkMode: 'offlineFirst',
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching sync statistics
 *
 * @returns Query result with sync stats (formsSyncedToday, photosUploadedToday, pendingItems, failedItems)
 *
 * @example
 * const { data: stats, isLoading } = useSyncStats();
 * // stats?.pendingItems, stats?.formsSyncedToday, etc.
 */
export function useSyncStats() {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;
  const orgId = auth.orgId || 'default';

  return useQuery<SyncStats>({
    queryKey: ['sync', 'stats', orgId],
    queryFn: async () => {
      const token = await getToken();
      // Pass orgId for multi-tenant localStorage scoping
      return fetchSyncStats(token, orgId);
    },
    enabled: isSignedIn,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching storage estimate
 *
 * @returns Query result with storage usage (used, available bytes)
 *
 * @example
 * const { data: storage, isLoading } = useStorageEstimate();
 * // formatBytes(storage?.used), storage percentage, etc.
 */
export function useStorageEstimate() {
  const auth = useAppAuth();
  const isSignedIn = auth.isSignedIn ?? true;
  const orgId = auth.orgId || 'default';

  return useQuery<StorageEstimate>({
    queryKey: ['sync', 'storage', orgId],
    queryFn: getStorageEstimate,
    enabled: isSignedIn,
    staleTime: 60 * 1000, // 1 minute - storage doesn't change rapidly
    gcTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Combined hook for all sync dashboard data
 *
 * @returns Object with all sync-related queries
 *
 * @example
 * const { syncStatus, stats, storage, offlineDaysRemaining } = useSyncDashboard();
 */
export function useSyncDashboard() {
  const syncStatusQuery = useSyncStatus();
  const statsQuery = useSyncStats();
  const storageQuery = useStorageEstimate();

  // Calculate offline days remaining from last sync
  const offlineDaysRemaining = syncStatusQuery.data?.lastSync
    ? calculateOfflineDaysRemaining(syncStatusQuery.data.lastSync)
    : 30;

  return {
    syncStatus: syncStatusQuery,
    stats: statsQuery,
    storage: storageQuery,
    offlineDaysRemaining,
    isLoading: syncStatusQuery.isLoading || statsQuery.isLoading || storageQuery.isLoading,
    isError: syncStatusQuery.isError || statsQuery.isError || storageQuery.isError,
  };
}

// Re-export types and utility functions for consumers
export type { SyncStatus, SyncStats, StorageEstimate };
export { calculateOfflineDaysRemaining, calculateStorageDaysRemaining, formatBytes };
