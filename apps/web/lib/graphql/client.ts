import { GraphQLClient } from 'graphql-request';
import { useAuth } from '@clerk/nextjs';
import { appActions } from '../store/app.store';

// GraphQL client configuration for containerized backend
export const createGraphQLClient = (token?: string, orgId?: string, orgRole?: string) => {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3002/graphql';
  
  const client = new GraphQLClient(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(orgId && { 'x-org-id': orgId }),
      ...(orgRole && { 'x-org-role': orgRole }),
    },
    // Request interceptor for adding auth token and handling errors
    requestMiddleware: (request) => {
      // Add timestamp for request tracking
      (request as any).__timestamp = Date.now();
      
      return request;
    },
    // Response interceptor for error handling and offline detection
    responseMiddleware: (response) => {
      if (response instanceof Error) {
        console.error('GraphQL Error:', response);
        
        // Check if it's a network error (offline scenario)
        if (!navigator.onLine || response.message.includes('fetch')) {
          appActions.setNetworkStatus('offline');
          
          // Add failed request to offline queue
          appActions.addToOfflineQueue({
            type: 'sync_request',
            payload: response,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3,
            priority: 'medium',
          });
        }
        
        throw response;
      }
    },
  });

  return client;
};

// Hook for GraphQL client with authentication and organization context
export const useGraphQLClient = () => {
  const { getToken, orgId, orgRole } = useAuth();
  
  const getClient = async (requireOrg: boolean = true) => {
    try {
      const token = await getToken();
      
      if (requireOrg && !orgId) {
        throw new Error('Organization context required - user must select a construction company');
      }
      
      return createGraphQLClient(token || undefined, orgId || undefined, orgRole || undefined);
    } catch (error) {
      console.error('Failed to get auth token or org context:', error);
      
      if (requireOrg) {
        throw error;
      }
      
      return createGraphQLClient();
    }
  };

  return { 
    getClient,
    orgId,
    orgRole,
    hasOrgContext: !!orgId 
  };
};

// Common GraphQL fragments for consistent data fetching
export const fragments = {
  // User fragments
  UserBasic: /* GraphQL */ `
    fragment UserBasic on User {
      id
      email
      firstName
      lastName
      role
      organizationId
    }
  `,

  // Project fragments
  ProjectBasic: /* GraphQL */ `
    fragment ProjectBasic on Project {
      id
      name
      address
      permitNumber
      coordinates {
        lat
        lng
      }
      isActive
      complianceStatus
    }
  `,

  ProjectDetailed: /* GraphQL */ `
    fragment ProjectDetailed on Project {
      ...ProjectBasic
      description
      startDate
      endDate
      contractor {
        id
        name
        contactEmail
      }
      inspections(limit: 5) {
        id
        date
        type
        status
        rainfall
      }
    }
  `,

  // Inspection fragments
  InspectionBasic: /* GraphQL */ `
    fragment InspectionBasic on Inspection {
      id
      projectId
      date
      time
      type
      status
      rainfall
      weather
      inspector {
        id
        firstName
        lastName
      }
    }
  `,

  InspectionDetailed: /* GraphQL */ `
    fragment InspectionDetailed on Inspection {
      ...InspectionBasic
      bmpsInstalled
      bmpsNeedingMaintenance
      violationsObserved
      correctiveActions
      photos {
        id
        url
        caption
        gpsCoordinates {
          lat
          lng
        }
        timestamp
      }
      signature
      certificationStatement
      nextInspectionRequired
    }
  `,

  // Weather fragments
  WeatherData: /* GraphQL */ `
    fragment WeatherData on Weather {
      location
      currentConditions
      temperature
      humidity
      rainfall24h
      rainfallCurrent
      lastUpdated
      forecast {
        date
        conditions
        precipitationChance
        expectedRainfall
      }
    }
  `,

  // Compliance fragments
  ComplianceStatus: /* GraphQL */ `
    fragment ComplianceStatus on ComplianceStatus {
      projectId
      status
      lastInspection
      nextRequiredInspection
      overdueInspections
      recentRainfall {
        date
        amount
        triggerCompliance
      }
      violations {
        id
        type
        severity
        description
        status
      }
    }
  `,
};

// Common queries
export const queries = {
  // Get current user with organization context
  getCurrentUser: /* GraphQL */ `
    query GetCurrentUser {
      currentUser {
        ...UserBasic
        organization {
          id
          name
          type
          settings {
            autoSyncEnabled
            syncInterval
            offlineRetentionDays
          }
        }
        permissions
      }
    }
    ${fragments.UserBasic}
  `,

  // Get projects for current organization
  getProjects: /* GraphQL */ `
    query GetProjects($limit: Int, $offset: Int, $filter: ProjectFilter) {
      projects(limit: $limit, offset: $offset, filter: $filter) {
        items {
          ...ProjectDetailed
        }
        totalCount
        hasMore
      }
    }
    ${fragments.ProjectDetailed}
    ${fragments.ProjectBasic}
  `,

  // Get project details
  getProject: /* GraphQL */ `
    query GetProject($id: ID!) {
      project(id: $id) {
        ...ProjectDetailed
        compliance {
          ...ComplianceStatus
        }
        recentWeather {
          ...WeatherData
        }
      }
    }
    ${fragments.ProjectDetailed}
    ${fragments.ProjectBasic}
    ${fragments.ComplianceStatus}
    ${fragments.WeatherData}
  `,

  // Get weather data for compliance tracking
  getWeatherData: /* GraphQL */ `
    query GetWeatherData($location: String!, $days: Int = 7) {
      weather(location: $location) {
        ...WeatherData
        history(days: $days) {
          date
          rainfall
          conditions
          triggerCompliance
        }
      }
    }
    ${fragments.WeatherData}
  `,

  // Get compliance dashboard data
  getComplianceDashboard: /* GraphQL */ `
    query GetComplianceDashboard {
      compliance {
        summary {
          totalProjects
          compliantProjects
          overdueInspections
          upcomingDeadlines
        }
        recentTriggers {
          projectId
          projectName
          rainfallDate
          amount
          inspectionDue
          status
        }
        alerts {
          id
          type
          severity
          message
          projectId
          createdAt
        }
      }
    }
  `,

  // Get inspections
  getInspections: /* GraphQL */ `
    query GetInspections($projectId: ID, $limit: Int, $offset: Int) {
      inspections(projectId: $projectId, limit: $limit, offset: $offset) {
        items {
          ...InspectionDetailed
        }
        totalCount
        hasMore
      }
    }
    ${fragments.InspectionDetailed}
    ${fragments.InspectionBasic}
  `,
};

// Common mutations
export const mutations = {
  // Create inspection
  createInspection: /* GraphQL */ `
    mutation CreateInspection($input: CreateInspectionInput!) {
      createInspection(input: $input) {
        ...InspectionDetailed
      }
    }
    ${fragments.InspectionDetailed}
    ${fragments.InspectionBasic}
  `,

  // Update inspection
  updateInspection: /* GraphQL */ `
    mutation UpdateInspection($id: ID!, $input: UpdateInspectionInput!) {
      updateInspection(id: $id, input: $input) {
        ...InspectionDetailed
      }
    }
    ${fragments.InspectionDetailed}
    ${fragments.InspectionBasic}
  `,

  // Upload photos
  uploadPhotos: /* GraphQL */ `
    mutation UploadPhotos($inspectionId: ID!, $photos: [PhotoUploadInput!]!) {
      uploadPhotos(inspectionId: $inspectionId, photos: $photos) {
        id
        url
        thumbnailUrl
        caption
        gpsCoordinates {
          lat
          lng
        }
        timestamp
        fileSize
        mimeType
      }
    }
  `,

  // Update user settings
  updateUserSettings: /* GraphQL */ `
    mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
      updateUserSettings(input: $input) {
        ...UserBasic
        settings {
          theme
          language
          timezone
          autoSync
          syncInterval
        }
      }
    }
    ${fragments.UserBasic}
  `,

  // Sync offline data
  syncOfflineData: /* GraphQL */ `
    mutation SyncOfflineData($data: [OfflineActionInput!]!) {
      syncOfflineData(data: $data) {
        success
        processed
        failed
        errors {
          actionId
          error
          canRetry
        }
      }
    }
  `,
};

// Error handling utility
export class GraphQLError extends Error {
  constructor(
    message: string,
    public errors?: any[],
    public status?: number
  ) {
    super(message);
    this.name = 'GraphQLError';
  }
}

// Request wrapper with error handling and offline support
export const executeQuery = async <T = any>(
  client: GraphQLClient,
  query: string,
  variables?: any
): Promise<T> => {
  try {
    const result = await client.request<T>(query, variables);
    
    // Update network status on successful request
    appActions.setNetworkStatus('online');
    
    return result;
  } catch (error: any) {
    console.error('GraphQL query failed:', error);
    
    // Check if it's a network error
    if (!navigator.onLine || error?.message?.includes('fetch') || error?.code === 'NETWORK_ERROR') {
      appActions.setNetworkStatus('offline');
      
      // Add query to offline queue for retry
      appActions.addToOfflineQueue({
        type: 'sync_request',
        payload: { query, variables },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
        priority: 'medium',
      });
    }
    
    // Re-throw as our custom error
    throw new GraphQLError(
      error?.message || 'GraphQL request failed',
      error?.response?.errors,
      error?.response?.status
    );
  }
};

// Default client instance (will be replaced with authenticated version)
// Note: For organization-specific requests, always use useGraphQLClient() hook
export const graphqlClient = createGraphQLClient();