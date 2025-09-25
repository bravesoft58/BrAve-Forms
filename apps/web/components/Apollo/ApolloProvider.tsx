'use client';

import { useEffect, useState } from 'react';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import { useAuth } from '@clerk/nextjs';
import { createApolloClient, useApolloClient } from '@/lib/apollo/client';

interface ApolloProviderProps {
  children: React.ReactNode;
}

export function ApolloProvider({ children }: ApolloProviderProps) {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, getToken, orgId, orgRole } = useAuth();

  // Initialize Apollo Client
  useEffect(() => {
    let mounted = true;
    
    const initializeClient = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create authenticated Apollo Client
        const apolloClient = await createApolloClient();
        
        if (mounted) {
          setClient(apolloClient);
          console.log('Apollo Client initialized successfully', {
            hasOrgContext: !!orgId,
            orgId: orgId || 'none',
            role: orgRole || 'none',
          });
        }
      } catch (error) {
        console.error('Failed to initialize Apollo Client:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize GraphQL client');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Only initialize when auth is loaded
    if (isLoaded) {
      initializeClient();
    }

    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, orgId, orgRole]);

  // Update auth context when it changes
  useEffect(() => {
    if (client && isLoaded) {
      const updateAuthContext = async () => {
        try {
          const token = isSignedIn ? await getToken() : null;
          
          // Update global auth context for Apollo Client
          (globalThis as any).__APOLLO_AUTH_TOKEN__ = token;
          (globalThis as any).__APOLLO_ORG_ID__ = orgId;
          (globalThis as any).__APOLLO_ORG_ROLE__ = orgRole;
          
          console.log('Apollo auth context updated', {
            hasToken: !!token,
            hasOrg: !!orgId,
            role: orgRole,
          });
          
        } catch (error) {
          console.error('Failed to update Apollo auth context:', error);
        }
      };
      
      updateAuthContext();
    }
  }, [client, isLoaded, isSignedIn, getToken, orgId, orgRole]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing GraphQL client...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Failed to connect to the backend API. Please check if the server is running.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Render Apollo Provider with client
  return (
    <BaseApolloProvider client={client}>
      {children}
    </BaseApolloProvider>
  );
}

// Development helper component
export function ApolloDevtools() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm">
        Apollo Client Active
      </div>
    </div>
  );
}