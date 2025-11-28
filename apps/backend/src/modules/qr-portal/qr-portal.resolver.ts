import {
  Resolver,
  Query,
  Mutation,
  Args,
  Field,
  ObjectType,
  InputType,
  registerEnumType,
  Float,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ManagementAccess } from '../../common/decorators/roles.decorator';
import { QRTokenService } from './qr-token.service';
import { PrismaService } from '../database/prisma.service';
import { TokenPermission, StorageType } from '@prisma/client';
import GraphQLJSON from 'graphql-type-json';

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

// ============================================================================
// INSPECTOR PORTAL TYPES - Sprint 5 ISSUE-165
// ============================================================================

/**
 * Form field in a submission (for inspector portal)
 */
@ObjectType('InspectorFormField')
export class InspectorFormFieldGQL {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  label: string;

  @Field()
  type: string;

  @Field(() => GraphQLJSON, { nullable: true })
  value: unknown;
}

/**
 * Form section containing fields (for inspector portal)
 */
@ObjectType('InspectorFormSection')
export class InspectorFormSectionGQL {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field(() => [InspectorFormFieldGQL])
  fields: InspectorFormFieldGQL[];
}

/**
 * Form submission for inspector portal (read-only view)
 */
@ObjectType('InspectorSubmission')
export class InspectorSubmissionGQL {
  @Field()
  id: string;

  @Field()
  templateName: string;

  @Field()
  templateCategory: string;

  @Field()
  status: string;

  @Field()
  submittedBy: string;

  @Field()
  submittedAt: string;

  @Field(() => [InspectorFormSectionGQL])
  sections: InspectorFormSectionGQL[];
}

/**
 * GPS location for photos (for inspector portal)
 */
@ObjectType('InspectorGeoLocation')
export class InspectorGeoLocationGQL {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float, { nullable: true })
  altitude?: number;
}

/**
 * Photo for inspector portal (read-only view)
 */
@ObjectType('InspectorPhoto')
export class InspectorPhotoGQL {
  @Field()
  id: string;

  @Field()
  url: string;

  @Field()
  thumbnailUrl: string;

  @Field({ nullable: true })
  caption?: string;

  @Field()
  takenAt: string;

  @Field()
  uploadedBy: string;

  @Field(() => InspectorGeoLocationGQL, { nullable: true })
  location?: InspectorGeoLocationGQL;

  @Field(() => Int)
  fileSize: number;

  @Field()
  mimeType: string;
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
    private readonly prisma: PrismaService
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
    @Args('input') input: GenerateQRTokenInput
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

    // Validate token format before processing
    this.validateTokenFormat(token);

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
  async getInspectorProjectInfo(@Args('token') token: string): Promise<InspectorProjectInfoGQL> {
    const startTime = Date.now();

    // Validate token format before processing
    this.validateTokenFormat(token);

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
   * Get form submissions for inspector portal - Sprint 5 ISSUE-165
   * PUBLIC endpoint - requires valid token with VIEW_SUBMISSIONS permission
   */
  @Query(() => [InspectorSubmissionGQL], {
    description: 'Get form submissions for inspector portal (requires valid token)',
  })
  async getInspectorSubmissions(@Args('token') token: string): Promise<InspectorSubmissionGQL[]> {
    const startTime = Date.now();

    // Validate token format before processing
    this.validateTokenFormat(token);

    // Verify token first
    const verified = await this.qrTokenService.verifyToken(token);

    // Check if token has VIEW_SUBMISSIONS permission
    if (!verified.permissions.includes(TokenPermission.VIEW_SUBMISSIONS)) {
      this.logger.warn(`Submissions access denied - missing permission`, {
        tokenId: verified.tokenId,
        projectId: verified.projectId,
        requiredPermission: 'VIEW_SUBMISSIONS',
        grantedPermissions: verified.permissions,
      });
      throw new Error('Token does not have VIEW_SUBMISSIONS permission');
    }

    // Get project to find orgId
    const project = await this.prisma.project.findUnique({
      where: { id: verified.projectId },
      select: { orgId: true },
    });

    if (!project) {
      this.logger.error(`Project not found for inspector submissions`, {
        projectId: verified.projectId,
        tokenId: verified.tokenId,
      });
      throw new Error('Project not found');
    }

    // Query submissions for this project (exclude drafts)
    const submissions = await this.prisma.formSubmission.findMany({
      where: {
        projectId: verified.projectId,
        orgId: project.orgId,
        status: { not: 'DRAFT' },
      },
      include: {
        template: {
          select: { name: true, category: true, schema: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    this.logger.log(`Inspector accessed submissions`, {
      tokenId: verified.tokenId,
      projectId: verified.projectId,
      submissionCount: submissions.length,
      durationMs: Date.now() - startTime,
    });

    // Transform to InspectorSubmissionGQL format
    return submissions.map((sub) => ({
      id: sub.id,
      templateName: sub.template.name,
      templateCategory: sub.template.category,
      status: sub.status,
      submittedBy: sub.submittedBy,
      submittedAt: sub.submittedAt?.toISOString() || sub.createdAt.toISOString(),
      sections: this.transformFormDataToSections(
        sub.data as Record<string, unknown>,
        sub.template.schema as {
          sections?: Array<{
            id: string;
            title: string;
            fields?: Array<{ id: string; name: string; label: string; type: string }>;
          }>;
        }
      ),
    }));
  }

  /**
   * Get photos for inspector portal - Sprint 5 ISSUE-165
   * PUBLIC endpoint - requires valid token with VIEW_PHOTOS permission
   */
  @Query(() => [InspectorPhotoGQL], {
    description: 'Get photos for inspector portal (requires valid token)',
  })
  async getInspectorPhotos(@Args('token') token: string): Promise<InspectorPhotoGQL[]> {
    const startTime = Date.now();

    // Validate token format before processing
    this.validateTokenFormat(token);

    // Verify token first
    const verified = await this.qrTokenService.verifyToken(token);

    // Check if token has VIEW_PHOTOS permission
    if (!verified.permissions.includes(TokenPermission.VIEW_PHOTOS)) {
      this.logger.warn(`Photos access denied - missing permission`, {
        tokenId: verified.tokenId,
        projectId: verified.projectId,
        requiredPermission: 'VIEW_PHOTOS',
        grantedPermissions: verified.permissions,
      });
      throw new Error('Token does not have VIEW_PHOTOS permission');
    }

    // Get project to find orgId
    const project = await this.prisma.project.findUnique({
      where: { id: verified.projectId },
      select: { orgId: true },
    });

    if (!project) {
      this.logger.error(`Project not found for inspector photos`, {
        projectId: verified.projectId,
        tokenId: verified.tokenId,
      });
      throw new Error('Project not found');
    }

    // Query photos for this project (through inspections)
    const photos = await this.prisma.photo.findMany({
      where: {
        orgId: project.orgId,
        inspection: {
          projectId: verified.projectId,
        },
      },
      orderBy: { takenAt: 'desc' },
      take: 100,
    });

    this.logger.log(`Inspector accessed photos`, {
      tokenId: verified.tokenId,
      projectId: verified.projectId,
      photoCount: photos.length,
      durationMs: Date.now() - startTime,
    });

    // Transform to InspectorPhotoGQL format
    return photos.map((photo) => ({
      id: photo.id,
      url: this.getPhotoUrl(photo),
      thumbnailUrl: this.getThumbnailUrl(photo),
      caption: photo.caption ?? undefined,
      takenAt: photo.takenAt.toISOString(),
      uploadedBy: photo.uploadedBy,
      location:
        photo.latitude && photo.longitude
          ? {
              latitude: photo.latitude,
              longitude: photo.longitude,
              altitude: photo.altitude ?? undefined,
            }
          : undefined,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
    }));
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
    @Args('tokenId') tokenId: string
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
    @Args('projectId') projectId: string
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
    @Args('projectId') projectId: string
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
   * Helper: Validate token format before processing
   * QR tokens are 256-bit entropy base64url encoded strings (43 characters)
   * This provides early validation with clear error messages
   */
  private validateTokenFormat(token: string): void {
    // Check for empty or null token
    if (!token || token.trim().length === 0) {
      this.logger.warn('Token validation failed: Empty token provided');
      throw new Error('Token is required');
    }

    // Trim whitespace
    const trimmedToken = token.trim();

    // Check minimum length (base64url encoded 256-bit = ~43 characters)
    if (trimmedToken.length < 40 || trimmedToken.length > 50) {
      this.logger.warn('Token validation failed: Invalid token length', {
        length: trimmedToken.length,
        expected: '40-50 characters',
      });
      throw new Error('Invalid token format: Unexpected length');
    }

    // Check for valid base64url characters only (A-Z, a-z, 0-9, -, _)
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    if (!base64urlRegex.test(trimmedToken)) {
      this.logger.warn('Token validation failed: Invalid characters in token');
      throw new Error('Invalid token format: Contains invalid characters');
    }
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

  /**
   * Helper: Transform form data and schema to sections/fields structure
   * Used by getInspectorSubmissions to present form data in structured format
   */
  private transformFormDataToSections(
    data: Record<string, unknown>,
    schema: {
      sections?: Array<{
        id: string;
        title: string;
        fields?: Array<{
          id: string;
          name: string;
          label: string;
          type: string;
        }>;
      }>;
    }
  ): InspectorFormSectionGQL[] {
    if (!schema?.sections) {
      // Fallback: Create a single section with all data fields
      return [
        {
          id: 'default',
          title: 'Form Data',
          fields: Object.entries(data).map(([key, value]) => ({
            id: key,
            name: key,
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            type: typeof value === 'boolean' ? 'checkbox' : 'text',
            value: value,
          })),
        },
      ];
    }

    // Map schema sections with data values
    return schema.sections.map((section) => ({
      id: section.id,
      title: section.title,
      fields: (section.fields || []).map((field) => ({
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type,
        value: data[field.name] ?? null,
      })),
    }));
  }

  /**
   * Helper: Get full-size photo URL based on storage type
   * S3 (MinIO): Returns MinIO endpoint URL
   * POSTGRESQL: Returns data URL from stored image bytes
   */
  private getPhotoUrl(photo: {
    storageType: StorageType;
    s3Key: string | null;
    imageData: Buffer | null;
    mimeType: string;
  }): string {
    if (photo.storageType === StorageType.S3 && photo.s3Key) {
      // MinIO/S3 storage: Construct URL from endpoint and key
      const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
      const bucket = process.env.S3_BUCKET_NAME || 'braveforms-photos';
      return `${endpoint}/${bucket}/${photo.s3Key}`;
    }

    if (photo.storageType === StorageType.POSTGRESQL && photo.imageData) {
      // PostgreSQL storage: Return data URL from stored bytes
      const base64 = photo.imageData.toString('base64');
      return `data:${photo.mimeType};base64,${base64}`;
    }

    // Fallback placeholder
    return '/images/photo-placeholder.png';
  }

  /**
   * Helper: Get thumbnail URL based on storage type
   * S3 (MinIO): Uses dedicated thumbnail key or constructs from s3Key
   * POSTGRESQL: Returns same data URL (frontend handles resizing)
   */
  private getThumbnailUrl(photo: {
    storageType: StorageType;
    s3Key: string | null;
    thumbnailKey: string | null;
    imageData: Buffer | null;
    mimeType: string;
  }): string {
    if (photo.storageType === StorageType.S3) {
      const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
      const bucket = process.env.S3_BUCKET_NAME || 'braveforms-photos';

      // If explicit thumbnail key exists, use it
      if (photo.thumbnailKey) {
        return `${endpoint}/${bucket}/${photo.thumbnailKey}`;
      }

      // Fallback: Construct thumbnail path from s3Key
      if (photo.s3Key) {
        const thumbPath = photo.s3Key.replace(/(\.[^.]+)$/, '-thumb$1');
        return `${endpoint}/${bucket}/${thumbPath}`;
      }
    }

    if (photo.storageType === StorageType.POSTGRESQL && photo.imageData) {
      // PostgreSQL storage: Return data URL (frontend handles resizing)
      const base64 = photo.imageData.toString('base64');
      return `data:${photo.mimeType};base64,${base64}`;
    }

    // Fallback placeholder
    return '/images/photo-placeholder-thumb.png';
  }
}
