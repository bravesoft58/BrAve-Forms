import { Injectable, Logger } from '@nestjs/common';
import { PhotoStorageService, PhotoUploadResult, PhotoMetadata } from './photo-storage.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private photoStorageService: PhotoStorageService) {}

  async uploadPhoto(
    photoBuffer: Buffer,
    metadata: PhotoMetadata,
    filename?: string
  ): Promise<PhotoUploadResult> {
    this.logger.log(`Uploading photo for project: ${metadata.projectId}`);
    return await this.photoStorageService.uploadPhoto(photoBuffer, metadata, filename);
  }

  async getPhoto(photoKey: string): Promise<Buffer> {
    return await this.photoStorageService.getPhoto(photoKey);
  }

  async generateSignedUrl(photoKey: string, expiresIn: number = 3600): Promise<string> {
    return await this.photoStorageService.generateSignedUrl(photoKey, expiresIn);
  }

  async createCompliancePackage(inspectionId: string) {
    return await this.photoStorageService.createCompliancePackage(inspectionId);
  }

  async getStorageStats() {
    return await this.photoStorageService.getStorageStats();
  }
}
