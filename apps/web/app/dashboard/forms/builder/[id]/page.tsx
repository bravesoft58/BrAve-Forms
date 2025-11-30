'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { FormBuilder } from '@/components/Forms/FormBuilder';
import { Center, Loader, Alert, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { FormTemplate } from '@brave-forms/types';

/**
 * Edit Form Builder Page
 *
 * Loads and edits an existing form template.
 * Route: /dashboard/forms/builder/[id]
 */
export default function EditFormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing form template
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Implement GraphQL query to load form template
        // query GetFormTemplate($id: ID!) {
        //   formTemplate(id: $id) { id name description category fields ... }
        // }
        console.log('Loading form template:', id);

        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Placeholder - will be replaced with actual GraphQL query
        // For now, return null to show "template not found" state
        setTemplate(null);
      } catch (err) {
        console.error('Failed to load form template:', err);
        setError('Failed to load form template. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTemplate();
    }
  }, [id]);

  const handleSave = async (updatedTemplate: Partial<FormTemplate>) => {
    // TODO: Implement GraphQL mutation to update form template
    // mutation UpdateFormTemplate($id: ID!, $input: UpdateFormTemplateInput!) {
    //   updateFormTemplate(id: $id, input: $input) { id name }
    // }
    console.log('Updating form template:', id, updatedTemplate);

    // Simulate API call for now
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate back to forms list after save
    router.push('/dashboard/forms');
  };

  const handleCancel = () => {
    router.push('/dashboard/forms');
  };

  // Loading state
  if (loading) {
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
  if (error) {
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
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to Load Template" color="red">
          {error}
        </Alert>
      </PageContainer>
    );
  }

  // Template not found state (until GraphQL is implemented)
  if (!template) {
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
        <Alert icon={<IconAlertCircle size={16} />} title="Template Not Found" color="yellow">
          The form template with ID &quot;{id}&quot; was not found. This may be because GraphQL
          integration is not yet implemented.
        </Alert>
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
      <FormBuilder template={template} onSave={handleSave} onCancel={handleCancel} />
    </PageContainer>
  );
}
