'use client';

import { Container, Title, Text, Stack, Button, Group } from '@mantine/core';
import { IconHome2, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg">
        <div style={{ fontSize: '6rem', opacity: 0.3 }}>
          🏗️
        </div>
        
        <Stack align="center" gap="sm">
          <Title order={1} ta="center">
            Page Not Found
          </Title>
          <Title order={2} c="dimmed" fw={400} ta="center">
            404
          </Title>
          <Text ta="center" c="dimmed" size="lg">
            The page you're looking for doesn't exist or may have been moved.
          </Text>
        </Stack>

        <Group gap="md">
          <Button 
            component={Link} 
            href="/" 
            leftSection={<IconHome2 size={16} />}
            size="md"
          >
            Go Home
          </Button>
          <Button 
            variant="subtle"
            onClick={() => window.history.back()}
            leftSection={<IconArrowLeft size={16} />}
            size="md"
          >
            Go Back
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}