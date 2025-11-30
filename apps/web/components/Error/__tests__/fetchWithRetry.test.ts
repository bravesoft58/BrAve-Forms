/**
 * Fetch With Retry Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry, retryAsync, isNetworkError, isOffline } from '../fetchWithRetry';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Success Cases
  // ============================================================================
  describe('Success Cases', () => {
    it('should return response on successful fetch', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK',
      });
      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const response = await fetchWithRetry('https://api.example.com/data');

      expect(response.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on successful response', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 5,
      });

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Retry Cases
  // ============================================================================
  describe('Retry Cases', () => {
    it('should retry on 500 server error', async () => {
      const errorResponse = new Response('Server Error', { status: 500 });
      const successResponse = new Response('OK', { status: 200 });

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
        initialDelay: 100,
      });

      // Advance timers for first retry
      await vi.advanceTimersByTimeAsync(200);

      const response = await responsePromise;

      expect(response.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 rate limit', async () => {
      const rateLimitResponse = new Response('Too Many Requests', { status: 429 });
      const successResponse = new Response('OK', { status: 200 });

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
        initialDelay: 100,
      });

      await vi.advanceTimersByTimeAsync(200);

      const response = await responsePromise;

      expect(response.ok).toBe(true);
    });

    it('should retry on network error', async () => {
      const networkError = new TypeError('Failed to fetch');
      const successResponse = new Response('OK', { status: 200 });

      vi.spyOn(global, 'fetch')
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
        initialDelay: 100,
      });

      await vi.advanceTimersByTimeAsync(200);

      const response = await responsePromise;

      expect(response.ok).toBe(true);
    });

    it('should call onRetry callback', async () => {
      const errorResponse = new Response('Server Error', { status: 500 });
      const successResponse = new Response('OK', { status: 200 });
      const onRetry = vi.fn();

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
        initialDelay: 100,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(200);
      await responsePromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });
  });

  // ============================================================================
  // Non-Retryable Cases
  // ============================================================================
  describe('Non-Retryable Cases', () => {
    it('should not retry on 400 Bad Request', async () => {
      const badRequestResponse = new Response('Bad Request', { status: 400 });
      vi.spyOn(global, 'fetch').mockResolvedValue(badRequestResponse);

      const response = await fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
      });

      expect(response.status).toBe(400);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 Not Found', async () => {
      const notFoundResponse = new Response('Not Found', { status: 404 });
      vi.spyOn(global, 'fetch').mockResolvedValue(notFoundResponse);

      const response = await fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
      });

      expect(response.status).toBe(404);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 Unauthorized', async () => {
      const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
      vi.spyOn(global, 'fetch').mockResolvedValue(unauthorizedResponse);

      const response = await fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 3,
      });

      expect(response.status).toBe(401);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Max Retries Exceeded
  // ============================================================================
  describe('Max Retries Exceeded', () => {
    it('should throw after max retries exceeded', async () => {
      const networkError = new TypeError('Failed to fetch');
      vi.spyOn(global, 'fetch').mockRejectedValue(networkError);

      const errorHolder: { error: Error | null } = { error: null };

      // Create promise and immediately attach error handler
      const responsePromise = fetchWithRetry('https://api.example.com/data', undefined, {
        maxRetries: 2,
        initialDelay: 100,
      }).catch((err) => {
        errorHolder.error = err as Error;
      });

      // Advance timers
      await vi.runAllTimersAsync();

      // Wait for the promise chain to complete
      await responsePromise;

      expect(errorHolder.error).toBeInstanceOf(TypeError);
      expect(errorHolder.error?.message).toBe('Failed to fetch');
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});

// ============================================================================
// retryAsync Tests
// ============================================================================
describe('retryAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return result on success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retryAsync(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce('success');

    const resultPromise = retryAsync(fn, { maxRetries: 3, initialDelay: 100 });

    await vi.advanceTimersByTimeAsync(200);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

    const errorHolder: { error: Error | null } = { error: null };

    // Create promise and immediately attach error handler
    const resultPromise = retryAsync(fn, { maxRetries: 2, initialDelay: 100 }).catch((err) => {
      errorHolder.error = err as Error;
    });

    // Advance timers
    await vi.runAllTimersAsync();

    // Wait for the promise chain to complete
    await resultPromise;

    expect(errorHolder.error).toBeInstanceOf(Error);
    expect(errorHolder.error?.message).toBe('Persistent error');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================
describe('Utility Functions', () => {
  describe('isNetworkError', () => {
    it('should return true for TypeError', () => {
      const error = new TypeError('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for network-related message', () => {
      const error = new Error('Network request failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for fetch-related message', () => {
      const error = new Error('Failed to fetch data');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for offline message', () => {
      const error = new Error('Device is offline');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network error', () => {
      const error = new Error('Validation failed');
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isOffline', () => {
    it('should return true when navigator.onLine is false', () => {
      vi.stubGlobal('navigator', { onLine: false });
      expect(isOffline()).toBe(true);
      vi.unstubAllGlobals();
    });

    it('should return false when navigator.onLine is true', () => {
      vi.stubGlobal('navigator', { onLine: true });
      expect(isOffline()).toBe(false);
      vi.unstubAllGlobals();
    });
  });
});
