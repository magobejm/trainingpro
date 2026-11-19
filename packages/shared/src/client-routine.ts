import type { SessionOutcome } from './session-outcome';
import type { WeekPhase } from './client-routine-lock';

/** Weeks beyond this many (the newest) are listed in a separate drawer. */
export const CLIENT_ROUTINE_VISIBLE_WEEKS = 16;

export type RoutineEditorLogged = {
  reps: number | null;
  restSeconds: number | null;
  rir: number | null;
  rpe: number | null;
  weightKg: number | null;
};

export type RoutineEditorSet = {
  advancedTechnique: string | null;
  id: string;
  /** What the client did. Null until it is logged, and for skipped days. */
  logged: RoutineEditorLogged | null;
  note: string | null;
  reps: number | null;
  restSeconds: number | null;
  rir: number | null;
  rpe: number | null;
  setIndex: number;
  weightKg: number | null;
};

export type RoutineEditorExercise = {
  displayName: string;
  exerciseLibraryId: string | null;
  groupId: string | null;
  id: string;
  /** Sport blocks keep a duration; every other kind leaves this empty. */
  durationMinutes: number | null;
  lockedFields: string[];
  notes: string | null;
  /** "8-12" or "10" for strength, plyometrics and mobility. Empty when the kind has no range. */
  repsRange: string | null;
  restSeconds: number | null;
  sets: RoutineEditorSet[];
  sortOrder: number;
};

/** One prescribed set of a cardio, isometric, mobility, plio or sport block. Columns a kind lacks stay null. */
export type RoutineEditorBlockSet = {
  advancedTechnique: string | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  fcMaxPct: number | null;
  fcMaxPctMax: number | null;
  fcReservePct: number | null;
  fcReservePctMax: number | null;
  heartRate: number | null;
  heartRateMax: number | null;
  id: string;
  note: string | null;
  reps: number | null;
  restSeconds: number | null;
  rir: number | null;
  rom: string | null;
  rpe: number | null;
  setIndex: number;
  weightKg: number | null;
};
export type RoutineEditorTimedSet = RoutineEditorBlockSet;

export type RoutineEditorBlockKind = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport';
export type RoutineEditorItemKind = 'exercise' | RoutineEditorBlockKind;

export type RoutineEditorBlock = {
  displayName: string;
  groupId: string | null;
  id: string;
  kind: RoutineEditorBlockKind;
  /** Sport blocks keep a duration; every other kind leaves this empty. */
  durationMinutes: number | null;
  /** Variables the coach left for the client to fill in. */
  lockedFields: string[];
  notes: string | null;
  /** "8-12" or "10" for plyometrics and mobility. Empty for the other block kinds. */
  repsRange: string | null;
  sets: RoutineEditorBlockSet[];
  sortOrder: number;
};

/** Fields the coach can change on one set of a non-strength block. */
export type RoutineEditorBlockSetPatch = Partial<Omit<RoutineEditorBlockSet, 'id' | 'setIndex'>>;

/** Notes, locked variables and the exercise-level prescription of an exercise or block. */
export type RoutineEditorItemMeta = {
  durationMinutes?: number;
  lockedFields?: string[];
  notes?: string | null;
  repsRange?: string | null;
};

export type RoutineEditorGroup = { groupType: 'CIRCUIT' | 'SUPERSET'; id: string; note: string | null };

export type RoutineEditorWarmup = { id: string; name: string; warmupTemplateId: string };

export type RoutineEditorDay = {
  blocks: RoutineEditorBlock[];
  dayIndex: number;
  exercises: RoutineEditorExercise[];
  groups: RoutineEditorGroup[];
  id: string;
  /** False when the day is read-only: finished, skipped, started, or inside a completed week. */
  editable: boolean;
  outcome: SessionOutcome | null;
  planned: boolean;
  scheduledDates: string[];
  title: string;
  warmups: RoutineEditorWarmup[];
};

export type RoutineEditorWeek = {
  days: RoutineEditorDay[];
  endsOn: string;
  id: string;
  phase: WeekPhase;
  readOnly: boolean;
  startsOn: string;
  weekIndex: number;
};

export type RoutineEditorWeekSummary = Pick<RoutineEditorWeek, 'endsOn' | 'id' | 'phase' | 'startsOn' | 'weekIndex'>;

export type RoutineEditorResponse = {
  /** Weeks older than the visible window, without their days. */
  olderWeeks: RoutineEditorWeekSummary[];
  routine: { cycleDays: number; cycleStartsOn: string; id: string; name: string } | null;
  weeks: RoutineEditorWeek[];
};

/** Fields the coach can change on one prescribed set. */
export type RoutineEditorSetPatch = Partial<
  Pick<RoutineEditorSet, 'advancedTechnique' | 'note' | 'reps' | 'restSeconds' | 'rir' | 'rpe' | 'weightKg'>
>;
