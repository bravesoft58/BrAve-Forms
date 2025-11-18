'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, Center } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

/**
 * Settings Page - Placeholder
 *
 * This page will be fully implemented in Sprint 4.
 */
export default function SettingsPage() {
  return (
    <PageContainer
      title="Settings"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />
      }
    >
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconSettings size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Settings Page
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Settings management will be implemented in Sprint 4
          </Text>
        </Stack>
      </Center>
    </PageContainer>
  );
}
