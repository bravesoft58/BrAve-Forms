'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Stack, NavLink, Box, rem, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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
 * Responsive navigation with:
 * - Desktop: Sidebar navigation (280px width, left side)
 * - Mobile: Bottom navigation (fixed, full width)
 * - Active route highlighting
 * - 48x48dp glove-friendly touch targets
 *
 * Design: Appropriately sized elements (13px text, 18px icons)
 * following AppHeader sizing standards
 */
export function AppNavbar() {
  const pathname = usePathname();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  /**
   * Navigation items configuration
   */
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: IconLayoutDashboard,
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: IconFolder,
    },
    {
      label: 'Forms',
      href: '/forms',
      icon: IconFiles,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: IconSettings,
    },
  ];

  /**
   * Check if route is active
   */
  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  /**
   * Desktop Sidebar Navigation
   */
  if (!isMobile) {
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

  /**
   * Mobile Bottom Navigation
   */
  return (
    <Box
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
            sx={{
              '&:active': {
                backgroundColor: theme.colors.gray[1],
                transform: 'scale(0.95)',
              },
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
