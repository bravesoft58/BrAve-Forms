import { Resolver, Query, Mutation, Args, Field, ObjectType, InputType } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ManagementAccess, TeamAccess, AdminAccess } from '../../common/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../database/prisma.service';

// GraphQL Types for Project Management
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
  recentInspections: InspectionGQL[];

  @Field(() => ProjectComplianceGQL)
  compliance: ProjectComplianceGQL;
}

@ObjectType('Inspection')
export class InspectionGQL {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  status: string;

  @Field()
  inspectionDate: Date;

  @Field({ nullable: true })
  submittedAt?: Date;

  @Field()
  weatherTriggered: boolean;

  @Field()
  overdue: boolean;
}

@ObjectType('ProjectCompliance')
export class ProjectComplianceGQL {
  @Field()
  overallScore: number;

  @Field()
  pendingInspections: number;

  @Field()
  overdueInspections: number;

  @Field({ nullable: true })
  lastInspection?: Date;

  @Field({ nullable: true })
  nextDeadline?: Date;

  @Field()
  requiresAttention: boolean;
}

// Input Types
@InputType()
export class CreateProjectInput {
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
}

@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  permitNumber?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  disturbedAcres?: number;

  @Field({ nullable: true })
  status?: string;
}

@Resolver(() => ProjectGQL)
export class ProjectsResolver {
  private readonly logger = new Logger(ProjectsResolver.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [ProjectGQL])
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @TeamAccess()
  async projects(@CurrentUser() user: any): Promise<ProjectGQL[]> {
    const org = await this.getOrganizationByClerkId(user.orgId);

    // Get projects with role-based filtering
    const projects = await this.projectsService.getUserProjects(
      user.userId,
      org.id,
      user.orgRole,
    );

    return projects.map(project => ({
      ...project,
      recentInspections: project.inspections.slice(0, 5).map(this.mapInspection),
      compliance: this.calculateProjectCompliance(project),
    }));
  }

  @Query(() => ProjectGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @TeamAccess()
  async project(
    @CurrentUser() user: any,
    @Args('id') id: string,
  ): Promise<ProjectGQL> {
    // Verify project access through organization
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        organization: {
          clerkOrgId: user.orgId,
        },
      },
      include: {
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return {
      ...project,
      recentInspections: project.inspections.map(this.mapInspection),
      compliance: this.calculateProjectCompliance(project),
    };
  }

  @Mutation(() => ProjectGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess() // Managers and above can create projects
  async createProject(
    @CurrentUser() user: any,
    @Args('input') input: CreateProjectInput,
  ): Promise<ProjectGQL> {
    const org = await this.getOrganizationByClerkId(user.orgId);

    const project = await this.prisma.project.create({
      data: {
        ...input,
        orgId: org.id,
        bmps: [], // Initialize empty BMP array
      },
      include: {
        inspections: true,
      },
    });

    this.logger.log(`Project created: ${project.name}`, {
      projectId: project.id,
      orgId: org.id,
      createdBy: user.userId,
    });

    return {
      ...project,
      recentInspections: [],
      compliance: this.calculateProjectCompliance(project),
    };
  }

  @Mutation(() => ProjectGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess() // Managers and above can update projects
  async updateProject(
    @CurrentUser() user: any,
    @Args('id') id: string,
    @Args('input') input: UpdateProjectInput,
  ): Promise<ProjectGQL> {
    // Verify project belongs to user's organization
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id,
        organization: {
          clerkOrgId: user.orgId,
        },
      },
    });

    if (!existingProject) {
      throw new Error('Project not found or access denied');
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: input,
      include: {
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 10,
        },
      },
    });

    this.logger.log(`Project updated: ${project.name}`, {
      projectId: project.id,
      updatedBy: user.userId,
      changes: input,
    });

    return {
      ...project,
      recentInspections: project.inspections.map(this.mapInspection),
      compliance: this.calculateProjectCompliance(project),
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @AdminAccess() // Only Admins and Owners can delete projects
  async deleteProject(
    @CurrentUser() user: any,
    @Args('id') id: string,
  ): Promise<boolean> {
    // Verify project belongs to user's organization
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        organization: {
          clerkOrgId: user.orgId,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Soft delete by marking as closed
    await this.prisma.project.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    this.logger.log(`Project deleted: ${project.name}`, {
      projectId: project.id,
      deletedBy: user.userId,
    });

    return true;
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

  private mapInspection(inspection: any): InspectionGQL {
    // Calculate if inspection is overdue (EPA 24-hour rule)
    const deadline = new Date(inspection.inspectionDate);
    deadline.setHours(deadline.getHours() + 24);
    const overdue = deadline < new Date() && inspection.status === 'PENDING';

    return {
      id: inspection.id,
      type: inspection.type,
      status: inspection.status,
      inspectionDate: inspection.inspectionDate,
      submittedAt: inspection.submittedAt,
      weatherTriggered: inspection.weatherTriggered,
      overdue,
    };
  }

  private calculateProjectCompliance(project: any): ProjectComplianceGQL {
    const inspections = project.inspections || [];
    
    const pendingInspections = inspections.filter(
      (i: any) => i.status === 'PENDING'
    ).length;

    const overdueInspections = inspections.filter((i: any) => {
      const deadline = new Date(i.inspectionDate);
      deadline.setHours(deadline.getHours() + 24);
      return deadline < new Date() && i.status === 'PENDING';
    }).length;

    const approvedInspections = inspections.filter(
      (i: any) => i.status === 'APPROVED'
    ).length;

    const totalInspections = inspections.length;
    const overallScore = totalInspections > 0 
      ? (approvedInspections / totalInspections) * 100 
      : 100;

    const lastInspection = inspections.length > 0 
      ? inspections[0]?.inspectionDate 
      : null;

    // TODO: Calculate next deadline based on weather events and routine schedule
    const nextDeadline = null;

    const requiresAttention = overdueInspections > 0 || overallScore < 80;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      pendingInspections,
      overdueInspections,
      lastInspection,
      nextDeadline,
      requiresAttention,
    };
  }
}
