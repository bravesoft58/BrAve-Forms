import { Suspense } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';

// Opt this route segment into dynamic rendering
// This prevents Next.js from trying to pre-render pages with Clerk useAuth()
export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardSkeleton() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text size="sm" c="dimmed">Loading dashboard...</Text>
      </Stack>
    </Center>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {children}
    </Suspense>
  );
}
