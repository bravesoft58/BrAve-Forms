/**
 * TanStack Query hooks for Support Requests
 *
 * ISSUE-174: Support request backend integration for help/feedback system.
 * Supports offline queue processing when requests are synced.
 *
 * @security Requires Clerk authentication via useAppAuth()
 * @offline Uses offlineFirst networkMode for construction site use
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  getMySupportRequests,
  getSupportRequest,
  createSupportRequest,
  type CreateSupportRequestInput,
  type SupportRequest,
} from '@/lib/api/support';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum retry attempts for offline sync before marking as failed
 * After this limit, items are moved to dead letter queue
 */
export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Stale time for support request queries (5 minutes)
 */
export const STALE_TIME_MS = 1000 * 60 * 5;

/**
 * Garbage collection time for query cache (24 hours)
 */
export const GC_TIME_MS = 1000 * 60 * 60 * 24;

/**
 * IndexedDB database name for support requests
 */
export const SUPPORT_DB_NAME = 'braveforms-support';

/**
 * IndexedDB database version
 */
export const SUPPORT_DB_VERSION = 2;

/**
 * Query keys for support requests
 */
export const supportRequestKeys = {
  all: ['supportRequests'] as const,
  mine: () => [...supportRequestKeys.all, 'mine'] as const,
  detail: (id: string) => [...supportRequestKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch current user's support requests
 *
 * @returns Query result with support requests
 */
export function useMySupportRequests() {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: supportRequestKeys.mine(),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      return getMySupportRequests(token);
    },
    enabled: isSignedIn,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch a single support request by ID
 *
 * @param id - Support request ID
 * @returns Query result with support request
 */
export function useSupportRequest(id: string | undefined) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: supportRequestKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const token = getToken ? await getToken() : null;
      return getSupportRequest(id, token);
    },
    enabled: isSignedIn && !!id,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to create a new support request
 *
 * Supports offline queue processing:
 * - If online, sends request directly to backend
 * - If offline, queues request in IndexedDB for later sync
 *
 * @returns Mutation result for creating support request
 */
export function useCreateSupportRequest() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSupportRequestInput) => {
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!isOnline) {
        // Queue for offline sync
        const offlineRequest = await queueOfflineSupportRequest(input);
        return offlineRequest;
      }

      // Send to backend
      const token = getToken ? await getToken() : null;
      return createSupportRequest(input, token);
    },
    onSuccess: () => {
      // Invalidate support requests cache
      queryClient.invalidateQueries({ queryKey: supportRequestKeys.all });
    },
  });
}

/**
 * Queue a support request for offline sync
 *
 * Stores request in IndexedDB to be synced when back online.
 *
 * @param input - Support request input
 * @returns Offline queued request with temporary ID
 */
async function queueOfflineSupportRequest(
  input: CreateSupportRequestInput
): Promise<SupportRequest> {
  const offlineId = `offline-${Date.now()}`;
  const now = new Date().toISOString();

  const offlineRequest: SupportRequest = {
    id: offlineId,
    userId: 'offline',
    orgId: 'offline',
    type: input.type,
    subject: input.subject,
    description: input.description,
    status: 'OPEN',
    priority: input.priority || 'NORMAL',
    createdAt: now,
    updatedAt: now,
  };

  // Store in IndexedDB
  try {
    const db = await openSupportDB();
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        id: offlineId,
        input,
        timestamp: now,
        retryCount: 0,
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch (error) {
    console.error('Failed to queue offline support request:', error);
  }

  return offlineRequest;
}

/**
 * Open IndexedDB database for support offline queue
 */
async function openSupportDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SUPPORT_DB_NAME, SUPPORT_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create requests store if it doesn't exist (legacy)
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id' });
      }
      // Create offline queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id' });
      }
      // Create dead letter queue for failed items exceeding MAX_RETRY_ATTEMPTS
      if (!db.objectStoreNames.contains('deadLetterQueue')) {
        db.createObjectStore('deadLetterQueue', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Sync offline support requests when back online
 *
 * Called by online event listener to process queued requests.
 * Items exceeding MAX_RETRY_ATTEMPTS are moved to dead letter queue.
 *
 * @returns Object with synced, failed, and deadLettered counts
 */
export async function syncOfflineSupportRequests(
  getToken: (() => Promise<string | null>) | undefined
): Promise<{ synced: number; failed: number; deadLettered: number }> {
  let synced = 0;
  let failed = 0;
  let deadLettered = 0;

  try {
    const db = await openSupportDB();
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');

    const items = await new Promise<Array<{
      id: string;
      input: CreateSupportRequestInput;
      retryCount: number;
      timestamp: string;
    }>>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    // Process each queued request
    const token = getToken ? await getToken() : null;

    for (const item of items) {
      // Check if max retries exceeded - move to dead letter queue
      if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.warn(
          `Support request ${item.id} exceeded max retries (${MAX_RETRY_ATTEMPTS}), moving to dead letter queue`
        );
        await moveToDeadLetterQueue(item);
        deadLettered++;
        continue;
      }

      try {
        await createSupportRequest(item.input, token);
        await removeFromOfflineQueue(item.id);
        synced++;
      } catch (error) {
        console.error(`Failed to sync support request ${item.id}:`, error);
        await incrementRetryCount(item.id);
        failed++;
      }
    }
  } catch (error) {
    console.error('Failed to sync offline support requests:', error);
  }

  return { synced, failed, deadLettered };
}

/**
 * Remove item from offline queue after successful sync
 */
async function removeFromOfflineQueue(id: string): Promise<void> {
  const db = await openSupportDB();
  const transaction = db.transaction(['offlineQueue'], 'readwrite');
  const store = transaction.objectStore('offlineQueue');
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

/**
 * Increment retry count for failed sync attempts
 */
async function incrementRetryCount(id: string): Promise<void> {
  const db = await openSupportDB();
  const transaction = db.transaction(['offlineQueue'], 'readwrite');
  const store = transaction.objectStore('offlineQueue');

  const item = await new Promise<{
    id: string;
    input: CreateSupportRequestInput;
    retryCount: number;
    timestamp: string;
  } | undefined>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (item) {
    item.retryCount = (item.retryCount || 0) + 1;
    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  db.close();
}

/**
 * Move item from offline queue to dead letter queue
 * Items are moved here when they exceed MAX_RETRY_ATTEMPTS
 */
async function moveToDeadLetterQueue(item: {
  id: string;
  input: CreateSupportRequestInput;
  retryCount: number;
  timestamp: string;
}): Promise<void> {
  const db = await openSupportDB();
  const transaction = db.transaction(['offlineQueue', 'deadLetterQueue'], 'readwrite');
  const offlineStore = transaction.objectStore('offlineQueue');
  const deadLetterStore = transaction.objectStore('deadLetterQueue');

  // Add to dead letter queue with failure metadata
  await new Promise<void>((resolve, reject) => {
    const request = deadLetterStore.add({
      ...item,
      movedToDeadLetterAt: new Date().toISOString(),
      reason: `Exceeded max retry attempts (${MAX_RETRY_ATTEMPTS})`,
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // Remove from offline queue
  await new Promise<void>((resolve, reject) => {
    const request = offlineStore.delete(item.id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

/**
 * Get items from dead letter queue for manual review/retry
 * @returns Array of failed support request items
 */
export async function getDeadLetterQueueItems(): Promise<Array<{
  id: string;
  input: CreateSupportRequestInput;
  retryCount: number;
  timestamp: string;
  movedToDeadLetterAt: string;
  reason: string;
}>> {
  try {
    const db = await openSupportDB();
    const transaction = db.transaction(['deadLetterQueue'], 'readonly');
    const store = transaction.objectStore('deadLetterQueue');

    const items = await new Promise<Array<{
      id: string;
      input: CreateSupportRequestInput;
      retryCount: number;
      timestamp: string;
      movedToDeadLetterAt: string;
      reason: string;
    }>>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return items;
  } catch (error) {
    console.error('Failed to get dead letter queue items:', error);
    return [];
  }
}
