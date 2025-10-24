# ISSUE-077: Build AppHeader Component

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-076 (AppShell created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create the AppHeader component that displays in the AppShell header slot. This component includes the BrAve Forms logo, user navigation dropdown, offline sync indicator, and mobile hamburger menu toggle for navigation.

## Business Value

The header is the primary navigation anchor point that users see on every page. It provides brand identity (logo), user context (who's logged in), connectivity status (offline indicator), and mobile navigation access (hamburger menu).

## Acceptance Criteria

- [ ] AppHeader component created with Mantine Header
- [ ] BrAve Forms logo displayed in top-left
- [ ] User navigation dropdown in top-right (name, profile, sign out)
- [ ] Offline sync indicator visible when disconnected
- [ ] Mobile hamburger menu toggle (opens/closes navbar)
- [ ] Desktop: Navbar toggle button (collapse/expand sidebar)
- [ ] Responsive layout (mobile: <768px, desktop: >=768px)
- [ ] 60px height (matches AppShell header config)
- [ ] Component renders without errors

## Technical Implementation

### Step 1: Create AppHeader Component

**File:** `apps/web/components/layout/AppHeader.tsx`

```typescript
'use client';

import { Header, Group, Burger, Avatar, Menu, Text, Badge, ActionIcon } from '@mantine/core';
import { IconSettings, IconLogout, IconWifi, IconWifiOff, IconRefresh } from '@tabler/icons-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

interface AppHeaderProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile: () => void;
  toggleDesktop: () => void;
}

export function AppHeader({
  mobileOpened,
  desktopOpened,
  toggleMobile,
  toggleDesktop,
}: AppHeaderProps) {
  const { user } = useUser();
  const router = useRouter();
  const isOnline = useOnlineStatus(); // Custom hook
  const pendingSyncCount = usePendingSyncCount(); // Custom hook

  return (
    <Header height={60} px="md">
      <Group position="apart" sx={{ height: '100%' }}>
        {/* Left: Logo + Mobile Burger */}
        <Group spacing="md">
          {/* Mobile burger menu */}
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            size="sm"
            hiddenFrom="sm"
          />

          {/* Desktop navbar toggle */}
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            size="sm"
            visibleFrom="sm"
          />

          {/* Logo */}
          <Logo height={36} />
        </Group>

        {/* Right: Offline Indicator + User Menu */}
        <Group spacing="md">
          {/* Offline indicator */}
          {!isOnline && (
            <Badge
              color="yellow"
              variant="filled"
              leftSection={<IconWifiOff size={14} />}
            >
              Offline {pendingSyncCount > 0 && `(${pendingSyncCount})`}
            </Badge>
          )}

          {/* Sync button (when offline with pending items) */}
          {!isOnline && pendingSyncCount > 0 && (
            <ActionIcon
              variant="light"
              color="blue"
              title="Sync when online"
              disabled
            >
              <IconRefresh size={18} />
            </ActionIcon>
          )}

          {/* User menu */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Group
                spacing="xs"
                sx={(theme) => ({
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: theme.radius.sm,
                  '&:hover': {
                    backgroundColor: theme.colors.gray[0],
                  },
                })}
              >
                <Avatar
                  src={user?.imageUrl}
                  radius="xl"
                  size={32}
                  color="blue"
                >
                  {user?.firstName?.[0]}
                </Avatar>
                <Text size="sm" weight={500} visibleFrom="sm">
                  {user?.firstName || 'User'}
                </Text>
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>{user?.emailAddresses[0]?.emailAddress}</Menu.Label>

              <Menu.Item
                icon={<IconSettings size={14} />}
                onClick={() => router.push('/dashboard/settings')}
              >
                Settings
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                icon={<IconLogout size={14} />}
                color="red"
                onClick={() => router.push('/sign-out')}
              >
                Sign Out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Header>
  );
}
```

### Step 2: Create Logo Component

**File:** `apps/web/components/ui/Logo.tsx`

```typescript
import { Text, Group } from '@mantine/core';
import { IconForms } from '@tabler/icons-react';

interface LogoProps {
  height?: number;
}

export function Logo({ height = 36 }: LogoProps) {
  return (
    <Group spacing="xs">
      <IconForms size={height} color="#007FFF" />
      <Text
        size="xl"
        weight={700}
        sx={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
          color: '#007FFF',
        }}
      >
        BrAve Forms
      </Text>
    </Group>
  );
}
```

### Step 3: Create Custom Hooks

**File:** `apps/web/hooks/useOnlineStatus.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**File:** `apps/web/hooks/usePendingSyncCount.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getOfflineQueueCount } from '@/lib/forms/offlineQueue';

export function usePendingSyncCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const queueCount = await getOfflineQueueCount();
      setCount(queueCount);
    };

    updateCount();

    // Update count every 10 seconds
    const interval = setInterval(updateCount, 10000);

    return () => clearInterval(interval);
  }, []);

  return count;
}
```

### Step 4: Update AppShell to Use AppHeader

**File:** `apps/web/components/layout/AppShell.tsx` (UPDATE)

```typescript
'use client';

import { AppShell as MantineAppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <AppHeader
          mobileOpened={mobileOpened}
          desktopOpened={desktopOpened}
          toggleMobile={toggleMobile}
          toggleDesktop={toggleDesktop}
        />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        {/* AppNavbar component will go here (ISSUE-078) */}
        <div>Navbar Placeholder</div>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
```

### Step 5: Update Barrel Export

**File:** `apps/web/components/layout/index.ts` (UPDATE)

```typescript
export { AppShell } from './AppShell';
export { AppHeader } from './AppHeader';
```

## TDD Workflow (Tests First)

### Test File: `apps/web/components/layout/AppHeader.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { AppHeader } from './AppHeader';
import { useUser } from '@clerk/nextjs';

jest.mock('@clerk/nextjs');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AppHeader', () => {
  const defaultProps = {
    mobileOpened: false,
    desktopOpened: true,
    toggleMobile: jest.fn(),
    toggleDesktop: jest.fn(),
  };

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({
      user: {
        firstName: 'John',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
        imageUrl: null,
      },
    });
  });

  const renderHeader = (props = {}) => {
    return render(
      <MantineProvider>
        <AppHeader {...defaultProps} {...props} />
      </MantineProvider>
    );
  };

  it('should render logo', () => {
    renderHeader();
    expect(screen.getByText('BrAve Forms')).toBeInTheDocument();
  });

  it('should render user name', () => {
    renderHeader();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should toggle mobile menu when burger clicked', () => {
    const toggleMobile = jest.fn();
    renderHeader({ toggleMobile });

    const burger = screen.getAllByRole('button')[0]; // Mobile burger
    fireEvent.click(burger);

    expect(toggleMobile).toHaveBeenCalledTimes(1);
  });

  it('should show offline badge when offline', () => {
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    renderHeader();
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });

  it('should open user menu when avatar clicked', () => {
    renderHeader();

    const avatar = screen.getByText('John').closest('div');
    fireEvent.click(avatar!);

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});
```

**Expected Test Results (Red Phase):**

- All tests should FAIL initially (AppHeader.tsx doesn't exist yet)
- This validates test correctness

## Implementation Steps

1. **Run existing tests** to verify red phase (tests fail)
2. **Create `apps/web/components/ui/Logo.tsx`** with BrAve Forms branding
3. **Create `apps/web/hooks/useOnlineStatus.ts`** for connectivity detection
4. **Create `apps/web/hooks/usePendingSyncCount.ts`** for offline queue count
5. **Create `apps/web/components/layout/AppHeader.tsx`** with all features
6. **Update `apps/web/components/layout/AppShell.tsx`** to use AppHeader
7. **Run tests again** (should pass - green phase)
8. **Manual testing:** Verify header renders correctly
9. **Code review:** Run `/review` command

## Quality Gates

```bash
# Lint check
pnpm --filter web lint

# Type check
pnpm --filter web type-check

# Run tests
pnpm --filter web test AppHeader.test.tsx

# Build check
pnpm --filter web build
```

## Evidence Requirements

**Folder:** `docs/sprints/sprint3/evidence/ISSUE-077/`

- `test-results/red-phase.png` - Screenshot of failing tests
- `test-results/green-phase.png` - Screenshot of passing tests
- `test-results/coverage-report.png` - Coverage for AppHeader (>80%)
- `code/appheader-component.png` - AppHeader component code
- `code/logo-component.png` - Logo component code
- `ui-screenshots/desktop-header-online.png` - Desktop header when online
- `ui-screenshots/desktop-header-offline.png` - Desktop header when offline
- `ui-screenshots/mobile-header.png` - Mobile header with burger menu
- `ui-screenshots/user-menu-open.png` - User dropdown menu

## Manual Testing Checklist

- [ ] Run `pnpm --filter web dev`
- [ ] Open http://localhost:30102 in browser
- [ ] Verify BrAve Forms logo displays in header
- [ ] Verify user name displays (from Clerk)
- [ ] Click user avatar - verify dropdown menu appears
- [ ] Click "Settings" in dropdown - verify navigation
- [ ] Click "Sign Out" in dropdown - verify sign out flow
- [ ] Open DevTools Network tab, set to offline
- [ ] Verify "Offline" badge appears
- [ ] Resize browser to mobile (<768px)
- [ ] Verify mobile burger menu appears
- [ ] Click mobile burger - verify navbar toggles
- [ ] Resize to desktop (>=768px)
- [ ] Click desktop burger - verify navbar collapses/expands
- [ ] Verify header height is exactly 60px

## Definition of Done

- [ ] AppHeader component created and tested
- [ ] Logo component created
- [ ] Online/offline status hooks created
- [ ] User menu functional (Settings, Sign Out)
- [ ] Mobile and desktop burger menus working
- [ ] Offline badge displays when disconnected
- [ ] Tests passing (>80% coverage)
- [ ] Lint and type-check passing
- [ ] Build successful
- [ ] Manual testing completed
- [ ] Evidence collected and committed
- [ ] NO emoji in code or commits
- [ ] NO AI branding
- [ ] Code review passed
- [ ] Ready for ISSUE-078 (AppNavbar component)

## Known Issues / Notes

**Clerk User Context:**

- Requires Clerk authentication to be configured
- Will show "User" as fallback if user not loaded
- Email address comes from Clerk user object

**Offline Detection:**

- Uses browser `navigator.onLine` API
- May not be 100% accurate (can show online even if no internet)
- Service Worker can provide more reliable detection

**Pending Sync Count:**

- Requires offline queue implementation (from Sprint 2 or earlier)
- Count updates every 10 seconds
- If offline queue not yet implemented, will show 0

**Mobile Responsiveness:**

- Mobile burger: Shows <768px breakpoint
- Desktop burger: Shows >=768px breakpoint
- Uses Mantine `hiddenFrom` and `visibleFrom` props

## Next Steps

After completing ISSUE-077:

1. **ISSUE-078:** Build AppNavbar Component (desktop sidebar + mobile bottom nav)
2. **ISSUE-079:** Build DashboardNav Component (quick actions, weather alerts)

## References

- [Mantine Header Documentation](https://mantine.dev/core/app-shell/)
- [Mantine Menu Documentation](https://mantine.dev/core/menu/)
- [Clerk useUser Hook](https://clerk.com/docs/references/react/use-user)
- [@docs/design/brave-forms-ux-design-doc.md](../../design/brave-forms-ux-design-doc.md) (Section 4.1: Header Navigation)
- [@CLAUDE.md](../../../CLAUDE.md) (Navigation patterns, no emoji, no AI branding)

---

**Issue Status:** Not Started
**Created:** 2025-10-23
**Last Updated:** 2025-10-23
