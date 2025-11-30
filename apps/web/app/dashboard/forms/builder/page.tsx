'use client';

import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { FormBuilder } from '@/components/Forms/FormBuilder';
import type { FormTemplate } from '@brave-forms/types';

/**
 * New Form Builder Page
 *
 * Creates a new form template using the drag-and-drop form builder.
 * Route: /dashboard/forms/builder
 */
export default function NewFormBuilderPage() {
  const router = useRouter();

  const handleSave = async (template: Partial<FormTemplate>) => {
    // TODO: Implement GraphQL mutation to save form template
    // mutation CreateFormTemplate($input: CreateFormTemplateInput!) {
    //   createFormTemplate(input: $input) { id name }
    // }
    console.log('Saving new form template:', template);

    // Simulate API call for now
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate back to forms list after save
    router.push('/dashboard/forms');
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
      <FormBuilder onSave={handleSave} onCancel={handleCancel} />
    </PageContainer>
  );
}
