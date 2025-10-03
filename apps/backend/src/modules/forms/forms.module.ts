import { Module } from '@nestjs/common';
import { FormsResolver } from './forms.resolver';
import { FormsService } from './forms.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [FormsResolver, FormsService],
  exports: [FormsService],
})
export class FormsModule {}
