import type { SessionInstance } from './session.entity';

export type CardioIntervalLog = {
  avgHeartRate: null | number;
  distanceDoneMeters: null | number;
  durationSecondsDone: null | number;
  effortRpe: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
};

export type CardioSessionBlock = {
  displayName: string;
  id: string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters: null | number;
  targetRpe: null | number;
  workSeconds: number;
};

export type CardioSessionInstance = {
  blocks: CardioSessionBlock[];
  clientId: string;
  finishComment: null | string;
  finishedAt: Date | null;
  id: string;
  isCompleted: boolean;
  isIncomplete: boolean;
  sessionDate: Date;
  startedAt: Date | null;
  status: SessionInstance['status'];
  templateId: string;
  templateVersion: number;
};
