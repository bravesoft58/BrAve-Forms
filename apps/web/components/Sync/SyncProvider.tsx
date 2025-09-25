'use client';

import { useEffect, ReactNode } from 'react';
import { useAppActions, useAppStore } from '@/lib/store/app.store';

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { triggerSync } = useAppActions();
  const appState = useAppStore();

  useEffect(() => {
    // Auto-sync when coming back online with pending items
    if (
      appState.networkStatus === 'online' && 
      appState.offlineQueue.length > 0 &&
      appState.syncStatus === 'idle'
    ) {
      triggerSync();
    }
  }, [appState.networkStatus, appState.offlineQueue.length, appState.syncStatus, triggerSync]);

  useEffect(() => {
    // Set up periodic sync if auto-sync is enabled
    if (appState.settings.autoSync && appState.networkStatus === 'online') {
      const syncInterval = appState.settings.syncInterval * 60 * 1000; // Convert to ms
      
      const interval = setInterval(() => {
        if (appState.offlineQueue.length > 0 && appState.syncStatus === 'idle') {
          triggerSync();
        }
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [
    appState.settings.autoSync,
    appState.settings.syncInterval,
    appState.networkStatus,
    appState.offlineQueue.length,
    appState.syncStatus,
    triggerSync,
  ]);

  return <>{children}</>;
}