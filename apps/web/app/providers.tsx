'use client';

import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

// Local imports
import { getQueryClient } from '@/lib/query/client';
import { useAppActions, useAppStore } from '@/lib/store/app.store';
import { NetworkStatusProvider } from '@/components/NetworkStatus/NetworkStatusProvider';
import { SyncProvider } from '@/components/Sync/SyncProvider';
import { ApolloProvider, ApolloDevtools } from '@/components/Apollo/ApolloProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => getQueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticationProvider>
        {children}
      </AuthenticationProvider>
    </QueryClientProvider>
  );
}

// Mock authentication provider for development
function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  // For now, just return children without any store logic to avoid issues
  return <>{children}</>;
}

// Initialize compliance checking for EPA requirements
function initializeComplianceChecking() {
  const { addNotification, checkComplianceDeadlines } = useAppActions();
  
  // Check compliance status on app start
  checkComplianceDeadlines();
  
  // Set up daily compliance checks (8 AM local time)
  const now = new Date();
  const tomorrow8AM = new Date(now);
  tomorrow8AM.setDate(tomorrow8AM.getDate() + 1);
  tomorrow8AM.setHours(8, 0, 0, 0);
  
  const msUntil8AM = tomorrow8AM.getTime() - now.getTime();
  
  setTimeout(() => {
    // Daily compliance check
    setInterval(() => {
      checkComplianceDeadlines();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
    
    // Initial check
    checkComplianceDeadlines();
  }, msUntil8AM);
}

// Initialize weather monitoring for 0.25" rainfall triggers
function initializeWeatherMonitoring() {
  const { updateWeatherData, addNotification } = useAppActions();
  const appState = useAppStore();
  
  // Check weather every hour during working hours (6 AM - 6 PM)
  const checkWeather = async () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) return; // Outside working hours
    
    try {
      // This would call your weather API
      // For now, we'll simulate weather data
      const mockWeatherData = {
        lastRainfall: Math.random() > 0.7 ? Math.random() * 2 : 0, // Simulate rainfall
        lastRainfallTime: new Date(),
        currentConditions: 'Partly Cloudy',
        forecast: [
          {
            date: new Date(),
            rainfall: Math.random() * 1,
            conditions: 'Partly Cloudy',
          },
        ],
      };
      
      updateWeatherData(mockWeatherData);
      
      // Check for 0.25" trigger (EPA CGP requirement)
      if (mockWeatherData.lastRainfall >= 0.25) {
        addNotification({
          type: 'warning',
          title: 'Rainfall Trigger Alert',
          message: `Rainfall of ${mockWeatherData.lastRainfall.toFixed(2)}" detected. Inspections required within 24 hours during working hours.`,
        });
      }
    } catch (error) {
      console.error('Weather check failed:', error);
    }
  };
  
  // Initial weather check
  checkWeather();
  
  // Hourly weather checks during working hours
  const interval = setInterval(checkWeather, 60 * 60 * 1000); // Every hour
  
  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
    });
  }
}

// Start periodic sync based on user settings
function startPeriodicSync() {
  const { triggerSync } = useAppActions();
  const appState = useAppStore();
  
  const syncInterval = appState.settings.syncInterval * 60 * 1000; // Convert minutes to ms
  
  const interval = setInterval(() => {
    // Only sync if online and there's data to sync
    if (appState.networkStatus === 'online' && appState.offlineQueue.length > 0) {
      triggerSync();
    }
  }, syncInterval);
  
  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
    });
  }
}