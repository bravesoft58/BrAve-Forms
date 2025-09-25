import { proxy, useSnapshot } from 'valtio';
import { proxyWithComputed } from 'valtio/utils';

// Types for the application state
export interface OfflineAction {
  id: string;
  type: 'inspection' | 'photo_upload' | 'form_submission' | 'sync_request' | 'graphql_operation';
  payload: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

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
  lastInspection?: Date;
  complianceStatus: 'compliant' | 'overdue' | 'warning' | 'unknown';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'inspector' | 'contractor' | 'admin';
  organizationId: string;
  permissions: string[];
}

export interface AppState {
  // Network and sync status
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  networkStatus: 'online' | 'offline';
  lastSync: Date | null;
  
  // Offline queue management
  offlineQueue: OfflineAction[];
  
  // Current user and organization context
  user: User | null;
  currentProject: Project | null;
  
  // UI state
  sidebarCollapsed: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  
  // Application settings
  settings: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    autoSync: boolean;
    syncInterval: number; // minutes
    offlineRetentionDays: number;
  };
  
  // Construction-specific state
  weatherData: {
    lastRainfall: number | null; // inches in last 24 hours
    lastRainfallTime: Date | null;
    currentConditions: string;
    forecast: Array<{
      date: Date;
      rainfall: number;
      conditions: string;
    }>;
  } | null;
  
  // EPA Compliance tracking
  compliance: {
    pendingInspections: number;
    overdueInspections: number;
    upcomingDeadlines: Array<{
      projectId: string;
      projectName: string;
      deadline: Date;
      rainfallTrigger: Date;
      priority: 'critical' | 'high' | 'medium';
    }>;
  };
}

// Initial state with construction-optimized defaults
const initialState: AppState = {
  syncStatus: 'idle',
  networkStatus: 'online',
  lastSync: null,
  offlineQueue: [],
  user: null,
  currentProject: null,
  sidebarCollapsed: false,
  notifications: [],
  settings: {
    theme: 'light',
    language: 'en-US',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoSync: true,
    syncInterval: 5, // 5 minutes for construction sites
    offlineRetentionDays: 30, // EPA requirement compliance
  },
  weatherData: null,
  compliance: {
    pendingInspections: 0,
    overdueInspections: 0,
    upcomingDeadlines: [],
  },
};

// Create store with basic proxy (we'll add persistence later)
export const appStore = proxy(initialState);

// IndexedDB helper for persistent storage
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brave-forms-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create app store for persistent state
      if (!db.objectStoreNames.contains('appStore')) {
        const appStore = db.createObjectStore('appStore', { keyPath: 'key' });
        appStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create offline queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('priority', 'priority', { unique: false });
      }
      
      // Create form data cache
      if (!db.objectStoreNames.contains('formData')) {
        const formStore = db.createObjectStore('formData', { keyPath: 'id' });
        formStore.createIndex('formType', 'formType', { unique: false });
        formStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Store actions for updating state
export const appActions = {
  // Network status management
  setNetworkStatus: (status: 'online' | 'offline') => {
    appStore.networkStatus = status;
    
    // Auto-trigger sync when coming back online
    if (status === 'online' && appStore.offlineQueue.length > 0) {
      appActions.triggerSync();
    }
  },

  // Sync management
  setSyncStatus: (status: AppState['syncStatus']) => {
    appStore.syncStatus = status;
    if (status === 'success') {
      appStore.lastSync = new Date();
    }
  },

  // Offline queue management
  addToOfflineQueue: (action: Omit<OfflineAction, 'id'>) => {
    const queueItem: OfflineAction = {
      ...action,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    appStore.offlineQueue.push(queueItem);
    
    // Auto-trigger sync if online
    if (appStore.networkStatus === 'online') {
      appActions.triggerSync();
    }
  },

  removeFromOfflineQueue: (actionId: string) => {
    const index = appStore.offlineQueue.findIndex(item => item.id === actionId);
    if (index !== -1) {
      appStore.offlineQueue.splice(index, 1);
    }
  },

  // User and project management
  setUser: (user: User | null) => {
    appStore.user = user;
  },

  setCurrentProject: (project: Project | null) => {
    appStore.currentProject = project;
  },

  // Notification management
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    appStore.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (appStore.notifications.length > 50) {
      appStore.notifications = appStore.notifications.slice(0, 50);
    }
  },

  markNotificationRead: (notificationId: string) => {
    const notification = appStore.notifications.find((n: any) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  },

  // Weather data management (critical for EPA compliance)
  updateWeatherData: (weatherData: AppState['weatherData']) => {
    appStore.weatherData = weatherData;
    
    // Check for 0.25" rainfall trigger (EPA CGP requirement)
    if (weatherData?.lastRainfall && weatherData.lastRainfall >= 0.25) {
      appActions.checkComplianceDeadlines();
    }
  },

  // Compliance management
  updateCompliance: (compliance: Partial<AppState['compliance']>) => {
    appStore.compliance = { ...appStore.compliance, ...compliance };
  },

  checkComplianceDeadlines: () => {
    // This would typically call an API to check for compliance deadlines
    // For now, we'll just trigger a notification if there are overdue inspections
    if (appStore.compliance.overdueInspections > 0) {
      appActions.addNotification({
        type: 'error',
        title: 'Overdue Inspections',
        message: `You have ${appStore.compliance.overdueInspections} overdue inspection(s). EPA fines may apply.`,
      });
    }
  },

  // Trigger sync operation
  triggerSync: async () => {
    if (appStore.syncStatus === 'syncing') return; // Already syncing
    
    appActions.setSyncStatus('syncing');
    
    try {
      // This would implement the actual sync logic
      // For now, we'll simulate a sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear successful items from queue
      appStore.offlineQueue = appStore.offlineQueue.filter((item: OfflineAction) => 
        item.retryCount >= item.maxRetries
      );
      
      appActions.setSyncStatus('success');
    } catch (error) {
      appActions.setSyncStatus('error');
      appActions.addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync offline data. Will retry automatically.',
      });
    }
  },

  // Settings management
  updateSettings: (settings: Partial<AppState['settings']>) => {
    appStore.settings = { ...appStore.settings, ...settings };
  },

  // UI state management
  toggleSidebar: () => {
    appStore.sidebarCollapsed = !appStore.sidebarCollapsed;
  },

  // Additional actions for Apollo Client integration
  setAuthError: (error: string) => {
    appActions.addNotification({
      type: 'error',
      title: 'Authentication Error',
      message: error,
    });
  },

  processOfflineQueue: async () => {
    // Process offline GraphQL operations
    const graphqlOperations = appStore.offlineQueue.filter(item => 
      item.type === 'graphql_operation'
    );
    
    for (const operation of graphqlOperations) {
      try {
        // Retry GraphQL operation - would implement actual retry logic here
        appActions.removeFromOfflineQueue(operation.id);
      } catch (error) {
        // Increment retry count
        operation.retryCount += 1;
        if (operation.retryCount >= operation.maxRetries) {
          appActions.removeFromOfflineQueue(operation.id);
        }
      }
    }
  },
};

// React hooks for using the store
export function useAppStore() {
  return useSnapshot(appStore);
}

export function useAppActions() {
  return appActions;
}