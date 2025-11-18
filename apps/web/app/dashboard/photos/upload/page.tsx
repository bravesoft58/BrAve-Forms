'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, Center } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';

/**
 * Upload Photos Page - Placeholder
 *
 * This page will be fully implemented in Sprint 5.
 */
export default function UploadPhotosPage() {
  return (
    <PageContainer
      title="Upload Photos"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Photos', href: '/dashboard/photos' },
            { label: 'Upload' },
          ]}
        />
      }
    >
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconCamera size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            Upload Photos
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            Photo upload functionality will be implemented in Sprint 5
          </Text>
        </Stack>
      </Center>
    </PageContainer>
  );
}
