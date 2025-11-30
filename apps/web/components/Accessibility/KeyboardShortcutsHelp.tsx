'use client';

/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays available keyboard shortcuts in an accessible modal.
 * Can be triggered with '?' key (when not in an input field).
 *
 * WCAG 2.1 AA Compliance: 3.3.5 Help
 */

import { Modal, Stack, Group, Text, Kbd, Divider, Badge, Box, ScrollArea } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { IconKeyboard } from '@tabler/icons-react';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key or key combination to display */
  keys: string[];
  /** Description of the action */
  description: string;
  /** Category for grouping */
  category?: string;
}

export interface KeyboardShortcutsHelpProps {
  /** Whether the modal is open (controlled) */
  opened?: boolean;
  /** Callback when modal closes (controlled) */
  onClose?: () => void;
  /** Additional shortcuts to display */
  shortcuts?: KeyboardShortcut[];
  /** Modal title */
  title?: string;
}

/**
 * Default application shortcuts
 */
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { keys: ['Tab'], description: 'Navigate to next element', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Navigate to previous element', category: 'Navigation' },
  { keys: ['Enter'], description: 'Activate selected element', category: 'Navigation' },
  { keys: ['Space'], description: 'Activate button or toggle checkbox', category: 'Navigation' },
  { keys: ['Escape'], description: 'Close modal or cancel action', category: 'Navigation' },

  // Photo Gallery
  { keys: ['Arrow Left'], description: 'Previous photo', category: 'Photo Gallery' },
  { keys: ['Arrow Right'], description: 'Next photo', category: 'Photo Gallery' },
  { keys: ['Arrow Up'], description: 'Previous row', category: 'Photo Gallery' },
  { keys: ['Arrow Down'], description: 'Next row', category: 'Photo Gallery' },
  { keys: ['Enter'], description: 'Open photo in lightbox', category: 'Photo Gallery' },
  { keys: ['Escape'], description: 'Close lightbox', category: 'Photo Gallery' },
  { keys: ['Home'], description: 'Go to first photo', category: 'Photo Gallery' },
  { keys: ['End'], description: 'Go to last photo', category: 'Photo Gallery' },

  // Forms
  { keys: ['Tab'], description: 'Next field', category: 'Forms' },
  { keys: ['Shift', 'Tab'], description: 'Previous field', category: 'Forms' },
  { keys: ['Enter'], description: 'Submit form (when on submit button)', category: 'Forms' },
  { keys: ['Escape'], description: 'Cancel and close form', category: 'Forms' },

  // Application
  { keys: ['?'], description: 'Show keyboard shortcuts help', category: 'Application' },
];

/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts grouped by category.
 * Can be used as controlled or uncontrolled component.
 *
 * @example
 * ```tsx
 * // Uncontrolled - opens with '?' key
 * <KeyboardShortcutsHelp />
 *
 * // Controlled
 * const [opened, handlers] = useDisclosure();
 * <KeyboardShortcutsHelp
 *   opened={opened}
 *   onClose={handlers.close}
 *   shortcuts={customShortcuts}
 * />
 * ```
 */
export function KeyboardShortcutsHelp({
  opened: controlledOpened,
  onClose: controlledOnClose,
  shortcuts = [],
  title = 'Keyboard Shortcuts',
}: KeyboardShortcutsHelpProps) {
  const [uncontrolledOpened, { open, close }] = useDisclosure(false);

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpened !== undefined;
  const isOpen = isControlled ? controlledOpened : uncontrolledOpened;
  const handleClose = isControlled ? controlledOnClose : close;

  // Register '?' hotkey to open (only in uncontrolled mode)
  useHotkeys([
    [
      'shift+/',
      () => {
        // Don't trigger when typing in inputs
        const activeElement = document.activeElement;
        const isTyping =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute('contenteditable') === 'true';

        if (!isTyping && !isControlled) {
          open();
        }
      },
    ],
  ]);

  // Merge default and custom shortcuts
  const allShortcuts = [...DEFAULT_SHORTCUTS, ...shortcuts];

  // Group shortcuts by category
  const groupedShortcuts = allShortcuts.reduce<Record<string, KeyboardShortcut[]>>(
    (groups, shortcut) => {
      const category = shortcut.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    },
    {}
  );

  const categories = Object.keys(groupedShortcuts);

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose ?? (() => {})}
      title={
        <Group gap="xs">
          <IconKeyboard size={20} />
          <Text fw={600}>{title}</Text>
        </Group>
      }
      size="lg"
      aria-labelledby="keyboard-shortcuts-title"
      aria-describedby="keyboard-shortcuts-description"
    >
      <Text id="keyboard-shortcuts-description" size="sm" c="dimmed" mb="md">
        Use these keyboard shortcuts to navigate the application efficiently. Press{' '}
        <Kbd size="xs">?</Kbd> at any time to show this help.
      </Text>

      <ScrollArea.Autosize mah={400}>
        <Stack gap="lg">
          {categories.map((category, categoryIndex) => (
            <Box key={category}>
              <Group gap="xs" mb="xs">
                <Badge variant="light" size="sm">
                  {category}
                </Badge>
              </Group>

              <Stack gap="xs">
                {groupedShortcuts[category].map((shortcut, index) => (
                  <Group
                    key={`${category}-${index}`}
                    justify="space-between"
                    wrap="nowrap"
                    style={{ minHeight: 36 }}
                  >
                    <Text size="sm" style={{ flex: 1 }}>
                      {shortcut.description}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <Kbd size="sm">{key}</Kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <Text component="span" size="xs" c="dimmed" mx={4}>
                              +
                            </Text>
                          )}
                        </span>
                      ))}
                    </Group>
                  </Group>
                ))}
              </Stack>

              {categoryIndex < categories.length - 1 && <Divider mt="md" />}
            </Box>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      <Divider my="md" />

      <Text size="xs" c="dimmed" ta="center">
        Press <Kbd size="xs">Escape</Kbd> to close this dialog
      </Text>
    </Modal>
  );
}

/**
 * Hook to get keyboard shortcuts help disclosure
 *
 * @example
 * ```tsx
 * const { opened, open, close, toggle, HelpModal } = useKeyboardShortcutsHelp();
 *
 * <Button onClick={open}>Show Shortcuts</Button>
 * <HelpModal />
 * ```
 */
export function useKeyboardShortcutsHelp(customShortcuts?: KeyboardShortcut[]) {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  const HelpModal = () => (
    <KeyboardShortcutsHelp opened={opened} onClose={close} shortcuts={customShortcuts} />
  );

  return {
    opened,
    open,
    close,
    toggle,
    HelpModal,
  };
}

export default KeyboardShortcutsHelp;
