export function readLockedFields(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((item): item is string => typeof item === 'string');
}

export function buildPlanDayLockedFieldsLookup(day: {
  cardioBlocks: Array<{ lockedFieldsJson: unknown; sortOrder: number }>;
  exercises: Array<{ lockedFieldsJson: unknown; sortOrder: number }>;
  isometricBlocks: Array<{ lockedFieldsJson: unknown; sortOrder: number }>;
  mobilityBlocks: Array<{ lockedFieldsJson: unknown; sortOrder: number }>;
  plioBlocks: Array<{ lockedFieldsJson: unknown; sortOrder: number }>;
  sportBlocks: Array<{ lockedFieldsJson: unknown; sortOrder: number }>;
}): Map<number, string[]> {
  const lookup = new Map<number, string[]>();
  const addBlock = (sortOrder: number, lockedFieldsJson: unknown) => {
    const lockedFields = readLockedFields(lockedFieldsJson);
    if (lockedFields.length > 0) {
      lookup.set(sortOrder, lockedFields);
    }
  };

  day.exercises.forEach((block) => addBlock(block.sortOrder, block.lockedFieldsJson));
  day.cardioBlocks.forEach((block) => addBlock(block.sortOrder, block.lockedFieldsJson));
  day.plioBlocks.forEach((block) => addBlock(block.sortOrder, block.lockedFieldsJson));
  day.mobilityBlocks.forEach((block) => addBlock(block.sortOrder, block.lockedFieldsJson));
  day.isometricBlocks.forEach((block) => addBlock(block.sortOrder, block.lockedFieldsJson));
  day.sportBlocks.forEach((block) => addBlock(block.sortOrder, block.lockedFieldsJson));

  return lookup;
}
