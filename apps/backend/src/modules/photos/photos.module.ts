import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosResolver } from './photos.resolver';
import { ExifService } from './exif.service';
import { StorageService } from './storage.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [PhotosService, PhotosResolver, ExifService, StorageService, PrismaService],
  exports: [PhotosService],
})
export class PhotosModule {}
