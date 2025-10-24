# ISSUE-081: Build OfflineBanner Component

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 1 hour
**Dependencies:** ISSUE-076 (AppShell created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create OfflineBanner component that displays at top of page when user is offline, showing pending sync count and manual sync trigger button.

## Acceptance Criteria

- [ ] Display "You are offline" message when disconnected
- [ ] Show pending sync count (X items waiting)
- [ ] Manual sync button (disabled when offline)
- [ ] Auto-hide when connection restored
- [ ] Non-intrusive design (doesn't block content)

## Implementation

```typescript
// apps/web/components/layout/OfflineBanner.tsx
'use client';

import { Alert, Button, Group } from '@mantine/core';
import { IconWifiOff, IconRefresh } from '@tabler/icons-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const pendingCount = usePendingSyncCount();

  if (isOnline) return null;

  return (
    <Alert
      icon={<IconWifiOff size={16} />}
      title="You are offline"
      color="yellow"
      withCloseButton={false}
      styles={{ root: { marginBottom: 16 } }}
    >
      <Group position="apart">
        <Text size="sm">
          {pendingCount > 0
            ? `${pendingCount} items waiting to sync`
            : 'Working offline'}
        </Text>
        <Button
          size="xs"
          variant="light"
          leftIcon={<IconRefresh size={14} />}
          disabled
        >
          Sync When Online
        </Button>
      </Group>
    </Alert>
  );
}
```

## Tests

```typescript
describe('OfflineBanner', () => {
  it('should not render when online', () => {
    (useOnlineStatus as jest.Mock).mockReturnValue(true);
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when offline', () => {
    (useOnlineStatus as jest.Mock).mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByText('You are offline')).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/offline-banner-shown.png
- ui-screenshots/offline-banner-with-pending.png

## Definition of Done

- [ ] Banner shows when offline
- [ ] Banner hides when online
- [ ] Tests passing
- [ ] Ready for ISSUE-082

---

**Issue Status:** Not Started
**Created:** 2025-10-23
