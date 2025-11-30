/**
 * useLoadingAction Hook
 *
 * Hook for managing loading state during async operations.
 * Provides loading state, error handling, and execution function.
 */

'use client';

import { useState, useCallback } from 'react';

/**
 * Return type for useLoadingAction hook
 */
export interface UseLoadingActionResult<T> {
  /** Whether the action is currently loading */
  loading: boolean;
  /** Error if the action failed */
  error: Error | null;
  /** Execute the async action */
  execute: (...args: Parameters<() => Promise<T>>) => Promise<T | undefined>;
  /** Reset error state */
  resetError: () => void;
}

/**
 * Options for useLoadingAction hook
 */
export interface UseLoadingActionOptions {
  /** Callback when action starts */
  onStart?: () => void;
  /** Callback when action completes successfully */
  onSuccess?: () => void;
  /** Callback when action fails */
  onError?: (error: Error) => void;
  /** Callback when action completes (success or failure) */
  onFinally?: () => void;
}

/**
 * useLoadingAction - Hook for managing async operation loading states
 *
 * @param action - Async function to execute
 * @param options - Optional callbacks for lifecycle events
 * @returns Object with loading state, error, and execute function
 *
 * @example
 * ```tsx
 * const { loading, error, execute } = useLoadingAction(
 *   async () => await saveData(),
 *   { onSuccess: () => showNotification('Saved!') }
 * );
 *
 * return (
 *   <Button onClick={execute} loading={loading}>
 *     Save
 *   </Button>
 * );
 * ```
 */
export function useLoadingAction<T>(
  action: () => Promise<T>,
  options: UseLoadingActionOptions = {}
): UseLoadingActionResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    if (loading) return undefined;

    setLoading(true);
    setError(null);
    options.onStart?.();

    try {
      const result = await action();
      options.onSuccess?.();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return undefined;
    } finally {
      setLoading(false);
      options.onFinally?.();
    }
  }, [action, loading, options]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, execute, resetError };
}

/**
 * useLoadingState - Simple hook for just managing loading state
 *
 * @returns Object with loading state and setter
 *
 * @example
 * ```tsx
 * const { loading, setLoading, withLoading } = useLoadingState();
 *
 * const handleClick = withLoading(async () => {
 *   await doSomething();
 * });
 * ```
 */
export function useLoadingState() {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(
    <T>(fn: () => Promise<T>) =>
      async () => {
        setLoading(true);
        try {
          return await fn();
        } finally {
          setLoading(false);
        }
      },
    []
  );

  return { loading, setLoading, withLoading };
}

/**
 * Utility function to simulate slow network for testing
 *
 * @param fn - Function to execute
 * @param delay - Delay in milliseconds (default: 2000)
 * @returns Promise that resolves after delay with function result
 */
export async function simulateSlowNetwork<T>(fn: () => Promise<T>, delay = 2000): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fn();
}

/**
 * Utility function to add artificial delay to any promise
 *
 * @param promise - Promise to delay
 * @param minDelay - Minimum delay in milliseconds
 * @returns Promise that resolves after at least minDelay with original result
 */
export async function withMinDelay<T>(promise: Promise<T>, minDelay = 300): Promise<T> {
  const [result] = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, minDelay)),
  ]);
  return result;
}
