'use client';

/**
 * Focus Visible Styles Component
 *
 * Provides consistent, accessible focus indicators across the application.
 * Uses :focus-visible to only show focus rings for keyboard navigation,
 * not mouse clicks.
 *
 * WCAG 2.1 AA Compliance: 2.4.7 Focus Visible
 */

import { useEffect } from 'react';

/**
 * Focus outline configuration
 */
export interface FocusStyleConfig {
  /** Focus outline color */
  color?: string;
  /** Focus outline width */
  width?: string;
  /** Focus outline offset */
  offset?: string;
  /** Focus outline style */
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface FocusStylesProps {
  /** Custom focus style configuration */
  config?: FocusStyleConfig;
}

/**
 * Default focus configuration optimized for construction sites:
 * - 3px width for visibility in direct sunlight
 * - 3px offset for better separation from content
 * - Fallback colors for offline mode
 */
const DEFAULT_CONFIG: FocusStyleConfig = {
  // Increased from 2px for construction site sunlight visibility
  color: 'var(--mantine-color-blue-6, #228be6)',
  width: '3px',
  offset: '3px',
  style: 'solid',
};

/**
 * Generate focus styles CSS string
 */
function generateFocusStyles(config: FocusStyleConfig): string {
  const { color, width, offset, style } = config;

  return `
    /* Remove default outline for mouse users */
    *:focus {
      outline: none;
    }

    /* Add visible focus ring for keyboard users */
    *:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    /* Button focus styles */
    button:focus-visible, [role="button"]:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    /* Link focus styles */
    a:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    /* Input focus styles (inset for better appearance) */
    input:focus-visible, textarea:focus-visible, select:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    /* Checkbox and radio focus styles */
    input[type="checkbox"]:focus-visible, input[type="radio"]:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    /* Card and interactive container focus styles */
    [tabindex="0"]:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    /* Mantine component overrides */
    .mantine-Button-root:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    .mantine-ActionIcon-root:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    .mantine-TextInput-input:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    .mantine-Select-input:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    .mantine-Textarea-input:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    .mantine-Card-root:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: ${offset};
    }

    .mantine-NavLink-root:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    .mantine-Tabs-tab:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    .mantine-Menu-item:focus-visible {
      outline: ${width} ${style} ${color};
      outline-offset: -2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      *:focus-visible {
        outline: 3px solid currentColor;
        outline-offset: 3px;
      }
    }

    /* Reduced motion - instant focus transition */
    @media (prefers-reduced-motion: reduce) {
      *:focus-visible {
        transition: none;
      }
    }
  `;
}

/**
 * Global Focus Styles
 *
 * Applies consistent focus indicators to all focusable elements.
 * Only shows focus ring for keyboard navigation (not mouse clicks).
 *
 * Include once in your root layout.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * <FocusStyles />
 * ```
 */
export function FocusStyles({ config = {} }: FocusStylesProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    const styleId = 'brave-forms-focus-styles';

    // Check if styles already exist
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = generateFocusStyles(mergedConfig);

    return () => {
      // Don't remove on unmount as other instances might use it
    };
  }, [mergedConfig]);

  return null;
}

/**
 * High Contrast Focus Styles
 *
 * More prominent focus indicators for users who need higher visibility.
 */
export function HighContrastFocusStyles() {
  return (
    <FocusStyles
      config={{
        color: 'currentColor',
        width: '3px',
        offset: '3px',
        style: 'solid',
      }}
    />
  );
}

export default FocusStyles;
