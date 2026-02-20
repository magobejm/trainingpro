import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { REPORTS_REPOSITORY, type ReportsRepositoryPort } from '../../domain/reports.repository.port';

@Injectable()
export class GetWeeklyReportUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepositoryPort,
  ) {}

  execute(context: AuthContext, reportDate: Date) {
    return this.reportsRepository.getWeeklyReportByDate(context, reportDate);
  }
}
