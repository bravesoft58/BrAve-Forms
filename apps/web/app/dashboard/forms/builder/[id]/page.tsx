'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { FormBuilder } from '@/components/Forms/FormBuilder';
import { Center, Loader, Alert, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useFormTemplate, useUpdateFormTemplate } from '@/hooks/useFormTemplates';
import type { FormTemplate } from '@brave-forms/types';

/**
 * Edit Form Builder Page
 *
 * Loads and edits an existing form template.
 * Route: /dashboard/forms/builder/[id]
 *
 * ISSUE-169: Wired to backend GraphQL formTemplate query and updateFormTemplate mutation
 */
export default function EditFormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Fetch template from backend
  const {
    data: template,
    isLoading,
    isError,
    error,
    refetch,
  } = useFormTemplate(id);

  // Update mutation
  const { mutateAsync: updateTemplate, isPending: isSaving } = useUpdateFormTemplate();

  // Convert backend schema format to frontend format for FormBuilder
  const formBuilderTemplate = useMemo((): Partial<FormTemplate> | null => {
    if (!template) return null;

    // Backend stores: { schema: { fields: [], logic: [], ... } }
    // Frontend expects: { fields: [], logic: [], ... }
    const schema = template.schema as { fields?: unknown[]; logic?: unknown[]; calculations?: unknown[]; version?: string } | undefined;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      fields: schema?.fields as FormTemplate['fields'],
      logic: schema?.logic as FormTemplate['logic'],
      calculations: schema?.calculations as FormTemplate['calculations'],
      version: template.version,
      isActive: template.isActive,
      // Convert string dates from API to Date objects
      createdAt: template.createdAt ? new Date(template.createdAt) : undefined,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : undefined,
    };
  }, [template]);

  const handleSave = async (updatedTemplate: Partial<FormTemplate>) => {
    if (!id) return;

    try {
      // Convert frontend format back to backend format
      const input = {
        name: updatedTemplate.name,
        description: updatedTemplate.description || undefined,
        schema: {
          fields: updatedTemplate.fields || [],
          logic: updatedTemplate.logic || [],
          calculations: updatedTemplate.calculations || [],
          version: '1.0',
        },
        isActive: updatedTemplate.isActive,
      };

      await updateTemplate({ id, input });

      notifications.show({
        title: 'Template Updated',
        message: `"${input.name}" has been saved successfully.`,
        color: 'green',
      });

      // Navigate back to forms list after save
      router.push('/dashboard/forms');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update form template';
      notifications.show({
        title: 'Error Updating Template',
        message,
        color: 'red',
      });
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/forms');
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading form template...</Text>
          </Stack>
        </Center>
      </PageContainer>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load form template';
    return (
      <PageContainer
        title="Error"
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Forms', href: '/dashboard/forms' },
              { label: 'Error' },
            ]}
          />
        }
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} title="Failed to Load Template" color="red">
            {errorMessage}
          </Alert>
          <Group>
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push('/dashboard/forms')}
            >
              Back to Forms
            </Button>
            <Button onClick={() => refetch()}>Try Again</Button>
          </Group>
        </Stack>
      </PageContainer>
    );
  }

  // Template not found state
  if (!template || !formBuilderTemplate) {
    return (
      <PageContainer
        title="Template Not Found"
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Forms', href: '/dashboard/forms' },
              { label: 'Not Found' },
            ]}
          />
        }
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} title="Template Not Found" color="yellow">
            The form template with ID &quot;{id}&quot; was not found. It may have been deleted or you
            may not have permission to view it.
          </Alert>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/dashboard/forms')}
          >
            Back to Forms
          </Button>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit: ${template.name}`}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Forms', href: '/dashboard/forms' },
            { label: template.name || 'Edit Template' },
          ]}
        />
      }
    >
      <FormBuilder
        template={formBuilderTemplate as FormTemplate | undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={isSaving}
      />
    </PageContainer>
  );
}
