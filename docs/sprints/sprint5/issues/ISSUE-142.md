# ISSUE-142: Error Boundaries & Toast Notifications (3h)

**Priority:** P0
**Phase:** Phase 4 - Polish & Testing
**Estimated Hours:** 3
**Dependencies:** Phase 1, 2, 3 complete
**Sprint:** Sprint 5

---

## Objective

Implement comprehensive error handling with React Error Boundaries and user-friendly toast notifications for all Sprint 5 features to ensure field workers receive clear feedback on errors and successes.

## Tasks

- [ ] Create global error boundary component
- [ ] Create feature-specific error boundaries (photos, sync, settings)
- [ ] Implement toast notification system with Mantine
- [ ] Add error toast notifications for all async failures
- [ ] Add success toast notifications for all async successes
- [ ] Create error fallback UI components
- [ ] Implement error logging to Sentry
- [ ] Add retry logic for transient errors
- [ ] Add unit tests for error handling

## Technical Details

**Libraries/Dependencies:**

- React Error Boundary
- Mantine Notifications (@mantine/notifications)
- Sentry (error logging)
- TanStack Query (error handling)

**Code Example:**

```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button, Card, Stack, Text, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import * as Sentry from '@sentry/react';

// Global Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    console.error('Global error caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card withBorder padding="xl" ta="center">
          <Stack align="center">
            <IconAlertTriangle size={48} color="red" />
            <Text size="xl" fw={600}>Something went wrong</Text>
            <Text size="sm" c="dimmed">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Group>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.resetError}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </Group>
          </Stack>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Feature-Specific Error Boundary (Photos)
export function PhotosErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary
      fallback={
        <Card withBorder padding="xl" ta="center">
          <Stack align="center">
            <IconAlertTriangle size={48} color="orange" />
            <Text size="lg" fw={600}>Failed to load photos</Text>
            <Text size="sm" c="dimmed">
              Check your internet connection and try again
            </Text>
            <Button onClick={() => window.location.reload()}>
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

// Toast Notification Helpers
export const toast = {
  success: (message: string, title = 'Success') => {
    notifications.show({
      title,
      message,
      color: 'green',
      icon: <IconCheck size={16} />,
      autoClose: 3000,
    });
  },

  error: (message: string, title = 'Error') => {
    notifications.show({
      title,
      message,
      color: 'red',
      icon: <IconX size={16} />,
      autoClose: 5000,
    });

    // Log to Sentry
    Sentry.captureMessage(`Toast error: ${title} - ${message}`, 'error');
  },

  info: (message: string, title = 'Info') => {
    notifications.show({
      title,
      message,
      color: 'blue',
      icon: <IconAlertTriangle size={16} />,
      autoClose: 4000,
    });
  },

  loading: (message: string, id: string) => {
    notifications.show({
      id,
      message,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
  },

  update: (id: string, { success, message, title }: { success: boolean, message: string, title?: string }) => {
    notifications.update({
      id,
      title: title || (success ? 'Success' : 'Error'),
      message,
      color: success ? 'green' : 'red',
      icon: success ? <IconCheck size={16} /> : <IconX size={16} />,
      loading: false,
      autoClose: 3000,
    });
  },
};

// Usage in async operations
export async function uploadPhoto(file: File) {
  const uploadId = 'upload-photo';

  try {
    toast.loading('Uploading photo...', uploadId);

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: file,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const photo = await response.json();

    toast.update(uploadId, {
      success: true,
      message: 'Photo uploaded successfully',
    });

    return photo;
  } catch (error) {
    toast.update(uploadId, {
      success: false,
      message: error.message || 'Failed to upload photo',
    });

    throw error;
  }
}

// TanStack Query Error Handling
export function PhotoGalleryPage() {
  const { data: photos, error, refetch } = useQuery({
    queryKey: ['photos'],
    queryFn: fetchPhotos,
    retry: 3, // Retry 3 times for transient errors
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onError: (error) => {
      toast.error(
        'Failed to load photos. Please check your internet connection.',
        'Error Loading Photos'
      );

      // Log to Sentry
      Sentry.captureException(error, {
        tags: { feature: 'photo-gallery' },
      });
    },
  });

  if (error) {
    return (
      <Card withBorder padding="xl" ta="center">
        <Stack align="center">
          <IconAlertTriangle size={48} color="orange" />
          <Text size="lg" fw={600}>Failed to load photos</Text>
          <Text size="sm" c="dimmed">{error.message}</Text>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Stack>
      </Card>
    );
  }

  // ... render photos
}

// Form Submission Error Handling
export function FormSubmissionButton({ formData }: { formData: FormData }) {
  const mutation = useMutation({
    mutationFn: submitForm,
    onSuccess: () => {
      toast.success('Form submitted successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('network')) {
        toast.error(
          'No internet connection. Form saved offline and will sync when online.',
          'Offline Submission'
        );
      } else if (error.message.includes('validation')) {
        toast.error(
          'Please check your form and fix validation errors.',
          'Validation Error'
        );
      } else {
        toast.error(
          error.message || 'Failed to submit form. Please try again.',
          'Submission Error'
        );
      }

      // Log to Sentry
      Sentry.captureException(error, {
        tags: { feature: 'form-submission' },
        extra: { formData },
      });
    },
  });

  return (
    <Button onClick={() => mutation.mutate(formData)} loading={mutation.isPending}>
      Submit Form
    </Button>
  );
}

// Retry Logic for Transient Errors
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * 2 ** i));
      }
    }
  }

  throw lastError!;
}
```

## Acceptance Criteria

- [ ] Global error boundary catches all uncaught errors
- [ ] Feature-specific error boundaries for photos, sync, settings
- [ ] Toast notifications show for all async successes
- [ ] Toast notifications show for all async errors
- [ ] Error fallback UI provides retry functionality
- [ ] All errors logged to Sentry with context
- [ ] Transient errors retry with exponential backoff
- [ ] Network errors queue operations for offline sync
- [ ] Validation errors show user-friendly messages

## Testing Requirements

**Unit Tests:**

- Test error boundary catches errors
- Test toast notification helpers
- Test retry logic with exponential backoff

**Integration Tests:**

- Test error boundary fallback UI
- Test Sentry error logging
- Test TanStack Query error handling

**Manual Testing:**

- Simulate network errors (offline mode)
- Simulate validation errors (invalid form data)
- Simulate server errors (500 responses)
- Verify toast notifications display correctly
- Verify errors logged to Sentry

## Evidence Requirements

- [ ] Screenshot: Global error boundary fallback
- [ ] Screenshot: Success toast notification
- [ ] Screenshot: Error toast notification
- [ ] Screenshot: Loading toast notification
- [ ] Screenshot: Sentry error dashboard with logged errors
- [ ] Test Results: Error handling tests (>80% coverage)

## Success Criteria

Error handling is complete when:

- All errors caught by error boundaries
- User-friendly error messages displayed
- Toast notifications working for all async operations
- Errors logged to Sentry with context
- Retry logic working for transient errors
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
