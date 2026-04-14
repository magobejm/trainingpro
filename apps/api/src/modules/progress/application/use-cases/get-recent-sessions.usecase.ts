import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type ProgressRepositoryPort,
  type RecentSessionsQuery,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetRecentSessionsUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: RecentSessionsQuery) {
    return this.repository.readRecentSessions(context, query);
  }
}
