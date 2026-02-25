import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PLANS_REPOSITORY, type PlansRepositoryPort } from '../../domain/plans-repository.port';

@Injectable()
export class GetTemplateUseCase {
  constructor(@Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort) {}

  execute(context: AuthContext, templateId: string) {
    return this.repository.getTemplateById(context, templateId);
  }
}
