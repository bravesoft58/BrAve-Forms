import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Local imports
import { theme } from '@/lib/theme';
import { AppProviders } from './providers';
import { AppShell } from '@/components/Layout/AppShell';

// Import Mantine CSS (required for v7)
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

// Import global styles
import './globals.css';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

// App metadata optimized for construction use
export const metadata: Metadata = {
  title: {
    default: 'BrAve Forms - Construction Compliance',
    template: '%s | BrAve Forms',
  },
  description:
    'EPA and OSHA compliance management for construction sites. Storm water inspections, safety reporting, and regulatory compliance made simple.',
  keywords: [
    'construction compliance',
    'EPA storm water',
    'OSHA safety',
    'construction inspections',
    'regulatory compliance',
    'storm water management',
    'construction forms',
  ],
  authors: [{ name: 'BrAve Forms Team' }],
  creator: 'BrAve Forms',
  publisher: 'BrAve Forms',

  // App-specific metadata
  applicationName: 'BrAve Forms',
  category: 'Business',
  classification: 'Construction Compliance Software',

  // Social media metadata
  openGraph: {
    type: 'website',
    siteName: 'BrAve Forms',
    title: 'BrAve Forms - Construction Compliance Platform',
    description:
      'Streamline EPA and OSHA compliance for construction sites with digital forms, automated inspections, and regulatory tracking.',
    locale: 'en_US',
  },

  // Twitter metadata
  twitter: {
    card: 'summary_large_image',
    title: 'BrAve Forms - Construction Compliance',
    description: 'Digital compliance management for construction sites.',
  },

  // Progressive Web App metadata
  manifest: '/manifest.json',

  // Security and performance
  robots: {
    index: false, // Private business application
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },

  // Verification (if needed)
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

// Viewport configuration optimized for construction sites
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for better visibility
  userScalable: true, // Enable zoom for accessibility
  viewportFit: 'cover', // Handle device notches
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0284c7' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Color scheme script must be in head */}
        <ColorSchemeScript />

        {/* Optimize viewport for mobile construction sites */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Prevent zoom on input focus (iOS) while maintaining accessibility */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
        />

        {/* Construction-specific meta tags */}
        <meta name="application-name" content="BrAve Forms" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="format-detection" content="address=yes" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <ModalsProvider
            modalProps={{
              centered: true,
              overlayProps: { backgroundOpacity: 0.55, blur: 3 },
              radius: 'md',
              shadow: 'xl',
            }}
          >
            <AppProviders>
              {/* AppShell provides header, navbar, and main layout structure */}
              <AppShell
                header={
                  <div style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}>
                    <strong>BrAve Forms</strong>
                    {/* Full header will be built in ISSUE-077 */}
                  </div>
                }
                navbar={
                  <div>
                    <p>Navigation</p>
                    {/* Full navbar will be built in ISSUE-078 */}
                  </div>
                }
              >
                {/* Main application content */}
                {children}
              </AppShell>

              {/* Global notifications */}
              <Notifications
                position="top-right"
                zIndex={1000}
                limit={5}
                containerWidth={400}
                transitionDuration={300}
              />

              {/* Development tools */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </AppProviders>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
