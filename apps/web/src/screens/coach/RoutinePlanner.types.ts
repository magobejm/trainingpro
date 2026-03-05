export type BlockType = 'cardio' | 'plio' | 'sport' | 'strength' | 'warmup';

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
  /** ID of the library item this block references (exercise, cardio method, plio, warmup, sport) */
  libraryId?: string;
}

export interface DraftDay {
  blocks: DraftBlock[];
  id: string;
  title: string;
}

export interface DraftState {
  days: DraftDay[];
  expectedCompletionDays?: null | number;
  name: string;
  objectiveIds?: string[];
  scope?: 'GLOBAL' | 'COACH';
}
