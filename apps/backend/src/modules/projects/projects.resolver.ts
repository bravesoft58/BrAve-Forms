import { Resolver, Query, Mutation, Args, Field, ObjectType, InputType } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { IsString, IsNumber, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ManagementAccess, TeamAccess, AdminAccess } from '../../common/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../database/prisma.service';

// GraphQL Types for Project Management (unique names to avoid conflicts with organizations.resolver)
@ObjectType('InspectionSummary')
export class InspectionSummaryGQL {
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

@ObjectType('ProjectWithCompliance')
export class ProjectWithComplianceGQL {
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

  @Field(() => [InspectionSummaryGQL])
  recentInspections: InspectionSummaryGQL[];

  @Field(() => ProjectComplianceGQL)
  compliance: ProjectComplianceGQL;
}

// Input Types
@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  address: string;

  @Field()
  @IsNumber()
  latitude: number;

  @Field()
  @IsNumber()
  longitude: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  permitNumber?: string;

  @Field()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @Field()
  @IsNumber()
  @Min(0)
  disturbedAcres: number;
}

@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  permitNumber?: string;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  disturbedAcres?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  status?: string;
}

@Resolver(() => ProjectWithComplianceGQL)
export class ProjectsResolver {
  private readonly logger = new Logger(ProjectsResolver.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService
  ) {}

  @Query(() => [ProjectWithComplianceGQL])
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @TeamAccess()
  async projects(@CurrentUser() user: any): Promise<ProjectWithComplianceGQL[]> {
    const org = await this.getOrganizationByClerkId(user.orgId);

    // Get projects with role-based filtering
    const projects = await this.projectsService.getUserProjects(user.userId, org.id, user.orgRole);

    return projects.map((project) => ({
      ...project,
      recentInspections: project.inspections.slice(0, 5).map(this.mapInspection),
      compliance: this.calculateProjectCompliance(project),
    }));
  }

  @Query(() => ProjectWithComplianceGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @TeamAccess()
  async project(
    @CurrentUser() user: any,
    @Args('id') id: string
  ): Promise<ProjectWithComplianceGQL> {
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

  @Mutation(() => ProjectWithComplianceGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess() // Managers and above can create projects
  async createProject(
    @CurrentUser() user: any,
    @Args('input') input: CreateProjectInput
  ): Promise<ProjectWithComplianceGQL> {
    this.logger.log('createProject mutation called', {
      userId: user.userId,
      orgId: user.orgId,
      orgRole: user.orgRole,
      input: JSON.stringify(input),
    });

    try {
      const org = await this.getOrganizationByClerkId(user.orgId);
      this.logger.log(`Organization found: ${org.id} (${org.name})`);

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
    } catch (error) {
      this.logger.error('createProject mutation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.userId,
        orgId: user.orgId,
        input: JSON.stringify(input),
      });
      throw error;
    }
  }

  @Mutation(() => ProjectWithComplianceGQL)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess() // Managers and above can update projects
  async updateProject(
    @CurrentUser() user: any,
    @Args('id') id: string,
    @Args('input') input: UpdateProjectInput
  ): Promise<ProjectWithComplianceGQL> {
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
      data: input as any,
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
      recentInspections: (project.inspections || []).map(this.mapInspection),
      compliance: this.calculateProjectCompliance(project),
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @AdminAccess() // Only Admins and Owners can delete projects
  async deleteProject(@CurrentUser() user: any, @Args('id') id: string): Promise<boolean> {
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

  private mapInspection(inspection: any): InspectionSummaryGQL {
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

    const pendingInspections = inspections.filter((i: any) => i.status === 'PENDING').length;

    const overdueInspections = inspections.filter((i: any) => {
      const deadline = new Date(i.inspectionDate);
      deadline.setHours(deadline.getHours() + 24);
      return deadline < new Date() && i.status === 'PENDING';
    }).length;

    const approvedInspections = inspections.filter((i: any) => i.status === 'APPROVED').length;

    const totalInspections = inspections.length;
    const overallScore =
      totalInspections > 0 ? (approvedInspections / totalInspections) * 100 : 100;

    const lastInspection = inspections.length > 0 ? inspections[0]?.inspectionDate : null;

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
