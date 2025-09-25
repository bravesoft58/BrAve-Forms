import { SetMetadata } from '@nestjs/common';

/**
 * Role-based access control decorator for BrAve Forms
 * 
 * Construction industry hierarchy:
 * OWNER: Full organization control, billing, member management
 * ADMIN: Project management, user management, compliance oversight
 * MANAGER: Project supervision, team coordination, inspection scheduling
 * MEMBER: Site access, form submission, basic reporting
 * INSPECTOR: View-only access via QR codes, inspection execution
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'INSPECTOR';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Convenience decorators for common access patterns
export const OwnerOnly = () => Roles('OWNER');
export const AdminAccess = () => Roles('OWNER', 'ADMIN');
export const ManagementAccess = () => Roles('OWNER', 'ADMIN', 'MANAGER');
export const TeamAccess = () => Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
export const AllRoles = () => Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'INSPECTOR');

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  INSPECTOR: 1,
};

/**
 * Check if user role has sufficient permissions
 * @param userRole Current user's role
 * @param requiredRole Minimum required role
 * @returns boolean indicating if access is allowed
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user role is in allowed roles list
 * @param userRole Current user's role
 * @param allowedRoles Array of allowed roles
 * @returns boolean indicating if access is allowed
 */
export function hasRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}