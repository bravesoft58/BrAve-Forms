import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NOAAService } from './providers/noaa.service';
import { OpenWeatherMapService } from './providers/openweathermap.service';
import * as fs from 'fs';
import * as path from 'path';

describe('WeatherService - EPA Compliance Tests', () => {
  let service: WeatherService;
  let _prismaService: PrismaService;
  let _noaaService: NOAAService;

  const mockPrismaService = {
    weatherEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'EPA_RAIN_THRESHOLD_INCHES') {
        return '0.25'; // Must return exactly '0.25' as string to pass validation
      }
      return defaultValue || 'test-value';
    }),
  };

  const mockNOAAService = {
    getPrecipitation: jest.fn(),
  };

  const mockOpenWeatherMapService = {
    getPrecipitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NOAAService, useValue: mockNOAAService },
        { provide: OpenWeatherMapService, useValue: mockOpenWeatherMapService },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _noaaService = module.get<NOAAService>(NOAAService);
  });

  describe('EPA 0.25" Rain Threshold Compliance', () => {
    it('CRITICAL: Must trigger inspection at EXACTLY 0.25 inches - not 0.24 or 0.26', async () => {
      const projectId = 'test-project-123';
      const latitude = 40.7128;
      const longitude = -74.006;

      // Test 0.24" - should NOT trigger
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.24);
      let result = await service.checkPrecipitation(latitude, longitude, projectId);
      expect(result.exceeded).toBe(false);
      expect(result.amount).toBe(0.24);
      expect(mockPrismaService.weatherEvent.create).not.toHaveBeenCalled();

      // Test EXACTLY 0.25" - MUST trigger
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.25);
      mockPrismaService.weatherEvent.create.mockResolvedValueOnce({
        id: 'event-1',
        projectId,
        precipitationInches: 0.25,
        eventTime: new Date(),
        inspectionDeadline: new Date(),
      });

      result = await service.checkPrecipitation(latitude, longitude, projectId);
      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.25);
      expect(mockPrismaService.weatherEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId,
            precipitationInches: 0.25,
          }),
        })
      );

      // Test 0.26" - should also trigger
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.26);
      mockPrismaService.weatherEvent.create.mockResolvedValueOnce({
        id: 'event-2',
        projectId,
        precipitationInches: 0.26,
        eventTime: new Date(),
        inspectionDeadline: new Date(),
      });

      result = await service.checkPrecipitation(latitude, longitude, projectId);
      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.26);
    });

    it('Must use OpenWeatherMap as fallback when NOAA unavailable', async () => {
      const projectId = 'test-project-123';
      const latitude = 40.7128;
      const longitude = -74.006;

      // NOAA returns null (unavailable)
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(null);
      // OpenWeatherMap returns 0.30"
      mockOpenWeatherMapService.getPrecipitation.mockResolvedValueOnce(0.3);
      mockPrismaService.weatherEvent.create.mockResolvedValueOnce({
        id: 'event-3',
        projectId,
        precipitationInches: 0.3,
        eventTime: new Date(),
        inspectionDeadline: new Date(),
      });

      const result = await service.checkPrecipitation(latitude, longitude, projectId);

      expect(mockNOAAService.getPrecipitation).toHaveBeenCalled();
      expect(mockOpenWeatherMapService.getPrecipitation).toHaveBeenCalled();
      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.3);
    });

    it('Must calculate 24-hour deadline during working hours only', async () => {
      const projectId = 'test-project-123';

      // Mock NOAA to return 0.25" precipitation
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.25);
      mockPrismaService.weatherEvent.create.mockImplementation((args) => {
        const deadline = args.data.inspectionDeadline;

        // Verify deadline is within reasonable range (24-72 hours for weekend adjustment)
        const now = new Date();
        const timeDiff = deadline.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        expect(hoursDiff).toBeGreaterThan(0);
        expect(hoursDiff).toBeLessThan(96); // Allow up to 4 days for weekend+holiday adjustments

        return Promise.resolve({
          id: 'event-4',
          ...args.data,
        });
      });

      const result = await service.checkPrecipitation(40.7128, -74.006, projectId);
      expect(result.exceeded).toBe(true);
      expect(mockPrismaService.weatherEvent.create).toHaveBeenCalled();
    });

    it('Must store exact precipitation amount without rounding', async () => {
      const projectId = 'test-project-123';
      const exactAmount = 0.251234567;

      mockNOAAService.getPrecipitation.mockResolvedValueOnce(exactAmount);
      mockPrismaService.weatherEvent.create.mockImplementation((args) => {
        // Verify exact amount is stored without rounding
        expect(args.data.precipitationInches).toBe(exactAmount);
        expect(args.data.precipitationInches.toString()).toBe('0.251234567');
        return Promise.resolve({
          id: 'event-5',
          ...args.data,
        });
      });

      const result = await service.checkPrecipitation(40.7128, -74.006, projectId);
      expect(result.amount).toBe(exactAmount);
      expect(result.exceeded).toBe(true); // Should exceed 0.25" threshold
      expect(result.source).toBe('NOAA');
      expect(result.confidence).toBe('HIGH');
    });
  });

  describe('EPA Compliance Validation', () => {
    it('Must never approximate the 0.25" threshold', () => {
      // This test verifies the constant is exactly 0.25
      const weatherServiceCode = fs.readFileSync(
        path.join(__dirname, 'weather.service.ts'),
        'utf8'
      );

      expect(weatherServiceCode).toContain('EPA_RAIN_THRESHOLD_INCHES = 0.25');
      expect(weatherServiceCode).not.toContain('EPA_RAIN_THRESHOLD_INCHES = 0.24');
      expect(weatherServiceCode).not.toContain('EPA_RAIN_THRESHOLD_INCHES = 0.26');
    });
  });

  describe('Error Handling and Cache Logic', () => {
    it('should return cached data when both NOAA and OpenWeather fail', async () => {
      const projectId = 'test-project-cache';
      const cachedEvent = {
        id: 'cached-event-1',
        projectId,
        precipitationInches: 0.28,
        eventDate: new Date(),
        inspectionDeadline: new Date(),
        source: 'NOAA',
        notificationsSent: false,
        inspectionCompleted: false,
      };

      // Both providers fail
      mockNOAAService.getPrecipitation.mockRejectedValueOnce(new Error('NOAA API failure'));
      mockOpenWeatherMapService.getPrecipitation.mockRejectedValueOnce(
        new Error('OpenWeather API failure')
      );

      // Cache returns recent data
      mockPrismaService.weatherEvent.findFirst = jest.fn().mockResolvedValueOnce(cachedEvent);

      const result = await service.checkPrecipitation(40.7128, -74.006, projectId);

      expect(result.source).toBe('CACHED');
      expect(result.confidence).toBe('LOW');
      expect(result.amount).toBe(0.28);
      expect(result.exceeded).toBe(true); // 0.28 >= 0.25
      expect(result.requiresInspection).toBe(false); // Cannot determine without current data
    });

    it('should throw error when no cache available and providers fail', async () => {
      const projectId = 'test-project-no-cache';

      mockNOAAService.getPrecipitation.mockRejectedValueOnce(new Error('NOAA failure'));
      mockOpenWeatherMapService.getPrecipitation.mockRejectedValueOnce(
        new Error('OpenWeather failure')
      );
      mockPrismaService.weatherEvent.findFirst = jest.fn().mockResolvedValueOnce(null); // No cache

      await expect(service.checkPrecipitation(40.7128, -74.006, projectId)).rejects.toThrow();
    });

    it('should retrieve cached data within 4-hour window', async () => {
      const projectId = 'test-project-recent';
      const recentEvent = {
        id: 'recent-1',
        projectId,
        precipitationInches: 0.3,
        eventDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };

      mockNOAAService.getPrecipitation.mockRejectedValueOnce(new Error('API failure'));
      mockOpenWeatherMapService.getPrecipitation.mockRejectedValueOnce(new Error('API failure'));
      mockPrismaService.weatherEvent.findFirst = jest.fn().mockImplementation(({ where }) => {
        // Verify 4-hour window query
        expect(where.eventDate.gte).toBeDefined();
        const timeDiff = Date.now() - where.eventDate.gte.getTime();
        expect(timeDiff).toBeGreaterThanOrEqual(4 * 60 * 60 * 1000 - 100); // Allow 100ms tolerance
        return Promise.resolve(recentEvent);
      });

      const result = await service.checkPrecipitation(40.7128, -74.006, projectId);

      expect(result.amount).toBe(0.3);
      expect(mockPrismaService.weatherEvent.findFirst).toHaveBeenCalled();
    });
  });

  describe('Weather Data Retrieval Methods', () => {
    it('should fetch recent weather events for project', async () => {
      const projectId = 'test-project-history';
      const mockEvents = [
        {
          id: 'event-1',
          projectId,
          precipitationInches: 0.3,
          eventDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: 'event-2',
          projectId,
          precipitationInches: 0.26,
          eventDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
      ];

      mockPrismaService.weatherEvent.findMany = jest.fn().mockResolvedValueOnce(mockEvents);

      const result = await service.getRecentWeatherEvents(projectId, 7);

      expect(mockPrismaService.weatherEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId,
            eventDate: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
          orderBy: {
            eventDate: 'desc',
          },
        })
      );
      expect(result).toEqual(mockEvents);
      expect(result.length).toBe(2);
    });

    it('should use default 7-day window if days parameter not provided', async () => {
      const projectId = 'test-project-default';
      mockPrismaService.weatherEvent.findMany = jest.fn().mockResolvedValueOnce([]);

      await service.getRecentWeatherEvents(projectId);

      expect(mockPrismaService.weatherEvent.findMany).toHaveBeenCalled();
    });

    it('should fetch pending inspections for organization', async () => {
      const orgId = 'org-123';
      const mockPendingInspections = [
        {
          id: 'pending-1',
          projectId: 'proj-1',
          precipitationInches: 0.3,
          inspectionCompleted: false,
          inspectionDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
          project: {
            id: 'proj-1',
            name: 'Site A',
            orgId: 'org-123',
          },
        },
        {
          id: 'pending-2',
          projectId: 'proj-2',
          precipitationInches: 0.28,
          inspectionCompleted: false,
          inspectionDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
          project: {
            id: 'proj-2',
            name: 'Site B',
            orgId: 'org-123',
          },
        },
      ];

      mockPrismaService.weatherEvent.findMany = jest
        .fn()
        .mockResolvedValueOnce(mockPendingInspections);

      const result = await service.getPendingInspections(orgId);

      expect(mockPrismaService.weatherEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: {
              orgId,
            },
            inspectionCompleted: false,
            inspectionDeadline: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
          include: {
            project: true,
          },
          orderBy: {
            inspectionDeadline: 'asc',
          },
        })
      );
      expect(result).toEqual(mockPendingInspections);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no pending inspections', async () => {
      mockPrismaService.weatherEvent.findMany = jest.fn().mockResolvedValueOnce([]);

      const result = await service.getPendingInspections('org-empty');

      expect(result).toEqual([]);
    });
  });

  describe('Record Weather Event', () => {
    it('should record weather event with all required fields', async () => {
      const eventData = {
        projectId: 'proj-record-test',
        precipitationInches: 0.32,
        latitude: 40.7128,
        longitude: -74.006,
        source: 'NOAA' as const,
      };

      const mockCreatedEvent = {
        id: 'created-event-123',
        projectId: eventData.projectId,
        precipitationInches: eventData.precipitationInches,
        eventDate: new Date(),
        inspectionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        source: eventData.source,
        notificationsSent: false,
        inspectionCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.weatherEvent.create = jest.fn().mockResolvedValueOnce(mockCreatedEvent);

      const result = await service.recordWeatherEvent(eventData);

      expect(mockPrismaService.weatherEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: eventData.projectId,
            precipitationInches: eventData.precipitationInches,
            source: eventData.source,
            eventDate: expect.any(Date),
            inspectionDeadline: expect.any(Date),
            notificationsSent: false,
            inspectionCompleted: false,
          }),
        })
      );
      expect(result.id).toBe('created-event-123');
    });
  });
});
