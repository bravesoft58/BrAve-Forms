import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service';

/**
 * Clerk Webhook Controller
 * 
 * Handles incoming Clerk webhook events for organization and user synchronization.
 * Endpoint: POST /api/webhooks/clerk
 */
@Controller('webhooks')
export class ClerkWebhookController {
  constructor(private readonly clerkWebhookService: ClerkWebhookService) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(
    @Body() rawBody: string,
    @Headers() headers: Record<string, string>,
  ): Promise<{ received: boolean }> {
    await this.clerkWebhookService.processWebhook(rawBody, headers);
    return { received: true };
  }
}