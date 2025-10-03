import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import { appActions } from '../store/app.store';

// Create persister for offline capability (30-day retention)
// ISSUE-040: Simplified using idb-keyval for IndexedDB access
const createPersister = () => {
  if (typeof window === 'undefined') return undefined;

  return createAsyncStoragePersister({
    storage: {
      getItem: async (key: string) => {
        try {
          const value = await get(key);
          return value ?? null;
        } catch (error) {
          console.warn('Query cache read failed:', error);
          return null;
        }
      },
      setItem: async (key: string, value: unknown) => {
        try {
          await set(key, value);
        } catch (error) {
          console.error('Query cache write failed:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          await del(key);
        } catch (error) {
          console.warn('Query cache delete failed:', error);
        }
      },
    },
    // 30-day retention for construction site offline capability
    throttleTime: 1000,
  });
};

// Create query client with construction-optimized settings
export const createQueryClient = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 1000 * 60 * 5,
        // Keep data in cache for 30 days (offline capability)
        gcTime: 1000 * 60 * 60 * 24 * 30,
        // Retry failed requests (important for unstable construction site connectivity)
        retry: (failureCount, error: any) => {
          // Don't retry 4xx errors except for 408 (timeout) and 429 (rate limit)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            if (error?.response?.status === 408 || error?.response?.status === 429) {
              return failureCount < 3;
            }
            return false;
          }
          // Retry up to 3 times for network errors and 5xx errors
          return failureCount < 3;
        },
        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Enable background refetch for fresh data when possible
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Offline-first: queries work with cached data even without network
        networkMode: 'offlineFirst' as const,
      },
      mutations: {
        // Offline-first: mutations queue when offline and sync when online
        networkMode: 'offlineFirst' as const,
        // Retry mutations on network errors
        retry: (failureCount, error: any) => {
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false; // Don't retry client errors
          }
          return failureCount < 2; // Retry up to 2 times for server errors
        },
        // Add mutations to offline queue when they fail
        onError: (error: any, variables, context) => {
          console.error('Mutation failed:', error);

          // Add to offline queue if it's a network error
          if (!error?.response || error?.code === 'NETWORK_ERROR') {
            appActions.addToOfflineQueue({
              type: 'form_submission',
              payload: { variables, context },
              timestamp: new Date(),
              retryCount: 0,
              maxRetries: 3,
              priority: 'medium',
            });
          }
        },
        // Update sync status on mutation success
        onSuccess: () => {
          appActions.setSyncStatus('success');
        },
      },
    },
  });

  // Set up persistence
  const persister = createPersister();
  if (persister) {
    persistQueryClient({
      queryClient: client,
      persister,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      hydrateOptions: {
        // Revalidate critical data on hydration
      },
    });
  }

  return client;
};

// Singleton query client instance
let queryClient: QueryClient | null = null;

export const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
};

// Query key factory for consistent cache management
export const queryKeys = {
  // User and authentication
  user: ['user'] as const,
  profile: (userId: string) => ['user', 'profile', userId] as const,

  // Organizations
  organizations: ['organizations'] as const,
  organizationDashboard: ['organizations', 'dashboard'] as const,

  // Projects
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectInspections: (id: string) => ['projects', id, 'inspections'] as const,

  // Inspections
  inspections: ['inspections'] as const,
  inspection: (id: string) => ['inspections', id] as const,

  // Weather data (critical for EPA compliance)
  weather: ['weather'] as const,
  currentWeather: (location: string) => ['weather', 'current', location] as const,
  weatherHistory: (location: string, days: number) =>
    ['weather', 'history', location, days] as const,

  // Compliance
  compliance: ['compliance'] as const,
  complianceStatus: (projectId: string) => ['compliance', 'status', projectId] as const,
  complianceDeadlines: ['compliance', 'deadlines'] as const,

  // Forms
  forms: ['forms'] as const,
  form: (id: string) => ['forms', id] as const,
  formTemplate: (type: string) => ['forms', 'template', type] as const,

  // Files and photos
  files: ['files'] as const,
  file: (id: string) => ['files', id] as const,
  projectPhotos: (projectId: string) => ['files', 'photos', projectId] as const,
} as const;

// Network status listener to update query client behavior
if (typeof window !== 'undefined') {
  const updateNetworkStatus = async () => {
    const isOnline = navigator.onLine;
    appActions.setNetworkStatus(isOnline ? 'online' : 'offline');

    // Resume queries when coming back online
    if (isOnline && queryClient) {
      try {
        await queryClient.resumePausedMutations();
        await queryClient.refetchQueries();
      } catch (error) {
        console.error('Failed to sync after reconnection:', error);
        appActions.addNotification({
          type: 'warning',
          title: 'Sync Issue',
          message: 'Some offline changes failed to sync. Will retry automatically.',
        });
      }
    }
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // Initial status
  updateNetworkStatus();
}
