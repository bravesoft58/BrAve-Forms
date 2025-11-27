'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Container, Title, Text, Stack, Button, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { FormRenderer } from '@/components/Forms/FormRenderer';
import { FormSubmissionData, FormTemplate as FormRendererTemplate, FormField } from '@/components/Forms/FormRenderer/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSubmitForm } from '@/hooks/useSubmitForm';
import { useFormTemplate } from '@/hooks/useFormTemplates';

/**
 * Transform API template schema to FormRenderer format
 *
 * The API returns templates with sections containing fields.
 * FormRenderer expects a flat fields array.
 *
 * @param apiTemplate - Template from GraphQL API
 * @returns Template formatted for FormRenderer
 */
function transformTemplateForRenderer(apiTemplate: {
  id: string;
  name: string;
  description?: string;
  version: number;
  schema: {
    sections?: Array<{
      id: string;
      title: string;
      fields: Array<{
        id: string;
        type: string;
        label: string;
        required?: boolean;
        placeholder?: string;
        options?: Array<{ label: string; value: string }>;
        validation?: Record<string, unknown>;
        conditionalLogic?: Record<string, unknown>;
      }>;
    }>;
  };
}): FormRendererTemplate {
  // Flatten all fields from all sections
  const fields: FormField[] = [];

  if (apiTemplate.schema?.sections) {
    for (const section of apiTemplate.schema.sections) {
      for (const field of section.fields) {
        fields.push({
          id: field.id,
          type: field.type as FormField['type'],
          label: field.label,
          required: field.required,
          placeholder: field.placeholder,
          options: field.options?.map((opt) => ({
            value: opt.value,
            label: opt.label,
          })),
          validation: field.validation ? {
            min: field.validation.min as number | undefined,
            max: field.validation.max as number | undefined,
            minLength: field.validation.minLength as number | undefined,
            maxLength: field.validation.maxLength as number | undefined,
            pattern: field.validation.pattern as string | undefined,
            customMessage: field.validation.customMessage as string | undefined,
          } : undefined,
          conditional: field.conditionalLogic ? {
            showIf: field.conditionalLogic.showIf as {
              field: string;
              operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
              value: unknown;
            } | undefined,
          } : undefined,
        });
      }
    }
  }

  return {
    id: apiTemplate.id,
    title: apiTemplate.name,
    description: apiTemplate.description,
    version: apiTemplate.version,
    fields,
  };
}

export default function FormFillPage() {
  const params = useParams();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const submitMutation = useSubmitForm();

  // Validate templateId parameter
  const templateId = typeof params.templateId === 'string' ? params.templateId : undefined;

  // Fetch template from API
  const { data: apiTemplate, isLoading, error } = useFormTemplate(templateId);

  // Transform API template to FormRenderer format
  const template = useMemo(() => {
    if (!apiTemplate) return null;
    return transformTemplateForRenderer(apiTemplate);
  }, [apiTemplate]);

  const handleSubmit = async (data: FormSubmissionData) => {
    if (!templateId) return;
    await submitMutation.mutateAsync({
      templateId,
      data: data.values,
      status: 'submitted',
    });
  };

  // Save draft handler - will be integrated with FormRenderer in future issue
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveDraft = async (data: FormSubmissionData) => {
    if (!templateId) return;
    await submitMutation.mutateAsync({
      templateId,
      data: data.values,
      status: 'draft',
    });
  };

  const handlePrintPreview = () => {
    window.print();
  };

  // Loading state
  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Stack gap="md" align="center">
          <Loader size="lg" />
          <Text size="14px" c="dimmed">
            Loading form template...
          </Text>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Failed to load form"
          color="red"
        >
          {error instanceof Error ? error.message : 'An error occurred while loading the form.'}
        </Alert>
      </Container>
    );
  }

  // Not found state
  if (!template) {
    return (
      <Container size="md" py="xl">
        <Stack gap="md">
          <Title order={1} size="h2">
            Form Not Found
          </Title>
          <Text size="14px" c="dimmed">
            The form template you&apos;re looking for doesn&apos;t exist.
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <main className={isMobile ? 'mobile-view' : 'desktop-view min-h-screen bg-gray-50'} role="main">
      {!isMobile && (
        <div className="desktop-toolbar">
          <div className="toolbar-shortcuts">
            <span className="shortcut-hint">Ctrl+S to save draft</span>
            <span className="shortcut-hint">Ctrl+Enter to submit</span>
            <span className="shortcut-hint">Ctrl+P to print</span>
          </div>
          <Button onClick={handlePrintPreview} className="print-button">
            Print Preview
          </Button>
        </div>
      )}

      <Container size={isMobile ? 'md' : 'xl'} py="md">
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2" mb="xs">
              {template.title}
            </Title>
            {template.description && (
              <Text size="14px" c="dimmed">
                {template.description}
              </Text>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <FormRenderer template={template} onSubmit={handleSubmit} initialValues={{}} hideHeader />
          </div>
        </Stack>
      </Container>
    </main>
  );
}
