import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Import styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import './styles/mobile.css';
import './styles/construction.css';

// Import app components
import { MobileApp } from './components/App/MobileApp';
import { constructionTheme } from './theme/mobile.theme';
import { CapacitorProvider } from './providers/CapacitorProvider';
import { OfflineProvider } from './providers/OfflineProvider';
import { MobileStoreProvider } from './providers/MobileStoreProvider';

// Configure TanStack Query with offline persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days for offline capability
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on network errors in offline mode
        if (error?.code === 'NETWORK_ERROR' && !navigator.onLine) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Queue mutations when offline instead of retrying
        if (!navigator.onLine) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Set up offline persistence using AsyncStorage for mobile
const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    },
    setItem: async (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: async (key) => {
      localStorage.removeItem(key);
    },
  },
  key: 'brave-forms-queries',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

// Persist queries for offline capability
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  hydrateOptions: {
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60, // 1 hour
      },
    },
  },
});

// Initialize mobile app
async function initializeApp() {
  try {
    // Configure status bar for construction site visibility
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#0ea5e9' });
      await StatusBar.show();

      // Handle keyboard behavior for construction forms
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.paddingBottom = `${info.keyboardHeight}px`;
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.paddingBottom = '0px';
      });

      // Handle app state changes for battery optimization
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // Refresh critical data when app becomes active
          queryClient.invalidateQueries({ queryKey: ['weather'] });
          queryClient.invalidateQueries({ queryKey: ['compliance'] });
        }
      });

      // Hide splash screen after initialization
      await SplashScreen.hide();
    }

    // Initialize service worker for PWA capabilities
    if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        registration.addEventListener('updatefound', () => {
          console.log('New service worker version available');
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }

  } catch (error) {
    console.error('App initialization failed:', error);
  }
}

// Render app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={constructionTheme} defaultColorScheme="light">
        <ModalsProvider
          modalProps={{
            centered: true,
            overlayProps: { backgroundOpacity: 0.65, blur: 4 },
            radius: 'lg',
            shadow: 'xl',
            // Ensure modals are touch-friendly
            size: 'md',
            padding: 'xl',
          }}
        >
          <CapacitorProvider>
            <MobileStoreProvider>
              <OfflineProvider>
                <MobileApp />
                
                {/* Global notifications optimized for construction sites */}
                <Notifications
                  position="top-center" // Better visibility on tablets
                  zIndex={2000}
                  limit={3}
                  containerWidth={400}
                  transitionDuration={300}
                  // Longer auto close for construction site use
                  autoClose={8000}
                />
              </OfflineProvider>
            </MobileStoreProvider>
          </CapacitorProvider>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Initialize the mobile app
initializeApp().catch(console.error);

// Add global error handling for better debugging
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Don't prevent default for network errors in offline mode
  if (event.reason?.message?.includes('NetworkError') && !navigator.onLine) {
    event.preventDefault();
  }
});

// Handle orientation changes for construction tablets
window.addEventListener('orientationchange', () => {
  // Small delay to ensure proper layout recalculation
  setTimeout(() => {
    window.scrollTo(0, 0);
    // Trigger resize event for components that need to recalculate
    window.dispatchEvent(new Event('resize'));
  }, 100);
});

// Prevent zooming on double tap (while maintaining accessibility)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Disable context menu on long press for better mobile experience
document.addEventListener('contextmenu', (event) => {
  if (Capacitor.isNativePlatform()) {
    event.preventDefault();
  }
}, false);