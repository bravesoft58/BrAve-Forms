import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FormsService } from './forms.service';
import {
  FormTemplate,
  FormSubmission,
  ComplianceValidation,
  CreateFormTemplateInput,
  UpdateFormTemplateInput,
  CreateFormSubmissionInput,
  UpdateFormSubmissionInput,
  FormCategory,
  FormStatus,
} from './forms.types';

@Resolver()
@UseGuards(ClerkAuthGuard)
export class FormsResolver {
  constructor(private readonly formsService: FormsService) {}

  // Form Template Queries
  @Query(() => [FormTemplate])
  async formTemplates(
    @CurrentUser() user: any,
    @Args('category', { nullable: true }) category?: FormCategory,
    @Args('isActive', { nullable: true }) isActive?: boolean,
    @Args('take', { nullable: true }) take?: number,
    @Args('skip', { nullable: true }) skip?: number
  ): Promise<FormTemplate[]> {
    const filters: any = {};
    if (category !== undefined) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive;
    if (take !== undefined) filters.take = take;
    if (skip !== undefined) filters.skip = skip;

    return this.formsService.getFormTemplates(
      user.orgId,
      Object.keys(filters).length > 0 ? filters : undefined
    );
  }

  @Query(() => FormTemplate)
  async formTemplate(@Args('id') id: string, @CurrentUser() user: any): Promise<FormTemplate> {
    return this.formsService.getFormTemplate(id, user.orgId);
  }

  // Form Template Mutations
  @Mutation(() => FormTemplate)
  async createFormTemplate(
    @Args('input') input: CreateFormTemplateInput,
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
    return this.formsService.createFormTemplate({
      orgId: user.orgId,
      name: input.name,
      description: input.description,
      category: input.category,
      schema: input.schema,
      compliance: input.compliance,
      createdBy: user.id,
    });
  }

  @Mutation(() => FormTemplate)
  async updateFormTemplate(
    @Args('id') id: string,
    @Args('input') input: UpdateFormTemplateInput,
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
    return this.formsService.updateFormTemplate(id, user.orgId, input);
  }

  @Mutation(() => FormTemplate)
  async duplicateFormTemplate(
    @Args('id') id: string,
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
    return this.formsService.duplicateFormTemplate(id, user.orgId, user.id);
  }

  @Mutation(() => Boolean)
  async deleteFormTemplate(@Args('id') id: string, @CurrentUser() user: any): Promise<boolean> {
    await this.formsService.deleteFormTemplate(id, user.orgId);
    return true;
  }

  @Mutation(() => FormTemplate)
  async createEpaSwpppTemplate(@CurrentUser() user: any): Promise<FormTemplate> {
    return this.formsService.createEpaSwpppTemplate(user.orgId, user.id);
  }

  // Form Submission Queries
  @Query(() => [FormSubmission])
  async formSubmissions(
    @Args('templateId', { nullable: true }) templateId?: string,
    @Args('projectId', { nullable: true }) projectId?: string,
    @Args('inspectionId', { nullable: true }) inspectionId?: string,
    @Args('status', { nullable: true }) status?: FormStatus,
    @CurrentUser() user?: any
  ): Promise<FormSubmission[]> {
    return this.formsService.getFormSubmissions(user.orgId, {
      templateId,
      projectId,
      inspectionId,
      status,
    });
  }

  @Query(() => FormSubmission)
  async formSubmission(@Args('id') id: string, @CurrentUser() user: any): Promise<FormSubmission> {
    return this.formsService.getFormSubmission(id, user.orgId);
  }

  // Form Submission Mutations
  @Mutation(() => FormSubmission)
  async createFormSubmission(
    @Args('input') input: CreateFormSubmissionInput,
    @CurrentUser() user: any
  ): Promise<FormSubmission> {
    return this.formsService.createFormSubmission({
      orgId: user.orgId,
      templateId: input.templateId,
      inspectionId: input.inspectionId,
      projectId: input.projectId,
      submittedBy: user.id,
      data: input.data,
      metadata: input.metadata,
      offlineCreated: input.offlineCreated,
    });
  }

  @Mutation(() => FormSubmission)
  async updateFormSubmission(
    @Args('id') id: string,
    @Args('input') input: UpdateFormSubmissionInput,
    @CurrentUser() user: any
  ): Promise<FormSubmission> {
    return this.formsService.updateFormSubmission(id, user.orgId, {
      ...input,
      reviewedBy:
        input.status && ['REVIEWED', 'APPROVED', 'REJECTED'].includes(input.status)
          ? user.id
          : undefined,
    });
  }

  // EPA Compliance Validation
  @Query(() => ComplianceValidation)
  async validateFormCompliance(
    @Args('submissionId') submissionId: string,
    @CurrentUser() user: any
  ): Promise<ComplianceValidation> {
    return this.formsService.validateEpaCompliance(submissionId, user.orgId);
  }
}
