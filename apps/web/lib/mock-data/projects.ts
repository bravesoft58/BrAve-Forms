/**
 * Mock data for Projects List (Sprint 3 ISSUE-085)
 *
 * Sprint 4 Migration Plan:
 * 1. Delete this entire file
 * 2. Replace getMockProjects() with real GraphQL API call
 * 3. No changes needed in ProjectsListPage component
 *
 * IMPORTANT: This is TEMPORARY mock data for UI development.
 * Real data comes from GraphQL API in Sprint 4.
 */

export interface MockProject {
  id: string;
  name: string;
  address: string;
  status: 'ACTIVE' | 'ARCHIVED';
  isFavorite: boolean;
  startDate: string;
  compliance: {
    pendingInspections: number;
    requiresAttention: boolean;
  };
}

/**
 * Get mock projects for UI testing
 *
 * Sprint 4: Replace with real API call
 */
export const getMockProjects = (): MockProject[] => [
  {
    id: '1',
    name: 'Mill Street Construction',
    address: '123 Main St, Reno NV',
    status: 'ACTIVE',
    isFavorite: true,
    startDate: '2025-01-15',
    compliance: {
      pendingInspections: 2,
      requiresAttention: true,
    },
  },
  {
    id: '2',
    name: 'Downtown Plaza',
    address: '456 Center Ave, Sparks NV',
    status: 'ACTIVE',
    isFavorite: false,
    startDate: '2025-02-01',
    compliance: {
      pendingInspections: 0,
      requiresAttention: false,
    },
  },
  {
    id: '3',
    name: 'Old Highway Project',
    address: '789 Highway 80, Reno NV',
    status: 'ARCHIVED',
    isFavorite: false,
    startDate: '2024-06-15',
    compliance: {
      pendingInspections: 0,
      requiresAttention: false,
    },
  },
  {
    id: '4',
    name: 'Residential Complex',
    address: '321 Park Blvd, Carson City NV',
    status: 'ACTIVE',
    isFavorite: false,
    startDate: '2025-03-10',
    compliance: {
      pendingInspections: 1,
      requiresAttention: false,
    },
  },
  {
    id: '5',
    name: 'Industrial Warehouse',
    address: '654 Industrial Dr, Reno NV',
    status: 'ACTIVE',
    isFavorite: true,
    startDate: '2025-01-20',
    compliance: {
      pendingInspections: 3,
      requiresAttention: true,
    },
  },
];

/**
 * Filter projects by status
 */
export const filterProjectsByStatus = (projects: MockProject[], filter: string): MockProject[] => {
  switch (filter) {
    case 'active':
      return projects.filter((p) => p.status === 'ACTIVE');
    case 'favorites':
      return projects.filter((p) => p.isFavorite);
    case 'archived':
      return projects.filter((p) => p.status === 'ARCHIVED');
    default:
      return projects;
  }
};

/**
 * Search projects by name or address
 */
export const searchProjects = (projects: MockProject[], search: string): MockProject[] => {
  if (!search.trim()) return projects;

  const searchLower = search.toLowerCase();
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchLower) || p.address.toLowerCase().includes(searchLower)
  );
};
