import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { FoodFilter } from '../../domain/food.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class ListFoodsUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort,
  ) {}

  execute(context: AuthContext, filter: FoodFilter) {
    return this.repository.listFoods(context, filter);
  }
}
