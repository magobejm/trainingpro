import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type PerformedSessionDaysQuery,
  type ProgressRepositoryPort,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetPerformedSessionDaysUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: PerformedSessionDaysQuery) {
    return this.repository.readPerformedSessionDays(context, query);
  }
}
