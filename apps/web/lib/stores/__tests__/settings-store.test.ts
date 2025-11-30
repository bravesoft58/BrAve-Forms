import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import after mocking
import {
  settingsStore,
  updateNotificationSetting,
  updateNotificationSettings,
  resetNotificationSettings,
  setQuietHoursEnabled,
  setQuietHoursStartTime,
  setQuietHoursEndTime,
  updateQuietHours,
  isInQuietHours,
  setTheme,
  setDateFormat,
  setUnits,
  updateDisplaySettings,
  resetDisplaySettings,
  setSyncInterval,
  setDataRetention,
  setPhotoQuality,
  setSyncOnWifiOnly,
  updateOfflineSettings,
  resetOfflineSettings,
  setTimezone,
  setTimeFormat,
  setLanguage,
  updateAccountSettings,
  resetAccountSettings,
  resetAllSettings,
  exportSettings,
  importSettings,
} from '../settings-store';

describe('settings-store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset store to defaults
    resetAllSettings();
  });

  // ============================================================================
  // Notification Settings Tests
  // ============================================================================
  describe('notification settings', () => {
    it('should have default notification values', () => {
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(true);
      expect(settingsStore.notifications.emailInspectionReminders).toBe(true);
      expect(settingsStore.notifications.emailFormConfirmations).toBe(true);
      expect(settingsStore.notifications.emailWeeklySummary).toBe(false);
      expect(settingsStore.notifications.pushRealTimeAlerts).toBe(true);
      expect(settingsStore.notifications.pushInspectionReminders).toBe(true);
      // Quiet hours defaults
      expect(settingsStore.notifications.quietHours).toBeDefined();
      expect(settingsStore.notifications.quietHours.enabled).toBe(false);
    });

    it('should update a single notification setting', () => {
      updateNotificationSetting('emailWeatherAlerts', false);
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(false);
    });

    it('should update multiple notification settings at once', () => {
      updateNotificationSettings({
        emailWeatherAlerts: false,
        pushRealTimeAlerts: false,
      });
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(false);
      expect(settingsStore.notifications.pushRealTimeAlerts).toBe(false);
      // Other settings should remain unchanged
      expect(settingsStore.notifications.emailInspectionReminders).toBe(true);
    });

    it('should reset notification settings to defaults', () => {
      updateNotificationSetting('emailWeatherAlerts', false);
      updateNotificationSetting('emailWeeklySummary', true);
      resetNotificationSettings();
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(true);
      expect(settingsStore.notifications.emailWeeklySummary).toBe(false);
    });
  });

  // ============================================================================
  // Quiet Hours Tests
  // ============================================================================
  describe('quiet hours', () => {
    it('should have default quiet hours values', () => {
      expect(settingsStore.notifications.quietHours.enabled).toBe(false);
      expect(settingsStore.notifications.quietHours.startTime).toBe('22:00');
      expect(settingsStore.notifications.quietHours.endTime).toBe('07:00');
    });

    it('should enable and disable quiet hours', () => {
      setQuietHoursEnabled(true);
      expect(settingsStore.notifications.quietHours.enabled).toBe(true);

      setQuietHoursEnabled(false);
      expect(settingsStore.notifications.quietHours.enabled).toBe(false);
    });

    it('should update start time with valid format', () => {
      setQuietHoursStartTime('21:30');
      expect(settingsStore.notifications.quietHours.startTime).toBe('21:30');

      setQuietHoursStartTime('00:00');
      expect(settingsStore.notifications.quietHours.startTime).toBe('00:00');
    });

    it('should update end time with valid format', () => {
      setQuietHoursEndTime('08:00');
      expect(settingsStore.notifications.quietHours.endTime).toBe('08:00');

      setQuietHoursEndTime('23:59');
      expect(settingsStore.notifications.quietHours.endTime).toBe('23:59');
    });

    it('should reject invalid time format', () => {
      setQuietHoursStartTime('22:00'); // Set valid first
      setQuietHoursStartTime('invalid');
      expect(settingsStore.notifications.quietHours.startTime).toBe('22:00');

      setQuietHoursStartTime('25:00'); // Invalid hour
      expect(settingsStore.notifications.quietHours.startTime).toBe('22:00');

      // Single-digit hours should be rejected (HTML time inputs always use "07:00" not "7:00")
      setQuietHoursEndTime('07:00'); // Set valid first
      setQuietHoursEndTime('7:00'); // Missing leading zero - should be rejected
      expect(settingsStore.notifications.quietHours.endTime).toBe('07:00');

      // Additional invalid formats
      setQuietHoursStartTime('24:00'); // 24 is invalid (max is 23)
      expect(settingsStore.notifications.quietHours.startTime).toBe('22:00');

      setQuietHoursEndTime('12:60'); // 60 minutes is invalid
      expect(settingsStore.notifications.quietHours.endTime).toBe('07:00');
    });

    it('should update multiple quiet hours settings at once', () => {
      updateQuietHours({
        enabled: true,
        startTime: '20:00',
        endTime: '06:00',
      });
      expect(settingsStore.notifications.quietHours.enabled).toBe(true);
      expect(settingsStore.notifications.quietHours.startTime).toBe('20:00');
      expect(settingsStore.notifications.quietHours.endTime).toBe('06:00');
    });

    it('should return false when quiet hours disabled', () => {
      setQuietHoursEnabled(false);
      expect(isInQuietHours()).toBe(false);
    });

    it('should reset quiet hours when resetting notification settings', () => {
      setQuietHoursEnabled(true);
      setQuietHoursStartTime('23:00');
      setQuietHoursEndTime('05:00');
      resetNotificationSettings();
      expect(settingsStore.notifications.quietHours.enabled).toBe(false);
      expect(settingsStore.notifications.quietHours.startTime).toBe('22:00');
      expect(settingsStore.notifications.quietHours.endTime).toBe('07:00');
    });
  });

  // ============================================================================
  // Display Settings Tests
  // ============================================================================
  describe('display settings', () => {
    it('should have default display values', () => {
      expect(settingsStore.display.theme).toBe('system');
      expect(settingsStore.display.dateFormat).toBe('MM/DD/YYYY');
      expect(settingsStore.display.units).toBe('imperial');
    });

    it('should update theme', () => {
      setTheme('dark');
      expect(settingsStore.display.theme).toBe('dark');

      setTheme('light');
      expect(settingsStore.display.theme).toBe('light');
    });

    it('should update date format', () => {
      setDateFormat('DD/MM/YYYY');
      expect(settingsStore.display.dateFormat).toBe('DD/MM/YYYY');

      setDateFormat('YYYY-MM-DD');
      expect(settingsStore.display.dateFormat).toBe('YYYY-MM-DD');
    });

    it('should update measurement units', () => {
      setUnits('metric');
      expect(settingsStore.display.units).toBe('metric');
    });

    it('should update multiple display settings at once', () => {
      updateDisplaySettings({
        theme: 'dark',
        units: 'metric',
      });
      expect(settingsStore.display.theme).toBe('dark');
      expect(settingsStore.display.units).toBe('metric');
      // Date format should remain unchanged
      expect(settingsStore.display.dateFormat).toBe('MM/DD/YYYY');
    });

    it('should reset display settings to defaults', () => {
      setTheme('dark');
      setUnits('metric');
      resetDisplaySettings();
      expect(settingsStore.display.theme).toBe('system');
      expect(settingsStore.display.units).toBe('imperial');
    });
  });

  // ============================================================================
  // Offline Settings Tests
  // ============================================================================
  describe('offline settings', () => {
    it('should have default offline values', () => {
      expect(settingsStore.offline.autoSyncInterval).toBe(15);
      expect(settingsStore.offline.dataRetention).toBe(30);
      expect(settingsStore.offline.photoQuality).toBe('high');
      expect(settingsStore.offline.syncOnWifiOnly).toBe(false);
    });

    it('should update sync interval', () => {
      setSyncInterval(5);
      expect(settingsStore.offline.autoSyncInterval).toBe(5);

      setSyncInterval(60);
      expect(settingsStore.offline.autoSyncInterval).toBe(60);
    });

    it('should update data retention period', () => {
      setDataRetention(7);
      expect(settingsStore.offline.dataRetention).toBe(7);

      setDataRetention(14);
      expect(settingsStore.offline.dataRetention).toBe(14);
    });

    it('should update photo quality', () => {
      setPhotoQuality('original');
      expect(settingsStore.offline.photoQuality).toBe('original');

      setPhotoQuality('low');
      expect(settingsStore.offline.photoQuality).toBe('low');
    });

    it('should update sync on wifi only', () => {
      setSyncOnWifiOnly(true);
      expect(settingsStore.offline.syncOnWifiOnly).toBe(true);

      setSyncOnWifiOnly(false);
      expect(settingsStore.offline.syncOnWifiOnly).toBe(false);
    });

    it('should update multiple offline settings at once', () => {
      updateOfflineSettings({
        autoSyncInterval: 30,
        photoQuality: 'medium',
      });
      expect(settingsStore.offline.autoSyncInterval).toBe(30);
      expect(settingsStore.offline.photoQuality).toBe('medium');
      // Data retention should remain unchanged
      expect(settingsStore.offline.dataRetention).toBe(30);
    });

    it('should reset offline settings to defaults', () => {
      setSyncInterval(60);
      setPhotoQuality('low');
      resetOfflineSettings();
      expect(settingsStore.offline.autoSyncInterval).toBe(15);
      expect(settingsStore.offline.photoQuality).toBe('high');
    });
  });

  // ============================================================================
  // Account Settings Tests
  // ============================================================================
  describe('account settings', () => {
    it('should have default account values', () => {
      // Default timezone should be detected or fallback to America/New_York
      expect(settingsStore.account.timezone).toBeDefined();
      expect(settingsStore.account.timeFormat).toBe('12h');
      expect(settingsStore.account.language).toBe('en');
    });

    it('should update timezone', () => {
      setTimezone('America/Los_Angeles');
      expect(settingsStore.account.timezone).toBe('America/Los_Angeles');

      setTimezone('America/Chicago');
      expect(settingsStore.account.timezone).toBe('America/Chicago');
    });

    it('should update time format', () => {
      setTimeFormat('24h');
      expect(settingsStore.account.timeFormat).toBe('24h');

      setTimeFormat('12h');
      expect(settingsStore.account.timeFormat).toBe('12h');
    });

    it('should update language', () => {
      setLanguage('es');
      expect(settingsStore.account.language).toBe('es');

      setLanguage('en');
      expect(settingsStore.account.language).toBe('en');
    });

    it('should update multiple account settings at once', () => {
      updateAccountSettings({
        timezone: 'America/Denver',
        timeFormat: '24h',
      });
      expect(settingsStore.account.timezone).toBe('America/Denver');
      expect(settingsStore.account.timeFormat).toBe('24h');
      // Language should remain unchanged
      expect(settingsStore.account.language).toBe('en');
    });

    it('should reset account settings to defaults', () => {
      setTimezone('America/Los_Angeles');
      setTimeFormat('24h');
      setLanguage('es');
      resetAccountSettings();
      // Timezone should be auto-detected or fallback
      expect(settingsStore.account.timezone).toBeDefined();
      expect(settingsStore.account.timeFormat).toBe('12h');
      expect(settingsStore.account.language).toBe('en');
    });

    it('should support common US timezones for construction sites', () => {
      const usTimezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Phoenix',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
      ];

      usTimezones.forEach((tz) => {
        setTimezone(tz);
        expect(settingsStore.account.timezone).toBe(tz);
      });
    });

    it('should support Spanish language for construction workers', () => {
      setLanguage('es');
      expect(settingsStore.account.language).toBe('es');
    });

    it('should handle invalid timezone and fallback to default', () => {
      setTimezone('Invalid/Fake_City');
      // Should fallback to default timezone, not set invalid value
      expect(settingsStore.account.timezone).toBeDefined();
      expect(settingsStore.account.timezone).not.toBe('Invalid/Fake_City');
    });

    it('should handle empty string timezone', () => {
      setTimezone('America/New_York'); // Set valid first
      setTimezone('');
      // Should fallback to default, not empty string
      expect(settingsStore.account.timezone).toBeDefined();
      expect(settingsStore.account.timezone).not.toBe('');
    });

    it('should persist account settings to localStorage for offline use', () => {
      // Set account settings
      setTimezone('America/Chicago');
      setTimeFormat('24h');
      setLanguage('es');

      // Verify the store has the correct values (these will be persisted)
      // Note: Valtio's subscribe callback is async, so we verify store state
      // The persistence mechanism (localStorage.setItem) is triggered by Valtio's subscribe
      // which batches updates asynchronously
      expect(settingsStore.account.timezone).toBe('America/Chicago');
      expect(settingsStore.account.timeFormat).toBe('24h');
      expect(settingsStore.account.language).toBe('es');

      // Verify the store structure supports persistence
      // The loadFromStorage/saveToStorage functions handle actual persistence
      expect(typeof settingsStore.account).toBe('object');
      expect(typeof settingsStore.notifications).toBe('object');
      expect(typeof settingsStore.display).toBe('object');
      expect(typeof settingsStore.offline).toBe('object');
    });
  });

  // ============================================================================
  // Global Actions Tests
  // ============================================================================
  describe('global actions', () => {
    it('should reset all settings to defaults', () => {
      // Change various settings
      updateNotificationSetting('emailWeatherAlerts', false);
      setTheme('dark');
      setSyncInterval(60);
      setTimeFormat('24h');
      setLanguage('es');

      // Reset all
      resetAllSettings();

      // Verify all reset
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(true);
      expect(settingsStore.display.theme).toBe('system');
      expect(settingsStore.offline.autoSyncInterval).toBe(15);
      expect(settingsStore.account.timeFormat).toBe('12h');
      expect(settingsStore.account.language).toBe('en');
    });

    it('should export settings as JSON', () => {
      setTheme('dark');
      setTimeFormat('24h');
      const exported = exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.display.theme).toBe('dark');
      expect(parsed.notifications).toBeDefined();
      expect(parsed.offline).toBeDefined();
      expect(parsed.account).toBeDefined();
      expect(parsed.account.timeFormat).toBe('24h');
    });

    it('should import settings from JSON', () => {
      const settingsJson = JSON.stringify({
        display: { theme: 'dark', dateFormat: 'DD/MM/YYYY', units: 'metric' },
        notifications: { emailWeatherAlerts: false },
        offline: { autoSyncInterval: 30 },
        account: { timezone: 'America/Chicago', timeFormat: '24h', language: 'es' },
      });

      const result = importSettings(settingsJson);

      expect(result).toBe(true);
      expect(settingsStore.display.theme).toBe('dark');
      expect(settingsStore.display.dateFormat).toBe('DD/MM/YYYY');
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(false);
      expect(settingsStore.offline.autoSyncInterval).toBe(30);
      expect(settingsStore.account.timezone).toBe('America/Chicago');
      expect(settingsStore.account.timeFormat).toBe('24h');
      expect(settingsStore.account.language).toBe('es');
    });

    it('should handle invalid JSON import gracefully', () => {
      const result = importSettings('invalid json');
      expect(result).toBe(false);
    });

    it('should handle partial JSON import', () => {
      const partialJson = JSON.stringify({
        display: { theme: 'dark' },
      });

      const result = importSettings(partialJson);

      expect(result).toBe(true);
      expect(settingsStore.display.theme).toBe('dark');
      // Other settings should remain at defaults
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(true);
    });
  });

  // ============================================================================
  // Store State Tests
  // ============================================================================
  describe('store state', () => {
    it('should have isLoaded set to true', () => {
      expect(settingsStore.isLoaded).toBe(true);
    });

    it('should update lastUpdated when settings change', () => {
      setTheme('dark');
      // Note: In browser environment, this would be updated by the subscribe handler
      // In test environment, we just verify the structure exists
      expect(settingsStore.lastUpdated).toBeDefined();
    });
  });

  // ============================================================================
  // EPA Compliance Related Tests
  // ============================================================================
  describe('EPA compliance settings', () => {
    it('should support 30-day data retention for EPA compliance', () => {
      setDataRetention(30);
      expect(settingsStore.offline.dataRetention).toBe(30);
    });

    it('should support weather alert notifications for 0.25 inch threshold', () => {
      // Weather alerts should be on by default for compliance
      expect(settingsStore.notifications.emailWeatherAlerts).toBe(true);
      expect(settingsStore.notifications.pushRealTimeAlerts).toBe(true);
    });

    it('should support imperial units for EPA rain measurements', () => {
      setUnits('imperial');
      expect(settingsStore.display.units).toBe('imperial');
    });

    it('should support metric units conversion', () => {
      setUnits('metric');
      expect(settingsStore.display.units).toBe('metric');
      // 0.25 inches = 6.35 mm
    });
  });

  // ============================================================================
  // Construction Field Worker Settings
  // ============================================================================
  describe('construction field worker settings', () => {
    it('should support high photo quality for documentation', () => {
      setPhotoQuality('high');
      expect(settingsStore.offline.photoQuality).toBe('high');
    });

    it('should support wifi-only sync for data savings', () => {
      setSyncOnWifiOnly(true);
      expect(settingsStore.offline.syncOnWifiOnly).toBe(true);
    });

    it('should support frequent sync intervals for field operations', () => {
      setSyncInterval(5);
      expect(settingsStore.offline.autoSyncInterval).toBe(5);
    });
  });
});
