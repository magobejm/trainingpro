import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { EnsureSessionInput } from '../../domain/session.input';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepositoryPort,
} from '../../domain/sessions-repository.port';

@Injectable()
export class EnsureSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
  ) {}

  execute(context: AuthContext, input: EnsureSessionInput) {
    return this.repository.ensureSession(context, input);
  }
}
