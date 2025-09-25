'use client';

import { Grid, Card, Group, Text, ThemeIcon } from '@mantine/core';
import { 
  IconBuilding, 
  IconClipboardCheck, 
  IconAlertTriangle, 
  IconCircleCheck 
} from '@tabler/icons-react';
import { useAppStore } from '@/lib/store/app.store';

const stats = [
  {
    title: 'Active Projects',
    value: '12',
    icon: IconBuilding,
    color: 'blue',
    description: 'Currently active construction sites',
  },
  {
    title: 'Completed Inspections',
    value: '847',
    icon: IconClipboardCheck,
    color: 'green',
    description: 'This month',
  },
  {
    title: 'Pending Actions',
    value: '3',
    icon: IconAlertTriangle,
    color: 'orange',
    description: 'Require immediate attention',
  },
  {
    title: 'Compliance Rate',
    value: '98.5%',
    icon: IconCircleCheck,
    color: 'teal',
    description: 'Overall compliance score',
  },
];

export function DashboardStats() {
  const appState = useAppStore();

  return (
    <Grid>
      {stats.map((stat, index) => (
        <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="xs">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {stat.title}
                </Text>
                <Text size="xl" fw={700} c="dark.8">
                  {stat.value}
                </Text>
              </div>
              <ThemeIcon size={38} radius="md" color={stat.color} variant="light">
                <stat.icon size={24} stroke={1.5} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {stat.description}
            </Text>
            
            {/* Show offline indicator if applicable */}
            {appState.networkStatus === 'offline' && (
              <Text size="xs" c="orange" mt="xs" fw={500}>
                Data may not be current (offline mode)
              </Text>
            )}
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
}