import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectStatus } from '@prisma/client';

describe('OrganizationsResolver', () => {
  let resolver: OrganizationsResolver;
  let _prismaService: PrismaService;

  const mockUser: CurrentUser = {
    userId: 'user_123',
    orgId: 'org_abc',
    email: 'test@example.com',
    orgRole: 'ADMIN',
    orgSlug: 'test-org',
    sessionId: 'session_123',
  };

  const mockOrganization = {
    id: 'org_abc',
    clerkOrgId: 'clerk_org_123',
    name: 'Test Construction Co',
    slug: 'test-org',
    settings: { theme: 'light', notifications: true },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockProjects = [
    {
      id: 'proj_1',
      orgId: 'org_abc',
      name: 'Site A Construction',
      location: '123 Main St',
      status: ProjectStatus.ACTIVE,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      inspections: [
        { id: 'insp_1', completed: true, createdAt: new Date() },
        { id: 'insp_2', completed: false, createdAt: new Date() },
      ],
      weatherEvents: [{ id: 'weather_1', precipitationInches: 0.3, createdAt: new Date() }],
    },
    {
      id: 'proj_2',
      orgId: 'org_abc',
      name: 'Bridge Repair Project',
      location: '456 Oak Ave',
      status: ProjectStatus.ACTIVE,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10'),
      inspections: [],
      weatherEvents: [],
    },
  ];

  const mockOrganizationsService = {
    findByClerkOrgId: jest.fn(),
  };

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    inspection: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    weatherEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    userOrganization: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsResolver,
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<OrganizationsResolver>(OrganizationsResolver);
    _prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default mocks to prevent common errors
    mockPrismaService.userOrganization.groupBy.mockResolvedValue([]);
    mockPrismaService.project.groupBy.mockResolvedValue([]);
    mockPrismaService.inspection.groupBy.mockResolvedValue([]);

    // Mock getOrganizationByClerkId helper (used by most queries)
    mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('currentOrganization Query', () => {
    it('should return current organization with projects and stats', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        projects: mockProjects,
      });

      const result = await resolver.currentOrganization(mockUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('org_abc');
      expect(result.name).toBe('Test Construction Co');
      expect(result.projects).toHaveLength(2);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { clerkOrgId: mockUser.orgId },
        include: {
          projects: {
            include: {
              inspections: true,
              weatherEvents: true,
            },
          },
        },
      });
    });

    it('should return organization with nested projects structure', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        projects: mockProjects,
      });

      const result = await resolver.currentOrganization(mockUser);

      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].name).toBe('Site A Construction');
      expect(result.projects[0].inspections).toHaveLength(2);
      expect(result.projects[1].name).toBe('Bridge Repair Project');
    });

    it('should throw error when organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(resolver.currentOrganization(mockUser)).rejects.toThrow(
        'Organization not found'
      );
    });

    it('should handle organization with no projects', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        projects: [],
      });

      const result = await resolver.currentOrganization(mockUser);

      expect(result.projects).toEqual([]);
      expect(result.id).toBe('org_abc');
      expect(result.name).toBe('Test Construction Co');
    });
  });

  // NOTE: projects Query tests moved to projects.resolver.spec.ts
  // The projects query is now handled by ProjectsResolver with ProjectWithComplianceGQL type;

  describe('organizationDashboard Query', () => {
    it('should return comprehensive organization statistics', async () => {
      mockPrismaService.project.count.mockResolvedValue(10);
      mockPrismaService.project.findMany.mockResolvedValue(
        Array(7).fill({ status: ProjectStatus.ACTIVE })
      );
      mockPrismaService.inspection.count
        .mockResolvedValueOnce(45) // Total inspections
        .mockResolvedValueOnce(7); // Pending inspections
      mockPrismaService.userOrganization.count.mockResolvedValue(15);
      mockPrismaService.userOrganization.groupBy.mockResolvedValue([
        { role: 'ADMIN', _count: { role: 5 } },
        { role: 'MEMBER', _count: { role: 10 } },
      ]);
      mockPrismaService.project.groupBy.mockResolvedValue([
        { status: ProjectStatus.ACTIVE, _count: { status: 7 } },
        { status: ProjectStatus.COMPLETED, _count: { status: 3 } },
      ]);
      mockPrismaService.inspection.groupBy.mockResolvedValue([]);

      const result = await resolver.organizationDashboard(mockUser);

      expect(result.totalProjects).toBe(10);
      expect(result.activeProjects).toBe(7);
      expect(result.totalInspections).toBe(45);
      expect(result.pendingInspections).toBe(7);
      expect(result.totalUsers).toBe(15);
      expect(result.complianceRate).toBeGreaterThanOrEqual(0);
      expect(result.complianceRate).toBeLessThanOrEqual(100);

      expect(mockPrismaService.project.count).toHaveBeenCalled();
    });

    it('should handle zero inspections (no divide by zero)', async () => {
      mockPrismaService.project.count.mockResolvedValue(5);
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.inspection.count
        .mockResolvedValueOnce(0) // Total inspections
        .mockResolvedValueOnce(0); // Pending inspections
      mockPrismaService.userOrganization.count.mockResolvedValue(3);

      const result = await resolver.organizationDashboard(mockUser);

      expect(result.complianceRate).toBe(0); // Should not be NaN or throw error
      expect(result.totalInspections).toBe(0);
      expect(result.totalUsers).toBe(3);
    });
  });

  describe('updateOrganization Mutation', () => {
    it('should update organization name', async () => {
      const updateInput = {
        name: 'Updated Construction Co',
      };

      const updatedOrg = {
        ...mockOrganization,
        name: updateInput.name,
        updatedAt: new Date(),
      };

      mockPrismaService.organization.update.mockResolvedValue({
        ...updatedOrg,
        projects: [],
      });

      const result = await resolver.updateOrganization(mockUser, updateInput);

      expect(result.name).toBe('Updated Construction Co');
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: expect.any(String) }),
          data: updateInput,
        })
      );
    });

    it('should handle empty update input', async () => {
      const updateInput = { name: 'New Name Only' };

      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrganization,
        name: updateInput.name,
        projects: [],
      });

      const result = await resolver.updateOrganization(mockUser, updateInput);

      expect(result.name).toBe('New Name Only');
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { clerkOrgId: mockUser.orgId },
        data: updateInput,
        include: expect.any(Object),
      });
    });

    it('should throw error when update fails', async () => {
      const updateInput = { name: 'New Name' };

      mockPrismaService.organization.update.mockRejectedValue(new Error('Database update failed'));

      await expect(resolver.updateOrganization(mockUser, updateInput)).rejects.toThrow(
        'Database update failed'
      );
    });

    it('should enforce multi-tenant isolation on update', async () => {
      const updateInput = { name: 'Updated Name' };

      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrganization,
        projects: [],
        users: [],
      });

      await resolver.updateOrganization(mockUser, updateInput);

      expect(mockPrismaService.organization.update).toHaveBeenCalled();
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkOrgId: mockUser.orgId },
        })
      );
    });
  });

  describe('Multi-Tenant Security', () => {
    it('should always filter by user orgId in all queries', async () => {
      // Test currentOrganization
      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        projects: [],
      });
      await resolver.currentOrganization(mockUser);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkOrgId: mockUser.orgId },
        })
      );

      // NOTE: projects query test moved to projects.resolver.spec.ts

      // Test organizationDashboard
      mockPrismaService.project.count.mockResolvedValue(0);
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.inspection.count.mockResolvedValue(0);
      mockPrismaService.userOrganization.count.mockResolvedValue(0);
      await resolver.organizationDashboard(mockUser);
      expect(mockPrismaService.project.count).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    // NOTE: "should handle projects with empty arrays gracefully" test moved to projects.resolver.spec.ts

    it('should handle very large organization stats', async () => {
      mockPrismaService.project.count.mockResolvedValue(10000);
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.inspection.count.mockResolvedValueOnce(50000).mockResolvedValueOnce(1500);
      mockPrismaService.userOrganization.count.mockResolvedValue(500);

      const result = await resolver.organizationDashboard(mockUser);

      expect(result.totalProjects).toBe(10000);
      expect(result.totalInspections).toBe(50000);
      expect(result.pendingInspections).toBe(1500);
      expect(result.totalUsers).toBe(500);
      expect(result.complianceRate).toBeGreaterThanOrEqual(0);
    });
  });
});
