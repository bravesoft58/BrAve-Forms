import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendRainThresholdAlert(data: {
    projectId: string;
    projectName: string;
    precipitationAmount: number;
    orgId: string;
  }) {
    this.logger.warn(
      `ALERT: Project ${data.projectName} exceeded EPA 0.25" threshold with ${data.precipitationAmount}" of precipitation`
    );
    
    // TODO: Implement actual notification sending (email, SMS, push)
    return Promise.resolve();
  }
}
