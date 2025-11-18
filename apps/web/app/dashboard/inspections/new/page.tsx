'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, Center } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

/**
 * New Inspection Page - Placeholder
 *
 * This page will be fully implemented in Sprint 3 Phase 5.
 */
export default function NewInspectionPage() {
  return (
    <PageContainer
      title="New Inspection"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Inspections', href: '/dashboard/inspections' },
            { label: 'New' },
          ]}
        />
      }
    >
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconPlus size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            New Inspection
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Inspection form will be implemented in Sprint 3 Phase 5
          </Text>
        </Stack>
      </Center>
    </PageContainer>
  );
}
