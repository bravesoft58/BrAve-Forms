/**
 * Tests for useNetworkStatus Hook
 *
 * Tests network online/offline detection:
 * - Initial state based on navigator.onLine
 * - Event listeners for online/offline transitions
 * - SSR handling (window undefined)
 *
 * @offline Critical for detecting network status changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  // Store original navigator.onLine value
  const originalOnLine = navigator.onLine;
  let onlineListeners: EventListener[] = [];
  let offlineListeners: EventListener[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    onlineListeners = [];
    offlineListeners = [];

    // Mock addEventListener to capture listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineListeners.push(handler as EventListener);
      } else if (event === 'offline') {
        offlineListeners.push(handler as EventListener);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineListeners = onlineListeners.filter((h) => h !== handler);
      } else if (event === 'offline') {
        offlineListeners = offlineListeners.filter((h) => h !== handler);
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  describe('Initial state', () => {
    it('returns online when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
    });

    it('returns offline when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('Event listeners', () => {
    it('registers online and offline event listeners on mount', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      renderHook(() => useNetworkStatus());

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('updates to offline when offline event is fired', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);

      // Simulate offline event
      act(() => {
        offlineListeners.forEach((listener) => {
          listener(new Event('offline'));
        });
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('updates to online when online event is fired', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);

      // Simulate online event
      act(() => {
        onlineListeners.forEach((listener) => {
          listener(new Event('online'));
        });
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('handles multiple online/offline transitions', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // Start online
      expect(result.current.isOnline).toBe(true);

      // Go offline
      act(() => {
        offlineListeners.forEach((listener) => {
          listener(new Event('offline'));
        });
      });
      expect(result.current.isOnline).toBe(false);

      // Go back online
      act(() => {
        onlineListeners.forEach((listener) => {
          listener(new Event('online'));
        });
      });
      expect(result.current.isOnline).toBe(true);

      // Go offline again
      act(() => {
        offlineListeners.forEach((listener) => {
          listener(new Event('offline'));
        });
      });
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('returns consistent state object reference when status unchanged', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result, rerender } = renderHook(() => useNetworkStatus());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // State values should remain the same
      expect(firstResult.isOnline).toBe(secondResult.isOnline);
    });

    it('does not call setState when transitioning to same state', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // Fire online event when already online
      act(() => {
        onlineListeners.forEach((listener) => {
          listener(new Event('online'));
        });
      });

      // Should still be online
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Construction site scenarios', () => {
    it('detects when entering dead zone (offline)', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // User enters construction site dead zone
      act(() => {
        offlineListeners.forEach((listener) => {
          listener(new Event('offline'));
        });
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('detects when leaving dead zone (online)', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // User leaves dead zone, regains connectivity
      act(() => {
        onlineListeners.forEach((listener) => {
          listener(new Event('online'));
        });
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('handles intermittent connectivity (flapping)', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // Simulate flapping connectivity common on construction sites
      for (let i = 0; i < 5; i++) {
        act(() => {
          offlineListeners.forEach((listener) => listener(new Event('offline')));
        });
        expect(result.current.isOnline).toBe(false);

        act(() => {
          onlineListeners.forEach((listener) => listener(new Event('online')));
        });
        expect(result.current.isOnline).toBe(true);
      }
    });
  });
});
