'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, TextInput, Textarea, Select, Button, Group, Paper } from '@mantine/core';
import { IconChevronLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateProject } from '@/hooks/useProjects';

/**
 * New Project Page - Sprint 6 Enhancement
 *
 * Form for creating a new construction project.
 * Uses Mantine components and real GraphQL API via useCreateProject hook.
 *
 * Features:
 * - Project name, address, and description fields
 * - Status selection (PENDING, ACTIVE)
 * - Start date picker
 * - Cancel and Save buttons
 * - Loading state during submission
 * - Redirect to projects list on success
 */
export default function NewProjectPage() {
  const router = useRouter();
  const createProjectMutation = useCreateProject();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    status: 'PENDING',
    startDate: '',
  });

  const handleChange = (field: string) => (value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || '' }));
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createProjectMutation.mutateAsync({
        name: formData.name,
        address: formData.address,
        description: formData.description || undefined,
        status: formData.status,
        startDate: formData.startDate || undefined,
      });
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const isFormValid = formData.name.trim() && formData.address.trim();

  return (
    <PageContainer
      title="New Project"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects', href: '/dashboard/projects' },
            { label: 'New' },
          ]}
        />
      }
    >
      <Paper p="lg" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Text fw={600} size="16px">
              Project Details
            </Text>
            <Text size="13px" c="dimmed">
              Enter the details for your new construction project
            </Text>

            <TextInput
              label="Project Name"
              placeholder="Enter project name"
              required
              value={formData.name}
              onChange={handleInputChange('name')}
              size="sm"
            />

            <TextInput
              label="Project Address"
              placeholder="Enter project address"
              required
              value={formData.address}
              onChange={handleInputChange('address')}
              size="sm"
            />

            <Group grow>
              <TextInput
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange('startDate')}
                size="sm"
              />
              <Select
                label="Project Status"
                value={formData.status}
                onChange={handleChange('status')}
                data={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'ACTIVE', label: 'Active' },
                ]}
                size="sm"
              />
            </Group>

            <Textarea
              label="Project Description"
              placeholder="Enter project description"
              value={formData.description}
              onChange={handleInputChange('description')}
              minRows={3}
              size="sm"
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                leftSection={<IconChevronLeft size={16} />}
                onClick={() => router.push('/dashboard/projects')}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={createProjectMutation.isPending}
                disabled={!isFormValid}
                size="sm"
              >
                Create Project
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </PageContainer>
  );
}
