'use client';

import { Text, Stack, Center, Badge, Group, Paper, Progress, SimpleGrid } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconClock, IconCalendar } from '@tabler/icons-react';
import type { Project } from '@/lib/api/projects';

interface ProjectComplianceTabProps {
  projectId: string;
  project: Project;
}

/**
 * Project Compliance Tab Component - Updated Sprint 6 ISSUE-170
 *
 * Shows compliance status, score, pending/overdue inspections,
 * and next deadline from real API data.
 */
export function ProjectComplianceTab({ project }: ProjectComplianceTabProps) {
  const { compliance } = project;
  const scoreColor = compliance.overallScore >= 80 ? 'green' : compliance.overallScore >= 60 ? 'yellow' : 'red';

  return (
    <Stack gap="md" data-testid="compliance-tab-content">
      {/* Compliance Score */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600} size="14px">Compliance Score</Text>
            <Badge color={scoreColor} size="lg" variant="light">
              {Math.round(compliance.overallScore)}%
            </Badge>
          </Group>
          <Progress value={compliance.overallScore} color={scoreColor} size="lg" />
        </Stack>
      </Paper>

      {/* Status Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* Pending Inspections */}
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Group gap="xs">
              <IconClock size={16} style={{ opacity: 0.6 }} />
              <Text size="13px" c="dimmed">Pending Inspections</Text>
            </Group>
            <Text fw={600} size="24px">
              {compliance.pendingInspections}
            </Text>
          </Stack>
        </Paper>

        {/* Overdue Inspections */}
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Group gap="xs">
              <IconAlertTriangle
                size={16}
                color={compliance.overdueInspections > 0 ? 'red' : undefined}
                style={{ opacity: compliance.overdueInspections > 0 ? 1 : 0.6 }}
              />
              <Text size="13px" c={compliance.overdueInspections > 0 ? 'red' : 'dimmed'}>
                Overdue Inspections
              </Text>
            </Group>
            <Text fw={600} size="24px" c={compliance.overdueInspections > 0 ? 'red' : undefined}>
              {compliance.overdueInspections}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Last Inspection & Next Deadline */}
      <Paper p="md" withBorder>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {compliance.lastInspection && (
            <Stack gap="xs">
              <Group gap="xs">
                <IconCheck size={16} style={{ opacity: 0.6 }} />
                <Text size="13px" c="dimmed">Last Inspection</Text>
              </Group>
              <Text size="14px">
                {new Date(compliance.lastInspection).toLocaleDateString()}
              </Text>
            </Stack>
          )}
          {compliance.nextDeadline && (
            <Stack gap="xs">
              <Group gap="xs">
                <IconCalendar size={16} style={{ opacity: 0.6 }} />
                <Text size="13px" c="dimmed">Next Deadline</Text>
              </Group>
              <Text size="14px">
                {new Date(compliance.nextDeadline).toLocaleDateString()}
              </Text>
            </Stack>
          )}
        </SimpleGrid>
      </Paper>

      {/* Overall Status */}
      <Center py="md">
        <Badge
          color={compliance.requiresAttention ? 'red' : 'green'}
          size="xl"
          variant="light"
        >
          {compliance.requiresAttention ? 'Attention Required' : 'Compliant'}
        </Badge>
      </Center>
    </Stack>
  );
}

