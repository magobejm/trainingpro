import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { IsometricExerciseWriteInput } from '../../domain/isometric-exercise.input';
import { LIBRARY_REPOSITORY, type LibraryRepositoryPort } from '../../domain/library-repository.port';

@Injectable()
export class UpdateIsometricExerciseUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, itemId: string, input: Partial<IsometricExerciseWriteInput>) {
    return this.repository.updateIsometricExercise(context, itemId, input);
  }
}
