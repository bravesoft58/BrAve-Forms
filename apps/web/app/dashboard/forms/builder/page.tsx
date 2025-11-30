'use client';

import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { FormBuilder } from '@/components/Forms/FormBuilder';
import { useCreateFormTemplate } from '@/hooks/useFormTemplates';
import type { FormTemplate } from '@brave-forms/types';

/**
 * New Form Builder Page
 *
 * Creates a new form template using the drag-and-drop form builder.
 * Route: /dashboard/forms/builder
 *
 * ISSUE-168: Wired to backend GraphQL createFormTemplate mutation
 */
export default function NewFormBuilderPage() {
  const router = useRouter();
  const { mutateAsync: createTemplate, isPending } = useCreateFormTemplate();

  const handleSave = async (template: Partial<FormTemplate>) => {
    try {
      // Convert frontend format to backend format
      // Frontend uses fields[], backend expects schema JSONB
      const input = {
        name: template.name || 'Untitled Form',
        description: template.description || undefined,
        category: template.category || 'CUSTOM',
        schema: {
          fields: template.fields || [],
          logic: template.logic || [],
          calculations: template.calculations || [],
          version: '1.0',
        },
      };

      await createTemplate(input);

      notifications.show({
        title: 'Form Template Created',
        message: `"${input.name}" has been saved successfully.`,
        color: 'green',
      });

      // Navigate back to forms list after save
      router.push('/dashboard/forms');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save form template';
      notifications.show({
        title: 'Error Saving Template',
        message,
        color: 'red',
      });
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/forms');
  };

  return (
    <PageContainer
      title="Create Form Template"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Forms', href: '/dashboard/forms' },
            { label: 'Create Template' },
          ]}
        />
      }
    >
      <FormBuilder onSave={handleSave} onCancel={handleCancel} loading={isPending} />
    </PageContainer>
  );
}
