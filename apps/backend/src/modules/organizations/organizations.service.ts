import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Organization, UserRole, Project } from '@prisma/client';

export interface OrganizationWithStats extends Organization {
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalInspections: number;
    complianceRate: number;
    totalUsers: number;
  };
}

export interface UserProjectAccess {
  projectId: string;
  accessLevel: 'READ' | 'WRITE' | 'ADMIN';
}

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get organization by Clerk organization ID with complete tenant isolation
   */
  async getOrganizationByClerkId(clerkOrgId: string): Promise<Organization> {
    const org = await this.prisma.organization.findUnique({
      where: { clerkOrgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found for Clerk ID: ${clerkOrgId}`);
    }

    return org;
  }

  /**
   * Get user's role in organization for permission checking
   */
  async getUserRole(userId: string, orgId: string): Promise<UserRole | null> {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    return userOrg?.role || null;
  }

  /**
   * Get projects user has access to based on their role
   * OWNER/ADMIN: All org projects
   * MANAGER: Projects they manage
   * MEMBER: Projects they're assigned to
   * INSPECTOR: Projects via QR access only
   */
  async getUserProjects(
    userId: string,
    orgId: string,
    userRole: UserRole,
  ): Promise<Project[]> {
    const whereClause: any = { orgId };

    switch (userRole) {
      case 'OWNER':
      case 'ADMIN':
        // Full access to all organization projects
        break;

      case 'MANAGER':
        // TODO: Implement project manager assignments
        // For now, managers see all projects
        break;

      case 'MEMBER':
        // TODO: Implement project team assignments
        // For now, members see all projects they're assigned to
        break;

      case 'INSPECTOR':
        // Inspectors only see projects via QR code access
        // This should be handled differently (temporary access tokens)
        return [];

      default:
        this.logger.warn(`Unknown user role: ${userRole}`);
        return [];
    }

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Check if user has permission to access specific project
   */
  async canAccessProject(
    userId: string,
    projectId: string,
    requiredAccess: 'READ' | 'WRITE' | 'ADMIN',
  ): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            users: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!project) {
      return false;
    }

    const userOrg = project.organization.users[0];
    if (!userOrg) {
      return false;
    }

    // Check role-based access
    switch (userOrg.role) {
      case 'OWNER':
      case 'ADMIN':
        return true; // Full access

      case 'MANAGER':
        // TODO: Check if user is assigned as project manager
        return requiredAccess !== 'ADMIN';

      case 'MEMBER':
        // TODO: Check if user is assigned to project team
        return requiredAccess === 'READ';

      case 'INSPECTOR':
        // Inspectors need QR code access (handled separately)
        return false;

      default:
        return false;
    }
  }

  /**
   * Get organization analytics for dashboard
   */
  async getOrganizationAnalytics(orgId: string): Promise<any> {
    const [
      totalProjects,
      activeProjects,
      totalInspections,
      pendingInspections,
      approvedInspections,
      totalUsers,
      recentInspections,
      overdueInspections,
    ] = await Promise.all([
      // Total projects count
      this.prisma.project.count({
        where: { orgId },
      }),

      // Active projects count
      this.prisma.project.count({
        where: {
          orgId,
          status: { in: ['ACTIVE', 'PLANNING'] },
        },
      }),

      // Total inspections count
      this.prisma.inspection.count({
        where: { orgId },
      }),

      // Pending inspections
      this.prisma.inspection.count({
        where: {
          orgId,
          status: 'PENDING',
        },
      }),

      // Approved inspections for compliance rate
      this.prisma.inspection.count({
        where: {
          orgId,
          status: 'APPROVED',
        },
      }),

      // Total users in organization
      this.prisma.userOrganization.count({
        where: { orgId },
      }),

      // Recent inspections (last 30 days)
      this.prisma.inspection.findMany({
        where: {
          orgId,
          inspectionDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          project: {
            select: { name: true },
          },
        },
        orderBy: { inspectionDate: 'desc' },
        take: 10,
      }),

      // Overdue inspections (EPA 24-hour rule)
      this.prisma.inspection.findMany({
        where: {
          orgId,
          status: 'PENDING',
          inspectionDate: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          project: {
            select: { name: true },
          },
        },
      }),
    ]);

    const complianceRate = totalInspections > 0 
      ? (approvedInspections / totalInspections) * 100 
      : 100;

    return {
      summary: {
        totalProjects,
        activeProjects,
        totalInspections,
        pendingInspections,
        complianceRate: Math.round(complianceRate * 100) / 100,
        totalUsers,
        overdueCount: overdueInspections.length,
      },
      recentActivity: recentInspections,
      overdueInspections,
      trends: await this.getComplianceTrends(orgId),
    };
  }

  /**
   * Get compliance trends for the organization
   */
  private async getComplianceTrends(orgId: string): Promise<any> {
    // Get inspection data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', inspection_date) as month,
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_inspections,
        COUNT(CASE WHEN weather_triggered = true THEN 1 END) as weather_triggered
      FROM inspections 
      WHERE org_id = ${orgId} 
        AND inspection_date >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', inspection_date)
      ORDER BY month ASC
    `;

    return monthlyData;
  }

  /**
   * Create new organization (called during Clerk webhook)
   */
  async createOrganization(clerkOrgData: {
    id: string;
    name: string;
    metadata?: any;
  }): Promise<Organization> {
    const org = await this.prisma.organization.create({
      data: {
        clerkOrgId: clerkOrgData.id,
        name: clerkOrgData.name,
        plan: 'STARTER', // Default plan
      },
    });

    this.logger.log(`New organization created: ${org.name}`, {
      orgId: org.id,
      clerkOrgId: org.clerkOrgId,
    });

    return org;
  }

  /**
   * Update organization settings
   */
  async updateOrganization(
    clerkOrgId: string,
    updateData: { name?: string },
  ): Promise<Organization> {
    const org = await this.prisma.organization.update({
      where: { clerkOrgId },
      data: updateData,
    });

    this.logger.log(`Organization updated: ${org.name}`, {
      orgId: org.id,
      changes: updateData,
    });

    return org;
  }

  /**
   * Add user to organization (called during Clerk webhook)
   */
  async addUserToOrganization(
    clerkOrgId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const org = await this.getOrganizationByClerkId(clerkOrgId);

    await this.prisma.userOrganization.upsert({
      where: {
        userId_orgId: {
          userId,
          orgId: org.id,
        },
      },
      create: {
        userId,
        orgId: org.id,
        role,
      },
      update: {
        role,
      },
    });

    this.logger.log(`User ${userId} added to organization ${org.name} with role ${role}`);
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(
    clerkOrgId: string,
    userId: string,
  ): Promise<void> {
    const org = await this.getOrganizationByClerkId(clerkOrgId);

    await this.prisma.userOrganization.delete({
      where: {
        userId_orgId: {
          userId,
          orgId: org.id,
        },
      },
    });

    this.logger.log(`User ${userId} removed from organization ${org.name}`);
  }

  /**
   * Get organization users with their roles
   */
  async getOrganizationUsers(clerkOrgId: string): Promise<any[]> {
    const org = await this.getOrganizationByClerkId(clerkOrgId);

    return this.prisma.userOrganization.findMany({
      where: { orgId: org.id },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }
}