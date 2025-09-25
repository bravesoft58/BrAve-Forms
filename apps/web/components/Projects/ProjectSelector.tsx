'use client';

import { useState, useEffect } from 'react';
import {
  Group,
  Text,
  Select,
  Card,
  Grid,
  Badge,
  Stack,
  Button,
  ActionIcon,
  Menu,
  TextInput,
  Loader,
  Center,
  Alert,
  Modal,
  NumberInput,
  Textarea,
} from '@mantine/core';
import {
  IconChevronDown,
  IconMapPin,
  IconCalendar,
  IconAlertTriangle,
  IconEye,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconFilter,
  IconBuilding,
  IconUsers,
} from '@tabler/icons-react';
import { useAuth } from '@clerk/nextjs';
import { gql, useQuery, useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

// GraphQL Operations
const GET_USER_PROJECTS = gql`
  query GetUserProjects {
    projects {
      id
      name
      address
      permitNumber
      startDate
      endDate
      disturbedAcres
      status
      compliance {
        overallScore
        pendingInspections
        overdueInspections
        requiresAttention
        lastInspection
        nextDeadline
      }
      recentInspections {
        id
        type
        status
        overdue
        inspectionDate
      }
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      address
      status
    }
  }
`;

const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      status
    }
  }
`;

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

interface ProjectSelectorProps {
  userRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'INSPECTOR';
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string;
  showCreateButton?: boolean;
}

export function ProjectSelector({ 
  userRole, 
  onProjectSelect, 
  selectedProjectId,
  showCreateButton = true 
}: ProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const { data, loading, error, refetch } = useQuery(GET_USER_PROJECTS, {
    errorPolicy: 'all',
  });

  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT, {
    onCompleted: () => {
      notifications.show({
        title: 'Project Created',
        message: 'New project has been added successfully',
        color: 'green',
      });
      setCreateModalOpen(false);
      refetch();
    },
    onError: (error) => {
      notifications.show({
        title: 'Creation Failed',
        message: error.message,
        color: 'red',
      });
    },
  });

  const [updateProject, { loading: updating }] = useMutation(UPDATE_PROJECT, {
    onCompleted: () => {
      notifications.show({
        title: 'Project Updated',
        message: 'Project has been updated successfully',
        color: 'green',
      });
      setEditingProject(null);
      refetch();
    },
    onError: (error) => {
      notifications.show({
        title: 'Update Failed',
        message: error.message,
        color: 'red',
      });
    },
  });

  const [deleteProject] = useMutation(DELETE_PROJECT, {
    onCompleted: () => {
      notifications.show({
        title: 'Project Deleted',
        message: 'Project has been removed successfully',
        color: 'green',
      });
      refetch();
    },
    onError: (error) => {
      notifications.show({
        title: 'Deletion Failed',
        message: error.message,
        color: 'red',
      });
    },
  });

  const projectForm = useForm({
    initialValues: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      permitNumber: '',
      startDate: new Date(),
      endDate: null,
      disturbedAcres: 0,
    },
  });

  const handleCreateProject = async (values: any) => {
    await createProject({
      variables: {
        input: {
          ...values,
          endDate: values.endDate || undefined,
        },
      },
    });
  };

  const handleUpdateProject = async (values: any) => {
    if (!editingProject) return;

    await updateProject({
      variables: {
        id: editingProject.id,
        input: values,
      },
    });
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"?`)) {
      await deleteProject({
        variables: { id: projectId },
      });
    }
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    projectForm.setValues({
      name: project.name,
      address: project.address,
      latitude: project.latitude,
      longitude: project.longitude,
      permitNumber: project.permitNumber || '',
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : null,
      disturbedAcres: project.disturbedAcres,
    });
  };

  const projects = data?.projects || [];
  
  // Filter projects based on search and status
  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.permitNumber && project.permitNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || statusFilter === '' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Center h={200}>
        <Stack align="center" gap="sm">
          <Loader />
          <Text size="sm">Loading projects...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert
        variant="light"
        color="red"
        title="Error Loading Projects"
        icon={<IconAlertTriangle size={16} />}
      >
        {error.message}
      </Alert>
    );
  }

  // Role-based UI permissions
  const canCreateProjects = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
  const canEditProjects = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
  const canDeleteProjects = ['OWNER', 'ADMIN'].includes(userRole);

  return (
    <>
      <Stack gap="md">
        {/* Header and Filters */}
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder="Search projects..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ minWidth: 250 }}
            />
            
            <Select
              placeholder="Filter by status"
              leftSection={<IconFilter size={16} />}
              value={statusFilter}
              onChange={setStatusFilter}
              data={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PLANNING', label: 'Planning' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          </Group>

          {canCreateProjects && showCreateButton && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpen(true)}
            >
              New Project
            </Button>
          )}
        </Group>

        {/* Project Grid */}
        <Grid>
          {filteredProjects.map((project: any) => (
            <Grid.Col key={project.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card
                shadow="sm"
                padding="lg"
                withBorder
                style={{
                  cursor: onProjectSelect ? 'pointer' : 'default',
                  borderColor: selectedProjectId === project.id ? '#0ea5e9' : undefined,
                  borderWidth: selectedProjectId === project.id ? 2 : undefined,
                }}
                onClick={() => onProjectSelect?.(project.id)}
              >
                <Group justify="space-between" mb="xs">
                  <Badge
                    variant="light"
                    color={
                      project.status === 'ACTIVE' ? 'green' :
                      project.status === 'PLANNING' ? 'blue' :
                      project.status === 'SUSPENDED' ? 'orange' :
                      'gray'
                    }
                  >
                    {project.status}
                  </Badge>

                  {/* Project Actions Menu - Role-based */}
                  {(canEditProjects || canDeleteProjects) && (
                    <Menu position="bottom-end" withArrow>
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconChevronDown size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to project details
                          }}
                        >
                          View Details
                        </Menu.Item>
                        
                        {canEditProjects && (
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(project);
                            }}
                          >
                            Edit Project
                          </Menu.Item>
                        )}
                        
                        {canDeleteProjects && (
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id, project.name);
                            }}
                          >
                            Delete Project
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>

                <Text fw={500} size="lg" mb="xs" lineClamp={2}>
                  {project.name}
                </Text>

                <Stack gap="xs" mb="md">
                  <Group gap="xs">
                    <IconMapPin size={16} color="#666" />
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {project.address}
                    </Text>
                  </Group>

                  {project.permitNumber && (
                    <Group gap="xs">
                      <IconBuilding size={16} color="#666" />
                      <Text size="sm" c="dimmed">
                        Permit: {project.permitNumber}
                      </Text>
                    </Group>
                  )}

                  <Group gap="xs">
                    <IconCalendar size={16} color="#666" />
                    <Text size="sm" c="dimmed">
                      Started: {new Date(project.startDate).toLocaleDateString()}
                    </Text>
                  </Group>
                </Stack>

                {/* Compliance Status */}
                <Group justify="space-between" mb="sm">
                  <Text size="sm" fw={500}>
                    Compliance Score
                  </Text>
                  <Text 
                    size="sm" 
                    fw={600}
                    c={project.compliance.overallScore >= 80 ? 'green' : 
                      project.compliance.overallScore >= 60 ? 'yellow' : 'red'}
                  >
                    {Math.round(project.compliance.overallScore)}%
                  </Text>
                </Group>

                {/* Warning indicators */}
                <Stack gap="xs">
                  {project.compliance.overdueInspections > 0 && (
                    <Badge variant="filled" color="red" size="sm">
                      {project.compliance.overdueInspections} Overdue
                    </Badge>
                  )}

                  {project.compliance.pendingInspections > 0 && (
                    <Badge variant="light" color="orange" size="sm">
                      {project.compliance.pendingInspections} Pending
                    </Badge>
                  )}

                  {project.compliance.requiresAttention && (
                    <Badge variant="light" color="red" size="sm">
                      <Group gap={4}>
                        <IconAlertTriangle size={12} />
                        Needs Attention
                      </Group>
                    </Badge>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          ))}

          {filteredProjects.length === 0 && (
            <Grid.Col span={12}>
              <Center py="xl">
                <Stack align="center" gap="md">
                  <IconBuilding size={48} color="#ccc" />
                  <Text size="lg" c="dimmed">
                    {searchQuery || statusFilter ? 'No projects match your filters' : 'No projects yet'}
                  </Text>
                  {canCreateProjects && !searchQuery && !statusFilter && (
                    <Button 
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      Create Your First Project
                    </Button>
                  )}
                </Stack>
              </Center>
            </Grid.Col>
          )}
        </Grid>
      </Stack>

      {/* Create/Edit Project Modal */}
      <Modal
        opened={createModalOpen || !!editingProject}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingProject(null);
          projectForm.reset();
        }}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        size="lg"
      >
        <form onSubmit={projectForm.onSubmit(editingProject ? handleUpdateProject : handleCreateProject)}>
          <Stack gap="md">
            <TextInput
              label="Project Name"
              placeholder="Enter project name"
              required
              {...projectForm.getInputProps('name')}
            />

            <Textarea
              label="Address"
              placeholder="Enter project address"
              required
              {...projectForm.getInputProps('address')}
            />

            <Group grow>
              <NumberInput
                label="Latitude"
                placeholder="e.g. 40.7128"
                required
                precision={6}
                {...projectForm.getInputProps('latitude')}
              />
              <NumberInput
                label="Longitude"
                placeholder="e.g. -74.0060"
                required
                precision={6}
                {...projectForm.getInputProps('longitude')}
              />
            </Group>

            <TextInput
              label="Permit Number"
              placeholder="Enter permit number (optional)"
              {...projectForm.getInputProps('permitNumber')}
            />

            <Group grow>
              <DateInput
                label="Start Date"
                required
                {...projectForm.getInputProps('startDate')}
              />
              <DateInput
                label="End Date (Optional)"
                {...projectForm.getInputProps('endDate')}
              />
            </Group>

            <NumberInput
              label="Disturbed Acres"
              placeholder="e.g. 5.2"
              required
              min={0}
              step={0.1}
              precision={2}
              {...projectForm.getInputProps('disturbedAcres')}
            />

            <Group justify="flex-end" gap="sm">
              <Button
                variant="subtle"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditingProject(null);
                  projectForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={creating || updating}
              >
                {editingProject ? 'Update' : 'Create'} Project
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}