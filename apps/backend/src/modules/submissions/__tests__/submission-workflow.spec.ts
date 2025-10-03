import { Test, TestingModule } from '@nestjs/testing';
import { FormSubmissionsService } from '../services/form-submissions.service';
import { SubmissionValidationService } from '../services/submission-validation.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormsService } from '@/modules/forms/forms.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FormSubmissionStatus } from '@brave-forms/types';
import { FormStatus } from '@prisma/client';

describe('Form Submission Workflow', () => {
  let service: FormSubmissionsService;
  let validationService: SubmissionValidationService;

  const mockPrismaService = {
    formTemplate: {
      findFirst: jest.fn(),
    },
    formSubmission: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockFormsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormSubmissionsService,
        SubmissionValidationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
      ],
    }).compile();

    service = module.get<FormSubmissionsService>(FormSubmissionsService);
    validationService = module.get<SubmissionValidationService>(SubmissionValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('State Machine Transitions', () => {
    const orgId = 'org_test_123';
    const userId = 'user_test_456';
    const templateId = 'template_789';

    const mockTemplate = {
      id: templateId,
      orgId,
      name: 'Test Template',
      schema: {
        fields: [
          { id: 'field1', label: 'Field 1', type: 'text', required: true },
          { id: 'field2', label: 'Field 2', type: 'number', required: false },
        ],
      },
    };

    it('should allow DRAFT → IN_PROGRESS transition', async () => {
      const submissionId = 'sub_draft_to_progress';
      const mockSubmission = {
        id: submissionId,
        orgId,
        templateId,
        status: FormStatus.DRAFT,
        data: { field1: 'test' },
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.IN_PROGRESS,
      });

      const result = await service.update(
        submissionId,
        { status: FormSubmissionStatus.IN_PROGRESS },
        orgId,
        userId
      );

      expect(result.status).toBe(FormStatus.IN_PROGRESS);
      expect(mockPrismaService.formSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: submissionId },
          data: expect.objectContaining({ status: FormStatus.IN_PROGRESS }),
        })
      );
    });

    it('should allow DRAFT → SUBMITTED transition with valid required fields', async () => {
      const submissionId = 'sub_draft_to_submitted';
      const mockSubmission = {
        id: submissionId,
        orgId,
        templateId,
        status: FormStatus.DRAFT,
        data: { field1: 'required value', field2: 123 },
        template: mockTemplate,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.SUBMITTED,
        submittedAt: new Date(),
      });

      const result = await service.update(
        submissionId,
        { status: FormSubmissionStatus.SUBMITTED, data: { field1: 'required value', field2: 123 } },
        orgId,
        userId
      );

      expect(result.status).toBe(FormStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
    });

    it('should prevent SUBMITTED → DRAFT transition (invalid)', async () => {
      const submissionId = 'sub_submitted';
      const mockSubmission = {
        id: submissionId,
        orgId,
        templateId,
        status: FormStatus.SUBMITTED,
        data: { field1: 'value' },
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);

      await expect(
        service.update(submissionId, { status: FormSubmissionStatus.DRAFT }, orgId, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow SUBMITTED → APPROVED transition', async () => {
      const submissionId = 'sub_approve';
      const mockSubmission = {
        id: submissionId,
        orgId,
        status: FormStatus.SUBMITTED,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: userId,
      });

      const result = await service.approve(submissionId, orgId, userId);

      expect(result.status).toBe(FormStatus.APPROVED);
      expect(result.reviewedAt).toBeDefined();
      expect(result.reviewedBy).toBe(userId);
    });

    it('should allow SUBMITTED → REJECTED transition with notes', async () => {
      const submissionId = 'sub_reject';
      const mockSubmission = {
        id: submissionId,
        orgId,
        status: FormStatus.SUBMITTED,
      };

      const rejectionNotes = 'Missing required photo documentation';

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.REJECTED,
        reviewNotes: rejectionNotes,
        reviewedAt: new Date(),
        reviewedBy: userId,
      });

      const result = await service.reject(submissionId, rejectionNotes, orgId, userId);

      expect(result.status).toBe(FormStatus.REJECTED);
      expect(result.reviewNotes).toBe(rejectionNotes);
      expect(result.reviewedAt).toBeDefined();
      expect(result.reviewedBy).toBe(userId);
    });

    it('should allow REJECTED → DRAFT transition (resubmit)', async () => {
      const submissionId = 'sub_rejected_to_draft';
      const mockSubmission = {
        id: submissionId,
        orgId,
        templateId,
        status: FormStatus.REJECTED,
        data: { field1: 'value' },
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.DRAFT,
      });

      const result = await service.update(
        submissionId,
        { status: FormSubmissionStatus.DRAFT },
        orgId,
        userId
      );

      expect(result.status).toBe(FormStatus.DRAFT);
    });

    it('should prevent APPROVED → any transition (final state)', async () => {
      const submissionId = 'sub_approved';
      const mockSubmission = {
        id: submissionId,
        orgId,
        templateId,
        status: FormStatus.APPROVED,
        data: { field1: 'value' },
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);

      await expect(
        service.update(submissionId, { status: FormSubmissionStatus.REJECTED }, orgId, userId)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.update(submissionId, { status: FormSubmissionStatus.DRAFT }, orgId, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Required Field Validation', () => {
    const orgId = 'org_validation';
    const userId = 'user_validation';

    it('should prevent submission with missing required fields', async () => {
      const template = {
        id: 'template_req',
        orgId,
        name: 'Required Fields Test',
        schema: {
          fields: [
            { id: 'requiredField', label: 'Required Field', type: 'text', required: true },
            { id: 'optionalField', label: 'Optional Field', type: 'text', required: false },
          ],
        },
      };

      const submissionId = 'sub_missing_required';
      const mockSubmission = {
        id: submissionId,
        orgId,
        templateId: template.id,
        status: FormStatus.DRAFT,
        data: { optionalField: 'has value' },
        template,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);

      await expect(
        service.update(
          submissionId,
          { status: FormSubmissionStatus.SUBMITTED, data: { optionalField: 'has value' } },
          orgId,
          userId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow DRAFT with missing required fields', async () => {
      const templateId = 'template_draft';
      const mockTemplate = {
        id: templateId,
        orgId,
        schema: {
          fields: [{ id: 'requiredField', label: 'Required', type: 'text', required: true }],
        },
      };

      mockPrismaService.formTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrismaService.formSubmission.create.mockResolvedValue({
        id: 'sub_draft_incomplete',
        orgId,
        templateId,
        status: FormStatus.DRAFT,
        data: {},
        submittedBy: userId,
      });

      const result = await service.create({ templateId, data: {} }, orgId, userId);

      expect(result.status).toBe(FormStatus.DRAFT);
    });

    it('should validate field types (number, date, text)', () => {
      const template = {
        id: 'template_types',
        name: 'Type Validation',
        fields: [
          { id: 'numberField', label: 'Number', type: 'number', required: true },
          { id: 'dateField', label: 'Date', type: 'date', required: true },
          { id: 'textField', label: 'Text', type: 'text', required: true },
        ],
      };

      const validData = {
        numberField: 123,
        dateField: '2025-10-03',
        textField: 'valid text',
      };

      const result = validationService.validateFieldTypes(validData, template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);

      const invalidData = {
        numberField: 'not a number',
        dateField: 'invalid-date',
        textField: 123,
      };

      const invalidResult = validationService.validateFieldTypes(invalidData, template);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Approval Workflow', () => {
    const orgId = 'org_approval';
    const userId = 'approver_123';

    it('should approve submitted forms', async () => {
      const submissionId = 'sub_for_approval';
      const mockSubmission = {
        id: submissionId,
        orgId,
        status: FormStatus.SUBMITTED,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.APPROVED,
        reviewedAt: new Date('2025-10-03T17:00:00Z'),
        reviewedBy: userId,
      });

      const result = await service.approve(submissionId, orgId, userId);

      expect(result.status).toBe(FormStatus.APPROVED);
      expect(result.reviewedBy).toBe(userId);
      expect(result.reviewedAt).toBeDefined();
    });

    it('should reject submitted forms with notes', async () => {
      const submissionId = 'sub_for_rejection';
      const mockSubmission = {
        id: submissionId,
        orgId,
        status: FormStatus.SUBMITTED,
      };

      const notes = 'Photos are blurry and unreadable';

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.REJECTED,
        reviewNotes: notes,
        reviewedAt: new Date('2025-10-03T17:00:00Z'),
        reviewedBy: userId,
      });

      const result = await service.reject(submissionId, notes, orgId, userId);

      expect(result.status).toBe(FormStatus.REJECTED);
      expect(result.reviewNotes).toBe(notes);
      expect(result.reviewedBy).toBe(userId);
      expect(result.reviewedAt).toBeDefined();
    });

    it('should prevent approval of non-submitted forms', async () => {
      const submissionId = 'sub_draft_no_approve';
      const mockSubmission = {
        id: submissionId,
        orgId,
        status: FormStatus.DRAFT,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);

      await expect(service.approve(submissionId, orgId, userId)).rejects.toThrow(
        BadRequestException
      );

      const mockApprovedSubmission = {
        id: 'sub_already_approved',
        orgId,
        status: FormStatus.APPROVED,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockApprovedSubmission);

      await expect(service.approve('sub_already_approved', orgId, userId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should track approver and timestamp', async () => {
      const submissionId = 'sub_audit_trail';
      const approverId = 'approver_audit_789';
      const approvalTime = new Date('2025-10-03T18:30:00Z');

      const mockSubmission = {
        id: submissionId,
        orgId,
        status: FormStatus.SUBMITTED,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrismaService.formSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: FormStatus.APPROVED,
        reviewedAt: approvalTime,
        reviewedBy: approverId,
      });

      const result = await service.approve(submissionId, orgId, approverId);

      expect(result.reviewedBy).toBe(approverId);
      expect(result.reviewedAt).toEqual(approvalTime);
      expect(mockPrismaService.formSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reviewedAt: expect.any(Date),
            reviewedBy: approverId,
          }),
        })
      );
    });
  });

  describe('Multi-Tenant Isolation', () => {
    const org1 = 'org_tenant_1';
    const org2 = 'org_tenant_2';

    it('should filter submissions by orgId', async () => {
      const org1Submissions = [
        { id: 'sub_org1_1', orgId: org1, status: FormStatus.DRAFT },
        { id: 'sub_org1_2', orgId: org1, status: FormStatus.SUBMITTED },
      ];

      mockPrismaService.formSubmission.findMany.mockResolvedValue(org1Submissions);

      const result = await service.findAll(org1);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: org1 }),
        })
      );
    });

    it('should prevent cross-org submission access', async () => {
      const submissionId = 'sub_org2_secret';
      const mockSubmission = {
        id: submissionId,
        orgId: org2,
        status: FormStatus.SUBMITTED,
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne(submissionId, org1)).rejects.toThrow(NotFoundException);

      mockPrismaService.formSubmission.findFirst.mockResolvedValueOnce(mockSubmission);
      const result = await service.findOne(submissionId, org2);

      expect(result.id).toBe(submissionId);
      expect(mockPrismaService.formSubmission.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: submissionId, orgId: org2 },
        })
      );
    });
  });
});
