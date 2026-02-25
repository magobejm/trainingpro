import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { WarmupExerciseWriteInput } from '../../domain/warmup-exercise.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class UpdateWarmupExerciseUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, itemId: string, input: Partial<WarmupExerciseWriteInput>) {
    return this.repository.updateWarmupExercise(context, itemId, input);
  }
}
