'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Stack, NavLink, rem, useMantineTheme } from '@mantine/core';
import { IconLayoutDashboard, IconFolder, IconFiles, IconSettings } from '@tabler/icons-react';

/**
 * Navigation item type
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

/**
 * AppNavbar Component
 *
 * Desktop sidebar navigation (280px width, left side).
 * Mobile navigation is handled by MobileBottomNav component.
 *
 * Features:
 * - Active route highlighting
 * - 40px height for desktop nav items
 * - Smooth hover animations
 *
 * Design: Appropriately sized elements (13px text, 18px icons)
 * following AppHeader sizing standards
 *
 * Note: This component is only rendered on desktop.
 * Mobile bottom navigation is handled separately by MobileBottomNav
 * which renders OUTSIDE AppShell.Navbar to avoid z-index issues.
 */
export function AppNavbar() {
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
    <Stack gap="xs" p="sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <NavLink
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            leftSection={<Icon size={18} />}
            active={active}
            styles={{
              root: {
                height: rem(40),
                maxHeight: rem(40),
                borderRadius: rem(6),
                fontSize: rem(13),
                fontWeight: active ? 600 : 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.colors.gray[1],
                  transform: 'translateX(2px)',
                },
                '&:active': {
                  backgroundColor: theme.colors.gray[2],
                  transform: 'translateX(0)',
                },
              },
            }}
          />
        );
      })}
    </Stack>
  );
}
