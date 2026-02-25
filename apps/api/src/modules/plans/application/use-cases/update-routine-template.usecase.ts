import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PLANS_REPOSITORY, type PlansRepositoryPort } from '../../domain/plans-repository.port';
import type { RoutineTemplateWriteInput } from '../../domain/routine-template.input';

@Injectable()
export class UpdateRoutineTemplateUseCase {
  constructor(@Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort) {}

  execute(context: AuthContext, templateId: string, input: RoutineTemplateWriteInput) {
    return this.repository.updateRoutineTemplate(context, templateId, input);
  }
}
