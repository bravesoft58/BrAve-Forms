'use client';

import { Stack, Group, Text, Progress, Badge, Card, Grid } from '@mantine/core';
import { 
  IconCircleCheck, 
  IconAlertTriangle, 
  IconClock,
  IconShield
} from '@tabler/icons-react';
import { useAppStore } from '@/lib/store/app.store';

export function ComplianceOverview() {
  const appState = useAppStore();
  
  // Mock compliance data - in real app this would come from API
  const complianceData = {
    overallScore: 98.5,
    compliantProjects: 11,
    totalProjects: 12,
    overdueInspections: appState.compliance.overdueInspections || 1,
    upcomingDeadlines: appState.compliance.upcomingDeadlines.length || 2,
    recentViolations: 0,
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'green';
    if (score >= 85) return 'yellow';
    return 'red';
  };

  return (
    <Stack gap="md">
      {/* Overall Compliance Score */}
      <Card padding="md" radius="sm" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <IconShield size={20} color="var(--mantine-color-green-6)" />
            <Text fw={600} size="sm">
              Overall Compliance Score
            </Text>
          </Group>
          <Badge 
            color={getScoreColor(complianceData.overallScore)} 
            size="lg"
            variant="light"
          >
            {complianceData.overallScore}%
          </Badge>
        </Group>
        
        <Progress 
          value={complianceData.overallScore} 
          color={getScoreColor(complianceData.overallScore)}
          size="lg"
          radius="sm"
          mb="xs"
        />
        
        <Text size="xs" c="dimmed">
          {complianceData.compliantProjects} of {complianceData.totalProjects} projects in compliance
        </Text>
      </Card>

      {/* Compliance Metrics Grid */}
      <Grid>
        <Grid.Col span={6}>
          <Card padding="sm" radius="sm" withBorder h="100%">
            <Group gap="xs" mb="xs">
              {complianceData.overdueInspections > 0 ? (
                <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
              ) : (
                <IconCircleCheck size={16} color="var(--mantine-color-green-6)" />
              )}
              <Text size="xs" fw={600} c="dimmed">
                OVERDUE
              </Text>
            </Group>
            <Text size="xl" fw={700} c={complianceData.overdueInspections > 0 ? 'red' : 'green'}>
              {complianceData.overdueInspections}
            </Text>
            <Text size="xs" c="dimmed">
              Overdue inspections
            </Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Card padding="sm" radius="sm" withBorder h="100%">
            <Group gap="xs" mb="xs">
              <IconClock size={16} color="var(--mantine-color-orange-6)" />
              <Text size="xs" fw={600} c="dimmed">
                UPCOMING
              </Text>
            </Group>
            <Text size="xl" fw={700} c="orange">
              {complianceData.upcomingDeadlines}
            </Text>
            <Text size="xs" c="dimmed">
              Due within 48 hours
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Recent Status Updates */}
      <Stack gap="xs">
        <Text size="sm" fw={600} c="dimmed">
          Recent Updates
        </Text>
        
        {complianceData.overdueInspections > 0 && (
          <Group gap="xs" p="xs" style={{ backgroundColor: 'var(--mantine-color-red-0)', borderRadius: '4px' }}>
            <IconAlertTriangle size={14} color="var(--mantine-color-red-6)" />
            <Text size="xs" c="red" fw={500}>
              {complianceData.overdueInspections} inspection(s) overdue - EPA fines may apply
            </Text>
          </Group>
        )}
        
        {complianceData.upcomingDeadlines > 0 && (
          <Group gap="xs" p="xs" style={{ backgroundColor: 'var(--mantine-color-orange-0)', borderRadius: '4px' }}>
            <IconClock size={14} color="var(--mantine-color-orange-6)" />
            <Text size="xs" c="orange" fw={500}>
              {complianceData.upcomingDeadlines} inspection(s) due within 48 hours
            </Text>
          </Group>
        )}
        
        {complianceData.overdueInspections === 0 && complianceData.upcomingDeadlines === 0 && (
          <Group gap="xs" p="xs" style={{ backgroundColor: 'var(--mantine-color-green-0)', borderRadius: '4px' }}>
            <IconCircleCheck size={14} color="var(--mantine-color-green-6)" />
            <Text size="xs" c="green" fw={500}>
              All inspections up to date - excellent compliance!
            </Text>
          </Group>
        )}
      </Stack>

      {/* Offline Status */}
      {appState.networkStatus === 'offline' && (
        <Text size="xs" c="orange" ta="center" mt="sm">
          ⚠️ Working offline - compliance data may not be current
        </Text>
      )}
    </Stack>
  );
}