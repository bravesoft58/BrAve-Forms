import { Resolver, Mutation, Args, ID, registerEnumType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SubmissionCloningService, CloneMode } from '../services/submission-cloning.service';
import { FormSubmission } from '@/modules/forms/forms.types';

registerEnumType(CloneMode, {
  name: 'CloneMode',
  description: 'Mode for cloning form submissions',
});

@Resolver()
export class CloneSubmissionResolver {
  constructor(private readonly cloningService: SubmissionCloningService) {}

  @Mutation(() => FormSubmission)
  @UseGuards(ClerkAuthGuard)
  async cloneSubmission(
    @Args('sourceId', { type: () => ID }) sourceId: string,
    @Args('mode', { nullable: true, defaultValue: CloneMode.KEEP_ALL }) mode: CloneMode,
    @CurrentUserDecorator() user: CurrentUser
  ): Promise<FormSubmission> {
    const cloned = await this.cloningService.cloneSubmission({
      sourceId,
      userId: user.userId,
      userOrgId: user.orgId,
      mode,
    });

    return cloned as any;
  }

  @Mutation(() => FormSubmission)
  @UseGuards(ClerkAuthGuard)
  async copyYesterdaysLog(
    @Args('templateId', { type: () => ID }) templateId: string,
    @CurrentUserDecorator() user: CurrentUser
  ): Promise<FormSubmission> {
    const cloned = await this.cloningService.cloneYesterdaysSubmission(
      templateId,
      user.userId,
      user.orgId
    );

    return cloned as any;
  }
}
