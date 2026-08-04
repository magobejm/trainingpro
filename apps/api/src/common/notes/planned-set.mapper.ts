export type PlannedSetSnapshot = {
  advancedTechnique: null | string;
  note: null | string;
  setIndex: number;
};

export function mapPlanSetsToPlannedSnapshots(
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }> | undefined,
): PlannedSetSnapshot[] {
  return (sets ?? [])
    .slice()
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((set) => ({
      advancedTechnique: set.advancedTechnique ?? null,
      note: set.note ?? null,
      setIndex: set.setIndex,
    }));
}
