/**
 * Weather types and utilities (Apollo removed - types only)
 */

export interface WeatherEvent {
  id: string;
  projectId: string;
  precipitationInches: number;
  eventDate: string;
  inspectionDeadline: string;
  inspectionCompleted: boolean;
  source: string;
  notificationsSent: boolean;
  createdAt: string;
}

export interface WeatherAlert {
  id: string;
  projectId: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  alertType?: 'THRESHOLD_EXCEEDED' | 'MONITORING_FAILURE' | 'INSPECTION_DUE';
  precipitationAmount?: number;
  source?: string;
}

// Helper functions for weather monitoring
function calculateHoursRemaining(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
}

function formatPrecipitation(inches: number): string {
  return `${inches.toFixed(2)}"`;
}

function getPriority(precipitationInches: number, hoursRemaining: number): string {
  if (hoursRemaining <= 4 || precipitationInches >= 1.0) {
    return 'CRITICAL';
  } else if (hoursRemaining <= 12 || precipitationInches >= 0.5) {
    return 'HIGH';
  } else if (hoursRemaining <= 20) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'red';
    case 'HIGH':
      return 'orange';
    case 'MEDIUM':
      return 'yellow';
    default:
      return 'blue';
  }
}

function getConfidenceColor(source: string): string {
  switch (source?.toUpperCase()) {
    case 'NOAA':
      return 'green';
    case 'OPENWEATHERMAP':
      return 'blue';
    case 'MANUAL':
      return 'gray';
    default:
      return 'gray';
  }
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Placeholder hook - to be implemented with proper weather monitoring
export function useWeatherMonitoring() {
  return {
    isMonitoring: false,
    alerts: [] as WeatherAlert[],
    startMonitoring: () => {},
    stopMonitoring: () => {},
    // Helper utilities
    calculateHoursRemaining,
    formatPrecipitation,
    getPriority,
    getPriorityColor,
    getConfidenceColor,
    formatDeadline,
  };
}
