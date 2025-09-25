import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { PhotoStorageService } from './photo-storage.service';
import { StorageResolver } from './storage.resolver';

@Module({
  imports: [ConfigModule],
  providers: [StorageService, PhotoStorageService, StorageResolver],
  exports: [StorageService, PhotoStorageService],
})
export class StorageModule {}
