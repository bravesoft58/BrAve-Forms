# ISSUE-138: Notification Preferences Page (2h)

**Priority:** P1
**Phase:** Phase 3 - Settings & Profile
**Estimated Hours:** 2
**Dependencies:** ISSUE-137
**Sprint:** Sprint 5

---

## Objective

Create a granular notification preferences page allowing field workers to control which events trigger notifications (email, push, SMS) for compliance deadlines, weather alerts, and team updates.

## Tasks

- [ ] Create /settings/notifications route in Next.js App Router
- [ ] Fetch notification preferences from backend
- [ ] Create notification type toggles (compliance, weather, team, forms)
- [ ] Create channel preferences per notification type (email/push/SMS)
- [ ] Implement quiet hours schedule (no notifications during off-hours)
- [ ] Add notification preview/test feature
- [ ] Implement save preferences with optimistic updates
- [ ] Add unit tests for notification logic

## Technical Details

**Libraries/Dependencies:**

- Clerk (notification preferences via metadata)
- React Hook Form + Zod (form validation)
- Mantine Form components
- Day.js (quiet hours time picker)

**Code Example:**

```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch, Button, Stack, Group, Text, Divider, TimeInput } from '@mantine/core';
import { IconBell, IconClock, IconAlertTriangle, IconUsers, IconForms } from '@tabler/icons-react';

const notificationPreferencesSchema = z.object({
  compliance: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  weather: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  team: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  forms: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string(), // HH:mm format
    end: z.string(),
  }),
});

export default function NotificationPreferencesPage() {
  const { user } = useUser();

  const form = useForm({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: user?.publicMetadata?.notificationPreferences ?? {
      compliance: { email: true, push: true, sms: false },
      weather: { email: true, push: true, sms: true },
      team: { email: true, push: false, sms: false },
      forms: { email: false, push: true, sms: false },
      quietHours: { enabled: false, start: '22:00', end: '07:00' },
    },
  });

  const onSubmit = async (data: z.infer<typeof notificationPreferencesSchema>) => {
    await user?.update({
      publicMetadata: {
        ...user.publicMetadata,
        notificationPreferences: data,
      },
    });
  };

  const sendTestNotification = async () => {
    // Send test notification to verify settings
    await fetch('/api/notifications/test', { method: 'POST' });
  };

  const notificationTypes = [
    {
      key: 'compliance',
      icon: IconAlertTriangle,
      label: 'Compliance Deadlines',
      description: 'EPA/OSHA inspection deadlines, permit expirations',
    },
    {
      key: 'weather',
      icon: IconClock,
      label: 'Weather Alerts',
      description: '0.25" rain events, storm warnings',
    },
    {
      key: 'team',
      icon: IconUsers,
      label: 'Team Updates',
      description: 'Form assignments, approvals, mentions',
    },
    {
      key: 'forms',
      icon: IconForms,
      label: 'Form Activity',
      description: 'Form submissions, rejections, comments',
    },
  ];

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="xl" fw={600}>Notification Preferences</Text>
        <Button variant="outline" onClick={sendTestNotification}>
          Send Test Notification
        </Button>
      </Group>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="xl">
          {notificationTypes.map(({ key, icon: Icon, label, description }) => (
            <div key={key}>
              <Group gap="xs" mb="xs">
                <Icon size={20} />
                <div>
                  <Text size="sm" fw={500}>{label}</Text>
                  <Text size="xs" c="dimmed">{description}</Text>
                </div>
              </Group>

              <Group gap="xl">
                <Switch
                  label="Email"
                  {...form.register(`${key}.email`)}
                />
                <Switch
                  label="Push"
                  {...form.register(`${key}.push`)}
                />
                <Switch
                  label="SMS"
                  {...form.register(`${key}.sms`)}
                />
              </Group>

              <Divider my="md" />
            </div>
          ))}

          <div>
            <Text size="sm" fw={500} mb="xs">Quiet Hours</Text>
            <Text size="xs" c="dimmed" mb="md">
              Pause non-critical notifications during off-hours (compliance alerts always sent)
            </Text>

            <Stack gap="xs">
              <Switch
                label="Enable quiet hours"
                {...form.register('quietHours.enabled')}
              />

              {form.watch('quietHours.enabled') && (
                <Group>
                  <TimeInput
                    label="Start"
                    {...form.register('quietHours.start')}
                  />
                  <TimeInput
                    label="End"
                    {...form.register('quietHours.end')}
                  />
                </Group>
              )}
            </Stack>
          </div>

          <Button type="submit" loading={form.formState.isSubmitting}>
            Save Preferences
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
```

## Acceptance Criteria

- [ ] /settings/notifications route displays all notification types
- [ ] Granular control per notification type (compliance, weather, team, forms)
- [ ] Channel preferences (email, push, SMS) toggle correctly
- [ ] Quiet hours schedule functional
- [ ] Test notification button sends real notification
- [ ] Save preferences updates Clerk metadata
- [ ] Form validation errors display correctly
- [ ] Success notification on save

## Testing Requirements

**Unit Tests:**

- Test notification preferences validation
- Test quiet hours logic
- Test channel toggle combinations

**Integration Tests:**

- Test save preferences with Clerk
- Test notification delivery with preferences
- Test quiet hours enforcement

**Manual Testing:**

- Toggle all notification types
- Test quiet hours (verify notifications paused)
- Send test notification to verify delivery
- Test compliance notifications always sent (even during quiet hours)

## Evidence Requirements

- [ ] Screenshot: Notification preferences page
- [ ] Screenshot: Granular channel toggles
- [ ] Screenshot: Quiet hours configuration
- [ ] Screenshot: Test notification received
- [ ] Test Results: Notification tests (>80% coverage)

## Success Criteria

Notification preferences page is complete when:

- All notification types configurable
- Channel preferences work correctly
- Quiet hours functional
- Test notification delivered successfully
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
