/**
 * ErrorFallback Component
 *
 * Provides user-friendly error display with retry and navigation options.
 * Optimized for construction site use with large touch targets.
 */

'use client';

import { Button, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconRefresh,
  IconHome,
  IconWifi,
  IconCamera,
  IconForms,
  IconSettings,
} from '@tabler/icons-react';

/**
 * Props for ErrorFallback component
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error | null;
  /** Function to reset the error and retry */
  resetError: () => void;
  /** Feature name for contextual messaging */
  feature?: string;
  /** Whether to show the home button */
  showHomeButton?: boolean;
  /** Custom title */
  title?: string;
  /** Custom message */
  message?: string;
}

/**
 * Get feature-specific icon
 */
function getFeatureIcon(feature?: string) {
  switch (feature) {
    case 'photos':
    case 'photo-gallery':
      return IconCamera;
    case 'forms':
    case 'form-builder':
      return IconForms;
    case 'settings':
      return IconSettings;
    case 'sync':
    case 'offline':
      return IconWifi;
    default:
      return IconAlertTriangle;
  }
}

/**
 * Get feature-specific error message
 */
function getFeatureMessage(feature?: string): string {
  switch (feature) {
    case 'photos':
    case 'photo-gallery':
      return 'Failed to load photos. Check your internet connection and try again.';
    case 'forms':
    case 'form-builder':
      return 'Failed to load form. Your data is saved locally and will sync when the issue is resolved.';
    case 'settings':
      return 'Failed to load settings. Please try again.';
    case 'sync':
    case 'offline':
      return 'Sync failed. Your data is saved locally and will sync automatically when connection is restored.';
    default:
      return 'Something went wrong. Please try again or contact support if the issue persists.';
  }
}

/**
 * Get feature-specific title
 */
function getFeatureTitle(feature?: string): string {
  switch (feature) {
    case 'photos':
    case 'photo-gallery':
      return 'Photo Error';
    case 'forms':
    case 'form-builder':
      return 'Form Error';
    case 'settings':
      return 'Settings Error';
    case 'sync':
    case 'offline':
      return 'Sync Error';
    default:
      return 'Something went wrong';
  }
}

/**
 * ErrorFallback - Displays error with retry functionality
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={error}
 *   resetError={() => setError(null)}
 *   feature="photos"
 * />
 * ```
 */
export function ErrorFallback({
  error,
  resetError,
  feature,
  showHomeButton = true,
  title,
  message,
}: ErrorFallbackProps) {
  const FeatureIcon = getFeatureIcon(feature);
  const displayTitle = title || getFeatureTitle(feature);
  const displayMessage = message || getFeatureMessage(feature);

  const isNetworkError =
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('offline');

  return (
    <Card
      withBorder
      padding="xl"
      ta="center"
      data-testid="error-fallback"
      role="alert"
      aria-live="assertive"
    >
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" color={isNetworkError ? 'orange' : 'red'} variant="light">
          <FeatureIcon size={32} />
        </ThemeIcon>

        <Text size="xl" fw={600} data-testid="error-title">
          {displayTitle}
        </Text>

        <Text size="sm" c="dimmed" maw={400} data-testid="error-message">
          {displayMessage}
        </Text>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <Text
            size="xs"
            c="red"
            ff="monospace"
            maw={400}
            style={{ wordBreak: 'break-word' }}
            data-testid="error-details"
          >
            {error.message}
          </Text>
        )}

        <Group mt="md">
          <Button
            leftSection={<IconRefresh size={18} />}
            onClick={resetError}
            size="md"
            data-testid="error-retry-button"
            style={{ minHeight: 44, minWidth: 120 }}
          >
            Try Again
          </Button>

          {showHomeButton && (
            <Button
              variant="outline"
              leftSection={<IconHome size={18} />}
              onClick={() => (window.location.href = '/')}
              size="md"
              data-testid="error-home-button"
              style={{ minHeight: 44, minWidth: 120 }}
            >
              Go Home
            </Button>
          )}
        </Group>

        {isNetworkError && (
          <Text size="xs" c="dimmed" mt="xs">
            Tip: Check your internet connection and try again
          </Text>
        )}
      </Stack>
    </Card>
  );
}

/**
 * CompactErrorFallback - Smaller error display for inline use
 */
export interface CompactErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  message?: string;
}

export function CompactErrorFallback({
  error: _error,
  resetError,
  message = 'Failed to load',
}: CompactErrorFallbackProps) {
  return (
    <Group gap="sm" p="md" data-testid="compact-error-fallback" role="alert" aria-live="polite">
      <ThemeIcon size="sm" color="red" variant="light">
        <IconAlertTriangle size={14} />
      </ThemeIcon>
      <Text size="sm" c="dimmed">
        {message}
      </Text>
      <Button
        size="xs"
        variant="subtle"
        onClick={resetError}
        leftSection={<IconRefresh size={14} />}
        data-testid="compact-error-retry"
      >
        Retry
      </Button>
    </Group>
  );
}
