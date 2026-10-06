import { ForbiddenException, Inject, Injectable, forwardRef } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { ClientAccessPolicy } from '../../../clients/domain/policies/client-access.policy';
import type { EnsureSessionInput } from '../../domain/session.input';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../domain/sessions-repository.port';

@Injectable()
export class EnsureSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
    @Inject(forwardRef(() => ClientAccessPolicy))
    private readonly clientAccess: ClientAccessPolicy,
  ) {}

  async execute(context: AuthContext, input: EnsureSessionInput) {
    const allowed = await this.clientAccess.canAccess(context, input.clientId);
    if (!allowed) {
      throw new ForbiddenException('Ownership validation failed');
    }
    return this.repository.ensureSession(context, input);
  }
}
