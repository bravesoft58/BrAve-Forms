'use client';

import { Text, Stack, Center, Badge, Group } from '@mantine/core';
import { IconCloudRain } from '@tabler/icons-react';
import { getMockProjectById } from '@/lib/mock-data/projects';

/**
 * Project Weather Tab Component
 *
 * Shows weather information and EPA CGP compliance alerts.
 * Displays recent rainfall and alerts when >= 0.25" (EPA CGP threshold).
 */
export function ProjectWeatherTab({ projectId }: { projectId: string }) {
  const project = getMockProjectById(projectId);
  const hasWeatherAlert = project?.recentRainfall && project.recentRainfall >= 0.25;

  return (
    <Stack gap="md" data-testid="weather-tab-content">
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconCloudRain size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Weather Information
          </Text>
          {project && (
            <Stack gap="xs" align="center">
              <Text size="13px" c="dimmed">
                Recent Rainfall (24h): {project.recentRainfall.toFixed(2)}"
              </Text>
              {hasWeatherAlert && (
                <Badge color="orange" size="lg" variant="light">
                  EPA CGP Alert: Inspection Required (>= 0.25")
                </Badge>
              )}
              {!hasWeatherAlert && (
                <Badge color="green" size="lg" variant="light">
                  No Alert: Below 0.25" threshold
                </Badge>
              )}
            </Stack>
          )}
        </Stack>
      </Center>
    </Stack>
  );
}

