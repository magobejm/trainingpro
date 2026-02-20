import { Inject, Injectable } from '@nestjs/common';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class ListCardioMethodTypesUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY)
    private readonly repository: LibraryRepositoryPort,
  ) {}

  execute() {
    return this.repository.listCardioMethodTypes();
  }
}
