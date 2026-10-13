import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  PROGRESS_REPOSITORY,
  type PersonalRecordsQuery,
  type ProgressRepositoryPort,
} from '../../domain/progress-repository.port';

@Injectable()
export class GetPersonalRecordsUseCase {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort) {}

  execute(context: AuthContext, query: PersonalRecordsQuery) {
    return this.repository.readPersonalRecords(context, query);
  }
}
