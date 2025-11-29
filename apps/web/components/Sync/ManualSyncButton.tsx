'use client';

/**
 * ManualSyncButton Component
 *
 * Provides manual sync trigger for field workers to synchronize data
 * when they regain connectivity. Includes:
 * - "Sync Now" button with pending count badge
 * - Progress modal showing sync progress
 * - Cancel sync functionality
 * - Success/error notifications
 *
 * @security Multi-tenant isolation via orgId filtering
 * @offline Only enabled when online
 */

import { useState, useCallback, useRef } from 'react';
import { Button, Modal, Progress, Text, Stack, Alert, Group, Badge, rem } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconX, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import {
  syncQueueStore,
  updateItemStatus,
  removeFromQueue,
  getQueueByPriority,
  SyncQueueItem,
} from '@/lib/stores/sync-queue-store';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { useAppAuth } from '@/app/providers';

/**
 * Sync progress state
 */
interface SyncProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem?: SyncQueueItem;
}

/**
 * Sync error state
 */
interface SyncError {
  message: string;
  itemId?: string;
  itemType?: string;
}

interface ManualSyncButtonProps {
  /**
   * Variant of the button
   * @default "light"
   */
  variant?: 'filled' | 'light' | 'outline' | 'subtle';

  /**
   * Size of the button
   * @default "sm"
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'compact-xs' | 'compact-sm' | 'compact-md';

  /**
   * Show pending count badge
   * @default true
   */
  showBadge?: boolean;
}

/**
 * Mock sync function for a single item
 * In production, this would call actual API endpoints
 */
async function syncItem(item: SyncQueueItem): Promise<void> {
  // Simulate network delay (200-500ms per item)
  const delay = 200 + Math.random() * 300;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate occasional failures (5% failure rate for testing)
  // In production, this would be actual API calls
  if (Math.random() < 0.05) {
    throw new Error(`Failed to sync ${item.type}: Network error`);
  }
}

export function ManualSyncButton({
  variant = 'light',
  size = 'sm',
  showBadge = true,
}: ManualSyncButtonProps) {
  const isOnline = useOnlineStatus();
  const { orgId } = useAppAuth();
  const snap = useSnapshot(syncQueueStore);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<SyncError | null>(null);

  // Ref to track if sync was cancelled
  const cancelledRef = useRef(false);

  // Get pending items for current organization
  const currentOrgId = orgId || 'default';
  const pendingItems = snap.queue.filter(
    (item: SyncQueueItem) => item.orgId === currentOrgId && item.status === 'pending'
  );
  const pendingCount = pendingItems.length;

  /**
   * Process sync queue items sequentially
   */
  const processSyncQueue = useCallback(async () => {
    cancelledRef.current = false;
    setIsSyncing(true);
    setError(null);

    // Get items sorted by priority (highest first)
    const queue = getQueueByPriority().filter(
      (item) => item.orgId === currentOrgId && item.status === 'pending'
    );

    if (queue.length === 0) {
      setIsSyncing(false);
      notifications.show({
        title: 'No Items to Sync',
        message: 'All items are already synchronized',
        color: 'blue',
        icon: <IconCheck size={16} />,
      });
      setIsModalOpen(false);
      return;
    }

    setProgress({ current: 0, total: queue.length, percentage: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < queue.length; i++) {
      // Check if cancelled
      if (cancelledRef.current) {
        break;
      }

      const item = queue[i];

      // Update progress
      setProgress({
        current: i,
        total: queue.length,
        percentage: Math.round((i / queue.length) * 100),
        currentItem: item,
      });

      // Mark item as syncing
      await updateItemStatus(item.id, 'syncing');

      try {
        // Attempt to sync the item
        await syncItem(item);

        // Success - remove from queue
        await removeFromQueue(item.id);
        successCount++;
      } catch (syncError) {
        // Failed - mark as failed with error message
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';
        await updateItemStatus(item.id, 'failed', errorMessage);
        failCount++;

        // Set error state but continue with other items
        setError({
          message: errorMessage,
          itemId: item.id,
          itemType: item.type,
        });
      }
    }

    // Final progress update
    setProgress({
      current: queue.length,
      total: queue.length,
      percentage: 100,
    });

    setIsSyncing(false);

    // Show completion notification
    if (cancelledRef.current) {
      notifications.show({
        title: 'Sync Cancelled',
        message: `Synced ${successCount} items before cancellation`,
        color: 'yellow',
        icon: <IconX size={16} />,
      });
    } else if (failCount > 0) {
      notifications.show({
        title: 'Sync Completed with Errors',
        message: `${successCount} items synced, ${failCount} failed`,
        color: 'orange',
        icon: <IconAlertCircle size={16} />,
      });
    } else {
      notifications.show({
        title: 'Sync Complete',
        message: `Successfully synced ${successCount} items`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setIsModalOpen(false);
    }
  }, [currentOrgId]);

  /**
   * Handle sync button click
   */
  const handleSyncClick = () => {
    setIsModalOpen(true);
    setError(null);
    processSyncQueue();
  };

  /**
   * Handle cancel sync
   */
  const handleCancelSync = () => {
    cancelledRef.current = true;
    setIsSyncing(false);
  };

  /**
   * Handle retry sync
   */
  const handleRetry = () => {
    setError(null);
    processSyncQueue();
  };

  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    if (!isSyncing) {
      setIsModalOpen(false);
      setError(null);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        leftSection={<IconRefresh size={16} />}
        onClick={handleSyncClick}
        disabled={!isOnline || pendingCount === 0}
        loading={isSyncing}
        rightSection={
          showBadge && pendingCount > 0 ? (
            <Badge size="xs" color="blue" variant="filled" circle>
              {pendingCount}
            </Badge>
          ) : undefined
        }
        styles={{
          root: {
            minWidth: rem(80),
          },
        }}
      >
        Sync Now
      </Button>

      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        title="Syncing Data"
        closeOnClickOutside={!isSyncing}
        closeOnEscape={!isSyncing}
        withCloseButton={!isSyncing}
        centered
      >
        <Stack gap="md">
          {/* Progress bar */}
          <Progress
            value={progress.percentage}
            size="lg"
            radius="md"
            animated={isSyncing}
            color={error ? 'orange' : 'blue'}
          />

          {/* Progress text */}
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {isSyncing && progress.currentItem
                ? `Syncing ${progress.currentItem.type}...`
                : progress.percentage === 100
                  ? 'Sync complete'
                  : 'Preparing...'}
            </Text>
            <Text size="sm" fw={500}>
              {progress.percentage}%
            </Text>
          </Group>

          <Text size="xs" c="dimmed" ta="center">
            {progress.current} of {progress.total} items
          </Text>

          {/* Cancel button during sync */}
          {isSyncing && (
            <Button
              leftSection={<IconX size={16} />}
              onClick={handleCancelSync}
              variant="subtle"
              color="red"
              fullWidth
            >
              Cancel Sync
            </Button>
          )}

          {/* Error alert with retry */}
          {error && !isSyncing && (
            <Alert icon={<IconAlertCircle size={16} />} title="Sync Error" color="red">
              <Stack gap="xs">
                <Text size="sm">{error.message}</Text>
                {error.itemType && (
                  <Text size="xs" c="dimmed">
                    Failed item: {error.itemType}
                  </Text>
                )}
                <Group gap="xs" mt="xs">
                  <Button size="xs" onClick={handleRetry}>
                    Retry
                  </Button>
                  <Button size="xs" variant="subtle" onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                </Group>
              </Stack>
            </Alert>
          )}

          {/* Success state */}
          {!isSyncing && !error && progress.percentage === 100 && (
            <Alert icon={<IconCheck size={16} />} title="Sync Complete" color="green">
              All items have been synchronized successfully.
            </Alert>
          )}
        </Stack>
      </Modal>
    </>
  );
}
