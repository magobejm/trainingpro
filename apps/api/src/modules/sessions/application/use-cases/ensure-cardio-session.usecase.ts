import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { EnsureCardioSessionInput } from '../../domain/cardio-session.input';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepositoryPort,
} from '../../domain/sessions-repository.port';

@Injectable()
export class EnsureCardioSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
  ) {}

  execute(context: AuthContext, input: EnsureCardioSessionInput) {
    return this.repository.ensureCardioSession(context, input);
  }
}
