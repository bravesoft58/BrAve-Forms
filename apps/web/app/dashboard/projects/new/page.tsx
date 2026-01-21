'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import {
  Text,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Paper,
  NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconChevronLeft, IconDeviceFloppy, IconMapPin } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateProject } from '@/hooks/useProjects';
import { useAppAuth } from '@/app/providers';
import { geocodeAddress as geocodeAddressAPI } from '@/lib/api/projects';

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
  const { getToken } = useAppAuth();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    disturbedAcres: 0,
    description: '',
    status: 'PENDING',
    startDate: '',
  });

  const handleLookupCoordinates = async () => {
    if (!formData.address.trim()) {
      notifications.show({
        title: 'Address Required',
        message: 'Please enter an address before looking up coordinates',
        color: 'yellow',
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const token = getToken ? await getToken() : null;
      const result = await geocodeAddressAPI(formData.address, token);
      if (result) {
        setFormData((prev) => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude,
        }));
        notifications.show({
          title: 'Coordinates Found',
          message: `Latitude: ${result.latitude.toFixed(6)}, Longitude: ${result.longitude.toFixed(6)}`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Address Not Found',
          message:
            'Could not find coordinates for this address. Please enter manually or try a more specific address.',
          color: 'yellow',
        });
      }
    } catch (error) {
      console.error('[Geocode] Error:', error);
      notifications.show({
        title: 'Geocoding Error',
        message: error instanceof Error ? error.message : 'Failed to lookup coordinates',
        color: 'red',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleChange = (field: string) => (value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || '' }));
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert date string to full ISO DateTime (GraphQL DateTime scalar requires full ISO format)
    const startDateISO = formData.startDate
      ? new Date(formData.startDate).toISOString()
      : new Date().toISOString();

    const submitData = {
      name: formData.name,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      disturbedAcres: formData.disturbedAcres,
      startDate: startDateISO,
    };

    console.log('[NewProject] Submitting form with data:', submitData);
    console.log('[NewProject] GraphQL endpoint:', process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT);

    try {
      console.log('[NewProject] Calling createProjectMutation.mutateAsync...');
      const result = await createProjectMutation.mutateAsync(submitData);
      console.log('[NewProject] Mutation succeeded:', result);
      notifications.show({
        title: 'Project Created',
        message: `${formData.name} has been created successfully`,
        color: 'green',
      });
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('[NewProject] Failed to create project:', error);
      console.error('[NewProject] Error type:', error?.constructor?.name);
      console.error('[NewProject] Error stack:', error instanceof Error ? error.stack : 'N/A');
      notifications.show({
        title: 'Failed to Create Project',
        message:
          error instanceof Error ? error.message : 'An error occurred while creating the project',
        color: 'red',
      });
    }
  };

  const isFormValid =
    formData.name.trim() !== '' && formData.address.trim() !== '' && formData.disturbedAcres > 0;

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

            <Group align="flex-end" gap="sm">
              <TextInput
                label="Project Address"
                placeholder="Enter project address"
                required
                value={formData.address}
                onChange={handleInputChange('address')}
                size="sm"
                style={{ flex: 1 }}
              />
              <Button
                variant="light"
                leftSection={<IconMapPin size={16} />}
                onClick={handleLookupCoordinates}
                loading={isGeocoding}
                size="sm"
              >
                Lookup
              </Button>
            </Group>

            <Group grow>
              <NumberInput
                label="Latitude"
                placeholder="Auto-filled from address"
                description={
                  formData.latitude !== 0 ? 'Auto-filled' : 'Enter address and click Lookup'
                }
                decimalScale={6}
                value={formData.latitude}
                onChange={(val) => setFormData((prev) => ({ ...prev, latitude: Number(val) || 0 }))}
                size="sm"
              />
              <NumberInput
                label="Longitude"
                placeholder="Auto-filled from address"
                description={
                  formData.longitude !== 0 ? 'Auto-filled' : 'Enter address and click Lookup'
                }
                decimalScale={6}
                value={formData.longitude}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, longitude: Number(val) || 0 }))
                }
                size="sm"
              />
            </Group>

            <NumberInput
              label="Disturbed Acres"
              description="Total acres of land disturbance for EPA compliance"
              placeholder="e.g., 5.5"
              required
              min={0}
              step={0.1}
              decimalScale={2}
              value={formData.disturbedAcres}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, disturbedAcres: Number(val) || 0 }))
              }
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
