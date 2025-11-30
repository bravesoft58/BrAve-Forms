/**
 * Toast Notification Helpers
 *
 * Provides a simple API for showing toast notifications using Mantine.
 * Includes success, error, warning, info, and loading states.
 */

'use client';

import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { logError, logMessage } from './error-logger';

/**
 * Toast notification options
 */
export interface ToastOptions {
  /** Toast ID for updating/dismissing */
  id?: string;
  /** Auto-close duration in ms (false to disable) */
  autoClose?: number | false;
  /** Whether to log to error tracking */
  log?: boolean;
  /** Feature context for logging */
  feature?: string;
}

/**
 * Toast notification helper object
 */
export const toast = {
  /**
   * Show success notification
   */
  success: (message: string, title = 'Success', options?: ToastOptions) => {
    notifications.show({
      id: options?.id,
      title,
      message,
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: options?.autoClose ?? 3000,
    });

    if (options?.log) {
      logMessage(`Toast success: ${title} - ${message}`, {
        feature: options?.feature,
      });
    }
  },

  /**
   * Show error notification
   */
  error: (message: string, title = 'Error', options?: ToastOptions) => {
    notifications.show({
      id: options?.id,
      title,
      message,
      color: 'red',
      icon: <IconX size={18} />,
      autoClose: options?.autoClose ?? 5000,
    });

    // Log errors by default
    if (options?.log !== false) {
      logError(new Error(`${title}: ${message}`), {
        feature: options?.feature || 'toast',
      });
    }
  },

  /**
   * Show warning notification
   */
  warning: (message: string, title = 'Warning', options?: ToastOptions) => {
    notifications.show({
      id: options?.id,
      title,
      message,
      color: 'orange',
      icon: <IconAlertTriangle size={18} />,
      autoClose: options?.autoClose ?? 4000,
    });

    if (options?.log) {
      logMessage(
        `Toast warning: ${title} - ${message}`,
        {
          feature: options?.feature,
        },
        'warning'
      );
    }
  },

  /**
   * Show info notification
   */
  info: (message: string, title = 'Info', options?: ToastOptions) => {
    notifications.show({
      id: options?.id,
      title,
      message,
      color: 'blue',
      icon: <IconInfoCircle size={18} />,
      autoClose: options?.autoClose ?? 4000,
    });

    if (options?.log) {
      logMessage(`Toast info: ${title} - ${message}`, {
        feature: options?.feature,
      });
    }
  },

  /**
   * Show loading notification (does not auto-close)
   */
  loading: (message: string, id: string, title?: string) => {
    notifications.show({
      id,
      title: title || 'Loading',
      message,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
  },

  /**
   * Update an existing notification (typically loading -> success/error)
   */
  update: (
    id: string,
    {
      success,
      message,
      title,
      autoClose,
    }: {
      success: boolean;
      message: string;
      title?: string;
      autoClose?: number;
    }
  ) => {
    notifications.update({
      id,
      title: title || (success ? 'Success' : 'Error'),
      message,
      color: success ? 'green' : 'red',
      icon: success ? <IconCheck size={18} /> : <IconX size={18} />,
      loading: false,
      autoClose: autoClose ?? 3000,
      withCloseButton: true,
    });

    // Log errors
    if (!success) {
      logError(new Error(`${title || 'Error'}: ${message}`), {
        feature: 'toast',
      });
    }
  },

  /**
   * Dismiss a notification by ID
   */
  dismiss: (id: string) => {
    notifications.hide(id);
  },

  /**
   * Dismiss all notifications
   */
  dismissAll: () => {
    notifications.cleanQueue();
  },

  /**
   * Show offline notification
   */
  offline: (
    message = 'You are currently offline. Changes will sync when connection is restored.'
  ) => {
    notifications.show({
      id: 'offline-notification',
      title: 'Offline Mode',
      message,
      color: 'orange',
      icon: <IconAlertTriangle size={18} />,
      autoClose: 5000,
    });
  },

  /**
   * Show online notification (when connection restored)
   */
  online: (message = 'Connection restored. Syncing your changes...') => {
    notifications.show({
      id: 'online-notification',
      title: 'Back Online',
      message,
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: 3000,
    });
  },

  /**
   * Show form validation error
   */
  validationError: (errors: string[] | string) => {
    const errorList = Array.isArray(errors) ? errors : [errors];
    const message =
      errorList.length > 1
        ? `Please fix the following:\n${errorList.map((e) => `- ${e}`).join('\n')}`
        : errorList[0];

    notifications.show({
      title: 'Validation Error',
      message,
      color: 'red',
      icon: <IconAlertTriangle size={18} />,
      autoClose: 5000,
    });
  },

  /**
   * Show save success notification
   */
  saved: (message = 'Changes saved successfully') => {
    toast.success(message, 'Saved');
  },

  /**
   * Show delete success notification
   */
  deleted: (message = 'Item deleted successfully') => {
    toast.success(message, 'Deleted');
  },
};

/**
 * Promise-based toast helper for async operations
 * Shows loading, then success/error based on promise result
 */
export async function toastPromise<T>(
  promise: Promise<T>,
  {
    id,
    loading,
    success,
    error,
  }: {
    id?: string;
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: Error) => string);
  }
): Promise<T> {
  const toastId = id || `toast-${Date.now()}`;

  toast.loading(loading, toastId);

  try {
    const result = await promise;
    const successMessage = typeof success === 'function' ? success(result) : success;
    toast.update(toastId, { success: true, message: successMessage });
    return result;
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    const errorMessage = typeof error === 'function' ? error(errorObj) : error;
    toast.update(toastId, { success: false, message: errorMessage });
    throw err;
  }
}
