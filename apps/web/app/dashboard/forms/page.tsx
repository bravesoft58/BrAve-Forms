'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, Center } from '@mantine/core';
import { IconFiles } from '@tabler/icons-react';

/**
 * Forms Page - Placeholder
 *
 * This page will be fully implemented in Sprint 3 Phase 4-5.
 */
export default function FormsPage() {
  return (
    <PageContainer
      title="Forms"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms' }]} />
      }
    >
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconFiles size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Forms Page
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Forms management will be implemented in Sprint 3 Phase 4-5
          </Text>
        </Stack>
      </Center>
    </PageContainer>
  );
}
