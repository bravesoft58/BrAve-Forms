'use client';

/**
 * RetryFailedSync Component
 *
 * Displays failed sync operations with retry functionality:
 * - Alert showing count of failed operations
 * - "Retry All Failed" button to retry all at once
 * - Individual retry buttons for each failed item
 * - Failure classification and reason display
 *
 * @security Multi-tenant isolation via useSyncQueue hook
 * @offline Works with cached data from Valtio store
 */

import { useState, useCallback } from 'react';
import {
  Alert,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  Collapse,
  ActionIcon,
  Tooltip,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconWifi,
  IconShieldX,
  IconServer,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  useSyncQueue,
  useSyncQueueActions,
  formatRelativeTime,
  getTypeLabel,
} from '@/hooks/useSyncQueue';
import { SyncQueueItem, MAX_RETRY_ATTEMPTS } from '@/lib/stores/sync-queue-store';

/**
 * Failure type classification
 */
export type FailureType = 'network' | 'validation' | 'auth' | 'server' | 'unknown';

/**
 * Classify failure type from error message
 *
 * @param errorMessage - The error message to classify
 * @returns FailureType classification
 */
export function classifyFailure(errorMessage: string | undefined): FailureType {
  if (!errorMessage) return 'unknown';

  const lowerMessage = errorMessage.toLowerCase();

  // Authentication/Authorization errors (check before validation due to 'invalid token')
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('auth')
  ) {
    return 'auth';
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('offline') ||
    lowerMessage.includes('connection')
  ) {
    return 'network';
  }

  // Validation errors (check after auth due to generic terms like 'invalid')
  if (
    lowerMessage.includes('validation') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('format')
  ) {
    return 'validation';
  }

  // Server errors
  if (
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('server error') ||
    lowerMessage.includes('internal error')
  ) {
    return 'server';
  }

  return 'unknown';
}

/**
 * Get icon for failure type
 */
function getFailureIcon(failureType: FailureType) {
  switch (failureType) {
    case 'network':
      return <IconWifi size={14} />;
    case 'auth':
      return <IconShieldX size={14} />;
    case 'server':
      return <IconServer size={14} />;
    case 'validation':
      return <IconAlertTriangle size={14} />;
    default:
      return <IconAlertCircle size={14} />;
  }
}

/**
 * Get label for failure type
 */
export function getFailureLabel(failureType: FailureType): string {
  switch (failureType) {
    case 'network':
      return 'Network Error';
    case 'auth':
      return 'Auth Error';
    case 'server':
      return 'Server Error';
    case 'validation':
      return 'Validation Error';
    default:
      return 'Unknown Error';
  }
}

/**
 * Get color for failure type
 */
function getFailureColor(failureType: FailureType): string {
  switch (failureType) {
    case 'network':
      return 'orange';
    case 'auth':
      return 'red';
    case 'server':
      return 'grape';
    case 'validation':
      return 'yellow';
    default:
      return 'gray';
  }
}

/**
 * Props for RetryFailedSync component
 */
interface RetryFailedSyncProps {
  /**
   * Show expanded list by default
   * @default false
   */
  defaultExpanded?: boolean;

  /**
   * Compact mode (less padding, smaller text)
   * @default false
   */
  compact?: boolean;

  /**
   * Hide component when no failures
   * @default true
   */
  hideWhenEmpty?: boolean;
}

/**
 * Failed item row component
 */
function FailedItemRow({
  item,
  onRetry,
  isRetrying,
  compact,
}: {
  item: SyncQueueItem;
  onRetry: (id: string) => void;
  isRetrying: boolean;
  compact?: boolean;
}) {
  const failureType = classifyFailure(item.lastError);
  const isMaxRetries = item.retries >= MAX_RETRY_ATTEMPTS;

  return (
    <Paper
      p={compact ? 'xs' : 'sm'}
      withBorder
      style={{ borderColor: 'var(--mantine-color-red-3)' }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          {/* Type and operation */}
          <Group gap="xs">
            <Badge size="xs" variant="light">
              {getTypeLabel(item.type)}
            </Badge>
            <Text size="xs" c="dimmed">
              {item.operation}
            </Text>
            <Text size="xs" c="dimmed">
              {formatRelativeTime(item.timestamp)}
            </Text>
          </Group>

          {/* Failure reason */}
          <Group gap="xs">
            <Badge
              size="xs"
              color={getFailureColor(failureType)}
              variant="light"
              leftSection={getFailureIcon(failureType)}
            >
              {getFailureLabel(failureType)}
            </Badge>
            {item.retries > 0 && (
              <Text size="xs" c="dimmed">
                Retries: {item.retries}/{MAX_RETRY_ATTEMPTS}
              </Text>
            )}
          </Group>

          {/* Error message */}
          {item.lastError && (
            <Text size="xs" c="red" lineClamp={2}>
              {item.lastError}
            </Text>
          )}
        </Stack>

        {/* Retry button */}
        <Tooltip
          label={
            isMaxRetries
              ? `Max retries (${MAX_RETRY_ATTEMPTS}) reached. Delete and re-create.`
              : 'Retry this item'
          }
        >
          <ActionIcon
            variant="light"
            color={isMaxRetries ? 'gray' : 'blue'}
            size={compact ? 'sm' : 'md'}
            onClick={() => onRetry(item.id)}
            disabled={isRetrying || isMaxRetries}
            loading={isRetrying}
            aria-label={`Retry ${item.type}`}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}

export function RetryFailedSync({
  defaultExpanded = false,
  compact = false,
  hideWhenEmpty = true,
}: RetryFailedSyncProps) {
  const { failedItems, failedCount, isLoading } = useSyncQueue();
  const { retryItem } = useSyncQueueActions();

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [retryingItems, setRetryingItems] = useState<Set<string>>(new Set());

  /**
   * Retry a single failed item
   */
  const handleRetryItem = useCallback(
    async (id: string) => {
      setRetryingItems((prev) => new Set(prev).add(id));
      try {
        await retryItem(id);
      } finally {
        setRetryingItems((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [retryItem]
  );

  /**
   * Retry all failed items
   */
  const handleRetryAll = useCallback(async () => {
    if (failedItems.length === 0) return;

    setIsRetryingAll(true);

    // Filter items that can be retried (haven't exceeded max attempts)
    const retryableItems = failedItems.filter((item) => item.retries < MAX_RETRY_ATTEMPTS);

    if (retryableItems.length === 0) {
      notifications.show({
        title: 'No Items to Retry',
        message: `All failed items have exceeded the maximum retry attempts (${MAX_RETRY_ATTEMPTS})`,
        color: 'orange',
        icon: <IconAlertCircle size={16} />,
      });
      setIsRetryingAll(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Retry each item
    for (const item of retryableItems) {
      try {
        await retryItem(item.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsRetryingAll(false);

    // Show notification
    if (failCount === 0) {
      notifications.show({
        title: 'Retry Complete',
        message: `${successCount} item(s) queued for retry`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } else {
      notifications.show({
        title: 'Retry Partially Complete',
        message: `${successCount} queued, ${failCount} failed to queue`,
        color: 'orange',
        icon: <IconAlertCircle size={16} />,
      });
    }
  }, [failedItems, retryItem]);

  // Hide when no failures (if hideWhenEmpty is true)
  if (hideWhenEmpty && failedCount === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Group gap="xs">
        <Loader size="xs" />
        <Text size="sm" c="dimmed">
          Loading...
        </Text>
      </Group>
    );
  }

  // Empty state (shown when hideWhenEmpty is false)
  if (failedCount === 0) {
    return (
      <Alert icon={<IconCheck size={16} />} color="green" title="No Failed Syncs">
        All sync operations completed successfully.
      </Alert>
    );
  }

  // Count retryable items (not at max retries)
  const retryableCount = failedItems.filter((item) => item.retries < MAX_RETRY_ATTEMPTS).length;

  return (
    <Stack gap={compact ? 'xs' : 'sm'}>
      {/* Alert with failure count */}
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Failed Sync Operations"
        color="red"
        variant="light"
      >
        <Stack gap="xs">
          <Text size="sm">
            {failedCount} operation{failedCount !== 1 ? 's' : ''} failed to sync.
            {retryableCount < failedCount && (
              <Text span c="dimmed" size="sm">
                {' '}
                ({failedCount - retryableCount} at max retries)
              </Text>
            )}
          </Text>

          <Group gap="xs">
            {/* Retry All Failed button */}
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleRetryAll}
              loading={isRetryingAll}
              disabled={retryableCount === 0}
              color="red"
              size={compact ? 'xs' : 'sm'}
            >
              Retry All Failed ({retryableCount})
            </Button>

            {/* Expand/Collapse button */}
            <Button
              variant="subtle"
              color="gray"
              size={compact ? 'xs' : 'sm'}
              onClick={() => setExpanded(!expanded)}
              rightSection={expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </Group>
        </Stack>
      </Alert>

      {/* Expandable list of failed items */}
      <Collapse in={expanded}>
        <Stack gap="xs">
          {failedItems.map((item) => (
            <FailedItemRow
              key={item.id}
              item={item}
              onRetry={handleRetryItem}
              isRetrying={retryingItems.has(item.id)}
              compact={compact}
            />
          ))}
        </Stack>
      </Collapse>
    </Stack>
  );
}
