import { Resolver, Query, Mutation, Args, Field, ObjectType, InputType } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAccess, ManagementAccess, AllRoles } from '../../common/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../database/prisma.service';

// Analytics and Dashboard Types (defined first to avoid circular references)
@ObjectType('UserRoleStats')
export class UserRoleStatsGQL {
  @Field()
  role: string;

  @Field()
  count: number;
}

@ObjectType('ProjectStatusStats')
export class ProjectStatusStatsGQL {
  @Field()
  status: string;

  @Field()
  count: number;
}

@ObjectType('InspectionStats')
export class InspectionStatsGQL {
  @Field()
  type: string;

  @Field()
  total: number;

  @Field()
  compliant: number;

  @Field()
  overdue: number;
}

@ObjectType('OrganizationStats')
export class OrganizationStatsGQL {
  @Field()
  totalProjects: number;

  @Field()
  activeProjects: number;

  @Field()
  totalInspections: number;

  @Field()
  pendingInspections: number;

  @Field()
  complianceRate: number;

  @Field()
  totalUsers: number;

  @Field(() => [UserRoleStatsGQL])
  usersByRole: UserRoleStatsGQL[];

  @Field(() => [ProjectStatusStatsGQL])
  projectsByStatus: ProjectStatusStatsGQL[];

  @Field(() => [InspectionStatsGQL])
  inspectionStats: InspectionStatsGQL[];
}

@ObjectType('ProjectStats')
export class ProjectStatsGQL {
  @Field()
  totalInspections: number;

  @Field()
  compliantInspections: number;

  @Field()
  overdue: number;

  @Field({ nullable: true })
  lastInspection?: Date;

  @Field({ nullable: true })
  nextDeadline?: Date;
}

// GraphQL Types for Organization Management
@ObjectType('Organization')
export class OrganizationGQL {
  @Field()
  id: string;

  @Field()
  clerkOrgId: string;

  @Field()
  name: string;

  @Field()
  plan: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ProjectGQL])
  projects: ProjectGQL[];

  @Field(() => [UserOrganizationGQL])
  users: UserOrganizationGQL[];

  @Field(() => OrganizationStatsGQL, { nullable: true })
  stats?: OrganizationStatsGQL;
}

@ObjectType('Project')
export class ProjectGQL {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  address: string;

  @Field()
  latitude: number;

  @Field()
  longitude: number;

  @Field({ nullable: true })
  permitNumber?: string;

  @Field()
  startDate: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field()
  disturbedAcres: number;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [InspectionGQL])
  inspections: InspectionGQL[];

  @Field(() => ProjectStatsGQL, { nullable: true })
  stats?: ProjectStatsGQL;
}

@ObjectType('Inspection')
export class InspectionGQL {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  inspectorId: string;

  @Field()
  type: string;

  @Field()
  status: string;

  @Field()
  weatherTriggered: boolean;

  @Field({ nullable: true })
  precipitationInches?: number;

  @Field()
  inspectionDate: Date;

  @Field({ nullable: true })
  submittedAt?: Date;

  @Field()
  offlineCreated: boolean;

  @Field(() => [PhotoGQL])
  photos: PhotoGQL[];
}

@ObjectType('Photo')
export class PhotoGQL {
  @Field()
  id: string;

  @Field()
  inspectionId: string;

  @Field()
  s3Key: string;

  @Field({ nullable: true })
  thumbnailKey?: string;

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field()
  takenAt: Date;

  @Field({ nullable: true })
  caption?: string;

  @Field()
  fileSize: number;

  @Field()
  mimeType: string;
}

@ObjectType('UserOrganization')
export class UserOrganizationGQL {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  role: string;

  @Field()
  joinedAt: Date;
}

// Input Types
@InputType()
export class UpdateOrganizationInput {
  @Field({ nullable: true })
  name?: string;
}

@InputType()
export class ProjectFilterInput {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  limit?: number;

  @Field({ nullable: true })
  offset?: number;
}

@Resolver(() => OrganizationGQL)
export class OrganizationsResolver {
  private readonly logger = new Logger(OrganizationsResolver.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly prisma: PrismaService
  ) {}

  @Query(() => OrganizationGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @AllRoles()
  async currentOrganization(@CurrentUser() user: any): Promise<OrganizationGQL> {
    const org = await this.prisma.organization.findUnique({
      where: {
        clerkOrgId: user.orgId,
      },
      include: {
        projects: {
          include: {
            inspections: {
              orderBy: { inspectionDate: 'desc' },
              take: 5,
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        users: true,
      },
    });

    if (!org) {
      this.logger.error(`Organization not found for Clerk org ID: ${user.orgId}`);
      throw new Error('Organization not found');
    }

    // Calculate real-time stats
    const stats = await this.calculateOrganizationStats(org.id);

    // Add stats to projects
    const projectsWithStats = org.projects.map((project: any) => ({
      ...project,
      inspections: project.inspections,
      stats: this.calculateProjectStats(project),
    }));

    return {
      ...org,
      projects: projectsWithStats,
      stats,
    };
  }

  // NOTE: The projects query is now handled by ProjectsResolver in projects.resolver.ts
  // It returns ProjectWithComplianceGQL type with recentInspections and compliance fields
  // which is what the frontend expects. This resolver still provides organization-level
  // project access via currentOrganization.projects

  @Query(() => OrganizationStatsGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess() // Management and above can see org-wide stats
  async organizationDashboard(@CurrentUser() user: any): Promise<OrganizationStatsGQL> {
    const org = await this.getOrganizationByClerkId(user.orgId);
    return this.calculateOrganizationStats(org.id);
  }

  @Mutation(() => OrganizationGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @AdminAccess() // Admin and Owner can update org settings
  async updateOrganization(
    @CurrentUser() user: any,
    @Args('input') input: UpdateOrganizationInput
  ): Promise<OrganizationGQL> {
    const org = await this.getOrganizationByClerkId(user.orgId);

    const updatedOrg = await this.prisma.organization.update({
      where: { id: org.id },
      data: input,
      include: {
        projects: {
          include: {
            inspections: {
              orderBy: { inspectionDate: 'desc' },
              take: 5,
            },
          },
        },
        users: true,
      },
    });

    const stats = await this.calculateOrganizationStats(updatedOrg.id);

    // Add stats to projects
    const projectsWithStats = updatedOrg.projects.map((project: any) => ({
      ...project,
      inspections: project.inspections,
      stats: this.calculateProjectStats(project),
    }));

    this.logger.log(`Organization ${org.name} updated by user ${user.userId}`, {
      orgId: org.id,
      changes: input,
    });

    return {
      ...updatedOrg,
      projects: projectsWithStats,
      stats,
    };
  }

  // Helper Methods
  private async getOrganizationByClerkId(clerkOrgId: string): Promise<any> {
    const org = await this.prisma.organization.findUnique({
      where: { clerkOrgId },
    });

    if (!org) {
      throw new Error(`Organization not found for Clerk ID: ${clerkOrgId}`);
    }

    return org;
  }

  private async calculateOrganizationStats(orgId: string): Promise<OrganizationStatsGQL> {
    // Use raw queries for performance on large datasets
    const [projectStats, inspectionStats, userStats] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        where: { orgId },
        _count: true,
      }),
      this.prisma.inspection.groupBy({
        by: ['type', 'status'],
        where: { orgId },
        _count: true,
      }),
      this.prisma.userOrganization.groupBy({
        by: ['role'],
        where: { orgId },
        _count: true,
      }),
    ]);

    // Calculate totals
    const totalProjects = projectStats.reduce((sum, stat) => sum + stat._count, 0);
    const activeProjects = projectStats
      .filter((stat) => ['ACTIVE', 'PLANNING'].includes(stat.status))
      .reduce((sum, stat) => sum + stat._count, 0);

    const totalInspections = inspectionStats.reduce((sum, stat) => sum + stat._count, 0);
    const pendingInspections = inspectionStats
      .filter((stat) => stat.status === 'PENDING')
      .reduce((sum, stat) => sum + stat._count, 0);

    const compliantInspections = inspectionStats
      .filter((stat) => stat.status === 'APPROVED')
      .reduce((sum, stat) => sum + stat._count, 0);

    const complianceRate =
      totalInspections > 0 ? (compliantInspections / totalInspections) * 100 : 0;

    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count, 0);

    return {
      totalProjects,
      activeProjects,
      totalInspections,
      pendingInspections,
      complianceRate,
      totalUsers,
      usersByRole: userStats.map((stat) => ({
        role: stat.role,
        count: stat._count,
      })),
      projectsByStatus: projectStats.map((stat) => ({
        status: stat.status,
        count: stat._count,
      })),
      inspectionStats: this.aggregateInspectionStats(inspectionStats),
    };
  }

  private calculateProjectStats(project: any): ProjectStatsGQL {
    const totalInspections = project.inspections.length;
    const compliantInspections = project.inspections.filter(
      (i: any) => i.status === 'APPROVED'
    ).length;

    const overdue = project.inspections.filter((i: any) => {
      const deadline = new Date(i.inspectionDate);
      deadline.setHours(deadline.getHours() + 24); // 24-hour EPA deadline
      return deadline < new Date() && i.status === 'PENDING';
    }).length;

    const lastInspection = project.inspections[0]?.inspectionDate;

    // Calculate next deadline based on weather events or routine schedule
    // TODO: Implement weather-based deadline calculation
    const nextDeadline = null;

    return {
      totalInspections,
      compliantInspections,
      overdue,
      lastInspection,
      nextDeadline,
    };
  }

  private aggregateInspectionStats(inspectionStats: any[]): InspectionStatsGQL[] {
    const typeGroups = inspectionStats.reduce(
      (acc, stat) => {
        if (!acc[stat.type]) {
          acc[stat.type] = { type: stat.type, total: 0, compliant: 0, overdue: 0 };
        }

        acc[stat.type].total += stat._count;

        if (stat.status === 'APPROVED') {
          acc[stat.type].compliant += stat._count;
        } else if (stat.status === 'PENDING') {
          // TODO: Calculate actual overdue based on inspection dates
          acc[stat.type].overdue += stat._count;
        }

        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(typeGroups);
  }
}
