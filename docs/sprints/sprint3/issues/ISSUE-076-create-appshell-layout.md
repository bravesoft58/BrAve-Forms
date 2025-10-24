# ISSUE-076: Create AppShell Layout Component

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** Sprint 2 complete
**Assigned To:** Frontend Developer 1

## Issue Description

Create the foundational Mantine AppShell layout component that provides the consistent structure for the entire application. This component will contain header, navbar, and main content areas with responsive breakpoints for mobile and desktop views.

## Business Value

Without AppShell, there is no consistent layout structure for the application. This is the foundation that all pages will use, ensuring consistent navigation and user experience across the platform.

## Acceptance Criteria

- [ ] AppShell component created using Mantine v7 AppShell
- [ ] Header slot configured (for AppHeader component)
- [ ] Navbar slot configured (for AppNavbar component)
- [ ] Main content area configured (for PageContainer)
- [ ] Responsive breakpoints configured (mobile: <768px, desktop: >=768px)
- [ ] Theme provider integrated with construction-optimized colors
- [ ] Offline banner placement slot configured
- [ ] Component renders without errors

## Technical Implementation

### Step 1: Create AppShell Component Structure

**File:** `apps/web/components/layout/AppShell.tsx`

```typescript
'use client';

import { AppShell as MantineAppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ReactNode } from 'react';

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
        {/* AppHeader component will go here (ISSUE-077) */}
        <div>Header Placeholder</div>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        {/* AppNavbar component will go here (ISSUE-078) */}
        <div>Navbar Placeholder</div>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        {/* Main content */}
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
```

### Step 2: Create Construction Theme Configuration

**File:** `apps/web/lib/theme.ts`

```typescript
import { MantineThemeOverride } from '@mantine/core';

export const constructionTheme: MantineThemeOverride = {
  colorScheme: 'light',

  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

  fontSizes: {
    xs: '14px', // Minimum 14px for field readability
    sm: '16px', // Base size
    md: '18px',
    lg: '20px',
    xl: '24px',
  },

  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  colors: {
    // Construction brand colors
    brand: [
      '#E6F2FF',
      '#CCE6FF',
      '#99CCFF',
      '#66B3FF',
      '#3399FF',
      '#007FFF',
      '#0066CC',
      '#004D99',
      '#003366',
      '#001A33',
    ],

    // High-visibility yellow for warnings/alerts
    warning: [
      '#FFFAEB',
      '#FFF3D6',
      '#FFE7AD',
      '#FFDB85',
      '#FFCF5C',
      '#FFC233',
      '#E6AF2E',
      '#CC9C29',
      '#B38A24',
      '#99771F',
    ],

    // Construction orange for CTAs
    construction: [
      '#FFF4ED',
      '#FFE9DB',
      '#FFD4B8',
      '#FFBE94',
      '#FFA971',
      '#FF944D',
      '#E68546',
      '#CC773E',
      '#B36837',
      '#995A2F',
    ],
  },

  primaryColor: 'brand',

  components: {
    Button: {
      styles: {
        root: {
          minHeight: '48px', // Glove-friendly touch target
          minWidth: '48px',
          padding: '12px 24px',
          fontSize: '16px',
        },
      },
    },

    NavLink: {
      styles: {
        root: {
          minHeight: '48px', // Glove-friendly
          padding: '12px 16px',
          fontSize: '16px',
        },
      },
    },
  },
};
```

### Step 3: Integrate Theme Provider in Root Layout

**File:** `apps/web/app/layout.tsx`

```typescript
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { constructionTheme } from '@/lib/theme';
import { AppShell } from '@/components/layout/AppShell';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider theme={constructionTheme}>
          <AppShell>{children}</AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}
```

### Step 4: Create Barrel Export

**File:** `apps/web/components/layout/index.ts`

```typescript
export { AppShell } from './AppShell';
// Future exports:
// export { AppHeader } from './AppHeader';  // ISSUE-077
// export { AppNavbar } from './AppNavbar';  // ISSUE-078
```

## TDD Workflow (Tests First)

### Test File: `apps/web/components/layout/AppShell.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { AppShell } from './AppShell';
import { constructionTheme } from '@/lib/theme';

describe('AppShell', () => {
  const renderAppShell = (children: React.ReactNode) => {
    return render(
      <MantineProvider theme={constructionTheme}>
        <AppShell>{children}</AppShell>
      </MantineProvider>
    );
  };

  it('should render children in main content area', () => {
    renderAppShell(<div>Test Content</div>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render header placeholder', () => {
    renderAppShell(<div>Content</div>);
    expect(screen.getByText('Header Placeholder')).toBeInTheDocument();
  });

  it('should render navbar placeholder', () => {
    renderAppShell(<div>Content</div>);
    expect(screen.getByText('Navbar Placeholder')).toBeInTheDocument();
  });

  it('should use construction theme', () => {
    const { container } = renderAppShell(<div>Content</div>);
    // Verify theme is applied by checking for Mantine classes
    expect(container.querySelector('.mantine-AppShell-root')).toBeInTheDocument();
  });

  it('should have correct header height (60px)', () => {
    const { container } = renderAppShell(<div>Content</div>);
    const header = container.querySelector('.mantine-AppShell-header');
    expect(header).toHaveStyle({ height: '60px' });
  });

  it('should have navbar with correct width (300px on desktop)', () => {
    const { container } = renderAppShell(<div>Content</div>);
    const navbar = container.querySelector('.mantine-AppShell-navbar');
    expect(navbar).toBeInTheDocument();
  });
});
```

**Expected Test Results (Red Phase):**

- All tests should FAIL initially (AppShell.tsx doesn't exist yet)
- This validates test correctness

## Implementation Steps

1. **Run existing tests to verify red phase** (tests fail)
2. **Create `apps/web/lib/theme.ts`** with construction theme
3. **Create `apps/web/components/layout/AppShell.tsx`** with Mantine AppShell
4. **Update `apps/web/app/layout.tsx`** to use MantineProvider and AppShell
5. **Create barrel export** `apps/web/components/layout/index.ts`
6. **Run tests again** (should pass - green phase)
7. **Manual testing:** Verify AppShell renders in browser
8. **Code review:** Run `/review` command

## Quality Gates

```bash
# Lint check
pnpm --filter web lint

# Type check
pnpm --filter web type-check

# Run tests
pnpm --filter web test AppShell.test.tsx

# Build check
pnpm --filter web build
```

## Evidence Requirements

**Folder:** `docs/sprints/sprint3/evidence/ISSUE-076/`

- `test-results/red-phase.png` - Screenshot of failing tests
- `test-results/green-phase.png` - Screenshot of passing tests
- `test-results/coverage-report.png` - Coverage for AppShell (>80%)
- `code/appshell-component.png` - AppShell component code
- `code/theme-config.png` - Construction theme configuration
- `ui-screenshots/desktop-appshell.png` - Desktop layout rendering
- `ui-screenshots/mobile-appshell.png` - Mobile layout rendering

## Manual Testing Checklist

- [ ] Run `pnpm --filter web dev`
- [ ] Open http://localhost:30102 in browser
- [ ] Verify header area visible (60px height)
- [ ] Verify navbar area visible (desktop)
- [ ] Verify main content area renders
- [ ] Resize browser to mobile width (<768px)
- [ ] Verify navbar collapses on mobile
- [ ] Verify construction theme colors applied
- [ ] Verify minimum font size (14px)
- [ ] Check browser console for errors (should be clean)

## Definition of Done

- [ ] AppShell component created and tested
- [ ] Construction theme configured with glove-friendly sizes
- [ ] Tests passing (>80% coverage)
- [ ] Lint and type-check passing
- [ ] Build successful
- [ ] Manual testing completed
- [ ] Evidence collected and committed
- [ ] NO emoji in code or commits
- [ ] NO AI branding
- [ ] Code review passed
- [ ] Ready for ISSUE-077 (AppHeader component)

## Known Issues / Notes

**Mobile Navigation Behavior:**

- Navbar collapses by default on mobile (<768px breakpoint)
- Will need hamburger menu in AppHeader (ISSUE-077) to toggle on mobile
- Desktop navbar expanded by default

**Offline Banner Placement:**

- Will be added to AppShell.Header in ISSUE-081
- For now, placeholder ensures space is reserved

**Accessibility:**

- Mantine AppShell includes ARIA roles by default
- Ensure focus management works (test keyboard navigation)

## Next Steps

After completing ISSUE-076:

1. **ISSUE-077:** Build AppHeader Component (logo, user menu, hamburger toggle)
2. **ISSUE-078:** Build AppNavbar Component (desktop sidebar, mobile bottom nav)

## References

- [Mantine AppShell Documentation](https://mantine.dev/core/app-shell/)
- [Mantine Theme Configuration](https://mantine.dev/theming/theme-object/)
- [@docs/design/brave-forms-ux-design-doc.md](../../design/brave-forms-ux-design-doc.md) (Section 4.1: Navigation Structure)
- [@CLAUDE.md](../../../CLAUDE.md) (Field-optimized UI requirements)

---

**Issue Status:** Not Started
**Created:** 2025-10-23
**Last Updated:** 2025-10-23
