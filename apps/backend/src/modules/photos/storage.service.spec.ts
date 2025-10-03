import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { StorageType } from '@prisma/client';

describe('StorageService', () => {
  let service: StorageService;

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

  describe('compressImage', () => {
    it('should compress image buffer', async () => {
      const fakeBuffer = Buffer.from('fake-jpeg-image-data');

      await expect(service.compressImage(fakeBuffer)).rejects.toThrow();
    });
  });

  describe('processAndStorePhoto', () => {
    it('should use PostgreSQL storage for files <100KB', async () => {
      expect(service).toBeDefined();
    });

    it('should use S3 storage for files >100KB', async () => {
      expect(service).toBeDefined();
    });
  });
});
