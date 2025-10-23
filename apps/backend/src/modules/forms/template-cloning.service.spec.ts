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
    $transaction: jest.fn(),
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

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
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
        where: { id: sourceTemplate.id, orgId: targetOrgId },
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

  describe('Security: Multi-Tenant Isolation', () => {
    it('should prevent cross-tenant template cloning (CRITICAL-1 fix)', async () => {
      const differentOrgId = 'org-999';

      // Mock: Template exists but belongs to different org
      mockPrisma.formTemplate.findFirst
        .mockResolvedValueOnce(null) // First call with orgId filter returns null
        .mockResolvedValueOnce({ id: 'template-123', orgId: 'org-different' }); // Second call without orgId filter finds it

      await expect(
        service.cloneTemplate('template-123', differentOrgId, 'user-123')
      ).rejects.toThrow('Cross-tenant template cloning is not permitted');

      expect(mockPrisma.formTemplate.create).not.toHaveBeenCalled();
    });

    it('should allow same-org template cloning', async () => {
      const sameOrgId = 'org-123';
      const sourceTemplate = {
        id: 'template-123',
        orgId: sameOrgId,
        name: 'Test Template',
        description: 'Test',
        category: 'CUSTOM' as any,
        schema: { fields: [] },
        compliance: null,
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({ ...sourceTemplate, id: 'new-id' });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await expect(
        service.cloneTemplate('template-123', sameOrgId, 'user-123')
      ).resolves.toBeDefined();

      expect(mockPrisma.formTemplate.create).toHaveBeenCalled();
    });
  });

  describe('Offline Capability: Metadata Tracking (CRITICAL-2 fix)', () => {
    it('should track offline created flag in changelog', async () => {
      const sourceTemplate = {
        id: 'template-123',
        orgId: 'org-123',
        name: 'Test Template',
        description: 'Test',
        category: 'CUSTOM' as any,
        schema: { fields: [] },
        compliance: null,
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({ ...sourceTemplate, id: 'new-id' });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await service.cloneTemplate('template-123', 'org-123', 'user-123', {
        offlineCreated: true,
      });

      expect(mockPrisma.formTemplateVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changeLog: 'Cloned from template template-123 (offline)',
        }),
      });
    });

    it('should default to online created when flag not provided', async () => {
      const sourceTemplate = {
        id: 'template-123',
        orgId: 'org-123',
        name: 'Test Template',
        description: 'Test',
        category: 'CUSTOM' as any,
        schema: { fields: [] },
        compliance: null,
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({ ...sourceTemplate, id: 'new-id' });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await service.cloneTemplate('template-123', 'org-123', 'user-123');

      expect(mockPrisma.formTemplateVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changeLog: 'Cloned from template template-123',
        }),
      });
    });
  });

  describe('Compliance: EPA/OSHA Field Validation (CRITICAL-3 fix)', () => {
    it('should prevent removal of required EPA compliance fields', async () => {
      const epaTemplate = {
        id: 'epa-template',
        orgId: 'org-123',
        name: 'EPA SWPPP Inspection',
        description: 'EPA compliance form',
        category: 'EPA_SWPPP' as any,
        schema: {
          fields: [
            { id: 'rain_amount', type: 'number', label: 'Rain Amount (inches)', required: true },
            { id: 'inspector_name', type: 'text', label: 'Inspector', required: true },
          ],
        },
        compliance: {
          regulation: 'EPA CGP 2022 Section 4.4',
          requiredFields: ['rain_amount', 'inspector_name'],
        },
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invalidSchema = {
        fields: [
          { id: 'inspector_name', type: 'text', label: 'Inspector', required: true },
          // Missing rain_amount field - should trigger validation error
        ],
      };

      mockPrisma.formTemplate.findFirst.mockResolvedValue(epaTemplate);

      await expect(
        service.cloneTemplate('epa-template', 'org-123', 'user-123', {
          schema: invalidSchema,
        })
      ).rejects.toThrow('Cannot remove required compliance fields: rain_amount');

      await expect(
        service.cloneTemplate('epa-template', 'org-123', 'user-123', {
          schema: invalidSchema,
        })
      ).rejects.toThrow('$50,000 per day');

      expect(mockPrisma.formTemplate.create).not.toHaveBeenCalled();
    });

    it('should allow cloning EPA template with all required fields intact', async () => {
      const epaTemplate = {
        id: 'epa-template',
        orgId: 'org-123',
        name: 'EPA SWPPP Inspection',
        description: 'EPA compliance form',
        category: 'EPA_SWPPP' as any,
        schema: {
          fields: [
            { id: 'rain_amount', type: 'number', label: 'Rain Amount (inches)', required: true },
            { id: 'inspector_name', type: 'text', label: 'Inspector', required: true },
          ],
        },
        compliance: {
          regulation: 'EPA CGP 2022 Section 4.4',
          requiredFields: ['rain_amount', 'inspector_name'],
        },
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validSchema = {
        fields: [
          { id: 'rain_amount', type: 'number', label: 'Rain Amount (inches)', required: true },
          { id: 'inspector_name', type: 'text', label: 'Inspector', required: true },
          { id: 'custom_field', type: 'text', label: 'Custom Field', required: false },
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockPrisma.formTemplate.findFirst.mockResolvedValue(epaTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({ ...epaTemplate, id: 'new-id' });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await expect(
        service.cloneTemplate('epa-template', 'org-123', 'user-123', {
          schema: validSchema,
        })
      ).resolves.toBeDefined();

      expect(mockPrisma.formTemplate.create).toHaveBeenCalled();
    });

    it('should allow non-compliance templates without field validation', async () => {
      const customTemplate = {
        id: 'custom-template',
        orgId: 'org-123',
        name: 'Custom Form',
        description: 'Non-compliance form',
        category: 'CUSTOM' as any,
        schema: {
          fields: [
            { id: 'field1', type: 'text', label: 'Field 1' },
            { id: 'field2', type: 'text', label: 'Field 2' },
          ],
        },
        compliance: null, // No compliance metadata
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customSchema = {
        fields: [{ id: 'field1', type: 'text', label: 'Field 1' }], // Removed field2 - should be allowed
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockPrisma.formTemplate.findFirst.mockResolvedValue(customTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({ ...customTemplate, id: 'new-id' });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await expect(
        service.cloneTemplate('custom-template', 'org-123', 'user-123', {
          schema: customSchema,
        })
      ).resolves.toBeDefined();

      expect(mockPrisma.formTemplate.create).toHaveBeenCalled();
    });
  });

  describe('Database Transaction: Atomicity (CRITICAL-4 fix)', () => {
    it('should use transaction to ensure template and version created atomically', async () => {
      const sourceTemplate = {
        id: 'template-123',
        orgId: 'org-123',
        name: 'Test Template',
        description: 'Test',
        category: 'CUSTOM' as any,
        schema: { fields: [] },
        compliance: null,
        version: 1,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockPrisma.formTemplate.findFirst.mockResolvedValue(sourceTemplate);
      mockPrisma.formTemplate.create.mockResolvedValue({ ...sourceTemplate, id: 'new-id' });
      mockPrisma.formTemplateVersion.create.mockResolvedValue({});

      await service.cloneTemplate('template-123', 'org-123', 'user-123');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.formTemplate.create).toHaveBeenCalled();
      expect(mockPrisma.formTemplateVersion.create).toHaveBeenCalled();
    });
  });
});
