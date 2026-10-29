import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { CardioIntervalLog, CardioSessionInstance } from './cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from './cardio-session.input';
import type {
  EnsureSessionInput,
  EnsureSessionForClientInput,
  FinishExerciseInput,
  FinishSessionInput,
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
  LogSportSetInput,
  StartSessionInput,
} from './session.input';
import type {
  ExerciseHistoryEntry,
  SessionInstance,
  SessionIsometricSetLog,
  SessionMobilitySetLog,
  SessionPlioSetLog,
  SessionSetLog,
  SessionSportLog,
  SessionSportSetLog,
} from './session.entity';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export type SessionWriteOptions = { closeStale?: boolean };

export interface SessionsRepositoryPort {
  canAccessSession(context: AuthContext, sessionId: string): Promise<boolean>;
  discardSession(context: AuthContext, sessionId: string): Promise<SessionInstance>;
  ensureCardioSession(context: AuthContext, input: EnsureCardioSessionInput): Promise<CardioSessionInstance>;
  ensureSession(context: AuthContext, input: EnsureSessionInput): Promise<SessionInstance>;
  ensureSessionForClient(context: AuthContext, input: EnsureSessionForClientInput): Promise<SessionInstance>;
  findExerciseHistory(
    clientId: string,
    sourceExerciseId: string,
    limit: number,
    excludeSessionId?: string,
  ): Promise<ExerciseHistoryEntry[]>;
  finishCardioSession(context: AuthContext, input: FinishSessionInput): Promise<CardioSessionInstance>;
  finishExercise(context: AuthContext, input: FinishExerciseInput, options?: SessionWriteOptions): Promise<SessionInstance>;
  finishSession(context: AuthContext, input: FinishSessionInput): Promise<SessionInstance>;
  getCardioSessionById(
    context: AuthContext,
    sessionId: string,
    options?: SessionWriteOptions,
  ): Promise<CardioSessionInstance | null>;
  getSessionById(context: AuthContext, sessionId: string, options?: SessionWriteOptions): Promise<SessionInstance | null>;
  logCardioDistance(
    context: AuthContext,
    input: { sessionId: string; blockId: string; distanceDoneMeters: number | null },
    options?: SessionWriteOptions,
  ): Promise<{ id: string; distanceDoneMeters: number | null }>;
  logInterval(
    context: AuthContext,
    input: LogIntervalInput,
    options?: SessionWriteOptions,
  ): Promise<CardioIntervalLog | null>;
  logIsometricSet(
    context: AuthContext,
    input: LogIsometricSetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionIsometricSetLog>;
  logMobilitySet(
    context: AuthContext,
    input: LogMobilitySetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionMobilitySetLog>;
  logPlioSet(context: AuthContext, input: LogPlioSetInput, options?: SessionWriteOptions): Promise<null | SessionPlioSetLog>;
  logSet(context: AuthContext, input: LogSetInput, options?: SessionWriteOptions): Promise<null | SessionSetLog>;
  logSport(context: AuthContext, input: LogSportInput, options?: SessionWriteOptions): Promise<null | SessionSportLog>;
  logSportSet(
    context: AuthContext,
    input: LogSportSetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionSportSetLog>;
  startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance>;
  startSession(context: AuthContext, input: StartSessionInput): Promise<SessionInstance>;
}
