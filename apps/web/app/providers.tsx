'use client';

import { useState, createContext, useContext } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

// Local imports
import { getQueryClient } from '@/lib/query/client';

// Type definition for mock auth context
interface MockAuthData {
  userId: string;
  orgId: string;
  orgRole: string;
  orgSlug: string;
  isLoaded: boolean;
  isSignedIn: boolean;
  sessionId: string;
  getToken?: () => Promise<string>;
}

// Mock Auth Context for development
const MockAuthContext = createContext<MockAuthData>({
  userId: 'dev-user-123',
  orgId: 'dev-org-123',
  orgRole: 'ADMIN',
  orgSlug: 'dev-org',
  isLoaded: true,
  isSignedIn: true,
  sessionId: 'dev-session-123',
});

// Mock useAuth hook that matches Clerk's API
export function useMockAuth() {
  return useContext(MockAuthContext);
}

/**
 * Simple auth hook for development and initial testing
 *
 * Returns mock authentication data
 * TODO: Replace with real Clerk authentication for production
 *
 * ALL components should import this instead of @clerk/nextjs useAuth
 */
export function useAppAuth() {
  return useMockAuth();
}

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Use singleton pattern to ensure query client persists across renders
  const [queryClient] = useState(() => getQueryClient());

  // Simple mock auth for development and initial customer testing
  // TODO: Implement real Clerk authentication before production launch
  return (
    <MockAuthContext.Provider
      value={{
        userId: 'dev-user-123',
        orgId: 'dev-org-123',
        orgRole: 'ADMIN',
        orgSlug: 'dev-org',
        isLoaded: true,
        isSignedIn: true,
        sessionId: 'dev-session-123',
        getToken: async () => 'dev-token-123',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthenticationProvider>{children}</AuthenticationProvider>
      </QueryClientProvider>
    </MockAuthContext.Provider>
  );
}

// Mock authentication provider for development
function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  // For now, just return children without any store logic to avoid issues
  return <>{children}</>;
}

// TODO: These functions will be implemented after store setup is complete
// Keeping commented out to avoid type errors during initial TanStack Query setup

// // Initialize compliance checking for EPA requirements
// function initializeComplianceChecking() {
//   // Will be implemented with proper store integration
// }

// // Initialize weather monitoring for 0.25" rainfall triggers
// function initializeWeatherMonitoring() {
//   // Will be implemented with TanStack Query hooks
// }

// // Start periodic sync based on user settings
// function startPeriodicSync() {
//   // Will be implemented with offline sync system
// }
