import { useState, useEffect } from 'react';
import { Network, ConnectionStatus, ConnectionType } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface NetworkStatusHook {
  isOnline: boolean;
  connectionType: ConnectionType | 'unknown';
  isSlowConnection: boolean;
  connectionStrength: number;
  isConnecting: boolean;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
}

/**
 * Mobile-optimized network status hook for construction sites
 * Handles poor connectivity scenarios common on job sites
 */
export function useNetworkStatus(): NetworkStatusHook {
  const [status, setStatus] = useState<NetworkStatusHook>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    isSlowConnection: false,
    connectionStrength: 1,
    isConnecting: false,
    lastConnectedAt: navigator.onLine ? new Date() : null,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    let strengthCheckTimer: NodeJS.Timeout | null = null;

    // Initialize network status
    const initializeNetworkStatus = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Use Capacitor Network API for native platforms
          const networkStatus = await Network.getStatus();
          updateNetworkStatus(networkStatus);
        } else {
          // Use web APIs for PWA
          updateWebNetworkStatus();
        }
      } catch (error) {
        console.error('Failed to get initial network status:', error);
      }
    };

    // Update network status from Capacitor
    const updateNetworkStatus = (networkStatus: ConnectionStatus) => {
      const wasOnline = status.isOnline;
      const isNowOnline = networkStatus.connected;

      setStatus(prev => ({
        ...prev,
        isOnline: isNowOnline,
        connectionType: networkStatus.connectionType,
        isSlowConnection: isSlowConnectionType(networkStatus.connectionType),
        isConnecting: false,
        lastConnectedAt: isNowOnline && !wasOnline ? new Date() : prev.lastConnectedAt,
        reconnectAttempts: isNowOnline ? 0 : prev.reconnectAttempts,
      }));

      // Start connection strength monitoring on mobile
      if (isNowOnline && Capacitor.isNativePlatform()) {
        startConnectionStrengthMonitoring();
      }
    };

    // Update network status for web/PWA
    const updateWebNetworkStatus = () => {
      const isOnline = navigator.onLine;
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      const connectionType = connection?.effectiveType || 'unknown';
      const isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType);

      setStatus(prev => ({
        ...prev,
        isOnline,
        connectionType: connectionType as ConnectionType,
        isSlowConnection,
        connectionStrength: connection?.downlink || 1,
        isConnecting: false,
        lastConnectedAt: isOnline && !prev.isOnline ? new Date() : prev.lastConnectedAt,
        reconnectAttempts: isOnline ? 0 : prev.reconnectAttempts,
      }));
    };

    // Monitor connection strength (for construction sites with weak signals)
    const startConnectionStrengthMonitoring = () => {
      if (strengthCheckTimer) clearInterval(strengthCheckTimer);
      
      strengthCheckTimer = setInterval(async () => {
        try {
          const startTime = performance.now();
          
          // Simple ping test to check connection quality
          await fetch('/api/ping', { 
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
          });
          
          const responseTime = performance.now() - startTime;
          const strength = calculateConnectionStrength(responseTime);
          
          setStatus(prev => ({
            ...prev,
            connectionStrength: strength,
            isSlowConnection: strength < 0.5,
          }));
        } catch (error) {
          // Connection test failed - likely poor connection
          setStatus(prev => ({
            ...prev,
            connectionStrength: 0.1,
            isSlowConnection: true,
          }));
        }
      }, 30000); // Check every 30 seconds
    };

    // Calculate connection strength based on response time
    const calculateConnectionStrength = (responseTime: number): number => {
      if (responseTime < 100) return 1.0;    // Excellent
      if (responseTime < 300) return 0.8;    // Good
      if (responseTime < 600) return 0.6;    // Fair
      if (responseTime < 1000) return 0.4;   // Poor
      if (responseTime < 2000) return 0.2;   // Very poor
      return 0.1;                            // Unusable
    };

    // Check if connection type is slow
    const isSlowConnectionType = (type: ConnectionType): boolean => {
      const slowTypes: ConnectionType[] = ['2g', '3g'];
      return slowTypes.includes(type);
    };

    // Handle reconnection attempts for construction site environments
    const attemptReconnection = () => {
      setStatus(prev => ({
        ...prev,
        isConnecting: true,
        reconnectAttempts: prev.reconnectAttempts + 1,
      }));

      // Clear any existing timer
      if (reconnectTimer) clearTimeout(reconnectTimer);

      // Exponential backoff for reconnection attempts
      const backoffDelay = Math.min(1000 * Math.pow(2, status.reconnectAttempts), 30000);
      
      reconnectTimer = setTimeout(async () => {
        try {
          if (Capacitor.isNativePlatform()) {
            const networkStatus = await Network.getStatus();
            updateNetworkStatus(networkStatus);
          } else {
            updateWebNetworkStatus();
          }
        } catch (error) {
          console.error('Reconnection attempt failed:', error);
          setStatus(prev => ({ ...prev, isConnecting: false }));
        }
      }, backoffDelay);
    };

    // Set up event listeners
    const setupNetworkListeners = () => {
      if (Capacitor.isNativePlatform()) {
        // Capacitor network listeners
        const networkListener = Network.addListener('networkStatusChange', (status) => {
          console.log('Network status changed:', status);
          updateNetworkStatus(status);
          
          // If disconnected, start reconnection attempts
          if (!status.connected && status.connected !== undefined) {
            attemptReconnection();
          }
        });

        return () => {
          networkListener.remove();
        };
      } else {
        // Web event listeners
        const handleOnline = () => {
          console.log('Network: online');
          updateWebNetworkStatus();
        };

        const handleOffline = () => {
          console.log('Network: offline');
          updateWebNetworkStatus();
          attemptReconnection();
        };

        // Connection type change listener
        const handleConnectionChange = () => {
          console.log('Network: connection changed');
          updateWebNetworkStatus();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const connection = (navigator as any).connection;
        if (connection) {
          connection.addEventListener('change', handleConnectionChange);
        }

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          if (connection) {
            connection.removeEventListener('change', handleConnectionChange);
          }
        };
      }
    };

    // Initialize and set up listeners
    initializeNetworkStatus();
    const cleanup = setupNetworkListeners();

    // Cleanup function
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (strengthCheckTimer) clearInterval(strengthCheckTimer);
      if (cleanup) cleanup();
    };
  }, []); // Empty dependency array - we want this to run once

  return status;
}