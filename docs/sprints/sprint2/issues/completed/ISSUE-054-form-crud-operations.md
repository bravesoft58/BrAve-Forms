# ISSUE-054: Implement Form Template CRUD Operations

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-054/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-053 (create working)

## What You'll Do

Add getFormTemplate, updateFormTemplate, deleteFormTemplate resolvers and implement list templates query with filters and pagination support.

## Prerequisites

- [ ] ISSUE-053 completed (createFormTemplate working)
- [ ] FormTemplatesService exists
- [ ] GraphQL Playground accessible

## Step-by-Step Instructions

### Step 1: Add CRUD Methods to Service (60 min)

Update `apps/backend/src/modules/forms/services/form-templates.service.ts`:

```typescript
async update(
  id: string,
  input: UpdateFormTemplateInput,
  orgId: string,
  userId: string,
): Promise<FormTemplate> {
  // Verify template exists and belongs to org
  const existing = await this.findOne(id, orgId);
  if (!existing) {
    throw new NotFoundException(`Form template ${id} not found`);
  }

  // If fields updated, validate with Zod
  if (input.fields) {
    const validationResult = formTemplateFieldsSchema.safeParse(input.fields);
    if (!validationResult.success) {
      throw new BadRequestException(`Invalid field definitions: ${validationResult.error.message}`);
    }
  }

  // Increment version if fields changed
  const newVersion = input.fields ? existing.version + 1 : existing.version;

  // Update template
  const updated = await this.prisma.formTemplate.update({
    where: { id },
    data: {
      ...input,
      version: newVersion,
      updatedAt: new Date(),
    },
  });

  // Create version snapshot if fields changed
  if (input.fields && newVersion > existing.version) {
    await this.prisma.formTemplateVersion.create({
      data: {
        templateId: id,
        version: newVersion,
        fields: input.fields as any,
        changeLog: 'Template updated',
        createdBy: userId,
      },
    });
  }

  return updated;
}

async delete(id: string, orgId: string): Promise<boolean> {
  // Verify template exists and belongs to org
  const existing = await this.findOne(id, orgId);
  if (!existing) {
    throw new NotFoundException(`Form template ${id} not found`);
  }

  // Soft delete (set isActive to false)
  await this.prisma.formTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  return true;
}

async findAllWithFilters(
  orgId: string,
  category?: string,
  isActive?: boolean,
  skip?: number,
  take?: number,
): Promise<{ templates: FormTemplate[]; total: number }> {
  const where = {
    orgId,
    ...(category && { category }),
    ...(isActive !== undefined && { isActive }),
  };

  const [templates, total] = await Promise.all([
    this.prisma.formTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: skip || 0,
      take: take || 50,
    }),
    this.prisma.formTemplate.count({ where }),
  ]);

  return { templates, total };
}
```

### Step 2: Add Query/Mutation Args DTOs (15 min)

Create `apps/backend/src/modules/forms/dto/list-form-templates.args.ts`:

```typescript
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';

@ArgsType()
export class ListFormTemplatesArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number;
}
```

### Step 3: Create Paginated Response Type (15 min)

Add to `apps/backend/src/modules/forms/types/form-template.type.ts`:

```typescript
@ObjectType()
export class FormTemplatesConnection {
  @Field(() => [FormTemplate])
  templates: FormTemplate[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;

  @Field()
  hasMore: boolean;
}
```

### Step 4: Implement Resolver Methods (30 min)

Update `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts`:

```typescript
@Query(() => FormTemplatesConnection)
async formTemplatesList(
  @Args() args: ListFormTemplatesArgs,
  @CurrentUser() user: ClerkUser,
): Promise<FormTemplatesConnection> {
  const { category, isActive, skip, take } = args;
  const { templates, total } = await this.formTemplatesService.findAllWithFilters(
    user.orgId,
    category,
    isActive,
    skip,
    take || 50,
  );

  return {
    templates,
    total,
    skip: skip || 0,
    take: take || 50,
    hasMore: (skip || 0) + templates.length < total,
  };
}

@Mutation(() => FormTemplate)
async updateFormTemplate(
  @Args('id', { type: () => ID }) id: string,
  @Args('input') input: UpdateFormTemplateInput,
  @CurrentUser() user: ClerkUser,
): Promise<FormTemplate> {
  return this.formTemplatesService.update(id, input, user.orgId, user.userId);
}

@Mutation(() => Boolean)
async deleteFormTemplate(
  @Args('id', { type: () => ID }) id: string,
  @CurrentUser() user: ClerkUser,
): Promise<boolean> {
  return this.formTemplatesService.delete(id, user.orgId);
}
```

### Step 5: Test CRUD in GraphQL Playground (30 min)

**Update template:**

```graphql
mutation UpdateTemplate {
  updateFormTemplate(
    id: "clXXXXXXXX"
    input: {
      name: "Updated Daily Safety Inspection"
      fields: [{ id: "inspector_name", type: "text", label: "Inspector Full Name", required: true }]
    }
  ) {
    id
    name
    version
    updatedAt
  }
}
```

**List with filters:**

```graphql
query ListSafetyForms {
  formTemplatesList(category: "safety", isActive: true, skip: 0, take: 10) {
    templates {
      id
      name
      category
      version
    }
    total
    hasMore
  }
}
```

**Delete template:**

```graphql
mutation DeleteTemplate {
  deleteFormTemplate(id: "clXXXXXXXX")
}
```

**Screenshot:** Save all three responses

## TDD Workflow

### Phase 1: Write Tests

Create tests in `apps/backend/src/modules/forms/__tests__/form-templates-crud.spec.ts`:

```typescript
describe('CRUD Operations', () => {
  describe('update', () => {
    it('should increment version when fields change', async () => {
      // Test implementation
    });

    it('should throw NotFoundException for non-existent template', async () => {
      // Test implementation
    });

    it('should enforce multi-tenant isolation', async () => {
      // Test cross-org access attempt should fail
    });
  });

  describe('delete', () => {
    it('should soft delete (set isActive to false)', async () => {
      // Test implementation
    });
  });

  describe('findAllWithFilters', () => {
    it('should filter by category', async () => {
      // Test implementation
    });

    it('should paginate results', async () => {
      // Test implementation
    });
  });
});
```

## Files to Modify/Create

**Modify:**

- `apps/backend/src/modules/forms/services/form-templates.service.ts` (add CRUD methods)
- `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts` (implement queries/mutations)
- `apps/backend/src/modules/forms/types/form-template.type.ts` (add connection type)

**Create:**

- `apps/backend/src/modules/forms/dto/list-form-templates.args.ts` (pagination args)
- `apps/backend/src/modules/forms/__tests__/form-templates-crud.spec.ts` (CRUD tests)

## Verification Checklist

- [ ] update method implemented with version increment
- [ ] delete method implemented (soft delete)
- [ ] findAllWithFilters method implemented with pagination
- [ ] Resolver methods implemented (update, delete, list)
- [ ] Pagination support functional (skip, take, hasMore)
- [ ] Filter by category working
- [ ] CRUD tests passing (8+ tests)
- [ ] GraphQL Playground tests successful

## Time Estimate: 2 hours

## Next Issue

**ISSUE-055:** Field Type Validation (8+ Types) (4h)

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-054/COMPLETION-REPORT.md)

**Time:** 1.5 hours (estimated 2h)

**Summary:**

- Complete CRUD operations for Form Templates
- Filtering: category, isActive status
- Pagination: skip/take parameters
- Tests: 25/25 passing (12 resolver + 13 service)
- Multi-tenant isolation: orgId from JWT enforced
- GraphQL API ready with optional filters
