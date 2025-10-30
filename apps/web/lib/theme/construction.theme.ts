import { createTheme, DEFAULT_THEME, mergeMantineTheme, MantineColorsTuple } from '@mantine/core';

// High-contrast colors optimized for construction site visibility
const primary: MantineColorsTuple = [
  '#f0f9ff',
  '#e0f2fe',
  '#bae6fd',
  '#7dd3fc',
  '#38bdf8',
  '#0ea5e9', // Primary brand color
  '#0284c7',
  '#0369a1',
  '#075985',
  '#0c4a6e',
];

const success: MantineColorsTuple = [
  '#f0fdf4',
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e', // Success green - high contrast
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
];

const warning: MantineColorsTuple = [
  '#fffbeb',
  '#fef3c7',
  '#fde68a',
  '#fcd34d',
  '#fbbf24',
  '#f59e0b', // Warning amber
  '#d97706',
  '#b45309',
  '#92400e',
  '#78350f',
];

const danger: MantineColorsTuple = [
  '#fef2f2',
  '#fecaca',
  '#fca5a5',
  '#f87171',
  '#ef4444',
  '#dc2626', // Danger red - high visibility
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
  '#6b1f1f',
];

// Construction-optimized theme
export const constructionTheme = createTheme({
  // Color scheme optimized for outdoor visibility
  colors: {
    primary,
    success,
    warning,
    danger,
  },

  // Primary color for main actions
  primaryColor: 'primary',

  // Font stack optimized for readability in harsh conditions
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',

  // Font sizes optimized for touch interfaces
  fontSizes: {
    xs: '0.875rem', // 14px minimum for construction sites
    sm: '1rem', // 16px base size
    md: '1.125rem', // 18px for improved readability
    lg: '1.25rem', // 20px for critical information
    xl: '1.5rem', // 24px for headers
  },

  // Line heights for better readability
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.5',
    lg: '1.6',
    xl: '1.65',
  },

  // Headings with strong hierarchy
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '700', // Bold for better visibility
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3' },
      h2: { fontSize: '1.75rem', lineHeight: '1.35' },
      h3: { fontSize: '1.5rem', lineHeight: '1.4' },
      h4: { fontSize: '1.25rem', lineHeight: '1.45' },
      h5: { fontSize: '1.125rem', lineHeight: '1.5' },
      h6: { fontSize: '1rem', lineHeight: '1.5' },
    },
  },

  // Spacing optimized for touch targets
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem', // Standard touch spacing
    lg: '1.5rem', // Large touch spacing
    xl: '2rem',
  },

  // Radius for modern but accessible design
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Strong shadows for depth perception in sunlight
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    sm: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
    md: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
    lg: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },

  // Component-specific overrides
  components: {
    Button: {
      styles: {
        root: {
          // Minimum touch target for gloved hands
          minHeight: '48px',
          minWidth: '48px',
          fontWeight: '600',
          fontSize: '16px',

          // High contrast hover states
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },

          // Focus states for accessibility
          '&:focus': {
            outline: '3px solid currentColor',
            outlineOffset: '2px',
          },
        },
      },
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },

    TextInput: {
      styles: {
        input: {
          minHeight: '48px',
          fontSize: '16px',
          fontWeight: '500',

          // High contrast borders
          borderWidth: '2px',

          '&:focus': {
            borderWidth: '3px',
          },
        },
      },
    },

    Select: {
      styles: {
        input: {
          minHeight: '48px',
          fontSize: '16px',
          fontWeight: '500',
        },
      },
    },

    Checkbox: {
      styles: {
        input: {
          // Larger checkboxes for easier interaction
          width: '24px',
          height: '24px',
        },
        label: {
          fontSize: '16px',
          fontWeight: '500',
          paddingLeft: '8px',
        },
      },
    },

    Card: {
      styles: {
        root: {
          // Strong shadows for card depth
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',

          // Larger padding for touch interfaces
          padding: '24px',
        },
      },
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
    },

    Modal: {
      styles: {
        header: {
          paddingBottom: '16px',
          borderBottom: '2px solid var(--mantine-color-gray-2)',
        },
        body: {
          padding: '24px',
        },
      },
    },

    Notification: {
      styles: {
        root: {
          // Larger notifications for better visibility
          padding: '16px 20px',
          fontSize: '16px',

          // Strong borders for definition
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
    },
  },

  // Note: Global styles are now handled in globals.css for better performance
});

// Merge with default theme for completeness
export const theme = mergeMantineTheme(DEFAULT_THEME, constructionTheme);
