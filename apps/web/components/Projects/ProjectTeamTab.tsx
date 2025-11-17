'use client';

import { Text, Stack, Center } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';

/**
 * Project Team Tab Component
 *
 * Shows team members assigned to this project.
 * This will be fully implemented in Sprint 4.
 */
export function ProjectTeamTab({ projectId }: { projectId: string }) {
  return (
    <Stack gap="md" data-testid="team-tab-content">
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconUsers size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Team Tab
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Team management will be implemented in Sprint 4
          </Text>
        </Stack>
      </Center>
    </Stack>
  );
}

