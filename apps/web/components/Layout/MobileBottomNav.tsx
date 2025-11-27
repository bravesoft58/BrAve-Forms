'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Box, rem, useMantineTheme } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconFolder,
  IconFiles,
  IconSettings,
} from '@tabler/icons-react';

/**
 * Navigation item type
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

/**
 * MobileBottomNav Component
 *
 * Fixed bottom navigation for mobile viewports.
 * Rendered OUTSIDE AppShell.Navbar to avoid z-index conflicts.
 *
 * Features:
 * - Fixed position at viewport bottom
 * - Safe area insets for notched devices
 * - 48px touch targets for glove-friendly interaction
 * - Active route highlighting
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const theme = useMantineTheme();

  /**
   * Navigation items configuration
   */
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: IconLayoutDashboard,
    },
    {
      label: 'Projects',
      href: '/dashboard/projects',
      icon: IconFolder,
    },
    {
      label: 'Forms',
      href: '/dashboard/forms',
      icon: IconFiles,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: IconSettings,
    },
  ];

  /**
   * Check if route is active
   */
  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <Box
      component="nav"
      aria-label="Mobile navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: rem(56),
        maxHeight: rem(56),
        minHeight: rem(56),
        backgroundColor: theme.white,
        borderTop: `1px solid ${theme.colors.gray[2]}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
        boxSizing: 'border-box',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Box
            key={item.href}
            component={Link}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: rem(48),
              maxHeight: rem(48),
              minHeight: rem(48),
              textDecoration: 'none',
              color: active ? theme.colors.blue[7] : theme.colors.gray[6],
              fontSize: rem(11),
              fontWeight: active ? 600 : 500,
              gap: rem(2),
              padding: rem(4),
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
          >
            <Icon size={20} />
            <span style={{ lineHeight: 1 }}>{item.label}</span>
          </Box>
        );
      })}
    </Box>
  );
}
