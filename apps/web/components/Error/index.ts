/**
 * Error Handling Components and Utilities
 *
 * Provides comprehensive error handling including:
 * - Error boundaries (global and feature-specific)
 * - Toast notifications
 * - Error logging
 * - Retry logic with exponential backoff
 */

// Error Boundaries
export { GlobalErrorBoundary, type GlobalErrorBoundaryProps } from './GlobalErrorBoundary';

export {
  PhotosErrorBoundary,
  FormsErrorBoundary,
  SettingsErrorBoundary,
  SyncErrorBoundary,
  OfflineErrorBoundary,
  DashboardErrorBoundary,
} from './FeatureErrorBoundaries';

// Error Fallback UI
export {
  ErrorFallback,
  CompactErrorFallback,
  type ErrorFallbackProps,
  type CompactErrorFallbackProps,
} from './ErrorFallback';

// Toast Notifications
export { toast, toastPromise, type ToastOptions } from './toast';

// Error Logging
export {
  logError,
  logMessage,
  logWarning,
  getErrorLog,
  clearErrorLog,
  createFeatureLogger,
  type ErrorContext,
  type ErrorSeverity,
} from './error-logger';

// Fetch With Retry
export {
  fetchWithRetry,
  retryAsync,
  isNetworkError,
  isOffline,
  type FetchWithRetryOptions,
} from './fetchWithRetry';
