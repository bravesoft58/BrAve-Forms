import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { appActions } from '../store/app.store';

// Create persister for offline capability (30-day retention)
const createPersister = () => {
  if (typeof window === 'undefined') return undefined;

  return createAsyncStoragePersister({
    storage: {
      getItem: async (key: string) => {
        try {
          // Try localStorage first
          const item = localStorage.getItem(key);
          if (item) return item;

          // Fallback to IndexedDB for larger data
          const db = await openQueryDB();
          const transaction = db.transaction(['queryCache'], 'readonly');
          const store = transaction.objectStore('queryCache');
          const result = await new Promise<any>((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          return result?.value || null;
        } catch (error) {
          console.warn('Query cache read failed:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          // Store in localStorage for quick access
          localStorage.setItem(key, value);

          // Also store in IndexedDB for persistence
          const db = await openQueryDB();
          const transaction = db.transaction(['queryCache'], 'readwrite');
          const store = transaction.objectStore('queryCache');
          await store.put({ 
            key, 
            value, 
            timestamp: Date.now(),
            size: new Blob([value]).size 
          });
        } catch (error) {
          console.error('Query cache write failed:', error);
        }
      },
      removeItem: async (key: string) => {
        localStorage.removeItem(key);
        try {
          const db = await openQueryDB();
          const transaction = db.transaction(['queryCache'], 'readwrite');
          const store = transaction.objectStore('queryCache');
          await store.delete(key);
        } catch (error) {
          console.warn('Query cache delete failed:', error);
        }
      },
    },
    // 30-day retention for construction site offline capability
    throttleTime: 1000,
    // Compress large payloads
    serialize: (data) => {
      try {
        return JSON.stringify(data);
      } catch (error) {
        console.error('Serialization failed:', error);
        return '{}';
      }
    },
    deserialize: (data) => {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Deserialization failed:', error);
        return {};
      }
    },
  });
};

// IndexedDB helper for query persistence
async function openQueryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brave-forms-queries', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('queryCache')) {
        const store = db.createObjectStore('queryCache', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('size', 'size', { unique: false });
      }
    };
  });
}

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
        // Use network-first strategy when online, cache-first when offline
        networkMode: 'online' as const,
      },
      mutations: {
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
  weatherHistory: (location: string, days: number) => ['weather', 'history', location, days] as const,
  
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
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    appActions.setNetworkStatus(isOnline ? 'online' : 'offline');
    
    // Resume queries when coming back online
    if (isOnline && queryClient) {
      queryClient.resumePausedMutations();
      queryClient.refetchQueries();
    }
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // Initial status
  updateNetworkStatus();
}