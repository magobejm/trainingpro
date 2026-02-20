import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { CardioMethodFilter } from '../../domain/cardio-method.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class ListCardioMethodsUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort,
  ) {}

  execute(context: AuthContext, filter: CardioMethodFilter) {
    return this.repository.listCardioMethods(context, filter);
  }
}
