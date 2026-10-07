import type { Prisma } from '@prisma/client';
import { toRpeNumber } from './rpe-number';
import { mapClientRoutineSetsToPlannedSnapshots, type PlannedSetSnapshot } from '../notes/planned-set.mapper';
import { resolveClientRoutineSets, type PlanSetRow, type RoutineBlockPrescription } from './client-routine-set.mapper';
import type { ClientRoutineExercise } from '../../modules/clients/domain/client-routine';

function storePlannedSets(
  lookup: Map<number, PlannedSetSnapshot[]>,
  sortOrder: number,
  type: ClientRoutineExercise['type'],
  sets: PlanSetRow[] | undefined,
  prescription: RoutineBlockPrescription & { notes?: null | string },
): void {
  lookup.set(sortOrder, mapClientRoutineSetsToPlannedSnapshots(resolveClientRoutineSets(sets, type, prescription)));
}

type PlanDayForPlannedSets = {
  cardioBlocks: Array<{
    notes: null | string;
    restSeconds: number;
    roundsPlanned: number;
    sets: PlanSetRow[];
    sortOrder: number;
    targetRpe?: Prisma.Decimal | null | number;
  }>;
  exercises: Array<{
    notes: null | string;
    perSetWeightRangesJson: unknown;
    repsMax: null | number;
    repsMin: null | number;
    restSeconds: null | number;
    sets: PlanSetRow[];
    setsPlanned: null | number;
    sortOrder: number;
    targetRir: null | number;
    targetRpe: Prisma.Decimal | null | number;
    weightRangeMaxKg: Prisma.Decimal | null | number | string;
    weightRangeMinKg: Prisma.Decimal | null | number | string;
  }>;
  isometricBlocks: Array<{
    notes: null | string;
    restSeconds: number;
    sets: PlanSetRow[];
    setsPlanned: null | number;
    sortOrder: number;
    targetRpe: Prisma.Decimal | null | number;
  }>;
  mobilityBlocks: Array<{
    notes: null | string;
    restSeconds: number;
    roundsPlanned: number;
    sets: PlanSetRow[];
    sortOrder: number;
    targetRpe: Prisma.Decimal | null | number;
  }>;
  plioBlocks: Array<{
    notes: null | string;
    restSeconds: number;
    roundsPlanned: number;
    sets: PlanSetRow[];
    sortOrder: number;
    targetRpe: Prisma.Decimal | null | number;
  }>;
  sportBlocks: Array<{
    notes: null | string;
    sets: PlanSetRow[];
    sortOrder: number;
    targetRpe: Prisma.Decimal | null | number;
  }>;
};

export function buildPlanDayPlannedSetsLookup(day: PlanDayForPlannedSets): Map<number, PlannedSetSnapshot[]> {
  const lookup = new Map<number, PlannedSetSnapshot[]>();

  for (const exercise of day.exercises) {
    storePlannedSets(lookup, exercise.sortOrder, 'strength', exercise.sets, {
      notes: exercise.notes,
      perSetWeightRangesJson: exercise.perSetWeightRangesJson,
      repsMax: exercise.repsMax,
      repsMin: exercise.repsMin,
      restSeconds: exercise.restSeconds,
      setsPlanned: exercise.setsPlanned,
      targetRir: exercise.targetRir,
      targetRpe: toRpeNumber(exercise.targetRpe),
      weightRangeMaxKg: exercise.weightRangeMaxKg,
      weightRangeMinKg: exercise.weightRangeMinKg,
    });
  }

  for (const block of day.plioBlocks) {
    storePlannedSets(lookup, block.sortOrder, 'plio', block.sets, {
      notes: block.notes,
      restSeconds: block.restSeconds,
      setsPlanned: block.roundsPlanned,
      targetRpe: toRpeNumber(block.targetRpe),
    });
  }

  for (const block of day.mobilityBlocks) {
    storePlannedSets(lookup, block.sortOrder, 'mobility', block.sets, {
      notes: block.notes,
      restSeconds: block.restSeconds,
      setsPlanned: block.roundsPlanned,
      targetRpe: toRpeNumber(block.targetRpe),
    });
  }

  for (const block of day.isometricBlocks) {
    storePlannedSets(lookup, block.sortOrder, 'isometric', block.sets, {
      notes: block.notes,
      restSeconds: block.restSeconds,
      setsPlanned: block.setsPlanned,
      targetRpe: toRpeNumber(block.targetRpe),
    });
  }

  for (const block of day.sportBlocks) {
    storePlannedSets(lookup, block.sortOrder, 'sport', block.sets, {
      notes: block.notes,
      targetRpe: toRpeNumber(block.targetRpe),
    });
  }

  for (const block of day.cardioBlocks) {
    storePlannedSets(lookup, block.sortOrder, 'cardio', block.sets, {
      notes: block.notes,
      restSeconds: block.restSeconds,
      setsPlanned: block.roundsPlanned,
      targetRpe: toRpeNumber(block.targetRpe),
    });
  }

  return lookup;
}
