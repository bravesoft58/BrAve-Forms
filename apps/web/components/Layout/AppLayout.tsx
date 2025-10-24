'use client';

import { AppShell } from '@mantine/core';
import { AppHeader } from './AppHeader';
import { AppNavbar } from './AppNavbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout Component
 *
 * Client-side layout wrapper for Next.js 14 App Router compatibility.
 * Wraps AppShell with header and navigation components.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell
      header={{ height: 48 }}
      navbar={{
        width: 280,
        breakpoint: 'md',
      }}
      padding="md"
    >
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>

      <AppShell.Navbar>
        <AppNavbar />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
