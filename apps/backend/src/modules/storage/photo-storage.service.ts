/**
 * BrAve Forms Photo Storage Service
 * Handles construction photo storage with MinIO/S3 compatibility
 * Implements intelligent compression, EXIF preservation, and compliance requirements
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

export interface PhotoUploadResult {
  photoId: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  variants: PhotoVariant[];
  storageLocation: string;
  cdnUrl?: string;
  checksums: {
    md5: string;
    sha256: string;
  };
}

export interface PhotoVariant {
  name: string;
  size: number;
  dimensions: string;
  url: string;
}

export interface PhotoMetadata {
  projectId: string;
  siteLocation?: string;
  capturedAt: string;
  device?: string;
  complianceType: string;
  formId?: string;
  userId: string;
  inspectionId?: string;
}

@Injectable()
export class PhotoStorageService {
  private readonly logger = new Logger(PhotoStorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  // Photo processing configurations
  private readonly variants = {
    thumbnail: { width: 150, height: 150, quality: 70 },
    small: { width: 480, height: 480, quality: 75 },
    medium: { width: 1024, height: 1024, quality: 80 },
    large: { width: 2048, height: 2048, quality: 85 }
  };

  private readonly POSTGRES_THRESHOLD = 50 * 1024 * 1024; // 50MB
  private readonly THUMBNAIL_THRESHOLD = 100 * 1024; // 100KB

  constructor(private configService: ConfigService) {
    this.initializeS3Client();
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME', 'brave-forms-photos');
  }

  private initializeS3Client(): void {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('AWS credentials not configured');
      throw new Error('AWS credentials are required for photo storage');
    }

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      forcePathStyle: !!endpoint, // Required for MinIO
    });

    this.logger.log(`Initialized S3 client with endpoint: ${endpoint || 'AWS S3'}`);
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({
        Bucket: this.bucketName
      }));
      this.logger.log(`Bucket ${this.bucketName} exists`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Creating bucket: ${this.bucketName}`);
        await this.s3Client.send(new CreateBucketCommand({
          Bucket: this.bucketName
        }));
        this.logger.log(`Created bucket: ${this.bucketName}`);
      } else {
        this.logger.error('Error checking bucket existence:', error);
        throw error;
      }
    }
  }

  async uploadPhoto(
    photoBuffer: Buffer,
    metadata: PhotoMetadata,
    originalFilename?: string
  ): Promise<PhotoUploadResult> {
    const photoId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Ensure bucket exists
      await this.ensureBucketExists();

      // Validate and extract EXIF data
      const imageMetadata = await this.extractImageMetadata(photoBuffer);
      this.validateGPSData(imageMetadata.gps, metadata.projectId);

      // Optimize photo quality
      const optimizedPhoto = await this.optimizePhoto(photoBuffer, imageMetadata);
      const compressionRatio = ((photoBuffer.length - optimizedPhoto.length) / photoBuffer.length) * 100;

      // Generate variants
      const variants = await this.generateVariants(optimizedPhoto, photoId);

      // Upload original optimized photo
      const photoKey = this.generatePhotoKey(metadata, photoId, originalFilename);
      const uploadResult = await this.uploadToS3(
        optimizedPhoto,
        photoKey,
        metadata,
        photoId
      );

      // Calculate checksums
      const checksums = {
        md5: crypto.createHash('md5').update(optimizedPhoto).digest('hex'),
        sha256: crypto.createHash('sha256').update(optimizedPhoto).digest('hex')
      };

      const uploadTime = Date.now() - startTime;
      this.logger.log(
        `Photo uploaded: ${photoId} (${(optimizedPhoto.length / 1024 / 1024).toFixed(2)}MB) ` +
        `in ${uploadTime}ms, ${compressionRatio.toFixed(1)}% compression`
      );

      return {
        photoId,
        originalSize: photoBuffer.length,
        compressedSize: optimizedPhoto.length,
        compressionRatio,
        variants,
        storageLocation: photoKey,
        checksums
      };

    } catch (error) {
      this.logger.error(`Failed to upload photo: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async extractImageMetadata(photoBuffer: Buffer): Promise<any> {
    try {
      const metadata = await sharp(photoBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        exif: metadata.exif,
        gps: this.extractGPSFromEXIF(metadata.exif)
      };
    } catch (error) {
      this.logger.error('Failed to extract image metadata:', error);
      return {};
    }
  }

  private extractGPSFromEXIF(exifBuffer?: Buffer): { latitude?: number; longitude?: number } {
    if (!exifBuffer) return {};
    
    try {
      // This is a simplified GPS extraction - in production, use exif-reader library
      return {
        // latitude: extractedLat,
        // longitude: extractedLon
      };
    } catch (error) {
      this.logger.warn('Failed to extract GPS from EXIF:', error.message);
      return {};
    }
  }

  private validateGPSData(gps: any, projectId: string): void {
    if (!gps?.latitude || !gps?.longitude) {
      this.logger.warn(`Photo missing GPS data for project: ${projectId}`);
      return;
    }

    // Validate GPS coordinates are within reasonable bounds
    if (Math.abs(gps.latitude) > 90 || Math.abs(gps.longitude) > 180) {
      throw new Error('Invalid GPS coordinates detected');
    }

    // Additional validation for project boundaries could be added here
    this.logger.debug(`GPS validated: ${gps.latitude}, ${gps.longitude}`);
  }

  private async optimizePhoto(photoBuffer: Buffer, metadata: any): Promise<Buffer> {
    const quality = this.calculateOptimalQuality(photoBuffer.length, metadata);
    
    let pipeline = sharp(photoBuffer)
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
        chromaSubsampling: '4:2:0'
      })
      .withMetadata(); // Preserve EXIF data

    // Resize if image is too large
    if (metadata.width > 4096 || metadata.height > 4096) {
      pipeline = pipeline.resize(4096, 4096, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Auto-orient based on EXIF
    pipeline = pipeline.rotate();

    return await pipeline.toBuffer();
  }

  private calculateOptimalQuality(size: number, metadata: any): number {
    // Adjust quality based on image size and complexity
    if (size < 1024 * 1024) { // < 1MB
      return 90;
    } else if (size < 5 * 1024 * 1024) { // < 5MB
      return 85;
    } else if (size < 10 * 1024 * 1024) { // < 10MB
      return 80;
    } else {
      return 75;
    }
  }

  private async generateVariants(
    optimizedPhoto: Buffer,
    photoId: string
  ): Promise<PhotoVariant[]> {
    const variants: PhotoVariant[] = [];

    for (const [variantName, config] of Object.entries(this.variants)) {
      try {
        const variantBuffer = await sharp(optimizedPhoto)
          .resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ 
            quality: config.quality, 
            progressive: true 
          })
          .toBuffer();

        const variantKey = `variants/${photoId}/${variantName}.jpg`;
        
        await this.s3Client.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: variantKey,
          Body: variantBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            'photo-id': photoId,
            'variant': variantName,
            'dimensions': `${config.width}x${config.height}`,
            'quality': config.quality.toString()
          }
        }));

        const signedUrl = await this.generateSignedUrl(variantKey, 3600);

        variants.push({
          name: variantName,
          size: variantBuffer.length,
          dimensions: `${config.width}x${config.height}`,
          url: signedUrl
        });

      } catch (error) {
        this.logger.error(`Failed to generate variant ${variantName}:`, error);
        // Continue with other variants
      }
    }

    return variants;
  }

  private generatePhotoKey(
    metadata: PhotoMetadata,
    photoId: string,
    originalFilename?: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = originalFilename ? 
      originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_') : 
      `photo-${photoId}.jpg`;

    return `photos/${metadata.projectId}/${timestamp}/${photoId}/${filename}`;
  }

  private async uploadToS3(
    photoBuffer: Buffer,
    photoKey: string,
    metadata: PhotoMetadata,
    photoId: string
  ): Promise<any> {
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: photoKey,
      Body: photoBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        'photo-id': photoId,
        'project-id': metadata.projectId,
        'site-location': metadata.siteLocation || '',
        'captured-at': metadata.capturedAt,
        'device': metadata.device || '',
        'compliance-type': metadata.complianceType,
        'form-id': metadata.formId || '',
        'user-id': metadata.userId,
        'inspection-id': metadata.inspectionId || '',
        'upload-timestamp': new Date().toISOString()
      }
    });

    return await this.s3Client.send(putCommand);
  }

  async generateSignedUrl(photoKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: photoKey
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getPhoto(photoKey: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: photoKey
      });

      const response = await this.s3Client.send(command);
      return await this.streamToBuffer(response.Body);
    } catch (error) {
      this.logger.error(`Failed to retrieve photo ${photoKey}:`, error);
      throw error;
    }
  }

  async deletePhoto(photoKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: photoKey
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted photo: ${photoKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete photo ${photoKey}:`, error);
      throw error;
    }
  }

  async listPhotos(
    projectId: string,
    maxKeys: number = 100,
    continuationToken?: string
  ): Promise<{ photos: any[]; nextToken?: string }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `photos/${projectId}/`,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken
      });

      const response = await this.s3Client.send(command);

      const photos = response.Contents?.map(object => ({
        key: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag
      })) || [];

      return {
        photos,
        nextToken: response.NextContinuationToken
      };
    } catch (error) {
      this.logger.error(`Failed to list photos for project ${projectId}:`, error);
      throw error;
    }
  }

  async createCompliancePackage(inspectionId: string): Promise<{
    photos: any[];
    packageSize: number;
    downloadUrl?: string;
  }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `photos/`,
        MaxKeys: 1000
      });

      const response = await this.s3Client.send(command);
      
      // Filter photos by inspection ID from metadata
      const inspectionPhotos = [];
      let totalSize = 0;

      for (const object of response.Contents || []) {
        const headCommand = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: object.Key!
        });

        const headResponse = await this.s3Client.send(headCommand);
        
        if (headResponse.Metadata?.['inspection-id'] === inspectionId) {
          const signedUrl = await this.generateSignedUrl(object.Key!, 86400); // 24 hours
          
          inspectionPhotos.push({
            key: object.Key,
            url: signedUrl,
            size: object.Size,
            metadata: headResponse.Metadata
          });

          totalSize += object.Size || 0;
        }
      }

      this.logger.log(
        `Created compliance package for inspection ${inspectionId}: ` +
        `${inspectionPhotos.length} photos, ${(totalSize / 1024 / 1024).toFixed(2)}MB`
      );

      return {
        photos: inspectionPhotos,
        packageSize: totalSize
      };
    } catch (error) {
      this.logger.error(`Failed to create compliance package for ${inspectionId}:`, error);
      throw error;
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async getStorageStats(): Promise<{
    totalPhotos: number;
    totalSize: number;
    averageSize: number;
    costEstimate: number;
  }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 10000 // Adjust based on expected volume
      });

      const response = await this.s3Client.send(command);
      const totalPhotos = response.Contents?.length || 0;
      const totalSize = response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
      const averageSize = totalPhotos > 0 ? totalSize / totalPhotos : 0;
      
      // Rough cost estimate for S3/MinIO (per GB per month)
      const costPerGB = 0.023; // AWS S3 Standard pricing
      const costEstimate = (totalSize / 1024 / 1024 / 1024) * costPerGB;

      return {
        totalPhotos,
        totalSize,
        averageSize,
        costEstimate
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats:', error);
      throw error;
    }
  }
}