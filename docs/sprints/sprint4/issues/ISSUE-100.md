# ISSUE-100: Time-Limited QR Token Generation

**Sprint:** Sprint 4 | **Phase:** 1 - QR Inspector Portal | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Completed:** 2025-11-26
**Dependencies:** Sprint 3 complete
**Status:** COMPLETE

## Completion Summary

**Implementation:**
- Created QRTokenService in apps/backend/src/modules/qr-portal/qr-token.service.ts
- Added InspectorQRToken model to Prisma schema
- GraphQL resolver with Clerk authentication
- Token generation with 24-hour expiration
- Multi-tenant support via orgId

**Tests:** 15+ tests passing (service + resolver)

**Commit:** feat(qr-portal): implement QR code inspector portal (ISSUE-100-105)

## What You'll Do

Create backend service to generate JWT tokens with 24-hour expiration for inspector access via QR codes.

## Prerequisites

- [ ] Sprint 3 complete (form submission workflow ready)
- [ ] Backend accessible at http://localhost:30101/graphql
- [ ] Code editor open to apps/backend directory
- [ ] JWT library available (@nestjs/jwt)

## Step-by-Step Instructions

### Step 1: Create QRTokenService (60 min)

Create `apps/backend/src/modules/qr-portal/services/qr-token.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/modules/database/prisma.service';

export interface QRTokenPayload {
  projectId: string;
  orgId: string;
  permissions: string[];
  tokenType: 'inspector_access';
  expiresAt: Date;
}

export interface GenerateQRTokenInput {
  projectId: string;
  orgId: string;
  generatedBy: string;
}

@Injectable()
export class QRTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async generateQRToken({ projectId, orgId, generatedBy }: GenerateQRTokenInput): Promise<string> {
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create payload
    const payload: QRTokenPayload = {
      projectId,
      orgId,
      permissions: ['view_submissions', 'view_photos'],
      tokenType: 'inspector_access',
      expiresAt,
    };

    // Generate JWT token (24 hours)
    const token = this.jwtService.sign(payload, {
      expiresIn: '24h',
      secret: process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET,
    });

    // Store token metadata in database (for audit trail)
    await this.prisma.qRToken.create({
      data: {
        token,
        projectId,
        orgId,
        expiresAt,
        generatedBy,
        isRevoked: false,
      },
    });

    return token;
  }

  async validateQRToken(token: string): Promise<QRTokenPayload | null> {
    try {
      // Verify JWT signature and expiration
      const payload = this.jwtService.verify<QRTokenPayload>(token, {
        secret: process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET,
      });

      // Check if token is revoked in database
      const tokenRecord = await this.prisma.qRToken.findFirst({
        where: {
          token,
          isRevoked: false,
        },
      });

      if (!tokenRecord) {
        return null; // Token revoked or not found
      }

      // Check if token is expired (double-check)
      if (new Date() > payload.expiresAt) {
        return null;
      }

      return payload;
    } catch (error) {
      // Invalid token or expired
      return null;
    }
  }

  async revokeQRToken(token: string, revokedBy: string): Promise<void> {
    await this.prisma.qRToken.updateMany({
      where: { token },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy,
      },
    });
  }

  async regenerateQRToken(
    projectId: string,
    orgId: string,
    regeneratedBy: string
  ): Promise<string> {
    // Revoke all existing tokens for this project
    await this.prisma.qRToken.updateMany({
      where: {
        projectId,
        orgId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: regeneratedBy,
      },
    });

    // Generate new token
    return this.generateQRToken({
      projectId,
      orgId,
      generatedBy: regeneratedBy,
    });
  }
}
```

### Step 2: Create QRToken Prisma Schema (30 min)

Add to `packages/database/schema.prisma`:

```prisma
model QRToken {
  id          String   @id @default(cuid())
  token       String   @unique
  projectId   String
  orgId       String
  expiresAt   DateTime
  generatedBy String
  isRevoked   Boolean  @default(false)
  revokedAt   DateTime?
  revokedBy   String?
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([orgId])
  @@index([token])
  @@index([expiresAt])
  @@map("qr_tokens")
}
```

Run migration:

```bash
cd packages/database
pnpm prisma migrate dev --name add-qr-tokens
```

### Step 3: Create GenerateQRToken Resolver (20 min)

Create `apps/backend/src/modules/qr-portal/resolvers/generate-qr-token.resolver.ts`:

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/clerk-auth.guard';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { QRTokenService } from '../services/qr-token.service';

@Resolver()
export class GenerateQRTokenResolver {
  constructor(private readonly qrTokenService: QRTokenService) {}

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard)
  async generateQRToken(
    @Args('projectId') projectId: string,
    @CurrentUser() user: any
  ): Promise<string> {
    return this.qrTokenService.generateQRToken({
      projectId,
      orgId: user.orgId,
      generatedBy: user.id,
    });
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard)
  async regenerateQRToken(
    @Args('projectId') projectId: string,
    @CurrentUser() user: any
  ): Promise<string> {
    return this.qrTokenService.regenerateQRToken(projectId, user.orgId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard)
  async revokeQRToken(@Args('token') token: string, @CurrentUser() user: any): Promise<boolean> {
    await this.qrTokenService.revokeQRToken(token, user.id);
    return true;
  }
}
```

### Step 4: Create QRPortalModule (10 min)

Create `apps/backend/src/modules/qr-portal/qr-portal.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/modules/database/prisma.module';
import { QRTokenService } from './services/qr-token.service';
import { GenerateQRTokenResolver } from './resolvers/generate-qr-token.resolver';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [QRTokenService, GenerateQRTokenResolver],
  exports: [QRTokenService],
})
export class QRPortalModule {}
```

Add to `apps/backend/src/app.module.ts`:

```typescript
import { QRPortalModule } from './modules/qr-portal/qr-portal.module';

@Module({
  imports: [
    // ... other modules
    QRPortalModule,
  ],
})
export class AppModule {}
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/backend/src/modules/qr-portal/services/qr-token.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { QRTokenService } from './qr-token.service';
import { PrismaService } from '@/modules/database/prisma.service';

describe('QRTokenService', () => {
  let service: QRTokenService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            qRToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QRTokenService>(QRTokenService);
    jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('generateQRToken', () => {
    it('should generate JWT token with 24-hour expiration', async () => {
      const mockToken = 'mock-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);
      jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      const token = await service.generateQRToken({
        projectId: 'project-id',
        orgId: 'org-id',
        generatedBy: 'user-id',
      });

      expect(token).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should store token metadata in database', async () => {
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      const createSpy = jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      await service.generateQRToken({
        projectId: 'project-id',
        orgId: 'org-id',
        generatedBy: 'user-id',
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'project-id',
            orgId: 'org-id',
            isRevoked: false,
          }),
        })
      );
    });
  });

  describe('validateQRToken', () => {
    it('should return payload for valid token', async () => {
      const mockPayload = {
        projectId: 'project-id',
        orgId: 'org-id',
        permissions: ['view_submissions'],
        tokenType: 'inspector_access' as const,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue({
        isRevoked: false,
      } as any);

      const result = await service.validateQRToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should return null for revoked token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({} as any);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue(null);

      const result = await service.validateQRToken('revoked-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredPayload = {
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(expiredPayload as any);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue({
        isRevoked: false,
      } as any);

      const result = await service.validateQRToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('regenerateQRToken', () => {
    it('should revoke existing tokens before generating new one', async () => {
      const updateManySpy = jest.spyOn(prisma.qRToken, 'updateMany').mockResolvedValue({} as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');
      jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      await service.regenerateQRToken('project-id', 'org-id', 'user-id');

      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRevoked: true,
          }),
        })
      );
    });
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/backend
pnpm test qr-token.service
```

**Screenshot:** Save failing test to `evidence/ISSUE-100/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test qr-token.service
```

Expected: All tests pass

**Screenshot:** Save passing tests to `evidence/ISSUE-100/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/backend/src/modules/qr-portal/services/qr-token.service.ts
- apps/backend/src/modules/qr-portal/resolvers/generate-qr-token.resolver.ts
- apps/backend/src/modules/qr-portal/qr-portal.module.ts
- apps/backend/src/modules/qr-portal/services/qr-token.service.spec.ts
- packages/database/migrations/###\_add_qr_tokens.sql (Prisma auto-generated)

**Modify:**

- packages/database/schema.prisma (add QRToken model)
- apps/backend/src/app.module.ts (import QRPortalModule)

## Verification Checklist

- [ ] QRTokenService created
- [ ] generateQRToken() method functional
- [ ] validateQRToken() method functional
- [ ] revokeQRToken() method functional
- [ ] regenerateQRToken() method functional
- [ ] QRToken Prisma model created
- [ ] Database migration successful
- [ ] GraphQL mutations created
- [ ] Tests passing (8+ tests)
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-100/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests - 8+ tests)
  - coverage-report.png (>80% coverage)
- code/
  - qr-token-service.png (QRTokenService implementation)
  - prisma-schema.png (QRToken model)
- deployment/
  - graphql-playground.png (generateQRToken mutation test)

## Troubleshooting

**Problem:** JWT_SECRET not found

- **Cause:** Environment variable missing
- **Solution:** Add QR_TOKEN_SECRET to .env:
  ```
  QR_TOKEN_SECRET=your-secret-key-here
  ```

**Problem:** Prisma migration fails

- **Cause:** Database connection issue or schema conflict
- **Solution:** Check PostgreSQL connection, run `pnpm prisma db push`

**Problem:** Token validation always returns null

- **Cause:** Secret mismatch between sign() and verify()
- **Solution:** Ensure same secret used in both JwtModule and validateQRToken()

## Success Criteria

- [ ] QRTokenService generates valid JWT tokens
- [ ] Tokens expire after 24 hours
- [ ] Token metadata stored in database
- [ ] validateQRToken() correctly verifies tokens
- [ ] Revoked tokens rejected
- [ ] Expired tokens rejected
- [ ] regenerateQRToken() invalidates old tokens
- [ ] Tests pass with >80% coverage
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Create QRTokenService: 60 min
- Create Prisma schema and migration: 30 min
- Create resolver: 20 min
- Create module: 10 min

## Next Issue

**ISSUE-101:** Inspector Portal Layout (3h)

- Prerequisites: This issue complete (QR tokens functional)
- Uses: validateQRToken() to authenticate inspector access
- Creates: Public /inspector/[token] route
