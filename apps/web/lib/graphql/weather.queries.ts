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
}

// Placeholder hook - to be implemented with proper weather monitoring
export function useWeatherMonitoring() {
  return {
    isMonitoring: false,
    alerts: [] as WeatherAlert[],
    startMonitoring: () => {},
    stopMonitoring: () => {},
  };
}
