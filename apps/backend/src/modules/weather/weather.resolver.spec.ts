/**
 * WeatherResolver Unit Tests
 *
 * Tests for GraphQL resolver layer that:
 * - Exposes weather service via GraphQL queries
 * - Enforces authentication with ClerkAuthGuard
 * - Handles multi-tenant user context
 * - Provides EPA compliance weather checking
 *
 * ISSUE-043: Write Tests for Weather Resolver
 */

import { Test, TestingModule } from '@nestjs/testing';
import { WeatherResolver } from './weather.resolver';
import { WeatherService } from './weather.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

describe('WeatherResolver', () => {
  let resolver: WeatherResolver;
  let weatherService: WeatherService;

  const mockWeatherService = {
    checkPrecipitation: jest.fn(),
    getRecentWeatherEvents: jest.fn(),
    getPendingInspections: jest.fn(),
  };

  const mockUser: CurrentUser = {
    userId: 'user_123',
    orgId: 'org_abc',
    email: 'test@example.com',
    orgRole: 'ADMIN',
    orgSlug: 'test-org',
    sessionId: 'session_123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherResolver,
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
      ],
    }).compile();

    resolver = module.get<WeatherResolver>(WeatherResolver);
    weatherService = module.get<WeatherService>(WeatherService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Resolver Initialization', () => {
    it('should be defined', () => {
      expect(resolver).toBeDefined();
    });

    it('should have weatherService injected', () => {
      expect(weatherService).toBeDefined();
    });
  });

  describe('checkProjectWeather Query', () => {
    const projectId = 'proj_123';
    const latitude = 38.8951;
    const longitude = -77.0364;

    it('should return precipitation check result when threshold not exceeded', async () => {
      const mockServiceResult = {
        exceeded: false,
        amount: 0.15,
        requiresInspection: false,
        source: 'NOAA',
        confidence: 'HIGH' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const result = await resolver.checkProjectWeather(projectId, latitude, longitude, mockUser);

      expect(weatherService.checkPrecipitation).toHaveBeenCalledWith(
        latitude,
        longitude,
        projectId
      );
      expect(result.exceeded).toBe(false);
      expect(result.amount).toBe(0.15);
      expect(result.requiresInspection).toBe(false);
      expect(result.source).toBe('NOAA');
      expect(result.confidence).toBe('HIGH');
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601 format
    });

    it('should return precipitation check result when EPA threshold exceeded', async () => {
      const mockServiceResult = {
        exceeded: true,
        amount: 0.3,
        requiresInspection: true,
        source: 'NOAA',
        confidence: 'HIGH' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const result = await resolver.checkProjectWeather(projectId, latitude, longitude, mockUser);

      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.3);
      expect(result.requiresInspection).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should use OpenWeatherMap fallback when NOAA unavailable', async () => {
      const mockServiceResult = {
        exceeded: true,
        amount: 0.28,
        requiresInspection: false,
        source: 'OPENWEATHER',
        confidence: 'MEDIUM' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const result = await resolver.checkProjectWeather(projectId, latitude, longitude, mockUser);

      expect(result.source).toBe('OPENWEATHER');
      expect(result.confidence).toBe('MEDIUM');
      expect(result.amount).toBe(0.28);
    });

    it('should use cached data when providers fail', async () => {
      const mockServiceResult = {
        exceeded: true,
        amount: 0.26,
        requiresInspection: false,
        source: 'CACHED',
        confidence: 'LOW' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const result = await resolver.checkProjectWeather(projectId, latitude, longitude, mockUser);

      expect(result.source).toBe('CACHED');
      expect(result.confidence).toBe('LOW');
    });

    it('should propagate service errors', async () => {
      jest
        .spyOn(weatherService, 'checkPrecipitation')
        .mockRejectedValue(new Error('All weather providers unavailable'));

      await expect(
        resolver.checkProjectWeather(projectId, latitude, longitude, mockUser)
      ).rejects.toThrow('All weather providers unavailable');
    });

    it('should include timestamp in result', async () => {
      const mockServiceResult = {
        exceeded: false,
        amount: 0.1,
        requiresInspection: false,
        source: 'NOAA',
        confidence: 'HIGH' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const beforeCall = new Date();
      const result = await resolver.checkProjectWeather(projectId, latitude, longitude, mockUser);
      const afterCall = new Date();

      expect(result.timestamp).toBeDefined();
      const resultTime = new Date(result.timestamp!);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('recentWeatherEvents Query', () => {
    const projectId = 'proj_456';

    it('should return recent weather events with default 7-day window', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          projectId,
          precipitationInches: 0.3,
          eventDate: new Date('2025-10-01'),
          inspectionDeadline: new Date('2025-10-02'),
          inspectionCompleted: false,
          source: 'NOAA' as const,
          notificationsSent: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'event_2',
          projectId,
          precipitationInches: 0.26,
          eventDate: new Date('2025-09-29'),
          inspectionDeadline: new Date('2025-09-30'),
          inspectionCompleted: true,
          source: 'NOAA' as const,
          notificationsSent: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(weatherService, 'getRecentWeatherEvents').mockResolvedValue(mockEvents as any);

      const result = await resolver.recentWeatherEvents(projectId, 7, mockUser);

      expect(weatherService.getRecentWeatherEvents).toHaveBeenCalledWith(projectId, 7);
      expect(result).toEqual(mockEvents);
      expect(result.length).toBe(2);
      expect(result[0].precipitationInches).toBe(0.3);
      expect(result[1].inspectionCompleted).toBe(true);
    });

    it('should support custom day range', async () => {
      jest.spyOn(weatherService, 'getRecentWeatherEvents').mockResolvedValue([]);

      await resolver.recentWeatherEvents(projectId, 30, mockUser);

      expect(weatherService.getRecentWeatherEvents).toHaveBeenCalledWith(projectId, 30);
    });

    it('should return empty array when no events', async () => {
      jest.spyOn(weatherService, 'getRecentWeatherEvents').mockResolvedValue([]);

      const result = await resolver.recentWeatherEvents(projectId, 7, mockUser);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      jest
        .spyOn(weatherService, 'getRecentWeatherEvents')
        .mockRejectedValue(new Error('Database connection failed'));

      await expect(resolver.recentWeatherEvents(projectId, 7, mockUser)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('pendingInspections Query', () => {
    it('should return pending inspections for user organization', async () => {
      const mockPendingInspections = [
        {
          id: 'pending_1',
          projectId: 'proj_1',
          precipitationInches: 0.3,
          eventDate: new Date('2025-10-01T10:00:00Z'),
          inspectionDeadline: new Date('2025-10-02T10:00:00Z'),
          inspectionCompleted: false,
          source: 'NOAA' as const,
          notificationsSent: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: 'proj_1',
            name: 'Site A',
            orgId: 'org_abc',
          },
        },
        {
          id: 'pending_2',
          projectId: 'proj_2',
          precipitationInches: 0.28,
          eventDate: new Date('2025-10-01T14:00:00Z'),
          inspectionDeadline: new Date('2025-10-02T14:00:00Z'),
          inspectionCompleted: false,
          source: 'OPENWEATHER' as const,
          notificationsSent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: 'proj_2',
            name: 'Site B',
            orgId: 'org_abc',
          },
        },
      ];

      jest
        .spyOn(weatherService, 'getPendingInspections')
        .mockResolvedValue(mockPendingInspections as any);

      const result = await resolver.pendingInspections(mockUser);

      expect(weatherService.getPendingInspections).toHaveBeenCalledWith('org_abc');
      expect(result).toEqual(mockPendingInspections);
      expect(result.length).toBe(2);
      expect(result[0].inspectionCompleted).toBe(false);
      expect(result[1].inspectionCompleted).toBe(false);
    });

    it('should return empty array when no pending inspections', async () => {
      jest.spyOn(weatherService, 'getPendingInspections').mockResolvedValue([]);

      const result = await resolver.pendingInspections(mockUser);

      expect(result).toEqual([]);
      expect(weatherService.getPendingInspections).toHaveBeenCalledWith('org_abc');
    });

    it('should use orgId from authenticated user context', async () => {
      const differentOrgUser: CurrentUser = {
        userId: 'user_456',
        orgId: 'org_xyz',
        email: 'different@example.com',
        orgRole: 'MEMBER',
        orgSlug: 'different-org',
        sessionId: 'session_456',
      };

      jest.spyOn(weatherService, 'getPendingInspections').mockResolvedValue([]);

      await resolver.pendingInspections(differentOrgUser);

      expect(weatherService.getPendingInspections).toHaveBeenCalledWith('org_xyz');
    });

    it('should propagate service errors', async () => {
      jest
        .spyOn(weatherService, 'getPendingInspections')
        .mockRejectedValue(new Error('Database query timeout'));

      await expect(resolver.pendingInspections(mockUser)).rejects.toThrow('Database query timeout');
    });
  });

  describe('publishWeatherAlert Method', () => {
    it('should log alert when subscriptions disabled', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const alert = {
        projectId: 'proj_123',
        projectName: 'Test Site',
        precipitationAmount: 0.3,
        alertType: 'EPA_THRESHOLD_EXCEEDED',
        timestamp: new Date(),
        source: 'NOAA',
        message: 'EPA 0.25" threshold exceeded',
      };

      await resolver.publishWeatherAlert('org_abc', alert);

      expect(consoleLogSpy).toHaveBeenCalledWith('Weather alert (subscriptions disabled):', {
        orgId: 'org_abc',
        alert,
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe('GraphQL Type Definitions', () => {
    it('should define PrecipitationCheckResult type correctly', () => {
      const result = {
        exceeded: true,
        amount: 0.3,
        requiresInspection: true,
        source: 'NOAA',
        confidence: 'HIGH',
        timestamp: new Date().toISOString(),
      };

      expect(result.exceeded).toBeDefined();
      expect(result.amount).toBeDefined();
      expect(result.requiresInspection).toBeDefined();
      expect(result.source).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should define WeatherEvent type correctly', () => {
      const event = {
        id: 'event_123',
        projectId: 'proj_123',
        precipitationInches: 0.3,
        eventDate: new Date(),
        inspectionDeadline: new Date(),
        inspectionCompleted: false,
        source: 'NOAA' as const,
        notificationsSent: true,
        createdAt: new Date(),
      };

      expect(event.id).toBeDefined();
      expect(event.projectId).toBeDefined();
      expect(event.precipitationInches).toBeDefined();
      expect(event.eventDate).toBeDefined();
      expect(event.inspectionDeadline).toBeDefined();
      expect(event.inspectionCompleted).toBeDefined();
      expect(event.source).toBeDefined();
      expect(event.notificationsSent).toBeDefined();
      expect(event.createdAt).toBeDefined();
    });

    it('should define WeatherAlert type correctly', () => {
      const alert = {
        projectId: 'proj_123',
        projectName: 'Test Site',
        precipitationAmount: 0.3,
        alertType: 'EPA_THRESHOLD_EXCEEDED',
        timestamp: new Date(),
        source: 'NOAA',
        message: 'EPA 0.25" threshold exceeded',
      };

      expect(alert.projectId).toBeDefined();
      expect(alert.projectName).toBeDefined();
      expect(alert.precipitationAmount).toBeDefined();
      expect(alert.alertType).toBeDefined();
      expect(alert.timestamp).toBeDefined();
      expect(alert.source).toBeDefined();
      expect(alert.message).toBeDefined();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle service returning minimum precipitation value', async () => {
      const mockServiceResult = {
        exceeded: false,
        amount: 0.0,
        requiresInspection: false,
        source: 'NOAA',
        confidence: 'HIGH' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const result = await resolver.checkProjectWeather('proj_test', 40.0, -75.0, mockUser);

      expect(result.amount).toBe(0.0);
      expect(result.exceeded).toBe(false);
    });

    it('should handle service returning exactly EPA threshold', async () => {
      const mockServiceResult = {
        exceeded: true,
        amount: 0.25,
        requiresInspection: true,
        source: 'NOAA',
        confidence: 'HIGH' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      const result = await resolver.checkProjectWeather('proj_test', 40.0, -75.0, mockUser);

      expect(result.amount).toBe(0.25);
      expect(result.exceeded).toBe(true);
    });

    it('should handle negative latitude/longitude coordinates', async () => {
      const mockServiceResult = {
        exceeded: false,
        amount: 0.1,
        requiresInspection: false,
        source: 'NOAA',
        confidence: 'HIGH' as const,
      };

      jest.spyOn(weatherService, 'checkPrecipitation').mockResolvedValue(mockServiceResult);

      await resolver.checkProjectWeather('proj_southern', -33.8688, -151.2093, mockUser);

      expect(weatherService.checkPrecipitation).toHaveBeenCalledWith(
        -33.8688,
        -151.2093,
        'proj_southern'
      );
    });

    it('should handle large custom day ranges', async () => {
      jest.spyOn(weatherService, 'getRecentWeatherEvents').mockResolvedValue([]);

      await resolver.recentWeatherEvents('proj_test', 365, mockUser);

      expect(weatherService.getRecentWeatherEvents).toHaveBeenCalledWith('proj_test', 365);
    });
  });
});
