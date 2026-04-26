// ── Performed exercises result ────────────────────────────────────────────────

export type PerformedExerciseItem = {
  id: string;
  name: string;
};

export type PerformedExercisesResult = {
  strength: PerformedExerciseItem[];
  cardio: PerformedExerciseItem[];
  plio: PerformedExerciseItem[];
  mobility: PerformedExerciseItem[];
  isometric: PerformedExerciseItem[];
  sport: PerformedExerciseItem[];
};

// ── Performed templates result ────────────────────────────────────────────────

export type PerformedTemplateItem = {
  id: string;
  name: string;
};

export type PerformedTemplatesResult = {
  templates: PerformedTemplateItem[];
};

export type PerformedSessionDayItem = {
  dayIndex: number;
  title: string;
};

export type PerformedSessionDaysResult = {
  days: PerformedSessionDayItem[];
};

// ── New detailed progress models ─────────────────────────────────────────────

export type ExerciseProgressPoint = {
  sessionDate: string;
  sessionId: string;
  sets: number;
  totalReps: number;
  tonnage: number;
  avgRpe: number | null;
  e1rm: number | null;
  inol: number | null;
  totalDurationSeconds: number | null;
  durationMinutes: number | null;
  avgHeartRate: number | null;
  avgPaceMinKm: number | null;
  fcReservePercent: number | null;
  plioEffort: number | null;
  setDetails: Array<{
    setIndex: number;
    reps: number | null;
    weightKg: number | null;
    rpe: number | null;
    e1rm: number | null;
    inol: number | null;
    tonnage: number;
  }>;
};

export type SessionProgressPoint = {
  sessionDate: string;
  sessionId: string;
  sessionTonnage: number;
  sessionInol: number | null;
  sessionRpe: number | null;
  effortIndex: number | null;
  trainingLoad: number | null;
  sessionEfficiency: number | null;
};

export type MicrocycleProgressPoint = {
  weekStart: string;
  totalTonnage: number;
  avgRpe: number | null;
  totalTrainingLoad: number | null;
  sessionsCount: number;
};

export type MicrocycleProgressResult = {
  cycleDays: number;
  points: MicrocycleProgressPoint[];
};

export type RecentSessionSummary = {
  sessionDate: string;
  sessionId: string;
  exerciseCount: number;
  totalTonnage: number;
  sessionInol: number | null;
  avgRpe: number | null;
  durationMinutes: number | null;
};

// ── Existing row types ────────────────────────────────────────────────────────

export type CardioLogRow = {
  avgHeartRate: null | number;
  distanceDoneMeters: null | number;
  durationSecondsDone: null | number;
  effortRpe: null | number;
  methodType: string;
  sessionDate: Date;
};

export type CardioWeeklyPoint = {
  avgHeartRate: null | number;
  avgRpe: null | number;
  methodType: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  weekStart: string;
};

export type SessionSrpeRow = {
  durationSeconds: null | number;
  effortRpe: null | number;
  sessionDate: Date;
};

export type SrpeWeeklyPoint = {
  totalSrpe: number;
  weekStart: string;
};

export type StrengthLogRow = {
  muscleGroup: string;
  repsDone: null | number;
  sessionDate: Date;
  weightDoneKg: null | number;
};

export type StrengthWeeklyPoint = {
  maxWeightKg: null | number;
  muscleGroup: string;
  totalReps: number;
  totalSets: number;
  volumeKg: number;
  weekStart: string;
};
