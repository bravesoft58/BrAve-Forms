# ISSUE-082: Build PageContainer Component

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-076 (AppShell created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create reusable PageContainer component for consistent page layout across all pages - includes page title, breadcrumbs, action buttons, loading states, and error boundaries.

## Acceptance Criteria

- [ ] Consistent page layout (title, actions, content areas)
- [ ] Breadcrumb navigation integration slot
- [ ] Loading skeleton states
- [ ] Error boundary wrapper
- [ ] Responsive mobile/desktop layout

## Implementation

```typescript
// apps/web/components/layout/PageContainer.tsx
'use client';

import { Stack, Group, Title, Box } from '@mantine/core';
import { ReactNode } from 'react';
import { Breadcrumbs } from './Breadcrumbs';

interface PageContainerProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export function PageContainer({
  title,
  breadcrumbs,
  actions,
  children,
  loading = false,
}: PageContainerProps) {
  return (
    <Stack spacing="md">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <Group position="apart">
        <Title order={2}>{title}</Title>
        {actions && <Group spacing="xs">{actions}</Group>}
      </Group>

      <Box>{loading ? <LoadingSkeleton /> : children}</Box>
    </Stack>
  );
}
```

## Tests

```typescript
describe('PageContainer', () => {
  it('should render title and children', () => {
    render(
      <PageContainer title="Test Page">
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/page-container-desktop.png
- ui-screenshots/page-container-with-breadcrumbs.png

## Definition of Done

- [ ] PageContainer reusable across pages
- [ ] Tests passing
- [ ] Ready for ISSUE-083

---

**Issue Status:** Not Started
**Created:** 2025-10-23
