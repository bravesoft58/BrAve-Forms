import { MantineThemeOverride, MantineTheme } from '@mantine/core';

/**
 * BrAve Forms Theme Configuration
 *
 * Construction-optimized design system with:
 * - High contrast colors for sunlight readability
 * - Large touch targets for glove use (48x48dp minimum)
 * - Safety-oriented color palette (blue/orange)
 */
export const theme: MantineThemeOverride = {
  colors: {
    // Construction Blue (Primary)
    blue: [
      '#eff6ff', // blue-50
      '#dbeafe', // blue-100
      '#bfdbfe', // blue-200
      '#93c5fd', // blue-300
      '#60a5fa', // blue-400
      '#3b82f6', // blue-500
      '#2563eb', // blue-600 (PRIMARY)
      '#1d4ed8', // blue-700
      '#1e40af', // blue-800
      '#1e3a8a', // blue-900
    ],

    // Safety Orange (Accent)
    orange: [
      '#fff7ed', // orange-50
      '#ffedd5', // orange-100
      '#fed7aa', // orange-200
      '#fdba74', // orange-300
      '#fb923c', // orange-400
      '#f97316', // orange-500 (ACCENT)
      '#ea580c', // orange-600
      '#c2410c', // orange-700
      '#9a3412', // orange-800
      '#7c2d12', // orange-900
    ],
  },

  primaryColor: 'blue',
  primaryShade: 6, // blue-600

  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',

  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '2.5rem' },
      h2: { fontSize: '1.5rem', lineHeight: '2rem' },
      h3: { fontSize: '1.25rem', lineHeight: '1.75rem' },
      h4: { fontSize: '1.125rem', lineHeight: '1.75rem' },
      h5: { fontSize: '1rem', lineHeight: '1.5rem' },
      h6: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    },
  },

  spacing: {
    xxs: '0.25rem', // 4px - ultra compact (mobile)
    xs: '0.5rem', // 8px - compact
    sm: '0.75rem', // 12px - standard small
    md: '1rem', // 16px - standard
    lg: '1.5rem', // 24px - large
    xl: '2rem', // 32px - extra large
  },

  fontSizes: {
    xxs: '0.625rem', // 10px - tiny labels/group headers
    xs: '0.75rem', // 12px - small text
    sm: '0.875rem', // 14px - body text (PRIMARY)
    md: '1rem', // 16px - larger body
    lg: '1.125rem', // 18px - subheadings
    xl: '1.25rem', // 20px - page titles
  },

  breakpoints: {
    xs: '0',
    sm: '640px',
    md: '768px', // Mobile/Tablet breakpoint
    lg: '1024px', // Desktop breakpoint
    xl: '1280px',
  },

  radius: {
    xs: '0.25rem', // 4px
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
  },

  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Construction-specific overrides
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          // Glove-friendly minimum touch target: 48x48dp
          minHeight: '48px',
          minWidth: '48px',
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
    },

    TextInput: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        input: {
          // Large input for glove use
          minHeight: '48px',
          fontSize: '1rem',
        },
      },
    },

    Select: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        input: {
          minHeight: '48px',
          fontSize: '1rem',
        },
      },
    },

    Checkbox: {
      styles: {
        input: {
          // Large checkboxes for glove use
          width: '24px',
          height: '24px',
        },
        label: {
          fontSize: '1rem',
          paddingLeft: '0.5rem',
        },
      },
    },

    Radio: {
      styles: {
        radio: {
          width: '24px',
          height: '24px',
        },
        label: {
          fontSize: '1rem',
          paddingLeft: '0.5rem',
        },
      },
    },

    AppShell: {
      styles: {
        root: {
          backgroundColor: '#f9fafb', // gray-50
        },
        main: {
          backgroundColor: '#f9fafb',
          padding: '1rem',
        },
      },
    },

    Header: {
      styles: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb', // gray-200
          height: '64px',
          padding: '0 1rem',
        },
      },
    },

    Navbar: {
      styles: {
        root: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          padding: '1rem',
        },
      },
    },

    NavLink: {
      styles: (theme: MantineTheme) => ({
        root: {
          fontSize: '0.875rem', // 14px
          '&:hover': {
            backgroundColor: theme.colors.gray[1],
          },
        },
      }),
    },

    Card: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },

    Menu: {
      styles: (theme: MantineTheme) => ({
        dropdown: {
          border: `1px solid ${theme.colors.gray[2]}`,
        },
        item: {
          fontSize: '0.875rem', // 14px
          padding: '0.5rem 0.75rem',
        },
      }),
    },

    Badge: {
      styles: {
        root: {
          fontSize: '0.75rem', // 12px
          fontWeight: 500,
        },
      },
    },
  },

  // Note: globalStyles removed due to Next.js 14 Client Component limitations
  // Global styles are applied via globals.css instead
};

/**
 * Construction color palette for direct use
 */
export const colors = {
  primary: '#2563eb', // Construction Blue
  accent: '#f97316', // Safety Orange
  background: '#f9fafb', // Gray 50
  surface: '#ffffff', // White
  border: '#e5e7eb', // Gray 200
  text: {
    primary: '#111827', // Gray 900
    secondary: '#6b7280', // Gray 500
    tertiary: '#9ca3af', // Gray 400
  },
  status: {
    success: '#10b981', // Green 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
    info: '#3b82f6', // Blue 500
  },
} as const;
