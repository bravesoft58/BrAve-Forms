/**
 * Fetch With Retry Utility
 *
 * Provides retry logic with exponential backoff for transient errors.
 * Useful for network requests that may fail temporarily.
 */

import { logError, logWarning } from './error-logger';

/**
 * Options for fetchWithRetry
 */
export interface FetchWithRetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error, response?: Response) => boolean;
  /** Called on each retry attempt */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  /** Feature name for logging */
  feature?: string;
}

/**
 * Default options for fetchWithRetry
 */
const DEFAULT_OPTIONS: Required<Omit<FetchWithRetryOptions, 'onRetry' | 'feature'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  isRetryable: defaultIsRetryable,
};

/**
 * Default retry checker - retries on network errors and 5xx responses
 */
function defaultIsRetryable(error: Error, response?: Response): boolean {
  // Network errors are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // 5xx server errors are retryable
  if (response && response.status >= 500 && response.status < 600) {
    return true;
  }

  // 429 Too Many Requests is retryable
  if (response && response.status === 429) {
    return true;
  }

  // 408 Request Timeout is retryable
  if (response && response.status === 408) {
    return true;
  }

  // Don't retry 4xx client errors (except 408 and 429)
  if (response && response.status >= 400 && response.status < 500) {
    return false;
  }

  // Retry by default for unknown errors
  return true;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  // Exponential backoff
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  // Apply max delay cap
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (0-25% of delay)
  const jitter = cappedDelay * Math.random() * 0.25;
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry and exponential backoff
 *
 * @example
 * ```typescript
 * // Basic usage
 * const response = await fetchWithRetry('https://api.example.com/data');
 *
 * // With custom options
 * const response = await fetchWithRetry(
 *   'https://api.example.com/data',
 *   { method: 'POST', body: JSON.stringify(data) },
 *   {
 *     maxRetries: 5,
 *     initialDelay: 500,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error.message),
 *   }
 * );
 * ```
 */
export async function fetchWithRetry(
  url: string | URL,
  init?: RequestInit,
  options?: FetchWithRetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      // Check if response indicates an error that should be retried
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        if (opts.isRetryable(error, response)) {
          lastError = error;

          if (attempt < opts.maxRetries) {
            const delay = calculateDelay(
              attempt,
              opts.initialDelay,
              opts.maxDelay,
              opts.backoffMultiplier
            );

            logWarning(`Retrying request to ${url} (attempt ${attempt + 1}/${opts.maxRetries})`, {
              feature: opts.feature,
              extra: { delay, status: response.status },
            });

            opts.onRetry?.(attempt + 1, error, delay);
            await sleep(delay);
            continue;
          }
        }
        // Non-retryable error or out of retries - return the response
        // Let caller handle the error response
        return response;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (opts.isRetryable(lastError, undefined) && attempt < opts.maxRetries) {
        const delay = calculateDelay(
          attempt,
          opts.initialDelay,
          opts.maxDelay,
          opts.backoffMultiplier
        );

        logWarning(`Retrying request to ${url} (attempt ${attempt + 1}/${opts.maxRetries})`, {
          feature: opts.feature,
          extra: { delay, error: lastError.message },
        });

        opts.onRetry?.(attempt + 1, lastError, delay);
        await sleep(delay);
        continue;
      }

      // Non-retryable error or out of retries
      logError(lastError, {
        feature: opts.feature,
        extra: { url: url.toString(), attempts: attempt + 1 },
      });
      throw lastError;
    }
  }

  // Should not reach here, but throw last error if we do
  logError(lastError, {
    feature: opts.feature,
    extra: { url: url.toString(), attempts: opts.maxRetries + 1 },
  });
  throw lastError;
}

/**
 * Execute a function with retry logic
 *
 * @example
 * ```typescript
 * const result = await retryAsync(
 *   () => someAsyncOperation(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: FetchWithRetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (opts.isRetryable(lastError, undefined) && attempt < opts.maxRetries) {
        const delay = calculateDelay(
          attempt,
          opts.initialDelay,
          opts.maxDelay,
          opts.backoffMultiplier
        );

        logWarning(`Retrying operation (attempt ${attempt + 1}/${opts.maxRetries})`, {
          feature: opts.feature,
          extra: { delay, error: lastError.message },
        });

        opts.onRetry?.(attempt + 1, lastError, delay);
        await sleep(delay);
        continue;
      }

      // Non-retryable error or out of retries
      logError(lastError, {
        feature: opts.feature,
        extra: { attempts: attempt + 1 },
      });
      throw lastError;
    }
  }

  // Should not reach here
  throw lastError;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.name === 'TypeError' ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('failed to fetch') ||
    error.message.toLowerCase().includes('offline')
  );
}

/**
 * Check if we are currently offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
