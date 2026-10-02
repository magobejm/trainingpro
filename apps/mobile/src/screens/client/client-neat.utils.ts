import type { ClientRoutineNeat } from '../../data/hooks/useClientRoutineQuery';

export function shouldShowClientNeatSection(neats: ReadonlyArray<ClientRoutineNeat> | undefined): boolean {
  return (neats?.length ?? 0) > 0;
}
