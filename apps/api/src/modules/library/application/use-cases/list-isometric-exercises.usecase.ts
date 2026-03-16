import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { IsometricExerciseFilter } from '../../domain/isometric-exercise.input';
import { LIBRARY_REPOSITORY, type LibraryRepositoryPort } from '../../domain/library-repository.port';

@Injectable()
export class ListIsometricExercisesUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, filter: IsometricExerciseFilter) {
    return this.repository.listIsometricExercises(context, filter);
  }
}
