'use client';

import { AppShell, rem } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AppHeader } from './AppHeader';
import { AppNavbar } from './AppNavbar';
import { MobileBottomNav } from './MobileBottomNav';
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
 * - Navbar: 280px width (desktop only, NOT rendered on mobile)
 * - Main: Content area with OfflineBanner at top
 * - MobileBottomNav: Fixed bottom nav on mobile (rendered OUTSIDE AppShell.Navbar)
 *
 * Mobile Fix (2025-11-27):
 * Navbar is NOT rendered on mobile to prevent the AppShell.Navbar wrapper
 * from covering the main content. MobileBottomNav is rendered separately.
 */
export function AppLayout({ children }: AppLayoutProps) {
  // Detect mobile viewport - same breakpoint as navbar.breakpoint: 'md' (768px)
  // IMPORTANT: useMediaQuery returns undefined during SSR/initial hydration
  // Default to true (mobile-first) to prevent navbar from covering content
  const isMobileQuery = useMediaQuery('(max-width: 768px)');
  const isMobile = isMobileQuery !== false; // Treat undefined as mobile (safer default)
  const isDesktop = isMobileQuery === false; // Only true when confirmed desktop

  return (
    <>
      <AppShell
        header={{ height: 64 }}
        // Only configure navbar on CONFIRMED desktop - prevents wrapper from covering content on mobile
        navbar={isDesktop ? { width: 280, breakpoint: 'md' } : undefined}
        padding="md"
      >
        <AppShell.Header>
          <AppHeader />
        </AppShell.Header>

        {/* Only render Navbar on CONFIRMED desktop - mobile uses MobileBottomNav instead */}
        {isDesktop && (
          <AppShell.Navbar>
            <AppNavbar />
          </AppShell.Navbar>
        )}

        <AppShell.Main
          style={{
            // Add bottom padding on mobile to prevent content from being hidden behind bottom nav
            paddingBottom: isMobile ? rem(72) : undefined,
          }}
        >
          <OfflineBanner />
          {children}
        </AppShell.Main>
      </AppShell>

      {/* Mobile bottom navigation - rendered OUTSIDE AppShell to avoid z-index issues */}
      {isMobile && <MobileBottomNav />}
    </>
  );
}
