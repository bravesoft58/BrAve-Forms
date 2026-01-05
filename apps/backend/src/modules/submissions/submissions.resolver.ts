import { Resolver, Query, Mutation, Args, ID, InputType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GraphQLJSON } from 'graphql-type-json';
import { FormSubmissionsService } from './services/form-submissions.service';
import { FormSubmissionStatus } from '@brave-forms/types';

interface ClerkUser {
  userId: string;
  orgId: string;
  role: string;
}

@InputType()
class CreateFormSubmissionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  inspectionId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  projectId?: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  data: Record<string, unknown>;
}

@InputType()
class UpdateFormSubmissionInput {
  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  status?: FormSubmissionStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}

@Resolver('FormSubmission')
@UseGuards(ClerkAuthGuard)
export class FormSubmissionsResolver {
  constructor(private submissionsService: FormSubmissionsService) {}

  @Mutation(() => String)
  async createFormSubmission(
    @Args('input') input: CreateFormSubmissionInput,
    @CurrentUser() user: ClerkUser
  ) {
    const submission = await this.submissionsService.create(input, user.orgId, user.userId);
    return submission;
  }

  @Mutation(() => String)
  async updateFormSubmission(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFormSubmissionInput,
    @CurrentUser() user: ClerkUser
  ) {
    const submission = await this.submissionsService.update(id, input, user.orgId, user.userId);
    return submission;
  }

  @Query(() => GraphQLJSON)
  async formSubmission(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: ClerkUser) {
    return this.submissionsService.findOne(id, user.orgId);
  }

  @Query(() => [GraphQLJSON])
  async formSubmissions(
    @Args('templateId', { nullable: true }) templateId?: string,
    @Args('projectId', { nullable: true }) projectId?: string,
    @Args('inspectionId', { nullable: true }) inspectionId?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('take', { nullable: true }) take?: number,
    @Args('skip', { nullable: true }) skip?: number,
    @CurrentUser() user?: ClerkUser
  ) {
    return this.submissionsService.findAll(user.orgId, {
      templateId,
      projectId,
      inspectionId,
      status: status as any,
      take,
      skip,
    });
  }

  @Mutation(() => String)
  async approveFormSubmission(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: ClerkUser
  ) {
    return this.submissionsService.approve(id, user.orgId, user.userId);
  }

  @Mutation(() => String)
  async rejectFormSubmission(
    @Args('id', { type: () => ID }) id: string,
    @Args('notes') notes: string,
    @CurrentUser() user: ClerkUser
  ) {
    return this.submissionsService.reject(id, notes, user.orgId, user.userId);
  }

  @Mutation(() => Boolean)
  async deleteFormSubmission(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: ClerkUser
  ) {
    return this.submissionsService.delete(id, user.orgId);
  }
}
