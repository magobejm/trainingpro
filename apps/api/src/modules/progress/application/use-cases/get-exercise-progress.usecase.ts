import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type ExerciseProgressQuery,
  type ProgressRepositoryPort,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetExerciseProgressUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: ExerciseProgressQuery) {
    return this.repository.readExerciseProgress(context, query);
  }
}
