# ISSUE-059: Photo Upload GraphQL Resolver

**Sprint:** Sprint 2 | **Phase:** 2 - Photo Documentation | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** Sprint 1 MinIO deployment

## What You'll Do

Implement uploadPhoto mutation using graphql-upload, add multipart form-data support, create photos table schema in Prisma, and upload photos to MinIO with metadata stored in PostgreSQL.

## Step-by-Step Instructions

### Step 1: Create Photos Schema (30 min)

Add to `packages/database/schema.prisma`:

```prisma
model Photo {
  id          String   @id @default(uuid())
  orgId       String   @map("org_id")

  filename    String
  mimeType    String   @map("mime_type")
  sizeBytes   Int      @map("size_bytes")

  // Storage location
  storageType String   @map("storage_type") // "s3" or "postgres"
  s3Key       String?  @map("s3_key")
  bytea       Bytes?   // For small photos <100KB

  // GPS metadata
  latitude    Float?
  longitude   Float?
  altitude    Float?

  // EXIF metadata
  timestamp   DateTime?
  deviceModel String?  @map("device_model")

  createdAt   DateTime @default(now()) @map("created_at")
  createdBy   String   @map("created_by")

  @@index([orgId])
  @@map("photos")
}
```

### Step 2: Create Photo Upload Service (60 min)

Create `apps/backend/src/modules/photos/services/photo-upload.service.ts`:

```typescript
@Injectable()
export class PhotoUploadService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Client
  ) {}

  async upload(file: FileUpload, orgId: string, userId: string): Promise<Photo> {
    const { createReadStream, filename, mimetype } = await file;
    const stream = createReadStream();
    const chunks: Buffer[] = [];

    // Read file into buffer
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determine storage strategy
    const sizeBytes = buffer.length;
    const storageType = sizeBytes < 100 * 1024 ? 'postgres' : 's3'; // 100KB threshold

    let s3Key: string | null = null;
    let bytea: Buffer | null = null;

    if (storageType === 's3') {
      s3Key = `photos/${orgId}/${uuidv4()}_${filename}`;
      await this.uploadToS3(s3Key, buffer, mimetype);
    } else {
      bytea = buffer;
    }

    return this.prisma.photo.create({
      data: {
        orgId,
        filename,
        mimeType: mimetype,
        sizeBytes,
        storageType,
        s3Key,
        bytea,
        createdBy: userId,
      },
    });
  }

  private async uploadToS3(key: string, buffer: Buffer, mimetype: string) {
    // S3 upload logic
  }
}
```

### Step 3: Create Upload Mutation (30 min)

Create `apps/backend/src/modules/photos/resolvers/photos.resolver.ts`:

```typescript
@Resolver()
@UseGuards(ClerkAuthGuard)
export class PhotosResolver {
  constructor(private photoUploadService: PhotoUploadService) {}

  @Mutation(() => Photo)
  async uploadPhoto(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @CurrentUser() user: ClerkUser
  ): Promise<Photo> {
    return this.photoUploadService.upload(file, user.orgId, user.userId);
  }
}
```

## Files to Create

- Prisma schema update (photos table)
- `photo-upload.service.ts`
- `photos.resolver.ts`
- `photos.module.ts`

## Verification Checklist

- [x] Photos table created
- [x] Upload mutation functional
- [x] S3 upload working
- [x] Metadata stored in PostgreSQL

## Time Estimate: 2 hours

## Next Issue

**ISSUE-060:** GPS EXIF Extraction Service (2h)

## Status: COMPLETE (2025-10-03)

**Commit:** 1b96cbb9be90724c5e5493dafeb75cdf164cb8e4

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-059/COMPLETION-REPORT.md)

**Implementation Details:**

- PhotosModule, PhotosResolver, PhotosService created
- GraphQL API: photos(), photo(), photosByProject(), deletePhoto()
- Integration with ExifService and StorageService
- Multi-tenant isolation via orgId filtering
- Test coverage: 7/7 passing

**Phase 2 - Photo Documentation:** 4/6 issues complete (67%)
