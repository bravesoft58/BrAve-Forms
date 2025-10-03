import { Module } from '@nestjs/common';
import { FormSubmissionsResolver } from './submissions.resolver';
import { FormSubmissionsService } from './services/form-submissions.service';
import { SubmissionValidationService } from './services/submission-validation.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormsModule } from '@/modules/forms/forms.module';

@Module({
  imports: [FormsModule],
  providers: [
    FormSubmissionsResolver,
    FormSubmissionsService,
    SubmissionValidationService,
    PrismaService,
  ],
  exports: [FormSubmissionsService],
})
export class SubmissionsModule {}
