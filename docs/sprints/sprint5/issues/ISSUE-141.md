# ISSUE-141: User Profile Page (3h)

**Priority:** P0
**Phase:** Phase 3 - Settings & Profile
**Estimated Hours:** 3
**Dependencies:** Phase 2 complete
**Sprint:** Sprint 5

---

## Objective

Create a user profile page where field workers can view and edit their personal information, change password, and manage their account.

## Tasks

- [ ] Create /settings/profile route in Next.js App Router
- [ ] Fetch user info from Clerk
- [ ] Display user info (name, email, avatar)
- [ ] Create edit profile form with React Hook Form + Zod
- [ ] Implement avatar upload functionality
- [ ] Create change password form
- [ ] Add delete account button with confirmation modal
- [ ] Calculate and display profile completion percentage
- [ ] Add unit tests for profile update logic

## Technical Details

**Libraries/Dependencies:**

- Clerk (user authentication)
- React Hook Form + Zod (form validation)
- Mantine Form components
- Image upload component (avatar)

**Code Example:**

```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, Avatar, Button, Stack, Progress, Text, FileInput } from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  avatar: z.instanceof(File).optional(),
});

export default function ProfilePage() {
  const { user } = useUser();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    await user?.update({
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (data.avatar) {
      await user?.setProfileImage({ file: data.avatar });
    }
  };

  const profileCompletion = calculateCompletion(user);

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="xl" fw={600}>Profile</Text>
        <Group gap="xs">
          <Progress value={profileCompletion} w={200} />
          <Text size="sm" c="dimmed">{profileCompletion}% complete</Text>
        </Group>
      </Group>

      <Group>
        <Avatar src={user?.imageUrl} size={120} radius="xl" />
        <FileInput
          placeholder="Upload avatar"
          leftSection={<IconUpload size={16} />}
          {...form.register('avatar')}
        />
      </Group>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="First Name"
            {...form.register('firstName')}
            error={form.formState.errors.firstName?.message}
          />
          <TextInput
            label="Last Name"
            {...form.register('lastName')}
            error={form.formState.errors.lastName?.message}
          />
          <TextInput
            label="Email"
            value={user?.emailAddresses[0]?.emailAddress}
            disabled
          />
          <Button type="submit" loading={form.formState.isSubmitting}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
```

## Acceptance Criteria

- [ ] /settings/profile route displays user information
- [ ] Edit profile form functional with validation
- [ ] Avatar upload working
- [ ] Change password redirects to Clerk password change
- [ ] Delete account button with confirmation modal
- [ ] Profile completion percentage accurate
- [ ] Form validation errors display correctly
- [ ] Success notification on profile update

## Testing Requirements

**Unit Tests:**

- Test profile completion calculation
- Test form validation
- Test avatar upload

**Integration Tests:**

- Test profile update with Clerk
- Test password change flow
- Test delete account flow

**Manual Testing:**

- Update profile information
- Upload new avatar
- Change password
- Test delete account flow
- Verify profile completion updates

## Evidence Requirements

- [ ] Screenshot: Profile page with user info
- [ ] Screenshot: Edit profile form
- [ ] Screenshot: Avatar upload
- [ ] Screenshot: Delete account confirmation
- [ ] Test Results: Profile update tests (>80% coverage)

## Success Criteria

User profile page is complete when:

- All user information displayed
- Edit functionality working
- Avatar upload functional
- Delete account with confirmation
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
