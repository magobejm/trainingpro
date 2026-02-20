import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { CardioRulesService } from '../../domain/cardio-rules.service';
import {
  PLANS_REPOSITORY,
  type PlansRepositoryPort,
} from '../../domain/plans-repository.port';
import type { PlanCardioTemplateWriteInput } from '../../domain/plan-cardio.input';

@Injectable()
export class UpdateCardioTemplateUseCase {
  constructor(
    @Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort,
    private readonly rulesService: CardioRulesService,
  ) {}

  execute(context: AuthContext, templateId: string, input: PlanCardioTemplateWriteInput) {
    this.rulesService.assertValidTemplate(input);
    return this.repository.updateCardioTemplate(context, templateId, input);
  }
}
