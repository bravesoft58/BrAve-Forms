import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    const processed = await this.storageService.processAndStorePhoto(imageBuffer, orgId, photoId);

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

  /**
   * Get photos by project with comprehensive filtering options
   *
   * GPS Radius Filtering Strategy:
   * 1. Apply boundary box pre-filter at database level (reduces candidate set)
   * 2. Apply precise Haversine formula on reduced result set
   * 3. Over-fetch by GPS_OVERFETCH_BUFFER to handle edge cases near radius boundary
   *
   * Performance: O(n) Haversine calculations on pre-filtered set vs entire dataset
   */
  async getPhotosByProject(
    projectId: string,
    orgId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      hasGps?: boolean;
      take?: number;
      skip?: number;
      search?: string;
      userId?: string;
      formType?: string;
      weather?: string[];
      gpsLat?: number;
      gpsLng?: number;
      gpsRadiusKm?: number;
    }
  ) {
    // Safety limit for GPS post-filtering - prevents memory issues on large datasets
    const GPS_OVERFETCH_BUFFER = 100;
    const MAX_GPS_FETCH = 1000;

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

    // Search filter: search in caption (already sanitized and length-limited in resolver)
    if (filters?.search) {
      where.caption = { contains: filters.search, mode: 'insensitive' };
    }

    // User filter: filter by uploadedBy
    if (filters?.userId) {
      where.uploadedBy = filters.userId;
    }

    // Form type filter: check Photo.formType directly first (fast, indexed)
    // Falls back to submission template lookup if Photo.formType is not set
    if (filters?.formType) {
      // First try direct Photo.formType (exact match, faster)
      const directMatchCount = await this.prisma.photo.count({
        where: {
          orgId,
          formType: filters.formType,
          inspection: { projectId },
        },
      });

      if (directMatchCount > 0) {
        // Use direct Photo.formType filter (exact match)
        where.formType = filters.formType;
      } else {
        // Fall back to submission template name lookup (substring match for compatibility)
        const matchingSubmissions = await this.prisma.formSubmission.findMany({
          where: {
            orgId,
            template: {
              name: { contains: filters.formType, mode: 'insensitive' },
            },
          },
          select: { id: true },
        });
        const submissionIds = matchingSubmissions.map((s) => s.id);
        if (submissionIds.length === 0) {
          return []; // No matching submissions, return empty
        }
        where.submissionId = { in: submissionIds };
      }
    }

    // Weather filter: filter by Photo.weather field (exact match from array)
    if (filters?.weather && filters.weather.length > 0) {
      where.weather = { in: filters.weather };
    }

    where.inspection = {
      projectId,
    };

    // GPS Boundary Box Pre-Filter (optimization)
    // Reduces candidate set before expensive Haversine calculations
    if (
      filters?.gpsLat !== undefined &&
      filters?.gpsLng !== undefined &&
      filters?.gpsRadiusKm !== undefined
    ) {
      const centerLat = filters.gpsLat;
      const centerLng = filters.gpsLng;
      const radiusKm = filters.gpsRadiusKm;

      // Calculate approximate bounding box (1 degree lat ~ 111.32km)
      const latDelta = radiusKm / 111.32;
      // Longitude degrees vary by latitude (narrower near poles)
      const lngDelta = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));

      // Apply boundary box filter at database level
      where.latitude = {
        gte: centerLat - latDelta,
        lte: centerLat + latDelta,
      };
      where.longitude = {
        gte: centerLng - lngDelta,
        lte: centerLng + lngDelta,
      };
    }

    // Calculate fetch limit with GPS over-fetch buffer
    // Over-fetch to handle edge cases near radius boundary after Haversine precision filter
    let fetchLimit: number | undefined;
    if (filters?.take) {
      if (filters.gpsLat !== undefined) {
        // GPS filter active: over-fetch for post-filtering, with safety cap
        fetchLimit = Math.min(filters.take + GPS_OVERFETCH_BUFFER, MAX_GPS_FETCH);
      } else {
        fetchLimit = filters.take;
      }
    }

    // Fetch photos with optimized WHERE clause
    let photos = await this.prisma.photo.findMany({
      where,
      orderBy: { takenAt: 'desc' },
      take: fetchLimit,
      skip: filters?.skip,
    });

    // GPS radius filter - precise Haversine formula on pre-filtered boundary box results
    if (
      filters?.gpsLat !== undefined &&
      filters?.gpsLng !== undefined &&
      filters?.gpsRadiusKm !== undefined
    ) {
      const centerLat = filters.gpsLat;
      const centerLng = filters.gpsLng;
      const radiusKm = filters.gpsRadiusKm;

      // Apply precise Haversine distance filter
      photos = photos.filter((photo) => {
        if (!photo.latitude || !photo.longitude) return false;

        const distance = this.calculateHaversineDistance(
          centerLat,
          centerLng,
          photo.latitude,
          photo.longitude
        );

        return distance <= radiusKm;
      });

      // Apply original take limit after GPS filtering
      if (filters.take && photos.length > filters.take) {
        photos = photos.slice(0, filters.take);
      }
    }

    return photos;
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * @returns Distance in kilometers
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
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
    const processed = await this.storageService.processAndStorePhoto(imageBuffer, orgId, photoId);

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

  // ISSUE-172: Photo Pairing for Before/After Comparison

  /**
   * Get all photo pairs for a project
   */
  async getPhotoPairsByProject(projectId: string, orgId: string) {
    return this.prisma.photoPair.findMany({
      where: {
        projectId,
        orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single photo pair by ID
   */
  async getPhotoPair(id: string, orgId: string) {
    const photoPair = await this.prisma.photoPair.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!photoPair) {
      throw new NotFoundException('Photo pair not found');
    }

    return photoPair;
  }

  /**
   * Create a new photo pair
   */
  async createPhotoPair(data: {
    orgId: string;
    projectId: string;
    beforePhotoId: string;
    afterPhotoId: string;
    description?: string;
    createdBy: string;
  }) {
    return this.prisma.photoPair.create({
      data: {
        orgId: data.orgId,
        projectId: data.projectId,
        beforePhotoId: data.beforePhotoId,
        afterPhotoId: data.afterPhotoId,
        description: data.description,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Delete a photo pair
   */
  async deletePhotoPair(id: string, orgId: string) {
    const photoPair = await this.getPhotoPair(id, orgId);

    await this.prisma.photoPair.delete({
      where: {
        id: photoPair.id,
      },
    });
  }
}
