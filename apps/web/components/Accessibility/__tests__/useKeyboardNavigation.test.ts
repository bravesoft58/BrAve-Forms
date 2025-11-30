/**
 * Keyboard Navigation Hooks Tests
 *
 * Tests for arrow navigation, grid navigation, and roving tabindex hooks.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArrowNavigation, useGridNavigation, useRovingTabIndex } from '../useKeyboardNavigation';

describe('useArrowNavigation', () => {
  describe('initialization', () => {
    it('should initialize with default index 0', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5 }));

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should initialize with custom initial index', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, initialIndex: 2 }));

      expect(result.current.selectedIndex).toBe(2);
    });
  });

  describe('horizontal navigation', () => {
    it('should move right on ArrowRight', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should move left on ArrowLeft', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, initialIndex: 2 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should wrap around at end when wrap is true', () => {
      const { result } = renderHook(() =>
        useArrowNavigation({ itemCount: 3, initialIndex: 2, wrap: true })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should wrap around at start when wrap is true', () => {
      const { result } = renderHook(() =>
        useArrowNavigation({ itemCount: 3, initialIndex: 0, wrap: true })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(2);
    });

    it('should not wrap when wrap is false', () => {
      const { result } = renderHook(() =>
        useArrowNavigation({ itemCount: 3, initialIndex: 2, wrap: false })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(2);
    });

    it('should not navigate horizontally when horizontal is false', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, horizontal: false }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe('vertical navigation', () => {
    it('should move down on ArrowDown', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should move up on ArrowUp', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, initialIndex: 2 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should not navigate vertically when vertical is false', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, vertical: false }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe('selection', () => {
    it('should call onSelect on Enter', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation({ itemCount: 5, initialIndex: 2, onSelect })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onSelect).toHaveBeenCalledWith(2);
    });

    it('should call onSelect on Space', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation({ itemCount: 5, initialIndex: 3, onSelect })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: ' ',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onSelect).toHaveBeenCalledWith(3);
    });
  });

  describe('escape handling', () => {
    it('should call onEscape on Escape', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, onEscape }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onEscape).toHaveBeenCalled();
    });

    it('should not call onEscape when enableEscape is false', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation({ itemCount: 5, enableEscape: false, onEscape })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('home/end navigation', () => {
    it('should go to first item on Home', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, initialIndex: 3 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'Home',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should go to last item on End', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, initialIndex: 1 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'End',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(4);
    });
  });

  describe('onChange callback', () => {
    it('should call onChange when selection changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, onChange }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('helper functions', () => {
    it('should provide moveNext function', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5 }));

      act(() => {
        result.current.moveNext();
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should provide movePrev function', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5, initialIndex: 2 }));

      act(() => {
        result.current.movePrev();
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should provide setSelectedIndex function', () => {
      const { result } = renderHook(() => useArrowNavigation({ itemCount: 5 }));

      act(() => {
        result.current.setSelectedIndex(3);
      });

      expect(result.current.selectedIndex).toBe(3);
    });
  });
});

describe('useGridNavigation', () => {
  describe('initialization', () => {
    it('should initialize with default index 0', () => {
      const { result } = renderHook(() => useGridNavigation({ itemCount: 12, columns: 4 }));

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should initialize with custom initial index', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 5 })
      );

      expect(result.current.selectedIndex).toBe(5);
    });
  });

  describe('horizontal navigation', () => {
    it('should move right on ArrowRight', () => {
      const { result } = renderHook(() => useGridNavigation({ itemCount: 12, columns: 4 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should move left on ArrowLeft', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 5 })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(4);
    });
  });

  describe('vertical navigation', () => {
    it('should move down by column count on ArrowDown', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 1 })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(5);
    });

    it('should move up by column count on ArrowUp', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 5 })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should stay in place at bottom row without wrap', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 9, wrap: false })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(9);
    });

    it('should stay in place at top row without wrap', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 2, wrap: false })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.selectedIndex).toBe(2);
    });
  });

  describe('helper functions', () => {
    it('should provide moveRight function', () => {
      const { result } = renderHook(() => useGridNavigation({ itemCount: 12, columns: 4 }));

      act(() => {
        result.current.moveRight();
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should provide moveLeft function', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 5 })
      );

      act(() => {
        result.current.moveLeft();
      });

      expect(result.current.selectedIndex).toBe(4);
    });

    it('should provide moveDown function', () => {
      const { result } = renderHook(() => useGridNavigation({ itemCount: 12, columns: 4 }));

      act(() => {
        result.current.moveDown();
      });

      expect(result.current.selectedIndex).toBe(4);
    });

    it('should provide moveUp function', () => {
      const { result } = renderHook(() =>
        useGridNavigation({ itemCount: 12, columns: 4, initialIndex: 5 })
      );

      act(() => {
        result.current.moveUp();
      });

      expect(result.current.selectedIndex).toBe(1);
    });
  });
});

describe('useRovingTabIndex', () => {
  describe('initialization', () => {
    it('should initialize with default focused index 0', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));

      expect(result.current.focusedIndex).toBe(0);
    });

    it('should initialize with custom initial index', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5, initialIndex: 2 }));

      expect(result.current.focusedIndex).toBe(2);
    });
  });

  describe('tabIndex calculation', () => {
    it('should return 0 for focused item', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5, initialIndex: 2 }));

      expect(result.current.getTabIndex(2)).toBe(0);
    });

    it('should return -1 for non-focused items', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5, initialIndex: 2 }));

      expect(result.current.getTabIndex(0)).toBe(-1);
      expect(result.current.getTabIndex(1)).toBe(-1);
      expect(result.current.getTabIndex(3)).toBe(-1);
      expect(result.current.getTabIndex(4)).toBe(-1);
    });
  });

  describe('horizontal navigation', () => {
    it('should move focus right on ArrowRight when horizontal', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5, orientation: 'horizontal' })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(1);
    });

    it('should not move on ArrowDown when horizontal', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5, orientation: 'horizontal' })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });
  });

  describe('vertical navigation', () => {
    it('should move focus down on ArrowDown when vertical', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5, orientation: 'vertical' })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(1);
    });

    it('should not move on ArrowRight when vertical', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5, orientation: 'vertical' })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });
  });

  describe('both orientation', () => {
    it('should respond to all arrow keys when orientation is both', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5, orientation: 'both' }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });
      expect(result.current.focusedIndex).toBe(1);

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });
      expect(result.current.focusedIndex).toBe(2);
    });
  });

  describe('home/end navigation', () => {
    it('should focus first item on Home', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5, initialIndex: 3 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'Home',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it('should focus last item on End', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5, initialIndex: 1 }));

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'End',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(4);
    });
  });

  describe('wrap behavior', () => {
    it('should wrap to first when moving past last', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, initialIndex: 2, wrap: true })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it('should wrap to last when moving before first', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, initialIndex: 0, wrap: true })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(2);
    });

    it('should not wrap when wrap is false', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, initialIndex: 2, wrap: false })
      );

      act(() => {
        result.current.handlers.onKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.focusedIndex).toBe(2);
    });
  });

  describe('helper functions', () => {
    it('should provide setItemRef function', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));

      expect(result.current.setItemRef).toBeInstanceOf(Function);
    });

    it('should provide focusItem function', () => {
      const { result } = renderHook(() => useRovingTabIndex({ itemCount: 5 }));

      act(() => {
        result.current.focusItem(3);
      });

      expect(result.current.focusedIndex).toBe(3);
    });
  });
});
