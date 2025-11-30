/**
 * Accessibility Components
 *
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance.
 * Includes skip links, focus styles, screen reader announcements,
 * keyboard navigation, and testing utilities.
 */

// Skip Links
export { SkipLinks } from './SkipLinks';
export type { SkipLink, SkipLinksProps } from './SkipLinks';

// Focus Styles
export { FocusStyles, HighContrastFocusStyles } from './FocusStyles';
export type { FocusStyleConfig, FocusStylesProps } from './FocusStyles';

// Screen Reader Announcements
export {
  ScreenReaderAnnouncement,
  OperationStatusAnnouncement,
  NavigationAnnouncement,
  FormErrorAnnouncement,
  useAnnouncer,
} from './ScreenReaderAnnouncement';
export type {
  AnnouncementPoliteness,
  ScreenReaderAnnouncementProps,
  OperationStatusAnnouncementProps,
  NavigationAnnouncementProps,
  FormErrorAnnouncementProps,
} from './ScreenReaderAnnouncement';

// Keyboard Navigation
export {
  useArrowNavigation,
  useGridNavigation,
  useRovingTabIndex,
  useAppHotkeys,
  useFocusManagement,
} from './useKeyboardNavigation';
export type {
  UseArrowNavigationOptions,
  UseGridNavigationOptions,
  UseRovingTabIndexOptions,
  HotkeyConfig,
} from './useKeyboardNavigation';

// Keyboard Shortcuts Help
export { KeyboardShortcutsHelp, useKeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
export type { KeyboardShortcut, KeyboardShortcutsHelpProps } from './KeyboardShortcutsHelp';

// Accessibility Testing
export {
  runAccessibilityAudit,
  getAccessibilitySummary,
  hasCriticalViolations,
  formatViolations,
  logAccessibilityAudit,
  initializeA11yReporter,
  assertNoViolations,
  assertNoCriticalViolations,
} from './a11y-testing';
export type {
  AxeResults,
  Result,
  NodeResult,
  ViolationSeverity,
  ViolationReport,
  AuditSummary,
} from './a11y-testing';
