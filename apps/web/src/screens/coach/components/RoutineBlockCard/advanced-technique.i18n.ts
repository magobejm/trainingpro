/** Stable ids stored in DB (VarChar 40). Legacy English labels map for older rows. */
export const ADVANCED_TECHNIQUE_IDS = ['topSet', 'backOffSet', 'clusterSets', 'myoReps', 'dropSet'] as const;
export type AdvancedTechniqueId = (typeof ADVANCED_TECHNIQUE_IDS)[number];

const LEGACY_LABEL_TO_ID: Record<string, AdvancedTechniqueId> = {
  'Top Set': 'topSet',
  'Back-Off Set': 'backOffSet',
  'Cluster Sets': 'clusterSets',
  'Myo-Reps': 'myoReps',
  'Drop Set': 'dropSet',
};

export function normalizeAdvancedTechniqueId(stored?: string | null): AdvancedTechniqueId {
  if (!stored) return 'topSet';
  if ((ADVANCED_TECHNIQUE_IDS as readonly string[]).includes(stored)) return stored as AdvancedTechniqueId;
  return LEGACY_LABEL_TO_ID[stored] ?? 'topSet';
}

export function advancedTechniqueDisplayLabel(stored: string, t: (k: string) => string): string {
  const id = (ADVANCED_TECHNIQUE_IDS as readonly string[]).includes(stored) ? stored : LEGACY_LABEL_TO_ID[stored];
  if (!id) return stored;
  const key = `coach.routine.advancedTechnique.${id}`;
  const tr = t(key);
  return tr === key ? stored : tr;
}
