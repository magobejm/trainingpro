import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { REPORTS_REPOSITORY, type ReportsRepositoryPort } from '../../domain/reports.repository.port';
import type { UpsertWeeklyReportInput } from '../../domain/weekly-report.input';

@Injectable()
export class UpsertWeeklyReportUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepositoryPort,
  ) {}

  execute(context: AuthContext, input: UpsertWeeklyReportInput) {
    return this.reportsRepository.upsertWeeklyReport(context, input);
  }
}
