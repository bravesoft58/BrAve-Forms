'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/app/providers';
import { notifications } from '@mantine/notifications';
import { createSubmission, CreateSubmissionInput } from '@/lib/api/submissions';
import { useNetworkStatus } from './useNetworkStatus';

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

      if (variables.status === 'draft') {
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
    onError: (error: Error) => {
      notifications.show({
        title: 'Submission Failed',
        message: error.message || 'Please try again',
        color: 'red',
      });
    },
  });

  return mutation;
}

/**
 * Queue submission for offline sync using IndexedDB
 */
async function queueSubmissionForSync(input: CreateSubmissionInput): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    notifications.show({
      title: 'Offline Mode',
      message: 'Submission will be synced when connection is restored',
      color: 'yellow',
    });
    return;
  }

  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offline-queue'], 'readwrite');
    const store = transaction.objectStore('offline-queue');

    const queueItem = {
      id: `offline-${Date.now()}`,
      type: 'form-submission',
      data: input,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    await store.add(queueItem);

    notifications.show({
      title: 'Queued for Sync',
      message: 'Will submit when connection is restored',
      color: 'yellow',
    });
  } catch (error) {
    console.error('Failed to queue submission:', error);
    notifications.show({
      title: 'Queue Failed',
      message: 'Failed to queue submission. Please try again.',
      color: 'red',
    });
  }
}

/**
 * Open IndexedDB database for offline queue
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brave-forms-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id' });
      }
    };
  });
}
