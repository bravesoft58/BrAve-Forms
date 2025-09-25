'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { gql, useQuery } from '@apollo/client';
import { Loader, Center, Stack, Text, Alert } from '@mantine/core';
import { IconBuilding, IconAlertTriangle } from '@tabler/icons-react';
import { UserRole } from '../Auth/RoleGuard';

// GraphQL Query for Organization Context
const GET_ORGANIZATION_CONTEXT = gql`
  query GetOrganizationContext {
    currentOrganization {
      id
      name
      plan
      createdAt
    }
  }
`;

interface OrganizationData {
  id: string;
  name: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: string;
}

interface OrganizationContextType {
  organization: OrganizationData | null;
  userRole: UserRole | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<any>;
  
  // Permission helpers
  canCreateProjects: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canExportData: boolean;
  canDeleteProjects: boolean;
  
  // Feature access based on plan + role
  hasFeatureAccess: (feature: string) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

/**
 * Organization Provider for multi-tenant construction management
 * 
 * Provides:
 * - Complete tenant isolation per Clerk organization
 * - Role-based permission checking
 * - Plan-based feature access
 * - Real-time organization context
 * 
 * This ensures that all child components have proper tenant context
 * and can make role-based decisions for construction industry workflows
 */
export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { orgId, orgRole, isLoaded: authLoaded } = useAuth();
  const [contextError, setContextError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_CONTEXT, {
    skip: !authLoaded || !orgId,
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Organization context error:', error);
      setContextError(error.message);
    },
  });

  // Ensure we have proper tenant context
  useEffect(() => {
    if (authLoaded && !orgId) {
      setContextError('No organization context. Personal accounts are disabled.');
    } else if (authLoaded && orgId && !orgRole) {
      setContextError('No organization role assigned. Contact your administrator.');
    } else {
      setContextError(null);
    }
  }, [authLoaded, orgId, orgRole]);

  // Calculate permissions based on role
  const userRole = orgRole?.toUpperCase() as UserRole | null;
  
  const permissions = React.useMemo(() => {
    if (!userRole) {
      return {
        canCreateProjects: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        canExportData: false,
        canDeleteProjects: false,
      };
    }

    const rolePermissions = {
      OWNER: {
        canCreateProjects: true,
        canManageUsers: true,
        canAccessAnalytics: true,
        canExportData: true,
        canDeleteProjects: true,
      },
      ADMIN: {
        canCreateProjects: true,
        canManageUsers: true,
        canAccessAnalytics: true,
        canExportData: true,
        canDeleteProjects: true,
      },
      MANAGER: {
        canCreateProjects: true,
        canManageUsers: false,
        canAccessAnalytics: true,
        canExportData: false,
        canDeleteProjects: false,
      },
      MEMBER: {
        canCreateProjects: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        canExportData: false,
        canDeleteProjects: false,
      },
      INSPECTOR: {
        canCreateProjects: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        canExportData: false,
        canDeleteProjects: false,
      },
    };

    return rolePermissions[userRole] || rolePermissions.MEMBER;
  }, [userRole]);

  // Plan-based feature access
  const hasFeatureAccess = React.useCallback((feature: string): boolean => {
    const plan = data?.currentOrganization?.plan || 'STARTER';
    
    const featureMatrix = {
      STARTER: [
        'basic_inspections',
        'weather_monitoring',
        'photo_upload',
        'basic_reporting',
      ],
      PROFESSIONAL: [
        'basic_inspections',
        'weather_monitoring', 
        'photo_upload',
        'basic_reporting',
        'custom_forms',
        'advanced_analytics',
        'bulk_export',
        'api_access',
      ],
      ENTERPRISE: [
        'basic_inspections',
        'weather_monitoring',
        'photo_upload', 
        'basic_reporting',
        'custom_forms',
        'advanced_analytics',
        'bulk_export',
        'api_access',
        'white_label',
        'sso_integration',
        'audit_logs',
        'priority_support',
      ],
    };

    return featureMatrix[plan].includes(feature);
  }, [data?.currentOrganization?.plan]);

  // Provide context value
  const contextValue: OrganizationContextType = {
    organization: data?.currentOrganization || null,
    userRole,
    isLoading: !authLoaded || loading,
    error: contextError || error?.message || null,
    refetch,
    ...permissions,
    hasFeatureAccess,
  };

  // Show loading state during initial auth/organization load
  if (!authLoaded || (authLoaded && orgId && loading)) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="lg" fw={500}>BrAve Forms</Text>
          <Text size="sm" c="dimmed">
            Loading organization context...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Handle critical organization context errors
  if (contextError || (!orgId && authLoaded)) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="lg" maw={500}>
          <IconBuilding size={64} color="#ccc" />
          <Stack align="center" gap="sm">
            <Text size="xl" fw={600}>Organization Required</Text>
            <Text size="sm" c="dimmed" ta="center">
              BrAve Forms requires you to be part of a construction company organization.
              Personal accounts are disabled for compliance reasons.
            </Text>
          </Stack>
          
          <Alert
            variant="light"
            color="red"
            title="Access Denied"
            icon={<IconAlertTriangle size={16} />}
          >
            {contextError || 'No organization context available'}
          </Alert>
          
          <Text size="xs" c="dimmed" ta="center">
            Contact your construction company administrator or{' '}
            <a href="/select-organization" style={{ color: '#0ea5e9' }}>
              select an organization
            </a>{' '}
            to continue.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook to access organization context
 * 
 * Provides complete tenant isolation and role-based permissions
 * for construction industry multi-tenant architecture
 */
export function useOrganization(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider. ' +
      'Make sure to wrap your app with <OrganizationProvider>'
    );
  }
  
  return context;
}

/**
 * Hook for organization-specific feature flags
 * Combines plan limits with role permissions
 */
export function useFeatureAccess() {
  const { hasFeatureAccess, userRole, organization } = useOrganization();
  
  return {
    hasFeatureAccess,
    plan: organization?.plan || 'STARTER',
    userRole,
    
    // Common feature checks
    canUseCustomForms: hasFeatureAccess('custom_forms'),
    canAccessAnalytics: hasFeatureAccess('advanced_analytics'),
    canExportData: hasFeatureAccess('bulk_export'),
    canUseAPI: hasFeatureAccess('api_access'),
    hasSSO: hasFeatureAccess('sso_integration'),
    hasPrioritySupport: hasFeatureAccess('priority_support'),
    
    // Plan upgrade prompts
    needsUpgradeFor: (feature: string) => !hasFeatureAccess(feature),
  };
}

/**
 * Higher-order component for organization-aware components
 */
export function withOrganization<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => {
    const orgContext = useOrganization();
    
    return <Component {...props} organization={orgContext} />;
  };

  WrappedComponent.displayName = `withOrganization(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Organization-scoped error boundary
 * Provides tenant isolation for error handling and reporting
 */
export class OrganizationErrorBoundary extends React.Component<
  { children: React.ReactNode; organizationId?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; organizationId?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with organization context for debugging
    console.error('Organization Error:', {
      error: error.message,
      organizationId: this.props.organizationId,
      errorInfo,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to monitoring service (Sentry, Datadog) with tenant context
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center h={400}>
          <Stack align="center" gap="md">
            <IconAlertTriangle size={48} color="#ef4444" />
            <Text size="lg" fw={600}>Something went wrong</Text>
            <Text size="sm" c="dimmed" ta="center" maw={400}>
              An error occurred while loading your organization data. 
              Please refresh the page or contact support if the issue persists.
            </Text>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}