import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PhotosService } from './photos.service';
import {
  Photo,
  UploadPhotoBase64Input,
  PhotoUploadResult,
  PhotoPair,
  CreatePhotoPairInput,
} from './photos.types';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';

@Resolver(() => Photo)
@UseGuards(ClerkAuthGuard)
export class PhotosResolver {
  private readonly logger = new Logger(PhotosResolver.name);

  constructor(
    private readonly photosService: PhotosService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Validate that projectId belongs to the user's organization
   */
  private async validateProjectOwnership(projectId: string, orgId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
      select: { id: true },
    });
    if (!project) {
      throw new ForbiddenException(
        `Project ${projectId} not found or does not belong to your organization`
      );
    }
  }

  /**
   * Validate that submissionId belongs to the user's organization
   */
  private async validateSubmissionOwnership(submissionId: string, orgId: string): Promise<void> {
    const submission = await this.prisma.formSubmission.findFirst({
      where: { id: submissionId, orgId },
      select: { id: true },
    });
    if (!submission) {
      throw new ForbiddenException(
        `Submission ${submissionId} not found or does not belong to your organization`
      );
    }
  }

  @Query(() => [Photo])
  async photos(
    @Args('inspectionId') inspectionId: string,
    @CurrentUser() user: any
  ): Promise<Photo[]> {
    return this.photosService.getPhotos(inspectionId, user.orgId);
  }

  @Query(() => Photo)
  async photo(@Args('id') id: string, @CurrentUser() user: any): Promise<Photo> {
    return this.photosService.getPhoto(id, user.orgId);
  }

  @Query(() => [Photo])
  async photosByProject(
    @Args('projectId') projectId: string,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
    @Args('hasGps', { nullable: true }) hasGps?: boolean,
    @Args('take', { nullable: true }) take?: number,
    @Args('skip', { nullable: true }) skip?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('userId', { nullable: true }) userId?: string,
    @Args('formType', { nullable: true }) formType?: string,
    @Args('weather', { type: () => [String], nullable: true }) weather?: string[],
    @Args('gpsLat', { nullable: true }) gpsLat?: number,
    @Args('gpsLng', { nullable: true }) gpsLng?: number,
    @Args('gpsRadiusKm', { nullable: true }) gpsRadiusKm?: number,
    @CurrentUser() user?: any
  ): Promise<Photo[]> {
    // Validate search query length (max 200 chars to prevent DoS)
    if (search && search.length > 200) {
      throw new BadRequestException('Search query too long (max 200 characters)');
    }

    // Validate GPS radius parameters - all three must be present or none
    if (
      (gpsLat !== undefined || gpsLng !== undefined || gpsRadiusKm !== undefined) &&
      !(gpsLat !== undefined && gpsLng !== undefined && gpsRadiusKm !== undefined)
    ) {
      throw new BadRequestException(
        'GPS radius filter requires all three parameters: gpsLat, gpsLng, and gpsRadiusKm'
      );
    }

    // Validate GPS coordinate ranges
    if (gpsLat !== undefined && (gpsLat < -90 || gpsLat > 90)) {
      throw new BadRequestException('gpsLat must be between -90 and 90');
    }
    if (gpsLng !== undefined && (gpsLng < -180 || gpsLng > 180)) {
      throw new BadRequestException('gpsLng must be between -180 and 180');
    }
    if (gpsRadiusKm !== undefined && (gpsRadiusKm <= 0 || gpsRadiusKm > 100)) {
      throw new BadRequestException('gpsRadiusKm must be between 0 and 100');
    }

    // Sanitize weather array - only allow alphanumeric and basic characters
    let sanitizedWeather: string[] | undefined;
    if (weather) {
      const validWeatherPattern = /^[a-zA-Z0-9\s-]+$/;
      sanitizedWeather = weather.filter(
        (w) => typeof w === 'string' && validWeatherPattern.test(w) && w.length <= 50
      );
    }

    // Sanitize search input - trim whitespace
    const sanitizedSearch = search?.trim().slice(0, 200);

    return this.photosService.getPhotosByProject(projectId, user.orgId, {
      startDate,
      endDate,
      hasGps,
      take,
      skip,
      search: sanitizedSearch,
      userId,
      formType,
      weather: sanitizedWeather,
      gpsLat,
      gpsLng,
      gpsRadiusKm,
    });
  }

  /**
   * Upload a photo from base64 data to MinIO storage
   * Extracts EXIF data (GPS, timestamp, device info) and creates thumbnails
   */
  @Mutation(() => PhotoUploadResult, {
    description: 'Upload a photo from base64 to MinIO storage with EXIF extraction',
  })
  async uploadPhoto(
    @Args('input') input: UploadPhotoBase64Input,
    @CurrentUser() user: { userId: string; orgId: string }
  ): Promise<PhotoUploadResult> {
    const startTime = Date.now();

    // Validate base64 input
    if (!input.base64 || input.base64.length === 0) {
      throw new BadRequestException('Base64 image data is required');
    }

    // Remove data URL prefix if present
    let base64Data = input.base64;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // Validate size (max 10MB = ~13.3MB in base64)
    const maxBase64Size = 14 * 1024 * 1024;
    if (base64Data.length > maxBase64Size) {
      throw new BadRequestException('Photo is too large. Maximum size is 10MB.');
    }

    // Cross-tenant validation: ensure projectId/submissionId belong to user's org
    if (input.projectId) {
      await this.validateProjectOwnership(input.projectId, user.orgId);
    }
    if (input.submissionId) {
      await this.validateSubmissionOwnership(input.submissionId, user.orgId);
    }

    try {
      // Convert base64 to Buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      this.logger.log(`Uploading photo for org ${user.orgId}`, {
        size: imageBuffer.length,
        format: input.format,
        projectId: input.projectId,
        submissionId: input.submissionId,
        hasGps: !!(input.latitude && input.longitude),
      });

      // Upload to storage via PhotosService
      const photo = await this.photosService.uploadPhotoFromBase64(
        imageBuffer,
        user.orgId,
        user.userId,
        {
          projectId: input.projectId,
          submissionId: input.submissionId,
          fieldName: input.fieldName,
          caption: input.caption,
          latitude: input.latitude,
          longitude: input.longitude,
        }
      );

      // Generate URLs
      const s3Endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:8335');
      const bucketName = this.configService.get<string>('S3_BUCKET_NAME', 'braveforms-photos');

      const url = photo.s3Key ? `${s3Endpoint}/${bucketName}/${photo.s3Key}` : '';
      const thumbnailUrl = photo.thumbnailKey
        ? `${s3Endpoint}/${bucketName}/${photo.thumbnailKey}`
        : url;

      const uploadTime = Date.now() - startTime;
      this.logger.log(`Photo uploaded successfully in ${uploadTime}ms`, {
        photoId: photo.id,
        size: photo.fileSize,
      });

      return {
        id: photo.id,
        url,
        thumbnailUrl,
        filename: photo.s3Key?.split('/').pop() || `photo-${photo.id}.jpg`,
        size: photo.fileSize,
        mimeType: photo.mimeType,
        latitude: photo.latitude,
        longitude: photo.longitude,
        takenAt: photo.takenAt,
      };
    } catch (error) {
      this.logger.error('Failed to upload photo', {
        error: error.message,
        stack: error.stack,
        orgId: user.orgId,
      });
      throw new BadRequestException(`Failed to upload photo: ${error.message}`);
    }
  }

  @Mutation(() => Boolean)
  async deletePhoto(@Args('id') id: string, @CurrentUser() user: any): Promise<boolean> {
    await this.photosService.deletePhoto(id, user.orgId);
    return true;
  }

  // ISSUE-172: Photo Pairing for Before/After Comparison

  /**
   * Get photo pairs for a project
   * Used for construction progress tracking and EPA compliance documentation
   */
  @Query(() => [PhotoPair], {
    description: 'Get photo pairs for a project (before/after comparisons)',
  })
  async photoPairsByProject(
    @Args('projectId') projectId: string,
    @CurrentUser() user: { userId: string; orgId: string }
  ): Promise<PhotoPair[]> {
    await this.validateProjectOwnership(projectId, user.orgId);
    return this.photosService.getPhotoPairsByProject(projectId, user.orgId);
  }

  /**
   * Create a photo pair for before/after comparison
   * Validates that both photos exist and belong to the user's org
   */
  @Mutation(() => PhotoPair, {
    description: 'Create a before/after photo pair for progress tracking',
  })
  async createPhotoPair(
    @Args('input') input: CreatePhotoPairInput,
    @CurrentUser() user: { userId: string; orgId: string }
  ): Promise<PhotoPair> {
    // Validate project ownership
    await this.validateProjectOwnership(input.projectId, user.orgId);

    // Validate both photos exist and belong to user's org
    const [beforePhoto, afterPhoto] = await Promise.all([
      this.prisma.photo.findFirst({
        where: { id: input.beforePhotoId, orgId: user.orgId },
        select: { id: true, takenAt: true },
      }),
      this.prisma.photo.findFirst({
        where: { id: input.afterPhotoId, orgId: user.orgId },
        select: { id: true, takenAt: true },
      }),
    ]);

    if (!beforePhoto) {
      throw new BadRequestException(
        `Before photo ${input.beforePhotoId} not found or does not belong to your organization`
      );
    }
    if (!afterPhoto) {
      throw new BadRequestException(
        `After photo ${input.afterPhotoId} not found or does not belong to your organization`
      );
    }

    // Warn if "before" photo is actually newer than "after" photo
    if (beforePhoto.takenAt > afterPhoto.takenAt) {
      this.logger.warn(
        `Photo pair created with before photo (${beforePhoto.takenAt}) newer than after photo (${afterPhoto.takenAt})`,
        { beforePhotoId: input.beforePhotoId, afterPhotoId: input.afterPhotoId }
      );
    }

    return this.photosService.createPhotoPair({
      orgId: user.orgId,
      projectId: input.projectId,
      beforePhotoId: input.beforePhotoId,
      afterPhotoId: input.afterPhotoId,
      description: input.description,
      createdBy: user.userId,
    });
  }

  /**
   * Delete a photo pair
   */
  @Mutation(() => Boolean, {
    description: 'Delete a photo pair',
  })
  async deletePhotoPair(
    @Args('id') id: string,
    @CurrentUser() user: { userId: string; orgId: string }
  ): Promise<boolean> {
    await this.photosService.deletePhotoPair(id, user.orgId);
    return true;
  }
}
