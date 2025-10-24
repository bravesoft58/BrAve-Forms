'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Group,
  ActionIcon,
  TextInput,
  Menu,
  Avatar,
  Text,
  Tooltip,
  useMantineTheme,
  rem,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSearch,
  IconMenu2,
  IconCloud,
  IconCloudCheck,
  IconCloudX,
  IconSettings,
  IconLogout,
  IconUser,
} from '@tabler/icons-react';
import { toggleMobileMenu } from '@/lib/stores/navigation-store';

/**
 * Sync status type
 * - synced: All changes saved (green)
 * - syncing: Upload in progress (yellow)
 * - offline: No connection (red)
 */
type SyncStatus = 'synced' | 'syncing' | 'offline';

interface AppHeaderProps {
  /**
   * Current user information
   * TODO: Connect to Clerk auth in Sprint 4
   */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };

  /**
   * Sync status for offline indicator
   * Defaults to 'synced'
   */
  syncStatus?: SyncStatus;

  /**
   * Last sync timestamp
   * Used for tooltip display
   */
  lastSyncTime?: Date;

  /**
   * Search handler
   * Called when user submits search query
   */
  onSearch?: (query: string) => void;
}

/**
 * AppHeader Component
 *
 * Modern, professional header with:
 * - Logo + branding (click to home)
 * - Search bar (desktop expands, mobile opens modal)
 * - Sync indicator (green/yellow/red status)
 * - User menu dropdown (Settings, Sign Out)
 * - Mobile hamburger menu (toggles sidebar)
 *
 * Design follows research from UI_UX_DESIGN_RESEARCH.md:
 * - Fieldwire simplicity + Procore polish
 * - 48x48dp touch targets (glove-friendly)
 * - High contrast for sunlight readability
 * - Construction blue/orange palette
 *
 * Responsive behavior:
 * - Desktop (≥1024px): Logo + search + sync + user
 * - Mobile (<768px): Hamburger + logo + sync + user
 */
export function AppHeader({
  user = { name: 'Q&D Construction', email: 'admin@qdconstruction.com' },
  syncStatus = 'synced',
  lastSyncTime = new Date(),
  onSearch,
}: AppHeaderProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  /**
   * Get sync icon and color based on status
   */
  const getSyncIndicator = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: IconCloudCheck,
          color: theme.colors.green[6], // Success green
          label: `Last synced ${getRelativeTime(lastSyncTime)}`,
        };
      case 'syncing':
        return {
          icon: IconCloud,
          color: theme.colors.yellow[6], // Warning yellow
          label: 'Syncing changes...',
        };
      case 'offline':
        return {
          icon: IconCloudX,
          color: theme.colors.red[6], // Error red
          label: 'Offline - changes will sync when connected',
        };
    }
  };

  /**
   * Format relative time for last sync
   */
  const getRelativeTime = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  /**
   * Handle search submit
   */
  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
      setSearchQuery('');
      setSearchExpanded(false);
    }
  };

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const { icon: SyncIcon, color: syncColor, label: syncLabel } = getSyncIndicator();

  return (
    <Group
      h={64}
      px={isMobile ? 'md' : 'xl'}
      justify="space-between"
      style={{
        backgroundColor: theme.white,
        borderBottom: `1px solid ${theme.colors.gray[2]}`,
      }}
    >
      {/* Left Section: Hamburger (mobile) + Logo */}
      <Group gap="md">
        {isMobile && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size={48}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <IconMenu2 size={24} />
          </ActionIcon>
        )}

        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: rem(8),
          }}
        >
          {/* Logo placeholder - will be replaced with actual logo */}
          <div
            style={{
              width: rem(32),
              height: rem(32),
              borderRadius: rem(8),
              backgroundColor: theme.colors.blue[6],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: rem(16),
            }}
          >
            BF
          </div>

          {/* Brand name - hidden on very small mobile */}
          {!isMobile && (
            <Text size="lg" fw={600} c={theme.colors.blue[6]} style={{ userSelect: 'none' }}>
              BrAve Forms
            </Text>
          )}
        </Link>
      </Group>

      {/* Right Section: Search + Sync + User */}
      <Group gap="sm">
        {/* Search - Desktop expands, Mobile opens modal */}
        {!isMobile && searchExpanded ? (
          <TextInput
            placeholder="Search projects, forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
              if (e.key === 'Escape') setSearchExpanded(false);
            }}
            onBlur={() => setSearchExpanded(false)}
            autoFocus
            rightSection={
              <ActionIcon variant="subtle" onClick={handleSearch}>
                <IconSearch size={18} />
              </ActionIcon>
            }
            style={{ width: rem(300) }}
          />
        ) : (
          <Tooltip label="Search" position="bottom">
            <ActionIcon
              variant="subtle"
              color="gray"
              size={48}
              onClick={() => setSearchExpanded(true)}
              aria-label="Search"
            >
              <IconSearch size={20} />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Sync Indicator */}
        <Tooltip label={syncLabel} position="bottom">
          <ActionIcon
            variant="subtle"
            size={48}
            style={{ color: syncColor }}
            aria-label={syncLabel}
          >
            <SyncIcon size={20} />
          </ActionIcon>
        </Tooltip>

        {/* User Menu */}
        <Menu width={240} position="bottom-end" shadow="md" offset={8}>
          <Menu.Target>
            <ActionIcon variant="subtle" size={48} radius="xl" aria-label="User menu">
              {user.avatar ? (
                <Avatar src={user.avatar} size={32} radius="xl" />
              ) : (
                <Avatar color="blue" size={32} radius="xl">
                  {getUserInitials(user.name)}
                </Avatar>
              )}
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <Text size="sm" fw={500}>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
            </Menu.Label>

            <Menu.Divider />

            <Menu.Item
              leftSection={<IconUser size={16} />}
              component={Link}
              href="/settings/profile"
            >
              Profile
            </Menu.Item>

            <Menu.Item leftSection={<IconSettings size={16} />} component={Link} href="/settings">
              Settings
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={() => {
                // TODO: Implement sign out in Sprint 4 with Clerk
              }}
            >
              Sign Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}
