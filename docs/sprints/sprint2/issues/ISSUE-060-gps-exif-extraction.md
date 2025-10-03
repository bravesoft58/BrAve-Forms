# ISSUE-060: GPS EXIF Extraction Service

**Sprint:** Sprint 2 | **Phase:** 2 - Photo Documentation | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-059 (upload working)

## What You'll Do

Integrate exif-parser library to extract latitude, longitude, timestamp, and device info from uploaded photos. Validate GPS coordinates exist and store in photos table.

## Step-by-Step Instructions

### Step 1: Install EXIF Parser (10 min)

```bash
cd apps/backend
pnpm add exif-parser
pnpm add -D @types/exif-parser
```

### Step 2: Create EXIF Extraction Service (60 min)

Create `apps/backend/src/modules/photos/services/exif-extraction.service.ts`:

```typescript
import * as exifParser from 'exif-parser';

@Injectable()
export class ExifExtractionService {
  extractGPS(buffer: Buffer): GPSData | null {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();

      if (!result.tags || !result.tags.GPSLatitude) {
        return null;
      }

      return {
        latitude: result.tags.GPSLatitude,
        longitude: result.tags.GPSLongitude,
        altitude: result.tags.GPSAltitude || null,
        timestamp: result.tags.DateTimeOriginal
          ? new Date(result.tags.DateTimeOriginal * 1000)
          : null,
        deviceModel: result.tags.Model || null,
      };
    } catch (error) {
      return null; // Photo doesn't have EXIF data
    }
  }
}

interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: Date | null;
  deviceModel: string | null;
}
```

### Step 3: Integrate with Upload Service (30 min)

Update `photo-upload.service.ts`:

```typescript
async upload(file: FileUpload, orgId: string, userId: string): Promise<Photo> {
  // ... existing code ...

  // Extract GPS EXIF data
  const gpsData = this.exifExtractionService.extractGPS(buffer);

  return this.prisma.photo.create({
    data: {
      orgId,
      filename,
      mimeType: mimetype,
      sizeBytes,
      storageType,
      s3Key,
      bytea,
      // GPS metadata
      latitude: gpsData?.latitude,
      longitude: gpsData?.longitude,
      altitude: gpsData?.altitude,
      timestamp: gpsData?.timestamp,
      deviceModel: gpsData?.deviceModel,
      createdBy: userId,
    },
  });
}
```

### Step 4: Test with Sample Photos (20 min)

Upload test photos with GPS EXIF data and verify extraction:

```graphql
mutation UploadPhotoWithGPS {
  uploadPhoto(file: <photo_with_gps.jpg>) {
    id
    filename
    latitude
    longitude
    timestamp
    deviceModel
  }
}
```

## Files to Create

- `exif-extraction.service.ts`
- `exif-extraction.spec.ts` (unit tests)

## Verification Checklist

- [ ] EXIF parser integrated
- [ ] GPS data extracted from photos
- [ ] Timestamp and device model extracted
- [ ] Null handling for photos without EXIF

## Time Estimate: 2 hours

## Next Issue

**ISSUE-061:** Hybrid Storage Strategy (4h)

## Status: NOT STARTED

**Evidence:** No completion report found

**Reason:** This issue has not been implemented yet

**Expected:** Phase 2 - Photo Documentation
