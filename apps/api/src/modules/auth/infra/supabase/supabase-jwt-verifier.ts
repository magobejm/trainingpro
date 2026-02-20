import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../domain/authenticated-user';
import type { TokenVerifierPort } from '../../domain/token-verifier.port';

function getSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL;
  if (!value) {
    throw new Error('Missing required env var: SUPABASE_URL');
  }
  return value;
}

@Injectable()
export class SupabaseJwtVerifier implements TokenVerifierPort {
  private jwks: unknown | null = null;

  constructor() {}

  async verify(token: string): Promise<AuthenticatedUser> {
    try {
      const jose = await import('jose');
      const jwks = (await this.resolveJwks(jose.createRemoteJWKSet)) as Parameters<
        typeof jose.jwtVerify
      >[1];
      const { payload } = await jose.jwtVerify(token, jwks);
      return this.mapPayload(payload as Record<string, unknown>);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async resolveJwks(
    createRemoteJWKSet: (url: URL) => unknown,
  ): Promise<unknown> {
    if (this.jwks) {
      return this.jwks;
    }
    const supabaseUrl = getSupabaseUrl();
    const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
    this.jwks = createRemoteJWKSet(jwksUrl);
    return this.jwks;
  }

  private mapPayload(payload: Record<string, unknown>): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Token without subject');
    }
    return {
      email: this.readEmail(payload),
      roles: this.readRoles(payload),
      subject: payload.sub as string,
    };
  }

  private readEmail(payload: Record<string, unknown>): string | undefined {
    const email = payload.email;
    return typeof email === 'string' ? email : undefined;
  }

  private readRoles(payload: Record<string, unknown>): string[] {
    const roles = new Set<string>();
    const rootRole = payload.role;
    if (typeof rootRole === 'string' && rootRole.length > 0) {
      roles.add(rootRole.toLowerCase());
    }
    this.addFromClaim(roles, payload.app_metadata);
    this.addFromClaim(roles, payload.user_metadata);
    return [...roles];
  }

  private addFromClaim(roles: Set<string>, claim: unknown): void {
    if (!claim || typeof claim !== 'object') {
      return;
    }
    const metadata = claim as { roles?: unknown };
    if (!Array.isArray(metadata.roles)) {
      return;
    }
    for (const role of metadata.roles) {
      if (typeof role === 'string' && role.length > 0) {
        roles.add(role.toLowerCase());
      }
    }
  }
}
