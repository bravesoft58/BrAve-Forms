import {
  createTheme,
  DEFAULT_THEME,
  mergeMantineTheme,
  MantineColorsTuple,
} from '@mantine/core';

// Construction-optimized colors with enhanced contrast for mobile
const primary: MantineColorsTuple = [
  '#f0f9ff',
  '#e0f2fe', 
  '#bae6fd',
  '#7dd3fc',
  '#38bdf8',
  '#0ea5e9', // Primary brand color - tested in sunlight
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
  '#22c55e', // High contrast green for success states
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
  '#f59e0b', // Amber for weather alerts
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
  '#dc2626', // High visibility red for EPA violations
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
  '#6b1f1f',
];

// Mobile-first construction theme
export const constructionTheme = createTheme({
  colors: {
    primary,
    success,
    warning,
    danger,
  },

  primaryColor: 'primary',

  // Font optimizations for mobile construction use
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

  // Mobile-optimized font sizes (larger than web)
  fontSizes: {
    xs: '16rem', // 16px minimum for mobile construction
    sm: '18rem', // 18px base size for better readability
    md: '20rem', // 20px for improved mobile readability
    lg: '22rem', // 22px for critical information
    xl: '26rem', // 26px for headers on mobile
  },

  // Enhanced line heights for mobile reading
  lineHeights: {
    xs: '1.5',
    sm: '1.55',
    md: '1.6',
    lg: '1.65',
    xl: '1.7',
  },

  // Mobile-optimized headings with larger sizes
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '36rem', lineHeight: '1.2' }, // Larger for mobile
      h2: { fontSize: '32rem', lineHeight: '1.25' },
      h3: { fontSize: '28rem', lineHeight: '1.3' },
      h4: { fontSize: '24rem', lineHeight: '1.35' },
      h5: { fontSize: '22rem', lineHeight: '1.4' },
      h6: { fontSize: '20rem', lineHeight: '1.45' },
    },
  },

  // Mobile touch spacing (larger than web)
  spacing: {
    xs: '10rem',  // 10px
    sm: '16rem',  // 16px
    md: '20rem',  // 20px - Enhanced mobile spacing
    lg: '28rem',  // 28px - Large mobile spacing
    xl: '36rem',  // 36px - Extra large for key elements
  },

  // Larger radius for better mobile touch feedback
  radius: {
    xs: '6rem',
    sm: '8rem',
    md: '12rem',
    lg: '16rem',
    xl: '20rem',
  },

  // Enhanced shadows for mobile depth perception
  shadows: {
    xs: '0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.25)',
    sm: '0 4px 8px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.15)',
    md: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.08)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.1)',
  },

  // Mobile-optimized component styles
  components: {
    Button: {
      styles: {
        root: {
          // Larger touch targets for gloved hands on mobile
          minHeight: '56px', // Increased from web version
          minWidth: '56px',
          fontSize: '18px',
          fontWeight: '600',
          padding: '16px 24px',
          
          // Enhanced mobile touch feedback
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
          },
          
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
          
          // Strong focus indicators for mobile accessibility
          '&:focus': {
            outline: '4px solid currentColor',
            outlineOffset: '3px',
          },
          
          // Disabled state with clear visual feedback
          '&:disabled': {
            opacity: 0.4,
            cursor: 'not-allowed',
          },
        },
      },
      defaultProps: {
        size: 'lg', // Default to large on mobile
        radius: 'md',
      },
    },

    TextInput: {
      styles: {
        input: {
          minHeight: '56px', // Large touch target
          fontSize: '18px',
          fontWeight: '500',
          padding: '16px',
          
          // Enhanced borders for mobile visibility
          borderWidth: '3px',
          
          '&:focus': {
            borderWidth: '4px',
          },
          
          // iOS zoom prevention while maintaining accessibility
          '@media (max-width: 768px)': {
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
        label: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
        },
      },
    },

    Textarea: {
      styles: {
        input: {
          minHeight: '120px', // Larger for mobile
          fontSize: '18px',
          fontWeight: '500',
          padding: '16px',
          borderWidth: '3px',
          
          '&:focus': {
            borderWidth: '4px',
          },
        },
      },
    },

    Select: {
      styles: {
        input: {
          minHeight: '56px',
          fontSize: '18px',
          fontWeight: '500',
          padding: '16px',
          borderWidth: '3px',
        },
        dropdown: {
          // Larger dropdown for mobile
          padding: '8px',
        },
        option: {
          fontSize: '18px',
          padding: '16px',
          minHeight: '52px',
        },
      },
    },

    Checkbox: {
      styles: {
        input: {
          // Much larger checkboxes for mobile/gloves
          width: '32px',
          height: '32px',
          borderWidth: '3px',
        },
        label: {
          fontSize: '18px',
          fontWeight: '500',
          paddingLeft: '12px',
          cursor: 'pointer',
        },
      },
    },

    Radio: {
      styles: {
        radio: {
          width: '32px',
          height: '32px',
          borderWidth: '3px',
        },
        label: {
          fontSize: '18px',
          fontWeight: '500',
          paddingLeft: '12px',
          cursor: 'pointer',
        },
      },
    },

    Card: {
      styles: {
        root: {
          // Enhanced shadows and spacing for mobile
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          padding: '24px',
          
          // Mobile-specific card styling
          '@media (max-width: 768px)': {
            margin: '0 -8px',
            borderRadius: '12px',
          },
        },
      },
      defaultProps: {
        radius: 'lg',
        withBorder: true,
        shadow: 'md',
      },
    },

    Modal: {
      styles: {
        modal: {
          // Mobile modal optimizations
          '@media (max-width: 768px)': {
            margin: '20px',
            maxHeight: 'calc(100vh - 40px)',
          },
        },
        header: {
          padding: '24px 24px 16px 24px',
          borderBottom: '3px solid var(--mantine-color-gray-2)',
        },
        body: {
          padding: '24px',
          fontSize: '18px',
        },
        title: {
          fontSize: '24px',
          fontWeight: '700',
        },
      },
    },

    Notification: {
      styles: {
        root: {
          // Larger notifications for mobile construction
          padding: '20px 24px',
          fontSize: '18px',
          minHeight: '80px',
          
          // Strong borders and shadows
          borderWidth: '3px',
          borderStyle: 'solid',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          
          // Mobile positioning
          '@media (max-width: 768px)': {
            margin: '0 16px',
            borderRadius: '12px',
          },
        },
        title: {
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '8px',
        },
        description: {
          fontSize: '18px',
          lineHeight: '1.5',
        },
        icon: {
          // Larger icons for mobile
          minWidth: '32px',
          minHeight: '32px',
        },
      },
    },

    ActionIcon: {
      styles: {
        root: {
          // Larger action icons for mobile touch
          minWidth: '48px',
          minHeight: '48px',
          
          '&:hover': {
            transform: 'scale(1.05)',
          },
          
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
      defaultProps: {
        size: 'lg',
      },
    },

    Tabs: {
      styles: {
        tab: {
          // Larger tabs for mobile navigation
          minHeight: '52px',
          fontSize: '18px',
          fontWeight: '600',
          padding: '12px 20px',
        },
        panel: {
          padding: '24px 0',
        },
      },
    },

    Accordion: {
      styles: {
        control: {
          // Larger accordion controls
          minHeight: '60px',
          fontSize: '20px',
          fontWeight: '600',
          padding: '16px 20px',
        },
        content: {
          fontSize: '18px',
          padding: '20px',
        },
      },
    },

    Table: {
      styles: {
        table: {
          // Mobile table optimizations
          '@media (max-width: 768px)': {
            fontSize: '16px',
          },
        },
        th: {
          fontSize: '18px',
          fontWeight: '700',
          padding: '16px 12px',
          borderBottom: '3px solid var(--mantine-color-gray-3)',
        },
        td: {
          fontSize: '18px',
          padding: '16px 12px',
          borderBottom: '1px solid var(--mantine-color-gray-2)',
        },
      },
    },

    Badge: {
      styles: {
        root: {
          fontSize: '16px',
          fontWeight: '600',
          minHeight: '32px',
          padding: '8px 16px',
        },
      },
      defaultProps: {
        size: 'lg',
      },
    },

    Loader: {
      styles: {
        root: {
          // Larger loaders for better mobile visibility
          width: '48px',
          height: '48px',
        },
      },
      defaultProps: {
        size: 'lg',
      },
    },
  },

  // Mobile-specific breakpoints
  breakpoints: {
    xs: '30em', // 480px
    sm: '48em', // 768px
    md: '64em', // 1024px - tablet landscape
    lg: '74em', // 1184px
    xl: '90em', // 1440px
  },

  // Focus ring styles for better mobile accessibility
  focusRing: 'auto',
  focusRingStyles: {
    styles: () => ({
      '&:focus': {
        outline: '3px solid var(--mantine-primary-color-filled)',
        outlineOffset: '3px',
      },
      '&:focus:not(:focus-visible)': {
        outline: 'none',
      },
    }),
    inputStyles: () => ({
      '&:focus': {
        borderColor: 'var(--mantine-primary-color-filled)',
        borderWidth: '3px',
      },
    }),
  },
});

// Merge with default theme
export const theme = mergeMantineTheme(DEFAULT_THEME, constructionTheme);