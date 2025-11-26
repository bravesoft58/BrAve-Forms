import {
  Resolver,
  Query,
  Mutation,
  Args,
  Field,
  ObjectType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ManagementAccess } from '../../common/decorators/roles.decorator';
import { QRTokenService } from './qr-token.service';
import { PrismaService } from '../database/prisma.service';
import { TokenPermission } from '@prisma/client';

// Register TokenPermission enum with GraphQL
registerEnumType(TokenPermission, {
  name: 'TokenPermission',
  description: 'Permissions that can be granted via QR token (READ-ONLY only)',
});

/**
 * GraphQL type for QR Token
 * Represents a time-limited inspector portal access token
 */
@ObjectType('QRToken')
export class QRTokenGQL {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  token: string;

  @Field(() => [TokenPermission])
  permissions: TokenPermission[];

  @Field()
  expiresAt: Date;

  @Field({ nullable: true })
  revokedAt?: Date;

  @Field()
  generatedBy: string;

  @Field()
  createdAt: Date;

  @Field()
  accessCount: number;

  @Field({ nullable: true })
  lastAccessAt?: Date;

  @Field()
  isActive: boolean;

  @Field()
  isExpired: boolean;
}

/**
 * GraphQL type for verified token payload
 * Returned when inspector portal verifies a token
 */
@ObjectType('VerifiedTokenPayload')
export class VerifiedTokenPayloadGQL {
  @Field()
  projectId: string;

  @Field(() => [TokenPermission])
  permissions: TokenPermission[];

  @Field()
  tokenId: string;
}

/**
 * GraphQL type for project info (for inspector portal)
 * Limited information exposed to inspectors
 */
@ObjectType('InspectorProjectInfo')
export class InspectorProjectInfoGQL {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  address: string;

  @Field()
  status: string;

  @Field()
  startDate: Date;

  @Field({ nullable: true })
  permitNumber?: string;

  @Field()
  disturbedAcres: number;
}

/**
 * Input type for generating a new QR token
 */
@InputType()
export class GenerateQRTokenInput {
  @Field()
  projectId: string;

  @Field(() => [TokenPermission])
  permissions: TokenPermission[];

  @Field({ nullable: true, defaultValue: 24 })
  expiryHours?: number;
}

/**
 * Result type for revoke all tokens operation
 */
@ObjectType('RevokeAllResult')
export class RevokeAllResultGQL {
  @Field()
  revokedCount: number;

  @Field()
  success: boolean;
}

/**
 * QR Portal Resolver - Sprint 4 ISSUE-100
 *
 * Provides GraphQL API for QR token management:
 * - Generate tokens for inspector portal access (authenticated)
 * - Verify tokens (public - used by inspector portal)
 * - Revoke tokens (authenticated)
 * - List project tokens (authenticated)
 *
 * Security:
 * - Token generation requires ManagementAccess (managers+)
 * - Token verification is PUBLIC (inspector portal)
 * - Token revocation requires ManagementAccess
 * - All operations enforce multi-tenancy via orgId
 */
@Resolver(() => QRTokenGQL)
export class QRPortalResolver {
  private readonly logger = new Logger(QRPortalResolver.name);

  constructor(
    private readonly qrTokenService: QRTokenService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate a new QR token for inspector portal access
   * Requires authentication and ManagementAccess role
   */
  @Mutation(() => QRTokenGQL, {
    description: 'Generate a new QR token for inspector portal access (24-hour default expiry)',
  })
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess()
  async generateQRToken(
    @CurrentUser() user: { userId: string; orgId: string },
    @Args('input') input: GenerateQRTokenInput,
  ): Promise<QRTokenGQL> {
    this.logger.log(`Generating QR token for project ${input.projectId}`, {
      userId: user.userId,
      orgId: user.orgId,
      permissions: input.permissions,
    });

    // Get organization ID from Clerk org ID
    const org = await this.getOrganizationByClerkId(user.orgId);

    const qrToken = await this.qrTokenService.generateToken({
      projectId: input.projectId,
      permissions: input.permissions,
      generatedBy: user.userId,
      orgId: org.id,
      expiryHours: input.expiryHours,
    });

    return this.mapToGraphQL(qrToken);
  }

  /**
   * Verify a QR token and return its payload
   * PUBLIC endpoint - used by inspector portal (no auth required)
   *
   * Audit Trail: Logs token verification attempts for security monitoring
   */
  @Query(() => VerifiedTokenPayloadGQL, {
    description: 'Verify a QR token and return project access permissions (public endpoint)',
  })
  async verifyQRToken(@Args('token') token: string): Promise<VerifiedTokenPayloadGQL> {
    const startTime = Date.now();
    this.logger.debug(`QR token verification attempt`, {
      tokenPrefix: token.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    });

    try {
      const verified = await this.qrTokenService.verifyToken(token);

      this.logger.log(`QR token verified successfully`, {
        tokenId: verified.tokenId,
        projectId: verified.projectId,
        permissions: verified.permissions,
        durationMs: Date.now() - startTime,
      });

      return {
        projectId: verified.projectId,
        permissions: verified.permissions,
        tokenId: verified.tokenId,
      };
    } catch (error) {
      this.logger.warn(`QR token verification failed`, {
        tokenPrefix: token.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Get project info for inspector portal
   * Requires valid token (not authenticated user)
   *
   * Audit Trail: Logs project info access for compliance tracking
   */
  @Query(() => InspectorProjectInfoGQL, {
    description: 'Get project information for inspector portal (requires valid token)',
  })
  async getInspectorProjectInfo(
    @Args('token') token: string,
  ): Promise<InspectorProjectInfoGQL> {
    const startTime = Date.now();

    // Verify token first
    const verified = await this.qrTokenService.verifyToken(token);

    // Check if token has VIEW_PROJECT_INFO permission
    if (!verified.permissions.includes(TokenPermission.VIEW_PROJECT_INFO)) {
      this.logger.warn(`Project info access denied - missing permission`, {
        tokenId: verified.tokenId,
        projectId: verified.projectId,
        requiredPermission: 'VIEW_PROJECT_INFO',
        grantedPermissions: verified.permissions,
      });
      throw new Error('Token does not have VIEW_PROJECT_INFO permission');
    }

    // Get project info
    const project = await this.prisma.project.findUnique({
      where: { id: verified.projectId },
    });

    if (!project) {
      this.logger.error(`Project not found for inspector portal`, {
        projectId: verified.projectId,
        tokenId: verified.tokenId,
      });
      throw new Error('Project not found');
    }

    this.logger.log(`Inspector accessed project info`, {
      tokenId: verified.tokenId,
      projectId: project.id,
      projectName: project.name,
      durationMs: Date.now() - startTime,
    });

    return {
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
      startDate: project.startDate,
      permitNumber: project.permitNumber ?? undefined,
      disturbedAcres: project.disturbedAcres,
    };
  }

  /**
   * Revoke a specific QR token
   * Requires authentication and ManagementAccess role
   */
  @Mutation(() => QRTokenGQL, {
    description: 'Revoke a QR token (invalidates inspector access)',
  })
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess()
  async revokeQRToken(
    @CurrentUser() user: { userId: string; orgId: string },
    @Args('tokenId') tokenId: string,
  ): Promise<QRTokenGQL> {
    this.logger.log(`Revoking QR token ${tokenId}`, {
      userId: user.userId,
      orgId: user.orgId,
    });

    const org = await this.getOrganizationByClerkId(user.orgId);
    const revokedToken = await this.qrTokenService.revokeToken(tokenId, org.id);

    return this.mapToGraphQL(revokedToken);
  }

  /**
   * Revoke all active tokens for a project
   * Useful when regenerating QR codes
   */
  @Mutation(() => RevokeAllResultGQL, {
    description: 'Revoke all active QR tokens for a project',
  })
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess()
  async revokeAllProjectTokens(
    @CurrentUser() user: { userId: string; orgId: string },
    @Args('projectId') projectId: string,
  ): Promise<RevokeAllResultGQL> {
    this.logger.log(`Revoking all tokens for project ${projectId}`, {
      userId: user.userId,
      orgId: user.orgId,
    });

    const org = await this.getOrganizationByClerkId(user.orgId);
    const result = await this.qrTokenService.revokeAllProjectTokens(projectId, org.id);

    return {
      revokedCount: result.revokedCount,
      success: true,
    };
  }

  /**
   * Get all QR tokens for a project (for management UI)
   * Includes both active and revoked tokens
   */
  @Query(() => [QRTokenGQL], {
    description: 'Get all QR tokens for a project (active and revoked)',
  })
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @ManagementAccess()
  async getProjectQRTokens(
    @CurrentUser() user: { userId: string; orgId: string },
    @Args('projectId') projectId: string,
  ): Promise<QRTokenGQL[]> {
    const org = await this.getOrganizationByClerkId(user.orgId);
    const tokens = await this.qrTokenService.getProjectTokens(projectId, org.id);

    return tokens.map((token) => this.mapToGraphQL(token));
  }

  /**
   * Helper: Get organization by Clerk org ID
   */
  private async getOrganizationByClerkId(clerkOrgId: string): Promise<{ id: string }> {
    const org = await this.prisma.organization.findUnique({
      where: { clerkOrgId },
    });

    if (!org) {
      this.logger.error(`Organization not found for Clerk ID: ${clerkOrgId}`);
      throw new Error(`Organization not found`);
    }

    return org;
  }

  /**
   * Helper: Map Prisma QRToken to GraphQL type
   */
  private mapToGraphQL(token: {
    id: string;
    projectId: string;
    token: string;
    permissions: TokenPermission[];
    expiresAt: Date;
    revokedAt: Date | null;
    generatedBy: string;
    createdAt: Date;
    accessCount: number;
    lastAccessAt: Date | null;
  }): QRTokenGQL {
    const now = new Date();
    const isExpired = token.expiresAt < now;
    const isRevoked = token.revokedAt !== null;

    return {
      id: token.id,
      projectId: token.projectId,
      token: token.token,
      permissions: token.permissions,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt ?? undefined,
      generatedBy: token.generatedBy,
      createdAt: token.createdAt,
      accessCount: token.accessCount,
      lastAccessAt: token.lastAccessAt ?? undefined,
      isActive: !isExpired && !isRevoked,
      isExpired,
    };
  }
}
