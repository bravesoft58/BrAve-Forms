'use client';

/**
 * SyncQueueTable Component
 *
 * Displays pending sync operations in a table format with:
 * - Type, timestamp, size, priority, status columns
 * - Retry and delete action buttons
 * - Priority-sorted display (compliance items first)
 * - Empty, loading, and error states
 *
 * @security Multi-tenant isolation handled by useSyncQueue hook
 * @offline Works with cached data from Valtio store
 */

import { useState } from 'react';
import {
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Stack,
  Loader,
  Alert,
  Tooltip,
  Box,
  Modal,
  Button,
} from '@mantine/core';
import {
  IconRefresh,
  IconTrash,
  IconClock,
  IconAlertCircle,
  IconCloudOff,
} from '@tabler/icons-react';
import {
  useSyncQueue,
  useSyncQueueActions,
  formatRelativeTime,
  getStatusColor,
  getTypeLabel,
} from '@/hooks/useSyncQueue';
import { formatBytes } from '@/lib/api/sync';
import { SyncQueueItem } from '@/lib/stores/sync-queue-store';

/**
 * Get priority badge color
 */
function getPriorityColor(priority: number): string {
  if (priority >= 8) return 'red';
  if (priority >= 5) return 'yellow';
  return 'blue';
}

/**
 * Props for SyncQueueTable
 */
interface SyncQueueTableProps {
  /** Show compact version for dashboard widget */
  compact?: boolean;
  /** Maximum items to show (for compact mode) */
  maxItems?: number;
}

export function SyncQueueTable({ compact = false, maxItems }: SyncQueueTableProps) {
  const { sortedQueue, isLoading, error, totalCount } = useSyncQueue();
  const { retryItem, deleteItem } = useSyncQueueActions();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Limit items in compact mode
  const displayItems = maxItems ? sortedQueue.slice(0, maxItems) : sortedQueue;

  // Loading state
  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          Loading queue...
        </Text>
      </Group>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
        {error}
      </Alert>
    );
  }

  // Empty state
  if (sortedQueue.length === 0) {
    return (
      <Stack align="center" py="xl" gap="md">
        <IconCloudOff size={48} stroke={1.5} color="gray" />
        <Text size="sm" c="dimmed">
          No pending sync operations
        </Text>
        <Text size="xs" c="dimmed">
          Operations will appear here when you work offline
        </Text>
      </Stack>
    );
  }

  const handleRetry = async (id: string) => {
    await retryItem(id);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteItem(itemToDelete);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <Box>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Type</Table.Th>
            <Table.Th visibleFrom={compact ? undefined : 'sm'}>Operation</Table.Th>
            <Table.Th>Time</Table.Th>
            <Table.Th visibleFrom={compact ? undefined : 'md'}>Size</Table.Th>
            <Table.Th>Priority</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {displayItems.map((item: SyncQueueItem) => (
            <Table.Tr key={item.id}>
              {/* Type */}
              <Table.Td>
                <Badge variant="light" size={compact ? 'xs' : 'sm'}>
                  {getTypeLabel(item.type)}
                </Badge>
              </Table.Td>

              {/* Operation (hidden on mobile, shown on sm+ screens unless compact) */}
              <Table.Td visibleFrom={compact ? undefined : 'sm'}>
                <Text size="sm" c="dimmed">
                  {item.operation}
                </Text>
              </Table.Td>

              {/* Timestamp */}
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <IconClock size={14} stroke={1.5} />
                  <Text size="sm">{formatRelativeTime(item.timestamp)}</Text>
                </Group>
              </Table.Td>

              {/* Size (hidden on mobile, shown on md+ screens unless compact) */}
              <Table.Td visibleFrom={compact ? undefined : 'md'}>
                <Text size="sm">{formatBytes(item.size)}</Text>
              </Table.Td>

              {/* Priority */}
              <Table.Td>
                <Tooltip
                  label={
                    item.priority >= 8
                      ? 'High priority (compliance)'
                      : item.priority >= 5
                        ? 'Normal priority'
                        : 'Low priority'
                  }
                >
                  <Badge
                    color={getPriorityColor(item.priority)}
                    variant="filled"
                    size={compact ? 'xs' : 'sm'}
                  >
                    {item.priority}
                  </Badge>
                </Tooltip>
              </Table.Td>

              {/* Status */}
              <Table.Td>
                <Tooltip
                  label={item.lastError || `Status: ${item.status}`}
                  disabled={!item.lastError}
                >
                  <Badge
                    color={getStatusColor(item.status)}
                    variant="light"
                    size={compact ? 'xs' : 'sm'}
                  >
                    {item.status}
                    {item.retries > 0 && ` (${item.retries})`}
                  </Badge>
                </Tooltip>
              </Table.Td>

              {/* Actions */}
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Tooltip label="Retry sync">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size={compact ? 'sm' : 'md'}
                      onClick={() => handleRetry(item.id)}
                      disabled={item.status === 'syncing'}
                      aria-label="Retry"
                    >
                      <IconRefresh size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete from queue">
                    <ActionIcon
                      variant="light"
                      color="red"
                      size={compact ? 'sm' : 'md'}
                      onClick={() => handleDeleteClick(item.id)}
                      disabled={item.status === 'syncing'}
                      aria-label="Delete"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Show more indicator for compact mode */}
      {maxItems && totalCount > maxItems && (
        <Text size="xs" c="dimmed" ta="center" mt="sm">
          Showing {maxItems} of {totalCount} items
        </Text>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Delete Queued Operation"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this queued operation? This action cannot be undone
            and any unsaved data will be lost.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={isDeleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
