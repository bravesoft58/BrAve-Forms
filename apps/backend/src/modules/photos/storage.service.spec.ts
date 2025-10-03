import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { StorageType } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';

jest.mock('@aws-sdk/client-s3');
jest.mock('sharp');

describe('StorageService', () => {
  let service: StorageService;
  let mockS3Send: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AWS_REGION: 'us-east-1',
        S3_ENDPOINT: 'http://localhost:9000',
        AWS_ACCESS_KEY_ID: 'minioadmin',
        AWS_SECRET_ACCESS_KEY: 'minioadmin',
        S3_BUCKET_NAME: 'braveforms-photos',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockS3Send = jest.fn().mockResolvedValue({});
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('configuration', () => {
    it('should handle missing config values with defaults', async () => {
      const mockEmptyConfig = {
        get: jest.fn(() => undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockEmptyConfig,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);
      expect(testService).toBeDefined();
    });
  });

  describe('compressImage', () => {
    it('should compress image buffer with default quality', async () => {
      const inputBuffer = Buffer.from('fake-jpeg-image-data');
      const outputBuffer = Buffer.from('compressed-jpeg');

      const mockToBuffer = jest.fn().mockResolvedValue(outputBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      const result = await service.compressImage(inputBuffer);

      expect(sharp).toHaveBeenCalledWith(inputBuffer);
      expect(mockJpeg).toHaveBeenCalledWith({ quality: 85, mozjpeg: true });
      expect(result).toBe(outputBuffer);
    });

    it('should compress image buffer with custom quality', async () => {
      const inputBuffer = Buffer.from('fake-jpeg-image-data');
      const outputBuffer = Buffer.from('compressed-jpeg');

      const mockToBuffer = jest.fn().mockResolvedValue(outputBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      const result = await service.compressImage(inputBuffer, 90);

      expect(mockJpeg).toHaveBeenCalledWith({ quality: 90, mozjpeg: true });
      expect(result).toBe(outputBuffer);
    });
  });

  describe('uploadToS3', () => {
    it('should upload buffer to S3 with correct parameters', async () => {
      const buffer = Buffer.from('test-image-data');
      const key = 'photos/org_123/photo_456.jpg';
      const mimeType = 'image/jpeg';

      const result = await service.uploadToS3(buffer, key, mimeType);

      expect(mockS3Send).toHaveBeenCalledTimes(1);
      const command = mockS3Send.mock.calls[0][0];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(result).toBe(key);
    });

    it('should handle S3 upload errors', async () => {
      const buffer = Buffer.from('test-image-data');
      const key = 'photos/org_123/photo_456.jpg';
      const mimeType = 'image/jpeg';

      mockS3Send.mockRejectedValueOnce(new Error('S3 upload failed'));

      await expect(service.uploadToS3(buffer, key, mimeType)).rejects.toThrow(
        'S3 upload failed'
      );
    });
  });

  describe('processAndStorePhoto', () => {
    it('should use PostgreSQL storage for files <100KB', async () => {
      const inputBuffer = Buffer.from('fake-jpeg-image-data');
      const compressedBuffer = Buffer.alloc(50000);

      const mockToBuffer = jest.fn().mockResolvedValue(compressedBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      const result = await service.processAndStorePhoto(inputBuffer, 'org_123', 'photo_456');

      expect(result.storageType).toBe(StorageType.POSTGRESQL);
      expect(result.buffer).toBe(compressedBuffer);
      expect(result.size).toBe(50000);
      expect(result.s3Key).toBeUndefined();
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('should use S3 storage for files >=100KB', async () => {
      const inputBuffer = Buffer.from('fake-large-jpeg-image-data');
      const compressedBuffer = Buffer.alloc(150000);

      const mockToBuffer = jest.fn().mockResolvedValue(compressedBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      const result = await service.processAndStorePhoto(inputBuffer, 'org_123', 'photo_456');

      expect(result.storageType).toBe(StorageType.S3);
      expect(result.buffer).toBe(compressedBuffer);
      expect(result.size).toBe(150000);
      expect(result.s3Key).toBe('photos/org_123/photo_456.jpg');
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('should use S3 storage for files exactly 100KB', async () => {
      const inputBuffer = Buffer.from('fake-jpeg-image-data');
      const compressedBuffer = Buffer.alloc(100000);

      const mockToBuffer = jest.fn().mockResolvedValue(compressedBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      const result = await service.processAndStorePhoto(inputBuffer, 'org_123', 'photo_456');

      expect(result.storageType).toBe(StorageType.S3);
      expect(result.s3Key).toBe('photos/org_123/photo_456.jpg');
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('should construct correct S3 key path', async () => {
      const inputBuffer = Buffer.from('fake-large-jpeg-image-data');
      const compressedBuffer = Buffer.alloc(150000);

      const mockToBuffer = jest.fn().mockResolvedValue(compressedBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      const result = await service.processAndStorePhoto(
        inputBuffer,
        'org_xyz',
        'photo_abc123'
      );

      expect(result.s3Key).toBe('photos/org_xyz/photo_abc123.jpg');
    });

    it('should handle compression errors', async () => {
      const inputBuffer = Buffer.from('invalid-image-data');

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: jest.fn().mockReturnValue({
          toBuffer: jest.fn().mockRejectedValue(new Error('Compression failed')),
        }),
      });

      await expect(
        service.processAndStorePhoto(inputBuffer, 'org_123', 'photo_456')
      ).rejects.toThrow('Compression failed');
    });

    it('should handle S3 upload errors for large files', async () => {
      const inputBuffer = Buffer.from('fake-large-jpeg-image-data');
      const compressedBuffer = Buffer.alloc(150000);

      const mockToBuffer = jest.fn().mockResolvedValue(compressedBuffer);
      const mockJpeg = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });

      (sharp as unknown as jest.Mock).mockReturnValue({
        jpeg: mockJpeg,
      });

      mockS3Send.mockRejectedValueOnce(new Error('S3 network error'));

      await expect(
        service.processAndStorePhoto(inputBuffer, 'org_123', 'photo_456')
      ).rejects.toThrow('S3 network error');
    });
  });
});
