# ISSUE-142: Account Settings Page (3h)

**Priority:** P1
**Phase:** Phase 3 - Settings & Profile
**Estimated Hours:** 3
**Dependencies:** ISSUE-162
**Sprint:** Sprint 5

---

## Objective

Create an account settings page for managing email/push notifications, timezone, date/time format preferences, and language settings for field workers.

## Tasks

- [ ] Create /settings/account route in Next.js App Router
- [ ] Fetch user preferences from backend
- [ ] Create notification preferences form (email, push, SMS)
- [ ] Create timezone selector with auto-detection
- [ ] Create date/time format preferences (12/24 hour, MM/DD vs DD/MM)
- [ ] Create language selector (English, Spanish)
- [ ] Implement save preferences with optimistic updates
- [ ] Add reset to defaults button
- [ ] Add unit tests for preferences logic

## Technical Details

**Libraries/Dependencies:**

- Clerk (user preferences via metadata)
- React Hook Form + Zod (form validation)
- Mantine Form components
- Intl API (timezone detection)

**Code Example:**

```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select, Switch, Button, Stack, Group, Text } from '@mantine/core';

const accountSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  language: z.enum(['en', 'es']),
});

export default function AccountSettingsPage() {
  const { user } = useUser();

  const form = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      emailNotifications: user?.publicMetadata?.emailNotifications ?? true,
      pushNotifications: user?.publicMetadata?.pushNotifications ?? true,
      smsNotifications: user?.publicMetadata?.smsNotifications ?? false,
      timezone: user?.publicMetadata?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: user?.publicMetadata?.dateFormat ?? 'MM/DD/YYYY',
      timeFormat: user?.publicMetadata?.timeFormat ?? '12h',
      language: user?.publicMetadata?.language ?? 'en',
    },
  });

  const onSubmit = async (data: z.infer<typeof accountSettingsSchema>) => {
    await user?.update({
      publicMetadata: {
        ...user.publicMetadata,
        ...data,
      },
    });

    // Apply settings immediately
    applyTimezone(data.timezone);
    applyLanguage(data.language);
  };

  const resetToDefaults = () => {
    form.reset({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
    });
  };

  return (
    <Stack>
      <Text size="xl" fw={600}>Account Settings</Text>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="lg">
          <div>
            <Text size="sm" fw={500} mb="xs">Notifications</Text>
            <Stack gap="xs">
              <Switch
                label="Email notifications"
                {...form.register('emailNotifications')}
              />
              <Switch
                label="Push notifications"
                {...form.register('pushNotifications')}
              />
              <Switch
                label="SMS notifications"
                {...form.register('smsNotifications')}
              />
            </Stack>
          </div>

          <Select
            label="Timezone"
            data={TIMEZONES}
            searchable
            {...form.register('timezone')}
            error={form.formState.errors.timezone?.message}
          />

          <Select
            label="Date Format"
            data={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
            ]}
            {...form.register('dateFormat')}
            error={form.formState.errors.dateFormat?.message}
          />

          <Select
            label="Time Format"
            data={[
              { value: '12h', label: '12-hour (2:30 PM)' },
              { value: '24h', label: '24-hour (14:30)' },
            ]}
            {...form.register('timeFormat')}
            error={form.formState.errors.timeFormat?.message}
          />

          <Select
            label="Language"
            data={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
            ]}
            {...form.register('language')}
            error={form.formState.errors.language?.message}
          />

          <Group>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Save Settings
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}

// Auto-detect timezone on first load
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
].map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }));
```

## Acceptance Criteria

- [ ] /settings/account route displays all account settings
- [ ] Notification preferences toggle correctly
- [ ] Timezone selector with auto-detection working
- [ ] Date/time format changes apply immediately
- [ ] Language selector functional (English, Spanish)
- [ ] Save settings button updates Clerk metadata
- [ ] Reset to defaults restores original values
- [ ] Form validation errors display correctly
- [ ] Success notification on save

## Testing Requirements

**Unit Tests:**

- Test preferences form validation
- Test timezone auto-detection
- Test reset to defaults

**Integration Tests:**

- Test save preferences with Clerk
- Test language change propagation
- Test date/time format application

**Manual Testing:**

- Change all notification preferences
- Test timezone detection accuracy
- Change date/time formats and verify display
- Test language switching

## Evidence Requirements

- [ ] Screenshot: Account settings page
- [ ] Screenshot: Notification preferences section
- [ ] Screenshot: Timezone/format selectors
- [ ] Screenshot: Success notification on save
- [ ] Test Results: Preferences tests (>80% coverage)

## Success Criteria

Account settings page is complete when:

- All preferences display and save correctly
- Timezone auto-detection working
- Date/time format changes apply immediately
- Language switching functional
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
