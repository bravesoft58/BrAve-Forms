'use client';

import { Grid, Card, Group, Text, ThemeIcon, Skeleton } from '@mantine/core';
import {
  IconBuilding,
  IconClipboardCheck,
  IconAlertTriangle,
  IconCircleCheck,
} from '@tabler/icons-react';
import { useAppStore } from '@/lib/store/app.store';
import { useDashboardStats } from '@/hooks/useDashboard';

export function DashboardStats() {
  const appState = useAppStore();
  const { data: dashboardStats, isLoading, error } = useDashboardStats();

  // Build stats array from real API data
  const stats = [
    {
      title: 'Active Projects',
      value: dashboardStats?.activeProjects?.toString() ?? '0',
      icon: IconBuilding,
      color: 'blue.6', // Construction blue (#2563eb)
      description: 'Currently active construction sites',
    },
    {
      title: 'Submissions Today',
      value: dashboardStats?.submissionsToday?.toString() ?? '0',
      icon: IconClipboardCheck,
      color: 'green.5', // Success green (#10b981)
      description: 'Form submissions today',
    },
    {
      title: 'Pending Inspections',
      value: dashboardStats?.pendingInspections?.toString() ?? '0',
      icon: IconAlertTriangle,
      color: 'orange.6', // Safety orange (#ea580c)
      description: 'Require attention',
    },
    {
      title: 'Compliance Rate',
      value: dashboardStats ? `${dashboardStats.complianceRate}%` : '0%',
      icon: IconCircleCheck,
      color: 'blue.5', // Info blue (#3b82f6)
      description: 'Overall compliance score',
    },
  ];

  return (
    <Grid>
      {stats.map((stat, index) => (
        <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="xs">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="gray.6">
                  {stat.title}
                </Text>
                {isLoading ? (
                  <Skeleton height={28} width={60} mt={4} />
                ) : (
                  <Text size="xl" fw={700} c="gray.9">
                    {stat.value}
                  </Text>
                )}
              </div>
              <ThemeIcon size={38} radius="md" color={stat.color} variant="light">
                <stat.icon size={24} stroke={1.5} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="gray.6">
              {stat.description}
            </Text>

            {/* Show offline indicator if applicable */}
            {appState.networkStatus === 'offline' && (
              <Text size="xs" c="orange" mt="xs" fw={500}>
                Data may not be current (offline mode)
              </Text>
            )}

            {/* Show error state */}
            {error && (
              <Text size="xs" c="red" mt="xs" fw={500}>
                Failed to load data
              </Text>
            )}
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
}
