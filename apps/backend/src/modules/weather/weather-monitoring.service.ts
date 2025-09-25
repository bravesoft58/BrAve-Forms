import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from './weather.service';
import { WeatherResolver } from './weather.resolver';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WeatherMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(WeatherMonitoringService.name);

  constructor(
    private weatherService: WeatherService,
    @Inject(forwardRef(() => WeatherResolver))
    private weatherResolver: WeatherResolver,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log('Weather monitoring service initialized');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkAllProjectsForRainEvents() {
    this.logger.debug('Starting hourly weather check for all active projects');
    
    try {
      const activeProjects = await this.prisma.project.findMany({
        where: {
          status: 'ACTIVE',
        },
      });

      for (const project of activeProjects) {
        await this.checkProjectWeather(project);
      }
      
      this.logger.log(`Completed weather check for ${activeProjects.length} projects`);
    } catch (error) {
      this.logger.error(`Failed to check weather for projects: ${error.message}`);
    }
  }

  private async checkProjectWeather(project: any) {
    const { latitude, longitude } = project.location || {};
    
    if (!latitude || !longitude) {
      this.logger.warn(`Project ${project.id} missing location coordinates, skipping weather check`);
      return;
    }

    try {
      const result = await this.weatherService.checkPrecipitation(
        latitude,
        longitude,
        project.id,
      );

      if (result.exceeded) {
        this.logger.warn(
          `EPA 0.25" threshold EXCEEDED: Project "${project.name}" recorded ${result.amount}" precipitation (source: ${result.source}, confidence: ${result.confidence})`
        );
        
        // Send traditional notification
        await this.notificationsService.sendRainThresholdAlert({
          projectId: project.id,
          projectName: project.name,
          precipitationAmount: result.amount,
          orgId: project.orgId,
        });

        // Send real-time GraphQL subscription alert
        const alert = {
          projectId: project.id,
          projectName: project.name,
          precipitationAmount: result.amount,
          alertType: 'EPA_THRESHOLD_EXCEEDED',
          timestamp: new Date(),
          source: result.source,
          message: `EPA CGP violation: ${result.amount}" precipitation exceeds 0.25" threshold. Inspection required within 24 working hours.`,
        };

        await this.weatherResolver.publishWeatherAlert(project.orgId, alert);
        
        this.logger.log(`Real-time weather alert published for org ${project.orgId}, project ${project.name}`);
      } else {
        this.logger.debug(
          `Project "${project.name}": ${result.amount}" precipitation (${result.source}) - below EPA threshold`
        );
      }
    } catch (error) {
      this.logger.error(
        `Weather check failed for project "${project.name}" (${project.id}): ${error.message}`
      );
      
      // For critical compliance, alert on monitoring failures too
      try {
        const failureAlert = {
          projectId: project.id,
          projectName: project.name,
          precipitationAmount: 0,
          alertType: 'MONITORING_FAILURE',
          timestamp: new Date(),
          source: 'SYSTEM',
          message: `Weather monitoring failed for project. Manual verification required to ensure EPA compliance.`,
        };

        await this.weatherResolver.publishWeatherAlert(project.orgId, failureAlert);
      } catch (alertError) {
        this.logger.error(`Failed to send monitoring failure alert: ${alertError.message}`);
      }
    }
  }
}