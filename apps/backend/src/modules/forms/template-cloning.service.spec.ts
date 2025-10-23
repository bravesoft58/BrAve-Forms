import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplateCloningService } from './template-cloning.service';
import { PrismaService } from '@/modules/database/prisma.service';

describe('TemplateCloningService', () => {
  let service: TemplateCloningService;

  const mockPrisma = {
    formTemplate: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    formTemplateVersion: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateCloningService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TemplateCloningService>(TemplateCloningService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cloneTemplate', () => {
    const sourceTemplate = {
      id: 'source-template-id',
      orgId: 'source-org-id',
      name: 'Daily Safety Inspection',
      description: 'Standard daily safety inspection form',
      category: 'OSHA_SAFETY',
      schema: {
        fields: [
          { id: 'field1', type: 'text', label: 'Site Name', required: true },
          { id: 'field2', type: 'date', label: 'Inspection Date', required: true },
        ],
      },
      compliance: null,
      version: 3,
      isActive: true,
      createdBy: 'original-user-id',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    const targetOrgId = 'target-org-123';
    const targetUserId = 'target-user-456';

    it('should clone a template without customizations', async () => {
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        orgId: targetOrgId,
        name: 'Daily Safety Inspection (Copy)',
        version: 1,
        createdBy: targetUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({
        id: 'version-id',
        templateId: clonedTemplate.id,
        version: 1,
        schema: clonedTemplate.schema,
        changeLog: `Cloned from template ${sourceTemplate.id}`,
        createdBy: targetUserId,
        createdAt: new Date(),
      });

      const result = await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId);

      expect(mockPrisma.formTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: sourceTemplate.id },
      });

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: {
          orgId: targetOrgId,
          name: 'Daily Safety Inspection (Copy)',
          description: sourceTemplate.description,
          category: sourceTemplate.category,
          schema: sourceTemplate.schema,
          compliance: sourceTemplate.compliance,
          version: 1,
          createdBy: targetUserId,
        },
      });

      expect(mockPrisma.formTemplateVersion.create).toHaveBeenCalledWith({
        data: {
          templateId: clonedTemplate.id,
          version: 1,
          schema: clonedTemplate.schema,
          changeLog: `Cloned from template ${sourceTemplate.id}`,
          createdBy: targetUserId,
        },
      });

      expect(result).toEqual(clonedTemplate);
    });

    it('should clone a template with custom name', async () => {
      const customName = 'My Custom Safety Inspection';
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        orgId: targetOrgId,
        name: customName,
        version: 1,
        createdBy: targetUserId,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      const result = await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId, {
        name: customName,
      });

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: customName,
        }),
      });

      expect(result.name).toBe(customName);
    });

    it('should clone a template with custom description', async () => {
      const customDescription = 'Modified description for our project';
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        description: customDescription,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      const result = await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId, {
        description: customDescription,
      });

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: customDescription,
        }),
      });

      expect(result.description).toBe(customDescription);
    });

    it('should clone a template with custom category', async () => {
      const customCategory = 'CUSTOM';
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        category: customCategory,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      const result = await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId, {
        category: customCategory as any,
      });

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: customCategory,
        }),
      });

      expect(result.category).toBe(customCategory);
    });

    it('should clone a template with custom schema', async () => {
      const customSchema = {
        fields: [{ id: 'field1', type: 'text', label: 'Custom Field', required: true }],
      };
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        schema: customSchema,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      const result = await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId, {
        schema: customSchema,
      });

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schema: customSchema,
        }),
      });

      expect(result.schema).toEqual(customSchema);
    });

    it('should throw NotFoundException when source template not found', async () => {
      mockPrisma.formTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.cloneTemplate('non-existent-id', targetOrgId, targetUserId)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.formTemplate.create).not.toHaveBeenCalled();
      expect(mockPrisma.formTemplateVersion.create).not.toHaveBeenCalled();
    });

    it('should always set version to 1 for cloned templates', async () => {
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        version: 1,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      const result = await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId);

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 1,
        }),
      });

      expect(result.version).toBe(1);
    });

    it('should create initial version snapshot after cloning', async () => {
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        orgId: targetOrgId,
        version: 1,
        createdBy: targetUserId,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await service.cloneTemplate(sourceTemplate.id, targetOrgId, targetUserId);

      expect(mockPrisma.formTemplateVersion.create).toHaveBeenCalledWith({
        data: {
          templateId: clonedTemplate.id,
          version: 1,
          schema: clonedTemplate.schema,
          changeLog: `Cloned from template ${sourceTemplate.id}`,
          createdBy: targetUserId,
        },
      });
    });
  });

  describe('customizeTemplateForProject', () => {
    const sourceTemplate = {
      id: 'source-template-id',
      orgId: 'org-123',
      name: 'General Daily Log',
      description: 'Standard daily log',
      category: 'CUSTOM',
      schema: { fields: [] },
      compliance: null,
      version: 1,
      isActive: true,
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should customize template for a specific project', async () => {
      const projectId = 'project-456';
      const customizations = {
        name: 'Site A Daily Log',
        description: 'Daily log for Site A construction project',
      };
      const clonedTemplate = {
        ...sourceTemplate,
        id: 'cloned-template-id',
        name: customizations.name,
        description: customizations.description,
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue(clonedTemplate);
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      const result = await service.customizeTemplateForProject(
        sourceTemplate.id,
        projectId,
        customizations,
        sourceTemplate.orgId,
        sourceTemplate.createdBy
      );

      expect(result.name).toBe(customizations.name);
      expect(result.description).toBe(customizations.description);
    });

    it('should pass orgId and userId correctly', async () => {
      const projectId = 'project-789';
      const customizations = { name: 'Custom Template' };
      const orgId = 'org-999';
      const userId = 'user-888';

      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({
        ...sourceTemplate,
        id: 'new-id',
      });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await service.customizeTemplateForProject(
        sourceTemplate.id,
        projectId,
        customizations,
        orgId,
        userId
      );

      expect(mockPrisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId,
          createdBy: userId,
        }),
      });
    });
  });
});
