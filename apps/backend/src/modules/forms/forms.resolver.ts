import { Resolver, Query, Mutation, Args, Context, ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FormsService } from './forms.service';
import { GraphQLJSON } from 'graphql-type-json';

// Enums
export enum FormTemplateCategory {
  EPA_SWPPP = 'EPA_SWPPP',
  EPA_CGP = 'EPA_CGP',
  OSHA_SAFETY = 'OSHA_SAFETY',
  STATE_PERMIT = 'STATE_PERMIT',
  CUSTOM = 'CUSTOM',
}

export enum FormStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(FormTemplateCategory, {
  name: 'FormTemplateCategory',
});

registerEnumType(FormStatus, {
  name: 'FormStatus',
});

@Resolver()
@UseGuards(ClerkAuthGuard)
export class FormsResolver {
  constructor(private readonly formsService: FormsService) {}

  // Form Template Queries
  @Query(() => [FormTemplate])
  async formTemplates(
    @CurrentUser() user: any
  ): Promise<FormTemplate[]> {
    return this.formsService.getFormTemplates(user.orgId);
  }

  @Query(() => FormTemplate)
  async formTemplate(
    @Args('id') id: string,
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
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
  async deleteFormTemplate(
    @Args('id') id: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    await this.formsService.deleteFormTemplate(id, user.orgId);
    return true;
  }

  @Mutation(() => FormTemplate)
  async createEpaSwpppTemplate(
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
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
  async formSubmission(
    @Args('id') id: string,
    @CurrentUser() user: any
  ): Promise<FormSubmission> {
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
      reviewedBy: input.status && ['REVIEWED', 'APPROVED', 'REJECTED'].includes(input.status)
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

// Supporting Types for GraphQL Schema

@ObjectType()
export class FormTemplate {
  @Field(() => ID)
  id: string;

  @Field()
  orgId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => FormTemplateCategory)
  category: FormTemplateCategory;

  @Field()
  version: number;

  @Field()
  isActive: boolean;

  @Field(() => GraphQLJSON)
  schema: any;

  @Field(() => GraphQLJSON, { nullable: true })
  compliance?: any;

  @Field()
  createdBy: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class FormSubmission {
  @Field(() => ID)
  id: string;

  @Field()
  orgId: string;

  @Field()
  templateId: string;

  @Field({ nullable: true })
  inspectionId?: string;

  @Field({ nullable: true })
  projectId?: string;

  @Field()
  submittedBy: string;

  @Field(() => FormStatus)
  status: FormStatus;

  @Field(() => GraphQLJSON)
  data: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  offlineCreated: boolean;

  @Field({ nullable: true })
  submittedAt?: Date;

  @Field({ nullable: true })
  reviewedBy?: string;

  @Field({ nullable: true })
  reviewedAt?: Date;

  @Field({ nullable: true })
  reviewNotes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => FormTemplate)
  template: FormTemplate;
}

@ObjectType()
export class ComplianceValidation {
  @Field()
  isCompliant: boolean;

  @Field(() => [String])
  violations: string[];

  @Field(() => [String])
  warnings: string[];

  @Field(() => [String])
  recommendations: string[];
}

@InputType()
export class CreateFormTemplateInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => FormTemplateCategory)
  category: FormTemplateCategory;

  @Field(() => GraphQLJSON)
  schema: any;

  @Field(() => GraphQLJSON, { nullable: true })
  compliance?: any;
}

@InputType()
export class UpdateFormTemplateInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  schema?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  compliance?: any;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class CreateFormSubmissionInput {
  @Field()
  templateId: string;

  @Field({ nullable: true })
  inspectionId?: string;

  @Field({ nullable: true })
  projectId?: string;

  @Field(() => GraphQLJSON)
  data: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field({ nullable: true })
  offlineCreated?: boolean;
}

@InputType()
export class UpdateFormSubmissionInput {
  @Field(() => GraphQLJSON, { nullable: true })
  data?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field(() => FormStatus, { nullable: true })
  status?: FormStatus;

  @Field({ nullable: true })
  reviewNotes?: string;
}