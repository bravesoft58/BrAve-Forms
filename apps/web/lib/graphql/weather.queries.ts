import { gql } from '@apollo/client';

// Weather GraphQL Operations for EPA Compliance

export const CHECK_PROJECT_WEATHER = gql`
  query CheckProjectWeather($projectId: String!, $latitude: Float!, $longitude: Float!) {
    checkProjectWeather(
      projectId: $projectId
      latitude: $latitude
      longitude: $longitude
    ) {
      exceeded
      amount
      requiresInspection
      source
      confidence
      timestamp
    }
  }
`;

export const GET_RECENT_WEATHER_EVENTS = gql`
  query GetRecentWeatherEvents($projectId: String!, $days: Float = 7) {
    recentWeatherEvents(projectId: $projectId, days: $days) {
      id
      projectId
      precipitationInches
      eventDate
      inspectionDeadline
      inspectionCompleted
      source
      notificationsSent
      createdAt
    }
  }
`;

export const GET_PENDING_INSPECTIONS = gql`
  query GetPendingInspections {
    pendingInspections {
      id
      projectId
      precipitationInches
      eventDate
      inspectionDeadline
      inspectionCompleted
      source
      notificationsSent
      createdAt
    }
  }
`;

export const WEATHER_ALERTS_SUBSCRIPTION = gql`
  subscription WeatherAlerts($orgId: String!) {
    weatherAlerts(orgId: $orgId) {
      projectId
      projectName
      precipitationAmount
      alertType
      timestamp
      source
      message
    }
  }
`;

// Weather data types for TypeScript
export interface PrecipitationCheckResult {
  exceeded: boolean;
  amount: number;
  requiresInspection: boolean;
  source: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

export interface WeatherEvent {
  id: string;
  projectId: string;
  precipitationInches: number;
  eventDate: string;
  inspectionDeadline: string;
  inspectionCompleted: boolean;
  source: 'NOAA' | 'OPENWEATHER' | 'MANUAL';
  notificationsSent: boolean;
  createdAt: string;
}

export interface WeatherAlert {
  projectId: string;
  projectName: string;
  precipitationAmount: number;
  alertType: 'EPA_THRESHOLD_EXCEEDED' | 'MONITORING_FAILURE' | 'INSPECTION_DUE';
  timestamp: string;
  source: string;
  message: string;
}

// Weather monitoring hooks
export const useWeatherMonitoring = () => {
  return {
    EPA_THRESHOLD: 0.25, // EXACTLY 0.25 inches per EPA CGP
    INSPECTION_HOURS: 24, // 24 working hours deadline
    
    formatPrecipitation: (amount: number) => `${amount.toFixed(3)}"`,
    
    getPriority: (amount: number, hoursRemaining: number) => {
      if (amount >= 0.25 && hoursRemaining <= 2) return 'CRITICAL';
      if (amount >= 0.25 && hoursRemaining <= 6) return 'URGENT';
      if (amount >= 0.25) return 'ACTION_REQUIRED';
      return 'NORMAL';
    },
    
    getPriorityColor: (priority: string) => {
      switch (priority) {
        case 'CRITICAL': return 'red';
        case 'URGENT': return 'orange';
        case 'ACTION_REQUIRED': return 'yellow';
        default: return 'green';
      }
    },
    
    isThresholdExceeded: (amount: number) => amount >= 0.25,
    
    calculateHoursRemaining: (inspectionDeadline: string) => {
      const deadline = new Date(inspectionDeadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    },
    
    formatDeadline: (inspectionDeadline: string) => {
      const deadline = new Date(inspectionDeadline);
      return deadline.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    },
    
    getConfidenceColor: (confidence: string) => {
      switch (confidence) {
        case 'HIGH': return 'green';
        case 'MEDIUM': return 'yellow';
        case 'LOW': return 'red';
        default: return 'gray';
      }
    },
  };
};