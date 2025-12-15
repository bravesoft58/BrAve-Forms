'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';

// Local imports
import { getQueryClient } from '@/lib/query/client';

// Type definition for app auth context
interface AppAuthData {
  userId: string | null;
  orgId: string;
  orgRole: string;
  orgSlug: string;
  isLoaded: boolean;
  isSignedIn: boolean;
  sessionId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  getToken?: () => Promise<string | null>;
}

/**
 * Hook to get authentication data from Clerk
 * Returns user info and organization context
 */
export function useAppAuth(): AppAuthData {
  const { userId, sessionId, isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Default org ID for now - will be replaced with Clerk Organizations later
  // This must match the clerk_org_id in the database, not the database id
  const orgId = 'org_qd_default';

  return {
    userId: userId || null,
    orgId,
    orgRole: 'ADMIN',
    orgSlug: 'default-org',
    isLoaded,
    isSignedIn: isSignedIn || false,
    sessionId: sessionId || null,
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    email: user?.primaryEmailAddress?.emailAddress || null,
    getToken,
  };
}

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Use singleton pattern to ensure query client persists across renders
  const [queryClient] = useState(() => getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
