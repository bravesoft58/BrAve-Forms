import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QRTokenService } from './qr-token.service';
import { QRPortalResolver } from './qr-portal.resolver';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [QRTokenService, QRPortalResolver],
  exports: [QRTokenService],
})
export class QRPortalModule {}
