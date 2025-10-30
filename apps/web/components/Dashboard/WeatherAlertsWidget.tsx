'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Alert } from '@mantine/core';
import { IconCloudRain, IconDroplet } from '@tabler/icons-react';

interface WeatherAlert {
  projectId: string;
  projectName: string;
  rainAmount: number;
  timestamp: Date;
}

// Mock data for Sprint 3 (will be replaced with real API in Sprint 4)
const mockWeatherAlerts: WeatherAlert[] = [
  {
    projectId: '1',
    projectName: 'Mill Street Construction',
    rainAmount: 0.35,
    timestamp: new Date(),
  },
];

export function WeatherAlertsWidget() {
  const alerts = mockWeatherAlerts.filter((alert) => alert.rainAmount >= 0.25);

  return (
    <Paper withBorder p="md" data-testid="weather-alerts-widget">
      <Group mb="xs" gap="xs">
        <ThemeIcon variant="light" color="blue" size="sm">
          <IconCloudRain size={14} />
        </ThemeIcon>
        <Text fw={600} size="13px">
          Weather Alerts
        </Text>
      </Group>

      <Stack gap="xs">
        {alerts.length === 0 ? (
          <Text size="13px" c="dimmed">
            No active weather alerts
          </Text>
        ) : (
          alerts.map((alert) => (
            <Alert
              key={alert.projectId}
              icon={<IconDroplet size={16} />}
              color="blue"
              variant="light"
            >
              <Text size="13px" fw={500}>
                {alert.projectName}
              </Text>
              <Text size="11px" c="dimmed">
                {alert.rainAmount}&quot; rain recorded - Inspection required
              </Text>
            </Alert>
          ))
        )}
      </Stack>
    </Paper>
  );
}
