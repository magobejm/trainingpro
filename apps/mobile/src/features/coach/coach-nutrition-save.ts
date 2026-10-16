import type { CoachNutritionPlan, CoachPlanWriteInput } from '@trainerpro/shared';
import type { CoachWrite } from '../../data/hooks/useCoachData';
import { nutritionPlanPayload, nutritionVersion } from './coach-nutrition-model';
export type NutritionPublication = { id: string; clientId?: string };
export type NutritionPlanDraft = CoachPlanWriteInput & { publication?: NutritionPublication };
export function nutritionSaveTarget(input: {
  originalId?: string;
  copy: boolean;
  clientId?: string;
  publication?: NutritionPublication;
}) {
  return {
    id: input.publication?.id || (!input.copy ? input.originalId : undefined),
    clientId: input.publication?.clientId ?? input.clientId,
    assignAfterSave: Boolean(input.publication?.clientId) || !input.originalId || input.copy,
  };
}
export function canAssignCoachNutritionPlan(plan: Pick<CoachNutritionPlan, 'id' | 'clientId'>): boolean {
  return Boolean(plan.id) && !plan.clientId;
}
export async function saveCoachNutritionPlan(
  input: { id?: string; clientId?: string; assignAfterSave?: boolean; payload: CoachPlanWriteInput },
  write: (request: CoachWrite) => Promise<CoachNutritionPlan>,
  onSaved: (plan: CoachNutritionPlan) => void,
  readAssigned?: (clientId: string) => Promise<CoachNutritionPlan[]>,
) {
  const plan = await write({
    path: '/nutrition/plans' + (input.id ? '/' + input.id : ''),
    method: input.id ? 'PATCH' : 'POST',
    body: input.payload,
  });
  onSaved(plan);
  if (input.assignAfterSave && input.clientId && canAssignCoachNutritionPlan(plan)) {
    if (input.id && readAssigned) {
      const assigned = await readAssigned(input.clientId);
      const alreadyApplied = assigned.some(
        (candidate) =>
          candidate.sourcePlanId === plan.id &&
          nutritionVersion(nutritionPlanPayload(candidate)) === nutritionVersion(nutritionPlanPayload(plan)),
      );
      if (alreadyApplied) return plan;
    }
    await write({ path: '/nutrition/plans/' + plan.id + '/assign', body: { clientId: input.clientId } });
  }
  return plan;
}
