import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Organization GraphQL Resolver
 * 
 * Handles organization-related queries and mutations with proper
 * authentication and authorization for construction companies.
 */
@Resolver('Organization')
@UseGuards(ClerkAuthGuard)
export class OrganizationResolver {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * Get current user's organization details
   */
  @Query(() => String, { name: 'currentOrganization', nullable: true })
  async getCurrentOrganization(@CurrentUser() user: any) {
    if (!user.orgId) {
      return null;
    }

    const organization = await this.organizationService.getOrganizationByClerkIdWithCounts(user.orgId);
    if (!organization) {
      return null;
    }

    return {
      id: organization.id,
      clerkOrgId: organization.clerkOrgId,
      name: organization.name,
      plan: organization.plan,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      projectCount: organization._count?.projects || 0,
      userCount: organization._count?.users || 0,
      inspectionCount: organization._count?.inspections || 0,
    };
  }

  /**
   * Get organization dashboard statistics
   */
  @Query(() => String, { name: 'organizationStats', nullable: true })
  async getOrganizationStats(@CurrentUser() user: any) {
    const organization = await this.organizationService.getOrganizationByClerkId(user.orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    return await this.organizationService.getOrganizationStats(organization.id);
  }

  /**
   * Get organization projects (manager+ only)
   */
  @Query(() => [String], { name: 'organizationProjects' })
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getOrganizationProjects(@CurrentUser() user: any) {
    const organization = await this.organizationService.getOrganizationByClerkId(user.orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    return await this.organizationService.getOrganizationProjects(organization.id);
  }

  /**
   * Get organization users (admin+ only)
   */
  @Query(() => [String], { name: 'organizationUsers' })
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async getOrganizationUsers(@CurrentUser() user: any) {
    const organization = await this.organizationService.getOrganizationByClerkId(user.orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    return await this.organizationService.getOrganizationUsers(organization.id);
  }

  /**
   * Sync organization from Clerk (internal use - webhook)
   */
  @Mutation(() => String, { name: 'syncOrganization' })
  async syncOrganization(
    @Args('clerkOrgId', { type: () => String }) clerkOrgId: string,
    @Args('orgData', { type: () => String }) orgData: string,
  ) {
    return await this.organizationService.syncOrganization(clerkOrgId, JSON.parse(orgData));
  }

  /**
   * Sync user organization membership (internal use - webhook)
   */
  @Mutation(() => String, { name: 'syncUserOrganization' })
  async syncUserOrganization(
    @Args('userId', { type: () => String }) userId: string,
    @Args('orgId', { type: () => String }) orgId: string,
    @Args('role', { type: () => String }) role: string,
  ) {
    await this.organizationService.syncUserOrganization(userId, orgId, role);
    return { success: true };
  }

  /**
   * Remove user from organization (internal use - webhook)
   */
  @Mutation(() => String, { name: 'removeUserFromOrganization' })
  async removeUserFromOrganization(
    @Args('userId', { type: () => String }) userId: string,
    @Args('orgId', { type: () => String }) orgId: string,
  ) {
    await this.organizationService.removeUserFromOrganization(userId, orgId);
    return { success: true };
  }
}