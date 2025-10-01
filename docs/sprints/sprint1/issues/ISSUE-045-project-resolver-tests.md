# ISSUE-045: Write Tests for Projects Resolver

**Sprint:** Sprint 1 | **Phase:** Phase 6 - Test Coverage | **Priority:** P1
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 17:15:00 EDT
**Dependencies:** ISSUE-044 ✅

---

## What You'll Do

Test projects resolver with orgId filtering to ensure multi-tenancy isolation.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-044 complete (organizations resolver tests)

### Steps

1. Create `apps/backend/src/modules/projects/projects.resolver.spec.ts`

2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';

describe('ProjectsResolver', () => {
  let resolver: ProjectsResolver;
  let service: ProjectsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsResolver,
        {
          provide: ProjectsService,
          useValue: {
            findByOrgId: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<ProjectsResolver>(ProjectsResolver);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should filter projects by orgId', async () => {
    const mockProjects = [
      { id: '1', name: 'Downtown Mall', location: 'Main St', orgId: 'org_123' },
      { id: '2', name: 'Harbor Bridge', location: 'Pier 5', orgId: 'org_123' },
    ];

    jest.spyOn(service, 'findByOrgId').mockResolvedValue(mockProjects);

    const result = await resolver.projects('org_123');

    expect(result).toEqual(mockProjects);
    expect(service.findByOrgId).toHaveBeenCalledWith('org_123');
  });

  it('should return single project by ID', async () => {
    const mockProject = {
      id: '1',
      name: 'Downtown Mall',
      location: 'Main St',
      orgId: 'org_123',
    };

    jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);

    const result = await resolver.project('1');

    expect(result).toEqual(mockProject);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('should only return projects for specified orgId', async () => {
    const mockProjects = [
      { id: '1', name: 'Downtown Mall', location: 'Main St', orgId: 'org_123' },
    ];

    jest.spyOn(service, 'findByOrgId').mockResolvedValue(mockProjects);

    const result = await resolver.projects('org_123');

    // Verify all returned projects belong to the orgId
    result.forEach(project => {
      expect(project.orgId).toBe('org_123');
    });
  });
});
```

3. Run tests: `pnpm --filter backend test projects.resolver.spec.ts`

4. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/projects/projects.resolver.spec.ts`

---

## Verification Checklist

- [ ] Test file created
- [ ] Resolver tests written
- [ ] Service mocked correctly
- [ ] orgId filtering tested explicitly
- [ ] List and single queries tested
- [ ] Multi-tenancy isolation verified
- [ ] All tests pass
- [ ] Coverage greater than 80% for projects.resolver.ts

---

## Testing Steps

1. Run tests: `pnpm --filter backend test projects.resolver.spec.ts`
2. Check coverage: `pnpm --filter backend test:coverage -- projects.resolver`

---

## Evidence Requirements

**Location:** `evidence/ISSUE-045/test-results/`

**Required Screenshots:**
1. `project-resolver-tests.png` - Terminal showing all tests passing

---

## Troubleshooting

**Problem:** Service not found
- Check ProjectsService is imported correctly
- Verify service file exists
- Check module configuration

**Problem:** orgId filtering test fails
- Verify mock data includes orgId field
- Check service.findByOrgId is called with correct parameter
- Verify test assertion checks all projects have same orgId

---

## Success Criteria

- Resolver tests written
- Service properly mocked
- orgId filtering explicitly tested
- Multi-tenancy isolation verified
- All tests pass
- Coverage greater than 80%
- Evidence collected

---

## Next Issue

**ISSUE-046:** Run Full Coverage Report (15 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 20 minutes
