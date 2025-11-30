'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Group, Stack, Paper, NavLink, Title, Text, Divider } from '@mantine/core';
import {
  IconUser,
  IconSettings,
  IconBell,
  IconPalette,
  IconCloudUpload,
  IconWorld,
  IconArrowLeft,
  IconDeviceMobile,
} from '@tabler/icons-react';

interface SettingsLayoutProps {
  children: ReactNode;
}

/**
 * Settings Layout
 *
 * Provides navigation sidebar for settings pages.
 * Includes links to:
 * - Profile
 * - Notifications
 * - Display
 * - Offline & Sync
 * - Account
 * - App
 */
export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Profile',
      description: 'Your account information',
      href: '/settings/profile',
      icon: IconUser,
    },
    {
      label: 'Notifications',
      description: 'Email and push alerts',
      href: '/settings/notifications',
      icon: IconBell,
    },
    {
      label: 'Display',
      description: 'Theme and preferences',
      href: '/settings/display',
      icon: IconPalette,
    },
    {
      label: 'Offline & Sync',
      description: 'Sync settings and storage',
      href: '/settings/offline',
      icon: IconCloudUpload,
    },
    {
      label: 'Account',
      description: 'Timezone and language',
      href: '/settings/account',
      icon: IconWorld,
    },
    {
      label: 'App',
      description: 'Storage and version info',
      href: '/settings/app',
      icon: IconDeviceMobile,
    },
  ];

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Back to Dashboard */}
        <Group>
          <NavLink
            component={Link}
            href="/dashboard"
            label="Back to Dashboard"
            leftSection={<IconArrowLeft size={16} />}
            variant="subtle"
            style={{ width: 'auto' }}
          />
        </Group>

        {/* Main Content */}
        <Group align="flex-start" gap="lg" wrap="nowrap">
          {/* Sidebar Navigation */}
          <Paper
            p="md"
            withBorder
            style={{
              width: 280,
              minWidth: 280,
              position: 'sticky',
              top: 80,
            }}
          >
            <Stack gap="xs">
              <Group gap="xs" mb="xs">
                <IconSettings size={20} />
                <Title order={4}>Settings</Title>
              </Group>
              <Text size="xs" c="dimmed" mb="sm">
                Manage your account and preferences
              </Text>

              <Divider />

              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  description={item.description}
                  leftSection={<item.icon size={18} />}
                  active={pathname === item.href}
                  variant="light"
                />
              ))}
            </Stack>
          </Paper>

          {/* Page Content */}
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </Group>
      </Stack>
    </Container>
  );
}
