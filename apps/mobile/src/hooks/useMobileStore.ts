import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface WeatherAlert {
  isActive: boolean;
  message: string;
  precipitation: number;
}

interface MobileStore {
  currentProject: Project | null;
  weatherAlert: WeatherAlert | null;
  complianceStatus: 'compliant' | 'warning' | 'critical';
}

export function useMobileStore(): MobileStore {
  const [store] = useState<MobileStore>({
    currentProject: {
      id: 'project_1',
      name: 'Downtown Construction Site',
      address: '123 Main St, City, State',
    },
    weatherAlert: {
      isActive: true,
      message: 'EPA inspection required - 0.31" rainfall detected',
      precipitation: 0.31,
    },
    complianceStatus: 'warning',
  });

  return store;
}