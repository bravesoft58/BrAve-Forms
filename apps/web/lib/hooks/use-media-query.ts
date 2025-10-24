'use client';

import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 *
 * Tracks whether a CSS media query matches the current viewport.
 * Returns true when the query matches, false otherwise.
 *
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the query matches
 *
 * Example:
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false for SSR (default to desktop)
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Skip if window is not available (SSR)
    if (typeof window === 'undefined') return;

    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Update state when media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
