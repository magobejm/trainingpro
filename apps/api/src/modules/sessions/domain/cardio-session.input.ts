export type EnsureCardioSessionInput = {
  clientId: string;
  sessionDate: Date;
  templateId: string;
};

export type LogIntervalInput = {
  avgHeartRate?: null | number;
  avgHeartRateMax?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  hrMaxPctDone?: null | number;
  hrMaxPctDoneMax?: null | number;
  hrReservePctDone?: null | number;
  hrReservePctDoneMax?: null | number;
  intervalIndex: number;
  restSecondsDone?: null | number;
  sessionCardioBlockId: string;
  sessionId: string;
};
