'use client';

import { AppShell } from '@mantine/core';
import { AppHeader } from './AppHeader';
import { AppNavbar } from './AppNavbar';
import { OfflineBanner } from './OfflineBanner';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout Component
 *
 * Client-side layout wrapper for Next.js 14 App Router compatibility.
 * Wraps AppShell with header, navigation, and offline banner components.
 *
 * Structure:
 * - Header: 64px fixed height
 * - Navbar: 280px width (desktop), hidden on mobile
 * - Main: Content area with OfflineBanner at top
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell header={{ height: 64 }} navbar={{ width: 280, breakpoint: 'md' }} padding="md">
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>

      <AppShell.Navbar>
        <AppNavbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <OfflineBanner />
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
