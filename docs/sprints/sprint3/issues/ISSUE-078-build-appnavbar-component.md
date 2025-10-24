# ISSUE-078: Build AppNavbar Component

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-077 (AppHeader created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create the AppNavbar component with dual-mode navigation: desktop sidebar (vertical) and mobile bottom navigation (horizontal 5 tabs). Includes active route highlighting and glove-friendly 48x48dp touch targets.

## Acceptance Criteria

- [ ] AppNavbar component with desktop sidebar layout
- [ ] Mobile bottom navigation with 5 tabs (Dashboard, Projects, Forms, Inspections, Settings)
- [ ] Active route highlighting
- [ ] Touch targets minimum 48x48dp
- [ ] Icons + labels for clarity
- [ ] Responsive (mobile <768px, desktop >=768px)
- [ ] Integrates with AppShell navbar slot

## Technical Implementation

### Desktop Sidebar Navigation

```typescript
// apps/web/components/layout/AppNavbar.tsx
'use client';

import { Navbar, NavLink, Stack, Box } from '@mantine/core';
import {
  IconDashboard,
  IconFolder,
  IconForms,
  IconClipboardCheck,
  IconSettings,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: IconDashboard, href: '/dashboard' },
  { label: 'Projects', icon: IconFolder, href: '/dashboard/projects' },
  { label: 'Forms', icon: IconForms, href: '/dashboard/forms' },
  { label: 'Inspections', icon: IconClipboardCheck, href: '/dashboard/inspections' },
  { label: 'Settings', icon: IconSettings, href: '/dashboard/settings' },
];

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* Desktop Sidebar */}
      <Navbar.Section
        grow
        p="md"
        visibleFrom="sm"
      >
        <Stack spacing="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              icon={<item.icon size={20} />}
              active={pathname.startsWith(item.href)}
              onClick={() => router.push(item.href)}
              styles={{
                root: {
                  minHeight: 48,
                  borderRadius: 8,
                },
              }}
            />
          ))}
        </Stack>
      </Navbar.Section>

      {/* Mobile Bottom Navigation */}
      <Box
        hiddenFrom="sm"
        sx={(theme) => ({
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.white,
          borderTop: `1px solid ${theme.colors.gray[3]}`,
          display: 'flex',
          justifyContent: 'space-around',
          padding: theme.spacing.xs,
          zIndex: 100,
        })}
      >
        {navItems.map((item) => (
          <MobileNavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname.startsWith(item.href)}
            onClick={() => router.push(item.href)}
          />
        ))}
      </Box>
    </>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <Box
      onClick={onClick}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 48,
        minHeight: 48,
        cursor: 'pointer',
        color: active ? theme.colors.blue[6] : theme.colors.gray[6],
        '&:active': {
          backgroundColor: theme.colors.gray[1],
        },
      })}
    >
      <Icon size={24} />
      <Text size="xs" mt={2}>
        {label}
      </Text>
    </Box>
  );
}
```

## Tests

```typescript
describe('AppNavbar', () => {
  it('should render all navigation items', () => {
    render(<AppNavbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/projects');
    render(<AppNavbar />);
    const projectsLink = screen.getByText('Projects').closest('.mantine-NavLink-root');
    expect(projectsLink).toHaveClass('mantine-NavLink-active');
  });
});
```

## Evidence Requirements

- test-results/ (red → green phase)
- ui-screenshots/desktop-sidebar.png
- ui-screenshots/mobile-bottom-nav.png
- ui-screenshots/active-route-highlight.png

## Definition of Done

- [ ] Desktop sidebar navigation functional
- [ ] Mobile bottom navigation functional
- [ ] Active route highlighting working
- [ ] Touch targets >= 48x48dp verified
- [ ] Tests passing (>80% coverage)
- [ ] NO emoji, NO AI branding
- [ ] Ready for ISSUE-079

---

**Issue Status:** Not Started
**Created:** 2025-10-23
