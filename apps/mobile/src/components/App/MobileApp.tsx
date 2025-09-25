import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell, Burger, Group, Text, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconWifi,
  IconWifiOff,
  IconBatteryCharging,
  IconBattery,
  IconRefresh,
} from '@tabler/icons-react';
import { Device } from '@capacitor/device';

// Mobile screens
import { MobileDashboard } from '../Dashboard/MobileDashboard';
import { MobileFormBuilder } from '../Forms/MobileFormBuilder';
import { MobileWeatherMonitor } from '../Weather/MobileWeatherMonitor';
import { MobilePhotoCapture } from '../Photo/MobilePhotoCapture';
import { MobileSettings } from '../Settings/MobileSettings';
import { MobileNavigation } from '../Navigation/MobileNavigation';
import { OfflineIndicator } from '../Offline/OfflineIndicator';
import { SyncStatusIndicator } from '../Sync/SyncStatusIndicator';

// Hooks and utilities
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

interface MobileAppProps {
  className?: string;
}

export function MobileApp({ className }: MobileAppProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { height, width } = useViewportSize();
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  
  // Network and device status hooks
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();
  const { batteryLevel, isCharging, isLowBattery } = useBatteryStatus();
  const { queueSize, isProcessing, retryFailedItems } = useOfflineQueue();

  // Get device information for construction site optimization
  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const info = await Device.getInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error('Failed to get device info:', error);
      }
    };

    getDeviceInfo();
  }, []);

  // Handle network status changes with construction site feedback
  useEffect(() => {
    if (!isOnline) {
      notifications.show({
        id: 'network-offline',
        title: 'Working Offline',
        message: 'Data will sync when connection is restored',
        color: 'orange',
        icon: <IconWifiOff size={20} />,
        autoClose: false,
      });
    } else {
      notifications.hide('network-offline');
      
      if (queueSize > 0) {
        notifications.show({
          id: 'syncing-data',
          title: 'Syncing Data',
          message: `Uploading ${queueSize} pending items...`,
          color: 'blue',
          icon: <IconRefresh size={20} />,
          loading: true,
          autoClose: false,
        });
      }
    }
  }, [isOnline, queueSize]);

  // Handle low battery warnings for construction sites
  useEffect(() => {
    if (isLowBattery && !isCharging) {
      notifications.show({
        id: 'low-battery',
        title: 'Low Battery Warning',
        message: 'Please charge device to avoid losing inspection data',
        color: 'red',
        icon: <IconBattery size={20} />,
        autoClose: false,
      });
    } else {
      notifications.hide('low-battery');
    }
  }, [isLowBattery, isCharging]);

  // Mobile-optimized header for construction sites
  const renderHeader = () => (
    <Group justify="space-between" style={{ width: '100%' }} wrap="nowrap">
      <Group gap="sm">
        <Burger opened={opened} onClick={toggle} size="sm" />
        <div>
          <Text 
            size="lg" 
            fw={700} 
            style={{ 
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}
          >
            BrAve Forms
          </Text>
          {deviceInfo && (
            <Text 
              size="xs" 
              style={{ 
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {deviceInfo.model} • {deviceInfo.platform}
            </Text>
          )}
        </div>
      </Group>

      <Group gap="xs">
        {/* Network Status */}
        <Tooltip label={`${connectionType} ${isOnline ? 'Connected' : 'Offline'}`}>
          <ActionIcon
            variant="subtle"
            color={isOnline ? 'white' : 'red'}
            size="md"
          >
            {isOnline ? (
              <IconWifi 
                size={18} 
                color={isSlowConnection ? 'orange' : 'white'} 
              />
            ) : (
              <IconWifiOff size={18} />
            )}
          </ActionIcon>
        </Tooltip>

        {/* Battery Status */}
        <Tooltip label={`Battery: ${Math.round((batteryLevel || 0) * 100)}%`}>
          <ActionIcon
            variant="subtle"
            color={isLowBattery ? 'red' : 'white'}
            size="md"
          >
            {isCharging ? (
              <IconBatteryCharging 
                size={18} 
                color={isLowBattery ? 'orange' : 'white'} 
              />
            ) : (
              <IconBattery 
                size={18} 
                color={isLowBattery ? 'red' : 'white'} 
              />
            )}
          </ActionIcon>
        </Tooltip>

        {/* Offline Queue Status */}
        {queueSize > 0 && (
          <Tooltip label={`${queueSize} items pending sync`}>
            <Badge
              color={isProcessing ? 'blue' : 'orange'}
              variant="filled"
              size="sm"
              style={{ 
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              onClick={retryFailedItems}
            >
              {queueSize}
            </Badge>
          </Tooltip>
        )}
      </Group>
    </Group>
  );

  // Determine if we should use mobile navigation
  const isMobile = width < 768;
  const isTabletPortrait = width >= 768 && width < 1024 && height > width;
  const useMobileLayout = isMobile || isTabletPortrait;

  return (
    <Router>
      <div className={`mobile-app ${className || ''}`}>
        {/* Offline Indicator */}
        <OfflineIndicator />
        
        {/* Sync Status */}
        <SyncStatusIndicator />

        <AppShell
          header={{ 
            height: useMobileLayout ? 70 : 80,
            collapsed: false,
          }}
          navbar={{
            width: useMobileLayout ? 0 : 280,
            breakpoint: 'md',
            collapsed: { mobile: true, desktop: !opened },
          }}
          footer={{
            height: useMobileLayout ? 80 : 0,
            collapsed: !useMobileLayout,
          }}
          padding="md"
          style={{
            '--app-shell-header-bg': 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            '--app-shell-navbar-bg': '#ffffff',
            '--app-shell-footer-bg': '#ffffff',
            '--mantine-color-body': '#f8fafc',
          }}
        >
          {/* Mobile-optimized header */}
          <AppShell.Header 
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              borderBottom: '3px solid rgba(0,0,0,0.1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ 
              padding: '0 16px', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}>
              {renderHeader()}
            </div>
          </AppShell.Header>

          {/* Desktop sidebar navigation */}
          {!useMobileLayout && (
            <AppShell.Navbar 
              p="md"
              style={{
                borderRight: '2px solid #e5e7eb',
              }}
            >
              <MobileNavigation 
                isDesktop={true}
                onNavigate={close}
              />
            </AppShell.Navbar>
          )}

          {/* Mobile bottom navigation */}
          {useMobileLayout && (
            <AppShell.Footer
              style={{
                borderTop: '3px solid #e5e7eb',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.1)',
              }}
            >
              <MobileNavigation 
                isDesktop={false}
                onNavigate={close}
              />
            </AppShell.Footer>
          )}

          {/* Main content area */}
          <AppShell.Main
            style={{
              paddingBottom: useMobileLayout ? '100px' : '20px',
              paddingTop: useMobileLayout ? '90px' : '100px',
              minHeight: '100vh',
              background: '#f8fafc',
            }}
          >
            <Routes>
              {/* Dashboard - Construction site overview */}
              <Route 
                path="/dashboard" 
                element={<MobileDashboard />} 
              />
              
              {/* Form Builder - Touch-optimized */}
              <Route 
                path="/forms/*" 
                element={<MobileFormBuilder />} 
              />
              
              {/* Weather Monitoring - EPA Compliance */}
              <Route 
                path="/weather" 
                element={<MobileWeatherMonitor />} 
              />
              
              {/* Photo Capture - GPS integrated */}
              <Route 
                path="/photos" 
                element={<MobilePhotoCapture />} 
              />
              
              {/* Settings - Device and sync configuration */}
              <Route 
                path="/settings" 
                element={<MobileSettings />} 
              />
              
              {/* Default redirect to dashboard */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              
              {/* Catch all - redirect to dashboard */}
              <Route 
                path="*" 
                element={<Navigate to="/dashboard" replace />} 
              />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </div>
    </Router>
  );
}

// Export default for easier imports
export default MobileApp;