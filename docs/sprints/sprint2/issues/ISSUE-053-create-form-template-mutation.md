# ISSUE-053: Implement createFormTemplate Mutation

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-052 (types defined)

## What You'll Do

Build createFormTemplate GraphQL resolver with Clerk orgId filtering, JSONB validation using Zod, and Prisma database insert. Test mutation in GraphQL Playground with multi-tenant isolation verification.

## Prerequisites

- [ ] ISSUE-052 completed (GraphQL types exist)
- [ ] Prisma client generated with FormTemplate model
- [ ] Clerk authentication guard functional

## Step-by-Step Instructions

### Step 1: Create Zod Schema for Field Validation (30 min)

Create `apps/backend/src/modules/forms/validation/field-definition.schema.ts`:

```typescript
import { z } from 'zod';

export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'dropdown',
  'photo',
  'signature',
  'gps',
  'weather_data',
]);

export const validationRuleSchema = z.object({
  type: z.enum(['min', 'max', 'pattern', 'custom']),
  value: z.union([z.number(), z.string()]),
  message: z.string(),
});

export const conditionalLogicSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'notEquals', 'greaterThan', 'lessThan']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  action: z.enum(['show', 'hide', 'require']),
});

export const fieldDefinitionSchema = z.object({
  id: z.string().min(1),
  type: fieldTypeSchema,
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean(),
  validation: validationRuleSchema.optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const formTemplateFieldsSchema = z.array(fieldDefinitionSchema).min(1);
```

### Step 2: Create Form Templates Service (45 min)

Create `apps/backend/src/modules/forms/services/form-templates.service.ts`:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFormTemplateInput } from '../dto/create-form-template.input';
import { formTemplateFieldsSchema } from '../validation/field-definition.schema';
import { FormTemplate } from '@prisma/client';

@Injectable()
export class FormTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(
    input: CreateFormTemplateInput,
    orgId: string,
    userId: string
  ): Promise<FormTemplate> {
    // Validate fields JSONB structure with Zod
    const validationResult = formTemplateFieldsSchema.safeParse(input.fields);
    if (!validationResult.success) {
      throw new BadRequestException(`Invalid field definitions: ${validationResult.error.message}`);
    }

    // Create form template with multi-tenant orgId
    const template = await this.prisma.formTemplate.create({
      data: {
        orgId,
        name: input.name,
        description: input.description,
        category: input.category,
        fields: input.fields as any, // Prisma Json type
        version: 1,
        createdBy: userId,
      },
    });

    // Create initial version snapshot
    await this.prisma.formTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        fields: input.fields as any,
        changeLog: 'Initial version',
        createdBy: userId,
      },
    });

    return template;
  }

  async findOne(id: string, orgId: string): Promise<FormTemplate | null> {
    return this.prisma.formTemplate.findFirst({
      where: {
        id,
        orgId, // Multi-tenant filter
      },
    });
  }

  async findAll(orgId: string): Promise<FormTemplate[]> {
    return this.prisma.formTemplate.findMany({
      where: {
        orgId, // Multi-tenant filter
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
```

### Step 3: Implement Resolver Mutation (30 min)

Update `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts`:

```typescript
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/guards/clerk-auth.guard';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { FormTemplatesService } from '../services/form-templates.service';
import { FormTemplate } from '../types/form-template.type';
import { CreateFormTemplateInput } from '../dto/create-form-template.input';

interface ClerkUser {
  userId: string;
  orgId: string;
}

@Resolver(() => FormTemplate)
@UseGuards(ClerkAuthGuard)
export class FormTemplatesResolver {
  constructor(private formTemplatesService: FormTemplatesService) {}

  @Mutation(() => FormTemplate)
  async createFormTemplate(
    @Args('input') input: CreateFormTemplateInput,
    @CurrentUser() user: ClerkUser
  ): Promise<FormTemplate> {
    return this.formTemplatesService.create(input, user.orgId, user.userId);
  }

  @Query(() => FormTemplate, { nullable: true })
  async formTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: ClerkUser
  ): Promise<FormTemplate | null> {
    return this.formTemplatesService.findOne(id, user.orgId);
  }

  @Query(() => [FormTemplate])
  async formTemplates(@CurrentUser() user: ClerkUser): Promise<FormTemplate[]> {
    return this.formTemplatesService.findAll(user.orgId);
  }
}
```

### Step 4: Register Service in Module (15 min)

Update `apps/backend/src/modules/forms/forms.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { FormTemplatesResolver } from './resolvers/form-templates.resolver';
import { FormTemplatesService } from './services/form-templates.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FormTemplatesResolver, FormTemplatesService],
  exports: [FormTemplatesService],
})
export class FormsModule {}
```

### Step 5: Test in GraphQL Playground (15 min)

```bash
# Restart backend
kubectl rollout restart deployment/backend -n braveforms
kubectl wait --for=condition=ready pod -l app=backend -n braveforms --timeout=60s
```

Access http://localhost:30101/graphql

**Test mutation:**

```graphql
mutation CreateDailySafetyForm {
  createFormTemplate(
    input: {
      name: "Daily Safety Inspection"
      description: "Daily safety checklist for construction sites"
      category: "safety"
      fields: [
        { id: "inspector_name", type: "text", label: "Inspector Name", required: true }
        { id: "inspection_date", type: "date", label: "Inspection Date", required: true }
        { id: "site_photo", type: "photo", label: "Site Photo", required: false }
      ]
    }
  ) {
    id
    name
    category
    version
    fields {
      id
      type
      label
      required
    }
  }
}
```

**Expected response:**

```json
{
  "data": {
    "createFormTemplate": {
      "id": "clXXXXXXXX",
      "name": "Daily Safety Inspection",
      "category": "safety",
      "version": 1,
      "fields": [
        { "id": "inspector_name", "type": "text", "label": "Inspector Name", "required": true },
        { "id": "inspection_date", "type": "date", "label": "Inspection Date", "required": true },
        { "id": "site_photo", "type": "photo", "label": "Site Photo", "required": false }
      ]
    }
  }
}
```

**Screenshot:** Save response

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/backend/src/modules/forms/__tests__/form-templates.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FormTemplatesService } from '../services/form-templates.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('FormTemplatesService', () => {
  let service: FormTemplatesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormTemplatesService,
        {
          provide: PrismaService,
          useValue: {
            formTemplate: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            formTemplateVersion: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FormTemplatesService>(FormTemplatesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create form template with valid fields', async () => {
      const input = {
        name: 'Test Form',
        category: 'safety',
        fields: [{ id: 'field1', type: 'text', label: 'Test Field', required: true }],
      };

      const mockTemplate = { id: 'test-id', ...input, orgId: 'org_123', version: 1 };
      jest.spyOn(prisma.formTemplate, 'create').mockResolvedValue(mockTemplate as any);
      jest.spyOn(prisma.formTemplateVersion, 'create').mockResolvedValue({} as any);

      const result = await service.create(input, 'org_123', 'user_123');

      expect(result).toEqual(mockTemplate);
      expect(prisma.formTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId: 'org_123',
          name: input.name,
          category: input.category,
          fields: input.fields,
          createdBy: 'user_123',
        }),
      });
    });

    it('should throw BadRequestException for invalid field type', async () => {
      const input = {
        name: 'Test Form',
        category: 'safety',
        fields: [{ id: 'field1', type: 'invalid_type', label: 'Test', required: true }],
      };

      await expect(service.create(input, 'org_123', 'user_123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should create initial version snapshot', async () => {
      const input = {
        name: 'Test Form',
        category: 'safety',
        fields: [{ id: 'field1', type: 'text', label: 'Test', required: true }],
      };

      const mockTemplate = { id: 'test-id', ...input, version: 1 };
      jest.spyOn(prisma.formTemplate, 'create').mockResolvedValue(mockTemplate as any);
      jest.spyOn(prisma.formTemplateVersion, 'create').mockResolvedValue({} as any);

      await service.create(input, 'org_123', 'user_123');

      expect(prisma.formTemplateVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          templateId: 'test-id',
          version: 1,
          changeLog: 'Initial version',
        }),
      });
    });
  });

  describe('findOne', () => {
    it('should filter by orgId (multi-tenant)', async () => {
      jest.spyOn(prisma.formTemplate, 'findFirst').mockResolvedValue(null);

      await service.findOne('template-123', 'org_123');

      expect(prisma.formTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'template-123', orgId: 'org_123' },
      });
    });
  });
});
```

**Run tests:**

```bash
cd apps/backend
pnpm test forms/form-templates.service.spec
```

**Expected:** Tests FAIL initially (service not implemented yet)

**Screenshot:** Red phase

### Phase 2: Implement Service (Green Phase)

Service implemented in steps above.

**Run tests:**

```bash
pnpm test forms/form-templates.service.spec
```

**Expected:** All tests PASS

**Screenshot:** Green phase to `evidence/ISSUE-053/test-results/service-tests-green.png`

## Files to Modify/Create

**Create:**

- `apps/backend/src/modules/forms/validation/field-definition.schema.ts` (Zod validation)
- `apps/backend/src/modules/forms/services/form-templates.service.ts` (business logic)
- `apps/backend/src/modules/forms/__tests__/form-templates.service.spec.ts` (unit tests)

**Modify:**

- `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts` (implement mutation)
- `apps/backend/src/modules/forms/forms.module.ts` (register service)

## Verification Checklist

- [ ] Zod schema created for field validation (8 field types)
- [ ] FormTemplatesService created with create method
- [ ] Multi-tenant orgId filtering implemented
- [ ] Initial version snapshot created on template creation
- [ ] createFormTemplate resolver implemented
- [ ] Service registered in FormsModule
- [ ] Unit tests written and passing (5+ tests)
- [ ] GraphQL mutation tested in Playground
- [ ] Template created successfully via API
- [ ] Template visible in Prisma Studio
- [ ] Zero emoji in code
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-053/

**Required:**

- test-results/
  - service-tests-green.png (unit tests passing)
  - zod-validation-test.png (invalid field type rejection)
- deployment/
  - graphql-mutation-success.png (Playground response)
  - prisma-studio-template.png (template in database)
- code/
  - zod-schema.png (field-definition.schema.ts)
  - service-implementation.png (form-templates.service.ts)
  - resolver-implementation.png (createFormTemplate method)

## Troubleshooting

**Problem:** Zod validation fails for valid field type

- **Cause:** Field type not in enum
- **Solution:** Verify fieldTypeSchema includes all 8 types

**Problem:** orgId null in database

- **Cause:** CurrentUser decorator not extracting orgId
- **Solution:** Verify Clerk JWT contains o.id claim

**Problem:** Version snapshot not created

- **Cause:** Transaction not completing
- **Solution:** Add await before version create

## Success Criteria

- [ ] createFormTemplate mutation functional
- [ ] Zod validation rejects invalid field types
- [ ] Multi-tenant orgId filtering enforced
- [ ] Initial version snapshot created automatically
- [ ] Template stored in database with JSONB fields
- [ ] Unit tests passing (5+ tests, >80% coverage)
- [ ] GraphQL Playground test successful

## Time Estimate

**2 hours total:**

- Zod schema: 30 min
- Service implementation: 45 min
- Resolver implementation: 30 min
- Module registration: 15 min
- Testing: 15 min
- GraphQL Playground: 15 min

## Next Issue

**ISSUE-054:** Implement Form Template CRUD Operations (2h)

- Prerequisites: This issue complete (create working)
- Implements: Update, delete, list with pagination
