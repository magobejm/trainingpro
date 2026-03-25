import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { PlanCardioTemplate } from './entities/cardio-template.entity';
import type { PlanTemplate } from './entities/plan-template.entity';
import type { PlanCardioTemplateWriteInput } from './plan-cardio.input';
import type { PlanTemplateWriteInput } from './plan-template.input';
import type { RoutineTemplateWriteInput } from './routine-template.input';

export const PLANS_REPOSITORY = Symbol('PLANS_REPOSITORY');

export interface PlansRepositoryPort {
  createCardioTemplate(context: AuthContext, input: PlanCardioTemplateWriteInput): Promise<PlanCardioTemplate>;
  createTemplate(context: AuthContext, input: PlanTemplateWriteInput): Promise<PlanTemplate>;
  listCardioTemplates(context: AuthContext, options?: { summary?: boolean }): Promise<PlanCardioTemplate[]>;
  listTemplates(context: AuthContext, options?: { summary?: boolean }): Promise<PlanTemplate[]>;
  getTemplateById(context: AuthContext, templateId: string): Promise<PlanTemplate>;
  getCardioTemplateById(context: AuthContext, templateId: string): Promise<PlanCardioTemplate>;
  deleteCardioTemplate(context: AuthContext, templateId: string): Promise<void>;
  deleteTemplate(context: AuthContext, templateId: string): Promise<void>;
  updateCardioTemplate(
    context: AuthContext,
    templateId: string,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate>;
  updateTemplate(context: AuthContext, templateId: string, input: PlanTemplateWriteInput): Promise<PlanTemplate>;
  canCoachAccessTemplate(coachSupabaseUid: string, templateId: string): Promise<boolean>;
  createRoutineTemplate(context: AuthContext, input: RoutineTemplateWriteInput): Promise<unknown>;
  getRoutineTemplateById(context: AuthContext, templateId: string): Promise<unknown>;
  listRoutineTemplates(context: AuthContext, options?: { summary?: boolean }): Promise<unknown[]>;
  updateRoutineTemplate(context: AuthContext, templateId: string, input: RoutineTemplateWriteInput): Promise<unknown>;
  deleteRoutineTemplate(context: AuthContext, templateId: string): Promise<void>;
  listRoutineObjectives(): Promise<
    Array<{ id: string; code: string; label: string; sort_order: number; is_default: boolean }>
  >;
}
