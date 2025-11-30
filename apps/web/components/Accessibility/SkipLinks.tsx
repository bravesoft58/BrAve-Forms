'use client';

/**
 * Skip Links Component
 *
 * Provides keyboard-accessible skip links for navigation.
 * These links are visually hidden until focused, allowing keyboard
 * users to bypass repetitive navigation elements.
 *
 * WCAG 2.1 AA Compliance: 2.4.1 Bypass Blocks
 *
 * CONSTRUCTION SITE: 56px minimum touch target for glove use.
 * OFFLINE: Fully functional offline with inline color fallbacks.
 * MULTI-TENANT: Safe - no cross-tenant data exposure.
 */

import { Box, Anchor } from '@mantine/core';

export interface SkipLink {
  /** Target element ID (without #) */
  targetId: string;
  /** Link text displayed when focused */
  label: string;
}

export interface SkipLinksProps {
  /** Custom skip links configuration */
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { targetId: 'main-content', label: 'Skip to main content' },
  { targetId: 'navigation', label: 'Skip to navigation' },
];

/**
 * Skip Links for keyboard navigation
 *
 * Place at the very top of the page layout.
 * Target elements must have matching id attributes.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <SkipLinks />
 * <nav id="navigation">...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLinks({ links = DEFAULT_LINKS }: SkipLinksProps) {
  return (
    <Box
      component="nav"
      aria-label="Skip links"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {links.map((link) => (
        <Anchor
          key={link.targetId}
          href={`#${link.targetId}`}
          style={{
            position: 'absolute',
            top: '-100px',
            left: '16px',
            padding: '16px 20px',
            // Offline fallbacks: inline colors for when CSS variables unavailable
            backgroundColor: 'var(--mantine-color-blue-6, #228be6)',
            color: 'var(--mantine-color-white, #ffffff)',
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: '4px',
            zIndex: 9999,
            // 56px minimum for glove-friendly construction site use
            minHeight: '56px',
            minWidth: '56px',
            display: 'flex',
            alignItems: 'center',
            transition: 'top 0.2s ease-in-out',
          }}
          styles={{
            root: {
              '&:focus': {
                top: '16px',
                // High contrast outline for sunlight visibility
                outline: '3px solid var(--mantine-color-white, #ffffff)',
                outlineOffset: '3px',
              },
            },
          }}
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById(link.targetId);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.label}
        </Anchor>
      ))}
    </Box>
  );
}

export default SkipLinks;
