import type { Prisma } from '@prisma/client';
import {
  activeProgressionMicrocycle,
  applyProgression,
  loadSuggestionKg,
  parseProgressionRule,
  progressionMicrocycleIndex,
} from '@trainerpro/shared';
import { plannedSetsJsonToInput, readPlannedSetsJson } from '../../../../common/notes/session-note-snapshot';
import { ProgressionSuggestionService } from '../../application/progression-suggestion.service';
import { mapTemplateExerciseSnapshot, type TemplateExerciseSnapshot } from './sessions-prisma.mappers';

type ExerciseRow = Parameters<typeof mapTemplateExerciseSnapshot>[0] & { progressionRule?: unknown };

export type ProgressionContext = {
  appliedAt: Date | null;
  clientId?: string;
  mesocycleMicrocycles: null | number;
  microcycleDays: null | number;
  on?: Date;
};

const suggestions = new ProgressionSuggestionService();

/** When the client's active assignment of this template started, or null when it is not the active routine. */
export async function readAssignmentStart(
  db: Prisma.TransactionClient,
  clientId: string | undefined,
  templateId: string,
): Promise<Date | null> {
  if (!clientId) return null;
  const client = await db.client.findUnique({
    select: { activeRoutineAssignment: { select: { appliedAt: true, revision: { select: { templateId: true } } } } },
    where: { id: clientId },
  });
  const assignment = client?.activeRoutineAssignment;
  return assignment?.revision.templateId === templateId ? assignment.appliedAt : null;
}

/** Maps the day's strength exercises, applying each exercise's progression rule and load suggestion. */
export function mapProgressedExercises(
  db: Prisma.TransactionClient,
  exercises: Array<ExerciseRow & { exerciseLibraryId: null | string }>,
  context: ProgressionContext,
): Promise<TemplateExerciseSnapshot[]> {
  return Promise.all(exercises.map((exercise) => progressExercise(db, exercise, context)));
}

async function progressExercise(
  db: Prisma.TransactionClient,
  exercise: ExerciseRow & { exerciseLibraryId: null | string },
  context: ProgressionContext,
): Promise<TemplateExerciseSnapshot> {
  const snapshot = mapTemplateExerciseSnapshot(exercise);
  const rule = parseProgressionRule(exercise.progressionRule);
  if (!rule) return snapshot;
  const base = readPlannedSetsJson(snapshot.plannedSetsJson as Prisma.JsonValue | null);
  if (base.length === 0) return snapshot;
  const index = context.appliedAt
    ? progressionMicrocycleIndex(
        context.appliedAt,
        context.on ?? new Date(),
        context.microcycleDays,
        context.mesocycleMicrocycles ?? rule.microcycles.length,
      )
    : 0;
  const progressed = context.appliedAt ? applyProgression(base, rule, index) : base;
  const microcycle = activeProgressionMicrocycle(rule, index);
  const rawSuggestion =
    !microcycle?.deload && rule.autoLoad && context.clientId && exercise.exerciseLibraryId
      ? await suggestions.suggestWeightKg(db, {
          autoLoad: rule.autoLoad,
          clientId: context.clientId,
          repsMax: exercise.repsMax,
          sourceExerciseId: exercise.exerciseLibraryId,
        })
      : null;
  const suggested = loadSuggestionKg(microcycle, rawSuggestion);
  const planned = suggested == null ? progressed : progressed.map((set) => ({ ...set, suggestedWeightKg: suggested }));
  return {
    ...snapshot,
    plannedSetsJson: plannedSetsJsonToInput(planned),
    setsPlanned: planned.length,
    targetRir: planned[0]?.rir ?? snapshot.targetRir,
  };
}
