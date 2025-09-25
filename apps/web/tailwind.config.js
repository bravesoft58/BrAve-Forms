/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Construction-optimized color palette
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warning amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fecaca',
          200: '#fca5a5',
          300: '#f87171',
          400: '#ef4444',
          500: '#dc2626', // Danger red
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#6b1f1f',
        },
      },
      
      // Font family with Inter
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      // Construction-optimized spacing
      spacing: {
        '18': '4.5rem', // 72px
        '88': '22rem',  // 352px
        '128': '32rem', // 512px
      },
      
      // Shadows optimized for outdoor visibility
      boxShadow: {
        'construction': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'construction-lg': '0 10px 25px rgba(0, 0, 0, 0.2)',
        'outdoor': '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      
      // Animation for loading states
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
      },
      
      // Custom breakpoints for construction devices
      screens: {
        'xs': '475px',
        'tablet': '640px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
    },
  },
  plugins: [
    // Add any additional plugins here
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  // Prevent conflicts with Mantine
  corePlugins: {
    preflight: false,
  },
};