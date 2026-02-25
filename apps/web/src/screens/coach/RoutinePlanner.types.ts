export type BlockType = 'cardio' | 'plio' | 'sport' | 'strength' | 'warmup';

export interface DraftBlock {
  displayName: string;
  id: string;
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
  targetRir?: number;
  // Add meta for Plan 72
  isGlobal?: boolean;
}

export interface DraftDay {
  blocks: DraftBlock[];
  id: string;
  title: string;
}

export interface DraftState {
  days: DraftDay[];
  name: string;
  scope?: 'GLOBAL' | 'COACH';
}
