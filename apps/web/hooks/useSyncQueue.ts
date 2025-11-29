/**
 * useSyncQueue Hook
 *
 * TanStack Query hook for sync queue management with Valtio store.
 * Provides queue state, statistics, and actions for managing offline sync operations.
 *
 * @security Multi-tenant isolation via orgId filtering
 * @offline Uses Valtio store with IndexedDB persistence
 */

import { useCallback, useMemo } from 'react';
import { useSnapshot } from 'valtio';
import { useAppAuth } from '@/app/providers';
import {
  syncQueueStore,
  SyncQueueItem,
  retryItem as storeRetryItem,
  removeFromQueue,
  clearQueue as storeClearQueue,
  loadQueueFromStorage,
  getQueueByPriority,
} from '@/lib/stores/sync-queue-store';

/**
 * Format relative time for display
 * @param timestamp - ISO timestamp string
 * @returns Human-readable relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }
  return `${diffDays} days ago`;
}

/**
 * Get status badge color
 * @param status - Sync item status
 * @returns Mantine color name
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'blue';
    case 'syncing':
      return 'cyan';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get human-readable type label
 * @param type - Queue item type
 * @returns Formatted label
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    form_submission: 'Form Submission',
    photo_upload: 'Photo Upload',
    annotation: 'Annotation',
    form_update: 'Form Update',
  };
  return labels[type] || type;
}

/**
 * Hook for sync queue state
 * @returns Queue state and computed properties
 */
export function useSyncQueue() {
  const auth = useAppAuth();
  const orgId = auth.orgId || 'default';
  const snapshot = useSnapshot(syncQueueStore);

  // Filter by orgId for multi-tenant isolation
  const queue = useMemo(() => {
    return snapshot.queue.filter((item) => item.orgId === orgId);
  }, [snapshot.queue, orgId]);

  // Sorted queue by priority (highest first)
  const sortedQueue = useMemo(() => {
    return [...queue].sort((a, b) => b.priority - a.priority);
  }, [queue]);

  // Statistics
  const totalCount = queue.length;
  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const failedCount = queue.filter((item) => item.status === 'failed').length;
  const syncingCount = queue.filter((item) => item.status === 'syncing').length;
  const totalSize = queue.reduce((sum, item) => sum + item.size, 0);

  // Get items by status
  const pendingItems = useMemo(
    () => queue.filter((item) => item.status === 'pending'),
    [queue]
  );
  const failedItems = useMemo(
    () => queue.filter((item) => item.status === 'failed'),
    [queue]
  );

  return {
    // Raw queue data
    queue,
    sortedQueue,

    // State
    isLoading: snapshot.isLoading,
    error: snapshot.error,

    // Statistics
    totalCount,
    pendingCount,
    failedCount,
    syncingCount,
    totalSize,

    // Filtered items
    pendingItems,
    failedItems,

    // Current org
    orgId,
  };
}

/**
 * Hook for sync queue actions
 * @returns Actions for managing queue items
 */
export function useSyncQueueActions() {
  const retryItem = useCallback(async (id: string) => {
    await storeRetryItem(id);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await removeFromQueue(id);
  }, []);

  const clearQueue = useCallback(async () => {
    await storeClearQueue();
  }, []);

  const loadFromStorage = useCallback(async () => {
    await loadQueueFromStorage();
  }, []);

  return {
    retryItem,
    deleteItem,
    clearQueue,
    loadFromStorage,
  };
}

/**
 * Combined hook for queue state and actions
 * @returns Queue state, statistics, and actions
 */
export function useSyncQueueWithActions() {
  const queue = useSyncQueue();
  const actions = useSyncQueueActions();

  return {
    ...queue,
    ...actions,
  };
}
