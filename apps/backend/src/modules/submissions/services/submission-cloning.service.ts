import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormStatus } from '@prisma/client';

export enum CloneMode {
  KEEP_ALL = 'keep_all',
  STRUCTURE_ONLY = 'structure_only',
  CLEAR_ALL = 'clear_all',
}

interface CloneSubmissionInput {
  sourceId: string;
  userId: string;
  userOrgId: string;
  mode?: CloneMode;
}

interface SchemaSection {
  fields?: Array<{ id: string; type: string }>;
}

interface FormSchema {
  sections?: SchemaSection[];
  fields?: Array<{ id: string; type: string }>;
}

@Injectable()
export class SubmissionCloningService {
  constructor(private readonly prisma: PrismaService) {}

  async cloneSubmission({
    sourceId,
    userId,
    userOrgId,
    mode = CloneMode.KEEP_ALL,
  }: CloneSubmissionInput) {
    const source = await this.prisma.formSubmission.findUnique({
      where: { id: sourceId },
      include: {
        template: true,
      },
    });

    if (!source) {
      throw new NotFoundException(
        `Submission ${sourceId} not found for user ${userId} in org ${userOrgId}`
      );
    }

    // CRITICAL: Validate multi-tenant isolation (three-layer defense - application layer)
    if (source.orgId !== userOrgId) {
      throw new ForbiddenException(
        `User from org ${userOrgId} cannot clone submission from org ${source.orgId}`
      );
    }

    const clonedData = this.processFieldsByMode(
      source.data as Record<string, any>,
      source.template.schema as FormSchema,
      mode
    );

    const cloned = await this.prisma.formSubmission.create({
      data: {
        templateId: source.templateId,
        data: clonedData,
        status: FormStatus.DRAFT,
        submittedBy: userId,
        orgId: source.orgId,
        projectId: source.projectId,
        inspectionId: source.inspectionId,
      },
    });

    return cloned;
  }

  private processFieldsByMode(
    data: Record<string, any>,
    schema: FormSchema,
    mode: CloneMode
  ): Record<string, any> {
    if (mode === CloneMode.CLEAR_ALL) {
      return {};
    }

    if (mode === CloneMode.STRUCTURE_ONLY) {
      return this.resetTemporalFields(data, schema, true);
    }

    return this.resetTemporalFields(data, schema, false);
  }

  private resetTemporalFields(
    data: Record<string, any>,
    schema: FormSchema,
    clearAll: boolean
  ): Record<string, any> {
    const result: Record<string, any> = {};

    const fields: Array<{ id: string; type: string }> = [];

    if (schema.sections && schema.sections.length > 0) {
      for (const section of schema.sections) {
        if (section.fields) {
          fields.push(...section.fields);
        }
      }
    } else if (schema.fields && schema.fields.length > 0) {
      fields.push(...schema.fields);
    }

    for (const field of fields) {
      const fieldId = field.id;
      const fieldType = field.type;
      const value = data[fieldId];

      const shouldReset = this.shouldResetField(fieldType, clearAll);

      if (shouldReset) {
        result[fieldId] = this.getEmptyValue(fieldType);
      } else if (value !== undefined) {
        result[fieldId] = value;
      }
    }

    return result;
  }

  private shouldResetField(fieldType: string, clearAll: boolean): boolean {
    const identityFields = ['date', 'time', 'datetime', 'signature', 'photo'];
    if (identityFields.includes(fieldType)) {
      return true;
    }

    if (clearAll) {
      const structuralFields = ['section', 'heading', 'divider'];
      return !structuralFields.includes(fieldType);
    }

    return false;
  }

  private getEmptyValue(fieldType: string): any {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
        return '';
      case 'number':
        return null;
      case 'date':
      case 'time':
      case 'datetime':
        return null;
      case 'select':
      case 'radio':
        return '';
      case 'checkbox':
        return false;
      case 'checkboxes':
        return [];
      case 'photo':
      case 'signature':
      case 'file':
        return null;
      default:
        return null;
    }
  }

  async cloneYesterdaysSubmission(templateId: string, userId: string, orgId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdaySubmission = await this.prisma.formSubmission.findFirst({
      where: {
        templateId,
        orgId,
        submittedBy: userId,
        submittedAt: {
          gte: yesterday,
          lt: today,
        },
        status: FormStatus.SUBMITTED,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (!yesterdaySubmission) {
      throw new NotFoundException(
        `No submission found for yesterday (template: ${templateId}, user: ${userId}, org: ${orgId})`
      );
    }

    return this.cloneSubmission({
      sourceId: yesterdaySubmission.id,
      userId,
      userOrgId: orgId,
      mode: CloneMode.KEEP_ALL,
    });
  }
}
