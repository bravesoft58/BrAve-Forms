import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { StorageType } from '@prisma/client';

export interface ProcessedImage {
  buffer: Buffer;
  size: number;
  storageType: StorageType;
  s3Key?: string;
}

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly STORAGE_THRESHOLD = 100000; // 100KB

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      endpoint: this.configService.get('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
      forcePathStyle: true,
    });
    this.bucketName = this.configService.get('S3_BUCKET_NAME') || 'braveforms-photos';
  }

  async compressImage(buffer: Buffer, quality = 85): Promise<Buffer> {
    return sharp(buffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  async uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);
    return key;
  }

  async processAndStorePhoto(
    buffer: Buffer,
    orgId: string,
    photoId: string
  ): Promise<ProcessedImage> {
    const compressedBuffer = await this.compressImage(buffer);
    const size = compressedBuffer.length;

    if (size < this.STORAGE_THRESHOLD) {
      return {
        buffer: compressedBuffer,
        size,
        storageType: StorageType.POSTGRESQL,
      };
    }

    const s3Key = `photos/${orgId}/${photoId}.jpg`;
    await this.uploadToS3(compressedBuffer, s3Key, 'image/jpeg');

    return {
      buffer: compressedBuffer,
      size,
      storageType: StorageType.S3,
      s3Key,
    };
  }
}
