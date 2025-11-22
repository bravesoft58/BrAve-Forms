'use client';

import { useParams } from 'next/navigation';
import { Container, Title, Text, Stack, Button } from '@mantine/core';
import { FormRenderer } from '@/components/Forms/FormRenderer';
import { FormSubmissionData } from '@/components/Forms/FormRenderer/types';
import { getMockFormTemplates } from '@/lib/mock-data/form-templates';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSubmitForm } from '@/hooks/useSubmitForm';

export default function FormFillPage() {
  const params = useParams();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const submitMutation = useSubmitForm();

  // Validate templateId parameter
  const templateId = params.templateId;

  // For now, use mock data (will integrate GraphQL in later issue)
  const templates = getMockFormTemplates();
  const mockTemplate =
    typeof templateId === 'string' ? templates.find((t) => t.id === templateId) : null;

  // Convert mock template to FormRenderer template structure
  const template = mockTemplate
    ? {
        id: mockTemplate.id,
        title: mockTemplate.title,
        description: mockTemplate.description,
        version: 1,
        fields: [
          // Placeholder fields - will be populated from actual form schemas in ISSUE-103
          {
            id: 'sample-field',
            type: 'text' as const,
            label: 'Sample Field',
            required: false,
          },
        ],
      }
    : null;

  const handleSubmit = async (data: FormSubmissionData) => {
    if (typeof templateId !== 'string') return;
    await submitMutation.mutateAsync({
      templateId,
      data: data.values,
      status: 'submitted',
    });
  };

  // Save draft handler - will be integrated with FormRenderer in future issue
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveDraft = async (data: FormSubmissionData) => {
    if (typeof templateId !== 'string') return;
    await submitMutation.mutateAsync({
      templateId,
      data: data.values,
      status: 'draft',
    });
  };

  const handlePrintPreview = () => {
    window.print();
  };

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
            <FormRenderer template={template} onSubmit={handleSubmit} initialValues={{}} />
          </div>
        </Stack>
      </Container>
    </main>
  );
}
