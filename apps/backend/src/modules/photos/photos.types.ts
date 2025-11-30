import { ObjectType, Field, ID, registerEnumType, InputType } from '@nestjs/graphql';
import { StorageType } from '@prisma/client';

registerEnumType(StorageType, {
  name: 'StorageType',
});

@ObjectType()
export class Photo {
  @Field(() => ID)
  id: string;

  @Field()
  orgId: string;

  @Field()
  inspectionId: string;

  @Field({ nullable: true })
  s3Key?: string;

  @Field({ nullable: true })
  thumbnailKey?: string;

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  altitude?: number;

  @Field()
  takenAt: Date;

  @Field({ nullable: true })
  caption?: string;

  @Field()
  fileSize: number;

  @Field()
  mimeType: string;

  @Field(() => StorageType)
  storageType: StorageType;

  @Field({ nullable: true })
  deviceModel?: string;

  @Field({ nullable: true })
  deviceMake?: string;

  @Field()
  uploadedBy: string;

  @Field()
  uploadedAt: Date;

  @Field({ nullable: true, description: 'Weather conditions at time of photo (for EPA compliance)' })
  weather?: string;

  @Field({ nullable: true, description: 'Form template name for quick filtering' })
  formType?: string;
}

@InputType()
export class UploadPhotoInput {
  @Field()
  inspectionId: string;

  @Field({ nullable: true })
  caption?: string;

  @Field(() => Date, { nullable: true })
  takenAt?: Date;
}

@InputType()
export class UploadPhotoBase64Input {
  @Field({ description: 'Base64 encoded image data (without data URL prefix)' })
  base64: string;

  @Field({ description: 'Image format: jpeg, png, webp', defaultValue: 'jpeg' })
  format: string;

  @Field({ nullable: true, description: 'Project ID for organizing photos' })
  projectId?: string;

  @Field({ nullable: true, description: 'Form submission ID if from a form' })
  submissionId?: string;

  @Field({ nullable: true, description: 'Field name in the form' })
  fieldName?: string;

  @Field({ nullable: true, description: 'Photo caption or description' })
  caption?: string;

  @Field({ nullable: true, description: 'GPS latitude from device' })
  latitude?: number;

  @Field({ nullable: true, description: 'GPS longitude from device' })
  longitude?: number;
}

@ObjectType()
export class PhotoUploadResult {
  @Field(() => ID)
  id: string;

  @Field({ description: 'Full-size photo URL' })
  url: string;

  @Field({ description: 'Thumbnail URL (200px)' })
  thumbnailUrl: string;

  @Field()
  filename: string;

  @Field()
  size: number;

  @Field()
  mimeType: string;

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field({ nullable: true, description: 'When the photo was taken (from EXIF or current time)' })
  takenAt?: Date;
}

/**
 * ISSUE-172: Photo Pair for before/after comparison
 * Used for construction progress tracking and EPA compliance documentation
 */
@ObjectType()
export class PhotoPair {
  @Field(() => ID)
  id: string;

  @Field()
  orgId: string;

  @Field()
  projectId: string;

  @Field()
  beforePhotoId: string;

  @Field()
  afterPhotoId: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdBy: string;

  @Field()
  createdAt: Date;
}

@InputType()
export class CreatePhotoPairInput {
  @Field({ description: 'Project ID for the photo pair' })
  projectId: string;

  @Field({ description: 'ID of the before photo (earlier in time)' })
  beforePhotoId: string;

  @Field({ description: 'ID of the after photo (later in time)' })
  afterPhotoId: string;

  @Field({ nullable: true, description: 'Optional description of the pair' })
  description?: string;
}
