import {
  ObjectType,
  InputType,
  Field,
  ID,
  registerEnumType,
} from '@nestjs/graphql';

/**
 * ISSUE-174: Support Request Types
 *
 * GraphQL types for support/help system.
 * Stores support requests submitted via Contact Support form.
 */

export enum SupportRequestType {
  BUG = 'bug',
  FEATURE = 'feature',
  HELP = 'help',
  FEEDBACK = 'feedback',
}

export enum SupportRequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportRequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

registerEnumType(SupportRequestType, {
  name: 'SupportRequestType',
  description: 'Type of support request',
});

registerEnumType(SupportRequestStatus, {
  name: 'SupportRequestStatus',
  description: 'Status of support request',
});

registerEnumType(SupportRequestPriority, {
  name: 'SupportRequestPriority',
  description: 'Priority level of support request',
});

@ObjectType()
export class SupportRequest {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  orgId: string;

  @Field(() => SupportRequestType)
  type: SupportRequestType;

  @Field()
  subject: string;

  @Field()
  description: string;

  @Field(() => SupportRequestStatus)
  status: SupportRequestStatus;

  @Field(() => SupportRequestPriority)
  priority: SupportRequestPriority;

  @Field({ nullable: true })
  response?: string;

  @Field({ nullable: true })
  respondedAt?: Date;

  @Field({ nullable: true })
  respondedBy?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateSupportRequestInput {
  @Field(() => SupportRequestType)
  type: SupportRequestType;

  @Field()
  subject: string;

  @Field()
  description: string;

  @Field(() => SupportRequestPriority, { nullable: true })
  priority?: SupportRequestPriority;
}
