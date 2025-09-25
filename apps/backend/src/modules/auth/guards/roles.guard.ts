import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

/**
 * Role-Based Access Control Guard for Construction Company Organizations
 * 
 * This guard enforces organization-level permissions for BrAve Forms:
 * - owner: Full administrative access (company owner)
 * - admin: Administrative access (IT administrators)
 * - manager: Project management access (construction managers)
 * - member: Standard user access (workers, office staff)
 * - inspector: Inspection-only access (compliance inspectors)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;
    
    // Ensure user has organization context
    if (!user || !user.orgId) {
      this.logger.warn('Access denied: No organization context', {
        userId: user?.userId,
        requiredRoles,
      });
      throw new ForbiddenException('Organization context required');
    }

    // Validate user role exists
    if (!user.orgRole) {
      this.logger.warn('Access denied: No organization role', {
        userId: user.userId,
        orgId: user.orgId,
        requiredRoles,
      });
      throw new ForbiddenException('Organization role required');
    }

    // Check if user has required role
    const hasRequiredRole = requiredRoles.includes(user.orgRole);
    
    // Special role hierarchy - owners and admins can access most things
    const isPrivilegedUser = ['owner', 'admin'].includes(user.orgRole);
    const hasAccess = hasRequiredRole || 
      (isPrivilegedUser && !requiredRoles.includes('owner')); // Only owner can access owner-only resources

    if (!hasAccess) {
      this.logger.warn('Access denied: Insufficient role permissions', {
        userId: user.userId,
        orgId: user.orgId,
        userRole: user.orgRole,
        requiredRoles,
      });
      
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(', ')}]. Your role: ${user.orgRole}`
      );
    }

    // Log successful authorization for audit trail
    this.logger.debug('Access granted', {
      userId: user.userId,
      orgId: user.orgId,
      userRole: user.orgRole,
      requiredRoles,
    });

    return true;
  }
}