'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Alert, Text } from '@mantine/core';
import { IconShieldX } from '@tabler/icons-react';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'INSPECTOR';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles: UserRole | UserRole[];
  fallback?: React.ReactNode;
  orgRole?: string; // Override for testing or custom contexts
}

/**
 * Role hierarchy for construction industry multi-tenant access control
 * Higher numbers have more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  INSPECTOR: 1,
};

/**
 * Check if user role has sufficient permissions
 */
function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user role is in allowed roles list
 */
function hasRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * RoleGuard component for construction industry role-based access control
 * 
 * Usage:
 * <RoleGuard requiredRoles="ADMIN">
 *   <AdminOnlyComponent />
 * </RoleGuard>
 * 
 * <RoleGuard requiredRoles={["OWNER", "ADMIN"]}>
 *   <ManagementComponent />
 * </RoleGuard>
 */
export function RoleGuard({ 
  children, 
  requiredRoles, 
  fallback,
  orgRole: overrideOrgRole 
}: RoleGuardProps) {
  const { orgRole: clerkOrgRole } = useAuth();
  
  // Use override or Clerk org role
  const currentRole = overrideOrgRole || clerkOrgRole;

  // If no role is available, deny access
  if (!currentRole) {
    return (
      fallback || (
        <Alert
          variant="light"
          color="red"
          title="Access Denied"
          icon={<IconShieldX size={16} />}
        >
          <Text size="sm">
            You must have an organization role to access this content.
            Please contact your administrator if you believe this is an error.
          </Text>
        </Alert>
      )
    );
  }

  const userRole = currentRole.toUpperCase() as UserRole;
  const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Check if user has required role access
  const hasAccess = hasRoleAccess(userRole, allowedRoles);

  if (!hasAccess) {
    return (
      fallback || (
        <Alert
          variant="light"
          color="orange"
          title="Insufficient Permissions"
          icon={<IconShieldX size={16} />}
        >
          <Text size="sm">
            This content requires {allowedRoles.join(' or ')} permissions.
            Your current role: {userRole}
          </Text>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check user permissions in components
 */
export function useRolePermissions() {
  const { orgRole } = useAuth();
  
  const checkPermission = (requiredRole: UserRole): boolean => {
    if (!orgRole) return false;
    const userRole = orgRole.toUpperCase() as UserRole;
    return hasPermission(userRole, requiredRole);
  };

  const checkRoleAccess = (allowedRoles: UserRole[]): boolean => {
    if (!orgRole) return false;
    const userRole = orgRole.toUpperCase() as UserRole;
    return hasRoleAccess(userRole, allowedRoles);
  };

  const getCurrentRole = (): UserRole | null => {
    if (!orgRole) return null;
    return orgRole.toUpperCase() as UserRole;
  };

  return {
    checkPermission,
    checkRoleAccess,
    getCurrentRole,
    isOwner: checkPermission('OWNER'),
    isAdmin: checkPermission('ADMIN'),
    isManager: checkPermission('MANAGER'),
    isMember: checkPermission('MEMBER'),
    isInspector: getCurrentRole() === 'INSPECTOR',
  };
}

/**
 * Convenience components for common role patterns
 */
export function OwnerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles="OWNER" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminAccess({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["OWNER", "ADMIN"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagementAccess({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["OWNER", "ADMIN", "MANAGER"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function TeamAccess({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AllRoles({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER", "INSPECTOR"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Higher-order component for role-based access control
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: UserRole | UserRole[],
  fallback?: React.ReactNode
) {
  const WrappedComponent = (props: P) => {
    return (
      <RoleGuard requiredRoles={requiredRoles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}