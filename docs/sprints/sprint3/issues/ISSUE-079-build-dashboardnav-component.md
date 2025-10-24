# ISSUE-079: Build DashboardNav Component

**Phase:** Phase 1 - Navigation Layer  
**Priority:** P0 (Must Have)  
**Estimated Time:** 2 hours  
**Dependencies:** ISSUE-078 (AppNavbar created)  
**Assigned To:** Frontend Developer 1

## Issue Description

Create the DashboardNav component with quick action widgets for Dashboard page: New Form, New Project buttons, weather alerts banner, pending tasks counter, and recent activity feed.

## Acceptance Criteria

- [ ] Quick actions widget (New Form, New Project buttons)
- [ ] Weather alerts banner (shows if rain >= 0.25")
- [ ] Pending tasks counter with link to inspections
- [ ] Recent activity feed (last 5 submissions)
- [ ] Mobile-optimized layout
- [ ] Glove-friendly 48x48dp buttons

## Technical Implementation

```typescript
// apps/web/components/dashboard/DashboardNav.tsx
'use client';

import { Paper, Group, Button, Stack, Text, Badge, Alert } from '@mantine/core';
import { IconPlus, IconCloudRain, IconAlertTriangle } from '@tabler/icons-react';

export function DashboardNav() {
  const weatherAlerts = useWeatherAlerts();
  const pendingTasks = usePendingTasks();

  return (
    <Stack spacing="md">
      {/* Quick Actions */}
      <Paper p="md" withBorder>
        <Text size="sm" weight={600} mb="md">
          Quick Actions
        </Text>
        <Group>
          <Button
            leftIcon={<IconPlus size={16} />}
            styles={{ root: { minHeight: 48 } }}
          >
            New Form
          </Button>
          <Button
            leftIcon={<IconPlus size={16} />}
            variant="light"
            styles={{ root: { minHeight: 48 } }}
          >
            New Project
          </Button>
        </Group>
      </Paper>

      {/* Weather Alerts */}
      {weatherAlerts.hasRainAlert && (
        <Alert
          icon={<IconCloudRain size={16} />}
          title="Rain Event Detected"
          color="yellow"
        >
          {weatherAlerts.rainfall} inches recorded. Inspection required within 24 hours.
        </Alert>
      )}

      {/* Pending Tasks */}
      {pendingTasks.count > 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Pending Inspections"
          color="orange"
        >
          {pendingTasks.count} inspections due today
        </Alert>
      )}
    </Stack>
  );
}
```

## Tests

```typescript
describe('DashboardNav', () => {
  it('should show weather alert when rain >= 0.25"', () => {
    (useWeatherAlerts as jest.Mock).mockReturnValue({
      hasRainAlert: true,
      rainfall: 0.35,
    });
    render(<DashboardNav />);
    expect(screen.getByText(/0.35 inches recorded/)).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/quick-actions.png
- ui-screenshots/weather-alert.png
- ui-screenshots/pending-tasks.png

## Definition of Done

- [ ] Quick actions functional
- [ ] Weather alerts display correctly
- [ ] Pending tasks counter working
- [ ] Tests passing
- [ ] Ready for ISSUE-080

---

**Issue Status:** Not Started  
**Created:** 2025-10-23
