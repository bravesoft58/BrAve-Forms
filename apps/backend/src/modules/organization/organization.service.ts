import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Organization, UserRole, PlanType } from '@prisma/client';

/**
 * Organization Service for Construction Company Management
 * 
 * Handles:
 * - Organization creation and management
 * - User-organization relationships
 * - Clerk organization synchronization
 * - Multi-tenant data isolation
 */
@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sync organization from Clerk webhook or login event
   */
  async syncOrganization(clerkOrgId: string, orgData: any): Promise<Organization> {
    this.logger.debug(`Syncing organization: ${clerkOrgId}`, orgData);

    try {
      // Check if organization already exists
      const existingOrg = await this.prisma.organization.findUnique({
        where: { clerkOrgId },
      });

      if (existingOrg) {
        // Update existing organization
        return await this.prisma.organization.update({
          where: { clerkOrgId },
          data: {
            name: orgData.name || existingOrg.name,
            updatedAt: new Date(),
          },
        });
      }

      // Create new organization
      const newOrg = await this.prisma.organization.create({
        data: {
          clerkOrgId,
          name: orgData.name || 'Construction Company',
          plan: PlanType.STARTER, // Default plan for new organizations
        },
      });

      this.logger.log(`Created new organization: ${newOrg.id} (${clerkOrgId})`);
      return newOrg;
    } catch (error) {
      this.logger.error(`Failed to sync organization ${clerkOrgId}:`, error);
      throw error;
    }
  }

  /**
   * Get organization by Clerk organization ID
   */
  async getOrganizationByClerkId(clerkOrgId: string): Promise<Organization | null> {
    return await this.prisma.organization.findUnique({
      where: { clerkOrgId },
      include: {
        users: true,
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            users: true,
            projects: true,
            inspections: true,
          },
        },
      },
    });
  }

  /**
   * Get organization with full details
   */
  async getOrganizationById(orgId: string): Promise<Organization | null> {
    return await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: true,
        projects: {
          include: {
            inspections: {
              orderBy: { inspectionDate: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                inspections: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            projects: true,
            inspections: true,
            photos: true,
          },
        },
      },
    });
  }

  /**
   * Sync user organization membership
   */
  async syncUserOrganization(
    userId: string,
    orgId: string,
    role: string
  ): Promise<void> {
    this.logger.debug(`Syncing user organization: user=${userId}, org=${orgId}, role=${role}`);

    // Map Clerk roles to our system roles
    const userRole = this.mapClerkRoleToUserRole(role);

    try {
      // Get the internal organization ID
      const organization = await this.prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
      });

      if (!organization) {
        throw new NotFoundException(`Organization not found: ${orgId}`);
      }

      // Upsert user-organization relationship
      await this.prisma.userOrganization.upsert({
        where: {
          userId_orgId: {
            userId,
            orgId: organization.id,
          },
        },
        update: {
          role: userRole,
        },
        create: {
          userId,
          orgId: organization.id,
          role: userRole,
        },
      });

      this.logger.log(`Synced user organization membership: user=${userId}, org=${organization.id}, role=${userRole}`);
    } catch (error) {
      this.logger.error(`Failed to sync user organization: user=${userId}, org=${orgId}`, error);
      throw error;
    }
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(userId: string, orgId: string): Promise<void> {
    this.logger.debug(`Removing user from organization: user=${userId}, org=${orgId}`);

    try {
      const organization = await this.prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
      });

      if (!organization) {
        throw new NotFoundException(`Organization not found: ${orgId}`);
      }

      await this.prisma.userOrganization.delete({
        where: {
          userId_orgId: {
            userId,
            orgId: organization.id,
          },
        },
      });

      this.logger.log(`Removed user from organization: user=${userId}, org=${organization.id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        // Record not found - already removed
        this.logger.debug(`User organization relationship already removed: user=${userId}, org=${orgId}`);
        return;
      }
      
      this.logger.error(`Failed to remove user from organization: user=${userId}, org=${orgId}`, error);
      throw error;
    }
  }

  /**
   * Get organization statistics for dashboard
   */
  async getOrganizationStats(orgId: string): Promise<any> {
    const [projects, activeInspections, overdueInspections, recentActivity] = await Promise.all([
      this.prisma.project.count({
        where: { orgId },
      }),
      
      this.prisma.inspection.count({
        where: {
          orgId,
          status: 'IN_PROGRESS',
        },
      }),
      
      this.prisma.inspection.count({
        where: {
          orgId,
          status: 'PENDING',
          inspectionDate: {
            lt: new Date(),
          },
        },
      }),
      
      this.prisma.inspection.findMany({
        where: { orgId },
        orderBy: { inspectionDate: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          inspectionDate: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      projects,
      activeInspections,
      overdueInspections,
      recentActivity,
      complianceScore: this.calculateComplianceScore(overdueInspections, projects),
    };
  }

  /**
   * Map Clerk organization roles to our UserRole enum
   */
  private mapClerkRoleToUserRole(clerkRole: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      'admin': UserRole.ADMIN,
      'owner': UserRole.OWNER,
      'manager': UserRole.MANAGER,
      'member': UserRole.MEMBER,
      'inspector': UserRole.INSPECTOR,
    };

    return roleMap[clerkRole?.toLowerCase()] || UserRole.MEMBER;
  }

  /**
   * Calculate compliance score based on project metrics
   */
  private calculateComplianceScore(overdueInspections: number, totalProjects: number): number {
    if (totalProjects === 0) return 100;
    
    const complianceRate = Math.max(0, (totalProjects - overdueInspections) / totalProjects);
    return Math.round(complianceRate * 100);
  }

  /**
   * Validate organization access for user
   */
  async validateOrganizationAccess(userId: string, orgId: string): Promise<boolean> {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    return !!userOrg;
  }

  /**
   * Get user's role in organization
   */
  async getUserRole(userId: string, orgId: string): Promise<UserRole | null> {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
      select: {
        role: true,
      },
    });

    return userOrg?.role || null;
  }

  /**
   * Get organization by Clerk ID with counts
   */
  async getOrganizationByClerkIdWithCounts(clerkOrgId: string) {
    return await this.prisma.organization.findUnique({
      where: { clerkOrgId },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            inspections: true,
          },
        },
      },
    });
  }

  /**
   * Get organization projects
   */
  async getOrganizationProjects(orgId: string) {
    return await this.prisma.project.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(orgId: string) {
    return await this.prisma.userOrganization.findMany({
      where: { orgId },
      select: {
        userId: true,
        role: true,
        joinedAt: true,
      },
      orderBy: { joinedAt: 'desc' },
    });
  }
}