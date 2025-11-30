import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  CreateSupportRequestInput,
  SupportRequestStatus,
  SupportRequestPriority,
} from './support.types';

// Validation constants
const SUBJECT_MIN_LENGTH = 5;
const SUBJECT_MAX_LENGTH = 200;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 5000;

/**
 * ISSUE-174: Support Request Service
 *
 * Manages support requests for the help/feedback system.
 * Supports offline queue processing when requests are synced.
 *
 * @security All operations require valid userId and orgId from Clerk JWT
 * @multi-tenancy Support requests are isolated per organization
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new support request
   *
   * @param userId - Clerk user ID
   * @param orgId - Clerk organization ID
   * @param input - Support request details
   * @returns Created support request
   * @throws BadRequestException if input validation fails
   */
  async create(
    userId: string,
    orgId: string,
    input: CreateSupportRequestInput
  ) {
    // Input validation (Critical Issue #2 from code review)
    const subject = input.subject?.trim();
    const description = input.description?.trim();

    if (!subject || subject.length < SUBJECT_MIN_LENGTH) {
      throw new BadRequestException(
        `Subject must be at least ${SUBJECT_MIN_LENGTH} characters`
      );
    }
    if (subject.length > SUBJECT_MAX_LENGTH) {
      throw new BadRequestException(
        `Subject must be under ${SUBJECT_MAX_LENGTH} characters`
      );
    }
    if (!description || description.length < DESCRIPTION_MIN_LENGTH) {
      throw new BadRequestException(
        `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`
      );
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new BadRequestException(
        `Description must be under ${DESCRIPTION_MAX_LENGTH} characters`
      );
    }

    this.logger.log(`Creating support request for user ${userId}: ${subject}`);

    return this.prisma.supportRequest.create({
      data: {
        userId,
        orgId,
        type: input.type,
        subject,
        description,
        priority: input.priority || SupportRequestPriority.NORMAL,
        status: SupportRequestStatus.OPEN,
      },
    });
  }

  /**
   * Get all support requests for a user
   *
   * @param userId - Clerk user ID
   * @param orgId - Clerk organization ID
   * @returns List of user's support requests
   */
  async findByUser(userId: string, orgId: string) {
    return this.prisma.supportRequest.findMany({
      where: {
        userId,
        orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single support request by ID
   *
   * @param id - Support request ID
   * @param userId - Clerk user ID (for authorization)
   * @param orgId - Clerk organization ID (for authorization)
   * @returns Support request or null
   */
  async findById(id: string, userId: string, orgId: string) {
    return this.prisma.supportRequest.findFirst({
      where: {
        id,
        userId,
        orgId,
      },
    });
  }

  /**
   * Get all support requests for an organization (ADMIN ONLY)
   *
   * WARNING: This method returns ALL support requests for an org without user filtering.
   * It should ONLY be called from admin-protected resolvers with proper RBAC guards.
   * Do NOT expose via GraphQL without @UseGuards(ClerkAuthGuard, AdminRoleGuard).
   *
   * @security ADMIN ONLY - Requires role-based access control
   * @param orgId - Clerk organization ID
   * @returns List of organization's support requests
   */
  async findByOrg(orgId: string) {
    this.logger.log(`Admin query: fetching all support requests for org ${orgId}`);

    return this.prisma.supportRequest.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
