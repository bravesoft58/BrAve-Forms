import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { NOAAService } from './providers/noaa.service';
import { OpenWeatherMapService } from './providers/openweathermap.service';

const EPA_RAIN_THRESHOLD_INCHES = 0.25; // CRITICAL: MUST be exactly 0.25" per EPA CGP

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly EPA_THRESHOLD: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private noaaService: NOAAService,
    private openWeatherMapService: OpenWeatherMapService,
  ) {
    // Validate EPA threshold from environment
    this.EPA_THRESHOLD = parseFloat(
      this.configService.get<string>('EPA_RAIN_THRESHOLD_INCHES', '0.25')
    );
    
    // CRITICAL: Ensure exact 0.25" threshold compliance
    if (this.EPA_THRESHOLD !== 0.25) {
      this.logger.error(
        `COMPLIANCE VIOLATION: EPA threshold is ${this.EPA_THRESHOLD} but MUST be exactly 0.25 inches`
      );
      throw new Error('EPA compliance violation: Invalid rain threshold');
    }
    
    this.logger.log(`EPA CGP compliance enabled: ${this.EPA_THRESHOLD}" precipitation threshold`);
  }

  async checkPrecipitation(
    latitude: number,
    longitude: number,
    projectId: string,
  ): Promise<{ exceeded: boolean; amount: number; requiresInspection: boolean; source: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }> {
    const startTime = Date.now();
    let precipitationAmount: number = 0;
    let dataSource = 'UNKNOWN';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    try {
      // Try NOAA first (highest accuracy)
      precipitationAmount = await this.noaaService.getPrecipitation(latitude, longitude);
      
      if (precipitationAmount !== null) {
        dataSource = 'NOAA';
        confidence = 'HIGH';
        this.logger.debug(`NOAA precipitation: ${precipitationAmount}" for project ${projectId}`);
      } else {
        // Fallback to OpenWeatherMap
        this.logger.warn(`NOAA unavailable for project ${projectId}, using OpenWeatherMap`);
        precipitationAmount = await this.openWeatherMapService.getPrecipitation(latitude, longitude);
        dataSource = 'OPENWEATHER';
        confidence = 'MEDIUM';
        this.logger.debug(`OpenWeatherMap precipitation: ${precipitationAmount}" for project ${projectId}`);
      }

      // CRITICAL EPA COMPLIANCE CHECK: Exact 0.25" threshold
      const exceeded = precipitationAmount >= this.EPA_THRESHOLD;
      
      // Log threshold comparison for audit trail
      this.logger.log(
        `EPA threshold check: ${precipitationAmount}" ${exceeded ? '>=' : '<'} ${this.EPA_THRESHOLD}" = ${exceeded ? 'EXCEEDED' : 'OK'} (project: ${projectId}, source: ${dataSource})`
      );

      if (exceeded) {
        const weatherEvent = await this.recordWeatherEvent({
          projectId,
          precipitationInches: precipitationAmount,
          latitude,
          longitude,
          source: dataSource as 'NOAA' | 'OPENWEATHER',
        });

        this.logger.warn(
          `EPA 0.25" threshold EXCEEDED: ${precipitationAmount}" recorded for project ${projectId} (event ID: ${weatherEvent.id})`
        );
      }

      const requiresInspection = exceeded && await this.isWithinWorkingHours();
      
      // Performance monitoring
      const duration = Date.now() - startTime;
      this.logger.debug(`Weather check completed in ${duration}ms for project ${projectId}`);

      return {
        exceeded,
        amount: precipitationAmount,
        requiresInspection,
        source: dataSource,
        confidence,
      };
    } catch (error) {
      this.logger.error(`Failed to check precipitation for project ${projectId}: ${error.message}`);
      
      // For compliance, we cannot assume zero precipitation on errors
      // Return cached data or alert for manual verification
      const cachedData = await this.getCachedWeatherData(projectId);
      if (cachedData) {
        this.logger.warn(`Using cached weather data for project ${projectId} due to API failure`);
        return {
          exceeded: cachedData.precipitationInches >= this.EPA_THRESHOLD,
          amount: cachedData.precipitationInches,
          requiresInspection: false, // Cannot determine without current data
          source: 'CACHED',
          confidence: 'LOW',
        };
      }
      
      throw error;
    }
  }

  async recordWeatherEvent(data: {
    projectId: string;
    precipitationInches: number;
    latitude: number;
    longitude: number;
    source: 'NOAA' | 'OPENWEATHER';
  }) {
    const deadlineTime = this.calculateInspectionDeadline();

    const weatherEvent = await this.prisma.weatherEvent.create({
      data: {
        projectId: data.projectId,
        precipitationInches: data.precipitationInches,
        eventDate: new Date(),
        inspectionDeadline: deadlineTime,
        source: data.source,
        notificationsSent: false,
        inspectionCompleted: false,
      },
    });

    // Cache the weather data for offline access
    await this.cacheWeatherData(data.projectId, {
      precipitationInches: data.precipitationInches,
      timestamp: new Date(),
      source: data.source,
    });

    return weatherEvent;
  }

  private async cacheWeatherData(projectId: string, data: {
    precipitationInches: number;
    timestamp: Date;
    source: string;
  }): Promise<void> {
    try {
      // Store in database for historical reference and offline access
      // This would typically be stored in Redis for faster access, but database works for MVP
      this.logger.debug(`Caching weather data for project ${projectId}: ${data.precipitationInches}"`);
    } catch (error) {
      this.logger.warn(`Failed to cache weather data for project ${projectId}: ${error.message}`);
    }
  }

  private async getCachedWeatherData(projectId: string): Promise<{ precipitationInches: number } | null> {
    try {
      // Get most recent weather event for this project (within last 4 hours)
      const recentEvent = await this.prisma.weatherEvent.findFirst({
        where: {
          projectId,
          eventDate: {
            gte: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          },
        },
        orderBy: {
          eventDate: 'desc',
        },
      });

      return recentEvent ? { precipitationInches: recentEvent.precipitationInches } : null;
    } catch (error) {
      this.logger.error(`Failed to get cached weather data for project ${projectId}: ${error.message}`);
      return null;
    }
  }

  private calculateInspectionDeadline(): Date {
    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const deadlineHour = deadline.getHours();
    const isWeekend = deadline.getDay() === 0 || deadline.getDay() === 6;
    
    if (deadlineHour < 7) {
      deadline.setHours(7, 0, 0, 0);
    } else if (deadlineHour >= 17) {
      deadline.setDate(deadline.getDate() + 1);
      deadline.setHours(7, 0, 0, 0);
    }
    
    if (isWeekend) {
      const daysToAdd = deadline.getDay() === 0 ? 1 : 2;
      deadline.setDate(deadline.getDate() + daysToAdd);
      deadline.setHours(7, 0, 0, 0);
    }

    return deadline;
  }

  private async isWithinWorkingHours(): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    const isWeekday = day > 0 && day < 6;
    const isWorkingHour = hour >= 7 && hour < 17;
    
    return isWeekday && isWorkingHour;
  }

  async getRecentWeatherEvents(projectId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.weatherEvent.findMany({
      where: {
        projectId,
        eventDate: {
          gte: startDate,
        },
      },
      orderBy: {
        eventDate: 'desc',
      },
    });
  }

  async getPendingInspections(orgId: string) {
    return this.prisma.weatherEvent.findMany({
      where: {
        project: {
          orgId,
        },
        inspectionCompleted: false,
        inspectionDeadline: {
          gte: new Date(),
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        inspectionDeadline: 'asc',
      },
    });
  }
}