export type EnsureSessionInput = {
  clientId: string;
  sessionDate: Date;
  templateId: string;
  /** When set, materializes that plan day and stores snapshot (index/title) on the session. */
  planDayId?: string;
};

export type EnsureSessionForClientInput = EnsureSessionInput & {
  coachMembershipId: string;
  organizationId: string;
};

export type FinishSessionInput = {
  comment?: null | string;
  isIncomplete: boolean;
  postFatigue?: null | number;
  postMood?: null | number;
  postPain?: null | number;
  sessionId: string;
};

export type StartSessionInput = {
  preFatigue?: null | number;
  preMotivation?: null | number;
  preRecovery?: null | number;
  sessionId: string;
  startMode?: null | 'INTERACTIVE' | 'TIMER';
};

export type LogSetInput = {
  effortRir?: null | number;
  effortRpe?: null | number;
  repsDone?: null | number;
  sessionId: string;
  sessionItemId: string;
  setIndex: number;
  weightDoneKg?: null | number;
};
