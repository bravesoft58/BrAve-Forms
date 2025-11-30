'use client';

import { Text, Stack, Center, Badge, Paper, Group, SimpleGrid, Alert } from '@mantine/core';
import { IconCloudRain, IconAlertTriangle, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import type { Project } from '@/lib/api/projects';

interface ProjectWeatherTabProps {
  projectId: string;
  project: Project;
}

/**
 * Project Weather Tab Component - Updated Sprint 6 ISSUE-170
 *
 * Shows weather-related compliance information including:
 * - Weather-triggered inspections from recent history
 * - EPA CGP 0.25" rain threshold alerts
 * - Location coordinates for weather monitoring
 *
 * Note: Real-time rainfall data requires weather API integration (NOAA/OpenWeatherMap)
 * which is planned for a future sprint.
 */
export function ProjectWeatherTab({ project }: ProjectWeatherTabProps) {
  // Count weather-triggered inspections
  const weatherTriggeredInspections = project.recentInspections.filter(
    (insp) => insp.weatherTriggered
  );
  const hasWeatherAlert = project.compliance.requiresAttention && weatherTriggeredInspections.length > 0;

  return (
    <Stack gap="md" data-testid="weather-tab-content">
      {/* Weather Alert Banner */}
      {hasWeatherAlert && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="EPA CGP Weather Alert"
          color="orange"
          variant="light"
        >
          Recent rainfall exceeded 0.25&quot; threshold. Inspection required within 24 working hours.
        </Alert>
      )}

      {/* Location Info */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Text fw={600} size="14px">Weather Monitoring Location</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Stack gap="xs">
              <Text size="13px" c="dimmed">Latitude</Text>
              <Text size="14px">{project.latitude.toFixed(6)}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="13px" c="dimmed">Longitude</Text>
              <Text size="14px">{project.longitude.toFixed(6)}</Text>
            </Stack>
          </SimpleGrid>
          <Text size="12px" c="dimmed">
            Address: {project.address}
          </Text>
        </Stack>
      </Paper>

      {/* Weather-Triggered Inspections */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600} size="14px">Weather-Triggered Inspections</Text>
            <Badge color={weatherTriggeredInspections.length > 0 ? 'orange' : 'gray'} variant="light">
              {weatherTriggeredInspections.length}
            </Badge>
          </Group>
          {weatherTriggeredInspections.length > 0 ? (
            <Stack gap="xs">
              {weatherTriggeredInspections.slice(0, 5).map((insp) => (
                <Group key={insp.id} justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <IconCloudRain size={14} style={{ opacity: 0.6 }} />
                    <Text size="13px">{insp.type}</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge size="sm" variant="light" color={insp.overdue ? 'red' : insp.status === 'COMPLETED' ? 'green' : 'yellow'}>
                      {insp.status}
                    </Badge>
                    <Text size="12px" c="dimmed">
                      {new Date(insp.inspectionDate).toLocaleDateString()}
                    </Text>
                  </Group>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="13px" c="dimmed">
              No weather-triggered inspections in recent history.
            </Text>
          )}
        </Stack>
      </Paper>

      {/* EPA CGP Threshold Info */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Text fw={600} size="14px">EPA CGP Rain Threshold</Text>
          <Group gap="xs">
            <IconInfoCircle size={16} style={{ opacity: 0.6 }} />
            <Text size="13px" c="dimmed">
              Inspection required within 24 working hours when rainfall exceeds 0.25&quot;
            </Text>
          </Group>
        </Stack>
      </Paper>

      {/* Overall Status */}
      <Center py="md">
        <Group gap="md">
          {hasWeatherAlert ? (
            <Badge color="orange" size="xl" variant="light" leftSection={<IconCloudRain size={16} />}>
              Weather Alert Active
            </Badge>
          ) : (
            <Badge color="green" size="xl" variant="light" leftSection={<IconCheck size={16} />}>
              No Weather Alerts
            </Badge>
          )}
        </Group>
      </Center>
    </Stack>
  );
}
