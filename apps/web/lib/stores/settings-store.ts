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
 * Time format options
 */
export type TimeFormat = '12h' | '24h';

/**
 * Language options
 */
export type Language = 'en' | 'es';

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
 * Quiet hours settings for pausing non-critical notifications
 */
export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // HH:mm format (e.g., "22:00")
  endTime: string; // HH:mm format (e.g., "07:00")
}

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
  quietHours: QuietHoursSettings;
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
 * Account/Regional settings
 */
export interface AccountSettings {
  timezone: string;
  timeFormat: TimeFormat;
  language: Language;
}

/**
 * Complete settings state
 */
export interface SettingsState {
  notifications: NotificationSettings;
  display: DisplaySettings;
  offline: OfflineSettings;
  account: AccountSettings;
  isLoaded: boolean;
  lastUpdated: string | null;
}

/**
 * Default quiet hours settings
 */
const defaultQuietHours: QuietHoursSettings = {
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
};

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
  quietHours: defaultQuietHours,
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
 * Get default timezone using Intl API
 */
function getDefaultTimezone(): string {
  if (typeof window !== 'undefined') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/New_York';
    }
  }
  return 'America/New_York';
}

/**
 * Default account settings
 */
const defaultAccount: AccountSettings = {
  timezone: getDefaultTimezone(),
  timeFormat: '12h',
  language: 'en',
};

/**
 * localStorage key for settings
 */
const STORAGE_KEY = 'braveforms_settings';

/**
 * Validate time format (HH:mm with leading zeros required)
 * HTML time inputs always produce this format (e.g., "07:00" not "7:00")
 * Defined here for use in loadFromStorage validation
 */
const VALID_TIME_FORMAT = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Load settings from localStorage with validation
 * Validates quiet hours times to prevent corrupted data from breaking the app
 */
function loadFromStorage(): Partial<SettingsState> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Validate quiet hours times - fallback to defaults if corrupted
      if (parsed.notifications?.quietHours) {
        const qh = parsed.notifications.quietHours;
        if (qh.startTime && !VALID_TIME_FORMAT.test(qh.startTime)) {
          qh.startTime = defaultQuietHours.startTime;
        }
        if (qh.endTime && !VALID_TIME_FORMAT.test(qh.endTime)) {
          qh.endTime = defaultQuietHours.endTime;
        }
      }

      return parsed;
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
  account: {
    ...defaultAccount,
    ...(storedSettings.account || {}),
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
 * Note: quietHours requires explicit deep copy because Object.assign only does shallow copy.
 * Without this, the nested quietHours object would retain references to modified values.
 */
export function resetNotificationSettings(): void {
  Object.assign(settingsStore.notifications, {
    ...defaultNotifications,
    quietHours: { ...defaultQuietHours },
  });
}

/**
 * Enable or disable quiet hours
 */
export function setQuietHoursEnabled(enabled: boolean): void {
  settingsStore.notifications.quietHours.enabled = enabled;
}

/**
 * Set quiet hours start time
 * @param time - HH:mm format with leading zeros (e.g., "22:00", "07:00")
 */
export function setQuietHoursStartTime(time: string): void {
  if (VALID_TIME_FORMAT.test(time)) {
    settingsStore.notifications.quietHours.startTime = time;
  }
}

/**
 * Set quiet hours end time
 * @param time - HH:mm format with leading zeros (e.g., "07:00", "22:00")
 */
export function setQuietHoursEndTime(time: string): void {
  if (VALID_TIME_FORMAT.test(time)) {
    settingsStore.notifications.quietHours.endTime = time;
  }
}

/**
 * Update all quiet hours settings at once
 */
export function updateQuietHours(settings: Partial<QuietHoursSettings>): void {
  Object.assign(settingsStore.notifications.quietHours, settings);
}

/**
 * Check if current time is within quiet hours
 * Note: Compliance alerts (weather, inspection deadlines) bypass quiet hours
 * @returns true if notifications should be suppressed
 */
export function isInQuietHours(): boolean {
  const { enabled, startTime, endTime } = settingsStore.notifications.quietHours;
  if (!enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Same day quiet hours (e.g., 13:00 to 14:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
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
// Account Settings Actions
// ============================================================================

/**
 * Validate timezone string using Intl API
 * @param timezone - IANA timezone identifier to validate
 * @returns true if valid timezone, false otherwise
 */
function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Update timezone for inspection deadline calculations
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * Validates timezone before setting; falls back to default if invalid
 */
export function setTimezone(timezone: string): void {
  if (isValidTimezone(timezone)) {
    settingsStore.account.timezone = timezone;
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid timezone provided:', timezone);
    settingsStore.account.timezone = getDefaultTimezone();
  }
}

/**
 * Update time format
 */
export function setTimeFormat(format: TimeFormat): void {
  settingsStore.account.timeFormat = format;
}

/**
 * Update language
 */
export function setLanguage(language: Language): void {
  settingsStore.account.language = language;
}

/**
 * Update all account settings
 */
export function updateAccountSettings(settings: Partial<AccountSettings>): void {
  Object.assign(settingsStore.account, settings);
}

/**
 * Reset account settings to defaults
 */
export function resetAccountSettings(): void {
  Object.assign(settingsStore.account, {
    ...defaultAccount,
    timezone: getDefaultTimezone(),
  });
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
  resetAccountSettings();
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
    if (imported.account) {
      Object.assign(settingsStore.account, imported.account);
    }
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to import settings:', error);
    return false;
  }
}
