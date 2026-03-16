import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { IsometricExerciseWriteInput } from '../../domain/isometric-exercise.input';
import { LIBRARY_REPOSITORY, type LibraryRepositoryPort } from '../../domain/library-repository.port';

@Injectable()
export class CreateIsometricExerciseUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, input: IsometricExerciseWriteInput) {
    return this.repository.createIsometricExercise(context, input);
  }
}
