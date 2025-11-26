import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { QRTokenService } from '../qr-token.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { TokenPermission } from '@prisma/client';

describe('QRTokenService', () => {
  let service: QRTokenService;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    qRToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret-key-for-qr-tokens-minimum-32-chars',
        QR_TOKEN_EXPIRY_HOURS: '24',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRTokenService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<QRTokenService>(QRTokenService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    const validTokenData = {
      projectId: 'project_123',
      permissions: [TokenPermission.VIEW_SUBMISSIONS, TokenPermission.VIEW_PHOTOS],
      generatedBy: 'user_456',
      orgId: 'org_789',
    };

    it('should generate a token with 24-hour expiration', async () => {
      const mockProject = {
        id: 'project_123',
        orgId: 'org_789',
        name: 'Test Project',
      };

      const mockCreatedToken = {
        id: 'token_abc',
        projectId: 'project_123',
        token: 'jwt-token-here',
        permissions: [TokenPermission.VIEW_SUBMISSIONS, TokenPermission.VIEW_PHOTOS],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: null,
        generatedBy: 'user_456',
        createdAt: new Date(),
        accessCount: 0,
        lastAccessAt: null,
      };

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.qRToken.create.mockResolvedValue(mockCreatedToken);

      const result = await service.generateToken(validTokenData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.permissions).toEqual(validTokenData.permissions);

      // Verify expiration is approximately 24 hours from now
      const expiresAt = new Date(result.expiresAt);
      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(60000);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(service.generateToken(validTokenData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if project belongs to different org', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.generateToken({ ...validTokenData, orgId: 'wrong_org' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should require at least one permission', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      await expect(
        service.generateToken({ ...validTokenData, permissions: [] })
      ).rejects.toThrow(BadRequestException);
    });

    it('should only allow READ-ONLY permissions', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      // All valid permissions should work
      const validPermissions = [
        TokenPermission.VIEW_SUBMISSIONS,
        TokenPermission.VIEW_PHOTOS,
        TokenPermission.VIEW_PROJECT_INFO,
      ];

      mockPrismaService.qRToken.create.mockResolvedValue({
        id: 'token_abc',
        permissions: validPermissions,
        expiresAt: new Date(),
      });

      const result = await service.generateToken({
        ...validTokenData,
        permissions: validPermissions,
      });

      expect(result.permissions).toEqual(validPermissions);
    });

    it('should store token in database with all metadata', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.qRToken.create.mockResolvedValue({
        id: 'token_abc',
        token: 'generated-jwt',
        expiresAt: new Date(),
      });

      await service.generateToken(validTokenData);

      expect(mockPrismaService.qRToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: validTokenData.projectId,
          permissions: validTokenData.permissions,
          generatedBy: validTokenData.generatedBy,
        }),
      });
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for valid token', async () => {
      const mockToken = {
        id: 'token_abc',
        projectId: 'project_123',
        token: 'valid-jwt-token',
        permissions: [TokenPermission.VIEW_SUBMISSIONS],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        revokedAt: null,
        accessCount: 5,
        lastAccessAt: new Date(),
      };

      mockPrismaService.qRToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaService.qRToken.update.mockResolvedValue({
        ...mockToken,
        accessCount: 6,
      });

      const result = await service.verifyToken('valid-jwt-token');

      expect(result).toHaveProperty('projectId', 'project_123');
      expect(result).toHaveProperty('permissions');
      expect(result.permissions).toContain(TokenPermission.VIEW_SUBMISSIONS);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const mockToken = {
        id: 'token_abc',
        token: 'expired-jwt-token',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        revokedAt: null,
      };

      mockPrismaService.qRToken.findUnique.mockResolvedValue(mockToken);

      await expect(service.verifyToken('expired-jwt-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const mockToken = {
        id: 'token_abc',
        token: 'revoked-jwt-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: new Date(Date.now() - 30 * 60 * 1000), // Revoked 30 mins ago
      };

      mockPrismaService.qRToken.findUnique.mockResolvedValue(mockToken);

      await expect(service.verifyToken('revoked-jwt-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent token', async () => {
      mockPrismaService.qRToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyToken('non-existent-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should increment access count on successful verification', async () => {
      const mockToken = {
        id: 'token_abc',
        projectId: 'project_123',
        token: 'valid-token',
        permissions: [TokenPermission.VIEW_SUBMISSIONS],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: null,
        accessCount: 5,
        lastAccessAt: new Date(Date.now() - 60000),
      };

      mockPrismaService.qRToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaService.qRToken.update.mockResolvedValue({ ...mockToken, accessCount: 6 });

      await service.verifyToken('valid-token');

      expect(mockPrismaService.qRToken.update).toHaveBeenCalledWith({
        where: { id: 'token_abc' },
        data: {
          accessCount: { increment: 1 },
          lastAccessAt: expect.any(Date),
        },
      });
    });
  });

  describe('revokeToken', () => {
    it('should revoke an active token', async () => {
      const mockToken = {
        id: 'token_abc',
        projectId: 'project_123',
        token: 'active-token',
        revokedAt: null,
        project: { orgId: 'org_789' },
      };

      mockPrismaService.qRToken.findFirst.mockResolvedValue(mockToken);
      mockPrismaService.qRToken.update.mockResolvedValue({
        ...mockToken,
        revokedAt: new Date(),
      });

      const result = await service.revokeToken('token_abc', 'org_789');

      expect(result.revokedAt).toBeDefined();
      expect(mockPrismaService.qRToken.update).toHaveBeenCalledWith({
        where: { id: 'token_abc' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException for non-existent token', async () => {
      mockPrismaService.qRToken.findFirst.mockResolvedValue(null);

      await expect(service.revokeToken('non-existent', 'org_789')).rejects.toThrow(NotFoundException);
    });

    it('should enforce orgId isolation when revoking', async () => {
      mockPrismaService.qRToken.findFirst.mockResolvedValue(null);

      await expect(service.revokeToken('token_abc', 'wrong_org')).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.qRToken.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'token_abc',
          project: { orgId: 'wrong_org' },
        },
        include: { project: true },
      });
    });
  });

  describe('revokeAllProjectTokens', () => {
    it('should revoke all active tokens for a project', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.qRToken.findMany.mockResolvedValue([
        { id: 'token_1', revokedAt: null },
        { id: 'token_2', revokedAt: null },
      ]);

      const result = await service.revokeAllProjectTokens('project_123', 'org_789');

      expect(result.revokedCount).toBe(2);
    });

    it('should only revoke non-revoked tokens', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.qRToken.findMany.mockResolvedValue([
        { id: 'token_1', revokedAt: null },
        { id: 'token_2', revokedAt: new Date() }, // Already revoked
      ]);

      await service.revokeAllProjectTokens('project_123', 'org_789');

      // Should only update the non-revoked token
      expect(mockPrismaService.qRToken.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project_123',
          revokedAt: null,
        },
      });
    });
  });

  describe('getProjectTokens', () => {
    it('should return all tokens for a project', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      const mockTokens = [
        {
          id: 'token_1',
          permissions: [TokenPermission.VIEW_SUBMISSIONS],
          expiresAt: new Date(),
          revokedAt: null,
          accessCount: 10,
          createdAt: new Date(),
        },
        {
          id: 'token_2',
          permissions: [TokenPermission.VIEW_PHOTOS],
          expiresAt: new Date(),
          revokedAt: new Date(),
          accessCount: 5,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.qRToken.findMany.mockResolvedValue(mockTokens);

      const result = await service.getProjectTokens('project_123', 'org_789');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'token_1');
    });

    it('should throw NotFoundException for non-existent project', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(service.getProjectTokens('non-existent', 'org_789')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should enforce orgId isolation', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(service.getProjectTokens('project_123', 'wrong_org')).rejects.toThrow(
        NotFoundException
      );

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'project_123',
          orgId: 'wrong_org',
        },
      });
    });
  });

  describe('hasPermission', () => {
    it('should return true when token has required permission', async () => {
      const mockToken = {
        id: 'token_abc',
        projectId: 'project_123',
        permissions: [TokenPermission.VIEW_SUBMISSIONS, TokenPermission.VIEW_PHOTOS],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: null,
      };

      mockPrismaService.qRToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaService.qRToken.update.mockResolvedValue(mockToken);

      const result = await service.hasPermission('valid-token', TokenPermission.VIEW_SUBMISSIONS);

      expect(result).toBe(true);
    });

    it('should return false when token lacks required permission', async () => {
      const mockToken = {
        id: 'token_abc',
        projectId: 'project_123',
        permissions: [TokenPermission.VIEW_PHOTOS], // Only has VIEW_PHOTOS
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: null,
      };

      mockPrismaService.qRToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaService.qRToken.update.mockResolvedValue(mockToken);

      const result = await service.hasPermission('valid-token', TokenPermission.VIEW_SUBMISSIONS);

      expect(result).toBe(false);
    });
  });

  describe('JWT Security', () => {
    it('should generate unique tokens for each request', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      let callCount = 0;
      mockPrismaService.qRToken.create.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: `token_${callCount}`,
          token: `unique-jwt-${callCount}`,
          expiresAt: new Date(),
        });
      });

      const token1 = await service.generateToken({
        projectId: 'project_123',
        permissions: [TokenPermission.VIEW_SUBMISSIONS],
        generatedBy: 'user_456',
        orgId: 'org_789',
      });

      const token2 = await service.generateToken({
        projectId: 'project_123',
        permissions: [TokenPermission.VIEW_SUBMISSIONS],
        generatedBy: 'user_456',
        orgId: 'org_789',
      });

      expect(token1.token).not.toBe(token2.token);
    });

    it('should include projectId in token payload', async () => {
      const mockProject = { id: 'project_123', orgId: 'org_789' };
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.qRToken.create.mockImplementation((args) => {
        return Promise.resolve({
          id: 'token_abc',
          ...args.data,
          expiresAt: args.data.expiresAt,
        });
      });

      const result = await service.generateToken({
        projectId: 'project_123',
        permissions: [TokenPermission.VIEW_SUBMISSIONS],
        generatedBy: 'user_456',
        orgId: 'org_789',
      });

      expect(result.projectId).toBe('project_123');
    });
  });

  describe('Multi-tenancy Isolation', () => {
    it('should prevent accessing tokens across organizations', async () => {
      // Token belongs to org_123, try to access from org_789
      // Query returns null because orgId filter excludes it
      mockPrismaService.qRToken.findFirst.mockResolvedValue(null);

      await expect(service.revokeToken('token_abc', 'org_789')).rejects.toThrow(NotFoundException);
    });

    it('should prevent generating tokens for projects in other orgs', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.generateToken({
          projectId: 'project_in_other_org',
          permissions: [TokenPermission.VIEW_SUBMISSIONS],
          generatedBy: 'user_456',
          orgId: 'my_org',
        })
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'project_in_other_org',
          orgId: 'my_org',
        },
      });
    });
  });
});
