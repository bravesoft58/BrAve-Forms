import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { TokenPermission, QRToken } from '@prisma/client';
import * as crypto from 'crypto';

export interface GenerateTokenInput {
  projectId: string;
  permissions: TokenPermission[];
  generatedBy: string;
  orgId: string;
  expiryHours?: number;
}

export interface TokenPayload {
  projectId: string;
  permissions: TokenPermission[];
  tokenId: string;
}

export interface VerifiedToken {
  projectId: string;
  permissions: TokenPermission[];
  tokenId: string;
}

@Injectable()
export class QRTokenService {
  private readonly logger = new Logger(QRTokenService.name);
  private readonly defaultExpiryHours: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.defaultExpiryHours = parseInt(
      this.configService.get<string>('QR_TOKEN_EXPIRY_HOURS') || '24',
      10,
    );
  }

  /**
   * Generate a new QR token for inspector portal access
   * Tokens are READ-ONLY and expire after 24 hours by default
   */
  async generateToken(input: GenerateTokenInput): Promise<QRToken> {
    const { projectId, permissions, generatedBy, orgId, expiryHours } = input;

    // Validate permissions array is not empty
    if (!permissions || permissions.length === 0) {
      throw new BadRequestException('At least one permission is required');
    }

    // Validate all permissions are READ-ONLY (VIEW_* only)
    const validPermissions = [
      TokenPermission.VIEW_SUBMISSIONS,
      TokenPermission.VIEW_PHOTOS,
      TokenPermission.VIEW_PROJECT_INFO,
    ];
    const invalidPermissions = permissions.filter((p) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPermissions.join(', ')}. Only VIEW_* permissions are allowed.`,
      );
    }

    // Verify project exists and belongs to org (multi-tenancy isolation)
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId: orgId,
      },
    });

    if (!project) {
      this.logger.warn(
        `Token generation attempted for non-existent or unauthorized project: ${projectId}`,
      );
      throw new NotFoundException('Project not found');
    }

    // Generate secure random token
    const token = this.generateSecureToken();

    // Calculate expiration (default 24 hours)
    const hours = expiryHours || this.defaultExpiryHours;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Store token in database
    const qrToken = await this.prisma.qRToken.create({
      data: {
        projectId,
        token,
        permissions,
        expiresAt,
        generatedBy,
      },
    });

    this.logger.log(
      `QR token generated for project ${projectId} with permissions: ${permissions.join(', ')}`,
    );

    return qrToken;
  }

  /**
   * Verify a QR token and return its payload if valid
   * Updates access count and last access timestamp
   */
  async verifyToken(token: string): Promise<VerifiedToken> {
    const qrToken = await this.prisma.qRToken.findUnique({
      where: { token },
    });

    if (!qrToken) {
      this.logger.warn(`Token verification failed: token not found`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > qrToken.expiresAt) {
      this.logger.warn(`Token verification failed: token expired for project ${qrToken.projectId}`);
      throw new UnauthorizedException('Token has expired');
    }

    // Check if token is revoked
    if (qrToken.revokedAt) {
      this.logger.warn(`Token verification failed: token revoked for project ${qrToken.projectId}`);
      throw new UnauthorizedException('Token has been revoked');
    }

    // Update access tracking
    await this.prisma.qRToken.update({
      where: { id: qrToken.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessAt: new Date(),
      },
    });

    this.logger.debug(`Token verified for project ${qrToken.projectId}`);

    return {
      projectId: qrToken.projectId,
      permissions: qrToken.permissions,
      tokenId: qrToken.id,
    };
  }

  /**
   * Revoke a specific token
   * Enforces org isolation - can only revoke tokens for projects in your org
   */
  async revokeToken(tokenId: string, orgId: string): Promise<QRToken> {
    const qrToken = await this.prisma.qRToken.findFirst({
      where: {
        id: tokenId,
        project: { orgId },
      },
      include: { project: true },
    });

    if (!qrToken) {
      throw new NotFoundException('Token not found');
    }

    const revokedToken = await this.prisma.qRToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Token ${tokenId} revoked for project ${qrToken.projectId}`);

    return revokedToken;
  }

  /**
   * Revoke all active tokens for a project
   * Useful when regenerating QR codes - invalidates all previous tokens
   */
  async revokeAllProjectTokens(
    projectId: string,
    orgId: string,
  ): Promise<{ revokedCount: number }> {
    // Verify project belongs to org
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Find all non-revoked tokens
    const activeTokens = await this.prisma.qRToken.findMany({
      where: {
        projectId,
        revokedAt: null,
      },
    });

    // Revoke all active tokens
    if (activeTokens.length > 0) {
      await this.prisma.qRToken.updateMany({
        where: {
          projectId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log(`Revoked ${activeTokens.length} tokens for project ${projectId}`);

    return { revokedCount: activeTokens.length };
  }

  /**
   * Get all tokens for a project (for management UI)
   * Includes both active and revoked tokens
   */
  async getProjectTokens(projectId: string, orgId: string): Promise<QRToken[]> {
    // Verify project belongs to org
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.qRToken.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if a token has a specific permission
   * Used for authorization in resolver guards
   */
  async hasPermission(token: string, permission: TokenPermission): Promise<boolean> {
    try {
      const verified = await this.verifyToken(token);
      return verified.permissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Generate a cryptographically secure random token
   * Uses URL-safe base64 encoding for QR code compatibility
   */
  private generateSecureToken(): string {
    // Generate 32 bytes of random data (256 bits of entropy)
    const randomBytes = crypto.randomBytes(32);
    // Convert to URL-safe base64 (removes +, /, =)
    return randomBytes.toString('base64url');
  }
}
