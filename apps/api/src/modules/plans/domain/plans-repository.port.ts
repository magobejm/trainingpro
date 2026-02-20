import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { PlanCardioTemplate } from './entities/cardio-template.entity';
import type { PlanTemplate } from './entities/plan-template.entity';
import type { PlanCardioTemplateWriteInput } from './plan-cardio.input';
import type { PlanTemplateWriteInput } from './plan-template.input';

export const PLANS_REPOSITORY = Symbol('PLANS_REPOSITORY');

export interface PlansRepositoryPort {
  createCardioTemplate(
    context: AuthContext,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate>;
  createTemplate(context: AuthContext, input: PlanTemplateWriteInput): Promise<PlanTemplate>;
  listCardioTemplates(context: AuthContext): Promise<PlanCardioTemplate[]>;
  listTemplates(context: AuthContext): Promise<PlanTemplate[]>;
  updateCardioTemplate(
    context: AuthContext,
    templateId: string,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate>;
  updateTemplate(
    context: AuthContext,
    templateId: string,
    input: PlanTemplateWriteInput,
  ): Promise<PlanTemplate>;
}
