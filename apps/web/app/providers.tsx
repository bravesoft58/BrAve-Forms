'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';

// Local imports
import { getQueryClient } from '@/lib/query/client';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Use singleton pattern to ensure query client persists across renders
  const [queryClient] = useState(() => getQueryClient());

  const skipAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

  // If auth is skipped, don't wrap in ClerkProvider
  if (skipAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthenticationProvider>
          {children}
        </AuthenticationProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <AuthenticationProvider>
          {children}
        </AuthenticationProvider>
      </QueryClientProvider>
    </ClerkProvider>
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