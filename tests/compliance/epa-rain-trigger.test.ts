/**
 * EPA Rain Trigger Compliance Tests
 * 
 * Critical: These tests validate the exact 0.25" rain threshold per EPA CGP requirements
 * Any changes to these thresholds could result in regulatory violations and fines
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComplianceEngine } from '../../apps/backend/src/modules/compliance/ComplianceEngine';
import { WeatherService } from '../../apps/backend/src/modules/weather/WeatherService';
import { NotificationService } from '../../apps/backend/src/modules/notifications/NotificationService';

// Mock external services
jest.mock('../../apps/backend/src/modules/weather/WeatherService');
jest.mock('../../apps/backend/src/modules/notifications/NotificationService');

describe('EPA Rain Trigger Compliance - Critical Tests', () => {
  let complianceEngine: ComplianceEngine;
  let weatherService: jest.Mocked<WeatherService>;
  let notificationService: jest.Mocked<NotificationService>;
  
  const testLocation = { lat: 40.7128, lng: -74.0060 }; // NYC coordinates
  const testProjectId = 'test-project-123';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    weatherService = new WeatherService() as jest.Mocked<WeatherService>;
    notificationService = new NotificationService() as jest.Mocked<NotificationService>;
    complianceEngine = new ComplianceEngine(weatherService, notificationService);
  });
  
  describe('EPA CGP 0.25" Rain Threshold - EXACT COMPLIANCE', () => {
    it('should trigger inspection for EXACTLY 0.25" precipitation', async () => {
      // CRITICAL: EPA CGP requires trigger at exactly 0.25", not approximate
      weatherService.getPrecipitation24h.mockResolvedValue(0.25);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeTruthy();
      expect(trigger.type).toBe('SWPPP_INSPECTION');
      expect(trigger.precipitationAmount).toBe(0.25);
      expect(trigger.threshold).toBe(0.25);
      expect(trigger.regulation).toBe('EPA_CGP_2022_SECTION_4_2');
      expect(trigger.deadline).toBeDefined();
    });
    
    it('should NOT trigger for 0.24" precipitation (below threshold)', async () => {
      // One hundredth below threshold should NOT trigger
      weatherService.getPrecipitation24h.mockResolvedValue(0.24);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeNull();
    });
    
    it('should trigger for 0.26" precipitation (above threshold)', async () => {
      // Any amount above 0.25" should trigger
      weatherService.getPrecipitation24h.mockResolvedValue(0.26);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeTruthy();
      expect(trigger.precipitationAmount).toBe(0.26);
    });
    
    it('should handle edge case: 0.249" vs 0.250"', async () => {
      // Test precise decimal handling
      weatherService.getPrecipitation24h.mockResolvedValue(0.249);
      let trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      expect(trigger).toBeNull();
      
      weatherService.getPrecipitation24h.mockResolvedValue(0.250);
      trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      expect(trigger).toBeTruthy();
    });
    
    it('should handle floating point precision correctly', async () => {
      // Test JavaScript floating point precision issues
      const testCases = [
        { precipitation: 0.1 + 0.15, expected: true }, // = 0.25 (should trigger)
        { precipitation: 0.24999999, expected: false }, // < 0.25 (should not trigger)
        { precipitation: 0.25000001, expected: true }   // > 0.25 (should trigger)
      ];
      
      for (const testCase of testCases) {
        weatherService.getPrecipitation24h.mockResolvedValue(testCase.precipitation);
        const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
        
        if (testCase.expected) {
          expect(trigger).toBeTruthy();
        } else {
          expect(trigger).toBeNull();
        }
      }
    });
  });
  
  describe('24-Hour Inspection Deadline - Working Hours', () => {
    beforeEach(() => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.25);
    });
    
    it('should calculate deadline within 24 working hours', async () => {
      const mockNow = new Date('2024-01-15T10:00:00Z'); // Monday 10 AM
      jest.useFakeTimers();
      jest.setSystemTime(mockNow);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger.deadline).toBeDefined();
      const deadlineHours = (trigger.deadline.getTime() - mockNow.getTime()) / (1000 * 60 * 60);
      expect(deadlineHours).toBeLessThanOrEqual(24);
      expect(deadlineHours).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });
    
    it('should adjust deadline for weekends (no weekend work)', async () => {
      const fridayEvening = new Date('2024-01-19T18:00:00Z'); // Friday 6 PM
      jest.useFakeTimers();
      jest.setSystemTime(fridayEvening);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      // Deadline should be Monday during working hours
      expect(trigger.deadline.getDay()).toBe(1); // Monday
      expect(trigger.deadline.getHours()).toBeGreaterThanOrEqual(7); // After 7 AM
      expect(trigger.deadline.getHours()).toBeLessThan(17); // Before 5 PM
      
      jest.useRealTimers();
    });
    
    it('should handle different time zones correctly', async () => {
      const projectsInDifferentZones = [
        { id: 'p1', tz: 'America/New_York' },
        { id: 'p2', tz: 'America/Los_Angeles' },
        { id: 'p3', tz: 'America/Chicago' }
      ];
      
      for (const project of projectsInDifferentZones) {
        const trigger = await complianceEngine.checkRainTrigger(
          project.id, 
          testLocation, 
          { timezone: project.tz }
        );
        
        // All deadlines should be 24 hours in their respective local time
        expect(trigger.deadline).toBeDefined();
        
        // Verify timezone is preserved in deadline calculation
        const deadlineInLocalTime = complianceEngine.convertToTimezone(
          trigger.deadline, 
          project.tz
        );
        
        expect(deadlineInLocalTime.getTimezoneOffset()).not.toBe(
          trigger.triggeredAt.getTimezoneOffset()
        );
      }
    });
  });
  
  describe('Multiple Rain Events Aggregation', () => {
    it('should aggregate multiple small events to reach threshold', async () => {
      const hourlyReadings = [
        { hour: 0, precipitation: 0.05 },
        { hour: 6, precipitation: 0.08 },
        { hour: 12, precipitation: 0.07 },
        { hour: 18, precipitation: 0.06 }
      ]; // Total: 0.26"
      
      weatherService.getHourlyPrecipitation24h.mockResolvedValue(hourlyReadings);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeTruthy();
      expect(trigger.precipitationAmount).toBe(0.26);
      expect(trigger.precipitationEvents).toHaveLength(4);
    });
    
    it('should NOT trigger when multiple events sum to 0.24"', async () => {
      const hourlyReadings = [
        { hour: 0, precipitation: 0.06 },
        { hour: 6, precipitation: 0.06 },
        { hour: 12, precipitation: 0.06 },
        { hour: 18, precipitation: 0.06 }
      ]; // Total: 0.24"
      
      weatherService.getHourlyPrecipitation24h.mockResolvedValue(hourlyReadings);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeNull();
    });
    
    it('should handle rain events across time zone boundaries', async () => {
      const readings = [
        { hour: 23, precipitation: 0.15, date: '2024-01-15' }, // 11 PM
        { hour: 1, precipitation: 0.12, date: '2024-01-16' }   // 1 AM next day
      ]; // Total: 0.27" within 24 hours
      
      weatherService.getHourlyPrecipitation24h.mockResolvedValue(readings);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeTruthy();
      expect(trigger.precipitationAmount).toBe(0.27);
    });
  });
  
  describe('Cooldown Period and Duplicate Prevention', () => {
    it('should not trigger twice within 24-hour cooldown', async () => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.30);
      
      // First trigger
      const trigger1 = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      expect(trigger1).toBeTruthy();
      
      // Second attempt within cooldown period
      const trigger2 = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      expect(trigger2).toBeNull();
      
      // Verify cooldown status
      const cooldownStatus = await complianceEngine.getCooldownStatus(testProjectId);
      expect(cooldownStatus.active).toBe(true);
      expect(cooldownStatus.remainingHours).toBeGreaterThan(0);
    });
    
    it('should allow new trigger after cooldown expires', async () => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.25);
      
      // First trigger
      await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      // Fast-forward 25 hours
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + (25 * 60 * 60 * 1000));
      
      // Second trigger should work
      const trigger2 = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      expect(trigger2).toBeTruthy();
      
      // Restore Date.now
      Date.now = originalNow;
    });
  });
  
  describe('Notification Requirements', () => {
    beforeEach(() => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.25);
    });
    
    it('should send high-priority notifications for rain triggers', async () => {
      await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(notificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'COMPLIANCE_REQUIRED',
          priority: 'HIGH',
          channels: ['push', 'sms', 'email'],
          title: expect.stringContaining('SWPPP Inspection Required'),
          message: expect.stringContaining('0.25'),
          projectId: testProjectId,
          deadline: expect.any(Date),
          regulatoryBasis: 'EPA_CGP_2022_SECTION_4_2'
        })
      );
    });
    
    it('should include GPS coordinates in notification', async () => {
      await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      const notificationCall = notificationService.send.mock.calls[0][0];
      expect(notificationCall.metadata.location).toEqual(testLocation);
    });
    
    it('should escalate notifications as deadline approaches', async () => {
      // Initial trigger
      await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      // Mock time progression to 2 hours before deadline
      const twoHoursBefore = new Date(Date.now() + 22 * 60 * 60 * 1000);
      jest.useFakeTimers();
      jest.setSystemTime(twoHoursBefore);
      
      // Trigger escalation check
      await complianceEngine.checkPendingDeadlines();
      
      expect(notificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DEADLINE_WARNING',
          priority: 'URGENT',
          channels: ['push', 'sms', 'email', 'phone'],
          title: expect.stringContaining('URGENT'),
          remainingHours: 2
        })
      );
      
      jest.useRealTimers();
    });
  });
  
  describe('Error Handling and Resilience', () => {
    it('should handle weather API failures gracefully', async () => {
      weatherService.getPrecipitation24h.mockRejectedValue(new Error('API Timeout'));
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger).toBeNull();
      
      // Should log error but not throw
      expect(complianceEngine.getLastError()).toMatch(/weather.*api.*timeout/i);
    });
    
    it('should validate location coordinates', async () => {
      const invalidLocations = [
        { lat: 91, lng: -74 }, // Invalid latitude
        { lat: 40, lng: 181 }, // Invalid longitude
        { lat: null, lng: -74 }, // Null values
        { lat: undefined, lng: undefined } // Undefined values
      ];
      
      for (const location of invalidLocations) {
        await expect(
          complianceEngine.checkRainTrigger(testProjectId, location)
        ).rejects.toThrow(/invalid.*location/i);
      }
    });
    
    it('should handle database connection failures', async () => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.25);
      
      // Mock database failure
      const saveTriggerSpy = jest.spyOn(complianceEngine, 'saveTrigger')
        .mockRejectedValue(new Error('Database connection lost'));
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      // Should still return trigger data but mark as unsaved
      expect(trigger).toBeTruthy();
      expect(trigger.saved).toBe(false);
      expect(trigger.error).toMatch(/database/i);
      
      saveTriggerSpy.mockRestore();
    });
  });
  
  describe('Audit Trail and Compliance Documentation', () => {
    it('should create detailed audit trail for each trigger', async () => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.28);
      
      const trigger = await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      expect(trigger.auditTrail).toEqual(
        expect.objectContaining({
          triggeredAt: expect.any(Date),
          precipitationAmount: 0.28,
          precipitationSource: 'WeatherService',
          threshold: 0.25,
          regulation: 'EPA_CGP_2022_SECTION_4_2',
          location: testLocation,
          calculationMethod: '24_HOUR_ROLLING_SUM',
          timezone: expect.any(String)
        })
      );
    });
    
    it('should maintain compliance status history', async () => {
      weatherService.getPrecipitation24h.mockResolvedValue(0.25);
      
      await complianceEngine.checkRainTrigger(testProjectId, testLocation);
      
      const complianceHistory = await complianceEngine.getComplianceHistory(testProjectId);
      
      expect(complianceHistory).toHaveLength(1);
      expect(complianceHistory[0]).toEqual(
        expect.objectContaining({
          type: 'RAIN_TRIGGER',
          status: 'PENDING_INSPECTION',
          createdAt: expect.any(Date),
          deadline: expect.any(Date),
          metadata: expect.objectContaining({
            precipitationAmount: 0.25,
            threshold: 0.25
          })
        })
      );
    });
  });
});

/**
 * Integration tests for real weather API
 * These tests should be run with actual weather services in CI/CD
 */
describe('EPA Rain Trigger - Integration Tests', () => {
  // These tests require actual API keys and should be skipped in unit test runs
  const skipIntegration = !process.env.INTEGRATION_TESTS;
  
  const describeOrSkip = skipIntegration ? describe.skip : describe;
  
  describeOrSkip('Real Weather API Integration', () => {
    let realComplianceEngine: ComplianceEngine;
    
    beforeEach(() => {
      const realWeatherService = new WeatherService({
        noaaApiKey: process.env.NOAA_API_KEY,
        openWeatherApiKey: process.env.OPENWEATHER_API_KEY
      });
      const realNotificationService = new NotificationService();
      
      realComplianceEngine = new ComplianceEngine(
        realWeatherService,
        realNotificationService
      );
    });
    
    it('should work with real NOAA weather data', async () => {
      // Test with known location that has weather data
      const denverLocation = { lat: 39.7392, lng: -104.9903 };
      
      const trigger = await realComplianceEngine.checkRainTrigger(
        'integration-test-project',
        denverLocation
      );
      
      // Should not throw and should return valid data structure
      expect(typeof trigger === 'object' || trigger === null).toBe(true);
      
      if (trigger) {
        expect(typeof trigger.precipitationAmount).toBe('number');
        expect(trigger.precipitationAmount).toBeGreaterThanOrEqual(0);
      }
    }, 30000); // 30 second timeout for real API calls
  });
});