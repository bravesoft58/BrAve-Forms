import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExifParser from 'exif-parser';

export interface ExtractedExifData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  takenAt: Date | null;
  deviceMake: string | null;
  deviceModel: string | null;
}

@Injectable()
export class ExifService {
  extractExifData(imageBuffer: Buffer): ExtractedExifData {
    try {
      const parser = ExifParser.create(imageBuffer);
      const result = parser.parse();

      const takenAt = result.tags.DateTimeOriginal
        ? new Date(result.tags.DateTimeOriginal * 1000)
        : null;

      let latitude: number | null = null;
      let longitude: number | null = null;
      let altitude: number | null = null;

      if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
        latitude = result.tags.GPSLatitude;
        longitude = result.tags.GPSLongitude;
        altitude = result.tags.GPSAltitude || null;
      }

      return {
        latitude,
        longitude,
        altitude,
        takenAt,
        deviceMake: result.tags.Make || null,
        deviceModel: result.tags.Model || null,
      };
    } catch (error) {
      throw new BadRequestException('Failed to extract EXIF data from image');
    }
  }

  validateGpsCoordinates(
    latitude: number | null,
    longitude: number | null
  ): boolean {
    if (latitude === null || longitude === null) {
      return false;
    }

    if (latitude < -90 || latitude > 90) {
      return false;
    }

    if (longitude < -180 || longitude > 180) {
      return false;
    }

    return true;
  }

  extractFullExifMetadata(imageBuffer: Buffer): any {
    try {
      const parser = ExifParser.create(imageBuffer);
      const result = parser.parse();

      if (!result.tags || Object.keys(result.tags).length === 0) {
        return null;
      }

      return {
        ...result.tags,
        imageWidth: result.imageSize?.width || null,
        imageHeight: result.imageSize?.height || null,
      };
    } catch (error) {
      return null;
    }
  }
}
