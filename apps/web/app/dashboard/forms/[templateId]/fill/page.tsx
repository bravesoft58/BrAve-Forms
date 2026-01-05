'use client';

import { useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Container, Title, Text, Stack, Button, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { FormRenderer } from '@/components/Forms/FormRenderer';
import {
  FormSubmissionData,
  FormTemplate as FormRendererTemplate,
  FormField,
} from '@/components/Forms/FormRenderer/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSubmitForm } from '@/hooks/useSubmitForm';
import { useFormTemplate } from '@/hooks/useFormTemplates';
import { useAppAuth } from '@/app/providers';

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
          validation: field.validation
            ? {
                min: field.validation.min as number | undefined,
                max: field.validation.max as number | undefined,
                minLength: field.validation.minLength as number | undefined,
                maxLength: field.validation.maxLength as number | undefined,
                pattern: field.validation.pattern as string | undefined,
                customMessage: field.validation.customMessage as string | undefined,
              }
            : undefined,
          conditional: field.conditionalLogic
            ? {
                showIf: field.conditionalLogic.showIf as
                  | {
                      field: string;
                      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
                      value: unknown;
                    }
                  | undefined,
              }
            : undefined,
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

/**
 * ISSUE-185 & ISSUE-186: Auto-fill helper functions
 * Generates initial values from user and project context
 */
interface AutoFillContext {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
  } | null;
  project?: {
    name?: string;
    address?: string;
    permitNumber?: string;
    disturbedAcres?: number;
  } | null;
}

function generateAutoFillValues(
  fields: FormField[],
  context: AutoFillContext
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const today = new Date().toISOString().split('T')[0];

  for (const field of fields) {
    const labelLower = field.label.toLowerCase();
    const idLower = field.id.toLowerCase();

    // ISSUE-185: Inspector Name Auto-Fill
    if (
      labelLower.includes('inspector') &&
      (labelLower.includes('name') || idLower.includes('name'))
    ) {
      if (context.user?.fullName) {
        values[field.id] = context.user.fullName;
      } else if (context.user?.firstName && context.user?.lastName) {
        values[field.id] = `${context.user.firstName} ${context.user.lastName}`;
      }
    }

    // Auto-fill inspector email
    if (
      labelLower.includes('inspector') &&
      (labelLower.includes('email') || idLower.includes('email'))
    ) {
      if (context.user?.primaryEmailAddress?.emailAddress) {
        values[field.id] = context.user.primaryEmailAddress.emailAddress;
      }
    }

    // Auto-fill date fields with today's date
    if (
      field.type === 'date' &&
      (labelLower.includes('inspection') || labelLower.includes('today'))
    ) {
      values[field.id] = today;
    }

    // ISSUE-186: Form Fields Pull From Project Data
    if (context.project) {
      // Project name
      if (labelLower.includes('project') && labelLower.includes('name')) {
        values[field.id] = context.project.name;
      }
      // Site address
      if (labelLower.includes('site') && labelLower.includes('address')) {
        values[field.id] = context.project.address;
      }
      if (labelLower.includes('project') && labelLower.includes('address')) {
        values[field.id] = context.project.address;
      }
      // Permit number
      if (labelLower.includes('permit') && labelLower.includes('number')) {
        values[field.id] = context.project.permitNumber;
      }
      // Disturbed acres
      if (labelLower.includes('disturbed') && labelLower.includes('acres')) {
        values[field.id] = context.project.disturbedAcres;
      }
    }
  }

  return values;
}

export default function FormFillPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const submitMutation = useSubmitForm();
  const auth = useAppAuth();

  // ISSUE-185: Get current user for auto-fill
  const { user } = useUser();

  // Validate templateId and projectId parameters
  const templateId = typeof params.templateId === 'string' ? params.templateId : undefined;
  const projectId = searchParams.get('projectId');

  // ISSUE-186: Fetch project data if projectId is provided
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId || !auth.getToken) return null;
      const token = await auth.getToken();
      const response = await fetch(`/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query GetProject($id: ID!) {
            project(id: $id) {
              id
              name
              address
              permitNumber
              disturbedAcres
            }
          }`,
          variables: { id: projectId },
        }),
      });
      const result = await response.json();
      return result.data?.project || null;
    },
    enabled: !!projectId && auth.isLoaded,
  });

  // Fetch template from API
  const { data: apiTemplate, isLoading, error } = useFormTemplate(templateId);

  // Transform API template to FormRenderer format
  const template = useMemo(() => {
    if (!apiTemplate) return null;
    return transformTemplateForRenderer(apiTemplate);
  }, [apiTemplate]);

  // ISSUE-185 & ISSUE-186: Generate auto-fill values
  const initialValues = useMemo(() => {
    if (!template) return {};
    return generateAutoFillValues(template.fields, { user, project });
  }, [template, user, project]);

  const handleSubmit = async (data: FormSubmissionData) => {
    if (!templateId) return;
    await submitMutation.mutateAsync({
      templateId,
      data: data.values,
      status: 'SUBMITTED',
    });
  };

  // Save draft handler - will be integrated with FormRenderer in future issue
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveDraft = async (data: FormSubmissionData) => {
    if (!templateId) return;
    await submitMutation.mutateAsync({
      templateId,
      data: data.values,
      status: 'DRAFT',
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
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to load form" color="red">
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
            <FormRenderer
              template={template}
              onSubmit={handleSubmit}
              initialValues={initialValues}
              hideHeader
            />
          </div>
        </Stack>
      </Container>
    </main>
  );
}
