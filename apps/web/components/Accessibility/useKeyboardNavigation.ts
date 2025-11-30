'use client';

/**
 * Keyboard Navigation Hooks
 *
 * Provides hooks for accessible keyboard navigation patterns.
 * Supports arrow key navigation, roving tabindex, and grid navigation.
 *
 * WCAG 2.1 AA Compliance: 2.1.1 Keyboard, 2.1.2 No Keyboard Trap
 */

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useHotkeys } from '@mantine/hooks';

/**
 * Arrow key navigation hook for lists
 *
 * @example
 * ```tsx
 * const { selectedIndex, handlers } = useArrowNavigation({
 *   itemCount: photos.length,
 *   onSelect: (index) => openPhoto(index),
 * });
 *
 * <div {...handlers}>
 *   {photos.map((photo, i) => (
 *     <Photo key={i} selected={i === selectedIndex} />
 *   ))}
 * </div>
 * ```
 */
export interface UseArrowNavigationOptions {
  /** Total number of items */
  itemCount: number;
  /** Initial selected index */
  initialIndex?: number;
  /** Callback when item is selected (Enter/Space) */
  onSelect?: (index: number) => void;
  /** Callback when selection changes */
  onChange?: (index: number) => void;
  /** Enable horizontal navigation (Left/Right arrows) */
  horizontal?: boolean;
  /** Enable vertical navigation (Up/Down arrows) */
  vertical?: boolean;
  /** Wrap around at boundaries */
  wrap?: boolean;
  /** Enable Escape to clear selection */
  enableEscape?: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
}

export function useArrowNavigation({
  itemCount,
  initialIndex = 0,
  onSelect,
  onChange,
  horizontal = true,
  vertical = true,
  wrap = true,
  enableEscape = true,
  onEscape,
}: UseArrowNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const moveNext = useCallback(() => {
    setSelectedIndex((current) => {
      const next = current + 1;
      if (next >= itemCount) {
        return wrap ? 0 : current;
      }
      return next;
    });
  }, [itemCount, wrap]);

  const movePrev = useCallback(() => {
    setSelectedIndex((current) => {
      const prev = current - 1;
      if (prev < 0) {
        return wrap ? itemCount - 1 : current;
      }
      return prev;
    });
  }, [itemCount, wrap]);

  const handleSelect = useCallback(() => {
    onSelect?.(selectedIndex);
  }, [selectedIndex, onSelect]);

  const handleEscape = useCallback(() => {
    onEscape?.();
  }, [onEscape]);

  // Notify onChange
  useEffect(() => {
    onChange?.(selectedIndex);
  }, [selectedIndex, onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          if (horizontal) {
            e.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowLeft':
          if (horizontal) {
            e.preventDefault();
            movePrev();
          }
          break;
        case 'ArrowDown':
          if (vertical) {
            e.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowUp':
          if (vertical) {
            e.preventDefault();
            movePrev();
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelect();
          break;
        case 'Escape':
          if (enableEscape) {
            e.preventDefault();
            handleEscape();
          }
          break;
        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedIndex(itemCount - 1);
          break;
      }
    },
    [horizontal, vertical, moveNext, movePrev, handleSelect, enableEscape, handleEscape, itemCount]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handlers: {
      onKeyDown: handleKeyDown,
    },
    moveNext,
    movePrev,
  };
}

/**
 * Grid navigation hook for photo galleries and grids
 *
 * @example
 * ```tsx
 * const { selectedIndex, handlers } = useGridNavigation({
 *   itemCount: photos.length,
 *   columns: 4,
 *   onSelect: (index) => openPhoto(index),
 * });
 * ```
 */
export interface UseGridNavigationOptions
  extends Omit<UseArrowNavigationOptions, 'horizontal' | 'vertical'> {
  /** Number of columns in the grid */
  columns: number;
}

export function useGridNavigation({
  itemCount,
  columns,
  initialIndex = 0,
  onSelect,
  onChange,
  wrap = false,
  enableEscape = true,
  onEscape,
}: UseGridNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const totalRows = Math.ceil(itemCount / columns);

  const moveRight = useCallback(() => {
    setSelectedIndex((current) => {
      const next = current + 1;
      if (next >= itemCount) {
        return wrap ? 0 : current;
      }
      return next;
    });
  }, [itemCount, wrap]);

  const moveLeft = useCallback(() => {
    setSelectedIndex((current) => {
      const prev = current - 1;
      if (prev < 0) {
        return wrap ? itemCount - 1 : current;
      }
      return prev;
    });
  }, [itemCount, wrap]);

  const moveDown = useCallback(() => {
    setSelectedIndex((current) => {
      const next = current + columns;
      if (next >= itemCount) {
        // Move to same column in first row if wrapping
        if (wrap) {
          const col = current % columns;
          return col;
        }
        return current;
      }
      return next;
    });
  }, [itemCount, columns, wrap]);

  const moveUp = useCallback(() => {
    setSelectedIndex((current) => {
      const prev = current - columns;
      if (prev < 0) {
        // Move to same column in last row if wrapping
        if (wrap) {
          const col = current % columns;
          const lastRowStart = (totalRows - 1) * columns;
          const targetIndex = lastRowStart + col;
          return Math.min(targetIndex, itemCount - 1);
        }
        return current;
      }
      return prev;
    });
  }, [itemCount, columns, wrap, totalRows]);

  const handleSelect = useCallback(() => {
    onSelect?.(selectedIndex);
  }, [selectedIndex, onSelect]);

  const handleEscape = useCallback(() => {
    onEscape?.();
  }, [onEscape]);

  // Notify onChange
  useEffect(() => {
    onChange?.(selectedIndex);
  }, [selectedIndex, onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveUp();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelect();
          break;
        case 'Escape':
          if (enableEscape) {
            e.preventDefault();
            handleEscape();
          }
          break;
        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedIndex(itemCount - 1);
          break;
      }
    },
    [moveRight, moveLeft, moveDown, moveUp, handleSelect, enableEscape, handleEscape, itemCount]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handlers: {
      onKeyDown: handleKeyDown,
    },
    moveRight,
    moveLeft,
    moveDown,
    moveUp,
  };
}

/**
 * Roving tabindex hook
 *
 * Only one item in a group is tabbable at a time.
 * Arrow keys move focus within the group.
 *
 * @example
 * ```tsx
 * const { getTabIndex, handlers, focusedIndex } = useRovingTabIndex({
 *   itemCount: tabs.length,
 * });
 *
 * {tabs.map((tab, i) => (
 *   <button
 *     key={i}
 *     tabIndex={getTabIndex(i)}
 *     ref={(el) => itemRefs.current[i] = el}
 *   >
 *     {tab.label}
 *   </button>
 * ))}
 * ```
 */
export interface UseRovingTabIndexOptions {
  /** Total number of items */
  itemCount: number;
  /** Initial focused index */
  initialIndex?: number;
  /** Orientation for arrow keys */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Wrap around at boundaries */
  wrap?: boolean;
}

export function useRovingTabIndex({
  itemCount,
  initialIndex = 0,
  orientation = 'horizontal',
  wrap = true,
}: UseRovingTabIndexOptions) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const focusItem = useCallback((index: number) => {
    setFocusedIndex(index);
    itemRefs.current[index]?.focus();
  }, []);

  const moveNext = useCallback(() => {
    const next = focusedIndex + 1;
    if (next >= itemCount) {
      if (wrap) {
        focusItem(0);
      }
    } else {
      focusItem(next);
    }
  }, [focusedIndex, itemCount, wrap, focusItem]);

  const movePrev = useCallback(() => {
    const prev = focusedIndex - 1;
    if (prev < 0) {
      if (wrap) {
        focusItem(itemCount - 1);
      }
    } else {
      focusItem(prev);
    }
  }, [focusedIndex, itemCount, wrap, focusItem]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      const isVertical = orientation === 'vertical' || orientation === 'both';

      switch (e.key) {
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault();
            movePrev();
          }
          break;
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault();
            movePrev();
          }
          break;
        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;
        case 'End':
          e.preventDefault();
          focusItem(itemCount - 1);
          break;
      }
    },
    [orientation, moveNext, movePrev, focusItem, itemCount]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === focusedIndex ? 0 : -1),
    [focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    getTabIndex,
    setItemRef,
    handlers: {
      onKeyDown: handleKeyDown,
    },
    itemRefs,
    focusItem,
  };
}

/**
 * Hotkey configuration
 */
export interface HotkeyConfig {
  /** Key combination (e.g., 'ctrl+s', 'escape', '/') */
  key: string;
  /** Handler function */
  handler: () => void;
  /** Description for help modal */
  description: string;
  /** Category for grouping in help modal */
  category?: string;
}

/**
 * Application hotkeys hook
 *
 * Registers global keyboard shortcuts with descriptions.
 *
 * @example
 * ```tsx
 * const { shortcuts } = useAppHotkeys([
 *   { key: '/', handler: () => focusSearch(), description: 'Focus search' },
 *   { key: 'escape', handler: () => closeLightbox(), description: 'Close lightbox' },
 * ]);
 * ```
 */
export function useAppHotkeys(config: HotkeyConfig[]) {
  const hotkeyDefinitions = config.map(
    ({ key, handler }) => [key, handler] as [string, () => void]
  );

  useHotkeys(hotkeyDefinitions);

  return {
    shortcuts: config,
  };
}

/**
 * Focus trap helper
 *
 * Traps focus within a container for modals and dialogs.
 * Note: Mantine provides useFocusTrap which should be preferred.
 * This is a lightweight alternative for custom use cases.
 */
export function useFocusManagement() {
  const containerRef = useRef<HTMLElement>(null);

  const focusFirst = useCallback(() => {
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0]?.focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
  };
}

export default useArrowNavigation;
