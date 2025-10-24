# ISSUE-084: Build Dashboard Home Page

**Phase:** Phase 2 - Core Pages
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** Phase 1 complete
**Assigned To:** Frontend Developer 1

## Issue Description

Create Dashboard home page - entry point of application with welcome message, weather alerts, pending tasks, quick actions, and recent activity feed.

## Acceptance Criteria

- [ ] Welcome message with user name
- [ ] Weather alerts widget (if rain >= 0.25")
- [ ] Pending tasks list (inspections due today)
- [ ] Quick actions (New Form, View Projects)
- [ ] Recent activity feed (last 5 submissions)
- [ ] Responsive grid layout

## Implementation

```typescript
// apps/web/app/dashboard/page.tsx
'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { SimpleGrid, Paper, Text } from '@mantine/core';
import { useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <PageContainer
      title={`Welcome, ${user?.firstName || 'User'}`}
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <DashboardNav />

        <Paper p="md" withBorder>
          <Text size="sm" weight={600} mb="md">
            Recent Activity
          </Text>
          <RecentActivityList limit={5} />
        </Paper>
      </SimpleGrid>
    </PageContainer>
  );
}
```

## Tests

```typescript
describe('Dashboard Page', () => {
  it('should show welcome message with user name', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Welcome, John/)).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/dashboard-desktop.png
- ui-screenshots/dashboard-mobile.png
- ui-screenshots/dashboard-with-alerts.png

## Definition of Done

- [ ] Dashboard renders correctly
- [ ] All widgets functional
- [ ] Tests passing
- [ ] Ready for ISSUE-085

---

**Issue Status:** Not Started
**Created:** 2025-10-23
