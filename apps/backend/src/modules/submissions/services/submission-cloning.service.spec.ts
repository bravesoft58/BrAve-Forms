import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SubmissionCloningService, CloneMode } from './submission-cloning.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormStatus } from '@prisma/client';

describe('SubmissionCloningService', () => {
  let service: SubmissionCloningService;

  const mockPrismaService = {
    formSubmission: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionCloningService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubmissionCloningService>(SubmissionCloningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cloneSubmission', () => {
    it('should clone submission with new ID', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: { field1: 'value1', dateField: '2025-10-22' },
        orgId: 'org_qd_default',
        projectId: 'project-id',
        template: {
          schema: {
            sections: [
              {
                fields: [
                  { id: 'field1', type: 'text' },
                  { id: 'dateField', type: 'date' },
                ],
              },
            ],
          },
        },
      };

      const clonedSubmission = {
        id: 'cloned-id',
        data: { field1: 'value1', dateField: null },
        status: FormStatus.DRAFT,
      };

      mockPrismaService.formSubmission.findUnique.mockResolvedValue(sourceSubmission as any);
      mockPrismaService.formSubmission.create.mockResolvedValue(clonedSubmission as any);

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        userOrgId: 'org_qd_default',
        mode: CloneMode.KEEP_ALL,
      });

      expect(result.id).not.toBe('source-id');
      expect(result.status).toBe(FormStatus.DRAFT);
      expect(mockPrismaService.formSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          templateId: 'template-id',
          status: FormStatus.DRAFT,
          orgId: 'org_qd_default',
          projectId: 'project-id',
        }),
      });
    });

    it('should reset date/time/signature/photo fields', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: {
          textField: 'keep this',
          dateField: '2025-10-22',
          timeField: '14:30',
          datetimeField: '2025-10-22T14:30:00Z',
          signatureField: 'signature-data',
          photoField: 'photo-url',
        },
        orgId: 'org_qd_default',
        projectId: null,
        template: {
          schema: {
            sections: [
              {
                fields: [
                  { id: 'textField', type: 'text' },
                  { id: 'dateField', type: 'date' },
                  { id: 'timeField', type: 'time' },
                  { id: 'datetimeField', type: 'datetime' },
                  { id: 'signatureField', type: 'signature' },
                  { id: 'photoField', type: 'photo' },
                ],
              },
            ],
          },
        },
      };

      mockPrismaService.formSubmission.findUnique.mockResolvedValue(sourceSubmission as any);
      mockPrismaService.formSubmission.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'cloned-id', ...data } as any)
      );

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        userOrgId: 'org_qd_default',
        mode: CloneMode.KEEP_ALL,
      });

      const clonedData = result.data as Record<string, any>;
      expect(clonedData.textField).toBe('keep this');
      expect(clonedData.dateField).toBeNull();
      expect(clonedData.timeField).toBeNull();
      expect(clonedData.datetimeField).toBeNull();
      expect(clonedData.signatureField).toBeNull();
      expect(clonedData.photoField).toBeNull();
    });

    it('should keep text/number/select fields', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: {
          textField: 'keep this text',
          numberField: 42,
          selectField: 'option1',
          radioField: 'choice1',
          checkboxField: true,
          checkboxesField: ['opt1', 'opt2'],
        },
        orgId: 'org_qd_default',
        projectId: null,
        template: {
          schema: {
            sections: [
              {
                fields: [
                  { id: 'textField', type: 'text' },
                  { id: 'numberField', type: 'number' },
                  { id: 'selectField', type: 'select' },
                  { id: 'radioField', type: 'radio' },
                  { id: 'checkboxField', type: 'checkbox' },
                  { id: 'checkboxesField', type: 'checkboxes' },
                ],
              },
            ],
          },
        },
      };

      mockPrismaService.formSubmission.findUnique.mockResolvedValue(sourceSubmission as any);
      mockPrismaService.formSubmission.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'cloned-id', ...data } as any)
      );

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        userOrgId: 'org_qd_default',
        mode: CloneMode.KEEP_ALL,
      });

      const clonedData = result.data as Record<string, any>;
      expect(clonedData.textField).toBe('keep this text');
      expect(clonedData.numberField).toBe(42);
      expect(clonedData.selectField).toBe('option1');
      expect(clonedData.radioField).toBe('choice1');
      expect(clonedData.checkboxField).toBe(true);
      expect(clonedData.checkboxesField).toEqual(['opt1', 'opt2']);
    });

    it('should respect CloneMode.STRUCTURE_ONLY', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: {
          textField: 'value',
          numberField: 42,
          dateField: '2025-10-22',
        },
        orgId: 'org_qd_default',
        projectId: null,
        template: {
          schema: {
            sections: [
              {
                fields: [
                  { id: 'textField', type: 'text' },
                  { id: 'numberField', type: 'number' },
                  { id: 'dateField', type: 'date' },
                ],
              },
            ],
          },
        },
      };

      mockPrismaService.formSubmission.findUnique.mockResolvedValue(sourceSubmission as any);
      mockPrismaService.formSubmission.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'cloned-id', ...data } as any)
      );

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        userOrgId: 'org_qd_default',
        mode: CloneMode.STRUCTURE_ONLY,
      });

      const clonedData = result.data as Record<string, any>;
      expect(clonedData.textField).toBe('');
      expect(clonedData.numberField).toBeNull();
      expect(clonedData.dateField).toBeNull();
    });

    it('should respect CloneMode.CLEAR_ALL', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: {
          textField: 'value',
          numberField: 42,
        },
        orgId: 'org_qd_default',
        projectId: null,
        template: {
          schema: {
            sections: [
              {
                fields: [
                  { id: 'textField', type: 'text' },
                  { id: 'numberField', type: 'number' },
                ],
              },
            ],
          },
        },
      };

      mockPrismaService.formSubmission.findUnique.mockResolvedValue(sourceSubmission as any);
      mockPrismaService.formSubmission.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'cloned-id', ...data } as any)
      );

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        userOrgId: 'org_qd_default',
        mode: CloneMode.CLEAR_ALL,
      });

      expect(result.data).toEqual({});
    });

    it('should throw NotFoundException if source submission not found', async () => {
      mockPrismaService.formSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.cloneSubmission({
          sourceId: 'non-existent',
          userId: 'user-id',
          userOrgId: 'org_qd_default',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when cloning cross-org submission (SECURITY)', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: { field1: 'sensitive data' },
        orgId: 'org_xyz',
        projectId: 'project-id',
        template: {
          schema: {
            sections: [
              {
                fields: [{ id: 'field1', type: 'text' }],
              },
            ],
          },
        },
      };

      mockPrismaService.formSubmission.findUnique.mockResolvedValue(sourceSubmission as any);

      await expect(
        service.cloneSubmission({
          sourceId: 'source-id',
          userId: 'user-id',
          userOrgId: 'org_abc',
        })
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.cloneSubmission({
          sourceId: 'source-id',
          userId: 'user-id',
          userOrgId: 'org_abc',
        })
      ).rejects.toThrow('User from org org_abc cannot clone submission from org org_xyz');

      expect(mockPrismaService.formSubmission.create).not.toHaveBeenCalled();
    });
  });

  describe('cloneYesterdaysSubmission', () => {
    it('should clone yesterday submission', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterdaySubmission = {
        id: 'yesterday-id',
        templateId: 'template-id',
        data: { field1: 'value1' },
        orgId: 'org_qd_default',
        projectId: null,
        submittedAt: new Date(yesterday.getTime() + 12 * 60 * 60 * 1000),
        status: FormStatus.SUBMITTED,
        template: {
          schema: {
            sections: [
              {
                fields: [{ id: 'field1', type: 'text' }],
              },
            ],
          },
        },
      };

      mockPrismaService.formSubmission.findFirst.mockResolvedValue(yesterdaySubmission as any);
      mockPrismaService.formSubmission.findUnique.mockResolvedValue(yesterdaySubmission as any);
      mockPrismaService.formSubmission.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'cloned-id', ...data } as any)
      );

      const result = await service.cloneYesterdaysSubmission(
        'template-id',
        'user-id',
        'org_qd_default'
      );

      expect(mockPrismaService.formSubmission.findFirst).toHaveBeenCalledWith({
        where: {
          templateId: 'template-id',
          orgId: 'org_qd_default',
          submittedBy: 'user-id',
          submittedAt: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
          status: FormStatus.SUBMITTED,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      expect(result.id).toBe('cloned-id');
    });

    it('should throw NotFoundException if no yesterday submission found', async () => {
      mockPrismaService.formSubmission.findFirst.mockResolvedValue(null);

      await expect(
        service.cloneYesterdaysSubmission('template-id', 'user-id', 'org_qd_default')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
