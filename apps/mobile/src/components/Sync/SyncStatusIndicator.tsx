import React from 'react';
import { Badge } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

export function SyncStatusIndicator() {
  const { queueSize, isProcessing } = useOfflineQueue();

  if (queueSize === 0 && !isProcessing) {
    return null;
  }

  return (
    <Badge
      color={isProcessing ? 'blue' : 'orange'}
      variant="filled"
      leftSection={isProcessing ? <IconRefresh size={12} /> : undefined}
      style={{
        position: 'fixed',
        bottom: 100,
        right: 16,
        zIndex: 1000,
        animation: isProcessing ? 'spin 1s linear infinite' : undefined,
      }}
    >
      {isProcessing ? 'Syncing...' : `${queueSize} pending`}
    </Badge>
  );
}