'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Loader, Text } from '@mantine/core';

/**
 * Settings Index Page
 *
 * Redirects to the profile page as the default settings view.
 * In the future, this could be a combined settings page.
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);

  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="md" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading settings...</Text>
      </Stack>
    </Container>
  );
}
