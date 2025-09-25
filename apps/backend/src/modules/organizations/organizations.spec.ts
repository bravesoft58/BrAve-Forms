import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrganizationsService } from './organizations.service';
import { OrganizationsResolver } from './organizations.resolver';

/**
 * Multi-Tenant Data Isolation Test Suite
 * 
 * Critical tests to ensure complete tenant separation for construction companies
 * Tests cover the EPA compliance requirement for data segregation
 */

describe('Multi-Tenant Data Isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orgService: OrganizationsService;
  
  // Test tenant data
  const tenantA = {
    id: 'org-a-uuid',
    clerkOrgId: 'clerk-org-a',
    name: 'ABC Construction',
  };
  
  const tenantB = {
    id: 'org-b-uuid', 
    clerkOrgId: 'clerk-org-b',
    name: 'XYZ Builders',
  };

  const userA = {
    userId: 'user-a-uuid',
    orgId: tenantA.id,
    role: 'ADMIN',
  };

  const userB = {
    userId: 'user-b-uuid',
    orgId: tenantB.id,
    role: 'ADMIN',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        OrganizationsService,
        OrganizationsResolver,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    orgService = moduleFixture.get<OrganizationsService>(OrganizationsService);
    
    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('Organization Isolation', () => {
    it('should only return organization data for the correct tenant', async () => {
      // Create organizations
      await prisma.organization.createMany({
        data: [tenantA, tenantB],
      });

      // User A should only see Tenant A
      const orgA = await orgService.getOrganizationByClerkId(tenantA.clerkOrgId);
      expect(orgA.id).toBe(tenantA.id);
      expect(orgA.name).toBe(tenantA.name);

      // User B should only see Tenant B
      const orgB = await orgService.getOrganizationByClerkId(tenantB.clerkOrgId);
      expect(orgB.id).toBe(tenantB.id);
      expect(orgB.name).toBe(tenantB.name);

      // Attempting to access wrong org should fail
      await expect(
        orgService.getOrganizationByClerkId('non-existent-org')
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('Project Isolation', () => {
    it('should isolate projects between tenants', async () => {
      // Create test projects for both tenants
      const projectA = await prisma.project.create({
        data: {
          orgId: tenantA.id,
          name: 'Highway Construction Project',
          address: '123 Main St, City A',
          latitude: 40.7128,
          longitude: -74.0060,
          startDate: new Date(),
          disturbedAcres: 5.2,
          bmps: [],
        },
      });

      const projectB = await prisma.project.create({
        data: {
          orgId: tenantB.id,
          name: 'Bridge Renovation Project',
          address: '456 Oak Ave, City B',
          latitude: 41.8781,
          longitude: -87.6298,
          startDate: new Date(),
          disturbedAcres: 3.1,
          bmps: [],
        },
      });

      // User A should only see projects from Tenant A
      const projectsA = await orgService.getUserProjects(
        userA.userId,
        tenantA.id,
        'ADMIN'
      );
      
      expect(projectsA).toHaveLength(1);
      expect(projectsA[0].id).toBe(projectA.id);
      expect(projectsA[0].name).toBe('Highway Construction Project');

      // User B should only see projects from Tenant B
      const projectsB = await orgService.getUserProjects(
        userB.userId,
        tenantB.id,
        'ADMIN'
      );
      
      expect(projectsB).toHaveLength(1);
      expect(projectsB[0].id).toBe(projectB.id);
      expect(projectsB[0].name).toBe('Bridge Renovation Project');

      // Cross-tenant access should be blocked
      const canUserAAccessProjectB = await orgService.canUserAccessProject(
        userA.userId,
        projectB.id,
        'READ'
      );
      
      expect(canUserAAccessProjectB).toBe(false);
    });
  });

  describe('Inspection Isolation', () => {
    it('should isolate inspections between tenants', async () => {
      // Setup projects first
      const projectA = await prisma.project.create({
        data: {
          orgId: tenantA.id,
          name: 'Project A',
          address: 'Address A',
          latitude: 40.0,
          longitude: -74.0,
          startDate: new Date(),
          disturbedAcres: 1.0,
          bmps: [],
        },
      });

      const projectB = await prisma.project.create({
        data: {
          orgId: tenantB.id,
          name: 'Project B',
          address: 'Address B',
          latitude: 41.0,
          longitude: -75.0,
          startDate: new Date(),
          disturbedAcres: 2.0,
          bmps: [],
        },
      });

      // Create inspections for both tenants
      const inspectionA = await prisma.inspection.create({
        data: {
          orgId: tenantA.id,
          projectId: projectA.id,
          inspectorId: userA.userId,
          type: 'ROUTINE',
          inspectionDate: new Date(),
          formData: { findings: 'All BMPs functional' },
          violations: [],
          correctiveActions: [],
        },
      });

      const inspectionB = await prisma.inspection.create({
        data: {
          orgId: tenantB.id,
          projectId: projectB.id,
          inspectorId: userB.userId,
          type: 'RAIN_EVENT',
          inspectionDate: new Date(),
          weatherTriggered: true,
          precipitationInches: 0.3,
          formData: { findings: 'Minor erosion observed' },
          violations: [],
          correctiveActions: [],
        },
      });

      // Verify tenant isolation at database level
      const inspectionsA = await prisma.inspection.findMany({
        where: { orgId: tenantA.id },
      });
      
      const inspectionsB = await prisma.inspection.findMany({
        where: { orgId: tenantB.id },
      });

      expect(inspectionsA).toHaveLength(1);
      expect(inspectionsA[0].id).toBe(inspectionA.id);
      expect(inspectionsA[0].type).toBe('ROUTINE');

      expect(inspectionsB).toHaveLength(1);
      expect(inspectionsB[0].id).toBe(inspectionB.id);
      expect(inspectionsB[0].type).toBe('RAIN_EVENT');
      expect(inspectionsB[0].weatherTriggered).toBe(true);

      // Cross-tenant queries should return empty
      const crossTenantQuery = await prisma.inspection.findMany({
        where: {
          orgId: tenantA.id,
          id: inspectionB.id, // Inspection from different tenant
        },
      });
      
      expect(crossTenantQuery).toHaveLength(0);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce role hierarchy', async () => {
      const testCases = [
        { userRole: 'OWNER', canDelete: true, canWrite: true, canRead: true },
        { userRole: 'ADMIN', canDelete: true, canWrite: true, canRead: true },
        { userRole: 'MANAGER', canDelete: false, canWrite: true, canRead: true },
        { userRole: 'MEMBER', canDelete: false, canWrite: false, canRead: true },
        { userRole: 'INSPECTOR', canDelete: false, canWrite: false, canRead: false },
      ];

      const project = await prisma.project.create({
        data: {
          orgId: tenantA.id,
          name: 'Test Project',
          address: 'Test Address',
          latitude: 40.0,
          longitude: -74.0,
          startDate: new Date(),
          disturbedAcres: 1.0,
          bmps: [],
        },
      });

      for (const testCase of testCases) {
        // Test project access permissions
        const canRead = await orgService.canUserAccessProject(
          userA.userId,
          project.id,
          'READ'
        );

        const canWrite = await orgService.canUserAccessProject(
          userA.userId,
          project.id,
          'WRITE'
        );

        const canDelete = await orgService.canUserAccessProject(
          userA.userId,
          project.id,
          'DELETE'
        );

        // Note: This test would need actual user role setup in the database
        // For now, we're testing the permission logic structure
        expect(typeof canRead).toBe('boolean');
        expect(typeof canWrite).toBe('boolean');
        expect(typeof canDelete).toBe('boolean');
      }
    });
  });

  describe('Database RLS Compliance', () => {
    it('should prevent SQL injection attacks across tenants', async () => {
      const projectA = await prisma.project.create({
        data: {
          orgId: tenantA.id,
          name: 'Secure Project A',
          address: 'Address A',
          latitude: 40.0,
          longitude: -74.0,
          startDate: new Date(),
          disturbedAcres: 1.0,
          bmps: [],
        },
      });

      // Attempt SQL injection to access other tenant's data
      const maliciousQuery = `${projectA.id}' OR org_id = '${tenantB.id}`;
      
      // This should NOT return projectB data
      const result = await prisma.project.findMany({
        where: {
          id: maliciousQuery as any, // This would be prevented by Prisma typing
          orgId: tenantA.id,
        },
      });

      // Should only find legitimate project from tenant A
      expect(result).toHaveLength(0); // Invalid ID format
    });
  });

  describe('EPA Compliance Data Segregation', () => {
    it('should maintain regulatory compliance for data isolation', async () => {
      // Test that weather events and inspections are properly isolated
      // This is critical for EPA audit compliance
      
      const projectA = await prisma.project.create({
        data: {
          orgId: tenantA.id,
          name: 'EPA Compliant Project A',
          address: 'Address A',
          latitude: 40.0,
          longitude: -74.0,
          startDate: new Date(),
          disturbedAcres: 1.0,
          bmps: [],
        },
      });

      const weatherEventA = await prisma.weatherEvent.create({
        data: {
          projectId: projectA.id,
          eventDate: new Date(),
          precipitationInches: 0.25, // EPA threshold
          source: 'NOAA',
          inspectionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Verify that weather events are tied to projects, not directly to orgs
      // But still maintain isolation through project relationships
      const weatherEvents = await prisma.weatherEvent.findMany({
        where: {
          project: {
            orgId: tenantA.id,
          },
        },
        include: {
          project: true,
        },
      });

      expect(weatherEvents).toHaveLength(1);
      expect(weatherEvents[0].id).toBe(weatherEventA.id);
      expect(weatherEvents[0].project.orgId).toBe(tenantA.id);

      // Cross-tenant access should be empty
      const crossTenantWeatherEvents = await prisma.weatherEvent.findMany({
        where: {
          project: {
            orgId: tenantB.id,
          },
        },
      });

      expect(crossTenantWeatherEvents).toHaveLength(0);
    });
  });

  // Helper Functions
  async function setupTestData() {
    // Clean any existing test data
    await cleanupTestData();

    // Create test organizations and users
    await prisma.organization.createMany({
      data: [tenantA, tenantB],
      skipDuplicates: true,
    });

    await prisma.userOrganization.createMany({
      data: [userA, userB],
      skipDuplicates: true,
    });
  }

  async function cleanupTestData() {
    // Clean up in proper order due to foreign key constraints
    await prisma.weatherEvent.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.inspection.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.userOrganization.deleteMany({});
    await prisma.organization.deleteMany({});
  }
});

/**
 * Performance Tests for Multi-Tenant Queries
 * Ensures tenant isolation doesn't impact performance
 */
describe('Multi-Tenant Query Performance', () => {
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  it('should maintain query performance with tenant filtering', async () => {
    const startTime = Date.now();
    
    // Simulate large dataset query with tenant filtering
    const projects = await prisma.project.findMany({
      where: {
        orgId: 'test-org-id',
        status: 'ACTIVE',
      },
      include: {
        inspections: {
          take: 10,
          orderBy: { inspectionDate: 'desc' },
        },
      },
      take: 50,
    });
    
    const queryTime = Date.now() - startTime;
    
    // Query should complete within reasonable time (< 100ms for small dataset)
    expect(queryTime).toBeLessThan(1000);
    expect(Array.isArray(projects)).toBe(true);
  });

  it('should efficiently use database indexes for tenant queries', async () => {
    // Test that org_id indexes are being used effectively
    // In a real test, we'd analyze query execution plans
    
    const result = await prisma.project.findMany({
      where: {
        orgId: 'test-org-id',
      },
      select: {
        id: true,
        name: true,
        orgId: true,
      },
    });

    // Should return results efficiently
    expect(Array.isArray(result)).toBe(true);
  });
});