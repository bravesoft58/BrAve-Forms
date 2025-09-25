'use client';

import { useEffect, ReactNode } from 'react';
import { useAppActions, useAppStore } from '@/lib/store/app.store';

interface NetworkStatusProviderProps {
  children: ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const { setNetworkStatus } = useAppActions();
  const appState = useAppStore();

  useEffect(() => {
    // Set initial network status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');

    // Network status change handlers
    const handleOnline = () => {
      setNetworkStatus('online');
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Advanced connection monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        // Consider slow connections as potentially problematic
        const slowConnections = ['slow-2g', '2g', '3g'];
        const isSlowConnection = slowConnections.includes(connection.effectiveType);
        
        if (isSlowConnection) {
          console.warn('Slow connection detected:', connection.effectiveType);
        }
      };

      connection.addEventListener('change', handleConnectionChange);

      // Cleanup
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    // Cleanup for browsers without connection API
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setNetworkStatus]);

  return <>{children}</>;
}