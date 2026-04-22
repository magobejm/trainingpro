import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type PerformedTemplatesQuery,
  type ProgressRepositoryPort,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetPerformedTemplatesUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: PerformedTemplatesQuery) {
    return this.repository.readPerformedTemplates(context, query);
  }
}
