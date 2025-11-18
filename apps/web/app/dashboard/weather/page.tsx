'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, Center } from '@mantine/core';
import { IconCloud } from '@tabler/icons-react';

/**
 * Weather Page - Placeholder
 *
 * This page will be fully implemented in Sprint 4.
 */
export default function WeatherPage() {
  return (
    <PageContainer
      title="Weather"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Weather' }]} />
      }
    >
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconCloud size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Weather Dashboard
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Weather monitoring and EPA CGP alerts will be implemented in Sprint 4
          </Text>
        </Stack>
      </Center>
    </PageContainer>
  );
}
