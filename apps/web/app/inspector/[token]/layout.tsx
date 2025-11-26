import { Suspense } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';

// Force dynamic rendering - this is a public route
export const dynamic = 'force-dynamic';

// Metadata for inspector portal
export const metadata = {
  title: 'Inspector Portal | BrAve Forms',
  description: 'View project compliance data and inspection records',
};

interface InspectorLayoutProps {
  children: React.ReactNode;
}

function InspectorLoadingSkeleton() {
  return (
    <Center h="100vh" bg="gray.1">
      <Stack align="center" gap="md">
        <Loader size="lg" color="blue" />
        <Text size="md" fw={500} c="dark.7">
          Loading Inspector Portal...
        </Text>
        <Text size="sm" c="dimmed">
          Verifying access token
        </Text>
      </Stack>
    </Center>
  );
}

export default function InspectorLayout({ children }: InspectorLayoutProps) {
  return (
    <Suspense fallback={<InspectorLoadingSkeleton />}>
      <div className="inspector-portal-wrapper">{children}</div>
    </Suspense>
  );
}
