'use client';

import Link from 'next/link';
import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { TemplateSelector } from '@/components/Forms/TemplateSelector';

/**
 * Forms Page - Template Selection
 *
 * Displays available form templates organized by category.
 * Users can search, filter, and select templates to fill out.
 * Includes link to Form Builder for creating new templates.
 */
export default function FormsPage() {
  return (
    <PageContainer
      title="Forms"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms' }]} />
      }
      actions={
        <Button
          component={Link}
          href="/dashboard/forms/builder"
          leftSection={<IconPlus size={16} />}
          size="sm"
        >
          Create Template
        </Button>
      }
    >
      <TemplateSelector projectId="default" />
    </PageContainer>
  );
}
