'use client';

/**
 * Screen Reader Announcement Component
 *
 * Provides accessible announcements for screen reader users.
 * Uses ARIA live regions to announce dynamic content changes.
 *
 * WCAG 2.1 AA Compliance: 4.1.3 Status Messages
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { VisuallyHidden } from '@mantine/core';

export type AnnouncementPoliteness = 'polite' | 'assertive' | 'off';

export interface ScreenReaderAnnouncementProps {
  /** Message to announce (changing this triggers announcement) */
  message: string;
  /** Politeness level - 'assertive' for critical, 'polite' for non-urgent */
  politeness?: AnnouncementPoliteness;
  /** Whether to clear message after announcement */
  clearAfterAnnounce?: boolean;
  /** Delay before clearing (ms) */
  clearDelay?: number;
}

/**
 * Screen Reader Announcement
 *
 * Announces messages to screen readers using ARIA live regions.
 * Assertive announcements interrupt current speech.
 * Polite announcements wait for current speech to finish.
 *
 * @example
 * ```tsx
 * const [announcement, setAnnouncement] = useState('');
 *
 * // On form submit
 * setAnnouncement('Form submitted successfully');
 *
 * <ScreenReaderAnnouncement message={announcement} />
 * ```
 */
export function ScreenReaderAnnouncement({
  message,
  politeness = 'polite',
  clearAfterAnnounce = true,
  clearDelay = 1000,
}: ScreenReaderAnnouncementProps) {
  const [currentMessage, setCurrentMessage] = useState(message);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearAfterAnnounce) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearDelay);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfterAnnounce, clearDelay]);

  return (
    <VisuallyHidden>
      <div role="status" aria-live={politeness} aria-atomic="true">
        {currentMessage}
      </div>
    </VisuallyHidden>
  );
}

/**
 * Operation Status Announcement Props
 */
export interface OperationStatusAnnouncementProps {
  /** Current operation status */
  status: 'idle' | 'loading' | 'success' | 'error';
  /** Custom messages for each status */
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };
}

/**
 * Operation Status Announcement
 *
 * Pre-configured announcer for common async operations.
 *
 * @example
 * ```tsx
 * const { status } = useQuery(...);
 *
 * <OperationStatusAnnouncement
 *   status={status}
 *   messages={{
 *     loading: 'Loading photos...',
 *     success: 'Photos loaded',
 *     error: 'Failed to load photos',
 *   }}
 * />
 * ```
 */
export function OperationStatusAnnouncement({
  status,
  messages = {},
}: OperationStatusAnnouncementProps) {
  const defaultMessages = {
    loading: 'Loading...',
    success: 'Operation completed successfully',
    error: 'Operation failed. Please try again.',
  };

  const getMessage = () => {
    switch (status) {
      case 'loading':
        return messages.loading || defaultMessages.loading;
      case 'success':
        return messages.success || defaultMessages.success;
      case 'error':
        return messages.error || defaultMessages.error;
      default:
        return '';
    }
  };

  const message = getMessage();
  const politeness: AnnouncementPoliteness = status === 'error' ? 'assertive' : 'polite';

  return <ScreenReaderAnnouncement message={message} politeness={politeness} />;
}

/**
 * Hook for programmatic announcements
 *
 * @example
 * ```tsx
 * const { announce, Announcer } = useAnnouncer();
 *
 * const handleSave = async () => {
 *   announce('Saving...', 'polite');
 *   await save();
 *   announce('Saved successfully', 'polite');
 * };
 *
 * return (
 *   <>
 *     <Announcer />
 *     <button onClick={handleSave}>Save</button>
 *   </>
 * );
 * ```
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: AnnouncementPoliteness;
  }>({ message: '', politeness: 'polite' });

  const announce = useCallback((message: string, politeness: AnnouncementPoliteness = 'polite') => {
    // Force re-announcement by clearing first
    setAnnouncement({ message: '', politeness });
    // Use microtask to ensure state update
    queueMicrotask(() => {
      setAnnouncement({ message, politeness });
    });
  }, []);

  const Announcer = useCallback(
    () => (
      <ScreenReaderAnnouncement
        message={announcement.message}
        politeness={announcement.politeness}
      />
    ),
    [announcement.message, announcement.politeness]
  );

  return { announce, Announcer };
}

/**
 * Navigation Announcement Props
 */
export interface NavigationAnnouncementProps {
  /** Current page or section title */
  pageTitle: string;
}

/**
 * Navigation Announcement
 *
 * Announces page changes to screen readers.
 * Use when client-side navigation occurs.
 *
 * @example
 * ```tsx
 * // In page component
 * <NavigationAnnouncement pageTitle="Photo Gallery" />
 * ```
 */
export function NavigationAnnouncement({ pageTitle }: NavigationAnnouncementProps) {
  return <ScreenReaderAnnouncement message={`Navigated to ${pageTitle}`} politeness="polite" />;
}

/**
 * Form Error Announcement Props
 */
export interface FormErrorAnnouncementProps {
  /** Number of form errors */
  errorCount: number;
  /** Custom message format */
  messageFormat?: (count: number) => string;
}

/**
 * Form Error Announcement
 *
 * Announces form validation errors to screen readers.
 *
 * @example
 * ```tsx
 * const errors = Object.keys(form.formState.errors).length;
 *
 * <FormErrorAnnouncement errorCount={errors} />
 * ```
 */
export function FormErrorAnnouncement({ errorCount, messageFormat }: FormErrorAnnouncementProps) {
  const defaultFormat = (count: number) =>
    count === 0
      ? ''
      : `Form has ${count} validation ${count === 1 ? 'error' : 'errors'}. Please correct and try again.`;

  const message = messageFormat ? messageFormat(errorCount) : defaultFormat(errorCount);

  return <ScreenReaderAnnouncement message={message} politeness="assertive" />;
}

export default ScreenReaderAnnouncement;
