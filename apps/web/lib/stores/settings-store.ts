import { proxy, subscribe } from 'valtio';

/**
 * Theme options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Date format options
 */
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

/**
 * Units for measurements
 */
export type MeasurementUnits = 'imperial' | 'metric';

/**
 * Auto-sync interval options (in minutes)
 */
export type SyncInterval = 5 | 15 | 30 | 60;

/**
 * Data retention period (in days)
 */
export type RetentionPeriod = 7 | 14 | 30;

/**
 * Photo quality for uploads
 */
export type PhotoQuality = 'original' | 'high' | 'medium' | 'low';

/**
 * Notification settings
 */
export interface NotificationSettings {
  emailWeatherAlerts: boolean;
  emailInspectionReminders: boolean;
  emailFormConfirmations: boolean;
  emailWeeklySummary: boolean;
  pushRealTimeAlerts: boolean;
  pushInspectionReminders: boolean;
}

/**
 * Display settings
 */
export interface DisplaySettings {
  theme: ThemeMode;
  dateFormat: DateFormat;
  units: MeasurementUnits;
}

/**
 * Offline/Sync settings
 */
export interface OfflineSettings {
  autoSyncInterval: SyncInterval;
  dataRetention: RetentionPeriod;
  photoQuality: PhotoQuality;
  syncOnWifiOnly: boolean;
}

/**
 * Complete settings state
 */
export interface SettingsState {
  notifications: NotificationSettings;
  display: DisplaySettings;
  offline: OfflineSettings;
  isLoaded: boolean;
  lastUpdated: string | null;
}

/**
 * Default notification settings
 */
const defaultNotifications: NotificationSettings = {
  emailWeatherAlerts: true,
  emailInspectionReminders: true,
  emailFormConfirmations: true,
  emailWeeklySummary: false,
  pushRealTimeAlerts: true,
  pushInspectionReminders: true,
};

/**
 * Default display settings
 */
const defaultDisplay: DisplaySettings = {
  theme: 'system',
  dateFormat: 'MM/DD/YYYY',
  units: 'imperial',
};

/**
 * Default offline settings
 */
const defaultOffline: OfflineSettings = {
  autoSyncInterval: 15,
  dataRetention: 30,
  photoQuality: 'high',
  syncOnWifiOnly: false,
};

/**
 * localStorage key for settings
 */
const STORAGE_KEY = 'braveforms_settings';

/**
 * Load settings from localStorage
 */
function loadFromStorage(): Partial<SettingsState> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load settings from localStorage:', error);
  }

  return {};
}

/**
 * Save settings to localStorage
 */
function saveToStorage(state: SettingsState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * Initial state with defaults merged with stored values
 */
const storedSettings = loadFromStorage();

/**
 * Settings store using Valtio
 */
export const settingsStore = proxy<SettingsState>({
  notifications: {
    ...defaultNotifications,
    ...(storedSettings.notifications || {}),
  },
  display: {
    ...defaultDisplay,
    ...(storedSettings.display || {}),
  },
  offline: {
    ...defaultOffline,
    ...(storedSettings.offline || {}),
  },
  isLoaded: true,
  lastUpdated: storedSettings.lastUpdated || null,
});

// Subscribe to changes and persist to localStorage
if (typeof window !== 'undefined') {
  subscribe(settingsStore, () => {
    settingsStore.lastUpdated = new Date().toISOString();
    saveToStorage(settingsStore);
  });
}

// ============================================================================
// Notification Settings Actions
// ============================================================================

/**
 * Update a notification setting
 */
export function updateNotificationSetting<K extends keyof NotificationSettings>(
  key: K,
  value: NotificationSettings[K]
): void {
  settingsStore.notifications[key] = value;
}

/**
 * Update all notification settings
 */
export function updateNotificationSettings(settings: Partial<NotificationSettings>): void {
  Object.assign(settingsStore.notifications, settings);
}

/**
 * Reset notification settings to defaults
 */
export function resetNotificationSettings(): void {
  Object.assign(settingsStore.notifications, defaultNotifications);
}

// ============================================================================
// Display Settings Actions
// ============================================================================

/**
 * Update theme
 */
export function setTheme(theme: ThemeMode): void {
  settingsStore.display.theme = theme;
}

/**
 * Update date format
 */
export function setDateFormat(format: DateFormat): void {
  settingsStore.display.dateFormat = format;
}

/**
 * Update measurement units
 */
export function setUnits(units: MeasurementUnits): void {
  settingsStore.display.units = units;
}

/**
 * Update all display settings
 */
export function updateDisplaySettings(settings: Partial<DisplaySettings>): void {
  Object.assign(settingsStore.display, settings);
}

/**
 * Reset display settings to defaults
 */
export function resetDisplaySettings(): void {
  Object.assign(settingsStore.display, defaultDisplay);
}

// ============================================================================
// Offline Settings Actions
// ============================================================================

/**
 * Update auto-sync interval
 */
export function setSyncInterval(interval: SyncInterval): void {
  settingsStore.offline.autoSyncInterval = interval;
}

/**
 * Update data retention period
 */
export function setDataRetention(period: RetentionPeriod): void {
  settingsStore.offline.dataRetention = period;
}

/**
 * Update photo quality
 */
export function setPhotoQuality(quality: PhotoQuality): void {
  settingsStore.offline.photoQuality = quality;
}

/**
 * Update sync on wifi only
 */
export function setSyncOnWifiOnly(wifiOnly: boolean): void {
  settingsStore.offline.syncOnWifiOnly = wifiOnly;
}

/**
 * Update all offline settings
 */
export function updateOfflineSettings(settings: Partial<OfflineSettings>): void {
  Object.assign(settingsStore.offline, settings);
}

/**
 * Reset offline settings to defaults
 */
export function resetOfflineSettings(): void {
  Object.assign(settingsStore.offline, defaultOffline);
}

// ============================================================================
// Global Actions
// ============================================================================

/**
 * Reset all settings to defaults
 */
export function resetAllSettings(): void {
  resetNotificationSettings();
  resetDisplaySettings();
  resetOfflineSettings();
}

/**
 * Export settings as JSON
 */
export function exportSettings(): string {
  return JSON.stringify(settingsStore, null, 2);
}

/**
 * Import settings from JSON
 */
export function importSettings(json: string): boolean {
  try {
    const imported = JSON.parse(json);
    if (imported.notifications) {
      Object.assign(settingsStore.notifications, imported.notifications);
    }
    if (imported.display) {
      Object.assign(settingsStore.display, imported.display);
    }
    if (imported.offline) {
      Object.assign(settingsStore.offline, imported.offline);
    }
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to import settings:', error);
    return false;
  }
}
