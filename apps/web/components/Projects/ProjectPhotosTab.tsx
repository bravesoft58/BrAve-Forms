'use client';

import { Text, Stack, Center } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';

/**
 * Project Photos Tab Component
 *
 * Shows photos associated with this project.
 * This will be fully implemented in Sprint 5.
 */
export function ProjectPhotosTab({ projectId }: { projectId: string }) {
  return (
    <Stack gap="md" data-testid="photos-tab-content">
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconPhoto size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Photos Tab
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Photo gallery will be implemented in Sprint 5
          </Text>
        </Stack>
      </Center>
    </Stack>
  );
}

