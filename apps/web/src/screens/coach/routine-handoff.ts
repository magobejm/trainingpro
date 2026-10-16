import type { RoutineHandoff } from '@trainerpro/shared';
import { pickNormalizedPlanTemplateId } from '../../data/normalize-plan-template-id';

export type RoutineAssignOptions = { routineHandoff?: RoutineHandoff };

export function localCalendarDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameAssignedRoutine(
  currentPlanId: string | null | undefined,
  currentPlanTemplateId: string | null | undefined,
  nextTemplateId: string | null | undefined,
): boolean {
  const current = pickNormalizedPlanTemplateId(currentPlanTemplateId, currentPlanId);
  const next = pickNormalizedPlanTemplateId(nextTemplateId);
  return Boolean(current && next && current === next);
}

export type RoutineHandoffRequest = {
  clientId: string;
  clientName: string;
  routineName: string;
  submit: (options: RoutineAssignOptions) => Promise<void>;
};
export type AskRoutineHandoff = (request: RoutineHandoffRequest) => Promise<boolean>;

export async function assignClientRoutine(input: {
  clientId: string;
  clientName: string;
  routineName: string;
  sameRoutine: boolean;
  assign: (options: RoutineAssignOptions) => Promise<void>;
  openCalendar: () => void;
  ask: AskRoutineHandoff;
}): Promise<void> {
  if (
    input.sameRoutine ||
    (await input.ask({
      clientId: input.clientId,
      clientName: input.clientName,
      routineName: input.routineName,
      submit: input.assign,
    }))
  )
    input.openCalendar();
}
