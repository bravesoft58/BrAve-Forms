import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { StorageType } from '@prisma/client';

describe('PhotosService', () => {
  let service: PhotosService;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    photo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create photo with S3 storage for file >100KB', async () => {
      const photoData = {
        orgId: 'org_123',
        inspectionId: 'inspection_456',
        fileSize: 150000,
        mimeType: 'image/jpeg',
        s3Key: 'photos/photo_789.jpg',
        uploadedBy: 'user_123',
        takenAt: new Date('2025-10-03T12:00:00Z'),
      };

      mockPrismaService.photo.create.mockResolvedValue({
        id: 'photo_789',
        ...photoData,
        storageType: StorageType.S3,
        uploadedAt: new Date(),
        latitude: null,
        longitude: null,
        altitude: null,
        caption: null,
        thumbnailKey: null,
        deviceModel: null,
        deviceMake: null,
        exifData: null,
        imageData: null,
      });

      const result = await service.create(photoData);

      expect(result.storageType).toBe(StorageType.S3);
      expect(result.s3Key).toBe('photos/photo_789.jpg');
      expect(mockPrismaService.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storageType: StorageType.S3,
        }),
      });
    });

    it('should create photo with PostgreSQL storage for file <100KB', async () => {
      const photoData = {
        orgId: 'org_123',
        inspectionId: 'inspection_456',
        fileSize: 50000,
        mimeType: 'image/jpeg',
        imageData: Buffer.from('fake-image-data'),
        uploadedBy: 'user_123',
        takenAt: new Date('2025-10-03T12:00:00Z'),
      };

      mockPrismaService.photo.create.mockResolvedValue({
        id: 'photo_790',
        ...photoData,
        storageType: StorageType.POSTGRESQL,
        uploadedAt: new Date(),
        latitude: null,
        longitude: null,
        altitude: null,
        caption: null,
        s3Key: null,
        thumbnailKey: null,
        deviceModel: null,
        deviceMake: null,
        exifData: null,
      });

      const result = await service.create(photoData);

      expect(result.storageType).toBe(StorageType.POSTGRESQL);
      expect(result.imageData).toBeDefined();
      expect(mockPrismaService.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storageType: StorageType.POSTGRESQL,
        }),
      });
    });
  });

  describe('getPhotos', () => {
    it('should return photos for inspection scoped by orgId', async () => {
      const photos = [
        {
          id: 'photo_1',
          orgId: 'org_123',
          inspectionId: 'inspection_456',
          fileSize: 100000,
          mimeType: 'image/jpeg',
          storageType: StorageType.S3,
          s3Key: 'photos/photo_1.jpg',
          uploadedBy: 'user_123',
          takenAt: new Date(),
          uploadedAt: new Date(),
          latitude: null,
          longitude: null,
          altitude: null,
          caption: null,
          thumbnailKey: null,
          deviceModel: null,
          deviceMake: null,
          exifData: null,
          imageData: null,
        },
      ];

      mockPrismaService.photo.findMany.mockResolvedValue(photos);

      const result = await service.getPhotos('inspection_456', 'org_123');

      expect(result).toEqual(photos);
      expect(mockPrismaService.photo.findMany).toHaveBeenCalledWith({
        where: {
          inspectionId: 'inspection_456',
          orgId: 'org_123',
        },
        orderBy: {
          takenAt: 'asc',
        },
      });
    });
  });

  describe('getPhoto', () => {
    it('should return single photo scoped by orgId', async () => {
      const photo = {
        id: 'photo_1',
        orgId: 'org_123',
        inspectionId: 'inspection_456',
        fileSize: 100000,
        mimeType: 'image/jpeg',
        storageType: StorageType.S3,
        s3Key: 'photos/photo_1.jpg',
        uploadedBy: 'user_123',
        takenAt: new Date(),
        uploadedAt: new Date(),
        latitude: null,
        longitude: null,
        altitude: null,
        caption: null,
        thumbnailKey: null,
        deviceModel: null,
        deviceMake: null,
        exifData: null,
        imageData: null,
      };

      mockPrismaService.photo.findFirst.mockResolvedValue(photo);

      const result = await service.getPhoto('photo_1', 'org_123');

      expect(result).toEqual(photo);
      expect(mockPrismaService.photo.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'photo_1',
          orgId: 'org_123',
        },
      });
    });

    it('should throw NotFoundException when photo not found', async () => {
      mockPrismaService.photo.findFirst.mockResolvedValue(null);

      await expect(service.getPhoto('photo_999', 'org_123')).rejects.toThrow(
        'Photo not found'
      );
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo scoped by orgId', async () => {
      const photo = {
        id: 'photo_1',
        orgId: 'org_123',
        inspectionId: 'inspection_456',
      };

      mockPrismaService.photo.findFirst.mockResolvedValue(photo);
      mockPrismaService.photo.delete.mockResolvedValue(photo);

      await service.deletePhoto('photo_1', 'org_123');

      expect(mockPrismaService.photo.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'photo_1',
          orgId: 'org_123',
        },
      });
      expect(mockPrismaService.photo.delete).toHaveBeenCalledWith({
        where: {
          id: 'photo_1',
        },
      });
    });

    it('should throw NotFoundException when attempting to delete non-existent photo', async () => {
      mockPrismaService.photo.findFirst.mockResolvedValue(null);

      await expect(service.deletePhoto('photo_999', 'org_123')).rejects.toThrow(
        'Photo not found'
      );
      expect(mockPrismaService.photo.delete).not.toHaveBeenCalled();
    });
  });
});
