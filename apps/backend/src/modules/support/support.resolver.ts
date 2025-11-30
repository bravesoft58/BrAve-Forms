import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SupportRequest,
  CreateSupportRequestInput,
} from './support.types';

/**
 * ISSUE-174: Support Request GraphQL Resolver
 *
 * Provides queries and mutations for the support/help system.
 *
 * @security All operations require Clerk JWT authentication
 * @multi-tenancy Requests are isolated per user and organization
 */
@Resolver(() => SupportRequest)
@UseGuards(ClerkAuthGuard)
export class SupportResolver {
  constructor(private readonly supportService: SupportService) {}

  /**
   * Get current user's support requests
   */
  @Query(() => [SupportRequest], {
    name: 'mySupportRequests',
    description: 'Get all support requests for the current user',
  })
  async getMySupportRequests(
    @CurrentUser() user: CurrentUser
  ): Promise<SupportRequest[]> {
    const requests = await this.supportService.findByUser(user.userId, user.orgId);
    return requests.map(this.mapToGraphQL);
  }

  /**
   * Get a single support request by ID
   */
  @Query(() => SupportRequest, {
    name: 'supportRequest',
    nullable: true,
    description: 'Get a single support request by ID',
  })
  async getSupportRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUser
  ): Promise<SupportRequest | null> {
    const request = await this.supportService.findById(id, user.userId, user.orgId);
    return request ? this.mapToGraphQL(request) : null;
  }

  /**
   * Create a new support request
   */
  @Mutation(() => SupportRequest, {
    description: 'Create a new support request',
  })
  async createSupportRequest(
    @Args('input') input: CreateSupportRequestInput,
    @CurrentUser() user: CurrentUser
  ): Promise<SupportRequest> {
    const request = await this.supportService.create(
      user.userId,
      user.orgId,
      input
    );
    return this.mapToGraphQL(request);
  }

  /**
   * Map Prisma model to GraphQL type
   */
  private mapToGraphQL(request: {
    id: string;
    userId: string;
    orgId: string;
    type: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    response: string | null;
    respondedAt: Date | null;
    respondedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): SupportRequest {
    return {
      id: request.id,
      userId: request.userId,
      orgId: request.orgId,
      type: request.type as SupportRequest['type'],
      subject: request.subject,
      description: request.description,
      status: request.status as SupportRequest['status'],
      priority: request.priority as SupportRequest['priority'],
      response: request.response ?? undefined,
      respondedAt: request.respondedAt ?? undefined,
      respondedBy: request.respondedBy ?? undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}
