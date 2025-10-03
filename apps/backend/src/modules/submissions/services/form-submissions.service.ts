import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormsService } from '@/modules/forms/forms.service';
import { SubmissionValidationService, FormTemplate } from './submission-validation.service';
import { FormSubmissionStatus } from '@brave-forms/types';
import { FormStatus } from '@prisma/client';

export interface CreateFormSubmissionInput {
  templateId: string;
  inspectionId?: string;
  projectId?: string;
  data: Record<string, unknown>;
}

export interface UpdateFormSubmissionInput {
  data?: Record<string, unknown>;
  status?: FormSubmissionStatus;
  reviewNotes?: string;
}

@Injectable()
export class FormSubmissionsService {
  constructor(
    private prisma: PrismaService,
    private validationService: SubmissionValidationService,
    private formsService: FormsService
  ) {}

  async create(input: CreateFormSubmissionInput, orgId: string, userId: string) {
    const template = await this.prisma.formTemplate.findFirst({
      where: {
        id: input.templateId,
        orgId,
      },
    });

    if (!template) {
      throw new NotFoundException('Form template not found');
    }

    const templateForValidation: FormTemplate = {
      id: template.id,
      name: template.name,
      fields: (template.schema as { fields: unknown })?.fields as any[],
    };

    const typeValidation = this.validationService.validateFieldTypes(
      input.data,
      templateForValidation
    );

    if (!typeValidation.isValid) {
      throw new BadRequestException(typeValidation.errors.join(', '));
    }

    return this.prisma.formSubmission.create({
      data: {
        orgId,
        templateId: input.templateId,
        inspectionId: input.inspectionId,
        projectId: input.projectId,
        data: input.data as any,
        status: FormStatus.DRAFT,
        submittedBy: userId,
      },
    });
  }

  async findOne(id: string, orgId: string) {
    const submission = await this.prisma.formSubmission.findFirst({
      where: { id, orgId },
      include: {
        template: true,
        project: true,
        inspection: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Form submission not found');
    }

    return submission;
  }

  async findAll(
    orgId: string,
    filters?: {
      templateId?: string;
      projectId?: string;
      inspectionId?: string;
      status?: FormSubmissionStatus;
      take?: number;
      skip?: number;
    }
  ) {
    const where: any = { orgId };

    if (filters?.templateId) where.templateId = filters.templateId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.inspectionId) where.inspectionId = filters.inspectionId;
    if (filters?.status) where.status = this.mapToFormStatus(filters.status);

    return this.prisma.formSubmission.findMany({
      where,
      include: {
        template: true,
        project: true,
        inspection: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.take,
      skip: filters?.skip,
    });
  }

  async update(id: string, input: UpdateFormSubmissionInput, orgId: string, userId: string) {
    const existing = await this.prisma.formSubmission.findFirst({
      where: { id, orgId },
      include: { template: true },
    });

    if (!existing) {
      throw new NotFoundException('Form submission not found');
    }

    if (input.status) {
      const currentStatus = this.mapFromFormStatus(existing.status);
      const isValid = this.validationService.validateStatusTransition(currentStatus, input.status);

      if (!isValid) {
        throw new BadRequestException(
          `Invalid status transition: ${currentStatus} → ${input.status}`
        );
      }

      if (input.status === FormSubmissionStatus.REJECTED && input.reviewNotes) {
        const notesValidation = this.validationService.validateRejectionNotes(input.reviewNotes);
        if (!notesValidation.isValid) {
          throw new BadRequestException(notesValidation.errors.join(', '));
        }
      }
    }

    if (input.status === FormSubmissionStatus.SUBMITTED) {
      const templateForValidation: FormTemplate = {
        id: existing.template.id,
        name: existing.template.name,
        fields: (existing.template.schema as { fields: unknown })?.fields as any[],
      };

      const validation = this.validationService.validateRequiredFields(
        input.data || (existing.data as any),
        templateForValidation
      );

      if (!validation.isValid) {
        throw new BadRequestException(validation.errors.join(', '));
      }
    }

    const updateData: any = {};

    if (input.data) {
      updateData.data = input.data;
    }

    if (input.status) {
      updateData.status = this.mapToFormStatus(input.status);

      if (input.status === FormSubmissionStatus.SUBMITTED && !existing.submittedAt) {
        updateData.submittedAt = new Date();
      }

      if (
        (input.status === FormSubmissionStatus.APPROVED ||
          input.status === FormSubmissionStatus.REJECTED ||
          input.status === FormSubmissionStatus.REVIEWED) &&
        !existing.reviewedAt
      ) {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = userId;
      }
    }

    if (input.reviewNotes !== undefined) {
      updateData.reviewNotes = input.reviewNotes;
    }

    return this.prisma.formSubmission.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
        project: true,
        inspection: true,
      },
    });
  }

  async approve(id: string, orgId: string, userId: string) {
    const submission = await this.prisma.formSubmission.findFirst({
      where: { id, orgId },
    });

    if (!submission) {
      throw new NotFoundException('Form submission not found');
    }

    const currentStatus = this.mapFromFormStatus(submission.status);
    if (currentStatus !== FormSubmissionStatus.SUBMITTED) {
      throw new BadRequestException(
        `Cannot approve submission with status ${currentStatus}. Only SUBMITTED forms can be approved.`
      );
    }

    return this.prisma.formSubmission.update({
      where: { id },
      data: {
        status: FormStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
      include: {
        template: true,
        project: true,
        inspection: true,
      },
    });
  }

  async reject(id: string, notes: string, orgId: string, userId: string) {
    const submission = await this.prisma.formSubmission.findFirst({
      where: { id, orgId },
    });

    if (!submission) {
      throw new NotFoundException('Form submission not found');
    }

    const currentStatus = this.mapFromFormStatus(submission.status);
    if (currentStatus !== FormSubmissionStatus.SUBMITTED) {
      throw new BadRequestException(
        `Cannot reject submission with status ${currentStatus}. Only SUBMITTED forms can be rejected.`
      );
    }

    const notesValidation = this.validationService.validateRejectionNotes(notes);
    if (!notesValidation.isValid) {
      throw new BadRequestException(notesValidation.errors.join(', '));
    }

    return this.prisma.formSubmission.update({
      where: { id },
      data: {
        status: FormStatus.REJECTED,
        reviewNotes: notes,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
      include: {
        template: true,
        project: true,
        inspection: true,
      },
    });
  }

  async delete(id: string, orgId: string) {
    const existing = await this.prisma.formSubmission.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException('Form submission not found');
    }

    if (existing.status === FormStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved submissions (compliance record)');
    }

    await this.prisma.formSubmission.delete({
      where: { id },
    });

    return true;
  }

  private mapToFormStatus(status: FormSubmissionStatus): FormStatus {
    const mapping: Record<FormSubmissionStatus, FormStatus> = {
      [FormSubmissionStatus.DRAFT]: FormStatus.DRAFT,
      [FormSubmissionStatus.IN_PROGRESS]: FormStatus.IN_PROGRESS,
      [FormSubmissionStatus.SUBMITTED]: FormStatus.SUBMITTED,
      [FormSubmissionStatus.REVIEWED]: FormStatus.REVIEWED,
      [FormSubmissionStatus.APPROVED]: FormStatus.APPROVED,
      [FormSubmissionStatus.REJECTED]: FormStatus.REJECTED,
    };

    return mapping[status];
  }

  private mapFromFormStatus(status: FormStatus): FormSubmissionStatus {
    const mapping: Record<FormStatus, FormSubmissionStatus> = {
      [FormStatus.DRAFT]: FormSubmissionStatus.DRAFT,
      [FormStatus.IN_PROGRESS]: FormSubmissionStatus.IN_PROGRESS,
      [FormStatus.SUBMITTED]: FormSubmissionStatus.SUBMITTED,
      [FormStatus.REVIEWED]: FormSubmissionStatus.REVIEWED,
      [FormStatus.APPROVED]: FormSubmissionStatus.APPROVED,
      [FormStatus.REJECTED]: FormSubmissionStatus.REJECTED,
    };

    return mapping[status];
  }
}
