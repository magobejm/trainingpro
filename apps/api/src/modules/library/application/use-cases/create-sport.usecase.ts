import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { SportWriteInput } from '../../domain/sport.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class CreateSportUseCase {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort) {}

  execute(context: AuthContext, input: SportWriteInput) {
    return this.repository.createSport(context, input);
  }
}
