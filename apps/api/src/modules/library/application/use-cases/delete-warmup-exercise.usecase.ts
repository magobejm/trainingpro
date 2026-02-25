import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class DeleteWarmupExerciseUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, itemId: string) {
    return this.repository.deleteWarmupExercise(context, itemId);
  }
}
