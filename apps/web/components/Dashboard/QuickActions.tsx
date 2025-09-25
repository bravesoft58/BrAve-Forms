'use client';

import { Stack, Button, Group } from '@mantine/core';
import { 
  IconPlus, 
  IconClipboard, 
  IconCamera, 
  IconMapPin,
  IconCloud,
  IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAppStore, useAppActions } from '@/lib/store/app.store';

export function QuickActions() {
  const appState = useAppStore();
  const { triggerSync } = useAppActions();

  const handleSyncClick = () => {
    if (appState.networkStatus === 'online') {
      triggerSync();
    }
  };

  return (
    <Stack gap="sm">
      {/* Primary Actions */}
      <Button
        leftSection={<IconPlus size={18} />}
        variant="filled"
        size="md"
        fullWidth
        component={Link}
        href="/inspections/new"
        className="construction-button"
      >
        New Inspection
      </Button>
      
      <Button
        leftSection={<IconCamera size={18} />}
        variant="light"
        size="md"
        fullWidth
        component={Link}
        href="/photos/upload"
        className="construction-button"
      >
        Upload Photos
      </Button>

      {/* Secondary Actions */}
      <Group grow>
        <Button
          leftSection={<IconClipboard size={16} />}
          variant="subtle"
          size="sm"
          component={Link}
          href="/forms"
        >
          Forms
        </Button>
        
        <Button
          leftSection={<IconMapPin size={16} />}
          variant="subtle"
          size="sm"
          component={Link}
          href="/projects"
        >
          Projects
        </Button>
      </Group>

      {/* Weather and Sync Actions */}
      <Group grow>
        <Button
          leftSection={<IconCloud size={16} />}
          variant="subtle"
          size="sm"
          component={Link}
          href="/weather"
        >
          Weather
        </Button>
        
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="subtle"
          size="sm"
          onClick={handleSyncClick}
          disabled={appState.networkStatus === 'offline' || appState.syncStatus === 'syncing'}
          loading={appState.syncStatus === 'syncing'}
        >
          {appState.offlineQueue.length > 0 
            ? `Sync (${appState.offlineQueue.length})` 
            : 'Sync'
          }
        </Button>
      </Group>

      {/* Offline Status */}
      {appState.networkStatus === 'offline' && (
        <Button
          variant="light"
          color="orange"
          size="sm"
          fullWidth
          disabled
        >
          Working Offline - {appState.offlineQueue.length} items queued
        </Button>
      )}
    </Stack>
  );
}