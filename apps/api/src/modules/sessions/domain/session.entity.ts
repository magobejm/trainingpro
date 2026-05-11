export type SessionSetLog = {
  effortRir: null | number;
  effortRpe: null | number;
  repsDone: null | number;
  setIndex: number;
  sessionItemId: string;
  weightDoneKg: null | number;
};

export type SessionStrengthItem = {
  type: 'strength';
  displayName: string;
  id: string;
  logs: SessionSetLog[];
  notes: null | string;
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

export type SessionBlockItem = {
  type: 'isometric' | 'mobility' | 'plio' | 'sport';
  displayName: string;
  id: string;
  meta: string;
  sortOrder: number;
};

export type SessionItem = SessionBlockItem | SessionStrengthItem;

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
