import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { SessionAccessPolicy } from '../../domain/policies/session-access.policy';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepositoryPort,
} from '../../domain/sessions-repository.port';

@Injectable()
export class GetSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
    private readonly accessPolicy: SessionAccessPolicy,
  ) {}

  async execute(context: AuthContext, sessionId: string) {
    await this.accessPolicy.assertCanAccess(context, sessionId);
    const session = await this.repository.getSessionById(context, sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }
}
