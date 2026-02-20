import type { AuthContext } from '../../../common/auth-context/auth-context';
import type {
  CardioIntervalLog,
  CardioSessionInstance,
} from './cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from './cardio-session.input';
import type { EnsureSessionInput, FinishSessionInput, LogSetInput } from './session.input';
import type { SessionInstance, SessionSetLog } from './session.entity';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface SessionsRepositoryPort {
  canAccessSession(context: AuthContext, sessionId: string): Promise<boolean>;
  ensureCardioSession(
    context: AuthContext,
    input: EnsureCardioSessionInput,
  ): Promise<CardioSessionInstance>;
  ensureSession(context: AuthContext, input: EnsureSessionInput): Promise<SessionInstance>;
  finishCardioSession(
    context: AuthContext,
    input: FinishSessionInput,
  ): Promise<CardioSessionInstance>;
  finishSession(context: AuthContext, input: FinishSessionInput): Promise<SessionInstance>;
  getCardioSessionById(
    context: AuthContext,
    sessionId: string,
  ): Promise<CardioSessionInstance | null>;
  getSessionById(context: AuthContext, sessionId: string): Promise<SessionInstance | null>;
  logInterval(context: AuthContext, input: LogIntervalInput): Promise<CardioIntervalLog>;
  logSet(context: AuthContext, input: LogSetInput): Promise<SessionSetLog>;
  startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance>;
  startSession(context: AuthContext, sessionId: string): Promise<SessionInstance>;
}
