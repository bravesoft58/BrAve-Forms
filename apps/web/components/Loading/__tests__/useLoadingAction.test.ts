/**
 * useLoadingAction Hook Unit Tests
 *
 * Tests for loading state management hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useLoadingAction,
  useLoadingState,
  simulateSlowNetwork,
  withMinDelay,
} from '../useLoadingAction';

describe('useLoadingAction', () => {
  // ============================================================================
  // Basic Functionality Tests
  // ============================================================================
  describe('Basic Functionality', () => {
    it('should initialize with loading false and no error', () => {
      const asyncFn = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useLoadingAction(asyncFn));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading to true while executing', async () => {
      let resolvePromise: (value: string) => void;
      const asyncFn = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useLoadingAction(asyncFn));

      // Start execution
      act(() => {
        result.current.execute();
      });

      // Loading should be true
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!('result');
      });

      // Loading should be false
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should return result from async function', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const { result } = renderHook(() => useLoadingAction<string>(asyncFn));

      let returnValue: string | undefined;
      await act(async () => {
        returnValue = await result.current.execute();
      });

      expect(returnValue).toBe('success');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  describe('Error Handling', () => {
    it('should set error when action fails', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useLoadingAction(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBe(error);
    });

    it('should convert non-Error rejections to Error', async () => {
      const asyncFn = vi.fn().mockRejectedValue('String error');

      const { result } = renderHook(() => useLoadingAction(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('String error');
    });

    it('should reset error on resetError call', async () => {
      const asyncFn = vi.fn().mockRejectedValue(new Error('Test'));

      const { result } = renderHook(() => useLoadingAction(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error on new execution', async () => {
      const asyncFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('success');

      const { result } = renderHook(() => useLoadingAction(asyncFn));

      // First call - should error
      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.error).not.toBeNull();

      // Second call - should clear error
      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.error).toBeNull();
    });
  });

  // ============================================================================
  // Callbacks Tests
  // ============================================================================
  describe('Callbacks', () => {
    it('should call onStart when execution begins', async () => {
      const onStart = vi.fn();
      const asyncFn = vi.fn().mockResolvedValue('result');

      const { result } = renderHook(() => useLoadingAction(asyncFn, { onStart }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('should call onSuccess when action succeeds', async () => {
      const onSuccess = vi.fn();
      const asyncFn = vi.fn().mockResolvedValue('result');

      const { result } = renderHook(() => useLoadingAction(asyncFn, { onSuccess }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onError when action fails', async () => {
      const onError = vi.fn();
      const error = new Error('Test');
      const asyncFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useLoadingAction(asyncFn, { onError }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should call onFinally on success', async () => {
      const onFinally = vi.fn();
      const asyncFn = vi.fn().mockResolvedValue('result');

      const { result } = renderHook(() => useLoadingAction(asyncFn, { onFinally }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it('should call onFinally on error', async () => {
      const onFinally = vi.fn();
      const asyncFn = vi.fn().mockRejectedValue(new Error('Test'));

      const { result } = renderHook(() => useLoadingAction(asyncFn, { onFinally }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onFinally).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Concurrent Execution Tests
  // ============================================================================
  describe('Concurrent Execution', () => {
    it('should prevent concurrent executions', async () => {
      let resolvePromise: (value: string) => void;
      const asyncFn = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useLoadingAction(asyncFn));

      // Start first execution
      act(() => {
        result.current.execute();
      });

      // Try to start second execution while first is running
      act(() => {
        result.current.execute();
      });

      // Should only call once
      expect(asyncFn).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolvePromise!('result');
      });
    });
  });
});

// ============================================================================
// useLoadingState Tests
// ============================================================================
describe('useLoadingState', () => {
  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.loading).toBe(false);
  });

  it('should allow setting loading state', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);
  });

  it('should provide withLoading wrapper', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useLoadingState());

    const wrappedFn = result.current.withLoading(asyncFn);

    // Loading should be false initially
    expect(result.current.loading).toBe(false);

    // Execute wrapped function
    await act(async () => {
      await wrappedFn();
    });

    // Should have called the function
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================
describe('Utility Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('simulateSlowNetwork', () => {
    it('should delay function execution', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      const promise = simulateSlowNetwork(fn, 2000);

      // Function should not be called immediately
      expect(fn).not.toHaveBeenCalled();

      // Advance timer and flush promises
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(fn).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should use default delay of 2000ms', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      const promise = simulateSlowNetwork(fn);

      await vi.advanceTimersByTimeAsync(1999);

      // Not called yet
      expect(fn).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);

      await promise;
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('withMinDelay', () => {
    it('should ensure minimum delay', async () => {
      const fastPromise = Promise.resolve('fast result');

      const resultPromise = withMinDelay(fastPromise, 500);

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;
      expect(result).toBe('fast result');
    });

    it('should not add delay if promise takes longer than minDelay', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('slow result'), 1000);
      });

      const resultPromise = withMinDelay(slowPromise, 300);

      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result).toBe('slow result');
    });

    it('should use default minDelay of 300ms', async () => {
      const fastPromise = Promise.resolve('result');

      const resultPromise = withMinDelay(fastPromise);

      await vi.advanceTimersByTimeAsync(300);

      const result = await resultPromise;
      expect(result).toBe('result');
    });
  });
});
