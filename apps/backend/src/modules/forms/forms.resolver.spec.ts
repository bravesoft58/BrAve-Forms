import { Test, TestingModule } from '@nestjs/testing';
import { FormsResolver } from './forms.resolver';
import { FormsService } from './forms.service';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { FormTemplate, UpdateFormTemplateInput, FormCategory } from './forms.types';

describe('FormsResolver - CRUD Operations', () => {
  let resolver: FormsResolver;
  let _service: FormsService;

  const mockFormsService = {
    getFormTemplates: jest.fn(),
    getFormTemplate: jest.fn(),
    createFormTemplate: jest.fn(),
    updateFormTemplate: jest.fn(),
    deleteFormTemplate: jest.fn(),
    duplicateFormTemplate: jest.fn(),
  };

  const mockUser = {
    id: 'user_123',
    orgId: 'org_456',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsResolver,
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<FormsResolver>(FormsResolver);
    _service = module.get<FormsService>(FormsService);

    jest.clearAllMocks();
  });

  describe('Query: formTemplates', () => {
    it('should return all templates for org without filters', async () => {
      const templates: FormTemplate[] = [
        {
          id: 'template_1',
          orgId: 'org_456',
          name: 'Daily Inspection',
          category: FormCategory.OSHA_SAFETY,
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template_2',
          orgId: 'org_456',
          name: 'EPA SWPPP Form',
          category: FormCategory.EPA_SWPPP,
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFormsService.getFormTemplates.mockResolvedValue(templates);

      const result = await resolver.formTemplates(mockUser);

      expect(result).toEqual(templates);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_456', undefined);
    });

    it('should filter templates by category', async () => {
      const templates: FormTemplate[] = [
        {
          id: 'template_2',
          orgId: 'org_456',
          name: 'EPA SWPPP Form',
          category: FormCategory.EPA_SWPPP,
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFormsService.getFormTemplates.mockResolvedValue(templates);

      const result = await resolver.formTemplates(mockUser, FormCategory.EPA_SWPPP);

      expect(result).toEqual(templates);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_456', {
        category: FormCategory.EPA_SWPPP,
      });
    });

    it('should filter templates by active status', async () => {
      const templates: FormTemplate[] = [
        {
          id: 'template_1',
          orgId: 'org_456',
          name: 'Active Template',
          category: FormCategory.OSHA_SAFETY,
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFormsService.getFormTemplates.mockResolvedValue(templates);

      const result = await resolver.formTemplates(mockUser, undefined, true);

      expect(result).toEqual(templates);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_456', {
        isActive: true,
      });
    });

    it('should support pagination with skip and take', async () => {
      const templates: FormTemplate[] = [
        {
          id: 'template_3',
          orgId: 'org_456',
          name: 'Page 2 Template',
          category: FormCategory.CUSTOM,
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFormsService.getFormTemplates.mockResolvedValue(templates);

      const result = await resolver.formTemplates(mockUser, undefined, undefined, 10, 10);

      expect(result).toEqual(templates);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_456', {
        skip: 10,
        take: 10,
      });
    });

    it('should combine filters, active status, and pagination', async () => {
      const templates: FormTemplate[] = [];

      mockFormsService.getFormTemplates.mockResolvedValue(templates);

      const result = await resolver.formTemplates(mockUser, FormCategory.EPA_CGP, true, 20, 5);

      expect(result).toEqual(templates);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_456', {
        category: FormCategory.EPA_CGP,
        isActive: true,
        skip: 5,
        take: 20,
      });
    });
  });

  describe('Query: formTemplate', () => {
    it('should return single template by id', async () => {
      const template: FormTemplate = {
        id: 'template_123',
        orgId: 'org_456',
        name: 'Safety Inspection',
        category: FormCategory.OSHA_SAFETY,
        version: 1,
        isActive: true,
        schema: { fields: [] },
        createdBy: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFormsService.getFormTemplate.mockResolvedValue(template);

      const result = await resolver.formTemplate('template_123', mockUser);

      expect(result).toEqual(template);
      expect(mockFormsService.getFormTemplate).toHaveBeenCalledWith('template_123', 'org_456');
    });
  });

  describe('Mutation: updateFormTemplate', () => {
    it('should update template name and description', async () => {
      const input: UpdateFormTemplateInput = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const updatedTemplate: FormTemplate = {
        id: 'template_123',
        orgId: 'org_456',
        name: 'Updated Name',
        description: 'Updated description',
        category: FormCategory.OSHA_SAFETY,
        version: 1,
        isActive: true,
        schema: { fields: [] },
        createdBy: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFormsService.updateFormTemplate.mockResolvedValue(updatedTemplate);

      const result = await resolver.updateFormTemplate('template_123', input, mockUser);

      expect(result).toEqual(updatedTemplate);
      expect(mockFormsService.updateFormTemplate).toHaveBeenCalledWith(
        'template_123',
        'org_456',
        input
      );
    });

    it('should increment version when schema changes', async () => {
      const input: UpdateFormTemplateInput = {
        schema: {
          fields: [
            {
              id: 'field1',
              type: 'text',
              name: 'newField',
              label: 'New Field',
            },
          ],
        },
      };

      const updatedTemplate: FormTemplate = {
        id: 'template_123',
        orgId: 'org_456',
        name: 'Safety Form',
        category: FormCategory.OSHA_SAFETY,
        version: 2,
        isActive: true,
        schema: input.schema,
        createdBy: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFormsService.updateFormTemplate.mockResolvedValue(updatedTemplate);

      const result = await resolver.updateFormTemplate('template_123', input, mockUser);

      expect(result.version).toBe(2);
      expect(mockFormsService.updateFormTemplate).toHaveBeenCalledWith(
        'template_123',
        'org_456',
        input
      );
    });

    it('should update compliance metadata', async () => {
      const input: UpdateFormTemplateInput = {
        compliance: {
          regulation: 'EPA CGP 2022',
          retention: { years: 7 },
        },
      };

      const updatedTemplate: FormTemplate = {
        id: 'template_123',
        orgId: 'org_456',
        name: 'EPA Form',
        category: FormCategory.EPA_CGP,
        version: 1,
        isActive: true,
        schema: { fields: [] },
        compliance: input.compliance,
        createdBy: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFormsService.updateFormTemplate.mockResolvedValue(updatedTemplate);

      const result = await resolver.updateFormTemplate('template_123', input, mockUser);

      expect(result.compliance).toEqual(input.compliance);
    });
  });

  describe('Mutation: deleteFormTemplate', () => {
    it('should soft delete template by setting isActive to false', async () => {
      mockFormsService.deleteFormTemplate.mockResolvedValue({
        id: 'template_123',
        isActive: false,
      });

      const result = await resolver.deleteFormTemplate('template_123', mockUser);

      expect(result).toBe(true);
      expect(mockFormsService.deleteFormTemplate).toHaveBeenCalledWith('template_123', 'org_456');
    });
  });

  describe('Mutation: duplicateFormTemplate', () => {
    it('should create copy of template with "(Copy)" suffix', async () => {
      const duplicatedTemplate: FormTemplate = {
        id: 'template_456',
        orgId: 'org_456',
        name: 'Safety Form (Copy)',
        category: FormCategory.OSHA_SAFETY,
        version: 1,
        isActive: true,
        schema: { fields: [] },
        createdBy: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFormsService.duplicateFormTemplate.mockResolvedValue(duplicatedTemplate);

      const result = await resolver.duplicateFormTemplate('template_123', mockUser);

      expect(result.name).toContain('(Copy)');
      expect(mockFormsService.duplicateFormTemplate).toHaveBeenCalledWith(
        'template_123',
        'org_456',
        'user_123'
      );
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should always filter queries by orgId from JWT', async () => {
      await resolver.formTemplates(mockUser);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_456', undefined);

      await resolver.formTemplate('template_123', mockUser);
      expect(mockFormsService.getFormTemplate).toHaveBeenCalledWith('template_123', 'org_456');

      const updateInput: UpdateFormTemplateInput = { name: 'Test' };
      await resolver.updateFormTemplate('template_123', updateInput, mockUser);
      expect(mockFormsService.updateFormTemplate).toHaveBeenCalledWith(
        'template_123',
        'org_456',
        updateInput
      );

      await resolver.deleteFormTemplate('template_123', mockUser);
      expect(mockFormsService.deleteFormTemplate).toHaveBeenCalledWith('template_123', 'org_456');
    });

    it('should reject cross-org template access', async () => {
      const orgBUser = { id: 'user_b', orgId: 'org_b' };

      mockFormsService.getFormTemplate.mockRejectedValue(new Error('Form template not found'));

      await expect(resolver.formTemplate('template_from_org_a', orgBUser)).rejects.toThrow();
      expect(mockFormsService.getFormTemplate).toHaveBeenCalledWith('template_from_org_a', 'org_b');
    });

    it('should reject cross-org template updates', async () => {
      const orgBUser = { id: 'user_b', orgId: 'org_b' };
      const updateInput: UpdateFormTemplateInput = { name: 'Malicious Update' };

      mockFormsService.updateFormTemplate.mockRejectedValue(new Error('Form template not found'));

      await expect(
        resolver.updateFormTemplate('template_from_org_a', updateInput, orgBUser)
      ).rejects.toThrow();
      expect(mockFormsService.updateFormTemplate).toHaveBeenCalledWith(
        'template_from_org_a',
        'org_b',
        updateInput
      );
    });

    it('should reject cross-org template deletion', async () => {
      const orgBUser = { id: 'user_b', orgId: 'org_b' };

      mockFormsService.deleteFormTemplate.mockRejectedValue(new Error('Form template not found'));

      await expect(resolver.deleteFormTemplate('template_from_org_a', orgBUser)).rejects.toThrow();
      expect(mockFormsService.deleteFormTemplate).toHaveBeenCalledWith(
        'template_from_org_a',
        'org_b'
      );
    });

    it('should only return templates belonging to current org', async () => {
      const orgATemplates: FormTemplate[] = [
        {
          id: 'template_a1',
          orgId: 'org_a',
          name: 'Org A Template',
          category: FormCategory.CUSTOM,
          version: 1,
          isActive: true,
          schema: { fields: [] },
          createdBy: 'user_a',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFormsService.getFormTemplates.mockResolvedValue(orgATemplates);

      const userA = { id: 'user_a', orgId: 'org_a' };
      const result = await resolver.formTemplates(userA);

      expect(result).toEqual(orgATemplates);
      expect(mockFormsService.getFormTemplates).toHaveBeenCalledWith('org_a', undefined);
      expect(result.every((t) => t.orgId === 'org_a')).toBe(true);
    });
  });
});
