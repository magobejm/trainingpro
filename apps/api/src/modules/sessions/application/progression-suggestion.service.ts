import type { Prisma } from '@prisma/client';
import { suggestLoadIncrease, type AutoLoadRule } from '@trainerpro/shared';
import { exerciseHistoryQuery, mapExerciseHistory } from '../infra/prisma/exercise-history';

/** Proposes a heavier load from the client's last logged session of an exercise. Informational only. */
export class ProgressionSuggestionService {
  async suggestWeightKg(
    db: Prisma.TransactionClient,
    input: { autoLoad: AutoLoadRule; clientId: string; repsMax: null | number; sourceExerciseId: string },
  ): Promise<null | number> {
    const [last] = await db.sessionInstance.findMany(exerciseHistoryQuery(input.clientId, input.sourceExerciseId, 1));
    if (!last) return null;
    const sets = mapExerciseHistory(last).sets.map((set) => ({
      reps: set.repsDone ?? null,
      rir: set.effortRir ?? null,
      weightKg: set.weightDoneKg ?? null,
    }));
    return suggestLoadIncrease(sets, { repsMax: input.repsMax }, input.autoLoad);
  }
}
