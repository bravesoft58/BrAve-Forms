import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { DEFAULT_ORG_ID, DEFAULT_ORG_SLUG } from '@common/constants';

interface ClerkJWTPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  org_id?: string;
  org_role?: string;
  org_slug?: string;
  o?: {
    id?: string;
    rol?: string;
    slg?: string;
  };
  sid?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  private secretKey: string;

  constructor(private configService: ConfigService) {
    super();

    this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!this.secretKey) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }
  }

  async validate(req: any): Promise<any> {
    // Development mode bypass
    if (process.env.SKIP_CLERK_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      console.warn('[DEV MODE] Clerk authentication bypassed');

      return {
        userId: 'dev-user-123',
        email: 'developer@braveforms.test',
        firstName: 'Dev',
        lastName: 'User',
        orgId: DEFAULT_ORG_ID, // 'org_qd_default' - matches clerk_org_id in database
        orgRole: 'ADMIN', // UPPERCASE to match ROLE_HIERARCHY in roles.decorator.ts
        orgSlug: DEFAULT_ORG_SLUG, // Consistent with DEFAULT_ORG_ID
        sessionId: 'dev-session-123',

        // Additional security context
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,

        // Compliance audit trail
        authTimestamp: new Date(),
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Use standalone verifyToken function from Clerk SDK v1.34+
      const verifiedToken = (await verifyToken(token, {
        secretKey: this.secretKey,
      })) as ClerkJWTPayload;

      if (!verifiedToken) {
        throw new UnauthorizedException('Invalid token');
      }

      // Single-tenant mode: Always use DEFAULT_ORG_ID
      // Note: Organizations feature disabled in Clerk Dashboard
      // Multi-tenant migration planned for Sprint 8
      const orgId = DEFAULT_ORG_ID;
      const orgSlug = DEFAULT_ORG_SLUG;
      // Extract role from token if available, otherwise default to 'member'
      // Note: org_role and o.rol claims may not exist (orgs disabled in Clerk)
      const orgRole = verifiedToken.org_role || verifiedToken.o?.rol || 'member';

      // Validate organization role for access control
      // Normalize to uppercase to match ROLE_HIERARCHY in roles.decorator.ts
      const validRoles = ['ADMIN', 'OWNER', 'MANAGER', 'MEMBER', 'INSPECTOR'];
      const normalizedRole = orgRole?.toUpperCase() || 'MEMBER';
      if (!validRoles.includes(normalizedRole)) {
        throw new UnauthorizedException(`Invalid organization role: ${orgRole}`);
      }

      const user = {
        userId: verifiedToken.sub,
        email: verifiedToken.email,
        firstName: verifiedToken.given_name,
        lastName: verifiedToken.family_name,
        orgId,
        orgRole: normalizedRole, // UPPERCASE to match ROLE_HIERARCHY
        orgSlug,
        sessionId: verifiedToken.sid,

        // Additional security context
        issuedAt: verifiedToken.iat,
        expiresAt: verifiedToken.exp,

        // Compliance audit trail
        authTimestamp: new Date(),
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      // Log successful authentication for audit trail
      console.log(
        `Authentication successful: user=${user.userId}, org=${user.orgId}, role=${user.orgRole}`
      );

      return user;
    } catch (error) {
      // Log failed authentication attempts for security monitoring
      console.error('Authentication failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });

      throw new UnauthorizedException('Token verification failed');
    }
  }
}
