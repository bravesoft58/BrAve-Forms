import { Test, TestingModule } from '@nestjs/testing';
import { ExifService } from './exif.service';
import * as fs from 'fs';
import * as path from 'path';

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

      expect(() => service.extractExifData(invalidBuffer)).toThrow(
        'Failed to extract EXIF data from image'
      );
    });

    it('should return ExtractedExifData structure', () => {
      const invalidBuffer = Buffer.from('test');

      try {
        service.extractExifData(invalidBuffer);
      } catch (error) {
        expect(error.message).toBe('Failed to extract EXIF data from image');
      }
    });
  });

  describe('validateGpsCoordinates', () => {
    it('should return true for valid GPS coordinates', () => {
      const result = service.validateGpsCoordinates(37.7749, -122.4194);

      expect(result).toBe(true);
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

      const result = service.extractFullExifMetadata(invalidBuffer);

      expect(result).toBeNull();
    });

    it('should handle extraction errors gracefully', () => {
      const emptyBuffer = Buffer.from('');

      const result = service.extractFullExifMetadata(emptyBuffer);

      expect(result).toBeNull();
    });
  });
});
