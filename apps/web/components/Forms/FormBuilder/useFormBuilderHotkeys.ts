'use client';

import { useHotkeys } from '@mantine/hooks';
import { useSnapshot } from 'valtio';
import {
  formBuilderStore,
  undo,
  redo,
  canUndo,
  canRedo,
  removeField,
  duplicateField,
  selectField,
  togglePreviewMode,
} from '@/lib/stores/form-builder-store';

/**
 * Callback for save action (to be provided by parent component)
 */
export type SaveCallback = () => void;

/**
 * Keyboard shortcuts for the Form Builder
 *
 * Shortcuts:
 * - Ctrl+S / Cmd+S: Save form
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Cmd+Y: Redo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo (alternative)
 * - Ctrl+P / Cmd+P: Toggle preview
 * - Delete / Backspace: Delete selected field
 * - Ctrl+D / Cmd+D: Duplicate selected field
 * - Escape: Deselect field
 */
export function useFormBuilderHotkeys(onSave?: SaveCallback): void {
  const snap = useSnapshot(formBuilderStore);

  useHotkeys([
    // Save form
    [
      'mod+S',
      (event) => {
        event.preventDefault();
        if (onSave) {
          onSave();
        }
      },
    ],

    // Undo
    [
      'mod+Z',
      (event) => {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      },
    ],

    // Redo (Ctrl+Y or Cmd+Y)
    [
      'mod+Y',
      (event) => {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      },
    ],

    // Redo alternative (Ctrl+Shift+Z or Cmd+Shift+Z)
    [
      'mod+shift+Z',
      (event) => {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      },
    ],

    // Toggle preview mode
    [
      'mod+P',
      (event) => {
        event.preventDefault();
        togglePreviewMode();
      },
    ],

    // Delete selected field
    [
      'Delete',
      () => {
        if (snap.selectedFieldId && !isEditingText()) {
          removeField(snap.selectedFieldId);
        }
      },
    ],

    // Delete selected field (alternative)
    [
      'Backspace',
      () => {
        if (snap.selectedFieldId && !isEditingText()) {
          removeField(snap.selectedFieldId);
        }
      },
    ],

    // Duplicate selected field
    [
      'mod+D',
      (event) => {
        event.preventDefault();
        if (snap.selectedFieldId) {
          duplicateField(snap.selectedFieldId);
        }
      },
    ],

    // Deselect field
    [
      'Escape',
      () => {
        selectField(null);
      },
    ],
  ]);
}

/**
 * Check if user is currently editing text in an input or textarea
 * Returns true if focus is on a text input element
 */
function isEditingText(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') {
    return true;
  }

  // Check for contenteditable
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

/**
 * Hook to get keyboard shortcut hints for display
 */
export function useShortcutHints(): ShortcutHint[] {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? 'Cmd' : 'Ctrl';

  return [
    { keys: `${mod}+S`, description: 'Save form' },
    { keys: `${mod}+Z`, description: 'Undo' },
    { keys: `${mod}+Y`, description: 'Redo' },
    { keys: `${mod}+P`, description: 'Toggle preview' },
    { keys: `${mod}+D`, description: 'Duplicate field' },
    { keys: 'Delete', description: 'Delete selected field' },
    { keys: 'Escape', description: 'Deselect field' },
  ];
}

export interface ShortcutHint {
  keys: string;
  description: string;
}

export default useFormBuilderHotkeys;
