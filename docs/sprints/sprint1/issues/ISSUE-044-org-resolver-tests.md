# ISSUE-044: Write Tests for Organizations Resolver

**Sprint:** Sprint 1 | **Phase:** Phase 6 - Test Coverage | **Priority:** P1
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 17:10:00 EDT
**Dependencies:** ISSUE-043 ✅

---

## What You'll Do

Test organizations resolver with multi-tenancy considerations.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-043 complete (weather resolver tests)

### Steps

1. Create `apps/backend/src/modules/organizations/organizations.resolver.spec.ts`

2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsResolver', () => {
  let resolver: OrganizationsResolver;
  let service: OrganizationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrganizationsResolver,
        {
          provide: OrganizationsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<OrganizationsResolver>(OrganizationsResolver);
    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should return organizations for authenticated user', async () => {
    const mockOrgs = [
      { id: '1', name: 'Acme Construction', slug: 'acme' },
      { id: '2', name: 'BuildRight LLC', slug: 'buildright' },
    ];

    jest.spyOn(service, 'findAll').mockResolvedValue(mockOrgs);

    const result = await resolver.organizations();

    expect(result).toEqual(mockOrgs);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return single organization by ID', async () => {
    const mockOrg = { id: '1', name: 'Acme Construction', slug: 'acme' };

    jest.spyOn(service, 'findOne').mockResolvedValue(mockOrg);

    const result = await resolver.organization('1');

    expect(result).toEqual(mockOrg);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });
});
```

3. Run tests: `pnpm --filter backend test organizations.resolver.spec.ts`

4. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/organizations/organizations.resolver.spec.ts`

---

## Verification Checklist

- [ ] Test file created
- [ ] Resolver tests written
- [ ] Service mocked correctly
- [ ] List organizations tested
- [ ] Single organization tested
- [ ] All tests pass
- [ ] Coverage greater than 80% for organizations.resolver.ts

---

## Testing Steps

1. Run tests: `pnpm --filter backend test organizations.resolver.spec.ts`
2. Check coverage: `pnpm --filter backend test:coverage -- organizations.resolver`

---

## Evidence Requirements

**Location:** `evidence/ISSUE-044/test-results/`

**Required Screenshots:**
1. `org-resolver-tests.png` - Terminal showing all tests passing

---

## Troubleshooting

**Problem:** Service not found
- Check OrganizationsService is imported correctly
- Verify service file exists
- Check module configuration

**Problem:** Multi-tenancy not tested
- Note: Multi-tenancy logic is in service layer, not resolver
- Resolver tests focus on GraphQL query/mutation handling
- Service tests should cover orgId filtering

---

## Success Criteria

- Resolver tests written
- Service properly mocked
- List and single queries tested
- All tests pass
- Coverage greater than 80%
- Evidence collected

---

## Next Issue

**ISSUE-045:** Write Tests for Projects Resolver (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 20 minutes
