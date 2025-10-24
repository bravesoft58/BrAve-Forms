# ISSUE-155: Form Publishing & Deployment (3h)

**Priority:** P0
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 3
**Dependencies:** ISSUE-152, ISSUE-154
**Sprint:** Sprint 5

---

## Objective

Create a form publishing and deployment system allowing form builders to publish forms to production, manage deployment status, and configure form settings before deployment.

## Tasks

- [ ] Create FormPublishing component
- [ ] Implement form validation before publish
- [ ] Create deployment settings (active dates, visibility, permissions)
- [ ] Implement publish to production workflow
- [ ] Create unpublish/archive functionality
- [ ] Add deployment history tracking
- [ ] Create form activation/deactivation toggle
- [ ] Add unit tests for publishing logic

## Technical Details

**Libraries/Dependencies:**

- GraphQL mutations (publish form)
- Valtio (form builder state)
- Mantine components (Modal, DatePicker, Switch, Button)
- Zod (deployment settings validation)

**Code Example:**

```typescript
'use client';

import { useState } from 'react';
import { Stack, Card, Text, Button, Group, Modal, Switch, DatePicker, Select, Badge } from '@mantine/core';
import { IconRocket, IconArchive, IconEye, IconEyeOff, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore } from './store';
import { useMutation } from '@tanstack/react-query';

export interface DeploymentSettings {
  startDate?: Date;
  endDate?: Date;
  visibility: 'public' | 'internal' | 'private';
  allowedRoles: string[];
  requireGPS: boolean;
  requirePhotos: boolean;
  maxSubmissionsPerDay?: number;
}

// Form Publishing Component
export function FormPublishing({ formId }: { formId: string }) {
  const snap = useSnapshot(formBuilderStore);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [deploymentSettings, setDeploymentSettings] = useState<DeploymentSettings>({
    visibility: 'internal',
    allowedRoles: ['FIELD'],
    requireGPS: true,
    requirePhotos: false,
  });

  const publishMutation = useMutation({
    mutationFn: async (settings: DeploymentSettings) => {
      return fetch('/api/forms/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          fields: snap.fields,
          settings,
        }),
      });
    },
    onSuccess: () => {
      alert('Form published successfully!');
      setPublishModalOpen(false);
    },
    onError: (error) => {
      alert(`Publish failed: ${error.message}`);
    },
  });

  const validationErrors = validateFormBeforePublish(snap.fields);

  const canPublish = validationErrors.length === 0;

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>Publishing</Text>
            <Text size="xs" c="dimmed">Deploy form to production</Text>
          </div>

          <Group gap="xs">
            <Badge color={snap.publishStatus === 'published' ? 'green' : 'gray'}>
              {snap.publishStatus || 'Draft'}
            </Badge>
          </Group>
        </Group>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card withBorder padding="md" bg="red.0">
            <Stack gap="xs">
              <Group gap="xs">
                <IconAlertTriangle size={16} color="red" />
                <Text size="sm" fw={600} c="red">
                  {validationErrors.length} issues must be fixed before publishing
                </Text>
              </Group>

              {validationErrors.map((error, index) => (
                <Text key={index} size="xs" c="red">
                  • {error}
                </Text>
              ))}
            </Stack>
          </Card>
        )}

        {/* Publish Button */}
        <Group>
          <Button
            leftSection={<IconRocket size={16} />}
            onClick={() => setPublishModalOpen(true)}
            disabled={!canPublish}
          >
            {snap.publishStatus === 'published' ? 'Re-publish' : 'Publish to Production'}
          </Button>

          {snap.publishStatus === 'published' && (
            <Button
              variant="outline"
              leftSection={<IconArchive size={16} />}
              onClick={() => unpublishForm()}
            >
              Unpublish
            </Button>
          )}
        </Group>

        {/* Publishing Settings Modal */}
        <Modal
          opened={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          title="Publish Form to Production"
          size="lg"
        >
          <Stack gap="md">
            <Card withBorder padding="md" bg="blue.0">
              <Group gap="xs">
                <IconCheck size={16} color="blue" />
                <Text size="sm">
                  Form is ready to publish. Configure deployment settings below.
                </Text>
              </Group>
            </Card>

            <Select
              label="Visibility"
              description="Who can access this form"
              data={[
                { value: 'public', label: 'Public (QR inspector portal)' },
                { value: 'internal', label: 'Internal (company users only)' },
                { value: 'private', label: 'Private (specific users only)' },
              ]}
              value={deploymentSettings.visibility}
              onChange={(value) =>
                setDeploymentSettings({ ...deploymentSettings, visibility: value as any })
              }
            />

            <MultiSelect
              label="Allowed Roles"
              description="Which user roles can submit this form"
              data={[
                { value: 'FIELD', label: 'Field User ($39)' },
                { value: 'OFFICE', label: 'Office User ($19)' },
                { value: 'INSPECTOR', label: 'Inspector (FREE)' },
              ]}
              value={deploymentSettings.allowedRoles}
              onChange={(values) =>
                setDeploymentSettings({ ...deploymentSettings, allowedRoles: values })
              }
            />

            <Group grow>
              <DatePicker
                label="Start Date (Optional)"
                description="Form available from this date"
                value={deploymentSettings.startDate}
                onChange={(date) =>
                  setDeploymentSettings({ ...deploymentSettings, startDate: date || undefined })
                }
              />

              <DatePicker
                label="End Date (Optional)"
                description="Form expires after this date"
                value={deploymentSettings.endDate}
                onChange={(date) =>
                  setDeploymentSettings({ ...deploymentSettings, endDate: date || undefined })
                }
              />
            </Group>

            <Stack gap="xs">
              <Switch
                label="Require GPS location"
                description="Enforce GPS capture for compliance"
                checked={deploymentSettings.requireGPS}
                onChange={(e) =>
                  setDeploymentSettings({
                    ...deploymentSettings,
                    requireGPS: e.currentTarget.checked,
                  })
                }
              />

              <Switch
                label="Require photos"
                description="At least one photo required"
                checked={deploymentSettings.requirePhotos}
                onChange={(e) =>
                  setDeploymentSettings({
                    ...deploymentSettings,
                    requirePhotos: e.currentTarget.checked,
                  })
                }
              />
            </Stack>

            <NumberInput
              label="Max Submissions Per Day (Optional)"
              description="Limit submissions per project per day"
              placeholder="Unlimited"
              value={deploymentSettings.maxSubmissionsPerDay}
              onChange={(value) =>
                setDeploymentSettings({
                  ...deploymentSettings,
                  maxSubmissionsPerDay: typeof value === 'number' ? value : undefined,
                })
              }
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setPublishModalOpen(false)}>
                Cancel
              </Button>
              <Button
                leftSection={<IconRocket size={16} />}
                onClick={() => publishMutation.mutate(deploymentSettings)}
                loading={publishMutation.isPending}
              >
                Publish Now
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Card>
  );
}

// Validate form before publish
function validateFormBeforePublish(fields: FormField[]): string[] {
  const errors: string[] = [];

  if (fields.length === 0) {
    errors.push('Form must have at least one field');
  }

  // Check for required compliance fields
  const hasInspector = fields.some(f => f.type === 'inspector');
  const hasDate = fields.some(f => f.type === 'datetime');
  const hasSignature = fields.some(f => f.type === 'signature');

  if (!hasInspector) {
    errors.push('Form must have an inspector name field (EPA compliance)');
  }

  if (!hasDate) {
    errors.push('Form must have a date/time field (EPA compliance)');
  }

  if (!hasSignature) {
    errors.push('Form must have a signature field (EPA compliance)');
  }

  // Check for unlabeled fields
  fields.forEach((field, index) => {
    if (!field.label || field.label.trim() === '') {
      errors.push(`Field ${index + 1} is missing a label`);
    }
  });

  // Check for dropdown/radio fields without options
  fields.forEach(field => {
    if (['dropdown', 'radio', 'multiselect'].includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        errors.push(`Field "${field.label}" must have at least one option`);
      }
    }
  });

  // Check for circular dependencies in conditional logic
  const circularErrors = detectCircularDependencies(fields);
  errors.push(...circularErrors);

  return errors;
}

// Unpublish form
async function unpublishForm() {
  if (confirm('Unpublish this form? It will no longer be available to field workers.')) {
    await fetch('/api/forms/unpublish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: 'current-form-id' }),
    });

    alert('Form unpublished');
  }
}
```

## Acceptance Criteria

- [ ] Publish button validates form before publishing
- [ ] Deployment settings modal displays all options
- [ ] Visibility settings (public/internal/private) functional
- [ ] Allowed roles configuration working
- [ ] Start/end date settings functional
- [ ] GPS and photo requirements configurable
- [ ] Publish to production API call working
- [ ] Unpublish form functional
- [ ] Validation errors block publishing

## Testing Requirements

**Unit Tests:**

- Test form validation before publish
- Test deployment settings validation
- Test publish mutation

**Integration Tests:**

- Test publish API call
- Test unpublish API call
- Test deployment settings persistence

**Manual Testing:**

- Attempt to publish invalid form (should block)
- Configure deployment settings
- Publish valid form to production
- Unpublish form
- Verify form appears in production

## Evidence Requirements

- [ ] Screenshot: Publishing page with validation errors
- [ ] Screenshot: Deployment settings modal
- [ ] Screenshot: Successfully published form
- [ ] Test Results: Publishing tests (>80% coverage)

## Success Criteria

Form publishing is complete when:

- Validation blocks invalid forms
- Deployment settings configurable
- Publish to production working
- Unpublish functional
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
