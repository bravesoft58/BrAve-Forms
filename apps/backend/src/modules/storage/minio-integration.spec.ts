/**
 * MinIO Integration Test for BrAve Forms Photo Storage
 * Tests containerized MinIO S3-compatible storage
 */

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PhotoStorageService } from './photo-storage.service';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// Mock configuration for testing
const mockConfig = {
  get: (key: string, defaultValue?: any) => {
    const config = {
      'AWS_ACCESS_KEY_ID': 'minioadmin',
      'AWS_SECRET_ACCESS_KEY': 'minioadmin',
      'S3_ENDPOINT': 'http://localhost:9000',
      'AWS_REGION': 'us-east-1',
      'S3_BUCKET_NAME': 'brave-forms-photos-test'
    };
    return config[key] || defaultValue;
  }
};

describe('MinIO Photo Storage Integration', () => {
  let photoStorageService: PhotoStorageService;
  let s3Client: S3Client;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PhotoStorageService,
        {
          provide: ConfigService,
          useValue: mockConfig
        }
      ]
    }).compile();

    photoStorageService = module.get<PhotoStorageService>(PhotoStorageService);

    // Create S3 client for direct testing
    s3Client = new S3Client({
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin'
      },
      forcePathStyle: true
    });
  });

  describe('MinIO Connectivity', () => {
    it('should connect to MinIO API', async () => {
      try {
        const response = await s3Client.send(new ListBucketsCommand({}));
        expect(response.Buckets).toBeDefined();
        console.log('✅ MinIO API connectivity: OK');
      } catch (error) {
        console.error('❌ MinIO API connectivity failed:', error.message);
        throw error;
      }
    });

    it('should access MinIO console', async () => {
      try {
        const response = await fetch('http://localhost:9001');
        expect(response.ok).toBe(true);
        console.log('✅ MinIO Console accessibility: OK');
      } catch (error) {
        console.error('❌ MinIO Console access failed:', error.message);
        throw error;
      }
    });
  });

  describe('Photo Storage Operations', () => {
    let testPhotoBuffer: Buffer;

    beforeAll(async () => {
      // Create a test photo
      testPhotoBuffer = await sharp({
        create: {
          width: 1024,
          height: 768,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    });

    it('should ensure bucket exists', async () => {
      try {
        await photoStorageService.ensureBucketExists();
        console.log('✅ Bucket creation/verification: OK');
      } catch (error) {
        console.error('❌ Bucket creation failed:', error.message);
        throw error;
      }
    });

    it('should upload construction photo with metadata', async () => {
      const metadata = {
        projectId: 'test-project-001',
        siteLocation: '40.7128,-74.0060',
        capturedAt: new Date().toISOString(),
        device: 'Test Device',
        complianceType: 'stormwater-inspection',
        formId: 'form-001',
        userId: 'user-test-001'
      };

      try {
        const startTime = Date.now();
        const result = await photoStorageService.uploadPhoto(
          testPhotoBuffer,
          metadata,
          'test-photo.jpg'
        );
        const uploadTime = Date.now() - startTime;

        expect(result.photoId).toBeDefined();
        expect(result.originalSize).toBe(testPhotoBuffer.length);
        expect(result.compressedSize).toBeLessThanOrEqual(testPhotoBuffer.length);
        expect(result.variants).toHaveLength(4); // thumbnail, small, medium, large
        expect(result.checksums.md5).toBeDefined();
        expect(result.checksums.sha256).toBeDefined();

        console.log(`✅ Photo upload: ${result.photoId}`);
        console.log(`   Size: ${(result.originalSize / 1024 / 1024).toFixed(2)}MB -> ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Compression: ${result.compressionRatio.toFixed(1)}%`);
        console.log(`   Upload time: ${uploadTime}ms`);
        console.log(`   Variants: ${result.variants.map(v => v.name).join(', ')}`);

      } catch (error) {
        console.error('❌ Photo upload failed:', error.message);
        throw error;
      }
    });

    it('should handle large photo uploads', async () => {
      // Create a larger test photo (simulate 5MB)
      const largePhoto = await sharp({
        create: {
          width: 3000,
          height: 2000,
          channels: 3,
          background: { r: 120, g: 180, b: 140 }
        }
      })
      .jpeg({ quality: 90 })
      .toBuffer();

      expect(largePhoto.length).toBeGreaterThan(2 * 1024 * 1024); // >2MB

      const metadata = {
        projectId: 'test-project-001',
        siteLocation: '40.7128,-74.0060',
        capturedAt: new Date().toISOString(),
        complianceType: 'large-photo-test',
        userId: 'user-test-001'
      };

      try {
        const startTime = Date.now();
        const result = await photoStorageService.uploadPhoto(
          largePhoto,
          metadata,
          'large-test-photo.jpg'
        );
        const uploadTime = Date.now() - startTime;

        expect(result.photoId).toBeDefined();
        expect(uploadTime).toBeLessThan(10000); // Should complete in <10 seconds

        console.log(`✅ Large photo upload: ${result.photoId}`);
        console.log(`   Size: ${(result.originalSize / 1024 / 1024).toFixed(2)}MB -> ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Upload time: ${uploadTime}ms`);

      } catch (error) {
        console.error('❌ Large photo upload failed:', error.message);
        throw error;
      }
    });
  });

  describe('Storage Statistics and Management', () => {
    it('should get storage statistics', async () => {
      try {
        const stats = await photoStorageService.getStorageStats();
        
        expect(stats.totalPhotos).toBeGreaterThanOrEqual(0);
        expect(stats.totalSize).toBeGreaterThanOrEqual(0);
        expect(stats.averageSize).toBeGreaterThanOrEqual(0);
        expect(stats.costEstimate).toBeGreaterThanOrEqual(0);

        console.log('✅ Storage Statistics:');
        console.log(`   Total Photos: ${stats.totalPhotos}`);
        console.log(`   Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Average Size: ${(stats.averageSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Estimated Monthly Cost: $${stats.costEstimate.toFixed(2)}`);

      } catch (error) {
        console.error('❌ Failed to get storage stats:', error.message);
        throw error;
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet upload time requirements', async () => {
      const testPhoto = await sharp({
        create: {
          width: 2048,
          height: 1536,
          channels: 3,
          background: { r: 150, g: 100, b: 200 }
        }
      })
      .jpeg({ quality: 85 })
      .toBuffer();

      const metadata = {
        projectId: 'performance-test',
        capturedAt: new Date().toISOString(),
        complianceType: 'performance-benchmark',
        userId: 'benchmark-user'
      };

      const startTime = Date.now();
      const result = await photoStorageService.uploadPhoto(testPhoto, metadata);
      const uploadTime = Date.now() - startTime;

      expect(uploadTime).toBeLessThan(5000); // <5 seconds for 2-4MB photo

      console.log('✅ Performance Benchmark:');
      console.log(`   Photo Size: ${(testPhoto.length / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Upload Time: ${uploadTime}ms`);
      console.log(`   Throughput: ${((testPhoto.length / 1024 / 1024) / (uploadTime / 1000)).toFixed(2)}MB/s`);

      // Performance assertion
      if (uploadTime > 5000) {
        console.warn('⚠️  Upload time exceeded 5 seconds - may need optimization');
      }
    });
  });
});

// Helper function to check if MinIO is running
async function checkMinIOStatus(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:9000/minio/health/live');
    return response.ok || response.status === 403;
  } catch {
    return false;
  }
}

// Export for use in other tests
export { checkMinIOStatus };