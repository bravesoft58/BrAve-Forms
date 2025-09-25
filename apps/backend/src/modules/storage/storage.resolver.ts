import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StorageService } from './storage.service';

@Resolver()
export class StorageResolver {
  constructor(private readonly storageService: StorageService) {}

  @Query(() => String, { name: 'getStorageStats' })
  async getStorageStats() {
    return await this.storageService.getStorageStats();
  }

  @Query(() => String, { name: 'generatePhotoUrl' })
  async generatePhotoUrl(@Args('photoKey') photoKey: string) {
    return await this.storageService.generateSignedUrl(photoKey);
  }

  @Query(() => String, { name: 'getCompliancePackage' })
  async getCompliancePackage(@Args('inspectionId') inspectionId: string) {
    return await this.storageService.createCompliancePackage(inspectionId);
  }
}
