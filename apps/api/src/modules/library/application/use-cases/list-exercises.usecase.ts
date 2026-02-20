import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { ExerciseFilter } from '../../domain/exercise.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class ListExercisesUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort,
  ) {}

  execute(context: AuthContext, filter: ExerciseFilter) {
    return this.repository.listExercises(context, filter);
  }
}
