# ISSUE-143: Accessibility & Keyboard Navigation (4h)

**Priority:** P1
**Phase:** Phase 4 - Polish & Testing
**Estimated Hours:** 4
**Dependencies:** Phase 1, 2, 3 complete
**Sprint:** Sprint 5

---

## Objective

Implement comprehensive accessibility features and keyboard navigation for all Sprint 5 features to ensure WCAG 2.1 AA compliance and support field workers using assistive technologies.

## Tasks

- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation for photo gallery
- [ ] Implement keyboard navigation for sync queue
- [ ] Implement keyboard navigation for settings forms
- [ ] Add focus visible styles for all focusable elements
- [ ] Implement skip links for main content areas
- [ ] Add screen reader announcements for async operations
- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Run axe accessibility audit and fix all issues
- [ ] Add unit tests for keyboard navigation

## Technical Details

**Libraries/Dependencies:**

- @mantine/hooks (useFocusTrap, useFocusWithin)
- axe-core (accessibility testing)
- @axe-core/react (runtime accessibility checks)
- React ARIA (advanced accessibility patterns)

**Code Example:**

```typescript
'use client';

import { useRef, useEffect } from 'react';
import { useFocusTrap, useFocusWithin, useHotkeys } from '@mantine/hooks';
import { VisuallyHidden } from '@mantine/core';

// Skip Links Component
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>

      <style jsx>{`
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: var(--mantine-color-blue-6);
          color: white;
          padding: 8px;
          z-index: 100;
        }
        .skip-link:focus {
          top: 0;
        }
      `}</style>
    </div>
  );
}

// Photo Gallery with Keyboard Navigation
export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Arrow key navigation
  useHotkeys([
    ['ArrowRight', () => setSelectedIndex(i => Math.min(i + 1, photos.length - 1))],
    ['ArrowLeft', () => setSelectedIndex(i => Math.max(i - 1, 0))],
    ['Enter', () => setLightboxOpen(true)],
    ['Escape', () => setLightboxOpen(false)],
  ]);

  return (
    <div role="region" aria-label="Photo gallery">
      <VisuallyHidden>
        <div aria-live="polite" aria-atomic="true">
          Viewing photo {selectedIndex + 1} of {photos.length}
        </div>
      </VisuallyHidden>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            withBorder
            tabIndex={0}
            role="button"
            aria-label={`Photo ${index + 1}: ${photo.description}`}
            data-selected={index === selectedIndex}
            onClick={() => {
              setSelectedIndex(index);
              setLightboxOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightboxOpen(true);
              }
            }}
            style={{
              outline: index === selectedIndex ? '2px solid var(--mantine-color-blue-6)' : 'none',
              outlineOffset: '2px',
            }}
          >
            <img src={photo.url} alt={photo.description} />
          </Card>
        ))}
      </SimpleGrid>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={selectedIndex}
        slides={photos}
      />
    </div>
  );
}

// Modal with Focus Trap
export function AccessibleModal({ opened, onClose, children }: ModalProps) {
  const focusTrapRef = useFocusTrap(opened);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      ref={focusTrapRef}
      closeOnEscape
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">Modal Title</h2>
      <div id="modal-description">{children}</div>
    </Modal>
  );
}

// Form with Accessible Error Messages
export function AccessibleForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  const errorAnnouncement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Announce errors to screen readers
    if (Object.keys(form.formState.errors).length > 0) {
      const errorCount = Object.keys(form.formState.errors).length;
      errorAnnouncement.current!.textContent =
        `Form has ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'}`;
    }
  }, [form.formState.errors]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <VisuallyHidden>
        <div ref={errorAnnouncement} role="alert" aria-live="assertive" />
      </VisuallyHidden>

      <TextInput
        label="First Name"
        {...form.register('firstName')}
        error={form.formState.errors.firstName?.message}
        aria-invalid={!!form.formState.errors.firstName}
        aria-describedby={form.formState.errors.firstName ? 'firstName-error' : undefined}
      />
      {form.formState.errors.firstName && (
        <Text id="firstName-error" size="sm" c="red" role="alert">
          {form.formState.errors.firstName.message}
        </Text>
      )}

      <Button type="submit" aria-label="Submit form">
        Submit
      </Button>
    </form>
  );
}

// Sync Queue with Accessible Table
export function SyncQueueTable({ items }: { items: SyncQueueItem[] }) {
  return (
    <div role="region" aria-label="Sync queue" aria-live="polite">
      <VisuallyHidden>
        <div aria-live="polite" aria-atomic="true">
          {items.length} {items.length === 1 ? 'item' : 'items'} in sync queue
        </div>
      </VisuallyHidden>

      <table role="table" aria-label="Sync queue items">
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.type}</td>
              <td>
                <span
                  role="status"
                  aria-label={`Status: ${item.status}`}
                >
                  {item.status}
                </span>
              </td>
              <td>{item.priority}</td>
              <td>
                <Button
                  size="xs"
                  aria-label={`Retry ${item.type}`}
                  onClick={() => retrySync(item.id)}
                >
                  Retry
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Loading State Announcements
export function AsyncOperationAnnouncement({ status }: { status: 'loading' | 'success' | 'error' }) {
  return (
    <VisuallyHidden>
      <div role="status" aria-live="polite" aria-atomic="true">
        {status === 'loading' && 'Loading...'}
        {status === 'success' && 'Operation completed successfully'}
        {status === 'error' && 'Operation failed. Please try again.'}
      </div>
    </VisuallyHidden>
  );
}

// Focus Visible Styles (global CSS)
const focusVisibleStyles = `
  /* Remove default outline */
  *:focus {
    outline: none;
  }

  /* Add custom focus visible outline */
  *:focus-visible {
    outline: 2px solid var(--mantine-color-blue-6);
    outline-offset: 2px;
  }

  /* Button focus visible */
  button:focus-visible {
    outline: 2px solid var(--mantine-color-blue-6);
    outline-offset: 2px;
  }

  /* Link focus visible */
  a:focus-visible {
    outline: 2px solid var(--mantine-color-blue-6);
    outline-offset: 2px;
  }

  /* Input focus visible */
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--mantine-color-blue-6);
    outline-offset: -2px;
  }
`;

// Accessibility Testing Helper
export function runAccessibilityAudit() {
  if (process.env.NODE_ENV === 'development') {
    import('@axe-core/react').then(axe => {
      axe.default(React, ReactDOM, 1000);
    });
  }
}

// Keyboard Shortcuts Help Modal
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: 'Arrow Left/Right', description: 'Navigate photos' },
    { key: 'Enter', description: 'Open selected photo' },
    { key: 'Escape', description: 'Close lightbox' },
    { key: 'Tab', description: 'Navigate between elements' },
    { key: 'Shift + Tab', description: 'Navigate backwards' },
    { key: '/', description: 'Focus search input' },
  ];

  return (
    <Modal opened={true} onClose={() => {}}>
      <Stack>
        <Text size="lg" fw={600}>Keyboard Shortcuts</Text>
        {shortcuts.map(shortcut => (
          <Group key={shortcut.key} justify="space-between">
            <kbd style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px' }}>
              {shortcut.key}
            </kbd>
            <Text size="sm">{shortcut.description}</Text>
          </Group>
        ))}
      </Stack>
    </Modal>
  );
}
```

## Acceptance Criteria

- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for all features
- [ ] Focus visible styles applied to all focusable elements
- [ ] Skip links functional
- [ ] Screen reader announcements for async operations
- [ ] axe accessibility audit passes with 0 violations
- [ ] Tested with NVDA/JAWS/VoiceOver screen readers
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard shortcuts help modal available

## Testing Requirements

**Unit Tests:**

- Test keyboard navigation handlers
- Test ARIA label generation
- Test focus trap in modals

**Integration Tests:**

- Run axe-core accessibility tests
- Test screen reader announcements
- Test skip links navigation

**Manual Testing:**

- Navigate entire app using only keyboard
- Test with NVDA screen reader (Windows)
- Test with JAWS screen reader (Windows)
- Test with VoiceOver screen reader (macOS/iOS)
- Verify all interactive elements reachable
- Verify all form errors announced

## Evidence Requirements

- [ ] Screenshot: axe DevTools audit with 0 violations
- [ ] Screenshot: Focus visible styles demonstration
- [ ] Video: Keyboard navigation walkthrough
- [ ] Video: Screen reader walkthrough (NVDA/VoiceOver)
- [ ] Test Results: Accessibility tests (>80% coverage)

## Success Criteria

Accessibility is complete when:

- axe audit passes with 0 violations
- All features keyboard navigable
- Screen reader compatible
- WCAG 2.1 AA compliant
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
