/**
 * Feature-Specific Error Boundaries
 *
 * Pre-configured error boundaries for different features of the application.
 * Each has custom fallback UI and messaging appropriate for its context.
 */

'use client';

import { ReactNode } from 'react';
import { Button, Card, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconCamera,
  IconForms,
  IconSettings,
  IconWifi,
  IconRefresh,
  IconCloudOff,
} from '@tabler/icons-react';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';

/**
 * Common props for feature error boundaries
 */
interface FeatureErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * PhotosErrorBoundary - Error boundary for photo-related features
 */
export function PhotosErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      feature="photos"
      onError={onError}
      fallback={
        <Card withBorder padding="xl" ta="center" data-testid="photos-error-boundary" role="alert">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light">
              <IconCamera size={32} />
            </ThemeIcon>
            <Text size="xl" fw={600}>
              Failed to load photos
            </Text>
            <Text size="sm" c="dimmed" maw={400}>
              Check your internet connection and try again. Your photos are saved locally and will
              sync when the issue is resolved.
            </Text>
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IconRefresh size={18} />}
              size="md"
              style={{ minHeight: 44 }}
            >
              Reload Page
            </Button>
          </Stack>
        </Card>
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}

/**
 * FormsErrorBoundary - Error boundary for form-related features
 */
export function FormsErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      feature="forms"
      onError={onError}
      fallback={
        <Card withBorder padding="xl" ta="center" data-testid="forms-error-boundary" role="alert">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light">
              <IconForms size={32} />
            </ThemeIcon>
            <Text size="xl" fw={600}>
              Failed to load form
            </Text>
            <Text size="sm" c="dimmed" maw={400}>
              Your form data is saved locally and will sync when the issue is resolved. Try
              refreshing the page or check your internet connection.
            </Text>
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IconRefresh size={18} />}
              size="md"
              style={{ minHeight: 44 }}
            >
              Reload Page
            </Button>
          </Stack>
        </Card>
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}

/**
 * SettingsErrorBoundary - Error boundary for settings pages
 */
export function SettingsErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      feature="settings"
      onError={onError}
      fallback={
        <Card
          withBorder
          padding="xl"
          ta="center"
          data-testid="settings-error-boundary"
          role="alert"
        >
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light">
              <IconSettings size={32} />
            </ThemeIcon>
            <Text size="xl" fw={600}>
              Failed to load settings
            </Text>
            <Text size="sm" c="dimmed" maw={400}>
              Unable to load your settings. Please try again.
            </Text>
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IconRefresh size={18} />}
              size="md"
              style={{ minHeight: 44 }}
            >
              Reload Page
            </Button>
          </Stack>
        </Card>
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}

/**
 * SyncErrorBoundary - Error boundary for sync/offline features
 */
export function SyncErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      feature="sync"
      onError={onError}
      fallback={
        <Card withBorder padding="xl" ta="center" data-testid="sync-error-boundary" role="alert">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light">
              <IconWifi size={32} />
            </ThemeIcon>
            <Text size="xl" fw={600}>
              Sync error
            </Text>
            <Text size="sm" c="dimmed" maw={400}>
              There was a problem syncing your data. Your changes are saved locally and will sync
              automatically when connection is restored.
            </Text>
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IconRefresh size={18} />}
              size="md"
              style={{ minHeight: 44 }}
            >
              Retry Sync
            </Button>
          </Stack>
        </Card>
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}

/**
 * OfflineErrorBoundary - Error boundary for offline-specific errors
 */
export function OfflineErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      feature="offline"
      onError={onError}
      fallback={
        <Card withBorder padding="xl" ta="center" data-testid="offline-error-boundary" role="alert">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="gray" variant="light">
              <IconCloudOff size={32} />
            </ThemeIcon>
            <Text size="xl" fw={600}>
              Offline mode error
            </Text>
            <Text size="sm" c="dimmed" maw={400}>
              Some features require an internet connection. Your data is saved locally and will sync
              when you are back online.
            </Text>
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IconRefresh size={18} />}
              size="md"
              variant="outline"
              style={{ minHeight: 44 }}
            >
              Check Connection
            </Button>
          </Stack>
        </Card>
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}

/**
 * DashboardErrorBoundary - Error boundary for dashboard
 */
export function DashboardErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary feature="dashboard" onError={onError}>
      {children}
    </GlobalErrorBoundary>
  );
}
