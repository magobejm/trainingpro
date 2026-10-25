type ExerciseType = 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';
type Performed = Record<ExerciseType, Array<{ id: string; name: string }>>;

export function flattenExercises(data: Performed | undefined): Array<{ id: string; name: string; type: ExerciseType }> {
  if (!data) return [];
  const types: ExerciseType[] = ['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport'];
  return types.flatMap((type) => (data[type] ?? []).map((item) => ({ ...item, type })));
}
