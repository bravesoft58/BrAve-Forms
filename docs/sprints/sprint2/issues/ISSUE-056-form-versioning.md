# ISSUE-056: Form Versioning System

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-051 (versions table exists)

## What You'll Do

Implement version increment logic when templates are updated, create version history queries to retrieve past versions, and add version comparison utility to show differences between versions.

## Step-by-Step Instructions

### Step 1: Create Version History Service (45 min)

Create `apps/backend/src/modules/forms/services/form-versions.service.ts`:

```typescript
@Injectable()
export class FormVersionsService {
  constructor(private prisma: PrismaService) {}

  async getVersionHistory(templateId: string, orgId: string): Promise<FormTemplateVersion[]> {
    // Verify template belongs to org
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: templateId, orgId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.formTemplateVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' },
    });
  }

  async getVersionByNumber(
    templateId: string,
    version: number,
    orgId: string
  ): Promise<FormTemplateVersion | null> {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: templateId, orgId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.formTemplateVersion.findFirst({
      where: { templateId, version },
    });
  }

  compareVersions(v1: FormTemplateVersion, v2: FormTemplateVersion): VersionComparison {
    const fields1 = v1.fields as any[];
    const fields2 = v2.fields as any[];

    const added = fields2.filter((f2) => !fields1.some((f1) => f1.id === f2.id));
    const removed = fields1.filter((f1) => !fields2.some((f2) => f2.id === f1.id));
    const modified = fields2.filter((f2) => {
      const f1 = fields1.find((f) => f.id === f2.id);
      return f1 && JSON.stringify(f1) !== JSON.stringify(f2);
    });

    return { added, removed, modified };
  }
}
```

### Step 2: Add Version Queries to Resolver (30 min)

Update `apps/backend/src/modules/forms/resolvers/form-templates.resolver.ts`:

```typescript
@Query(() => [FormTemplateVersion])
async formTemplateVersions(
  @Args('templateId', { type: () => ID }) templateId: string,
  @CurrentUser() user: ClerkUser,
): Promise<FormTemplateVersion[]> {
  return this.formVersionsService.getVersionHistory(templateId, user.orgId);
}

@Query(() => FormTemplateVersion, { nullable: true })
async formTemplateVersion(
  @Args('templateId', { type: () => ID }) templateId: string,
  @Args('version', { type: () => Int }) version: number,
  @CurrentUser() user: ClerkUser,
): Promise<FormTemplateVersion | null> {
  return this.formVersionsService.getVersionByNumber(templateId, version, user.orgId);
}
```

### Step 3: Test Version History in GraphQL Playground (30 min)

```graphql
query GetVersionHistory {
  formTemplateVersions(templateId: "clXXXXXXXX") {
    version
    changeLog
    createdAt
    fields {
      id
      label
    }
  }
}
```

### Step 4: Create Unit Tests (15 min)

Test version increment, history retrieval, and comparison logic.

## Files to Create

- `form-versions.service.ts`
- `form-versions.spec.ts`

## Verification Checklist

- [ ] Version history query functional
- [ ] Version comparison utility working
- [ ] Tests passing (5+ tests)

## Time Estimate: 2 hours

## Next Issue

**ISSUE-057:** Form Builder Unit Tests (TDD) (2h)
