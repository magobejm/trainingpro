import { Module } from '@nestjs/common';
import { AuthTokenService } from './application/auth-token.service';
import { TOKEN_VERIFIER } from './domain/token-verifier.token';
import { SupabaseJwtVerifier } from './infra/supabase/supabase-jwt-verifier';
import { AuthGuard } from './presentation/guards/auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  providers: [
    SupabaseJwtVerifier,
    {
      provide: TOKEN_VERIFIER,
      useExisting: SupabaseJwtVerifier,
    },
    AuthTokenService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [AuthGuard, RolesGuard, AuthTokenService],
})
export class AuthModule {}
