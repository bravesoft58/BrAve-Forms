import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';

/**
 * ISSUE-173: User Preferences Service
 *
 * Manages user preferences with backend persistence for cross-device sync.
 * CRITICAL: Timezone affects EPA compliance deadline calculations.
 *
 * @security All operations require valid userId and orgId from Clerk JWT
 * @multi-tenancy Preferences are isolated per user within their organization
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user preferences, creating default if not exists
   *
   * Uses upsert pattern to ensure preferences always exist for authenticated users.
   * This avoids null checks throughout the application.
   *
   * @param userId - Clerk user ID
   * @param orgId - Clerk organization ID
   * @returns User preferences (existing or newly created defaults)
   */
  async getOrCreatePreferences(userId: string, orgId: string) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      update: {}, // No update on existing - just return
      create: {
        userId,
        orgId,
        // All other fields use schema defaults
      },
    });
  }

  /**
   * Update notification preferences
   *
   * @param userId - Clerk user ID
   * @param orgId - Clerk organization ID
   * @param input - Notification preference updates
   * @returns Updated preferences
   */
  async updateNotificationPreferences(
    userId: string,
    orgId: string,
    input: {
      emailWeatherAlerts?: boolean;
      emailInspectionReminders?: boolean;
      emailFormConfirmations?: boolean;
      emailWeeklySummary?: boolean;
      pushRealTimeAlerts?: boolean;
      pushInspectionReminders?: boolean;
      quietHoursEnabled?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    }
  ) {
    this.logger.log(`Updating notification preferences for user ${userId}`);

    // Ensure preferences exist first
    await this.getOrCreatePreferences(userId, orgId);

    return this.prisma.userPreferences.update({
      where: { userId },
      data: {
        ...(input.emailWeatherAlerts !== undefined && {
          emailWeatherAlerts: input.emailWeatherAlerts,
        }),
        ...(input.emailInspectionReminders !== undefined && {
          emailInspectionReminders: input.emailInspectionReminders,
        }),
        ...(input.emailFormConfirmations !== undefined && {
          emailFormConfirmations: input.emailFormConfirmations,
        }),
        ...(input.emailWeeklySummary !== undefined && {
          emailWeeklySummary: input.emailWeeklySummary,
        }),
        ...(input.pushRealTimeAlerts !== undefined && {
          pushRealTimeAlerts: input.pushRealTimeAlerts,
        }),
        ...(input.pushInspectionReminders !== undefined && {
          pushInspectionReminders: input.pushInspectionReminders,
        }),
        ...(input.quietHoursEnabled !== undefined && {
          quietHoursEnabled: input.quietHoursEnabled,
        }),
        ...(input.quietHoursStart !== undefined && {
          quietHoursStart: input.quietHoursStart,
        }),
        ...(input.quietHoursEnd !== undefined && {
          quietHoursEnd: input.quietHoursEnd,
        }),
      },
    });
  }

  /**
   * Update account/regional preferences
   *
   * CRITICAL: Timezone affects EPA compliance deadline calculations.
   * Changing timezone can affect inspection scheduling and audit trails.
   *
   * @param userId - Clerk user ID
   * @param orgId - Clerk organization ID
   * @param input - Account preference updates
   * @returns Updated preferences
   */
  async updateAccountPreferences(
    userId: string,
    orgId: string,
    input: {
      timezone?: string;
      timeFormat?: string;
      language?: string;
    }
  ) {
    // Log timezone changes for compliance audit
    if (input.timezone) {
      this.logger.warn(
        `Timezone change for user ${userId}: updating to ${input.timezone}`,
        { userId, orgId, newTimezone: input.timezone }
      );
    }

    // Ensure preferences exist first
    await this.getOrCreatePreferences(userId, orgId);

    return this.prisma.userPreferences.update({
      where: { userId },
      data: {
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.timeFormat !== undefined && { timeFormat: input.timeFormat }),
        ...(input.language !== undefined && { language: input.language }),
      },
    });
  }

  /**
   * Get user's timezone for compliance calculations
   *
   * Used by weather service and inspection scheduler to calculate
   * EPA-compliant deadlines in the user's local timezone.
   *
   * @param userId - Clerk user ID
   * @returns User's timezone string (e.g., "America/Los_Angeles")
   */
  async getUserTimezone(userId: string): Promise<string> {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    return prefs?.timezone || 'America/Los_Angeles';
  }
}
