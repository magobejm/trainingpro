const baseCategories: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  mobility: 'mobilityTypes',
  sport: 'sportTypes',
};
export function coachLibraryQueryPath(
  category: string,
  search: string,
  cursor: string,
  filters: Record<string, string> = {},
): string {
  const food = category === 'foods';
  const base = baseCategories[category];
  if (!food && !base) throw new Error('Unsupported library category');
  const params = new URLSearchParams({
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
    ...(food ? { query: search } : { baseCategory: base!, search }),
    ...(cursor ? { cursor } : {}),
    limit: '50',
  });
  return (food ? '/library/foods?' : '/library/exercises/all?') + params.toString();
}
