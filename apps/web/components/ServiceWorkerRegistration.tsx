'use client';

import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useAppActions } from '@/lib/store/app.store';

export function ServiceWorkerRegistration() {
  const { addNotification, setNetworkStatus } = useAppActions();

  useEffect(() => {
    // Register service worker for offline capability
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }

    // Set up network status monitoring
    setupNetworkMonitoring();

    // Set up background sync monitoring
    setupBackgroundSync();
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              addNotification({
                type: 'info',
                title: 'App Update Available',
                message: 'A new version is available. Please refresh the page.',
              });

              notifications.show({
                id: 'sw-update',
                title: 'App Update Available',
                message: 'A new version is available. Please refresh the page.',
                color: 'blue',
                icon: <IconWifi size={20} />,
                autoClose: false,
                withCloseButton: true,
              });
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'CACHE_UPDATED':
            addNotification({
              type: 'success',
              title: 'Content Cached',
              message: 'App is now available offline.',
            });
            break;

          case 'BACKGROUND_SYNC_SUCCESS':
            addNotification({
              type: 'success',
              title: 'Data Synced',
              message: `${payload.count} items synchronized successfully.`,
            });
            break;

          case 'BACKGROUND_SYNC_FAILURE':
            addNotification({
              type: 'error',
              title: 'Sync Failed',
              message: 'Some data could not be synchronized. Will retry when online.',
            });
            break;

          default:
            console.log('Unknown service worker message:', event.data);
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const setupNetworkMonitoring = () => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setNetworkStatus(isOnline ? 'online' : 'offline');

      if (isOnline) {
        notifications.show({
          id: 'network-online',
          title: 'Back Online',
          message: 'Internet connection restored. Syncing data...',
          color: 'green',
          icon: <IconWifi size={20} />,
          autoClose: 3000,
        });

        addNotification({
          type: 'success',
          title: 'Connection Restored',
          message: 'Back online. Syncing offline data...',
        });
      } else {
        notifications.show({
          id: 'network-offline',
          title: 'Working Offline',
          message: 'No internet connection. Data will be saved and synced when reconnected.',
          color: 'orange',
          icon: <IconWifiOff size={20} />,
          autoClose: false,
          withCloseButton: true,
        });

        addNotification({
          type: 'warning',
          title: 'Working Offline',
          message: 'Internet connection lost. Working in offline mode.',
        });
      }
    };

    // Set initial status
    updateNetworkStatus();

    // Listen for network changes
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  };

  const setupBackgroundSync = () => {
    // Check if Background Sync is supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register for background sync when we detect offline actions
      const registerBackgroundSync = async (tag: string) => {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await (registration as any).sync.register(tag);
            console.log(`Background sync registered for: ${tag}`);
          }
        } catch (error) {
          console.error('Background sync registration failed:', error);
        }
      };

      // Export the function for use by other components
      (window as any).registerBackgroundSync = registerBackgroundSync;
    } else {
      console.warn('Background Sync not supported. Using alternative sync strategy.');
    }
  };

  return null; // This component doesn't render anything
}