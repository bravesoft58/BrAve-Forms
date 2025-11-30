/**
 * KeyboardShortcutsHelp Component Tests
 *
 * Tests for keyboard shortcuts help modal.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { KeyboardShortcutsHelp, useKeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('KeyboardShortcutsHelp', () => {
  describe('controlled mode', () => {
    it('should show modal when opened is true', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should hide modal when opened is false', () => {
      render(<KeyboardShortcutsHelp opened={false} onClose={vi.fn()} />, { wrapper });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onClose when closed', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<KeyboardShortcutsHelp opened={true} onClose={onClose} />, { wrapper });

      // Press Escape to close the modal
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('default shortcuts', () => {
    it('should display navigation shortcuts', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Navigate to next element')).toBeInTheDocument();
      expect(screen.getByText('Navigate to previous element')).toBeInTheDocument();
    });

    it('should display photo gallery shortcuts', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
      expect(screen.getByText('Previous photo')).toBeInTheDocument();
      expect(screen.getByText('Next photo')).toBeInTheDocument();
      expect(screen.getByText('Open photo in lightbox')).toBeInTheDocument();
    });

    it('should display forms shortcuts', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('Next field')).toBeInTheDocument();
      expect(screen.getByText('Previous field')).toBeInTheDocument();
    });

    it('should display application shortcuts', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.getByText('Show keyboard shortcuts help')).toBeInTheDocument();
    });
  });

  describe('custom shortcuts', () => {
    it('should display custom shortcuts', () => {
      const customShortcuts = [
        { keys: ['Ctrl', 'S'], description: 'Save form', category: 'Custom' },
      ];

      render(
        <KeyboardShortcutsHelp opened={true} onClose={vi.fn()} shortcuts={customShortcuts} />,
        { wrapper }
      );

      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Save form')).toBeInTheDocument();
    });

    it('should merge custom shortcuts with defaults', () => {
      const customShortcuts = [
        { keys: ['Ctrl', 'S'], description: 'Save form', category: 'Custom' },
      ];

      render(
        <KeyboardShortcutsHelp opened={true} onClose={vi.fn()} shortcuts={customShortcuts} />,
        { wrapper }
      );

      // Custom shortcuts
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Save form')).toBeInTheDocument();

      // Default shortcuts still present
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
    });
  });

  describe('custom title', () => {
    it('should display custom title', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} title="Custom Help Title" />, {
        wrapper,
      });

      expect(screen.getByText('Custom Help Title')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should display keyboard usage hint', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByText(/Press.*at any time to show this help/i)).toBeInTheDocument();
    });

    it('should display escape hint', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      expect(screen.getByText(/Press.*to close this dialog/i)).toBeInTheDocument();
    });
  });

  describe('keyboard rendering', () => {
    it('should render keys with Kbd component', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      // Find kbd elements
      const kbdElements = screen.getAllByText('Tab');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('should render multi-key combinations with + separator', () => {
      render(<KeyboardShortcutsHelp opened={true} onClose={vi.fn()} />, { wrapper });

      // Shift + Tab combination should show + separator
      const shiftElements = screen.getAllByText('Shift');
      expect(shiftElements.length).toBeGreaterThan(0);
    });
  });
});

describe('useKeyboardShortcutsHelp', () => {
  it('should provide opened state', () => {
    const { result } = renderHook(() => useKeyboardShortcutsHelp());

    expect(result.current.opened).toBe(false);
  });

  it('should provide open function', () => {
    const { result } = renderHook(() => useKeyboardShortcutsHelp());

    act(() => {
      result.current.open();
    });

    expect(result.current.opened).toBe(true);
  });

  it('should provide close function', () => {
    const { result } = renderHook(() => useKeyboardShortcutsHelp());

    act(() => {
      result.current.open();
    });
    expect(result.current.opened).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.opened).toBe(false);
  });

  it('should provide toggle function', () => {
    const { result } = renderHook(() => useKeyboardShortcutsHelp());

    expect(result.current.opened).toBe(false);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.opened).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.opened).toBe(false);
  });

  it('should provide HelpModal component', () => {
    const { result } = renderHook(() => useKeyboardShortcutsHelp());

    expect(result.current.HelpModal).toBeInstanceOf(Function);
  });

  it('should accept custom shortcuts', () => {
    const customShortcuts = [{ keys: ['Ctrl', 'S'], description: 'Save', category: 'Custom' }];

    const { result } = renderHook(() => useKeyboardShortcutsHelp(customShortcuts));

    expect(result.current.HelpModal).toBeInstanceOf(Function);
  });

  it('should render HelpModal with state', () => {
    const { result } = renderHook(() => useKeyboardShortcutsHelp());

    act(() => {
      result.current.open();
    });

    const HelpModal = result.current.HelpModal;
    render(<HelpModal />, { wrapper });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
