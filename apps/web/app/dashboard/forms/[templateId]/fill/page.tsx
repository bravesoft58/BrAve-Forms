'use client';

import { useParams, useRouter } from 'next/navigation';
import { Container, Title, Text, Stack } from '@mantine/core';
import { FormRenderer } from '@/components/Forms/FormRenderer';
import { FormSubmissionData } from '@/components/Forms/FormRenderer/types';
import { getMockFormTemplates } from '@/lib/mock-data/form-templates';
import { notifications } from '@mantine/notifications';

export default function FormFillPage() {
  const params = useParams();
  const router = useRouter();

  // Validate templateId parameter
  const templateId = params.templateId;
  if (typeof templateId !== 'string' || !templateId) {
    return (
      <Container size="md" py="xl">
        <Stack gap="md">
          <Title order={1} size="h2">Invalid Request</Title>
          <Text size="14px" c="dimmed">
            Template ID is missing or invalid.
          </Text>
        </Stack>
      </Container>
    );
  }

  // For now, use mock data (will integrate GraphQL in later issue)
  const templates = getMockFormTemplates();
  const mockTemplate = templates.find((t) => t.id === templateId);

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
    try {
      // TODO: Replace with actual API call in ISSUE-103
      // eslint-disable-next-line no-console
      console.log('Form submitted:', data);

      notifications.show({
        title: 'Success',
        message: 'Form submitted successfully!',
        color: 'green',
      });

      // Navigate to submissions list
      router.push('/dashboard/forms');
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error occurred';

      // eslint-disable-next-line no-console
      console.error('Form submission failed:', {
        templateId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      notifications.show({
        title: 'Submission Failed',
        message: 'Unable to submit form. Please check your connection and try again.',
        color: 'red',
      });
    }
  };

  if (!template) {
    return (
      <Container size="md" py="xl">
        <Stack gap="md">
          <Title order={1} size="h2">Form Not Found</Title>
          <Text size="14px" c="dimmed">
            The form template you&apos;re looking for doesn&apos;t exist.
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <div className="mobile-optimized min-h-screen bg-gray-50">
      <Container size="md" py="md">
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
              initialValues={{}}
            />
          </div>
        </Stack>
      </Container>
    </div>
  );
}
