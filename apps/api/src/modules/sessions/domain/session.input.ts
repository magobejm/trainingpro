export type EnsureSessionInput = {
  clientId: string;
  sessionDate: Date;
  templateId: string;
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
