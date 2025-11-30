/**
 * Error Logger
 *
 * Centralized error logging that can be integrated with Sentry or other
 * error tracking services. Currently logs to console in development.
 */

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  /** Feature where the error occurred */
  feature?: string;
  /** React component stack */
  componentStack?: string;
  /** Additional metadata */
  extra?: Record<string, unknown>;
  /** Tags for categorization */
  tags?: Record<string, string>;
  /** User information (anonymized) */
  user?: {
    id?: string;
    orgId?: string;
  };
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * Error log entry
 */
interface ErrorLogEntry {
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  error?: Error;
  context?: ErrorContext;
}

// In-memory error log for development (limited to last 50 errors)
const errorLog: ErrorLogEntry[] = [];
const MAX_LOG_SIZE = 50;

// Debug logging utility - only logs in development, tree-shaken in production
const isDev = process.env.NODE_ENV === 'development';

/* eslint-disable no-console */
const devLog = {
  error: isDev
    ? (prefix: string, message: string, data: unknown) => console.error(prefix, message, data)
    : () => {},
  log: isDev
    ? (prefix: string, message: string, data: unknown) => console.log(prefix, message, data)
    : () => {},
};
/* eslint-enable no-console */

/**
 * Log an error with context
 * In production, this would send to Sentry or similar service
 */
export function logError(
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const timestamp = new Date().toISOString();

  const entry: ErrorLogEntry = {
    timestamp,
    severity,
    message: errorObj.message,
    error: errorObj,
    context,
  };

  // Add to in-memory log
  errorLog.push(entry);
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift();
  }

  // Development logging (no-op in production, tree-shaken)
  const prefix = `[${severity.toUpperCase()}] [${context?.feature || 'app'}]`;
  devLog.error(prefix, errorObj.message, {
    error: errorObj,
    stack: errorObj.stack,
    context,
  });

  // TODO(Sprint 6+): Sentry integration - install @sentry/react and configure
  // When Sentry is installed, add:
  // Sentry.captureException(errorObj, {
  //   level: severity,
  //   tags: context?.tags,
  //   extra: context?.extra,
  //   contexts: {
  //     feature: { name: context?.feature },
  //     react: { componentStack: context?.componentStack },
  //   },
  // });
}

/**
 * Log a message (non-error)
 */
export function logMessage(
  message: string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'info'
): void {
  const timestamp = new Date().toISOString();

  const entry: ErrorLogEntry = {
    timestamp,
    severity,
    message,
    context,
  };

  errorLog.push(entry);
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift();
  }

  // Development logging (no-op in production, tree-shaken)
  const prefix = `[${severity.toUpperCase()}] [${context?.feature || 'app'}]`;
  devLog.log(prefix, message, context);
}

/**
 * Log a warning
 */
export function logWarning(message: string, context?: ErrorContext): void {
  logMessage(message, context, 'warning');
}

/**
 * Get recent error logs (for debugging)
 */
export function getErrorLog(): readonly ErrorLogEntry[] {
  return [...errorLog];
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Create a scoped logger for a specific feature
 */
export function createFeatureLogger(feature: string) {
  return {
    error: (error: Error | string, extra?: Record<string, unknown>) =>
      logError(error, { feature, extra }),
    warning: (message: string, extra?: Record<string, unknown>) =>
      logWarning(message, { feature, extra }),
    info: (message: string, extra?: Record<string, unknown>) =>
      logMessage(message, { feature, extra }, 'info'),
  };
}
