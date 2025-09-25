import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../../common/decorators/roles.decorator';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get projects accessible to user based on their role
   * Implements construction industry role-based access:
   * - OWNER/ADMIN: All organization projects
   * - MANAGER: Projects they supervise + assigned projects
   * - MEMBER: Only assigned projects
   * - INSPECTOR: QR code access only (handled elsewhere)
   */
  async getUserProjects(
    userId: string,
    orgId: string,
    userRole: UserRole,
  ): Promise<any[]> {
    const whereClause: any = { orgId };

    switch (userRole) {
      case 'OWNER':
      case 'ADMIN':
        // Full access to all organization projects
        break;

      case 'MANAGER':
        // TODO: Implement project manager assignments
        // For now, managers see all active projects
        whereClause.status = { in: ['ACTIVE', 'PLANNING'] };
        break;

      case 'MEMBER':
        // TODO: Implement project team assignments  
        // For now, members see all active projects they could be assigned to
        whereClause.status = { in: ['ACTIVE', 'PLANNING'] };
        break;

      case 'INSPECTOR':
        // Inspectors should use QR code access, not direct project queries
        this.logger.warn(`Inspector ${userId} attempting direct project access`);
        return [];

      default:
        this.logger.warn(`Unknown user role: ${userRole} for user ${userId}`);
        throw new ForbiddenException(`Invalid user role: ${userRole}`);
    }

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 5,
          include: {
            photos: {
              select: {
                id: true,
                s3Key: true,
                thumbnailKey: true,
              },
              take: 3,
            },
          },
        },
        _count: {
          select: {
            inspections: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    this.logger.debug(`Retrieved ${projects.length} projects for user ${userId} (${userRole})`);

    return projects;
  }

  /**
   * Verify user can access specific project
   * Checks both organization membership and role-based permissions
   */
  async canUserAccessProject(
    userId: string,
    projectId: string,
    requiredAccess: 'READ' | 'WRITE' | 'DELETE' = 'READ',
  ): Promise<boolean> {
    const projectWithUser = await this.prisma.project.findFirst({
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

    if (!projectWithUser) {
      return false;
    }

    const userOrg = projectWithUser.organization.users[0];
    if (!userOrg) {
      return false;
    }

    // Check role-based access permissions
    switch (userOrg.role) {
      case 'OWNER':
      case 'ADMIN':
        return true; // Full access to all operations

      case 'MANAGER':
        // Managers can read/write but not delete
        return requiredAccess !== 'DELETE';

      case 'MEMBER':
        // Members have read-only access
        return requiredAccess === 'READ';

      case 'INSPECTOR':
        // Inspectors need QR token access (handled elsewhere)
        return false;

      default:
        return false;
    }
  }

  /**
   * Get project with compliance calculations
   */
  async getProjectWithCompliance(projectId: string, userId: string): Promise<any> {
    // First check access
    const hasAccess = await this.canUserAccessProject(userId, projectId, 'READ');
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this project');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          include: {
            photos: true,
          },
        },
        weatherEvents: {
          where: {
            precipitationInches: { gte: 0.25 }, // EPA threshold
          },
          orderBy: { eventDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return {
      ...project,
      complianceMetrics: this.calculateComplianceMetrics(project),
    };
  }

  /**
   * Calculate EPA compliance metrics for a project
   */
  private calculateComplianceMetrics(project: any): any {
    const inspections = project.inspections || [];
    const weatherEvents = project.weatherEvents || [];

    // Count inspections by status
    const totalInspections = inspections.length;
    const pendingInspections = inspections.filter(i => i.status === 'PENDING').length;
    const approvedInspections = inspections.filter(i => i.status === 'APPROVED').length;
    const weatherTriggered = inspections.filter(i => i.weatherTriggered).length;

    // Calculate overdue inspections (EPA 24-hour rule)
    const overdueInspections = inspections.filter(inspection => {
      if (inspection.status !== 'PENDING') return false;
      
      const deadline = new Date(inspection.inspectionDate);
      deadline.setHours(deadline.getHours() + 24); // EPA 24-hour deadline
      return deadline < new Date();
    }).length;

    // Compliance rate calculation
    const complianceRate = totalInspections > 0 
      ? (approvedInspections / totalInspections) * 100 
      : 100;

    // Check for weather events requiring inspections
    const missedWeatherInspections = weatherEvents.filter(event => {
      const requiredByDate = new Date(event.inspectionDeadline);
      const hasInspection = inspections.some(inspection => {
        const inspectionDate = new Date(inspection.inspectionDate);
        const eventDate = new Date(event.eventDate);
        return inspectionDate >= eventDate && inspectionDate <= requiredByDate;
      });
      
      return !hasInspection && requiredByDate < new Date();
    }).length;

    // Overall compliance status
    const isCompliant = overdueInspections === 0 && missedWeatherInspections === 0;
    const requiresAttention = overdueInspections > 0 || complianceRate < 80 || missedWeatherInspections > 0;

    return {
      totalInspections,
      pendingInspections,
      approvedInspections,
      overdueInspections,
      weatherTriggered,
      complianceRate: Math.round(complianceRate * 100) / 100,
      missedWeatherInspections,
      isCompliant,
      requiresAttention,
      lastInspection: inspections[0]?.inspectionDate || null,
      nextDeadline: this.calculateNextDeadline(project, weatherEvents),
    };
  }

  /**
   * Calculate next inspection deadline based on weather and routine schedule
   */
  private calculateNextDeadline(project: any, weatherEvents: any[]): Date | null {
    // Check for unaddressed weather events
    const pendingWeatherEvents = weatherEvents.filter(event => {
      return new Date(event.inspectionDeadline) > new Date() && !event.inspectionCompleted;
    });

    if (pendingWeatherEvents.length > 0) {
      // Return the earliest weather-triggered deadline
      return new Date(Math.min(...pendingWeatherEvents.map(e => new Date(e.inspectionDeadline).getTime())));
    }

    // TODO: Calculate routine inspection schedule
    // For now, return null (no immediate deadline)
    return null;
  }

  /**
   * Get organization project statistics
   */
  async getOrganizationProjectStats(orgId: string): Promise<any> {
    const [
      totalProjects,
      activeProjects,
      projectsByStatus,
      recentActivity,
    ] = await Promise.all([
      this.prisma.project.count({ where: { orgId } }),
      this.prisma.project.count({ 
        where: { 
          orgId, 
          status: { in: ['ACTIVE', 'PLANNING'] } 
        } 
      }),
      this.prisma.project.groupBy({
        by: ['status'],
        where: { orgId },
        _count: true,
      }),
      this.prisma.project.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          status: true,
          inspections: {
            select: {
              id: true,
              status: true,
              inspectionDate: true,
            },
            orderBy: { inspectionDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalProjects,
      activeProjects,
      projectsByStatus,
      recentActivity,
    };
  }
}
