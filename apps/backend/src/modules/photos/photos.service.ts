import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { StorageType } from '@prisma/client';
import { ExifService } from './exif.service';
import { StorageService } from './storage.service';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exifService: ExifService,
    private readonly storageService: StorageService
  ) {}

  async uploadPhoto(
    imageBuffer: Buffer,
    orgId: string,
    inspectionId: string,
    uploadedBy: string,
    caption?: string
  ) {
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const exifData = this.exifService.extractExifData(imageBuffer);
    const fullExif = this.exifService.extractFullExifMetadata(imageBuffer);

    const processed = await this.storageService.processAndStorePhoto(
      imageBuffer,
      orgId,
      photoId
    );

    return this.prisma.photo.create({
      data: {
        orgId,
        inspectionId,
        fileSize: processed.size,
        mimeType: 'image/jpeg',
        uploadedBy,
        takenAt: exifData.takenAt || new Date(),
        caption,
        latitude: exifData.latitude,
        longitude: exifData.longitude,
        altitude: exifData.altitude,
        deviceModel: exifData.deviceModel,
        deviceMake: exifData.deviceMake,
        exifData: fullExif,
        storageType: processed.storageType,
        s3Key: processed.s3Key,
        imageData: processed.storageType === StorageType.POSTGRESQL ? processed.buffer : null,
      },
    });
  }

  async create(data: {
    orgId: string;
    inspectionId: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    takenAt: Date;
    s3Key?: string;
    imageData?: Buffer;
    caption?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    deviceModel?: string;
    deviceMake?: string;
    exifData?: any;
  }) {
    const storageType = data.fileSize < 100000 ? StorageType.POSTGRESQL : StorageType.S3;

    return this.prisma.photo.create({
      data: {
        ...data,
        storageType,
      },
    });
  }

  async getPhotos(inspectionId: string, orgId: string) {
    return this.prisma.photo.findMany({
      where: {
        inspectionId,
        orgId,
      },
      orderBy: {
        takenAt: 'asc',
      },
    });
  }

  async getPhoto(id: string, orgId: string) {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return photo;
  }

  async getPhotosByProject(
    projectId: string,
    orgId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      hasGps?: boolean;
      take?: number;
      skip?: number;
    }
  ) {
    const where: any = { orgId };

    if (filters?.startDate || filters?.endDate) {
      where.takenAt = {};
      if (filters.startDate) where.takenAt.gte = filters.startDate;
      if (filters.endDate) where.takenAt.lte = filters.endDate;
    }

    if (filters?.hasGps) {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    where.inspection = {
      projectId,
    };

    return this.prisma.photo.findMany({
      where,
      orderBy: { takenAt: 'desc' },
      take: filters?.take,
      skip: filters?.skip,
    });
  }

  async deletePhoto(id: string, orgId: string) {
    const photo = await this.getPhoto(id, orgId);

    await this.prisma.photo.delete({
      where: {
        id: photo.id,
      },
    });
  }

  /**
   * Upload a photo from base64 data (for form submissions)
   * Does not require an inspection - can be standalone or associated with a submission
   */
  async uploadPhotoFromBase64(
    imageBuffer: Buffer,
    orgId: string,
    uploadedBy: string,
    metadata?: {
      projectId?: string;
      submissionId?: string;
      fieldName?: string;
      caption?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<{
    id: string;
    s3Key?: string;
    thumbnailKey?: string;
    fileSize: number;
    mimeType: string;
    latitude?: number;
    longitude?: number;
    takenAt: Date;
  }> {
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Extract EXIF data from image
    const exifData = this.exifService.extractExifData(imageBuffer);
    const fullExif = this.exifService.extractFullExifMetadata(imageBuffer);

    // Use GPS from EXIF if available, otherwise use provided GPS
    const latitude = exifData.latitude ?? metadata?.latitude;
    const longitude = exifData.longitude ?? metadata?.longitude;

    // Process and store photo
    const processed = await this.storageService.processAndStorePhoto(
      imageBuffer,
      orgId,
      photoId
    );

    // Generate thumbnail key based on main s3Key
    const thumbnailKey = processed.s3Key
      ? processed.s3Key.replace(/(\.[^.]+)$/, '-thumb$1')
      : undefined;

    // Create photo record
    const photo = await this.prisma.photo.create({
      data: {
        orgId,
        fileSize: processed.size,
        mimeType: 'image/jpeg',
        uploadedBy,
        takenAt: exifData.takenAt || new Date(),
        caption: metadata?.caption,
        latitude,
        longitude,
        altitude: exifData.altitude,
        deviceModel: exifData.deviceModel,
        deviceMake: exifData.deviceMake,
        exifData: fullExif,
        storageType: processed.storageType,
        s3Key: processed.s3Key,
        thumbnailKey,
        imageData: processed.storageType === StorageType.POSTGRESQL ? processed.buffer : null,
        // Optional associations
        submissionId: metadata?.submissionId,
        fieldName: metadata?.fieldName,
      },
    });

    return {
      id: photo.id,
      s3Key: photo.s3Key || undefined,
      thumbnailKey: photo.thumbnailKey || undefined,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      latitude: photo.latitude || undefined,
      longitude: photo.longitude || undefined,
      takenAt: photo.takenAt,
    };
  }
}
