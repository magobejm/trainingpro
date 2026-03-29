export type BlockType = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

export interface DraftSet {
  setIndex: number;
  // Strength / Plio / Sport / Isometric
  reps?: number;
  rir?: number;
  weightKg?: number;
  // Isometric
  durationSeconds?: number;
  // Warmup
  rom?: string;
  // Cardio / Sport
  fcMaxPct?: number;
  fcReservePct?: number;
  heartRate?: number;
  // Common
  rpe?: number;
  restSeconds?: number;
  // Advanced technique label (strength only)
  advancedTechnique?: string;
  // Per-series note/instructions
  note?: string;
}

export interface DraftBlock {
  displayName: string;
  fromWarmupTemplate?: boolean;
  id: string;
  warmupTemplateName?: string;
  type: BlockType;
  durationMinutes?: number;
  notes?: string;
  restSeconds?: number;
  roundsPlanned?: number;
  targetRpe?: number;
  workSeconds?: number;
  sortOrder?: number;
  // Strength fields
  setsPlanned?: number;
  repsPlanned?: number;
  repsRange?: string;
  targetRir?: number;
  repsPerSeries?: string;
  weightPerSeriesKg?: string;
  weightKg?: number;
  cardioWorkText?: string;
  intensityFcMax?: number;
  intensityFcReserve?: number;
  heartRate?: number;
  totalTimeSeconds?: number;
  // Add meta for Plan 72–73
  isGlobal?: boolean;
  /** ID of the library item this block references (exercise, cardio method, plio, warmup, sport, isometric) */
  libraryId?: string;
  /** Per-series data (new feature) */
  sets?: DraftSet[];
  /** Field keys that are locked (not editable by client) */
  lockedFields?: string[];
  /** Client-side group ID (references DraftExerciseGroup.id) */
  groupId?: string;
}

export interface DraftExerciseGroup {
  id: string;
  groupType: 'CIRCUIT' | 'SUPERSET';
  note?: string;
  sortOrder: number;
}

export interface DraftDay {
  blocks: DraftBlock[];
  groups?: DraftExerciseGroup[];
  id: string;
  title: string;
  warmupTemplates?: Array<{ id: string; name: string }>;
}

export interface NeatItem {
  id: string;
  title: string;
  description?: string;
}

export interface DraftState {
  days: DraftDay[];
  expectedCompletionDays?: null | number;
  name: string;
  neats?: NeatItem[];
  objectiveIds?: string[];
  scope?: 'GLOBAL' | 'COACH';
}
