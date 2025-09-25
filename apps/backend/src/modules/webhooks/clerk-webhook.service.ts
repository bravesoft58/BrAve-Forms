import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationService } from '../organization/organization.service';
import { Webhook } from 'svix';

/**
 * Clerk Webhook Service for Organization Synchronization
 * 
 * Handles Clerk webhook events to keep organization and user data
 * synchronized between Clerk and our database.
 */
@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly organizationService: OrganizationService,
  ) {
    this.webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SECRET') || '';
    if (!this.webhookSecret) {
      this.logger.warn('CLERK_WEBHOOK_SECRET not configured - webhook verification disabled');
    }
  }

  /**
   * Process Clerk webhook events
   */
  async processWebhook(payload: string, headers: Record<string, string>): Promise<void> {
    // Verify webhook signature if secret is configured
    if (this.webhookSecret) {
      try {
        const wh = new Webhook(this.webhookSecret);
        wh.verify(payload, headers);
      } catch (error) {
        this.logger.error('Webhook signature verification failed', error);
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch (error) {
      this.logger.error('Invalid webhook payload', error);
      throw new BadRequestException('Invalid JSON payload');
    }

    this.logger.debug(`Processing webhook event: ${event.type}`, {
      eventId: event.data?.id,
      eventType: event.type,
    });

    try {
      switch (event.type) {
        // Organization events
        case 'organization.created':
          await this.handleOrganizationCreated(event.data);
          break;
        
        case 'organization.updated':
          await this.handleOrganizationUpdated(event.data);
          break;
        
        case 'organization.deleted':
          await this.handleOrganizationDeleted(event.data);
          break;

        // Organization membership events
        case 'organizationMembership.created':
          await this.handleMembershipCreated(event.data);
          break;
        
        case 'organizationMembership.updated':
          await this.handleMembershipUpdated(event.data);
          break;
        
        case 'organizationMembership.deleted':
          await this.handleMembershipDeleted(event.data);
          break;

        // User events (for audit trail)
        case 'user.created':
          await this.handleUserCreated(event.data);
          break;
        
        case 'user.updated':
          await this.handleUserUpdated(event.data);
          break;
        
        case 'user.deleted':
          await this.handleUserDeleted(event.data);
          break;

        // Session events (for security monitoring)
        case 'session.created':
          await this.handleSessionCreated(event.data);
          break;
        
        case 'session.ended':
          await this.handleSessionEnded(event.data);
          break;

        default:
          this.logger.debug(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook event ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Handle organization creation
   */
  private async handleOrganizationCreated(data: any): Promise<void> {
    this.logger.log(`Organization created: ${data.id} (${data.name})`);
    
    await this.organizationService.syncOrganization(data.id, {
      name: data.name,
      slug: data.slug,
    });
  }

  /**
   * Handle organization updates
   */
  private async handleOrganizationUpdated(data: any): Promise<void> {
    this.logger.log(`Organization updated: ${data.id} (${data.name})`);
    
    await this.organizationService.syncOrganization(data.id, {
      name: data.name,
      slug: data.slug,
    });
  }

  /**
   * Handle organization deletion
   */
  private async handleOrganizationDeleted(data: any): Promise<void> {
    this.logger.log(`Organization deleted: ${data.id}`);
    
    // Note: We may want to soft-delete or archive instead of hard delete
    // for compliance and audit purposes
    this.logger.warn(`Organization deletion not implemented: ${data.id}`);
  }

  /**
   * Handle organization membership creation
   */
  private async handleMembershipCreated(data: any): Promise<void> {
    this.logger.log(`Membership created: user=${data.public_user_data?.user_id}, org=${data.organization?.id}, role=${data.role}`);
    
    if (data.public_user_data?.user_id && data.organization?.id) {
      await this.organizationService.syncUserOrganization(
        data.public_user_data.user_id,
        data.organization.id,
        data.role
      );
    }
  }

  /**
   * Handle organization membership updates
   */
  private async handleMembershipUpdated(data: any): Promise<void> {
    this.logger.log(`Membership updated: user=${data.public_user_data?.user_id}, org=${data.organization?.id}, role=${data.role}`);
    
    if (data.public_user_data?.user_id && data.organization?.id) {
      await this.organizationService.syncUserOrganization(
        data.public_user_data.user_id,
        data.organization.id,
        data.role
      );
    }
  }

  /**
   * Handle organization membership deletion
   */
  private async handleMembershipDeleted(data: any): Promise<void> {
    this.logger.log(`Membership deleted: user=${data.public_user_data?.user_id}, org=${data.organization?.id}`);
    
    if (data.public_user_data?.user_id && data.organization?.id) {
      await this.organizationService.removeUserFromOrganization(
        data.public_user_data.user_id,
        data.organization.id
      );
    }
  }

  /**
   * Handle user creation (for audit trail)
   */
  private async handleUserCreated(data: any): Promise<void> {
    this.logger.log(`User created: ${data.id} (${data.email_addresses?.[0]?.email_address})`);
    
    // Log for security audit trail
    this.logger.debug('New user registration', {
      userId: data.id,
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      createdAt: new Date(data.created_at),
    });
  }

  /**
   * Handle user updates
   */
  private async handleUserUpdated(data: any): Promise<void> {
    this.logger.debug(`User updated: ${data.id}`);
  }

  /**
   * Handle user deletion
   */
  private async handleUserDeleted(data: any): Promise<void> {
    this.logger.log(`User deleted: ${data.id}`);
    
    // Log for security audit trail
    this.logger.warn('User account deleted', {
      userId: data.id,
      deletedAt: new Date(),
    });
  }

  /**
   * Handle session creation (for security monitoring)
   */
  private async handleSessionCreated(data: any): Promise<void> {
    this.logger.debug(`Session created: user=${data.user_id}, session=${data.id}`);
    
    // Log for security monitoring
    this.logger.debug('User login', {
      userId: data.user_id,
      sessionId: data.id,
      clientId: data.client_id,
      createdAt: new Date(data.created_at),
    });
  }

  /**
   * Handle session end (for security monitoring)
   */
  private async handleSessionEnded(data: any): Promise<void> {
    this.logger.debug(`Session ended: user=${data.user_id}, session=${data.id}`);
    
    // Log for security monitoring
    this.logger.debug('User logout', {
      userId: data.user_id,
      sessionId: data.id,
      endedAt: new Date(),
    });
  }
}