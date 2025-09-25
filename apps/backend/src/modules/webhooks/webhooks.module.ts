import { Module } from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [OrganizationModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService],
})
export class WebhooksModule {}