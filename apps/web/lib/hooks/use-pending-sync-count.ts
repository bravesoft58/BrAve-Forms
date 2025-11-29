'use client';

import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { syncQueueStore, loadQueueFromStorage, SyncQueueItem } from '@/lib/stores/sync-queue-store';
import { useAppAuth } from '@/app/providers';

/**
 * usePendingSyncCount Hook
 *
 * Returns the count of items waiting to sync for the current organization.
 * Uses Valtio syncQueueStore for reactive updates.
 *
 * @returns Count of pending sync items for current org
 *
 * @security Multi-tenant isolation via orgId filtering
 * @offline Reads from IndexedDB-backed sync queue
 */
export function usePendingSyncCount(): number {
  const { orgId } = useAppAuth();
  const snap = useSnapshot(syncQueueStore);

  useEffect(() => {
    // Load queue from IndexedDB on mount if not already loaded
    if (snap.queue.length === 0 && !snap.isLoading) {
      loadQueueFromStorage();
    }
  }, [snap.queue.length, snap.isLoading]);

  // Filter by orgId and count pending items
  const pendingCount = snap.queue.filter(
    (item: SyncQueueItem) => item.orgId === (orgId || 'default') && item.status === 'pending'
  ).length;

  return pendingCount;
}

/**
 * useSyncQueueStats Hook
 *
 * Returns detailed statistics about the sync queue for the current organization.
 *
 * @returns Object with pending, syncing, and failed counts
 */
export function useSyncQueueStats() {
  const { orgId } = useAppAuth();
  const snap = useSnapshot(syncQueueStore);

  useEffect(() => {
    // Load queue from IndexedDB on mount if not already loaded
    if (snap.queue.length === 0 && !snap.isLoading) {
      loadQueueFromStorage();
    }
  }, [snap.queue.length, snap.isLoading]);

  const currentOrgId = orgId || 'default';

  const orgItems = snap.queue.filter((item: SyncQueueItem) => item.orgId === currentOrgId);

  return {
    pending: orgItems.filter((item) => item.status === 'pending').length,
    syncing: orgItems.filter((item) => item.status === 'syncing').length,
    failed: orgItems.filter((item) => item.status === 'failed').length,
    total: orgItems.length,
    isLoading: snap.isLoading,
    error: snap.error,
  };
}
