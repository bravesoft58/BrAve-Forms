import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FormsService', () => {
  let service: FormsService;

  const mockPrismaService = {
    formTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    formSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFormTemplates', () => {
    it('should return all templates for org when no filters provided', async () => {
      const templates = [
        {
          id: 'template_1',
          orgId: 'org_123',
          name: 'Daily Inspection',
          category: 'OSHA_SAFETY',
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template_2',
          orgId: 'org_123',
          name: 'EPA SWPPP',
          category: 'EPA_SWPPP',
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.formTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getFormTemplates('org_123');

      expect(result).toEqual(templates);
      expect(mockPrismaService.formTemplate.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org_123' },
        orderBy: { createdAt: 'desc' },
        skip: undefined,
        take: undefined,
      });
    });

    it('should filter templates by category', async () => {
      const templates = [
        {
          id: 'template_2',
          orgId: 'org_123',
          name: 'EPA SWPPP',
          category: 'EPA_SWPPP',
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.formTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getFormTemplates('org_123', {
        category: 'EPA_SWPPP',
      });

      expect(result).toEqual(templates);
      expect(mockPrismaService.formTemplate.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org_123', category: 'EPA_SWPPP' },
        orderBy: { createdAt: 'desc' },
        skip: undefined,
        take: undefined,
      });
    });

    it('should filter templates by active status', async () => {
      const templates = [
        {
          id: 'template_1',
          orgId: 'org_123',
          name: 'Active Template',
          category: 'OSHA_SAFETY',
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.formTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getFormTemplates('org_123', { isActive: true });

      expect(result).toEqual(templates);
      expect(mockPrismaService.formTemplate.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org_123', isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: undefined,
        take: undefined,
      });
    });

    it('should support pagination with skip and take', async () => {
      const templates = [
        {
          id: 'template_11',
          orgId: 'org_123',
          name: 'Page 2 Item',
          category: 'CUSTOM',
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.formTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getFormTemplates('org_123', { skip: 10, take: 10 });

      expect(result).toEqual(templates);
      expect(mockPrismaService.formTemplate.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org_123' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });

    it('should combine all filters and pagination', async () => {
      const templates = [];

      mockPrismaService.formTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getFormTemplates('org_123', {
        category: 'EPA_CGP',
        isActive: false,
        skip: 5,
        take: 20,
      });

      expect(result).toEqual(templates);
      expect(mockPrismaService.formTemplate.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org_123', category: 'EPA_CGP', isActive: false },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 20,
      });
    });
  });

  describe('createFormTemplate', () => {
    const validTemplateData = {
      orgId: 'org_123',
      name: 'Daily Safety Inspection',
      description: 'Standard safety checklist',
      category: 'OSHA_SAFETY' as const,
      schema: {
        fields: [
          {
            id: 'field1',
            type: 'text',
            name: 'inspectorName',
            label: 'Inspector Name',
            validation: { required: true },
          },
        ],
      },
      compliance: {
        regulation: 'OSHA 1926',
        retention: { years: 5 },
      },
      createdBy: 'user_456',
    };

    it('should create a form template with all fields', async () => {
      const expectedResult = {
        id: 'template_789',
        ...validTemplateData,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.formTemplate.create.mockResolvedValue(expectedResult);

      const result = await service.createFormTemplate(validTemplateData);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.formTemplate.create).toHaveBeenCalledWith({
        data: {
          orgId: validTemplateData.orgId,
          name: validTemplateData.name,
          description: validTemplateData.description,
          category: validTemplateData.category,
          schema: validTemplateData.schema,
          compliance: validTemplateData.compliance,
          createdBy: validTemplateData.createdBy,
        },
      });
    });

    it('should create template without optional description', async () => {
      const dataWithoutDescription = {
        ...validTemplateData,
        description: undefined,
      };

      mockPrismaService.formTemplate.create.mockResolvedValue({
        id: 'template_123',
        ...dataWithoutDescription,
      });

      await service.createFormTemplate(dataWithoutDescription);

      expect(mockPrismaService.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: undefined,
        }),
      });
    });

    it('should create template without optional compliance', async () => {
      const dataWithoutCompliance = {
        ...validTemplateData,
        compliance: undefined,
      };

      mockPrismaService.formTemplate.create.mockResolvedValue({
        id: 'template_456',
        ...dataWithoutCompliance,
      });

      await service.createFormTemplate(dataWithoutCompliance);

      expect(mockPrismaService.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          compliance: undefined,
        }),
      });
    });

    it('should handle JSONB schema field correctly', async () => {
      const complexSchema = {
        ...validTemplateData,
        schema: {
          fields: [
            {
              id: 'field1',
              type: 'number',
              name: 'rainfallAmount',
              label: 'Rainfall (inches)',
              validation: {
                required: true,
                min: 0,
                max: 10,
                step: 0.01,
              },
              metadata: {
                epaCompliance: {
                  regulation: 'EPA CGP 2022',
                  threshold: 0.25,
                },
              },
            },
          ],
        },
      };

      mockPrismaService.formTemplate.create.mockResolvedValue({
        id: 'template_complex',
        ...complexSchema,
      });

      await service.createFormTemplate(complexSchema);

      expect(mockPrismaService.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schema: complexSchema.schema,
        }),
      });
    });

    it('should properly isolate by orgId', async () => {
      mockPrismaService.formTemplate.create.mockResolvedValue({
        id: 'template_isolated',
        ...validTemplateData,
      });

      await service.createFormTemplate(validTemplateData);

      expect(mockPrismaService.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId: 'org_123',
        }),
      });
    });
  });

  describe('getFormTemplate', () => {
    it('should return template when found', async () => {
      const template = { id: '1', name: 'Template 1', orgId: 'org_123' };

      mockPrismaService.formTemplate.findFirst.mockResolvedValue(template);

      const result = await service.getFormTemplate('1', 'org_123');

      expect(result).toEqual(template);
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrismaService.formTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getFormTemplate('999', 'org_123')).rejects.toThrow(NotFoundException);
    });

    it('should enforce orgId isolation', async () => {
      mockPrismaService.formTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getFormTemplate('1', 'wrong_org')).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.formTemplate.findFirst).toHaveBeenCalledWith({
        where: {
          id: '1',
          orgId: 'wrong_org',
        },
      });
    });
  });
});
