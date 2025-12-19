import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { FormCategory as PrismaFormCategory, FormStatus as PrismaFormStatus } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

// Re-export Prisma enums for GraphQL
export const FormCategory = PrismaFormCategory;
export type FormCategory = PrismaFormCategory;

export const FormStatus = PrismaFormStatus;
export type FormStatus = PrismaFormStatus;

registerEnumType(FormCategory, {
  name: 'FormCategory',
});

registerEnumType(FormStatus, {
  name: 'FormStatus',
});

// Object Types

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

  @Field(() => FormCategory)
  category: FormCategory;

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

// Input Types

@InputType()
export class CreateFormTemplateInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => FormCategory)
  @IsEnum(FormCategory)
  category: FormCategory;

  @Field(() => GraphQLJSON)
  @IsObject()
  schema: any;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  compliance?: any;
}

@InputType()
export class UpdateFormTemplateInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  schema?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  compliance?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class CreateFormSubmissionInput {
  @Field()
  @IsString()
  templateId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  inspectionId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  projectId?: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  data: any;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  offlineCreated?: boolean;
}

@InputType()
export class UpdateFormSubmissionInput {
  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  data?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @Field(() => FormStatus, { nullable: true })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

@InputType()
export class CloneFormTemplateInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => FormCategory, { nullable: true })
  @IsOptional()
  @IsEnum(FormCategory)
  category?: FormCategory;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  schema?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  offlineCreated?: boolean;
}
