'use client';

import { Alert, Group, Text, Badge, Button, Skeleton, Loader } from '@mantine/core';
import { IconDroplet, IconAlertTriangle, IconClock, IconWifi, IconWifiOff } from '@tabler/icons-react';
import Link from 'next/link';
import { useQuery, useSubscription } from '@apollo/client';
import { useAuth } from '@clerk/nextjs';
import { useAppStore } from '@/lib/store/app.store';
import { 
  GET_PENDING_INSPECTIONS, 
  WEATHER_ALERTS_SUBSCRIPTION,
  useWeatherMonitoring,
  type WeatherEvent,
  type WeatherAlert as WeatherAlertType
} from '@/lib/graphql/weather.queries';
import { useState, useEffect } from 'react';

interface WeatherAlertProps {
  projectId?: string;
  compact?: boolean;
}

export function WeatherAlert({ projectId, compact = false }: WeatherAlertProps) {
  const appState = useAppStore();
  const { orgId } = useAuth();
  const weatherUtils = useWeatherMonitoring();
  const [latestAlert, setLatestAlert] = useState<WeatherAlertType | null>(null);
  
  // Get pending inspections for the organization
  const { data, loading, error, refetch } = useQuery(GET_PENDING_INSPECTIONS, {
    pollInterval: 60000, // Refresh every minute for compliance monitoring
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });
  
  // Subscribe to real-time weather alerts
  const { data: alertData } = useSubscription(WEATHER_ALERTS_SUBSCRIPTION, {
    variables: { orgId },
    skip: !orgId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData.data?.weatherAlerts) {
        setLatestAlert(subscriptionData.data.weatherAlerts);
        
        // Refetch pending inspections when we get a new alert
        refetch();
      }
    },
  });
  
  // Show latest real-time alert if available
  useEffect(() => {
    if (alertData?.weatherAlerts) {
      setLatestAlert(alertData.weatherAlerts);
    }
  }, [alertData]);
  
  if (loading && !data) {
    return (
      <Skeleton height={60} radius="md" />
    );
  }
  
  if (error && !data) {
    return (
      <Alert
        variant="light"
        color="red"
        radius="md"
        icon={<IconAlertTriangle size={20} />}
      >
        <Group gap="xs">
          <IconWifiOff size={16} />
          <Text size="sm" fw={500}>
            Weather monitoring unavailable - Manual verification required
          </Text>
        </Group>
      </Alert>
    );
  }
  
  // Filter pending inspections by projectId if specified
  const pendingInspections: WeatherEvent[] = data?.pendingInspections?.filter(
    (inspection: WeatherEvent) => !projectId || inspection.projectId === projectId
  ) || [];
  
  // Get the most urgent pending inspection
  const urgentInspection = pendingInspections.sort((a, b) => {
    const hoursA = weatherUtils.calculateHoursRemaining(a.inspectionDeadline);
    const hoursB = weatherUtils.calculateHoursRemaining(b.inspectionDeadline);
    return hoursA - hoursB; // Most urgent first
  })[0];
  
  // Show real-time alert if more recent than pending inspections
  const alertToShow = latestAlert && 
    (!urgentInspection || new Date(latestAlert.timestamp) > new Date(urgentInspection.eventDate))
    ? latestAlert 
    : urgentInspection;
    
  if (!alertToShow) {
    if (!compact) {
      return (
        <Alert
          variant="light"
          color="green"
          radius="md"
          icon={<IconDroplet size={20} />}
        >
          <Group gap="xs">
            <IconWifi size={16} />
            <Text size="sm" fw={500}>
              Weather monitoring active - No EPA threshold violations detected
            </Text>
          </Group>
        </Alert>
      );
    }
    return null;
  }
  
  // Handle real-time alert
  if ('message' in alertToShow) {
    const alert = alertToShow as WeatherAlertType;
    const isFailure = alert.alertType === 'MONITORING_FAILURE';
    
    return (
      <Alert
        variant="light"
        color={isFailure ? 'orange' : 'red'}
        radius="md"
        icon={<IconDroplet size={20} />}
        className="weather-alert animate-pulse"
      >
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <Text size="sm" fw={700} c={`${isFailure ? 'orange' : 'red'}.7`}>
                {alert.alertType.replace(/_/g, ' ')}
              </Text>
              <Badge color={isFailure ? 'orange' : 'red'} size="sm" variant="filled">
                REAL-TIME
              </Badge>
            </Group>
            
            <Text size="sm" fw={500} mb="xs">
              {alert.message}
            </Text>
            
            {!isFailure && (
              <Group gap="xs" mb="sm">
                <IconDroplet size={16} />
                <Text size="sm" fw={500}>
                  {weatherUtils.formatPrecipitation(alert.precipitationAmount)} detected
                </Text>
                <Text size="sm" c="dimmed">({alert.source})</Text>
              </Group>
            )}
            
            {appState.networkStatus === 'offline' && (
              <Text size="xs" c="orange" mt="xs" fw={500}>
                ⚠️ Working offline - Real-time monitoring may be delayed
              </Text>
            )}
          </div>
          
          <Group gap="sm">
            <Button 
              size="sm" 
              variant="filled" 
              color={isFailure ? 'orange' : 'red'}
              component={Link}
              href={`/inspections/new?projectId=${alert.projectId}&trigger=rainfall`}
              disabled={isFailure}
            >
              {isFailure ? 'Check Status' : 'Start Inspection'}
            </Button>
          </Group>
        </Group>
      </Alert>
    );
  }
  
  // Handle pending inspection
  const inspection = alertToShow as WeatherEvent;
  const hoursRemaining = weatherUtils.calculateHoursRemaining(inspection.inspectionDeadline);
  const priority = weatherUtils.getPriority(inspection.precipitationInches, hoursRemaining);
  const alertColor = weatherUtils.getPriorityColor(priority);

  return (
    <Alert
      variant="light"
      color={alertColor}
      radius="md"
      icon={<IconDroplet size={20} />}
      className="weather-alert"
    >
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Group gap="xs" mb="xs">
            <Text size="sm" fw={700} c={`${alertColor}.7`}>
              EPA RAINFALL TRIGGER ACTIVATED
            </Text>
            <Badge color={alertColor} size="sm" variant="filled">
              {priority.replace('_', ' ')}
            </Badge>
            <Badge color={weatherUtils.getConfidenceColor(inspection.source)} size="sm" variant="outline">
              {inspection.source}
            </Badge>
          </Group>
          
          <Group gap="lg" mb="sm">
            <Group gap="xs">
              <IconDroplet size={16} />
              <Text size="sm" fw={500}>
                {weatherUtils.formatPrecipitation(inspection.precipitationInches)} detected
              </Text>
            </Group>
            
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="sm" fw={500}>
                {hoursRemaining} hours remaining
              </Text>
            </Group>
          </Group>
          
          <Text size="sm" c="dimmed" mb="xs">
            Inspection deadline: {weatherUtils.formatDeadline(inspection.inspectionDeadline)}
          </Text>
          
          <Text size="sm" c="dimmed">
            EPA CGP requires SWPPP inspection within 24 working hours of ≥0.25" precipitation
          </Text>
          
          {appState.networkStatus === 'offline' && (
            <Text size="xs" c="orange" mt="xs" fw={500}>
              ⚠️ Working offline - Weather data may not be current
            </Text>
          )}
        </div>
        
        <Group gap="sm">
          <Button 
            size="sm" 
            variant="filled" 
            color={alertColor}
            component={Link}
            href={`/inspections/new?projectId=${inspection.projectId}&trigger=rainfall&weatherEventId=${inspection.id}`}
          >
            Start Inspection
          </Button>
          
          {!compact && (
            <Button 
              size="sm" 
              variant="subtle" 
              color={alertColor}
              component={Link}
              href="/weather"
            >
              View Details
            </Button>
          )}
        </Group>
      </Group>
    </Alert>
  );
}