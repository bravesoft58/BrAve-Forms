import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

// Local imports
import { theme } from '@/lib/theme/construction.theme';

// Import Mantine CSS (required for v7)
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

// Import global styles
import '../globals.css';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'BrAve Forms - Sprint 2 Demo',
  description: 'Sprint 2 development showcase - EPA compliance platform features',
};

interface DemoLayoutProps {
  children: React.ReactNode;
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
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
            <div id="root" className="min-h-screen bg-gray-50">
              {children}
            </div>
            
            <Notifications
              position="top-right"
              zIndex={1000}
              limit={5}
              containerWidth={400}
              transitionDuration={300}
            />
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}