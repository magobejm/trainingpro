import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { CardioMethodWriteInput } from '../../domain/cardio-method.input';
import {
  LIBRARY_REPOSITORY,
  type LibraryRepositoryPort,
} from '../../domain/library-repository.port';

@Injectable()
export class CreateCardioMethodUseCase {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repository: LibraryRepositoryPort,
  ) {}

  execute(context: AuthContext, input: CardioMethodWriteInput) {
    return this.repository.createCardioMethod(context, input);
  }
}
