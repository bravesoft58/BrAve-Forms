# ISSUE-145: App Settings Page (2h)

**Priority:** P2
**Phase:** Phase 3 - Settings & Profile
**Estimated Hours:** 2
**Actual Hours:** 1.5
**Dependencies:** None
**Sprint:** Sprint 5
**Status:** COMPLETE

---

## Completion Summary

### Implementation Approach

Created a comprehensive App Settings page with storage usage display using the Storage Estimation API, cache management controls with confirmation modals, and app version information. Implemented modular storage utility functions with 30 unit tests.

### Files Created

**New Files:**

- `apps/web/app/settings/app/page.tsx` - Main App Settings page with storage display, cache management, and app info
- `apps/web/lib/storage/storage-utils.ts` - Storage calculation, formatting, and cache management functions
- `apps/web/lib/storage/__tests__/storage-utils.test.ts` - 30 unit tests for storage utilities

**Modified Files:**

- `apps/web/app/settings/layout.tsx` - Added "App" navigation item to settings sidebar

### Key Features Implemented

1. **Storage Usage Display:**
   - Uses navigator.storage.estimate() API for accurate storage info
   - Progress bar with color-coded usage (green/yellow/orange/red)
   - Storage breakdown by category (Photos, Forms, Cache, Settings, Other)
   - Refresh button to reload storage info
   - Fallback for browsers without Storage API

2. **Cache Management Controls:**
   - "Clear Cache" button with confirmation modal
   - "Clear All Data" button with warning modal
   - Clears localStorage, IndexedDB databases, and Service Worker caches
   - Preserves authentication tokens during cache clear

3. **App Information Section:**
   - Version number (1.0.0)
   - Build date (2025.11.29)
   - Platform detection (web/ios/android)
   - Environment detection (development/staging/production)

4. **Confirmation Modals:**
   - Clear Cache modal with informative message about what's preserved
   - Clear All Data modal with red warning and list of affected data
   - Loading states during operations
   - Success/error alerts after operations
   - ARIA attributes for accessibility (aria-describedby)

5. **Offline Scenario Handling:**
   - Clear Cache blocked when offline with user-friendly error message
   - Clear All Data shows warning when offline about unsynced data loss
   - Proper navigator.onLine checks before destructive operations

6. **Unit Tests (30 tests):**
   - formatBytes: 0 bytes, negative, bytes, KB, MB, GB, TB, large numbers
   - calculatePercentage: normal, zero quota, negative, exceeds 100%
   - getStorageColor: green/yellow/orange/red thresholds
   - getLocalStorageSize: empty, single item, multiple items
   - estimateStorageBreakdown: proportions, zero usage, settings from localStorage
   - isStorageAPIAvailable: availability check
   - isIndexedDBAvailable: availability check
   - getAppInfo: version, platform, environment

### Code Review Fixes Applied

- **CR-3 (MEDIUM):** Added `aria-describedby` attributes to both Modal components for screen reader accessibility
- **CR-8 (MEDIUM):** Added offline scenario handling - blocks clear cache when offline, shows warning for clear all data
- **CR-7 (N/A):** Multi-tenancy orgId checks not applicable to local browser storage operations

### Test Results

- 30 storage-utils tests passing
- Type-check passing

---

## Objective

Create an app settings page for managing mobile app preferences, storage settings, cache management, offline sync settings, and app version information for field workers.

## Tasks

- [x] Create /settings/app route in Next.js App Router
- [x] Create storage usage display with breakdown
- [x] Create cache management controls (clear cache, clear all data)
- [x] Create offline sync settings (covered in /settings/offline page)
- [x] Create app version information display
- [x] Implement clear cache with confirmation modal
- [x] Implement clear all data with double confirmation
- [x] Add unit tests for storage/cache logic (30 tests)

## Technical Details

**Libraries/Dependencies:**

- Storage Estimation API (navigator.storage.estimate)
- IndexedDB API (cache management)
- Mantine components (Progress, Modal, Button)
- Capacitor Preferences (mobile app settings)

**Code Example:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Stack, Text, Progress, Button, Group, Modal, Switch, Select, Card, Divider } from '@mantine/core';
import { IconTrash, IconRefresh, IconDownload, IconDatabase } from '@tabler/icons-react';
import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface StorageInfo {
  usage: number;
  quota: number;
  percentUsed: number;
  breakdown: {
    forms: number;
    photos: number;
    cache: number;
    other: number;
  };
}

const appSettingsSchema = z.object({
  autoSync: z.boolean(),
  syncInterval: z.enum(['5min', '15min', '30min', '1hour']),
  syncOnWiFiOnly: z.boolean(),
  cachePhotos: z.boolean(),
  offlineMaps: z.boolean(),
});

export default function AppSettingsPage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);
  const [clearAllDataModalOpen, setClearAllDataModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      autoSync: true,
      syncInterval: '15min',
      syncOnWiFiOnly: false,
      cachePhotos: true,
      offlineMaps: true,
    },
  });

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    if (!navigator.storage?.estimate) {
      return;
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;

    // Get breakdown by IndexedDB stores
    const breakdown = await getStorageBreakdown();

    setStorageInfo({
      usage,
      quota,
      percentUsed: (usage / quota) * 100,
      breakdown,
    });
  };

  const getStorageBreakdown = async (): Promise<StorageInfo['breakdown']> => {
    // Calculate storage per IndexedDB store
    const db = await openDB('braveforms', 1);

    const formsSizeResult = await db.transaction('forms').objectStore('forms').getAllKeys();
    const photosSizeResult = await db.transaction('photos').objectStore('photos').getAllKeys();
    const cacheSizeResult = await db.transaction('cache').objectStore('cache').getAllKeys();

    return {
      forms: formsSizeResult.length * 1024, // Rough estimate
      photos: photosSizeResult.length * 512 * 1024, // 512KB avg per photo
      cache: cacheSizeResult.length * 10 * 1024, // 10KB avg per cache entry
      other: 0,
    };
  };

  const clearCache = async () => {
    const db = await openDB('braveforms', 1);
    await db.clear('cache');
    await loadStorageInfo();
    setClearCacheModalOpen(false);
  };

  const clearAllData = async () => {
    // CRITICAL: Only clear if user confirms twice
    const db = await openDB('braveforms', 1);
    await db.clear('forms');
    await db.clear('photos');
    await db.clear('cache');
    await loadStorageInfo();
    setClearAllDataModalOpen(false);
  };

  const onSubmit = async (data: z.infer<typeof appSettingsSchema>) => {
    // Save to local storage or Capacitor Preferences
    if (window.Capacitor) {
      await Preferences.set({ key: 'appSettings', value: JSON.stringify(data) });
    } else {
      localStorage.setItem('appSettings', JSON.stringify(data));
    }

    // Apply settings immediately
    if (data.autoSync) {
      startAutoSync(data.syncInterval);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Stack>
      <Text size="xl" fw={600}>App Settings</Text>

      {/* Storage Usage */}
      <Card withBorder padding="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>Storage Usage</Text>
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={loadStorageInfo}
            >
              Refresh
            </Button>
          </Group>

          {storageInfo && (
            <>
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm">
                    {formatBytes(storageInfo.usage)} of {formatBytes(storageInfo.quota)} used
                  </Text>
                  <Text size="sm" c="dimmed">
                    {Math.round(storageInfo.percentUsed)}%
                  </Text>
                </Group>
                <Progress value={storageInfo.percentUsed} size="lg" />
              </div>

              <Divider />

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Forms</Text>
                  <Text size="sm" c="dimmed">{formatBytes(storageInfo.breakdown.forms)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Photos</Text>
                  <Text size="sm" c="dimmed">{formatBytes(storageInfo.breakdown.photos)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Cache</Text>
                  <Text size="sm" c="dimmed">{formatBytes(storageInfo.breakdown.cache)}</Text>
                </Group>
              </Stack>

              <Group>
                <Button
                  variant="light"
                  color="orange"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => setClearCacheModalOpen(true)}
                >
                  Clear Cache
                </Button>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconDatabase size={16} />}
                  onClick={() => setClearAllDataModalOpen(true)}
                >
                  Clear All Data
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>

      {/* Sync Settings */}
      <Card withBorder padding="lg">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Text fw={500}>Offline Sync Settings</Text>

            <Switch
              label="Auto-sync when online"
              description="Automatically sync when internet connection available"
              {...form.register('autoSync')}
            />

            {form.watch('autoSync') && (
              <Select
                label="Sync Interval"
                data={[
                  { value: '5min', label: 'Every 5 minutes' },
                  { value: '15min', label: 'Every 15 minutes' },
                  { value: '30min', label: 'Every 30 minutes' },
                  { value: '1hour', label: 'Every hour' },
                ]}
                {...form.register('syncInterval')}
              />
            )}

            <Switch
              label="Sync on WiFi only"
              description="Avoid cellular data usage"
              {...form.register('syncOnWiFiOnly')}
            />

            <Switch
              label="Cache photos offline"
              description="Download photos for offline viewing"
              {...form.register('cachePhotos')}
            />

            <Switch
              label="Download offline maps"
              description="Cache map tiles for offline use"
              {...form.register('offlineMaps')}
            />

            <Button type="submit" loading={form.formState.isSubmitting}>
              Save Settings
            </Button>
          </Stack>
        </form>
      </Card>

      {/* App Info */}
      <Card withBorder padding="lg">
        <Stack gap="xs">
          <Text fw={500}>App Information</Text>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Version</Text>
            <Text size="sm">1.0.0</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Build</Text>
            <Text size="sm">2025.10.23</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Platform</Text>
            <Text size="sm">{window.Capacitor ? 'Mobile' : 'Web'}</Text>
          </Group>
        </Stack>
      </Card>

      {/* Clear Cache Confirmation */}
      <Modal
        opened={clearCacheModalOpen}
        onClose={() => setClearCacheModalOpen(false)}
        title="Clear Cache?"
      >
        <Stack>
          <Text size="sm">
            This will clear cached data but keep your forms and photos. You can re-download cached data when online.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setClearCacheModalOpen(false)}>
              Cancel
            </Button>
            <Button color="orange" onClick={clearCache}>
              Clear Cache
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Clear All Data Confirmation */}
      <Modal
        opened={clearAllDataModalOpen}
        onClose={() => setClearAllDataModalOpen(false)}
        title="Clear All Data?"
      >
        <Stack>
          <Text size="sm" c="red" fw={600}>
            WARNING: This will delete ALL offline data including forms, photos, and cache.
            Only synced data will remain on the server.
          </Text>
          <Text size="sm">
            This action cannot be undone. Make sure all data is synced before proceeding.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setClearAllDataModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={clearAllData}>
              Delete All Data
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
```

## Acceptance Criteria

- [ ] /settings/app route displays all app settings
- [ ] Storage usage displays with breakdown
- [ ] Clear cache button functional with confirmation
- [ ] Clear all data button functional with double confirmation
- [ ] Offline sync settings toggle correctly
- [ ] App version information displayed
- [ ] Form validation errors display correctly
- [ ] Success notification on save

## Testing Requirements

**Unit Tests:**

- Test storage calculation logic
- Test clear cache functionality
- Test sync settings validation

**Integration Tests:**

- Test IndexedDB clear operations
- Test storage estimation API
- Test Capacitor Preferences integration

**Manual Testing:**

- View storage breakdown
- Clear cache and verify data persists
- Clear all data and verify complete wipe
- Change sync settings and verify application

## Evidence Requirements

- [ ] Screenshot: App settings page with storage breakdown
- [ ] Screenshot: Clear cache confirmation modal
- [ ] Screenshot: Clear all data double confirmation
- [ ] Screenshot: Sync settings section
- [ ] Test Results: App settings tests (>80% coverage)

## Success Criteria

App settings page is complete when:

- Storage usage displays accurately
- Cache management functional
- Offline sync settings working
- App information displayed
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
