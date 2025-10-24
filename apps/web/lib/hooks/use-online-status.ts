'use client';

import { useState, useEffect } from 'react';

/**
 * useOnlineStatus Hook
 *
 * Tracks browser online/offline status using Navigator API.
 * Returns true when online, false when offline.
 *
 * Listens to window 'online' and 'offline' events for real-time updates.
 */
export function useOnlineStatus(): boolean {
  // Initialize with current online status (default to true for SSR)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Skip if window is not available (SSR)
    if (typeof window === 'undefined') return;

    // Update state when online/offline status changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
