'use client';

import { Alert, Button, Group, Text, rem } from '@mantine/core';
import { IconWifiOff, IconRefresh } from '@tabler/icons-react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { usePendingSyncCount } from '@/lib/hooks/use-pending-sync-count';

/**
 * OfflineBanner Component
 *
 * Displays non-intrusive banner at top of page when user is offline.
 * Shows:
 * - "You are offline" message
 * - Pending sync count (X items waiting)
 * - Manual sync button (disabled when offline)
 *
 * Auto-hides when connection restored.
 *
 * Design: Compact sizing (11-12px text, 12px icons) following ISSUE-078 standards
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const pendingCount = usePendingSyncCount();

  // Hide banner when online
  if (isOnline) return null;

  return (
    <Alert
      icon={<IconWifiOff size={12} />}
      color="yellow"
      withCloseButton={false}
      styles={{
        root: {
          marginBottom: rem(12),
          padding: rem(8),
        },
        icon: {
          marginRight: rem(8),
        },
        title: {
          fontSize: rem(12),
          fontWeight: 600,
          lineHeight: 1.3,
        },
        message: {
          fontSize: rem(11),
          lineHeight: 1.4,
        },
      }}
      title="You are offline"
    >
      <Group justify="space-between" gap="xs">
        <Text style={{ fontSize: rem(11), lineHeight: 1.4 }}>
          {pendingCount > 0
            ? `${pendingCount} items waiting to sync`
            : 'Working offline - changes will sync when connected'}
        </Text>
        <Button
          size="compact-xs"
          variant="light"
          color="yellow"
          leftSection={<IconRefresh size={12} />}
          disabled
          styles={{
            root: {
              fontSize: rem(11),
              height: rem(24),
              padding: `0 ${rem(8)}`,
            },
          }}
        >
          Sync When Online
        </Button>
      </Group>
    </Alert>
  );
}
