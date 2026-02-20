export type EnsureCardioSessionInput = {
  clientId: string;
  sessionDate: Date;
  templateId: string;
};

export type LogIntervalInput = {
  avgHeartRate?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
  sessionId: string;
};
