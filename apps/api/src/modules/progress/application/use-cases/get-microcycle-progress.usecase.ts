import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type MicrocycleProgressQuery,
  type ProgressRepositoryPort,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetMicrocycleProgressUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: MicrocycleProgressQuery) {
    return this.repository.readMicrocycleProgress(context, query);
  }
}
