'use client';

import { Stack, Tabs } from '@mantine/core';
import { TemplateSelector } from '@/components/Forms/TemplateSelector';
import { SubmittedFormsList } from '@/components/Forms/SubmittedFormsList';

/**
 * Project Forms Tab Component
 *
 * Shows template selector and submitted forms list.
 * - Template Selector (ISSUE-088): Grid of available form templates with filters
 * - Submitted Forms List (ISSUE-089): List of forms submitted for this project
 */
export function ProjectFormsTab({ projectId }: { projectId: string }) {
  return (
    <Stack gap="md" data-testid="forms-tab-content">
      <Tabs defaultValue="templates">
        <Tabs.List>
          <Tabs.Tab value="templates">Templates</Tabs.Tab>
          <Tabs.Tab value="submitted">Submitted Forms</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="templates" pt="md">
          <TemplateSelector projectId={projectId} />
        </Tabs.Panel>

        <Tabs.Panel value="submitted" pt="md">
          <SubmittedFormsList projectId={projectId} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

