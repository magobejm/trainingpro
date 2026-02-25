import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { PlioExerciseFilter } from '../../domain/plio-exercise.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class ListPlioExercisesUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, filter: PlioExerciseFilter) {
    return this.repository.listPlioExercises(context, filter);
  }
}
