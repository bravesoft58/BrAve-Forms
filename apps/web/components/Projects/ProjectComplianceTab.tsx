'use client';

import { Text, Stack, Center, Badge, Group } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { getMockProjectById } from '@/lib/mock-data/projects';

/**
 * Project Compliance Tab Component
 *
 * Shows compliance status and pending inspections.
 */
export function ProjectComplianceTab({ projectId }: { projectId: string }) {
  const project = getMockProjectById(projectId);

  return (
    <Stack gap="md" data-testid="compliance-tab-content">
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconCheck size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Compliance Status
          </Text>
          {project && (
            <Stack gap="xs" align="center">
              <Text size="13px" c="dimmed">
                Pending Inspections: {project.compliance.pendingInspections}
              </Text>
              <Group gap="xs">
                <Badge
                  color={project.compliance.requiresAttention ? 'red' : 'green'}
                  size="lg"
                  variant="light"
                >
                  {project.compliance.requiresAttention ? 'Attention Required' : 'Compliant'}
                </Badge>
              </Group>
            </Stack>
          )}
        </Stack>
      </Center>
    </Stack>
  );
}

