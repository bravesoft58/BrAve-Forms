import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { StorageType } from '@prisma/client';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

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

  async deletePhoto(id: string, orgId: string) {
    const photo = await this.getPhoto(id, orgId);

    await this.prisma.photo.delete({
      where: {
        id: photo.id,
      },
    });
  }
}
