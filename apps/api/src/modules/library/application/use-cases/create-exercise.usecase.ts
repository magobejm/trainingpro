import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ExerciseWriteInput } from '../../domain/exercise.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class CreateExerciseUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort,
  ) {}

  execute(context: AuthContext, input: ExerciseWriteInput) {
    return this.repository.createExercise(context, input);
  }
}
