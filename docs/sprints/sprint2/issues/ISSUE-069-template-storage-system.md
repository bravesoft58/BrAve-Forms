# ISSUE-069: Template Storage System

**Sprint:** Sprint 2 | **Phase:** 4 - Template Library | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-054 (CRUD operations exist)

## What You'll Do

Create template seed script structure, add template cloning logic, implement template customization per project.

## Step-by-Step Instructions

### Step 1: Create Template Seed Structure (45 min)

Create `apps/backend/prisma/seeds/templates/` directory:

```
templates/
├── safety/
│   ├── daily-safety-inspection.json
│   ├── toolbox-talk.json
│   └── incident-report.json
├── quality/
│   ├── quality-inspection.json
│   └── concrete-pour.json
├── daily_log/
│   ├── general-daily-log.json
│   └── superintendent-report.json
└── compliance/
    └── swppp-inspection.json
```

### Step 2: Create Template Cloning Service (60 min)

Create `apps/backend/src/modules/forms/services/template-cloning.service.ts`:

```typescript
@Injectable()
export class TemplateCloningService {
  constructor(private prisma: PrismaService) {}

  async cloneTemplate(
    templateId: string,
    orgId: string,
    userId: string,
    customizations?: Partial<FormTemplate>
  ): Promise<FormTemplate> {
    // Get source template
    const source = await this.prisma.formTemplate.findFirst({
      where: { id: templateId },
    });

    if (!source) {
      throw new NotFoundException('Template not found');
    }

    // Create cloned template
    const cloned = await this.prisma.formTemplate.create({
      data: {
        orgId,
        name: customizations?.name || `${source.name} (Copy)`,
        description: customizations?.description || source.description,
        category: customizations?.category || source.category,
        fields: customizations?.fields || source.fields,
        version: 1,
        createdBy: userId,
      },
    });

    // Create initial version snapshot
    await this.prisma.formTemplateVersion.create({
      data: {
        templateId: cloned.id,
        version: 1,
        fields: cloned.fields,
        changeLog: `Cloned from template ${source.id}`,
        createdBy: userId,
      },
    });

    return cloned;
  }

  async customizeTemplateForProject(
    templateId: string,
    projectId: string,
    customizations: Record<string, any>,
    orgId: string,
    userId: string
  ): Promise<FormTemplate> {
    // Clone template with project-specific customizations
    const cloned = await this.cloneTemplate(templateId, orgId, userId, {
      name: customizations.name,
      description: customizations.description,
    });

    // Link to project (if projects table exists)
    // This will be implemented when project management is added

    return cloned;
  }
}
```

### Step 3: Add Cloning Mutation (30 min)

Add to `form-templates.resolver.ts`:

```typescript
@Mutation(() => FormTemplate)
async cloneFormTemplate(
  @Args('templateId', { type: () => ID }) templateId: string,
  @Args('name', { nullable: true }) name?: string,
  @CurrentUser() user: ClerkUser,
): Promise<FormTemplate> {
  return this.templateCloningService.cloneTemplate(
    templateId,
    user.orgId,
    user.userId,
    name ? { name } : undefined,
  );
}
```

### Step 4: Test Cloning (15 min)

```graphql
mutation CloneTemplate {
  cloneFormTemplate(templateId: "clXXXXXXXX", name: "My Custom Safety Inspection") {
    id
    name
    version
  }
}
```

## Files to Create

- `templates/` directory structure
- `template-cloning.service.ts`
- `template-cloning.spec.ts`

## Time Estimate: 2 hours

## Next Issue

**ISSUE-070:** Build 10 Construction Templates (4h)
