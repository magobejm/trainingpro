import { Inject, Injectable } from '@nestjs/common';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';
import type { AuthContext } from '../../../../common/auth-context/auth-context';

@Injectable()
export class ListPlioTypesUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY)
    private readonly repository: LibraryRepositoryPort,
  ) {}

  execute(context: AuthContext) {
    return this.repository.listPlioTypes(context);
  }
}
