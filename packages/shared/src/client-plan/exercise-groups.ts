export type GroupableItem = {
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  sortOrder: number;
};

export type ExerciseBlockType = 'single' | 'superset' | 'circuit';

export type ExerciseBlock<T extends GroupableItem> = {
  type: ExerciseBlockType;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  exercises: T[];
};

export function buildExerciseBlocks<T extends GroupableItem>(items: T[]): ExerciseBlock<T>[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const blocks: ExerciseBlock<T>[] = [];
  let index = 0;

  while (index < sorted.length) {
    const current = sorted[index];
    if (!current) {
      index += 1;
      continue;
    }
    if (!current.groupId || !current.groupType) {
      blocks.push({ type: 'single', groupType: null, exercises: [current] });
      index += 1;
      continue;
    }

    const groupExercises: T[] = [current];
    let next = index + 1;
    while (next < sorted.length && sorted[next]?.groupId === current.groupId) {
      const nextItem = sorted[next];
      if (nextItem) groupExercises.push(nextItem);
      next += 1;
    }

    blocks.push({
      type: current.groupType === 'SUPERSET' ? 'superset' : 'circuit',
      groupType: current.groupType,
      exercises: groupExercises,
    });
    index = next;
  }

  return blocks;
}
