import { applyProgression, progressionRuleSchema, suggestNextWeight, type ProgressionSet } from '@trainerpro/shared';
import type { PlannedSetSnapshot } from '../../../common/notes/planned-set.mapper';
import type { TemplateExerciseSnapshot } from '../infra/prisma/sessions-prisma.mappers';

export function withExerciseProgression(
  snapshot: TemplateExerciseSnapshot,
  rule: unknown,
  weekIndex: number,
  last: { reps: number; rir: number | null; weightKg: number } | null,
): TemplateExerciseSnapshot {
  const parsed = progressionRuleSchema.safeParse(rule);
  if (!parsed.success) return snapshot;
  const planned = readPlanned(snapshot.plannedSetsJson);
  const next = applyProgression(toProgressionSets(planned, snapshot), parsed.data, weekIndex);
  const suggested =
    last && parsed.data.autoLoad
      ? suggestNextWeight({
          performedReps: last.reps,
          repsMax: snapshot.repsMax ?? last.reps,
          rir: last.rir,
          rule: parsed.data.autoLoad,
          weightKg: last.weightKg,
        })
      : null;
  return {
    ...snapshot,
    plannedSetsJson: next.map((set, index) => ({
      ...(planned[index] ?? planned[planned.length - 1] ?? { advancedTechnique: null, note: null, setIndex: index }),
      rir: set.targetRir,
      setIndex: set.setIndex,
      suggestedWeightKg: suggested,
      weightKg: set.weightKg,
    })),
    setsPlanned: next.length,
    targetRir: next[0]?.targetRir ?? snapshot.targetRir,
  };
}

function readPlanned(value: unknown): PlannedSetSnapshot[] {
  return Array.isArray(value) ? (value as PlannedSetSnapshot[]) : [];
}

function toProgressionSets(planned: PlannedSetSnapshot[], snapshot: TemplateExerciseSnapshot): ProgressionSet[] {
  const fallback = { rir: snapshot.targetRir, setIndex: 0, weightKg: asKg(snapshot.weightRangeMinKg) };
  const source = planned.length > 0 ? planned : [fallback];
  return source.map((set, index) => ({
    repsMax: snapshot.repsMax,
    repsMin: snapshot.repsMin,
    setIndex: index,
    targetRir: set.rir ?? snapshot.targetRir,
    weightKg: asKg(set.weightKg) ?? asKg(snapshot.weightRangeMinKg),
  }));
}

function asKg(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
