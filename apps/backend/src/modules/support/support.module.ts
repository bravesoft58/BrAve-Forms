import { Module } from '@nestjs/common';
import { SupportResolver } from './support.resolver';
import { SupportService } from './support.service';
import { DatabaseModule } from '../database/database.module';

/**
 * ISSUE-174: Support Module
 *
 * Provides support request functionality for the help/feedback system.
 * Handles support requests submitted via the Contact Support form.
 */
@Module({
  imports: [DatabaseModule],
  providers: [SupportResolver, SupportService],
  exports: [SupportService],
})
export class SupportModule {}
