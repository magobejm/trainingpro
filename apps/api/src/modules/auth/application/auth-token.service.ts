import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../domain/authenticated-user';
import type { TokenVerifierPort } from '../domain/token-verifier.port';
import { TOKEN_VERIFIER } from '../domain/token-verifier.token';

@Injectable()
export class AuthTokenService {
  constructor(@Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifierPort) {}

  async authenticate(token: string): Promise<AuthenticatedUser> {
    return this.verifier.verify(token);
  }
}
