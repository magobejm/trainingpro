import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { PlioExerciseWriteInput } from '../../domain/plio-exercise.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class UpdatePlioExerciseUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, itemId: string, input: Partial<PlioExerciseWriteInput>) {
    return this.repository.updatePlioExercise(context, itemId, input);
  }
}
