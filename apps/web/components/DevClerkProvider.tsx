'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface DevClerkProviderProps {
  children: ReactNode;
  publishableKey?: string;
  appearance?: any;
}

// Mock authentication for development
const DevMockProvider = ({ children }: { children: ReactNode }) => {
  // In development mode without valid keys, just render children
  return <>{children}</>;
};

export function DevClerkProvider({ 
  children, 
  publishableKey, 
  appearance 
}: DevClerkProviderProps) {
  // Check if we should skip Clerk auth in development
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true' || 
                   process.env.SKIP_CLERK_AUTH === 'true';
  
  // If we're skipping auth, use mock provider
  if (skipAuth) {
    console.warn(
      '[DEV MODE] Clerk authentication bypassed. ' +
      'Set SKIP_CLERK_AUTH=false and real Clerk keys for full functionality.'
    );
    return <DevMockProvider>{children}</DevMockProvider>;
  }
  
  // If keys are invalid, use mock provider
  if (!publishableKey || publishableKey.includes('YOUR_PUBLISHABLE_KEY')) {
    console.warn(
      '[DEV MODE] Clerk authentication bypassed due to invalid keys. ' +
      'Set real Clerk keys in .env.local for full functionality.'
    );
    return <DevMockProvider>{children}</DevMockProvider>;
  }
  
  // Use real Clerk provider with valid keys
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}