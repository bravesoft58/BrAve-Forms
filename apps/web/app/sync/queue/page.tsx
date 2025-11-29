'use client';

/**
 * Sync Queue Page
 *
 * Displays all pending sync operations with management capabilities:
 * - Queue table with priority sorting
 * - Retry/delete individual items
 * - Clear all functionality
 * - Queue statistics summary
 *
 * @security Multi-tenant isolation via orgId filtering
 * @offline Works with cached data from IndexedDB
 */

import { PageContainer } from '@/components/Layout/PageContainer';
import {
  Stack,
  Card,
  Text,
  Group,
  Button,
  SimpleGrid,
  Alert,
  Badge,
} from '@mantine/core';
import {
  IconRefresh,
  IconTrash,
  IconClock,
  IconAlertCircle,
  IconDatabase,
  IconCloudUpload,
} from '@tabler/icons-react';
import { SyncQueueTable } from '@/components/Sync';
import { useSyncQueue, useSyncQueueActions } from '@/hooks/useSyncQueue';
import { formatBytes } from '@/lib/api/sync';
import { useState } from 'react';

export default function SyncQueuePage() {
  const {
    totalCount,
    pendingCount,
    failedCount,
    syncingCount,
    totalSize,
    isLoading,
  } = useSyncQueue();
  const { clearQueue } = useSyncQueueActions();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all queued operations? This cannot be undone.'
      )
    ) {
      setIsClearing(true);
      await clearQueue();
      setIsClearing(false);
    }
  };

  return (
    <PageContainer
      title="Sync Queue"
      actions={
        <Group gap="sm">
          <Button
            variant="light"
            color="red"
            size="sm"
            leftSection={<IconTrash size={16} />}
            onClick={handleClearAll}
            loading={isClearing}
            disabled={totalCount === 0}
          >
            Clear All
          </Button>
        </Group>
      }
    >
      <Stack gap="lg">
        {/* Statistics Summary */}
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="md">
              <IconCloudUpload size={24} stroke={1.5} />
              <div>
                <Text size="sm" c="dimmed">
                  Total Queued
                </Text>
                <Text size="xl" fw={700}>
                  {totalCount}
                </Text>
              </div>
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="md">
              <IconClock size={24} stroke={1.5} />
              <div>
                <Text size="sm" c="dimmed">
                  Pending
                </Text>
                <Text size="xl" fw={700} c={pendingCount > 0 ? 'blue' : undefined}>
                  {pendingCount}
                </Text>
              </div>
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="md">
              <IconAlertCircle size={24} stroke={1.5} />
              <div>
                <Text size="sm" c="dimmed">
                  Failed
                </Text>
                <Text size="xl" fw={700} c={failedCount > 0 ? 'red' : undefined}>
                  {failedCount}
                </Text>
              </div>
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="md">
              <IconDatabase size={24} stroke={1.5} />
              <div>
                <Text size="sm" c="dimmed">
                  Total Size
                </Text>
                <Text size="xl" fw={700}>
                  {formatBytes(totalSize)}
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Syncing indicator */}
        {syncingCount > 0 && (
          <Alert
            icon={<IconRefresh size={16} />}
            title="Sync in Progress"
            color="blue"
            variant="light"
          >
            {syncingCount} operation{syncingCount > 1 ? 's' : ''} currently syncing...
          </Alert>
        )}

        {/* Failed items warning */}
        {failedCount > 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Failed Operations"
            color="red"
            variant="light"
          >
            {failedCount} operation{failedCount > 1 ? 's' : ''} failed to sync. Review and
            retry or delete them below.
          </Alert>
        )}

        {/* Queue Table */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="md">
                <Text size="lg" fw={500}>
                  Queued Operations
                </Text>
                <Badge variant="light" size="lg">
                  {totalCount} items
                </Badge>
              </Group>
            </Group>

            <SyncQueueTable />
          </Stack>
        </Card>

        {/* Priority explanation */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Priority Levels
            </Text>
            <Group gap="md">
              <Group gap="xs">
                <Badge color="red" size="sm">
                  8-10
                </Badge>
                <Text size="xs" c="dimmed">
                  Compliance (SWPPP, Weather)
                </Text>
              </Group>
              <Group gap="xs">
                <Badge color="yellow" size="sm">
                  5-7
                </Badge>
                <Text size="xs" c="dimmed">
                  Forms &amp; Photos
                </Text>
              </Group>
              <Group gap="xs">
                <Badge color="blue" size="sm">
                  1-4
                </Badge>
                <Text size="xs" c="dimmed">
                  Other Updates
                </Text>
              </Group>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </PageContainer>
  );
}
