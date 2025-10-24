# ISSUE-083: Build Breadcrumbs Component

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-082 (PageContainer created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create Breadcrumbs component for hierarchical navigation - dynamically generated from route, clickable to navigate up hierarchy, mobile-optimized (show only last 2 crumbs).

## Acceptance Criteria

- [ ] Dynamic breadcrumb generation from route
- [ ] Clickable to navigate up hierarchy
- [ ] Mobile: Show only last 2 crumbs
- [ ] Desktop: Show full path
- [ ] Example: Home > Projects > Project Name > Forms

## Implementation

```typescript
// apps/web/components/layout/Breadcrumbs.tsx
'use client';

import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // On mobile, show only last 2 items
  const visibleItems = isMobile ? items.slice(-2) : items;

  return (
    <MantineBreadcrumbs separator=">" separatorMargin="xs">
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;

        if (isLast || !item.href) {
          return (
            <Text key={index} size="sm" color="dimmed">
              {item.label}
            </Text>
          );
        }

        return (
          <Anchor
            key={index}
            size="sm"
            onClick={() => router.push(item.href!)}
          >
            {item.label}
          </Anchor>
        );
      })}
    </MantineBreadcrumbs>
  );
}
```

## Tests

```typescript
describe('Breadcrumbs', () => {
  it('should render all breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'Project X' },
    ];
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Project X')).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/breadcrumbs-desktop.png
- ui-screenshots/breadcrumbs-mobile.png

## Definition of Done

- [ ] Breadcrumbs functional
- [ ] Mobile optimization working
- [ ] Tests passing
- [ ] Ready for Phase 2 (ISSUE-084)

---

**Issue Status:** Not Started
**Created:** 2025-10-23
