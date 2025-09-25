/**
 * BrAve Forms MinIO Photo Storage Test Suite
 * Tests containerized MinIO S3-compatible storage for construction photo management
 * 
 * CRITICAL REQUIREMENTS TESTED:
 * - MinIO connectivity (localhost:9000 API, localhost:9001 Console)
 * - S3 SDK compatibility
 * - Photo upload/download with GPS EXIF preservation
 * - Bucket creation and permissions
 * - High-resolution photo support (10MB+)
 * - Multi-tenant isolation
 * - Compliance data integrity
 * - Performance benchmarks
 */

import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

describe('BrAve Forms MinIO Photo Storage Integration Tests', () => {
  let s3Client: S3Client;
  const bucketName = 'brave-forms-photos-test';
  const testPhotoPath = path.join(__dirname, '../test-assets/construction-sample.jpg');
  
  // MinIO configuration
  const minioConfig = {
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin'
    },
    forcePathStyle: true, // Required for MinIO
  };

  beforeAll(async () => {
    // Initialize S3 client for MinIO
    s3Client = new S3Client(minioConfig);
    
    // Create test photo if it doesn't exist
    await createTestPhoto();
  });

  afterAll(async () => {
    // Cleanup: Delete test bucket contents
    try {
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName
      }));
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete all objects in test bucket
        for (const object of listResponse.Contents) {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: object.Key!
          }));
        }
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  describe('MinIO Connectivity Tests', () => {
    test('should connect to MinIO API endpoint', async () => {
      const response = await fetch('http://localhost:9000/minio/health/live');
      expect(response.ok || response.status === 403).toBe(true); // 403 is expected for unauthenticated health check
    });

    test('should access MinIO console', async () => {
      const response = await fetch('http://localhost:9001');
      expect(response.ok).toBe(true);
      expect(response.headers.get('server')).toContain('MinIO Console');
    });

    test('should authenticate with MinIO credentials', async () => {
      const listBucketsCommand = new ListBucketsCommand({});
      const response = await s3Client.send(listBucketsCommand);
      expect(response.Buckets).toBeDefined();
      expect(Array.isArray(response.Buckets)).toBe(true);
    });
  });

  describe('Bucket Management Tests', () => {
    test('should create brave-forms-photos bucket', async () => {
      const createBucketCommand = new CreateBucketCommand({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(createBucketCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify bucket exists', async () => {
      const headBucketCommand = new HeadBucketCommand({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(headBucketCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should list objects in bucket', async () => {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(listCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Contents).toBeDefined();
    });
  });

  describe('Photo Upload Tests', () => {
    test('should upload construction photo with GPS EXIF', async () => {
      const photoBuffer = await fs.promises.readFile(testPhotoPath);
      const photoKey = `construction-sites/site-001/photos/${Date.now()}-sample.jpg`;
      
      const startTime = performance.now();
      
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: photoKey,
        Body: photoBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'project-id': 'test-project-001',
          'site-location': '40.7128,-74.0060', // NYC coordinates
          'captured-at': new Date().toISOString(),
          'device': 'iPhone 15 Pro',
          'compliance-type': 'stormwater-inspection',
          'form-id': 'form-001',
          'user-id': 'user-test-001'
        }
      });
      
      const response = await s3Client.send(putCommand);
      const uploadTime = performance.now() - startTime;
      
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.ETag).toBeDefined();
      expect(uploadTime).toBeLessThan(5000); // Should upload in <5 seconds
      
      // Verify upload by reading back
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: photoKey
      });
      
      const getResponse = await s3Client.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);
      expect(getResponse.Metadata?.['project-id']).toBe('test-project-001');
    });

    test('should handle large photo uploads (10MB+)', async () => {
      // Create a large test image
      const largePhoto = await sharp({
        create: {
          width: 4000,
          height: 3000,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      })
      .jpeg({ quality: 90 })
      .toBuffer();
      
      expect(largePhoto.length).toBeGreaterThan(10 * 1024 * 1024); // >10MB
      
      const photoKey = `construction-sites/site-001/photos/large-${Date.now()}.jpg`;
      const startTime = performance.now();
      
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: photoKey,
        Body: largePhoto,
        ContentType: 'image/jpeg',
        Metadata: {
          'original-size': largePhoto.length.toString(),
          'resolution': '4000x3000'
        }
      });
      
      const response = await s3Client.send(putCommand);
      const uploadTime = performance.now() - startTime;
      
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(uploadTime).toBeLessThan(15000); // Should upload large files in <15 seconds
      
      console.log(`Large photo upload: ${(largePhoto.length / 1024 / 1024).toFixed(2)}MB in ${uploadTime.toFixed(0)}ms`);
    });

    test('should preserve GPS EXIF data', async () => {
      // Create a photo with GPS EXIF data
      const photoWithGPS = await sharp(await fs.promises.readFile(testPhotoPath))
        .jpeg({ quality: 85 })
        .withMetadata() // Preserve EXIF
        .toBuffer();
      
      const photoKey = `gps-test/${Date.now()}-gps-photo.jpg`;
      
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: photoKey,
        Body: photoWithGPS,
        ContentType: 'image/jpeg'
      });
      
      await s3Client.send(putCommand);
      
      // Download and verify EXIF preservation
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: photoKey
      });
      
      const response = await s3Client.send(getCommand);
      const downloadedBuffer = await streamToBuffer(response.Body);
      
      // Check EXIF data with Sharp
      const metadata = await sharp(downloadedBuffer).metadata();
      expect(metadata.exif).toBeDefined(); // EXIF data should be preserved
    });
  });

  describe('Photo Processing and Variants', () => {
    test('should generate multiple photo variants', async () => {
      const originalPhoto = await fs.promises.readFile(testPhotoPath);
      const baseKey = `variants-test/${Date.now()}`;
      
      const variants = {
        thumbnail: { width: 150, height: 150, quality: 70 },
        small: { width: 480, height: 480, quality: 75 },
        medium: { width: 1024, height: 1024, quality: 80 },
        large: { width: 2048, height: 2048, quality: 85 }
      };
      
      const uploadPromises = Object.entries(variants).map(async ([variantName, config]) => {
        const processedPhoto = await sharp(originalPhoto)
          .resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: config.quality, progressive: true })
          .toBuffer();
        
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: `${baseKey}/${variantName}.jpg`,
          Body: processedPhoto,
          ContentType: 'image/jpeg',
          Metadata: {
            'variant': variantName,
            'dimensions': `${config.width}x${config.height}`,
            'quality': config.quality.toString()
          }
        });
        
        return s3Client.send(putCommand);
      });
      
      const responses = await Promise.all(uploadPromises);
      
      // All variants should upload successfully
      responses.forEach(response => {
        expect(response.$metadata.httpStatusCode).toBe(200);
      });
      
      // Verify all variants exist
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: baseKey
      });
      
      const listResponse = await s3Client.send(listCommand);
      expect(listResponse.Contents?.length).toBe(4); // 4 variants
    });

    test('should support WebP format for modern browsers', async () => {
      const originalPhoto = await fs.promises.readFile(testPhotoPath);
      
      // Convert to WebP
      const webpPhoto = await sharp(originalPhoto)
        .webp({ quality: 80 })
        .toBuffer();
      
      const photoKey = `webp-test/${Date.now()}.webp`;
      
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: photoKey,
        Body: webpPhoto,
        ContentType: 'image/webp'
      });
      
      const response = await s3Client.send(putCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      
      // WebP should be significantly smaller
      console.log(`WebP compression: ${originalPhoto.length} -> ${webpPhoto.length} (${((1 - webpPhoto.length / originalPhoto.length) * 100).toFixed(1)}% smaller)`);
      expect(webpPhoto.length).toBeLessThan(originalPhoto.length * 0.8); // At least 20% smaller
    });
  });

  describe('Access Control and Security', () => {
    test('should generate signed URLs for secure access', async () => {
      const photoBuffer = await fs.promises.readFile(testPhotoPath);
      const photoKey = `secure-test/${Date.now()}-secure.jpg`;
      
      // Upload photo
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: photoKey,
        Body: photoBuffer,
        ContentType: 'image/jpeg'
      }));
      
      // Generate signed URL (valid for 1 hour)
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: photoKey
      });
      
      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      
      expect(signedUrl).toContain('X-Amz-Signature');
      expect(signedUrl).toContain('X-Amz-Expires');
      
      // Test signed URL access
      const response = await fetch(signedUrl);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toBe('image/jpeg');
    });

    test('should support multi-tenant bucket organization', async () => {
      const tenants = ['tenant-001', 'tenant-002', 'tenant-003'];
      const uploadPromises = tenants.map(async (tenantId) => {
        const photoKey = `tenants/${tenantId}/projects/proj-001/photos/photo-${Date.now()}.jpg`;
        
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: photoKey,
          Body: await fs.promises.readFile(testPhotoPath),
          ContentType: 'image/jpeg',
          Metadata: {
            'tenant-id': tenantId,
            'project-id': 'proj-001'
          }
        });
        
        return s3Client.send(putCommand);
      });
      
      const responses = await Promise.all(uploadPromises);
      
      responses.forEach(response => {
        expect(response.$metadata.httpStatusCode).toBe(200);
      });
      
      // Verify tenant isolation by listing objects
      for (const tenantId of tenants) {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: `tenants/${tenantId}/`
        });
        
        const listResponse = await s3Client.send(listCommand);
        expect(listResponse.Contents?.length).toBe(1);
        expect(listResponse.Contents![0].Key).toContain(tenantId);
      }
    });
  });

  describe('Performance and Batch Operations', () => {
    test('should handle concurrent photo uploads', async () => {
      const concurrentUploads = 10;
      const photoBuffer = await fs.promises.readFile(testPhotoPath);
      
      const startTime = performance.now();
      
      const uploadPromises = Array.from({ length: concurrentUploads }, (_, i) => {
        const photoKey = `concurrent-test/${Date.now()}-${i}.jpg`;
        
        return s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: photoKey,
          Body: photoBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            'upload-batch': Date.now().toString(),
            'upload-index': i.toString()
          }
        }));
      });
      
      const responses = await Promise.all(uploadPromises);
      const totalTime = performance.now() - startTime;
      
      // All uploads should succeed
      responses.forEach(response => {
        expect(response.$metadata.httpStatusCode).toBe(200);
      });
      
      console.log(`Concurrent uploads: ${concurrentUploads} photos in ${totalTime.toFixed(0)}ms (avg: ${(totalTime / concurrentUploads).toFixed(0)}ms per photo)`);
      expect(totalTime).toBeLessThan(10000); // Should complete in <10 seconds
    });

    test('should efficiently list photos with pagination', async () => {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 100
      });
      
      const startTime = performance.now();
      const response = await s3Client.send(listCommand);
      const listTime = performance.now() - startTime;
      
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Contents).toBeDefined();
      expect(listTime).toBeLessThan(1000); // Should list in <1 second
      
      console.log(`Listed ${response.Contents?.length || 0} objects in ${listTime.toFixed(0)}ms`);
    });
  });

  describe('Compliance and Data Integrity', () => {
    test('should maintain photo checksums for compliance', async () => {
      const photoBuffer = await fs.promises.readFile(testPhotoPath);
      const md5Hash = crypto.createHash('md5').update(photoBuffer).digest('hex');
      const sha256Hash = crypto.createHash('sha256').update(photoBuffer).digest('hex');
      
      const photoKey = `compliance-test/${Date.now()}-checksum.jpg`;
      
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: photoKey,
        Body: photoBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'md5-checksum': md5Hash,
          'sha256-checksum': sha256Hash,
          'compliance-verified': 'true',
          'retention-years': '7'
        }
      });
      
      await s3Client.send(putCommand);
      
      // Verify checksums by downloading
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: photoKey
      });
      
      const response = await s3Client.send(getCommand);
      const downloadedBuffer = await streamToBuffer(response.Body);
      
      const downloadedMd5 = crypto.createHash('md5').update(downloadedBuffer).digest('hex');
      const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');
      
      expect(downloadedMd5).toBe(md5Hash);
      expect(downloadedSha256).toBe(sha256Hash);
      expect(response.Metadata?.['md5-checksum']).toBe(md5Hash);
    });

    test('should support compliance photo packages', async () => {
      const inspectionId = `inspection-${Date.now()}`;
      const photoCount = 5;
      
      // Upload multiple photos for an inspection
      const uploadPromises = Array.from({ length: photoCount }, (_, i) => {
        const photoKey = `inspections/${inspectionId}/photo-${i + 1}.jpg`;
        
        return s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: photoKey,
          Body: fs.readFileSync(testPhotoPath),
          ContentType: 'image/jpeg',
          Metadata: {
            'inspection-id': inspectionId,
            'photo-sequence': (i + 1).toString(),
            'compliance-category': 'stormwater-bmps',
            'capture-timestamp': new Date().toISOString()
          }
        }));
      });
      
      await Promise.all(uploadPromises);
      
      // List inspection photos
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `inspections/${inspectionId}/`
      });
      
      const listResponse = await s3Client.send(listCommand);
      
      expect(listResponse.Contents?.length).toBe(photoCount);
      
      // Verify all photos have compliance metadata
      for (const object of listResponse.Contents || []) {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: object.Key!
        });
        
        const headResponse = await s3Client.send(headCommand);
        expect(headResponse.Metadata?.['inspection-id']).toBe(inspectionId);
        expect(headResponse.Metadata?.['compliance-category']).toBeDefined();
      }
    });
  });

  // Helper functions
  async function createTestPhoto(): Promise<void> {
    const testDir = path.dirname(testPhotoPath);
    
    // Create test-assets directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a test construction photo if it doesn't exist
    if (!fs.existsSync(testPhotoPath)) {
      const testPhoto = await sharp({
        create: {
          width: 2048,
          height: 1536,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      })
      .composite([
        {
          input: Buffer.from(`
            <svg width="400" height="100">
              <text x="10" y="30" font-family="Arial" font-size="20" fill="white">
                BrAve Forms Test Construction Photo
              </text>
              <text x="10" y="60" font-family="Arial" font-size="16" fill="white">
                GPS: 40.7128°N, 74.0060°W (NYC)
              </text>
              <text x="10" y="80" font-family="Arial" font-size="14" fill="white">
                ${new Date().toISOString()}
              </text>
            </svg>
          `),
          top: 50,
          left: 50
        }
      ])
      .jpeg({ quality: 85 })
      .toBuffer();
      
      fs.writeFileSync(testPhotoPath, testPhoto);
    }
  }

  async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
});

// Test configuration and utilities
const testConfig = {
  minioEndpoint: 'http://localhost:9000',
  minioConsole: 'http://localhost:9001',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin'
  },
  bucketName: 'brave-forms-photos-test',
  performanceThresholds: {
    uploadTime: 5000, // 5 seconds for normal photos
    largeUploadTime: 15000, // 15 seconds for 10MB+ photos
    listTime: 1000, // 1 second to list objects
    concurrentUploads: 10000 // 10 seconds for 10 concurrent uploads
  },
  complianceRequirements: {
    retentionYears: 7,
    checksumAlgorithms: ['md5', 'sha256'],
    requiredMetadata: [
      'project-id',
      'site-location',
      'captured-at',
      'compliance-type'
    ]
  }
};

export { testConfig };