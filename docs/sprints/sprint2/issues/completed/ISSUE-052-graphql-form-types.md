# ISSUE-052: Create FormTemplate GraphQL Types

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-052/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-051 (schema exists)

## What You'll Do

Define FormTemplate, FieldDefinition, and ValidationRule GraphQL types using NestJS code-first approach with decorators. Create GraphQL input types for mutations and add resolvers file structure.

## Prerequisites

- [ ] ISSUE-051 completed (Prisma schema deployed)
- [ ] Backend running: kubectl logs -f deployment/backend -n braveforms
- [ ] GraphQL Playground accessible: http://localhost:30101/graphql

## Step-by-Step Instructions

### Step 1: Create GraphQL Object Types (45 min)

Create `apps/backend/src/modules/forms/types/form-template.type.ts`:

```typescript
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class FieldDefinition {
  @Field(() => ID)
  id: string;

  @Field()
  type: string; // 'text' | 'number' | 'date' | 'dropdown' | 'photo' | 'signature' | 'gps' | 'weather_data'

  @Field()
  label: string;

  @Field({ nullable: true })
  placeholder?: string;

  @Field()
  required: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  validation?: object; // ValidationRule serialized

  @Field(() => GraphQLJSON, { nullable: true })
  conditionalLogic?: object; // ConditionalLogic serialized

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: object;
}

@ObjectType()
export class FormTemplate {
  @Field(() => ID)
  id: string;

  @Field()
  orgId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category: string;

  @Field(() => [FieldDefinition])
  fields: FieldDefinition[];

  @Field()
  isActive: boolean;

  @Field(() => Int)
  version: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  createdBy: string;
}

@ObjectType()
export class FormTemplateVersion {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  templateId: string;

  @Field(() => Int)
  version: number;

  @Field(() => [FieldDefinition])
  fields: FieldDefinition[];

  @Field({ nullable: true })
  changeLog?: string;

  @Field()
  createdAt: Date;

  @Field()
  createdBy: string;
}
```

### Step 2: Create GraphQL Input Types for Mutations (45 min)

Create `apps/backend/src/modules/forms/dto/create-form-template.input.ts`:

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class FieldDefinitionInput {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsString()
  type: string;

  @Field()
  @IsString()
  label: string;

  @Field({ nullable: true })
  @IsString()
  placeholder?: string;

  @Field()
  @IsBoolean()
  required: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  validation?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  conditionalLogic?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: object;
}

@InputType()
export class CreateFormTemplateInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  description?: string;

  @Field()
  @IsString()
  category: string;

  @Field(() => [FieldDefinitionInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinitionInput)
  fields: FieldDefinitionInput[];
}

@InputType()
export class UpdateFormTemplateInput {
  @Field({ nullable: true })
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  category?: string;

  @Field(() => [FieldDefinitionInput], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinitionInput)
  fields?: FieldDefinitionInput[];

  @Field({ nullable: true })
  @IsBoolean()
  isActive?: boolean;
}
```

### Step 3: Create Resolver Structure (30 min)

Create `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts`:

```typescript
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/guards/clerk-auth.guard';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { FormTemplate } from '../types/form-template.type';
import {
  CreateFormTemplateInput,
  UpdateFormTemplateInput,
} from '../dto/create-form-template.input';

@Resolver(() => FormTemplate)
@UseGuards(ClerkAuthGuard)
export class FormTemplatesResolver {
  // Queries (to be implemented in ISSUE-053, ISSUE-054)
  @Query(() => FormTemplate, { nullable: true })
  async formTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<FormTemplate | null> {
    // TODO: Implement in ISSUE-053
    throw new Error('Not implemented');
  }

  @Query(() => [FormTemplate])
  async formTemplates(@CurrentUser() user: any): Promise<FormTemplate[]> {
    // TODO: Implement in ISSUE-054
    throw new Error('Not implemented');
  }

  // Mutations (to be implemented in ISSUE-053, ISSUE-054)
  @Mutation(() => FormTemplate)
  async createFormTemplate(
    @Args('input') input: CreateFormTemplateInput,
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
    // TODO: Implement in ISSUE-053
    throw new Error('Not implemented');
  }

  @Mutation(() => FormTemplate)
  async updateFormTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFormTemplateInput,
    @CurrentUser() user: any
  ): Promise<FormTemplate> {
    // TODO: Implement in ISSUE-054
    throw new Error('Not implemented');
  }

  @Mutation(() => Boolean)
  async deleteFormTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    // TODO: Implement in ISSUE-054
    throw new Error('Not implemented');
  }
}
```

### Step 4: Register Forms Module (15 min)

Create `apps/backend/src/modules/forms/forms.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { FormTemplatesResolver } from './resolvers/form-templates.resolver';

@Module({
  providers: [FormTemplatesResolver],
  exports: [],
})
export class FormsModule {}
```

Update `apps/backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FormsModule } from './modules/forms/forms.module'; // ADD THIS

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    FormsModule, // ADD THIS
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 5: Verify GraphQL Schema Generation (15 min)

```bash
# Restart backend to regenerate schema
kubectl rollout restart deployment/backend -n braveforms

# Wait for pod to be ready
kubectl wait --for=condition=ready pod -l app=backend -n braveforms --timeout=60s

# Check logs
kubectl logs -f deployment/backend -n braveforms
```

Expected log output:

```
[Nest] INFO [GraphQLModule] Mapped {/graphql, POST} route
[Nest] INFO [NestApplication] Nest application successfully started
```

Access GraphQL Playground: http://localhost:30101/graphql

### Step 6: Introspect Schema in Playground (15 min)

In GraphQL Playground, run introspection query:

```graphql
query IntrospectFormTypes {
  __type(name: "FormTemplate") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

Expected response:

```json
{
  "data": {
    "__type": {
      "name": "FormTemplate",
      "fields": [
        {"name": "id", "type": {"name": "ID", "kind": "SCALAR"}},
        {"name": "orgId", "type": {"name": "String", "kind": "SCALAR"}},
        {"name": "name", "type": {"name": "String", "kind": "SCALAR"}},
        {"name": "fields", "type": {"name": null, "kind": "LIST"}},
        ...
      ]
    }
  }
}
```

**Screenshot:** Save introspection result

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/backend/src/modules/forms/__tests__/form-templates.resolver.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FormTemplatesResolver } from '../resolvers/form-templates.resolver';

describe('FormTemplatesResolver', () => {
  let resolver: FormTemplatesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormTemplatesResolver],
    }).compile();

    resolver = module.get<FormTemplatesResolver>(FormTemplatesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('Type Definitions', () => {
    it('should define formTemplate query', () => {
      expect(typeof resolver.formTemplate).toBe('function');
    });

    it('should define formTemplates query', () => {
      expect(typeof resolver.formTemplates).toBe('function');
    });

    it('should define createFormTemplate mutation', () => {
      expect(typeof resolver.createFormTemplate).toBe('function');
    });

    it('should define updateFormTemplate mutation', () => {
      expect(typeof resolver.updateFormTemplate).toBe('function');
    });

    it('should define deleteFormTemplate mutation', () => {
      expect(typeof resolver.deleteFormTemplate).toBe('function');
    });
  });
});
```

**Run tests:**

```bash
cd apps/backend
pnpm test forms/form-templates.resolver.spec
```

**Expected:** Tests PASS (resolver defined, methods exist)

**Screenshot:** Save to `evidence/ISSUE-052/test-results/resolver-tests-green.png`

### Phase 2: Implementation Complete (Already Done)

GraphQL types and resolver structure created in steps above.

### Phase 3: Schema Validation

Run schema introspection in GraphQL Playground (Step 6).

**Expected:** FormTemplate, FieldDefinition types visible

**Screenshot:** Save to `evidence/ISSUE-052/deployment/schema-introspection.png`

## Files to Modify/Create

**Create:**

- `apps/backend/src/modules/forms/types/form-template.type.ts` (GraphQL object types)
- `apps/backend/src/modules/forms/dto/create-form-template.input.ts` (input types)
- `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts` (resolver structure)
- `apps/backend/src/modules/forms/forms.module.ts` (module registration)
- `apps/backend/src/modules/forms/__tests__/form-templates.resolver.spec.ts` (tests)

**Modify:**

- `apps/backend/src/app.module.ts` (import FormsModule)

## Verification Checklist

- [ ] FormTemplate GraphQL type created with @ObjectType
- [ ] FieldDefinition GraphQL type created
- [ ] CreateFormTemplateInput created with validation decorators
- [ ] UpdateFormTemplateInput created
- [ ] FormTemplatesResolver created with @Resolver decorator
- [ ] Query stubs defined (formTemplate, formTemplates)
- [ ] Mutation stubs defined (create, update, delete)
- [ ] FormsModule registered in AppModule
- [ ] GraphQL schema regenerates on backend restart
- [ ] Schema introspection shows FormTemplate type
- [ ] Resolver tests pass (structure verification)
- [ ] Zero emoji in code
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-052/

**Required:**

- test-results/
  - resolver-tests-green.png (pnpm test output)
- deployment/
  - schema-introspection.png (GraphQL Playground introspection)
  - backend-logs.png (schema regeneration logs)
- code/
  - form-template-type.png (GraphQL object types)
  - input-types.png (CreateFormTemplateInput)
  - resolver-structure.png (FormTemplatesResolver)

## Troubleshooting

**Problem:** GraphQL schema doesn't regenerate

- **Cause:** Backend not restarted
- **Solution:** kubectl rollout restart deployment/backend -n braveforms

**Problem:** Introspection shows null for FormTemplate

- **Cause:** Module not registered in AppModule
- **Solution:** Verify FormsModule in imports array

**Problem:** Validation decorators not working

- **Cause:** class-validator not installed
- **Solution:** pnpm add class-validator class-transformer

## Success Criteria

- [ ] FormTemplate GraphQL type defined with all fields
- [ ] FieldDefinition nested type defined
- [ ] Input types created with class-validator decorators
- [ ] Resolver structure created with method stubs
- [ ] FormsModule registered in AppModule
- [ ] Schema introspection shows FormTemplate type
- [ ] Resolver tests pass (5 tests)

## Time Estimate

**2 hours total:**

- GraphQL object types: 45 min
- Input types: 45 min
- Resolver structure: 30 min
- Module registration: 15 min
- Schema verification: 15 min
- Testing: 15 min

## Next Issue

**ISSUE-053:** Implement createFormTemplate Mutation (2h)

- Prerequisites: This issue complete (types defined)
- Implements: Actual resolver logic with Clerk orgId filtering

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-052/COMPLETION-REPORT.md)

**Time:** 2 hours (estimated 2h)

**Summary:**

- FormsModule configured with providers (FormsResolver, FormsService)
- GraphQL types extracted to forms.types.ts (resolved circular dependency)
- 14/14 tests passing
- ENUMs: FormCategory, FormStatus
- Object Types: FormTemplate, FormSubmission, ComplianceValidation
- Input Types: CreateFormTemplateInput, UpdateFormTemplateInput
- Jest moduleNameMapper added for path alias resolution
