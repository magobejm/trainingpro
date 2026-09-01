export type ExerciseGroupTypeValue = 'CIRCUIT' | 'SUPERSET';

export type ExerciseGroupFields = {
  groupId: null | string;
  groupType: ExerciseGroupTypeValue | null;
};

type PlanGroupRelation =
  | {
      id: string;
      groupType: ExerciseGroupTypeValue;
    }
  | null
  | undefined;

export function mapExerciseGroupFields(group: PlanGroupRelation): ExerciseGroupFields {
  if (!group) {
    return { groupId: null, groupType: null };
  }
  return { groupId: group.id, groupType: group.groupType };
}

export function buildPlanDayGroupLookup(day: {
  cardioBlocks: Array<{ group?: PlanGroupRelation; sortOrder: number }>;
  exercises: Array<{ group?: PlanGroupRelation; sortOrder: number }>;
  isometricBlocks: Array<{ group?: PlanGroupRelation; sortOrder: number }>;
  mobilityBlocks: Array<{ group?: PlanGroupRelation; sortOrder: number }>;
  plioBlocks: Array<{ group?: PlanGroupRelation; sortOrder: number }>;
  sportBlocks: Array<{ group?: PlanGroupRelation; sortOrder: number }>;
}): Map<number, ExerciseGroupFields> {
  const lookup = new Map<number, ExerciseGroupFields>();
  const blocks = [
    ...day.exercises,
    ...day.cardioBlocks,
    ...day.plioBlocks,
    ...day.mobilityBlocks,
    ...day.isometricBlocks,
    ...day.sportBlocks,
  ];
  for (const block of blocks) {
    lookup.set(block.sortOrder, mapExerciseGroupFields(block.group));
  }
  return lookup;
}

export const PLAN_EXERCISE_GROUP_INCLUDE = {
  select: { groupType: true, id: true },
} as const;
