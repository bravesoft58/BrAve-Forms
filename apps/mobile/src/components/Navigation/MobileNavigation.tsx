import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Group,
  Text,
  ActionIcon,
  Badge,
  Stack,
  UnstyledButton,
  Tooltip,
  Divider,
} from '@mantine/core';
import {
  IconHome,
  IconForms,
  IconCloudRain,
  IconCamera,
  IconSettings,
  IconClipboardCheck,
  IconAlertTriangle,
  IconMap,
  IconUsers,
} from '@tabler/icons-react';

// Hooks
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useMobileStore } from '../../hooks/useMobileStore';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  badge?: string | number;
  badgeColor?: string;
  requiresOnline?: boolean;
}

interface MobileNavigationProps {
  isDesktop?: boolean;
  onNavigate?: () => void;
}

export function MobileNavigation({ isDesktop = false, onNavigate }: MobileNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const { queueSize } = useOfflineQueue();
  const { complianceStatus, weatherAlert } = useMobileStore();

  // Navigation items with construction site focus
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <IconHome size={24} />,
      path: '/dashboard',
      description: 'Site overview and compliance status',
    },
    {
      id: 'forms',
      label: 'Forms',
      icon: <IconForms size={24} />,
      path: '/forms',
      description: 'Inspection forms and templates',
      badge: queueSize > 0 ? queueSize : undefined,
      badgeColor: 'orange',
    },
    {
      id: 'weather',
      label: 'Weather',
      icon: <IconCloudRain size={24} />,
      path: '/weather',
      description: 'EPA weather monitoring (0.25" threshold)',
      badge: weatherAlert?.isActive ? '!' : undefined,
      badgeColor: 'red',
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: <IconCamera size={24} />,
      path: '/photos',
      description: 'Site documentation with GPS',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <IconSettings size={24} />,
      path: '/settings',
      description: 'Device and sync configuration',
    },
  ];

  // Handle navigation with mobile optimizations
  const handleNavigate = (path: string, requiresOnline?: boolean) => {
    // Check if navigation requires online connection
    if (requiresOnline && !isOnline) {
      // Could show notification that feature requires internet
      return;
    }

    navigate(path);
    onNavigate?.();
    
    // Provide haptic feedback on mobile
    if ('vibrate' in navigator && !isDesktop) {
      navigator.vibrate(25);
    }
  };

  // Check if path is currently active
  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Desktop sidebar navigation
  if (isDesktop) {
    return (
      <Stack gap="xs" style={{ height: '100%' }}>
        {/* Navigation header */}
        <div style={{ padding: '16px 0', borderBottom: '2px solid #e5e7eb' }}>
          <Text size="sm" fw={700} c="dimmed" tt="uppercase">
            Construction Site
          </Text>
        </div>

        {/* Navigation items */}
        <Stack gap="xs" style={{ flex: 1 }}>
          {navigationItems.map((item) => (
            <UnstyledButton
              key={item.id}
              onClick={() => handleNavigate(item.path, item.requiresOnline)}
              style={(theme) => ({
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActivePath(item.path) ? '#ffffff' : '#374151',
                backgroundColor: isActivePath(item.path) ? '#0ea5e9' : 'transparent',
                border: isActivePath(item.path) ? '2px solid #0284c7' : '2px solid transparent',
                fontWeight: isActivePath(item.path) ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              })}
            >
              <Group gap="md" wrap="nowrap">
                <div style={{ 
                  color: isActivePath(item.path) ? '#ffffff' : '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {item.icon}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Text size="sm" fw={isActivePath(item.path) ? 600 : 500} truncate>
                        {item.label}
                      </Text>
                      <Text 
                        size="xs" 
                        c={isActivePath(item.path) ? 'rgba(255,255,255,0.8)' : 'dimmed'}
                        style={{ marginTop: '2px' }}
                      >
                        {item.description}
                      </Text>
                    </div>
                    
                    {item.badge && (
                      <Badge 
                        color={item.badgeColor || 'blue'} 
                        variant="filled" 
                        size="sm"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Group>
                </div>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>

        {/* Footer info */}
        <div style={{ padding: '16px 0', borderTop: '2px solid #e5e7eb' }}>
          <Group gap="xs">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22c55e' : '#ef4444',
              }}
            />
            <Text size="xs" c="dimmed">
              {isOnline ? 'Connected' : 'Offline Mode'}
            </Text>
          </Group>
          
          {queueSize > 0 && (
            <Text size="xs" c="orange" mt="xs">
              {queueSize} items pending sync
            </Text>
          )}
        </div>
      </Stack>
    );
  }

  // Mobile bottom navigation
  return (
    <Group 
      justify="space-around" 
      align="center" 
      style={{ 
        height: '100%',
        padding: '0 8px',
        background: '#ffffff',
      }}
      wrap="nowrap"
    >
      {navigationItems.map((item) => {
        const isActive = isActivePath(item.path);
        
        return (
          <Tooltip
            key={item.id}
            label={item.description}
            position="top"
            withArrow
            disabled={isActive} // Don't show tooltip for active item
          >
            <UnstyledButton
              onClick={() => handleNavigate(item.path, item.requiresOnline)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 4px',
                borderRadius: '8px',
                minWidth: '60px',
                backgroundColor: isActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                border: isActive ? '2px solid #0ea5e9' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Icon with badge */}
              <div style={{ 
                position: 'relative',
                color: isActive ? '#0ea5e9' : '#6b7280',
                marginBottom: '4px',
              }}>
                {item.icon}
                
                {item.badge && (
                  <Badge
                    color={item.badgeColor || 'blue'}
                    variant="filled"
                    size="xs"
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 4px',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              {/* Label */}
              <Text
                size="xs"
                fw={isActive ? 600 : 500}
                c={isActive ? 'blue' : 'dimmed'}
                ta="center"
                style={{
                  lineHeight: 1.2,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {item.label}
              </Text>

              {/* Network requirement indicator */}
              {item.requiresOnline && !isOnline && (
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                  }}
                />
              )}
            </UnstyledButton>
          </Tooltip>
        );
      })}
    </Group>
  );
}