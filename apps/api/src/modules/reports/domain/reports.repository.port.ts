import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { UpsertWeeklyReportInput } from './weekly-report.input';
import type { WeeklyReportView } from './weekly-report.entity';

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

export interface ReportsRepositoryPort {
  getWeeklyReportByDate(context: AuthContext, reportDate: Date): Promise<null | WeeklyReportView>;
  upsertWeeklyReport(
    context: AuthContext,
    input: UpsertWeeklyReportInput,
  ): Promise<WeeklyReportView>;
}
