import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { CardioIntervalLog, CardioSessionInstance } from './cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from './cardio-session.input';
import type {
  EnsureSessionInput,
  EnsureSessionForClientInput,
  FinishSessionInput,
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
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
} from './session.entity';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface SessionsRepositoryPort {
  canAccessSession(context: AuthContext, sessionId: string): Promise<boolean>;
  ensureCardioSession(context: AuthContext, input: EnsureCardioSessionInput): Promise<CardioSessionInstance>;
  ensureSession(context: AuthContext, input: EnsureSessionInput): Promise<SessionInstance>;
  ensureSessionForClient(context: AuthContext, input: EnsureSessionForClientInput): Promise<SessionInstance>;
  findExerciseHistory(clientId: string, sourceExerciseId: string, limit: number): Promise<ExerciseHistoryEntry[]>;
  finishCardioSession(context: AuthContext, input: FinishSessionInput): Promise<CardioSessionInstance>;
  finishSession(context: AuthContext, input: FinishSessionInput): Promise<SessionInstance>;
  getCardioSessionById(context: AuthContext, sessionId: string): Promise<CardioSessionInstance | null>;
  getSessionById(context: AuthContext, sessionId: string): Promise<SessionInstance | null>;
  logInterval(context: AuthContext, input: LogIntervalInput): Promise<CardioIntervalLog>;
  logIsometricSet(context: AuthContext, input: LogIsometricSetInput): Promise<SessionIsometricSetLog>;
  logMobilitySet(context: AuthContext, input: LogMobilitySetInput): Promise<SessionMobilitySetLog>;
  logPlioSet(context: AuthContext, input: LogPlioSetInput): Promise<SessionPlioSetLog>;
  logSet(context: AuthContext, input: LogSetInput): Promise<SessionSetLog>;
  logSport(context: AuthContext, input: LogSportInput): Promise<SessionSportLog>;
  startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance>;
  startSession(context: AuthContext, input: StartSessionInput): Promise<SessionInstance>;
}
