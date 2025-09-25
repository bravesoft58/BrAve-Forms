import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import type { FormTemplate, FormSubmission } from '@brave-forms/types';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  // Form Templates
  async createFormTemplate(data: {
    orgId: string;
    name: string;
    description?: string;
    category: 'EPA_SWPPP' | 'EPA_CGP' | 'OSHA_SAFETY' | 'STATE_PERMIT' | 'CUSTOM';
    schema: any;
    compliance?: any;
    createdBy: string;
  }) {
    return this.prisma.formTemplate.create({
      data: {
        orgId: data.orgId,
        name: data.name,
        description: data.description,
        category: data.category,
        schema: data.schema,
        compliance: data.compliance,
        createdBy: data.createdBy,
      },
    });
  }

  async getFormTemplates(orgId: string) {
    return this.prisma.formTemplate.findMany({
      where: {
        orgId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getFormTemplate(id: string, orgId: string) {
    const template = await this.prisma.formTemplate.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!template) {
      throw new NotFoundException('Form template not found');
    }

    return template;
  }

  async updateFormTemplate(
    id: string,
    orgId: string,
    data: {
      name?: string;
      description?: string;
      schema?: any;
      compliance?: any;
      isActive?: boolean;
    }
  ) {
    const template = await this.getFormTemplate(id, orgId);

    return this.prisma.formTemplate.update({
      where: { id },
      data: {
        ...data,
        version: data.schema ? template.version + 1 : template.version,
      },
    });
  }

  async deleteFormTemplate(id: string, orgId: string) {
    await this.getFormTemplate(id, orgId);

    return this.prisma.formTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async duplicateFormTemplate(id: string, orgId: string, createdBy: string) {
    const original = await this.getFormTemplate(id, orgId);

    return this.prisma.formTemplate.create({
      data: {
        orgId,
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        schema: original.schema,
        compliance: original.compliance,
        createdBy,
      },
    });
  }

  // Form Submissions
  async createFormSubmission(data: {
    orgId: string;
    templateId: string;
    inspectionId?: string;
    projectId?: string;
    submittedBy: string;
    data: any;
    metadata?: any;
    offlineCreated?: boolean;
  }) {
    // Validate template exists and belongs to org
    await this.getFormTemplate(data.templateId, data.orgId);

    return this.prisma.formSubmission.create({
      data: {
        orgId: data.orgId,
        templateId: data.templateId,
        inspectionId: data.inspectionId,
        projectId: data.projectId,
        submittedBy: data.submittedBy,
        data: data.data,
        metadata: data.metadata,
        offlineCreated: data.offlineCreated || false,
        status: 'DRAFT',
      },
    });
  }

  async getFormSubmissions(orgId: string, filters?: {
    templateId?: string;
    projectId?: string;
    inspectionId?: string;
    status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  }) {
    return this.prisma.formSubmission.findMany({
      where: {
        orgId,
        ...filters,
      },
      include: {
        template: true,
        project: true,
        inspection: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getFormSubmission(id: string, orgId: string) {
    const submission = await this.prisma.formSubmission.findFirst({
      where: {
        id,
        orgId,
      },
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

  async updateFormSubmission(
    id: string,
    orgId: string,
    data: {
      data?: any;
      metadata?: any;
      status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
      reviewNotes?: string;
      reviewedBy?: string;
    }
  ) {
    const submission = await this.getFormSubmission(id, orgId);

    return this.prisma.formSubmission.update({
      where: { id },
      data: {
        ...data,
        submittedAt: data.status === 'SUBMITTED' && !submission.submittedAt 
          ? new Date() 
          : submission.submittedAt,
        reviewedAt: data.status && ['REVIEWED', 'APPROVED', 'REJECTED'].includes(data.status)
          ? new Date()
          : submission.reviewedAt,
      },
    });
  }

  // EPA Compliance Validation
  async validateEpaCompliance(submissionId: string, orgId: string) {
    const submission = await this.getFormSubmission(submissionId, orgId);
    const template = submission.template;

    const validationResults = {
      isCompliant: true,
      violations: [],
      warnings: [],
      recommendations: [],
    };

    // Check critical EPA thresholds
    if (template.compliance?.criticalThresholds) {
      for (const threshold of template.compliance.criticalThresholds) {
        const fieldValue = submission.data[threshold.field];
        
        if (threshold.field === 'rainfallAmount' && fieldValue !== undefined) {
          // EPA CGP requires exactly 0.25" threshold - no rounding
          if (fieldValue < 0.25) {
            validationResults.violations.push(
              'Inspection required at exactly 0.25 inches of precipitation'
            );
            validationResults.isCompliant = false;
          }
        }
      }
    }

    // Check required fields
    if (template.schema?.fields) {
      for (const field of template.schema.fields) {
        if (field.validation?.required && !submission.data[field.name]) {
          validationResults.violations.push(
            `Required field "${field.label}" is missing`
          );
          validationResults.isCompliant = false;
        }
      }
    }

    // Check GPS requirement for photos (EPA compliance)
    if (template.schema?.fields) {
      for (const field of template.schema.fields) {
        if (field.type === 'photo' && field.metadata?.gpsRequired) {
          const photoData = submission.data[field.name];
          if (photoData && !photoData.gpsLocation) {
            validationResults.violations.push(
              'Photo must include GPS location for EPA compliance'
            );
            validationResults.isCompliant = false;
          }
        }
      }
    }

    return validationResults;
  }

  // Template Presets
  async createEpaSwpppTemplate(orgId: string, createdBy: string) {
    const template = {
      orgId,
      name: 'EPA SWPPP Inspection Form',
      description: 'EPA 2022 CGP compliant stormwater inspection form',
      category: 'EPA_SWPPP' as const,
      schema: {
        fields: [
          {
            id: this.generateId(),
            type: 'text',
            name: 'projectName',
            label: 'Project Name',
            validation: { required: true },
            order: 1,
            width: 'full',
          },
          {
            id: this.generateId(),
            type: 'date',
            name: 'inspectionDate',
            label: 'Inspection Date',
            validation: { 
              required: true,
              maxDate: 'today',
            },
            order: 2,
            width: 'half',
          },
          {
            id: this.generateId(),
            type: 'number',
            name: 'rainfallAmount',
            label: 'Rainfall Amount (inches)',
            description: 'Inspection required at 0.25 inches',
            validation: {
              required: true,
              min: 0,
              max: 10,
              step: 0.01,
            },
            metadata: {
              epaCompliance: {
                regulation: 'EPA CGP 2022',
                section: '4.2',
                criticalField: true,
              },
            },
            order: 3,
            width: 'half',
          },
          {
            id: this.generateId(),
            type: 'bmpChecklist',
            name: 'bmpsInstalled',
            label: 'BMPs Installed and Functional',
            validation: { required: true },
            order: 4,
            width: 'full',
          },
          {
            id: this.generateId(),
            type: 'photo',
            name: 'sitePhotos',
            label: 'Site Condition Photos',
            validation: { required: true },
            metadata: {
              gpsRequired: true,
              photoQuality: 'high',
            },
            order: 5,
            width: 'full',
          },
          {
            id: this.generateId(),
            type: 'signature',
            name: 'inspectorSignature',
            label: 'Inspector Signature',
            validation: { required: true },
            metadata: {
              signatureCertificate: true,
            },
            order: 6,
            width: 'full',
          },
        ],
      },
      compliance: {
        regulation: 'EPA 2022 CGP Section 4.2',
        deadline: '24 hours after 0.25 inch precipitation during working hours',
        authority: 'Environmental Protection Agency',
        retention: {
          years: 7,
          archival: true,
        },
        criticalThresholds: [
          {
            field: 'rainfallAmount',
            value: 0.25,
            message: 'Inspection required at exactly 0.25 inches precipitation',
          },
        ],
      },
      createdBy,
    };

    return this.createFormTemplate(template);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}