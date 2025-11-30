import {
  Resolver,
  Query,
  Mutation,
  Args,
  ObjectType,
  InputType,
  Field,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  orgId: string;

  @Field()
  orgRole: string;
}

/**
 * ISSUE-173: User Preferences GraphQL Types
 *
 * User preferences for cross-device sync.
 * CRITICAL: Timezone affects EPA compliance deadline calculations.
 */
@ObjectType()
export class UserPreferences {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  orgId: string;

  // Notification preferences
  @Field()
  emailWeatherAlerts: boolean;

  @Field()
  emailInspectionReminders: boolean;

  @Field()
  emailFormConfirmations: boolean;

  @Field()
  emailWeeklySummary: boolean;

  @Field()
  pushRealTimeAlerts: boolean;

  @Field()
  pushInspectionReminders: boolean;

  @Field()
  quietHoursEnabled: boolean;

  @Field()
  quietHoursStart: string;

  @Field()
  quietHoursEnd: string;

  // Account/Regional preferences
  @Field()
  timezone: string;

  @Field()
  timeFormat: string;

  @Field()
  language: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class NotificationPreferencesInput {
  @Field({ nullable: true })
  emailWeatherAlerts?: boolean;

  @Field({ nullable: true })
  emailInspectionReminders?: boolean;

  @Field({ nullable: true })
  emailFormConfirmations?: boolean;

  @Field({ nullable: true })
  emailWeeklySummary?: boolean;

  @Field({ nullable: true })
  pushRealTimeAlerts?: boolean;

  @Field({ nullable: true })
  pushInspectionReminders?: boolean;

  @Field({ nullable: true })
  quietHoursEnabled?: boolean;

  @Field({ nullable: true })
  quietHoursStart?: string;

  @Field({ nullable: true })
  quietHoursEnd?: string;
}

@InputType()
export class AccountPreferencesInput {
  @Field({ nullable: true, description: 'IANA timezone (e.g., America/Los_Angeles)' })
  timezone?: string;

  @Field({ nullable: true, description: 'Time format: 12h or 24h' })
  timeFormat?: string;

  @Field({ nullable: true, description: 'Language code (e.g., en, es)' })
  language?: string;
}

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, {
    name: 'me',
    description: 'Get current authenticated user',
  })
  @UseGuards(ClerkAuthGuard)
  async getCurrentUser(@CurrentUser() user: CurrentUser): Promise<User> {
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      orgId: user.orgId,
      orgRole: user.orgRole,
    };
  }

  /**
   * ISSUE-173: User Preferences Queries and Mutations
   */

  @Query(() => UserPreferences, {
    name: 'myPreferences',
    description: 'Get current user preferences (creates defaults if not exists)',
  })
  @UseGuards(ClerkAuthGuard)
  async getMyPreferences(
    @CurrentUser() user: CurrentUser
  ): Promise<UserPreferences> {
    return this.usersService.getOrCreatePreferences(user.userId, user.orgId);
  }

  @Mutation(() => UserPreferences, {
    description: 'Update notification preferences',
  })
  @UseGuards(ClerkAuthGuard)
  async updateNotificationPreferences(
    @CurrentUser() user: CurrentUser,
    @Args('input') input: NotificationPreferencesInput
  ): Promise<UserPreferences> {
    return this.usersService.updateNotificationPreferences(
      user.userId,
      user.orgId,
      input
    );
  }

  @Mutation(() => UserPreferences, {
    description: 'Update account/regional preferences (timezone, language)',
  })
  @UseGuards(ClerkAuthGuard)
  async updateAccountPreferences(
    @CurrentUser() user: CurrentUser,
    @Args('input') input: AccountPreferencesInput
  ): Promise<UserPreferences> {
    return this.usersService.updateAccountPreferences(
      user.userId,
      user.orgId,
      input
    );
  }
}
