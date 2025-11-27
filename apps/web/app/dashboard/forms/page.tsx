'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { TemplateSelector } from '@/components/Forms/TemplateSelector';

/**
 * Forms Page - Template Selection
 *
 * Displays available form templates organized by category.
 * Users can search, filter, and select templates to fill out.
 */
export default function FormsPage() {
  return (
    <PageContainer
      title="Forms"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms' }]} />
      }
    >
      <TemplateSelector projectId="default" />
    </PageContainer>
  );
}
