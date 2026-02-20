import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PlansRulesService } from '../../domain/plans-rules.service';
import {
  PLANS_REPOSITORY,
  type PlansRepositoryPort,
} from '../../domain/plans-repository.port';
import type { PlanTemplateWriteInput } from '../../domain/plan-template.input';

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    @Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort,
    private readonly rulesService: PlansRulesService,
  ) {}

  execute(context: AuthContext, templateId: string, input: PlanTemplateWriteInput) {
    this.rulesService.assertValidTemplate(input);
    return this.repository.updateTemplate(context, templateId, input);
  }
}
