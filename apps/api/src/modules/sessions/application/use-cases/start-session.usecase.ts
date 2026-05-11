import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { SessionAccessPolicy } from '../../domain/policies/session-access.policy';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../domain/sessions-repository.port';
import type { StartSessionInput } from '../../domain/session.input';

@Injectable()
export class StartSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
    private readonly accessPolicy: SessionAccessPolicy,
  ) {}

  async execute(context: AuthContext, input: StartSessionInput) {
    await this.accessPolicy.assertCanAccess(context, input.sessionId);
    return this.repository.startSession(context, input);
  }
}
