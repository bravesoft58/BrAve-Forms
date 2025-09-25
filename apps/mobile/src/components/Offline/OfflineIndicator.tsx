import React from 'react';
import { Alert } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert
      icon={<IconWifiOff size={20} />}
      color="orange"
      style={{
        position: 'fixed',
        top: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        margin: '0 16px',
        borderRadius: '12px',
      }}
    >
      Working offline - Data will sync when connection returns
    </Alert>
  );
}