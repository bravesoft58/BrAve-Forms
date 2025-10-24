'use client';

import { AppShell as MantineAppShell } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useSnapshot } from 'valtio';
import { ReactNode, useEffect } from 'react';
import {
  navigationStore,
  initializeNavigation,
  closeMobileMenu,
} from '@/lib/stores/navigation-store';

interface AppShellProps {
  /**
   * Header slot content
   * Rendered in fixed header (64px height)
   */
  header?: ReactNode;

  /**
   * Navbar slot content
   * Rendered in sidebar (responsive width)
   */
  navbar?: ReactNode;

  /**
   * Main content area
   * Rendered in scrollable main section
   */
  children: ReactNode;

  /**
   * Offline banner slot
   * Shown at top of main content when offline
   */
  offlineBanner?: ReactNode;
}

/**
 * AppShell Layout Component
 *
 * Provides the foundational layout structure for all application pages:
 * - Fixed header (64px) with logo, user menu, offline indicator
 * - Responsive navbar/sidebar (desktop: 280px, mobile: full overlay)
 * - Scrollable main content area with offline banner placement
 *
 * Responsive Behavior:
 * - Mobile (<768px): Collapsed sidebar, hamburger menu, bottom nav
 * - Tablet (768-1024px): Collapsible sidebar
 * - Desktop (>1024px): Fixed expanded sidebar
 *
 * Features:
 * - Valtio state management for sidebar collapse
 * - localStorage persistence of sidebar state
 * - Automatic mobile detection and responsive defaults
 * - Construction-optimized theming (blue/orange palette)
 * - Glove-friendly touch targets (48x48dp minimum)
 */
export function AppShell({ header, navbar, children, offlineBanner }: AppShellProps) {
  const snap = useSnapshot(navigationStore);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Initialize navigation state on mount
  useEffect(() => {
    initializeNavigation();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile && snap.mobileMenuOpen) {
      closeMobileMenu();
    }
  }, [snap.activeRoute, isMobile, snap.mobileMenuOpen]);

  return (
    <MantineAppShell
      padding="md"
      navbar={{
        width: {
          sm: 280, // Desktop sidebar width
          base: '100%', // Mobile full-width overlay
        },
        breakpoint: 'md', // 768px
        collapsed: {
          desktop: snap.sidebarCollapsed, // Desktop collapse state
          mobile: !snap.mobileMenuOpen, // Mobile menu state (inverted)
        },
      }}
      header={{
        height: 64,
      }}
      styles={{
        main: {
          backgroundColor: '#f9fafb', // gray-50
          minHeight: 'calc(100vh - 64px)', // Full height minus header
          paddingTop: '64px', // Header height offset
        },
        root: {
          backgroundColor: '#f9fafb',
        },
      }}
    >
      {/* Header Slot */}
      {header && <MantineAppShell.Header>{header}</MantineAppShell.Header>}

      {/* Navbar/Sidebar Slot */}
      {navbar && (
        <MantineAppShell.Navbar
          p="md"
          style={{
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e5e7eb',
          }}
        >
          {navbar}
        </MantineAppShell.Navbar>
      )}

      {/* Main Content Slot */}
      <MantineAppShell.Main>
        {/* Offline Banner Placement */}
        {offlineBanner && (
          <div
            style={{
              marginBottom: '1rem',
            }}
          >
            {offlineBanner}
          </div>
        )}

        {/* Page Content */}
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
