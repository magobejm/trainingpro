export type SessionSetLog = {
  effortRpe: null | number;
  repsDone: null | number;
  setIndex: number;
  sessionItemId: string;
  weightDoneKg: null | number;
};

export type SessionStrengthItem = {
  displayName: string;
  id: string;
  logs: SessionSetLog[];
  repsMax: null | number;
  repsMin: null | number;
  setsPlanned: null | number;
  sortOrder: number;
};

export type SessionInstance = {
  clientId: string;
  finishComment: null | string;
  finishedAt: Date | null;
  id: string;
  isCompleted: boolean;
  isIncomplete: boolean;
  items: SessionStrengthItem[];
  sessionDate: Date;
  startedAt: Date | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  templateId: string;
  templateVersion: number;
};
