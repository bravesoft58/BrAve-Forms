/**
 * Projects API helpers for fetching and managing projects
 *
 * @security All functions require Clerk JWT authentication
 * @multi-tenancy All queries automatically filtered by orgId from JWT
 */

import { makeAuthenticatedRequest } from './client';

export type ProjectStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface ProjectInspection {
  id: string;
  type: string;
  status: string;
  inspectionDate: string;
  submittedAt?: string;
  weatherTriggered: boolean;
  overdue: boolean;
}

export interface ProjectCompliance {
  overallScore: number;
  pendingInspections: number;
  overdueInspections: number;
  lastInspection?: string;
  nextDeadline?: string;
  requiresAttention: boolean;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  permitNumber?: string;
  startDate: string;
  endDate?: string;
  disturbedAcres: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  recentInspections: ProjectInspection[];
  compliance: ProjectCompliance;
}

export interface GetProjectsParams {
  status?: ProjectStatus;
  take?: number;
  skip?: number;
}

/**
 * Get all projects for the current organization
 *
 * @param params - Optional filters (status, pagination)
 * @param token - Clerk JWT token
 * @returns Promise resolving to array of projects
 *
 * @example
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const projects = await getProjects({ status: 'ACTIVE' }, token);
 *
 * @security Requires valid Clerk JWT with orgId claim
 * @multi-tenancy Returns only projects for user's organization
 */
export async function getProjects(
  params: GetProjectsParams | undefined,
  token: string | null
): Promise<Project[]> {
  const data = await makeAuthenticatedRequest<{ projects: Project[] }>(
    {
      query: `
        query Projects {
          projects {
            id
            name
            address
            latitude
            longitude
            permitNumber
            startDate
            endDate
            disturbedAcres
            status
            createdAt
            updatedAt
            recentInspections {
              id
              type
              status
              inspectionDate
              submittedAt
              weatherTriggered
              overdue
            }
            compliance {
              overallScore
              pendingInspections
              overdueInspections
              lastInspection
              nextDeadline
              requiresAttention
            }
          }
        }
      `,
    },
    token
  );

  let projects = data.projects || [];

  // Client-side filtering by status if provided
  if (params?.status) {
    projects = projects.filter((p) => p.status === params.status);
  }

  return projects;
}

/**
 * Get a single project by ID
 *
 * @param id - Project ID
 * @param token - Clerk JWT token
 * @returns Promise resolving to project
 * @throws {Error} If project not found
 * @throws {Error} If user lacks permission (cross-tenant access)
 *
 * @example
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const project = await getProjectById('project-123', token);
 *
 * @security Backend validates user can access project
 */
export async function getProjectById(
  id: string,
  token: string | null
): Promise<Project> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid project ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ project: Project }>(
    {
      query: `
        query Project($id: String!) {
          project(id: $id) {
            id
            name
            address
            latitude
            longitude
            permitNumber
            startDate
            endDate
            disturbedAcres
            status
            createdAt
            updatedAt
            recentInspections {
              id
              type
              status
              inspectionDate
              submittedAt
              weatherTriggered
              overdue
            }
            compliance {
              overallScore
              pendingInspections
              overdueInspections
              lastInspection
              nextDeadline
              requiresAttention
            }
          }
        }
      `,
      variables: { id },
    },
    token
  );

  return data.project;
}

// ============================================================================
// Project Mutations
// ============================================================================

export interface CreateProjectInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  permitNumber?: string;
  startDate: string;
  endDate?: string;
  disturbedAcres: number;
}

export interface UpdateProjectInput {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  permitNumber?: string;
  startDate?: string;
  endDate?: string;
  disturbedAcres?: number;
  status?: ProjectStatus;
}

/**
 * Create a new project
 *
 * @param input - Project data
 * @param token - Clerk JWT token
 * @returns Promise resolving to created project
 *
 * @security Requires MANAGER role or above
 */
export async function createProject(
  input: CreateProjectInput,
  token: string | null
): Promise<Project> {
  if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
    throw new Error('Invalid name: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ createProject: Project }>(
    {
      query: `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            name
            address
            latitude
            longitude
            permitNumber
            startDate
            endDate
            disturbedAcres
            status
            createdAt
            updatedAt
            recentInspections {
              id
              type
              status
              inspectionDate
              submittedAt
              weatherTriggered
              overdue
            }
            compliance {
              overallScore
              pendingInspections
              overdueInspections
              lastInspection
              nextDeadline
              requiresAttention
            }
          }
        }
      `,
      variables: { input },
    },
    token
  );

  return data.createProject;
}

/**
 * Update an existing project
 *
 * @param id - Project ID
 * @param input - Fields to update
 * @param token - Clerk JWT token
 * @returns Promise resolving to updated project
 *
 * @security Requires MANAGER role or above
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  token: string | null
): Promise<Project> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid project ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ updateProject: Project }>(
    {
      query: `
        mutation UpdateProject($id: String!, $input: UpdateProjectInput!) {
          updateProject(id: $id, input: $input) {
            id
            name
            address
            latitude
            longitude
            permitNumber
            startDate
            endDate
            disturbedAcres
            status
            createdAt
            updatedAt
            recentInspections {
              id
              type
              status
              inspectionDate
              submittedAt
              weatherTriggered
              overdue
            }
            compliance {
              overallScore
              pendingInspections
              overdueInspections
              lastInspection
              nextDeadline
              requiresAttention
            }
          }
        }
      `,
      variables: { id, input },
    },
    token
  );

  return data.updateProject;
}

/**
 * Delete (soft-delete) a project
 *
 * @param id - Project ID
 * @param token - Clerk JWT token
 * @returns Promise resolving to true on success
 *
 * @security Requires ADMIN role or above
 */
export async function deleteProject(
  id: string,
  token: string | null
): Promise<boolean> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid project ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ deleteProject: boolean }>(
    {
      query: `
        mutation DeleteProject($id: String!) {
          deleteProject(id: $id)
        }
      `,
      variables: { id },
    },
    token
  );

  return data.deleteProject;
}
