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
