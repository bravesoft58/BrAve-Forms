import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { ExifService } from './exif.service';
import { StorageService } from './storage.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StorageType } from '@prisma/client';

describe('Photos Integration Tests (ISSUE-064)', () => {
  let photosService: PhotosService;
  let exifService: ExifService;
  let storageService: StorageService;

  const mockPrismaService = {
    photo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AWS_REGION: 'us-east-1',
        S3_ENDPOINT: 'http://localhost:8335',
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        S3_BUCKET_NAME: 'test-bucket',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        ExifService,
        StorageService,
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

    photosService = module.get<PhotosService>(PhotosService);
    exifService = module.get<ExifService>(ExifService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Photo Upload Workflow', () => {
    it('should orchestrate EXIF extraction, compression, and storage decision', async () => {
      const mockImageBuffer = Buffer.from('fake-jpeg-data');
      const orgId = 'org_123';
      const inspectionId = 'inspection_456';
      const uploadedBy = 'user_789';

      jest.spyOn(exifService, 'extractExifData').mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 100,
        takenAt: new Date('2025-10-03T12:00:00Z'),
        deviceMake: 'Apple',
        deviceModel: 'iPhone 14 Pro',
      });

      jest.spyOn(exifService, 'extractFullExifMetadata').mockReturnValue({
        Make: 'Apple',
        Model: 'iPhone 14 Pro',
        imageWidth: 4032,
        imageHeight: 3024,
      });

      jest.spyOn(storageService, 'processAndStorePhoto').mockResolvedValue({
        buffer: Buffer.from('compressed-jpeg'),
        size: 50000,
        storageType: StorageType.POSTGRESQL,
      });

      mockPrismaService.photo.create.mockResolvedValue({
        id: 'photo_1',
        orgId,
        inspectionId,
        fileSize: 50000,
        storageType: StorageType.POSTGRESQL,
        latitude: 37.7749,
        longitude: -122.4194,
      });

      const result = await photosService.uploadPhoto(
        mockImageBuffer,
        orgId,
        inspectionId,
        uploadedBy,
        'Test photo'
      );

      expect(exifService.extractExifData).toHaveBeenCalledWith(mockImageBuffer);
      expect(storageService.processAndStorePhoto).toHaveBeenCalled();
      expect(result.latitude).toBe(37.7749);
      expect(result.longitude).toBe(-122.4194);
      expect(result.storageType).toBe(StorageType.POSTGRESQL);
    });

    it('should handle photos without GPS data', async () => {
      const mockImageBuffer = Buffer.from('fake-jpeg-no-gps');

      jest.spyOn(exifService, 'extractExifData').mockReturnValue({
        latitude: null,
        longitude: null,
        altitude: null,
        takenAt: new Date('2025-10-03T12:00:00Z'),
        deviceMake: null,
        deviceModel: null,
      });

      jest.spyOn(exifService, 'extractFullExifMetadata').mockReturnValue(null);

      jest.spyOn(storageService, 'processAndStorePhoto').mockResolvedValue({
        buffer: Buffer.from('compressed'),
        size: 30000,
        storageType: StorageType.POSTGRESQL,
      });

      mockPrismaService.photo.create.mockResolvedValue({
        id: 'photo_2',
        latitude: null,
        longitude: null,
      });

      const result = await photosService.uploadPhoto(
        mockImageBuffer,
        'org_123',
        'inspection_456',
        'user_789'
      );

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    it('should use S3 storage for large compressed images', async () => {
      const mockImageBuffer = Buffer.from('fake-large-jpeg');

      jest.spyOn(exifService, 'extractExifData').mockReturnValue({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: null,
        takenAt: new Date(),
        deviceMake: 'Canon',
        deviceModel: 'EOS R5',
      });

      jest.spyOn(exifService, 'extractFullExifMetadata').mockReturnValue({});

      jest.spyOn(storageService, 'processAndStorePhoto').mockResolvedValue({
        buffer: Buffer.from('compressed'),
        size: 150000,
        storageType: StorageType.S3,
        s3Key: 'photos/org_123/photo_xyz.jpg',
      });

      mockPrismaService.photo.create.mockResolvedValue({
        id: 'photo_3',
        storageType: StorageType.S3,
        s3Key: 'photos/org_123/photo_xyz.jpg',
        imageData: null,
      });

      const result = await photosService.uploadPhoto(
        mockImageBuffer,
        'org_123',
        'inspection_456',
        'user_789'
      );

      expect(result.storageType).toBe(StorageType.S3);
      expect(result.s3Key).toBeDefined();
      expect(result.imageData).toBeNull();
    });
  });

  describe('Photo Query Filters Integration', () => {
    it('should filter photos by date range', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      mockPrismaService.photo.findMany.mockResolvedValue([
        { id: 'photo_1', takenAt: new Date('2025-10-15') },
      ]);

      await photosService.getPhotosByProject('project_123', 'org_456', {
        startDate,
        endDate,
      });

      expect(mockPrismaService.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            takenAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should filter photos with GPS coordinates', async () => {
      mockPrismaService.photo.findMany.mockResolvedValue([
        { id: 'photo_1', latitude: 37.7749, longitude: -122.4194 },
      ]);

      await photosService.getPhotosByProject('project_123', 'org_456', {
        hasGps: true,
      });

      expect(mockPrismaService.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            latitude: { not: null },
            longitude: { not: null },
          }),
        })
      );
    });

    it('should support pagination', async () => {
      mockPrismaService.photo.findMany.mockResolvedValue([]);

      await photosService.getPhotosByProject('project_123', 'org_456', {
        take: 10,
        skip: 20,
      });

      expect(mockPrismaService.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should scope all queries by orgId', async () => {
      mockPrismaService.photo.findMany.mockResolvedValue([]);

      await photosService.getPhotosByProject('project_123', 'org_456', {});

      expect(mockPrismaService.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org_456',
          }),
        })
      );
    });
  });
});
