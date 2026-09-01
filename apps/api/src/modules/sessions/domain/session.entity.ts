export type SessionPlannedSet = {
  advancedTechnique: null | string;
  note: null | string;
  setIndex: number;
};

export type SessionSetLog = {
  effortRir: null | number;
  effortRpe: null | number;
  repsDone: null | number;
  setIndex: number;
  sessionItemId: string;
  weightDoneKg: null | number;
};

export type ExerciseGroupFields = {
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
};

export type SessionStrengthItem = {
  type: 'strength';
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  logs: SessionSetLog[];
  notes: null | string;
  plannedSets: SessionPlannedSet[];
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  sourceExerciseId: null | string;
  targetRir: null | number;
  targetRpe: null | number;
  weightRangeMaxKg: null | number;
  weightRangeMinKg: null | number;
};

export type ExerciseHistoryEntry = {
  effortRir: null | number;
  effortRpe: null | number;
  repsDone: null | number;
  sessionDate: Date;
  weightDoneKg: null | number;
};

export type SessionPlioSetLog = {
  effortRpe: null | number;
  repsDone: null | number;
  sessionPlioBlockId: string;
  setIndex: number;
  weightDoneKg: null | number;
};

export type SessionMobilitySetLog = {
  effortRpe: null | number;
  repsDone: null | number;
  romDone: null | string;
  sessionMobilityBlockId: string;
  setIndex: number;
};

export type SessionIsometricSetLog = {
  durationSecondsDone: null | number;
  effortRpe: null | number;
  sessionIsometricBlockId: string;
  setIndex: number;
  weightDoneKg: null | number;
};

export type SessionSportLog = {
  avgHeartRate: null | number;
  durationMinutesDone: null | number;
  effortRpe: null | number;
  sessionSportBlockId: string;
};

export type SessionPlioItem = {
  type: 'plio';
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  logs: SessionPlioSetLog[];
  notes: null | string;
  plannedSets: SessionPlannedSet[];
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe: null | number;
  workSeconds: number;
};

export type SessionMobilityItem = {
  type: 'mobility';
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  logs: SessionMobilitySetLog[];
  notes: null | string;
  plannedSets: SessionPlannedSet[];
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe: null | number;
  workSeconds: number;
};

export type SessionIsometricItem = {
  type: 'isometric';
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  logs: SessionIsometricSetLog[];
  notes: null | string;
  plannedSets: SessionPlannedSet[];
  restSeconds: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  targetRpe: null | number;
};

export type SessionSportItem = {
  type: 'sport';
  coachInstructions: null | string;
  displayName: string;
  durationMinutes: number;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  log: SessionSportLog | null;
  notes: null | string;
  plannedSets: SessionPlannedSet[];
  sortOrder: number;
  targetRpe: null | number;
};

export type SessionBlockItem = {
  type: 'isometric' | 'mobility' | 'plio' | 'sport';
  displayName: string;
  id: string;
  meta: string;
  sortOrder: number;
};

export type SessionIntervalLog = {
  avgHeartRate: null | number;
  distanceDoneMeters: null | number;
  durationSecondsDone: null | number;
  effortRpe: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
};

export type CardioSessionItem = {
  type: 'cardio';
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  intervalLogs: SessionIntervalLog[];
  notes: null | string;
  plannedSets: SessionPlannedSet[];
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters: null | number;
  targetRpe: null | number;
  workSeconds: number;
};

export type SessionItem =
  | CardioSessionItem
  | SessionIsometricItem
  | SessionMobilityItem
  | SessionPlioItem
  | SessionSportItem
  | SessionStrengthItem;

export type SessionStartMode = 'INTERACTIVE' | 'TIMER';

export type SessionInstance = {
  clientId: string;
  finishComment: null | string;
  finishedAt: Date | null;
  id: string;
  isCompleted: boolean;
  isIncomplete: boolean;
  items: SessionItem[];
  postFatigue: null | number;
  postMood: null | number;
  postPain: null | number;
  preFatigue: null | number;
  preMotivation: null | number;
  preRecovery: null | number;
  sessionDate: Date;
  startMode: null | SessionStartMode;
  startedAt: Date | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  templateId: string;
  templateVersion: number;
};
