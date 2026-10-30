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
  notes: string | null;
  restSeconds: number | null;
  sets: RoutineEditorSet[];
  sortOrder: number;
};

export type RoutineEditorBlock = {
  displayName: string;
  id: string;
  kind: 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport';
  sortOrder: number;
};

export type RoutineEditorGroup = { groupType: 'CIRCUIT' | 'SUPERSET'; id: string; note: string | null };

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
