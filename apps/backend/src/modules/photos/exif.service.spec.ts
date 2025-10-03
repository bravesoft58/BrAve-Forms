import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExifService } from './exif.service';
import * as ExifParser from 'exif-parser';

describe('ExifService', () => {
  let service: ExifService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExifService],
    }).compile();

    service = module.get<ExifService>(ExifService);
  });

  describe('extractExifData', () => {
    it('should throw BadRequestException for invalid image buffer', () => {
      const invalidBuffer = Buffer.from('not-a-valid-jpeg-image-buffer');

      expect(() => service.extractExifData(invalidBuffer)).toThrow(BadRequestException);
      expect(() => service.extractExifData(invalidBuffer)).toThrow(
        'Failed to extract EXIF data from image'
      );
    });

    it('should extract GPS coordinates when present', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            GPSLatitude: 37.7749,
            GPSLongitude: -122.4194,
            GPSAltitude: 100,
            DateTimeOriginal: 1696348800,
            Make: 'Apple',
            Model: 'iPhone 14 Pro',
          },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractExifData(Buffer.from('test'));

      expect(result.latitude).toBe(37.7749);
      expect(result.longitude).toBe(-122.4194);
      expect(result.altitude).toBe(100);
      expect(result.takenAt).toBeInstanceOf(Date);
      expect(result.deviceMake).toBe('Apple');
      expect(result.deviceModel).toBe('iPhone 14 Pro');
    });

    it('should handle missing GPS coordinates', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            DateTimeOriginal: 1696348800,
            Make: 'Canon',
            Model: 'EOS R5',
          },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractExifData(Buffer.from('test'));

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
      expect(result.altitude).toBeNull();
      expect(result.takenAt).toBeInstanceOf(Date);
      expect(result.deviceMake).toBe('Canon');
      expect(result.deviceModel).toBe('EOS R5');
    });

    it('should handle missing DateTimeOriginal', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            GPSLatitude: 37.7749,
            GPSLongitude: -122.4194,
          },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractExifData(Buffer.from('test'));

      expect(result.takenAt).toBeNull();
      expect(result.latitude).toBe(37.7749);
      expect(result.longitude).toBe(-122.4194);
    });

    it('should handle missing device info', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            GPSLatitude: 37.7749,
            GPSLongitude: -122.4194,
            DateTimeOriginal: 1696348800,
          },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractExifData(Buffer.from('test'));

      expect(result.deviceMake).toBeNull();
      expect(result.deviceModel).toBeNull();
    });

    it('should handle GPSAltitude missing when GPS present', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            GPSLatitude: 37.7749,
            GPSLongitude: -122.4194,
            DateTimeOriginal: 1696348800,
          },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractExifData(Buffer.from('test'));

      expect(result.altitude).toBeNull();
      expect(result.latitude).toBe(37.7749);
      expect(result.longitude).toBe(-122.4194);
    });
  });

  describe('validateGpsCoordinates', () => {
    it('should return true for valid GPS coordinates', () => {
      const result = service.validateGpsCoordinates(37.7749, -122.4194);

      expect(result).toBe(true);
    });

    it('should return true for edge case coordinates', () => {
      expect(service.validateGpsCoordinates(90, 180)).toBe(true);
      expect(service.validateGpsCoordinates(-90, -180)).toBe(true);
      expect(service.validateGpsCoordinates(0, 0)).toBe(true);
    });

    it('should return false for latitude out of range', () => {
      expect(service.validateGpsCoordinates(91, -122.4194)).toBe(false);
      expect(service.validateGpsCoordinates(-91, -122.4194)).toBe(false);
    });

    it('should return false for longitude out of range', () => {
      expect(service.validateGpsCoordinates(37.7749, 181)).toBe(false);
      expect(service.validateGpsCoordinates(37.7749, -181)).toBe(false);
    });

    it('should return false for null coordinates', () => {
      expect(service.validateGpsCoordinates(null, -122.4194)).toBe(false);
      expect(service.validateGpsCoordinates(37.7749, null)).toBe(false);
      expect(service.validateGpsCoordinates(null, null)).toBe(false);
    });
  });

  describe('extractFullExifMetadata', () => {
    it('should return null for invalid image buffer', () => {
      const invalidBuffer = Buffer.from('not-a-valid-image');

      const mockParser = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Invalid EXIF data');
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractFullExifMetadata(invalidBuffer);

      expect(result).toBeNull();
    });

    it('should handle extraction errors gracefully', () => {
      const emptyBuffer = Buffer.from('');

      const mockParser = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Cannot parse empty buffer');
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractFullExifMetadata(emptyBuffer);

      expect(result).toBeNull();
    });

    it('should return full EXIF metadata with image dimensions', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            Make: 'Apple',
            Model: 'iPhone 14 Pro',
            FNumber: 1.8,
            ExposureTime: 0.0025,
          },
          imageSize: {
            width: 4032,
            height: 3024,
          },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractFullExifMetadata(Buffer.from('test'));

      expect(result.Make).toBe('Apple');
      expect(result.Model).toBe('iPhone 14 Pro');
      expect(result.imageWidth).toBe(4032);
      expect(result.imageHeight).toBe(3024);
    });

    it('should return null when tags are empty', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {},
          imageSize: { width: 1920, height: 1080 },
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractFullExifMetadata(Buffer.from('test'));

      expect(result).toBeNull();
    });

    it('should handle missing imageSize gracefully', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          tags: {
            Make: 'Canon',
            Model: 'EOS R5',
          },
          imageSize: null,
        }),
      };

      jest.spyOn(ExifParser, 'create').mockReturnValue(mockParser as any);

      const result = service.extractFullExifMetadata(Buffer.from('test'));

      expect(result.Make).toBe('Canon');
      expect(result.imageWidth).toBeNull();
      expect(result.imageHeight).toBeNull();
    });
  });
});
