'use client';

// Note: Route segment config (dynamic, revalidate, etc.) cannot be used in Client Components
// Dynamic rendering is handled by client-side hooks and state

import { PageContainer } from '@/components/Layout/PageContainer';
import { SimpleGrid, Stack } from '@mantine/core';
import { QuickActions } from '@/components/Dashboard/QuickActions';
import { WeatherAlertsWidget } from '@/components/Dashboard/WeatherAlertsWidget';
import { PendingTasksList } from '@/components/Dashboard/PendingTasksList';
import { RecentActivityList } from '@/components/Dashboard/RecentActivityList';
import { useAppAuth } from '@/app/providers';

/**
 * Dashboard Home Page - Sprint 3 ISSUE-084
 *
 * Simple home dashboard with quick actions and key widgets:
 * - Quick Actions (existing component)
 * - Pending Tasks (inspections due today)
 * - Weather Alerts (0.25" rain threshold monitoring)
 * - Recent Activity (last 5 form submissions)
 *
 * Uses aggressive compact design with explicit pixel font sizes
 * NO Route Segment Config exports (this is a Client Component)
 */
export default function DashboardPage() {
  const { firstName } = useAppAuth();

  return (
    <PageContainer title={`Welcome, ${firstName || 'User'}`}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack gap="md">
          <QuickActions />
          <PendingTasksList />
          <WeatherAlertsWidget />
        </Stack>
        <Stack gap="md">
          <RecentActivityList limit={5} />
        </Stack>
      </SimpleGrid>
    </PageContainer>
  );
}
