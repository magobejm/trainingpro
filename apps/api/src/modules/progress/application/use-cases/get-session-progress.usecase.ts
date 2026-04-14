import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type ProgressRepositoryPort,
  type SessionProgressQuery,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetSessionProgressUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: SessionProgressQuery) {
    return this.repository.readSessionProgress(context, query);
  }
}
