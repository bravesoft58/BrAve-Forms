'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/app/providers';
import { notifications } from '@mantine/notifications';
import { createSubmission, CreateSubmissionInput } from '@/lib/api/submissions';
import { useNetworkStatus } from './useNetworkStatus';

// IndexedDB configuration
const OFFLINE_DB_NAME = 'brave-forms-offline';
const OFFLINE_DB_VERSION = 1;
const OFFLINE_QUEUE_STORE = 'offline-queue';
const MAX_RETRY_COUNT = 3;

/**
 * Hook for form submission with offline queue support
 *
 * @security Requires Clerk authentication - automatically gets JWT token
 */
export function useSubmitForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token-123');
  const { isOnline } = useNetworkStatus();

  const mutation = useMutation({
    mutationFn: async (input: CreateSubmissionInput) => {
      if (!isOnline) {
        // Queue for offline sync
        await queueSubmissionForSync(input);
        return { id: `offline-${Date.now()}`, ...input };
      }

      // Submit immediately if online
      const token = await getToken();
      const response = await createSubmission(input, token);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions'] });

      if (variables.status === 'DRAFT') {
        notifications.show({
          title: 'Draft Saved',
          message: 'Draft saved successfully',
          color: 'blue',
        });
      } else {
        notifications.show({
          title: 'Form Submitted',
          message: 'Your submission has been recorded.',
          color: 'green',
        });
        // Redirect to submission view
        if (data.id && !data.id.startsWith('offline-')) {
          router.push(`/submissions/${data.id}`);
        }
      }
    },
    onError: (error: Error, variables: CreateSubmissionInput) => {
      // Log detailed error context for debugging
      console.error('[useSubmitForm] Submission failed:', {
        templateId: variables.templateId,
        status: variables.status,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      notifications.show({
        title: 'Submission Failed',
        message: error.message || 'Please try again. If offline, your submission will be queued.',
        color: 'red',
      });
    },
  });

  return mutation;
}

/**
 * Queue submission for offline sync using IndexedDB
 *
 * @param input - Submission data to queue
 * @throws {Error} If IndexedDB is not available or queue operation fails
 *
 * @offline Stores submission locally for sync when connection restores
 * @ios-warning IndexedDB may be reclaimed by iOS under low storage - critical
 *              compliance data should use SQLite via Capacitor
 */
async function queueSubmissionForSync(input: CreateSubmissionInput): Promise<void> {
  // Check for server-side rendering
  if (typeof window === 'undefined') {
    console.warn('[queueSubmissionForSync] Cannot queue on server side');
    return;
  }

  // Check for IndexedDB availability
  if (!window.indexedDB) {
    console.error('[queueSubmissionForSync] IndexedDB not available in this environment');
    notifications.show({
      title: 'Offline Storage Unavailable',
      message: 'Your browser does not support offline storage. Submission cannot be queued.',
      color: 'red',
    });
    throw new Error('IndexedDB not available');
  }

  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([OFFLINE_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE);

    const queueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'form-submission',
      data: input,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: MAX_RETRY_COUNT,
    };

    // Use a promise to properly handle the async transaction
    await new Promise<void>((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('[queueSubmissionForSync] Queued submission:', {
      id: queueItem.id,
      templateId: input.templateId,
      timestamp: queueItem.timestamp,
    });

    notifications.show({
      title: 'Queued for Sync',
      message: 'Your submission is saved locally and will be sent when connection is restored.',
      color: 'yellow',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[queueSubmissionForSync] Failed to queue submission:', {
      templateId: input.templateId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    notifications.show({
      title: 'Queue Failed',
      message: `Failed to save submission offline: ${errorMessage}. Please try again or wait for connection.`,
      color: 'red',
    });

    throw error;
  }
}

/**
 * Open IndexedDB database for offline queue
 *
 * @returns Promise resolving to IDBDatabase instance
 * @throws {DOMException} If database cannot be opened
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onerror = () => {
      console.error('[openIndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        const store = db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id' });
        // Add indexes for efficient querying
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('[openIndexedDB] Created offline queue store with indexes');
      }
    };
  });
}
