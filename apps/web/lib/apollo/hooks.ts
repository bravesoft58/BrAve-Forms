import { gql } from '@apollo/client';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import type { QueryHookOptions, MutationHookOptions } from '@apollo/client/react/types';
import { useAuth } from '@clerk/nextjs';
import { COMMON_FRAGMENTS } from './client';

// ===== TYPE DEFINITIONS =====

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'inspector' | 'viewer';
  organizationId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  type: 'construction_company' | 'inspector_agency' | 'regulatory_body';
  settings: {
    autoSyncEnabled: boolean;
    syncInterval: number;
    offlineRetentionDays: number;
  };
  projects?: Project[];
  users?: User[];
  createdAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  address: string;
  permitNumber: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  complianceStatus: 'compliant' | 'at_risk' | 'violation';
  description?: string;
  startDate?: string;
  endDate?: string;
  contractor?: {
    id: string;
    name: string;
    contactEmail: string;
  };
  inspections?: Inspection[];
  compliance?: ComplianceStatus;
  recentWeather?: WeatherData;
  createdAt: string;
  updatedAt: string;
}

// Inspection types
export interface Inspection {
  id: string;
  projectId: string;
  date: string;
  time: string;
  type: 'storm_water' | 'safety' | 'environmental' | 'routine';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  rainfall: number;
  weather: string;
  inspector: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bmpsInstalled?: string[];
  bmpsNeedingMaintenance?: string[];
  violationsObserved?: string[];
  correctiveActions?: string[];
  photos?: Photo[];
  signature?: string;
  certificationStatement?: string;
  nextInspectionRequired?: string;
  createdAt: string;
  updatedAt: string;
}

// Compliance types
export interface ComplianceStatus {
  projectId: string;
  status: 'compliant' | 'at_risk' | 'violation';
  lastInspection?: string;
  nextRequiredInspection?: string;
  overdueInspections: number;
  recentRainfall?: {
    date: string;
    amount: number;
    triggerCompliance: boolean;
  }[];
  violations?: {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    status: 'open' | 'resolved' | 'pending';
  }[];
}

// Weather types
export interface WeatherData {
  location: string;
  currentConditions: string;
  temperature: number;
  humidity: number;
  rainfall24h: number;
  rainfallCurrent: number;
  lastUpdated: string;
  forecast: {
    date: string;
    conditions: string;
    precipitationChance: number;
    expectedRainfall: number;
  }[];
  history?: {
    date: string;
    rainfall: number;
    conditions: string;
    triggerCompliance: boolean;
  }[];
}

// Photo types
export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  fileSize: number;
  mimeType: string;
}

// ===== GRAPHQL QUERIES =====

const GET_CURRENT_USER = gql`
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
  ${COMMON_FRAGMENTS.UserBasic}
`;

const GET_ORGANIZATION = gql`
  query GetOrganization($id: ID!) {
    organization(id: $id) {
      id
      name
      type
      settings {
        autoSyncEnabled
        syncInterval
        offlineRetentionDays
      }
      projects {
        ...ProjectBasic
      }
      users {
        ...UserBasic
      }
      createdAt
      updatedAt
    }
  }
  ${COMMON_FRAGMENTS.ProjectBasic}
  ${COMMON_FRAGMENTS.UserBasic}
`;

const GET_PROJECTS = gql`
  query GetProjects($limit: Int, $offset: Int, $filter: ProjectFilter) {
    projects(limit: $limit, offset: $offset, filter: $filter) {
      items {
        ...ProjectBasic
        description
        startDate
        endDate
        contractor {
          id
          name
          contactEmail
        }
        inspections(limit: 3) {
          ...InspectionBasic
        }
      }
      totalCount
      hasMore
    }
  }
  ${COMMON_FRAGMENTS.ProjectBasic}
  ${COMMON_FRAGMENTS.InspectionBasic}
`;

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      ...ProjectBasic
      description
      startDate
      endDate
      contractor {
        id
        name
        contactEmail
      }
      inspections(limit: 10) {
        ...InspectionBasic
        bmpsInstalled
        bmpsNeedingMaintenance
        violationsObserved
        correctiveActions
        photos {
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
        signature
        certificationStatement
        nextInspectionRequired
      }
      compliance {
        ...ComplianceStatus
      }
      recentWeather {
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
    }
  }
  ${COMMON_FRAGMENTS.ProjectBasic}
  ${COMMON_FRAGMENTS.InspectionBasic}
  ${COMMON_FRAGMENTS.ComplianceStatus}
`;

const GET_COMPLIANCE_DASHBOARD = gql`
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
`;

const GET_WEATHER_DATA = gql`
  query GetWeatherData($location: String!, $days: Int = 7) {
    weather(location: $location) {
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
      history(days: $days) {
        date
        rainfall
        conditions
        triggerCompliance
      }
    }
  }
`;

// ===== GRAPHQL MUTATIONS =====

const CREATE_INSPECTION = gql`
  mutation CreateInspection($input: CreateInspectionInput!) {
    createInspection(input: $input) {
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
  }
  ${COMMON_FRAGMENTS.InspectionBasic}
`;

const UPDATE_INSPECTION = gql`
  mutation UpdateInspection($id: ID!, $input: UpdateInspectionInput!) {
    updateInspection(id: $id, input: $input) {
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
  }
  ${COMMON_FRAGMENTS.InspectionBasic}
`;

const UPLOAD_PHOTOS = gql`
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
`;

const SYNC_OFFLINE_DATA = gql`
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
`;

// ===== SUBSCRIPTIONS =====

const COMPLIANCE_ALERTS = gql`
  subscription ComplianceAlerts($projectIds: [ID!]!) {
    complianceAlert(projectIds: $projectIds) {
      id
      type
      severity
      message
      projectId
      projectName
      triggerData {
        rainfall
        date
        inspectionDue
      }
      createdAt
    }
  }
`;

const WEATHER_TRIGGERS = gql`
  subscription WeatherTriggers($projectIds: [ID!]!) {
    weatherTrigger(projectIds: $projectIds) {
      projectId
      projectName
      location
      rainfall
      date
      triggerCompliance
      inspectionRequired
      deadline
    }
  }
`;

// ===== CUSTOM HOOKS =====

// User and Organization Hooks
export const useCurrentUser = (options?: QueryHookOptions) => {
  const { isLoaded, isSignedIn } = useAuth();
  
  return useQuery<{ currentUser: User }>(GET_CURRENT_USER, {
    ...options,
    skip: !isLoaded || !isSignedIn,
    fetchPolicy: 'cache-and-network', // Always check for updates
    errorPolicy: 'all',
  });
};

export const useOrganization = (id: string, options?: QueryHookOptions) => {
  return useQuery<{ organization: Organization }>(GET_ORGANIZATION, {
    ...options,
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-first', // Organization data changes infrequently
  });
};

// Project Hooks
export const useProjects = (
  filters?: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive';
    complianceStatus?: 'compliant' | 'at_risk' | 'violation';
  },
  options?: QueryHookOptions
) => {
  return useQuery<{
    projects: {
      items: Project[];
      totalCount: number;
      hasMore: boolean;
    };
  }>(GET_PROJECTS, {
    ...options,
    variables: {
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
      filter: {
        status: filters?.status,
        complianceStatus: filters?.complianceStatus,
      },
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
};

export const useProject = (id: string, options?: QueryHookOptions) => {
  return useQuery<{ project: Project }>(GET_PROJECT, {
    ...options,
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5 * 60 * 1000, // Poll every 5 minutes for compliance updates
  });
};

// Compliance Hooks
export const useComplianceDashboard = (options?: QueryHookOptions) => {
  return useQuery(GET_COMPLIANCE_DASHBOARD, {
    ...options,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10 * 60 * 1000, // Poll every 10 minutes for compliance updates
  });
};

// Weather Hooks (Critical for EPA compliance)
export const useWeatherData = (location: string, days: number = 7, options?: QueryHookOptions) => {
  return useQuery<{ weather: WeatherData }>(GET_WEATHER_DATA, {
    ...options,
    variables: { location, days },
    skip: !location,
    fetchPolicy: 'cache-and-network',
    pollInterval: 60 * 60 * 1000, // Poll every hour during working hours
    onCompleted: (data) => {
      // Check for 0.25" rainfall triggers
      if (data.weather.rainfall24h >= 0.25) {
        console.warn(`Rainfall trigger detected: ${data.weather.rainfall24h}" in ${location}`);
      }
    },
  });
};

// Mutation Hooks
export const useCreateInspection = (options?: MutationHookOptions) => {
  return useMutation(CREATE_INSPECTION, {
    ...options,
    onCompleted: (data) => {
      console.log('Inspection created:', data.createInspection.id);
      options?.onCompleted?.(data);
    },
    onError: (error) => {
      console.error('Failed to create inspection:', error);
      options?.onError?.(error);
    },
  });
};

export const useUpdateInspection = (options?: MutationHookOptions) => {
  return useMutation(UPDATE_INSPECTION, {
    ...options,
    onCompleted: (data) => {
      console.log('Inspection updated:', data.updateInspection.id);
      options?.onCompleted?.(data);
    },
    onError: (error) => {
      console.error('Failed to update inspection:', error);
      options?.onError?.(error);
    },
  });
};

export const useUploadPhotos = (options?: MutationHookOptions) => {
  return useMutation(UPLOAD_PHOTOS, {
    ...options,
    onCompleted: (data) => {
      console.log(`Uploaded ${data.uploadPhotos.length} photos`);
      options?.onCompleted?.(data);
    },
    onError: (error) => {
      console.error('Failed to upload photos:', error);
      options?.onError?.(error);
    },
  });
};

export const useSyncOfflineData = (options?: MutationHookOptions) => {
  return useMutation(SYNC_OFFLINE_DATA, {
    ...options,
    onCompleted: (data) => {
      console.log(`Sync completed: ${data.syncOfflineData.processed} processed, ${data.syncOfflineData.failed} failed`);
      options?.onCompleted?.(data);
    },
  });
};

// Subscription Hooks (Real-time compliance monitoring)
export const useComplianceAlerts = (projectIds: string[]) => {
  return useSubscription(COMPLIANCE_ALERTS, {
    variables: { projectIds },
    skip: projectIds.length === 0,
    onData: ({ data }) => {
      if (data?.data?.complianceAlert) {
        console.warn('Compliance alert received:', data.data.complianceAlert);
        
        // Show notification for critical alerts
        if (data.data.complianceAlert.severity === 'critical') {
          // This would trigger a notification
          // appActions.addNotification({ ... });
        }
      }
    },
  });
};

export const useWeatherTriggers = (projectIds: string[]) => {
  return useSubscription(WEATHER_TRIGGERS, {
    variables: { projectIds },
    skip: projectIds.length === 0,
    onData: ({ data }) => {
      if (data?.data?.weatherTrigger) {
        const trigger = data.data.weatherTrigger;
        console.warn(`Weather trigger: ${trigger.rainfall}" at ${trigger.location}`);
        
        // Only alert for 0.25" or more (EPA CGP requirement)
        if (trigger.rainfall >= 0.25) {
          // This would trigger a compliance notification
          // appActions.addNotification({ ... });
        }
      }
    },
  });
};

// Utility hook for organization-specific data fetching
export const useOrganizationData = () => {
  const { orgId } = useAuth();
  const { data: userData } = useCurrentUser();
  const organizationId = orgId || userData?.currentUser?.organizationId;
  
  const { data: orgData, loading: orgLoading } = useOrganization(organizationId!, {
    skip: !organizationId,
  });
  
  const { data: projectsData, loading: projectsLoading } = useProjects(
    { limit: 50 },
    { skip: !organizationId }
  );
  
  return {
    organization: orgData?.organization,
    projects: projectsData?.projects?.items || [],
    user: userData?.currentUser,
    loading: orgLoading || projectsLoading,
    hasOrgContext: !!organizationId,
  };
};