'use client';

import { useEffect } from 'react';
import { Button, Container, Title, Text, Stack, Alert } from '@mantine/core';
import { IconExclamationCircle } from '@tabler/icons-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg">
        <Alert 
          variant="light" 
          color="red" 
          title="Something went wrong!" 
          icon={<IconExclamationCircle size={16} />}
        >
          {process.env.NODE_ENV === 'development' ? (
            <Text size="sm" c="red">
              {error.message}
            </Text>
          ) : (
            <Text size="sm">
              We apologize for the inconvenience. Please try again or contact support if the problem persists.
            </Text>
          )}
        </Alert>

        <Stack align="center" gap="sm">
          <Title order={2} ta="center">
            BrAve Forms Error
          </Title>
          <Text ta="center" c="dimmed">
            An unexpected error occurred while loading the page.
          </Text>
          
          <Button onClick={() => reset()} size="md" mt="md">
            Try again
          </Button>
          
          <Button 
            variant="subtle" 
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}