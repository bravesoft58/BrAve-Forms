import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClerkStrategy } from './strategies/clerk.strategy';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'clerk' })],
  providers: [
    AuthService,
    AuthResolver,
    ClerkStrategy,
    ClerkAuthGuard,
    RolesGuard,
  ],
  exports: [ClerkAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}