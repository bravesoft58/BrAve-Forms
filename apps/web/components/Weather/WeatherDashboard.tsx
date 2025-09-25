'use client';

import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Loader,
  Alert,
  Table,
  Progress,
  Grid,
  Stack,
  ActionIcon,
  Tooltip,
  Divider,
  Center,
  ThemeIcon
} from '@mantine/core';
import {
  IconDroplet,
  IconAlertTriangle,
  IconClock,
  IconRefresh,
  IconCloud,
  IconCloudRain,
  IconEye,
  IconChecks,
  IconExclamationMark,
  IconWifi,
  IconWifiOff,
  IconCalendar,
  IconMapPin
} from '@tabler/icons-react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@clerk/nextjs';
import { useAppStore } from '@/lib/store/app.store';
import { 
  GET_PENDING_INSPECTIONS,
  GET_RECENT_WEATHER_EVENTS,
  useWeatherMonitoring,
  type WeatherEvent 
} from '@/lib/graphql/weather.queries';
import { WeatherAlert } from './WeatherAlert';
import Link from 'next/link';
import { useState } from 'react';

interface WeatherDashboardProps {
  projectId?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function WeatherDashboard({ 
  projectId, 
  showHeader = true, 
  compact = false 
}: WeatherDashboardProps) {
  const appState = useAppStore();
  const { orgId } = useAuth();
  const weatherUtils = useWeatherMonitoring();
  const [refetchLoading, setRefetchLoading] = useState(false);

  // Get pending inspections
  const { 
    data: pendingData, 
    loading: pendingLoading, 
    error: pendingError, 
    refetch: refetchPending 
  } = useQuery(GET_PENDING_INSPECTIONS, {
    pollInterval: 60000, // Refresh every minute
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Get recent weather events for context
  const { 
    data: recentData, 
    loading: recentLoading,
    error: recentError 
  } = useQuery(GET_RECENT_WEATHER_EVENTS, {
    variables: { projectId: projectId || '', days: 14 },
    skip: !projectId,
    pollInterval: 300000, // Refresh every 5 minutes
    errorPolicy: 'all',
  });

  const handleRefresh = async () => {
    setRefetchLoading(true);
    try {
      await refetchPending();
    } finally {
      setRefetchLoading(false);
    }
  };

  if (pendingLoading && !pendingData) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Center h={200}>
          <Stack gap="md" align="center">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">Loading weather monitoring data...</Text>
          </Stack>
        </Center>
      </Card>
    );
  }

  const pendingInspections: WeatherEvent[] = pendingData?.pendingInspections || [];
  const recentEvents: WeatherEvent[] = recentData?.recentWeatherEvents || [];

  // Filter by project if specified
  const filteredPending = projectId 
    ? pendingInspections.filter(i => i.projectId === projectId)
    : pendingInspections;

  // Calculate statistics
  const criticalInspections = filteredPending.filter(i => {
    const hours = weatherUtils.calculateHoursRemaining(i.inspectionDeadline);
    return hours <= 2;
  }).length;

  const urgentInspections = filteredPending.filter(i => {
    const hours = weatherUtils.calculateHoursRemaining(i.inspectionDeadline);
    return hours > 2 && hours <= 6;
  }).length;

  const totalEvents = recentEvents.length;
  const completedInspections = recentEvents.filter(e => e.inspectionCompleted).length;
  const complianceRate = totalEvents > 0 ? (completedInspections / totalEvents) * 100 : 100;

  if (pendingError && !pendingData) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Alert
          variant="light"
          color="red"
          icon={<IconWifiOff size={20} />}
          title="Weather Monitoring Unavailable"
        >
          <Text size="sm" mb="md">
            Unable to connect to weather monitoring service. This may indicate a network 
            issue or service interruption.
          </Text>
          <Button size="sm" leftSection={<IconRefresh size={16} />} onClick={handleRefresh}>
            Retry Connection
          </Button>
        </Alert>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Header */}
      {showHeader && (
        <Group justify="space-between">
          <div>
            <Group gap="xs">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconCloudRain size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={600}>Weather Monitoring</Text>
                <Text size="sm" c="dimmed">
                  EPA CGP Compliance • 0.25" Threshold
                </Text>
              </div>
            </Group>
          </div>
          
          <Group gap="xs">
            <Tooltip label="Network status">
              <ActionIcon 
                variant="subtle" 
                color={appState.networkStatus === 'online' ? 'green' : 'orange'}
              >
                {appState.networkStatus === 'online' ? <IconWifi size={16} /> : <IconWifiOff size={16} />}
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Refresh weather data">
              <ActionIcon 
                variant="subtle" 
                onClick={handleRefresh}
                loading={refetchLoading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      )}

      {/* Weather Alert */}
      <WeatherAlert projectId={projectId} compact={compact} />

      {/* Statistics Cards */}
      {!compact && (
        <Grid>
          <Grid.Col span={4}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Critical
                  </Text>
                  <Text size="xl" fw={700} c="red">
                    {criticalInspections}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ≤2 hours remaining
                  </Text>
                </div>
                <ThemeIcon size={40} radius="md" variant="light" color="red">
                  <IconExclamationMark size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={4}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Urgent
                  </Text>
                  <Text size="xl" fw={700} c="orange">
                    {urgentInspections}
                  </Text>
                  <Text size="xs" c="dimmed">
                    2-6 hours remaining
                  </Text>
                </div>
                <ThemeIcon size={40} radius="md" variant="light" color="orange">
                  <IconClock size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={4}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Compliance Rate
                  </Text>
                  <Text size="xl" fw={700} c={complianceRate >= 90 ? 'green' : complianceRate >= 75 ? 'orange' : 'red'}>
                    {complianceRate.toFixed(1)}%
                  </Text>
                  <Text size="xs" c="dimmed">
                    Last 14 days
                  </Text>
                </div>
                <ThemeIcon size={40} radius="md" variant="light" color={complianceRate >= 90 ? 'green' : 'orange'}>
                  <IconChecks size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Pending Inspections Table */}
      {filteredPending.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={600}>Pending Inspections</Text>
            <Badge variant="filled" color="red">
              {filteredPending.length} pending
            </Badge>
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Project</Table.Th>
                <Table.Th>Precipitation</Table.Th>
                <Table.Th>Event Date</Table.Th>
                <Table.Th>Deadline</Table.Th>
                <Table.Th>Priority</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPending.map((inspection) => {
                const hoursRemaining = weatherUtils.calculateHoursRemaining(inspection.inspectionDeadline);
                const priority = weatherUtils.getPriority(inspection.precipitationInches, hoursRemaining);
                const priorityColor = weatherUtils.getPriorityColor(priority);
                
                return (
                  <Table.Tr key={inspection.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconMapPin size={14} />
                        <Text size="sm" fw={500}>
                          Project {inspection.projectId.slice(-6)}
                        </Text>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xs">
                        <IconDroplet size={14} />
                        <Text size="sm" fw={600}>
                          {weatherUtils.formatPrecipitation(inspection.precipitationInches)}
                        </Text>
                        <Badge size="sm" variant="outline" color={weatherUtils.getConfidenceColor(inspection.source)}>
                          {inspection.source}
                        </Badge>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xs">
                        <IconCalendar size={14} />
                        <Text size="sm">
                          {new Date(inspection.eventDate).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </Text>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <div>
                        <Text size="sm" fw={500}>
                          {weatherUtils.formatDeadline(inspection.inspectionDeadline)}
                        </Text>
                        <Text size="xs" c={priorityColor}>
                          {hoursRemaining} hours remaining
                        </Text>
                      </div>
                    </Table.Td>
                    
                    <Table.Td>
                      <Badge color={priorityColor} variant="filled" size="sm">
                        {priority.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xs">
                        <Button 
                          size="xs" 
                          variant="filled" 
                          color={priorityColor}
                          component={Link}
                          href={`/inspections/new?projectId=${inspection.projectId}&trigger=rainfall&weatherEventId=${inspection.id}`}
                        >
                          Start
                        </Button>
                        
                        <ActionIcon 
                          size="sm" 
                          variant="subtle" 
                          color="gray"
                          component={Link}
                          href={`/weather/events/${inspection.id}`}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Recent Weather Events */}
      {!compact && recentEvents.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={600}>Recent Weather Events</Text>
            <Text size="sm" c="dimmed">Last 14 days</Text>
          </Group>

          <Stack gap="sm">
            {recentEvents.slice(0, 5).map((event) => (
              <Group key={event.id} justify="space-between" p="sm" bg={event.inspectionCompleted ? 'gray.0' : 'red.0'}>
                <Group gap="md">
                  <ThemeIcon 
                    size="sm" 
                    variant="light" 
                    color={event.inspectionCompleted ? 'green' : 'red'}
                  >
                    {event.inspectionCompleted ? <IconChecks size={12} /> : <IconExclamationMark size={12} />}
                  </ThemeIcon>
                  
                  <div>
                    <Text size="sm" fw={500}>
                      {weatherUtils.formatPrecipitation(event.precipitationInches)} precipitation
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </Text>
                  </div>
                </Group>
                
                <Group gap="xs">
                  <Badge 
                    size="sm" 
                    variant="outline" 
                    color={weatherUtils.getConfidenceColor(event.source)}
                  >
                    {event.source}
                  </Badge>
                  
                  <Badge 
                    size="sm" 
                    variant="filled" 
                    color={event.inspectionCompleted ? 'green' : 'red'}
                  >
                    {event.inspectionCompleted ? 'Complete' : 'Pending'}
                  </Badge>
                </Group>
              </Group>
            ))}
          </Stack>

          {recentEvents.length > 5 && (
            <>
              <Divider mt="md" />
              <Center pt="md">
                <Button variant="subtle" size="sm" component={Link} href="/weather/history">
                  View All Events ({recentEvents.length})
                </Button>
              </Center>
            </>
          )}
        </Card>
      )}

      {/* No Data State */}
      {filteredPending.length === 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Center py="xl">
            <Stack gap="md" align="center">
              <ThemeIcon size="xl" variant="light" color="green">
                <IconCloud size={32} />
              </ThemeIcon>
              
              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={600} mb="xs">
                  All Clear
                </Text>
                <Text size="sm" c="dimmed">
                  No pending weather-triggered inspections. 
                  {projectId ? ' This project is' : ' All projects are'} compliant with EPA CGP requirements.
                </Text>
              </div>
            </Stack>
          </Center>
        </Card>
      )}
    </Stack>
  );
}