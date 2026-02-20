import type {
  CardioLogRow,
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

export interface ProgressRepositoryPort {
  readCardioLogs(context: AuthContext, query: ProgressQuery): Promise<CardioLogRow[]>;
  readSessionSrpeRows(context: AuthContext, query: ProgressQuery): Promise<SessionSrpeRow[]>;
  readStrengthLogs(context: AuthContext, query: ProgressQuery): Promise<StrengthLogRow[]>;
}
