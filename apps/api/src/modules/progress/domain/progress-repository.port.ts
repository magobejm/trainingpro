import type {
  CardioLogRow,
  ExerciseProgressPoint,
  MicrocycleProgressPoint,
  RecentSessionSummary,
  SessionProgressPoint,
  SessionSrpeRow,
  StrengthLogRow,
} from './progress.models';
import type { AuthContext } from '../../../common/auth-context/auth-context';

export const PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');

export type ProgressQuery = {
  clientId?: string;
  from: Date;
  to: Date;
};

export type ExerciseProgressQuery = {
  clientId?: string;
  exerciseId: string;
  from: Date;
  to: Date;
};

export type SessionProgressQuery = {
  clientId?: string;
  templateId: string;
  dayIndex?: number;
  from: Date;
  to: Date;
};

export type MicrocycleProgressQuery = {
  clientId?: string;
  templateId: string;
  from: Date;
  to: Date;
};

export type RecentSessionsQuery = {
  clientId?: string;
  exerciseId?: string;
  templateId?: string;
  from: Date;
  to: Date;
  limit: number;
};

export interface ProgressRepositoryPort {
  readCardioLogs(context: AuthContext, query: ProgressQuery): Promise<CardioLogRow[]>;
  readSessionSrpeRows(context: AuthContext, query: ProgressQuery): Promise<SessionSrpeRow[]>;
  readStrengthLogs(context: AuthContext, query: ProgressQuery): Promise<StrengthLogRow[]>;
  readExerciseProgress(context: AuthContext, query: ExerciseProgressQuery): Promise<ExerciseProgressPoint[]>;
  readSessionProgress(context: AuthContext, query: SessionProgressQuery): Promise<SessionProgressPoint[]>;
  readMicrocycleProgress(context: AuthContext, query: MicrocycleProgressQuery): Promise<MicrocycleProgressPoint[]>;
  readRecentSessions(context: AuthContext, query: RecentSessionsQuery): Promise<RecentSessionSummary[]>;
}
