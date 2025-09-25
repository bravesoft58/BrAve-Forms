import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Grid,
  Badge,
  Progress,
  Alert,
  ActionIcon,
  Tooltip,
  Center,
  Divider,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconHome,
  IconCloudRain,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconMapPin,
  IconCamera,
  IconForms,
  IconRefresh,
  IconWifi,
  IconWifiOff,
  IconBattery,
  IconDroplet,
  IconCalendar,
  IconExclamationMark,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useViewportSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// Hooks and utilities
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useMobileStore } from '../../hooks/useMobileStore';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';

interface DashboardStats {
  pendingInspections: number;
  criticalInspections: number;
  photosToday: number;
  complianceRate: number;
  lastRainfall: number;
  nextDeadline: Date | null;
}

export function MobileDashboard() {
  const navigate = useNavigate();
  const { width } = useViewportSize();
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();
  const { queueSize, retryFailedItems } = useOfflineQueue();
  const { currentProject, weatherAlert, complianceStatus } = useMobileStore();
  const { batteryLevel, isCharging, isLowBattery } = useBatteryStatus();

  // Local state for dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    pendingInspections: 3,
    criticalInspections: 1,
    photosToday: 12,
    complianceRate: 94.2,
    lastRainfall: 0.31,
    nextDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
  });

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const isMobile = width < 768;

  // Refresh dashboard data
  const refreshDashboard = async () => {
    setRefreshing(true);
    
    try {
      // Simulate API call - in real app this would fetch from backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update last refresh time
      setLastRefresh(new Date());
      
      notifications.show({
        title: 'Dashboard Updated',
        message: 'Latest site data synchronized',
        color: 'green',
        icon: <IconCheck size={20} />,
        autoClose: 2000,
      });
      
    } catch (error) {
      notifications.show({
        title: 'Refresh Failed',
        message: 'Unable to sync dashboard data',
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh when coming back online
  useEffect(() => {
    if (isOnline && !refreshing) {
      const timeSinceRefresh = Date.now() - lastRefresh.getTime();
      // Auto-refresh if more than 5 minutes since last refresh
      if (timeSinceRefresh > 5 * 60 * 1000) {
        refreshDashboard();
      }
    }
  }, [isOnline]);

  // Get priority color based on deadline urgency
  const getDeadlinePriority = (deadline: Date | null) => {
    if (!deadline) return 'gray';
    
    const hoursUntil = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil <= 2) return 'red';
    if (hoursUntil <= 8) return 'orange';
    return 'green';
  };

  // Format time until deadline
  const formatTimeUntilDeadline = (deadline: Date | null) => {
    if (!deadline) return 'No deadlines';
    
    const msUntil = deadline.getTime() - Date.now();
    const hoursUntil = Math.floor(msUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursUntil < 0) return 'Overdue';
    if (hoursUntil === 0) return `${minutesUntil}m remaining`;
    return `${hoursUntil}h ${minutesUntil}m remaining`;
  };

  return (
    <Container size="lg" p={isMobile ? 'xs' : 'md'}>
      {/* Header */}
      <Card shadow="sm" p="md" mb="md" className="construction-header">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Group gap="sm" mb="xs">
              <ThemeIcon size="lg" variant="light" color="white">
                <IconHome size={24} />
              </ThemeIcon>
              <div>
                <Title order={1} size="h2" c="white">
                  {currentProject?.name || 'Construction Site'}
                </Title>
                <Text size="sm" c="rgba(255,255,255,0.9)">
                  {currentProject?.address || 'Mobile Dashboard'}
                </Text>
              </div>
            </Group>

            {/* Site Status */}
            <Group gap="md" wrap="wrap">
              <Badge
                color={complianceStatus === 'compliant' ? 'green' : complianceStatus === 'warning' ? 'orange' : 'red'}
                variant="filled"
                size="sm"
              >
                {complianceStatus === 'compliant' ? 'EPA Compliant' : 
                 complianceStatus === 'warning' ? 'Attention Required' : 'Critical Issue'}
              </Badge>
              
              <Group gap="xs">
                <ThemeIcon size="sm" color="white" variant="transparent">
                  {isOnline ? <IconWifi size={16} /> : <IconWifiOff size={16} />}
                </ThemeIcon>
                <Text size="xs" c="rgba(255,255,255,0.9)">
                  {isOnline ? connectionType || 'Online' : 'Offline'}
                </Text>
              </Group>

              <Group gap="xs">
                <ThemeIcon size="sm" color="white" variant="transparent">
                  <IconBattery size={16} />
                </ThemeIcon>
                <Text size="xs" c="rgba(255,255,255,0.9)">
                  {Math.round((batteryLevel || 0) * 100)}%
                  {isCharging && ' ⚡'}
                </Text>
              </Group>
            </Group>
          </div>

          <Tooltip label="Refresh dashboard">
            <ActionIcon
              variant="subtle"
              color="white"
              size="lg"
              onClick={refreshDashboard}
              loading={refreshing}
            >
              <IconRefresh size={24} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>

      {/* Critical Weather Alert */}
      {weatherAlert?.isActive && (
        <Alert
          icon={<IconDroplet size={24} />}
          title="EPA Weather Alert"
          color="red"
          mb="md"
          className="weather-alert-banner"
          style={{ 
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          <Text size="md" fw={600}>
            {stats.lastRainfall}" precipitation recorded - Inspection required within 24 hours
          </Text>
          <Button
            color="white"
            variant="filled"
            size="sm"
            mt="sm"
            onClick={() => navigate('/weather')}
          >
            View Weather Data
          </Button>
        </Alert>
      )}

      {/* Offline Status */}
      {!isOnline && (
        <Alert
          icon={<IconWifiOff size={20} />}
          title="Offline Mode"
          color="orange"
          mb="md"
        >
          <Text size="sm">
            Working offline. {queueSize > 0 && `${queueSize} items will sync when connection is restored.`}
          </Text>
          {queueSize > 0 && (
            <Button size="xs" variant="white" mt="xs" onClick={retryFailedItems}>
              Retry Sync
            </Button>
          )}
        </Alert>
      )}

      {/* Low Battery Warning */}
      {isLowBattery && !isCharging && (
        <Alert
          icon={<IconBattery size={20} />}
          title="Low Battery"
          color="red"
          mb="md"
        >
          Please charge your device to avoid losing inspection data.
        </Alert>
      )}

      {/* Key Stats Grid */}
      <Grid gutter="md" mb="lg">
        {/* Pending Inspections */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card 
            shadow="sm" 
            p="md" 
            className="mobile-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/weather')}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Pending Inspections
                </Text>
                <Text size="xl" fw={700} c={stats.criticalInspections > 0 ? 'red' : 'orange'}>
                  {stats.pendingInspections}
                </Text>
                <Text size="xs" c="dimmed">
                  {stats.criticalInspections > 0 && `${stats.criticalInspections} critical`}
                </Text>
              </div>
              <ThemeIcon size={40} radius="md" variant="light" color={stats.criticalInspections > 0 ? 'red' : 'orange'}>
                {stats.criticalInspections > 0 ? <IconExclamationMark size={24} /> : <IconClock size={24} />}
              </ThemeIcon>
            </Group>
            
            {stats.nextDeadline && (
              <Box>
                <Text size="xs" c="dimmed" mb="xs">Next deadline:</Text>
                <Badge 
                  color={getDeadlinePriority(stats.nextDeadline)} 
                  variant="filled" 
                  fullWidth
                  style={{ textAlign: 'center' }}
                >
                  {formatTimeUntilDeadline(stats.nextDeadline)}
                </Badge>
              </Box>
            )}
          </Card>
        </Grid.Col>

        {/* Compliance Rate */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card shadow="sm" p="md" className="mobile-card">
            <Group justify="space-between" mb="md">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Compliance Rate
                </Text>
                <Text size="xl" fw={700} c={stats.complianceRate >= 90 ? 'green' : stats.complianceRate >= 75 ? 'orange' : 'red'}>
                  {stats.complianceRate}%
                </Text>
                <Text size="xs" c="dimmed">
                  Last 30 days
                </Text>
              </div>
              <ThemeIcon 
                size={40} 
                radius="md" 
                variant="light" 
                color={stats.complianceRate >= 90 ? 'green' : 'orange'}
              >
                <IconCheck size={24} />
              </ThemeIcon>
            </Group>
            
            <Progress 
              value={stats.complianceRate} 
              color={stats.complianceRate >= 90 ? 'green' : stats.complianceRate >= 75 ? 'orange' : 'red'}
              size="md"
              radius="md"
            />
          </Card>
        </Grid.Col>

        {/* Photos Today */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card 
            shadow="sm" 
            p="md" 
            className="mobile-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/photos')}
          >
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Photos Today
                </Text>
                <Text size="xl" fw={700} c="blue">
                  {stats.photosToday}
                </Text>
                <Text size="xs" c="dimmed">
                  Documentation captured
                </Text>
              </div>
              <ThemeIcon size={40} radius="md" variant="light" color="blue">
                <IconCamera size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        {/* Weather Status */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card 
            shadow="sm" 
            p="md" 
            className={`mobile-card ${stats.lastRainfall >= 0.25 ? 'weather-critical' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/weather')}
          >
            <Group justify="space-between">
              <div>
                <Text 
                  size="xs" 
                  tt="uppercase" 
                  fw={700} 
                  c={stats.lastRainfall >= 0.25 ? 'white' : 'dimmed'}
                >
                  Last Rainfall
                </Text>
                <Text 
                  size="xl" 
                  fw={700} 
                  c={stats.lastRainfall >= 0.25 ? 'white' : 'blue'}
                >
                  {stats.lastRainfall}"
                </Text>
                <Text 
                  size="xs" 
                  c={stats.lastRainfall >= 0.25 ? 'rgba(255,255,255,0.8)' : 'dimmed'}
                >
                  {stats.lastRainfall >= 0.25 ? 'EPA threshold exceeded' : '24-hour total'}
                </Text>
              </div>
              <ThemeIcon 
                size={40} 
                radius="md" 
                variant="light" 
                color={stats.lastRainfall >= 0.25 ? 'white' : 'blue'}
              >
                <IconDroplet size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions */}
      <Card shadow="sm" p="md" mb="md">
        <Title order={3} size="h4" mb="md">
          Quick Actions
        </Title>
        
        <Stack gap="md">
          {/* Emergency Inspection */}
          {stats.criticalInspections > 0 && (
            <Button
              leftSection={<IconExclamationMark size={20} />}
              color="red"
              size={isMobile ? 'lg' : 'md'}
              fullWidth
              onClick={() => navigate('/weather')}
            >
              Start Critical Inspection
            </Button>
          )}

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Button
                leftSection={<IconForms size={20} />}
                variant="light"
                color="blue"
                size={isMobile ? 'lg' : 'md'}
                fullWidth
                onClick={() => navigate('/forms')}
              >
                New Inspection Form
              </Button>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Button
                leftSection={<IconCamera size={20} />}
                variant="light"
                color="green"
                size={isMobile ? 'lg' : 'md'}
                fullWidth
                onClick={() => navigate('/photos')}
              >
                Document Site
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Recent Activity */}
      <Card shadow="sm" p="md">
        <Group justify="space-between" mb="md">
          <Title order={3} size="h4">
            Recent Activity
          </Title>
          <Text size="xs" c="dimmed">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Text>
        </Group>

        <Stack gap="md">
          {/* Sample recent activities */}
          <Group gap="md" wrap="nowrap">
            <ThemeIcon size="sm" color="green" variant="light">
              <IconCheck size={16} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                SWPPP inspection completed
              </Text>
              <Text size="xs" c="dimmed">
                2 hours ago • 6 photos attached
              </Text>
            </div>
          </Group>

          <Divider />

          <Group gap="md" wrap="nowrap">
            <ThemeIcon size="sm" color="orange" variant="light">
              <IconDroplet size={16} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                Rainfall event detected: 0.31"
              </Text>
              <Text size="xs" c="dimmed">
                4 hours ago • Inspection deadline set
              </Text>
            </div>
          </Group>

          <Divider />

          <Group gap="md" wrap="nowrap">
            <ThemeIcon size="sm" color="blue" variant="light">
              <IconCamera size={16} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                Site documentation updated
              </Text>
              <Text size="xs" c="dimmed">
                6 hours ago • 12 new photos
              </Text>
            </div>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}