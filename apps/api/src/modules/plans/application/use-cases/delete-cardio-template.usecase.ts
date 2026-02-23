import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PLANS_REPOSITORY, type PlansRepositoryPort } from '../../domain/plans-repository.port';

@Injectable()
export class DeleteCardioTemplateUseCase {
  constructor(@Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort) {}

  async execute(context: AuthContext, templateId: string): Promise<void> {
    return this.repository.deleteCardioTemplate(context, templateId);
  }
}
