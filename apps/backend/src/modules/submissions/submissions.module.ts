import { Module } from '@nestjs/common';
import { FormSubmissionsResolver } from './submissions.resolver';
import { FormSubmissionsService } from './services/form-submissions.service';
import { SubmissionValidationService } from './services/submission-validation.service';
import { SubmissionCloningService } from './services/submission-cloning.service';
import { CloneSubmissionResolver } from './resolvers/clone-submission.resolver';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormsModule } from '@/modules/forms/forms.module';

@Module({
  imports: [FormsModule],
  providers: [
    FormSubmissionsResolver,
    FormSubmissionsService,
    SubmissionValidationService,
    SubmissionCloningService,
    CloneSubmissionResolver,
    PrismaService,
  ],
  exports: [FormSubmissionsService, SubmissionCloningService],
})
export class SubmissionsModule {}
