import { 
  ApolloClient, 
  InMemoryCache, 
  createHttpLink,
  from,
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
  NormalizedCacheObject
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
// Apollo Client v4 doesn't use apollo3-cache-persist - we'll implement custom persistence
import { useAuth } from '@clerk/nextjs';
import { appActions } from '../store/app.store';

// Cache configuration optimized for construction site usage
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Organization-scoped queries with client-side filtering
        projects: {
          keyArgs: ['organizationId'],
          merge(existing, incoming, { args }) {
            if (!existing) return incoming;
            
            // Merge with deduplication based on project ID
            const existingItems = existing.items || [];
            const incomingItems = incoming.items || [];
            
            const merged = [...existingItems];
            incomingItems.forEach((item: any) => {
              const existingIndex = merged.findIndex(p => p.id === item.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = item;
              } else {
                merged.push(item);
              }
            });
            
            return {
              ...incoming,
              items: merged,
            };
          },
        },
        
        // Weather data with location-based caching
        weather: {
          keyArgs: ['location'],
          merge: false, // Always replace weather data with fresh data
        },
        
        // Compliance data with time-sensitive caching
        compliance: {
          merge(existing, incoming) {
            return {
              ...existing,
              ...incoming,
              lastUpdated: new Date().toISOString(),
            };
          },
        },
      },
    },
    
    Project: {
      fields: {
        inspections: {
          merge(existing, incoming) {
            if (!existing) return incoming;
            
            // Merge inspections by ID, keeping most recent
            const existingItems = existing.items || [];
            const incomingItems = incoming.items || [];
            
            const merged = [...existingItems];
            incomingItems.forEach((item: any) => {
              const existingIndex = merged.findIndex(i => i.id === item.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = item;
              } else {
                merged.push(item);
              }
            });
            
            // Sort by date descending
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            return {
              ...incoming,
              items: merged,
            };
          },
        },
      },
    },
    
    // Ensure photos are cached effectively for offline viewing
    Photo: {
      keyFields: ['id'],
      fields: {
        url: {
          merge: false, // Always use the latest URL
        },
      },
    },
  },
  
  // Enable result caching for better performance
  possibleTypes: {},
  
  // DataID function for better normalization
  dataIdFromObject: (object: any) => {
    if (object.__typename && object.id) {
      return `${object.__typename}:${object.id}`;
    }
    return false;
  },
});

// HTTP Link with containerized backend endpoint
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3002/graphql',
  credentials: 'include', // Include cookies for session management
  
  // Add custom fetch implementation for better error handling
  fetch: (uri, options) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    return fetch(uri, {
      ...options,
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  },
});

// Authentication link with Clerk integration
const authLink = setContext(async (_, { headers }) => {
  try {
    // This will be set by the hook that creates the client
    const token = (globalThis as any).__APOLLO_AUTH_TOKEN__;
    const orgId = (globalThis as any).__APOLLO_ORG_ID__;
    const orgRole = (globalThis as any).__APOLLO_ORG_ROLE__;
    
    return {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        ...(token && { authorization: `Bearer ${token}` }),
        ...(orgId && { 'x-organization-id': orgId }),
        ...(orgRole && { 'x-organization-role': orgRole }),
        'x-client-version': '1.0.0',
        'x-platform': 'web',
      },
    };
  } catch (error) {
    console.error('Auth link error:', error);
    return { headers };
  }
});

// Retry link for unreliable construction site networks
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // Retry on network errors and 5xx server errors
      if (error?.networkError) {
        return true;
      }
      
      if (error?.graphQLErrors?.length > 0) {
        // Don't retry authentication errors or validation errors
        const hasAuthError = error.graphQLErrors.some((err: any) => 
          err.extensions?.code === 'UNAUTHENTICATED' ||
          err.extensions?.code === 'UNAUTHORIZED'
        );
        
        const hasValidationError = error.graphQLErrors.some((err: any) =>
          err.extensions?.code === 'BAD_REQUEST' ||
          err.extensions?.code === 'VALIDATION_ERROR'
        );
        
        return !hasAuthError && !hasValidationError;
      }
      
      return false;
    },
  },
});

// Error link for global error handling
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // GraphQL errors (business logic errors)
  if (graphQLErrors) {
    graphQLErrors.forEach((err) => {
      console.error(`GraphQL error: ${err.message}`, {
        operation: operation.operationName,
        variables: operation.variables,
        path: err.path,
        extensions: err.extensions,
      });
      
      // Handle authentication errors
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Redirect to sign in or refresh token
        appActions.setAuthError('Session expired. Please sign in again.');
      }
      
      // Handle organization context errors
      if (err.extensions?.code === 'NO_ORGANIZATION') {
        appActions.addNotification({
          type: 'error',
          title: 'Organization Required',
          message: 'Please select a construction company to continue.',
        });
      }
      
      // Handle compliance violations
      if (err.extensions?.code === 'COMPLIANCE_VIOLATION') {
        appActions.addNotification({
          type: 'warning',
          title: 'Compliance Issue',
          message: err.message,
        });
      }
    });
  }
  
  // Network errors (connectivity issues)
  if (networkError) {
    console.error(`Network error: ${networkError.message}`, {
      operation: operation.operationName,
      variables: operation.variables,
    });
    
    // Update network status for offline handling
    appActions.setNetworkStatus('offline');
    
    // Add failed operation to offline queue
    appActions.addToOfflineQueue({
      type: 'graphql_operation',
      payload: {
        operation: operation.operationName,
        variables: operation.variables,
        query: operation.query,
      },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      priority: 'medium',
    });
    
    // Show user-friendly offline message
    appActions.addNotification({
      type: 'info',
      title: 'Working Offline',
      message: 'Data will sync when connection is restored.',
    });
  }
});

// Offline queue link for handling failed requests
const offlineQueueLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let subscription: any;
    
    const handle = (operation: Operation, forward: any) => {
      subscription = forward(operation).subscribe({
        next: (result: FetchResult) => {
          // Update network status on successful request
          appActions.setNetworkStatus('online');
          observer.next(result);
        },
        error: (error: any) => {
          // If it's a network error and we're offline, queue for retry
          if (error.networkError && !navigator.onLine) {
            appActions.addToOfflineQueue({
              type: 'graphql_operation',
              payload: {
                operationName: operation.operationName,
                variables: operation.variables,
                query: operation.query.loc?.source?.body || operation.query,
              },
              timestamp: new Date(),
              retryCount: 0,
              maxRetries: 3,
              priority: operation.operationName?.includes('weather') ? 'high' : 'medium',
            });
            
            // Return cached data if available
            const cached = cache.readQuery({
              query: operation.query,
              variables: operation.variables,
            });
            
            if (cached) {
              observer.next({ data: cached });
              observer.complete();
              return;
            }
          }
          
          observer.error(error);
        },
        complete: () => observer.complete(),
      });
    };
    
    handle(operation, forward!);
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  });
});

// Custom cache persistence for Apollo Client v4
const setupCachePersistence = async (cache: InMemoryCache) => {
  if (typeof window !== 'undefined') {
    try {
      const CACHE_KEY = 'brave-forms-apollo-cache-v4';
      const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      // Try to restore cache from localStorage
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        const age = Date.now() - timestamp;
        
        if (age < MAX_AGE) {
          cache.restore(data);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
      
      // Set up auto-save
      const saveCache = () => {
        try {
          const data = cache.extract();
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.warn('Cache save failed:', error);
        }
      };
      
      // Save cache periodically and on page unload
      setInterval(saveCache, 30000); // Every 30 seconds
      window.addEventListener('beforeunload', saveCache);
      
    } catch (error) {
      console.error('Cache persistence setup failed:', error);
    }
  }
};

// Create Apollo Client with all links
export const createApolloClient = async () => {
  // Set up custom cache persistence for offline capability
  await setupCachePersistence(cache);
  
  const client = new ApolloClient({
    link: from([
      errorLink,
      authLink,
      retryLink,
      offlineQueueLink,
      httpLink,
    ]),
    cache,
    defaultOptions: {
      watchQuery: {
        // Use cache-first for offline-first behavior
        fetchPolicy: 'cache-first',
        errorPolicy: 'all', // Return both data and errors
        notifyOnNetworkStatusChange: true,
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
        // Don't update cache on mutation errors
        update: (cache, { data, errors }) => {
          if (errors && errors.length > 0) {
            console.warn('Mutation completed with errors:', errors);
          }
        },
      },
    },
    // Set reasonable query deduplication interval
    queryDeduplication: true,
    
    // Enable automatic cache updates
    assumeImmutableResults: true,
  });
  
  // Set up network status monitoring
  if (typeof window !== 'undefined') {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      appActions.setNetworkStatus(isOnline ? 'online' : 'offline');
      
      if (isOnline) {
        // Refetch active queries when coming back online
        client.refetchQueries();
        
        // Process offline queue
        appActions.processOfflineQueue();
      }
    };
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus(); // Initial status
  }
  
  return client;
};

// Hook for creating authenticated Apollo Client
export const useApolloClient = () => {
  const { getToken, orgId, orgRole } = useAuth();
  
  const createAuthenticatedClient = async () => {
    try {
      const token = await getToken();
      
      // Set global auth context for the auth link
      (globalThis as any).__APOLLO_AUTH_TOKEN__ = token;
      (globalThis as any).__APOLLO_ORG_ID__ = orgId;
      (globalThis as any).__APOLLO_ORG_ROLE__ = orgRole;
      
      return await createApolloClient();
    } catch (error) {
      console.error('Failed to create authenticated Apollo client:', error);
      
      // Create client without auth for public queries
      return await createApolloClient();
    }
  };
  
  return {
    createAuthenticatedClient,
    hasOrgContext: !!orgId,
    orgId,
    orgRole,
  };
};

// Utility function to clear cache (useful for sign out)
export const clearApolloCache = async (client: ApolloClient<any>) => {
  try {
    await client.clearStore();
    
    // Clear persisted cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brave-forms-apollo-cache');
    }
  } catch (error) {
    console.error('Failed to clear Apollo cache:', error);
  }
};

// Pre-configured fragments for common queries
export const COMMON_FRAGMENTS = {
  UserBasic: `
    fragment UserBasic on User {
      id
      email
      firstName
      lastName
      role
      organizationId
      permissions
      createdAt
      updatedAt
    }
  `,
  
  ProjectBasic: `
    fragment ProjectBasic on Project {
      id
      name
      address
      permitNumber
      coordinates {
        lat
        lng
      }
      isActive
      complianceStatus
      createdAt
      updatedAt
    }
  `,
  
  InspectionBasic: `
    fragment InspectionBasic on Inspection {
      id
      projectId
      date
      time
      type
      status
      rainfall
      weather
      inspector {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
    }
  `,
  
  ComplianceStatus: `
    fragment ComplianceStatus on ComplianceStatus {
      projectId
      status
      lastInspection
      nextRequiredInspection
      overdueInspections
      recentRainfall {
        date
        amount
        triggerCompliance
      }
      violations {
        id
        type
        severity
        description
        status
      }
    }
  `,
};