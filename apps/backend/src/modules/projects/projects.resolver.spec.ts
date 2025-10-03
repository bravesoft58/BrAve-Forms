import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectStatus } from '@prisma/client';

describe('ProjectsResolver', () => {
  let resolver: ProjectsResolver;
  let _projectsService: ProjectsService;
  let _prismaService: PrismaService;

  const mockUser: CurrentUser = {
    userId: 'user_123',
    orgId: 'org_abc',
    email: 'test@example.com',
    orgRole: 'MANAGER',
    orgSlug: 'test-org',
    sessionId: 'session_123',
  };

  const mockOrganization = {
    id: 'internal_org_123',
    clerkOrgId: 'org_abc',
    name: 'Test Construction Co',
    slug: 'test-org',
    plan: 'PROFESSIONAL',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockProjects = [
    {
      id: 'proj_1',
      orgId: 'internal_org_123',
      name: 'Downtown Mall Construction',
      address: '123 Main St, City, State 12345',
      latitude: 40.7128,
      longitude: -74.006,
      permitNumber: 'PERMIT-001',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2025-01-10'),
      disturbedAcres: 5.5,
      status: ProjectStatus.ACTIVE,
      bmps: [],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      inspections: [
        {
          id: 'insp_1',
          type: 'ROUTINE',
          status: 'APPROVED',
          inspectionDate: new Date('2024-01-15'),
          submittedAt: new Date('2024-01-15'),
          weatherTriggered: false,
        },
        {
          id: 'insp_2',
          type: 'WEATHER',
          status: 'PENDING',
          inspectionDate: new Date('2024-01-20'),
          submittedAt: null,
          weatherTriggered: true,
        },
      ],
    },
    {
      id: 'proj_2',
      orgId: 'internal_org_123',
      name: 'Bridge Repair Project',
      address: '456 Oak Ave, Town, State 67890',
      latitude: 41.8781,
      longitude: -87.6298,
      permitNumber: 'PERMIT-002',
      startDate: new Date('2024-02-01'),
      endDate: null,
      disturbedAcres: 3.2,
      status: ProjectStatus.ACTIVE,
      bmps: [],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10'),
      inspections: [],
    },
  ];

  const mockProjectsService = {
    getUserProjects: jest.fn(),
  };

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsResolver,
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<ProjectsResolver>(ProjectsResolver);
    _projectsService = module.get<ProjectsService>(ProjectsService);
    _prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default mock for getOrganizationByClerkId
    mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('projects Query', () => {
    it('should return all projects for user with compliance data', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue(mockProjects);

      const result = await resolver.projects(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Downtown Mall Construction');
      expect(result[0].recentInspections).toHaveLength(2);
      expect(result[0].compliance).toBeDefined();
      expect(result[0].compliance.overallScore).toBeGreaterThanOrEqual(0);
      expect(mockProjectsService.getUserProjects).toHaveBeenCalledWith(
        mockUser.userId,
        mockOrganization.id,
        mockUser.orgRole
      );
    });

    it('should calculate compliance scores correctly', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue([mockProjects[0]]);

      const result = await resolver.projects(mockUser);

      const compliance = result[0].compliance;
      expect(compliance.overallScore).toBe(50); // 1 approved / 2 total = 50%
      expect(compliance.pendingInspections).toBe(1);
      expect(compliance.requiresAttention).toBe(true); // Score < 80%
    });

    it('should limit recent inspections to 5 most recent', async () => {
      const projectWithManyInspections = {
        ...mockProjects[0],
        inspections: Array(10).fill({
          id: 'insp_test',
          type: 'ROUTINE',
          status: 'APPROVED',
          inspectionDate: new Date(),
          submittedAt: new Date(),
          weatherTriggered: false,
        }),
      };

      mockProjectsService.getUserProjects.mockResolvedValue([projectWithManyInspections]);

      const result = await resolver.projects(mockUser);

      expect(result[0].recentInspections).toHaveLength(5);
    });

    it('should handle projects with no inspections', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue([mockProjects[1]]);

      const result = await resolver.projects(mockUser);

      expect(result[0].recentInspections).toHaveLength(0);
      expect(result[0].compliance.overallScore).toBe(100); // No inspections = 100%
      expect(result[0].compliance.pendingInspections).toBe(0);
      expect(result[0].compliance.requiresAttention).toBe(false);
    });

    it('should verify organization access via Clerk orgId', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue(mockProjects);

      await resolver.projects(mockUser);

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { clerkOrgId: mockUser.orgId },
      });
    });
  });

  describe('project Query (single)', () => {
    it('should return single project by ID with compliance data', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[0]);

      const result = await resolver.project(mockUser, 'proj_1');

      expect(result.id).toBe('proj_1');
      expect(result.name).toBe('Downtown Mall Construction');
      expect(result.recentInspections).toHaveLength(2);
      expect(result.compliance).toBeDefined();
      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'proj_1',
          organization: {
            clerkOrgId: mockUser.orgId,
          },
        },
        include: {
          inspections: {
            orderBy: { inspectionDate: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should throw error when project not found', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(resolver.project(mockUser, 'nonexistent')).rejects.toThrow(
        'Project not found or access denied'
      );
    });

    it('should enforce multi-tenant isolation', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(resolver.project(mockUser, 'proj_other_org')).rejects.toThrow();

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organization: { clerkOrgId: mockUser.orgId },
          }),
        })
      );
    });

    it('should detect overdue inspections correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);

      const projectWithOverdueInspection = {
        ...mockProjects[0],
        inspections: [
          {
            id: 'insp_overdue',
            type: 'WEATHER',
            status: 'PENDING',
            inspectionDate: yesterday,
            submittedAt: null,
            weatherTriggered: true,
          },
        ],
      };

      mockPrismaService.project.findFirst.mockResolvedValue(projectWithOverdueInspection);

      const result = await resolver.project(mockUser, 'proj_1');

      expect(result.recentInspections[0].overdue).toBe(true);
      expect(result.compliance.overdueInspections).toBe(1);
      expect(result.compliance.requiresAttention).toBe(true);
    });
  });

  describe('createProject Mutation', () => {
    const createInput = {
      name: 'New Project',
      address: '789 Elm St, Village, State 11111',
      latitude: 42.3601,
      longitude: -71.0589,
      permitNumber: 'PERMIT-003',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-03-01'),
      disturbedAcres: 7.8,
    };

    it('should create new project with orgId from organization', async () => {
      const createdProject = {
        id: 'proj_new',
        ...createInput,
        orgId: mockOrganization.id,
        status: ProjectStatus.ACTIVE,
        bmps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        inspections: [],
      };

      mockPrismaService.project.create.mockResolvedValue(createdProject);

      const result = await resolver.createProject(mockUser, createInput);

      expect(result.id).toBe('proj_new');
      expect(result.name).toBe('New Project');
      expect(result.recentInspections).toEqual([]);
      expect(result.compliance.overallScore).toBe(100); // New project, no inspections
      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createInput,
          orgId: mockOrganization.id,
          bmps: [],
        },
        include: {
          inspections: true,
        },
      });
    });

    it('should verify organization access before creating', async () => {
      mockPrismaService.project.create.mockResolvedValue({
        id: 'proj_new',
        ...createInput,
        orgId: mockOrganization.id,
        status: ProjectStatus.ACTIVE,
        bmps: [],
        inspections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await resolver.createProject(mockUser, createInput);

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { clerkOrgId: mockUser.orgId },
      });
    });

    it('should throw error if organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(resolver.createProject(mockUser, createInput)).rejects.toThrow(
        'Organization not found for Clerk ID:'
      );
    });
  });

  describe('updateProject Mutation', () => {
    const updateInput = {
      name: 'Updated Project Name',
      status: ProjectStatus.COMPLETED,
    };

    it('should update existing project', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[0]);
      mockPrismaService.project.update.mockResolvedValue({
        ...mockProjects[0],
        ...updateInput,
      });

      const result = await resolver.updateProject(mockUser, 'proj_1', updateInput);

      expect(result.name).toBe('Updated Project Name');
      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: 'proj_1' },
        data: updateInput,
        include: {
          inspections: {
            orderBy: { inspectionDate: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should verify project belongs to user organization before update', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(resolver.updateProject(mockUser, 'proj_1', updateInput)).rejects.toThrow(
        'Project not found or access denied'
      );

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'proj_1',
          organization: {
            clerkOrgId: mockUser.orgId,
          },
        },
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Only Name Changed' };

      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[0]);
      mockPrismaService.project.update.mockResolvedValue({
        ...mockProjects[0],
        name: partialUpdate.name,
      });

      const result = await resolver.updateProject(mockUser, 'proj_1', partialUpdate);

      expect(result.name).toBe('Only Name Changed');
      expect(result.address).toBe('123 Main St, City, State 12345'); // Unchanged
    });
  });

  describe('deleteProject Mutation', () => {
    it('should soft delete project by setting status to CLOSED', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[0]);
      mockPrismaService.project.update.mockResolvedValue({
        ...mockProjects[0],
        status: ProjectStatus.CLOSED,
      });

      const result = await resolver.deleteProject(mockUser, 'proj_1');

      expect(result).toBe(true);
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: 'proj_1' },
        data: { status: 'CLOSED' },
      });
    });

    it('should verify project belongs to user organization before delete', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(resolver.deleteProject(mockUser, 'proj_1')).rejects.toThrow(
        'Project not found or access denied'
      );

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'proj_1',
          organization: {
            clerkOrgId: mockUser.orgId,
          },
        },
      });
    });

    it('should prevent deletion of projects from other organizations', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(resolver.deleteProject(mockUser, 'proj_other_org')).rejects.toThrow();
    });
  });

  describe('Multi-Tenant Security', () => {
    it('should always verify organization via clerkOrgId', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue([]);

      await resolver.projects(mockUser);

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { clerkOrgId: mockUser.orgId },
      });
    });

    it('should filter projects query by organization', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue(mockProjects);

      await resolver.projects(mockUser);

      expect(mockProjectsService.getUserProjects).toHaveBeenCalledWith(
        mockUser.userId,
        mockOrganization.id,
        mockUser.orgRole
      );
    });

    it('should enforce organization filter in single project query', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[0]);

      await resolver.project(mockUser, 'proj_1');

      const callArgs = mockPrismaService.project.findFirst.mock.calls[0][0];
      expect(callArgs.where.organization.clerkOrgId).toBe(mockUser.orgId);
    });
  });

  describe('Compliance Calculations', () => {
    it('should calculate 100% score for projects with all approved inspections', async () => {
      const projectAllApproved = {
        ...mockProjects[0],
        inspections: [
          {
            id: 'insp_1',
            type: 'ROUTINE',
            status: 'APPROVED',
            inspectionDate: new Date(),
            submittedAt: new Date(),
            weatherTriggered: false,
          },
          {
            id: 'insp_2',
            type: 'WEATHER',
            status: 'APPROVED',
            inspectionDate: new Date(),
            submittedAt: new Date(),
            weatherTriggered: true,
          },
        ],
      };

      mockProjectsService.getUserProjects.mockResolvedValue([projectAllApproved]);

      const result = await resolver.projects(mockUser);

      expect(result[0].compliance.overallScore).toBe(100);
      expect(result[0].compliance.requiresAttention).toBe(false);
    });

    it('should detect projects requiring attention when score < 80%', async () => {
      const projectLowScore = {
        ...mockProjects[0],
        inspections: [
          {
            id: '1',
            status: 'APPROVED',
            type: 'ROUTINE',
            inspectionDate: new Date(),
            submittedAt: new Date(),
            weatherTriggered: false,
          },
          {
            id: '2',
            status: 'PENDING',
            type: 'ROUTINE',
            inspectionDate: new Date(),
            submittedAt: null,
            weatherTriggered: false,
          },
          {
            id: '3',
            status: 'PENDING',
            type: 'ROUTINE',
            inspectionDate: new Date(),
            submittedAt: null,
            weatherTriggered: false,
          },
          {
            id: '4',
            status: 'PENDING',
            type: 'ROUTINE',
            inspectionDate: new Date(),
            submittedAt: null,
            weatherTriggered: false,
          },
          {
            id: '5',
            status: 'PENDING',
            type: 'ROUTINE',
            inspectionDate: new Date(),
            submittedAt: null,
            weatherTriggered: false,
          },
        ],
      };

      mockProjectsService.getUserProjects.mockResolvedValue([projectLowScore]);

      const result = await resolver.projects(mockUser);

      expect(result[0].compliance.overallScore).toBe(20); // 1/5 = 20%
      expect(result[0].compliance.requiresAttention).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projects array', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue([]);

      const result = await resolver.projects(mockUser);

      expect(result).toEqual([]);
    });

    it('should handle project with null endDate', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[1]);

      const result = await resolver.project(mockUser, 'proj_2');

      expect(result.endDate).toBeNull();
    });

    it('should handle inspection with null submittedAt', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProjects[0]);

      const result = await resolver.project(mockUser, 'proj_1');

      const pendingInspection = result.recentInspections.find((i) => i.status === 'PENDING');
      expect(pendingInspection?.submittedAt).toBeNull();
    });
  });
});
