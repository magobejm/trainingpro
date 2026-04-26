export type EnsureSessionInput = {
  clientId: string;
  sessionDate: Date;
  templateId: string;
  /** When set, materializes that plan day and stores snapshot (index/title) on the session. */
  planDayId?: string;
};

export type FinishSessionInput = {
  comment?: null | string;
  isIncomplete: boolean;
  sessionId: string;
};

export type LogSetInput = {
  effortRpe?: null | number;
  repsDone?: null | number;
  sessionId: string;
  sessionItemId: string;
  setIndex: number;
  weightDoneKg?: null | number;
};
