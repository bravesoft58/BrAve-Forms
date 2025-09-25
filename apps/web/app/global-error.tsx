'use client';

import { useEffect } from 'react';
import { Button, Container, Title, Text, Stack, Alert } from '@mantine/core';
import { IconExclamationCircle } from '@tabler/icons-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <Container size="sm" py="xl">
          <Stack align="center" gap="lg">
            <Alert 
              variant="light" 
              color="red" 
              title="Critical Error Occurred" 
              icon={<IconExclamationCircle size={16} />}
            >
              {process.env.NODE_ENV === 'development' ? (
                <Text size="sm" c="red">
                  {error.message}
                </Text>
              ) : (
                <Text size="sm">
                  A critical error occurred. Please refresh the page or contact support.
                </Text>
              )}
            </Alert>

            <Stack align="center" gap="sm">
              <Title order={1} ta="center">
                BrAve Forms
              </Title>
              <Text ta="center" c="dimmed">
                Critical application error - please restart the application.
              </Text>
              
              <Button onClick={() => reset()} size="lg" mt="md">
                Restart Application
              </Button>
            </Stack>
          </Stack>
        </Container>
      </body>
    </html>
  );
}