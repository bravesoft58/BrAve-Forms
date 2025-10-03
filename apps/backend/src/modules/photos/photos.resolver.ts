import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/guards/clerk-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PhotosService } from './photos.service';
import { Photo, UploadPhotoInput } from './photos.types';

@Resolver(() => Photo)
@UseGuards(ClerkAuthGuard)
export class PhotosResolver {
  constructor(private readonly photosService: PhotosService) {}

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
    @CurrentUser() user?: any
  ): Promise<Photo[]> {
    return this.photosService.getPhotosByProject(projectId, user.orgId, {
      startDate,
      endDate,
      hasGps,
      take,
      skip,
    });
  }

  @Mutation(() => Boolean)
  async deletePhoto(@Args('id') id: string, @CurrentUser() user: any): Promise<boolean> {
    await this.photosService.deletePhoto(id, user.orgId);
    return true;
  }
}
