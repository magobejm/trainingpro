import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepositoryPort,
} from '../sessions-repository.port';

@Injectable()
export class SessionAccessPolicy {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
  ) {}

  async assertCanAccess(context: AuthContext, sessionId: string): Promise<void> {
    const allowed = await this.repository.canAccessSession(context, sessionId);
    if (!allowed) {
      throw new ForbiddenException('Session access denied');
    }
  }
}
