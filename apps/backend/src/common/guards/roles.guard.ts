import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY, UserRole, hasRoleAccess } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const user: CurrentUser = request.user;

    if (!user) {
      this.logger.warn('No user context found in request');
      throw new ForbiddenException('Authentication required');
    }

    if (!user.orgRole) {
      this.logger.warn(`User ${user.userId} has no organization role`, {
        userId: user.userId,
        orgId: user.orgId,
      });
      throw new ForbiddenException('Organization role required');
    }

    const hasAccess = hasRoleAccess(user.orgRole as UserRole, requiredRoles);

    if (!hasAccess) {
      this.logger.warn(`Access denied for user ${user.userId}`, {
        userId: user.userId,
        orgId: user.orgId,
        userRole: user.orgRole,
        requiredRoles,
      });

      // Audit log for security monitoring
      this.logSecurityEvent({
        type: 'ROLE_ACCESS_DENIED',
        userId: user.userId,
        organizationId: user.orgId,
        userRole: user.orgRole,
        requiredRoles,
        resource: this.getResourceName(context),
      });

      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // Log successful access for compliance auditing
    this.logAuditEvent({
      type: 'ROLE_ACCESS_GRANTED',
      userId: user.userId,
      organizationId: user.orgId,
      userRole: user.orgRole,
      resource: this.getResourceName(context),
    });

    return true;
  }

  private getResourceName(context: ExecutionContext): string {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    
    // For GraphQL, get the field name and parent type
    if (info && info.fieldName) {
      const parentType = info.parentType?.name || 'Unknown';
      return `${parentType}.${info.fieldName}`;
    }
    
    // Fallback to handler name
    return context.getHandler().name || 'unknown_resource';
  }

  private logSecurityEvent(event: {
    type: string;
    userId: string;
    organizationId: string;
    userRole: string;
    requiredRoles: UserRole[];
    resource: string;
  }): void {
    this.logger.error('Security event logged', {
      ...event,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });

    // TODO: Send to security monitoring system (Datadog, Sentry, etc.)
    // For now, we just log to console with ERROR level for visibility
  }

  private logAuditEvent(event: {
    type: string;
    userId: string;
    organizationId: string;
    userRole: string;
    resource: string;
  }): void {
    // Only log in development to avoid noise
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Audit event logged', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Send to audit logging system for compliance
  }
}