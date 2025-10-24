'use client';

import { useState, useEffect } from 'react';

/**
 * usePendingSyncCount Hook
 *
 * Returns the count of items waiting to sync when offline.
 * Currently a mock implementation - will be replaced with actual
 * offline sync engine integration in Sprint 4.
 *
 * TODO Sprint 4: Connect to IndexedDB sync queue
 */
export function usePendingSyncCount(): number {
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Mock implementation - returns 0 for now
    // In Sprint 4, this will query IndexedDB for pending operations
    setPendingCount(0);

    // TODO Sprint 4: Implement actual sync queue monitoring
    // const checkSyncQueue = async () => {
    //   const queue = await getSyncQueue();
    //   setPendingCount(queue.length);
    // };
    // checkSyncQueue();
    // const interval = setInterval(checkSyncQueue, 5000);
    // return () => clearInterval(interval);
  }, []);

  return pendingCount;
}
