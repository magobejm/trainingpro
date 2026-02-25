import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PLANS_REPOSITORY, type PlansRepositoryPort } from '../../domain/plans-repository.port';

@Injectable()
export class ListTemplatesUseCase {
  constructor(@Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort) {}

  execute(context: AuthContext, options?: { summary?: boolean }) {
    return this.repository.listTemplates(context, options);
  }
}
