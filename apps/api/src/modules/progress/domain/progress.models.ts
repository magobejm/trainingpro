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
