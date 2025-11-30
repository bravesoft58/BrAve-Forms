/**
 * Accessibility Testing Utilities
 *
 * Provides runtime accessibility checks and test helpers.
 * Uses axe-core for automated accessibility auditing.
 */

import type { AxeResults, Result, NodeResult } from 'axe-core';

// Re-export types for convenience
export type { AxeResults, Result, NodeResult };

/**
 * Accessibility violation severity
 */
export type ViolationSeverity = 'minor' | 'moderate' | 'serious' | 'critical';

/**
 * Simplified violation report
 */
export interface ViolationReport {
  id: string;
  impact: ViolationSeverity;
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    html: string;
    target: string[];
    failureSummary: string;
  }[];
}

/**
 * Audit result summary
 */
export interface AuditSummary {
  passed: number;
  failed: number;
  incomplete: number;
  violations: ViolationReport[];
  inapplicable: number;
}

/**
 * Run axe accessibility audit on the current page
 *
 * NOTE: This function dynamically imports axe-core to keep it out of
 * production bundles. Only use in development or test environments.
 *
 * @example
 * ```tsx
 * // In a test file
 * it('should have no accessibility violations', async () => {
 *   render(<MyComponent />);
 *   const results = await runAccessibilityAudit();
 *   expect(results.violations).toHaveLength(0);
 * });
 * ```
 */
export async function runAccessibilityAudit(
  context?: Element | Document | string
): Promise<AxeResults> {
  try {
    const axe = await import('axe-core');
    const target = context || document;

    // Configure axe
    axe.default.configure({
      rules: [
        // Ensure color contrast meets WCAG AA
        { id: 'color-contrast', enabled: true },
        // Ensure all images have alt text
        { id: 'image-alt', enabled: true },
        // Ensure form inputs have labels
        { id: 'label', enabled: true },
        // Ensure buttons have accessible names
        { id: 'button-name', enabled: true },
        // Ensure links have accessible names
        { id: 'link-name', enabled: true },
      ],
    });

    return await axe.default.run(target as Document);
  } catch (error) {
    const contextStr = context ? String(context) : 'document';
    throw new Error(
      `Accessibility audit failed for context ${contextStr}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Run accessibility audit and return simplified summary
 *
 * @example
 * ```tsx
 * const summary = await getAccessibilitySummary();
 * console.log(`Passed: ${summary.passed}, Failed: ${summary.failed}`);
 * ```
 */
export async function getAccessibilitySummary(
  context?: Element | Document | string
): Promise<AuditSummary> {
  const results = await runAccessibilityAudit(context);

  const violations: ViolationReport[] = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact as ViolationSeverity,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node) => ({
      html: node.html,
      target: node.target as string[],
      failureSummary: node.failureSummary || '',
    })),
  }));

  return {
    passed: results.passes.length,
    failed: results.violations.length,
    incomplete: results.incomplete.length,
    violations,
    inapplicable: results.inapplicable.length,
  };
}

/**
 * Check if there are any critical or serious violations
 *
 * @example
 * ```tsx
 * const hasCritical = await hasCriticalViolations();
 * if (hasCritical) {
 *   console.error('Critical accessibility issues found!');
 * }
 * ```
 */
export async function hasCriticalViolations(
  context?: Element | Document | string
): Promise<boolean> {
  const summary = await getAccessibilitySummary(context);

  return summary.violations.some((v) => v.impact === 'critical' || v.impact === 'serious');
}

/**
 * Format violations for console output
 */
export function formatViolations(violations: ViolationReport[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found.';
  }

  const lines: string[] = [`Found ${violations.length} accessibility violation(s):`, ''];

  violations.forEach((violation, index) => {
    lines.push(`${index + 1}. [${violation.impact.toUpperCase()}] ${violation.help}`);
    lines.push(`   Rule: ${violation.id}`);
    lines.push(`   Description: ${violation.description}`);
    lines.push(`   Help: ${violation.helpUrl}`);
    lines.push(`   Affected elements:`);

    violation.nodes.forEach((node) => {
      lines.push(`   - ${node.target.join(' > ')}`);
      lines.push(`     HTML: ${node.html.slice(0, 100)}${node.html.length > 100 ? '...' : ''}`);
      if (node.failureSummary) {
        lines.push(`     Fix: ${node.failureSummary.split('\n')[0]}`);
      }
    });

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Log accessibility audit results to console
 *
 * @example
 * ```tsx
 * // In development, run after component mounts
 * useEffect(() => {
 *   if (process.env.NODE_ENV === 'development') {
 *     logAccessibilityAudit();
 *   }
 * }, []);
 * ```
 */
export async function logAccessibilityAudit(context?: Element | Document | string): Promise<void> {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const summary = await getAccessibilitySummary(context);

  /* eslint-disable no-console */
  console.group('Accessibility Audit Results');
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Incomplete: ${summary.incomplete}`);
  console.log(`Inapplicable: ${summary.inapplicable}`);

  if (summary.violations.length > 0) {
    console.warn(formatViolations(summary.violations));
  } else {
    console.log('No violations found!');
  }
  console.groupEnd();
  /* eslint-enable no-console */
}

/**
 * Development-only accessibility reporter component setup
 *
 * Automatically logs accessibility issues in development.
 * Should be called once during app initialization.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx or _app.tsx
 * if (process.env.NODE_ENV === 'development') {
 *   initializeA11yReporter();
 * }
 * ```
 */
export async function initializeA11yReporter(delayMs = 1000): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Wait for DOM to be ready
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // Import and configure @axe-core/react for runtime checks
  try {
    const [axeReact, React, ReactDOM] = await Promise.all([
      import('@axe-core/react'),
      import('react'),
      import('react-dom'),
    ]);

    axeReact.default(React, ReactDOM, 1000);
    /* eslint-disable no-console */
    console.log('Accessibility reporter initialized');
    /* eslint-enable no-console */
  } catch (error) {
    /* eslint-disable no-console */
    console.warn('Failed to initialize accessibility reporter:', error);
    /* eslint-enable no-console */
  }
}

/**
 * Test helper: Assert no accessibility violations
 *
 * Throws an error if violations are found.
 *
 * @example
 * ```tsx
 * // In a test file
 * it('should be accessible', async () => {
 *   render(<MyComponent />);
 *   await assertNoViolations();
 * });
 * ```
 */
export async function assertNoViolations(context?: Element | Document | string): Promise<void> {
  const summary = await getAccessibilitySummary(context);

  if (summary.violations.length > 0) {
    throw new Error(`Accessibility violations found:\n${formatViolations(summary.violations)}`);
  }
}

/**
 * Test helper: Assert no critical violations
 *
 * Allows minor/moderate issues but fails on serious/critical.
 *
 * @example
 * ```tsx
 * // In a test file (more lenient)
 * it('should have no critical accessibility issues', async () => {
 *   render(<MyComponent />);
 *   await assertNoCriticalViolations();
 * });
 * ```
 */
export async function assertNoCriticalViolations(
  context?: Element | Document | string
): Promise<void> {
  const hasCritical = await hasCriticalViolations(context);

  if (hasCritical) {
    const summary = await getAccessibilitySummary(context);
    const criticalViolations = summary.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    throw new Error(
      `Critical accessibility violations found:\n${formatViolations(criticalViolations)}`
    );
  }
}

export default runAccessibilityAudit;
