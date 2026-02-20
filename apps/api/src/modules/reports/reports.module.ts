import { Module } from '@nestjs/common';
import { ExportWeeklyPdfUseCase } from './application/use-cases/export-weekly-pdf.usecase';
import { AuthModule } from '../auth/auth.module';
import { GetWeeklyReportUseCase } from './application/use-cases/get-weekly-report.usecase';
import { UpsertWeeklyReportUseCase } from './application/use-cases/upsert-weekly-report.usecase';
import { WeeklyReportPolicy } from './domain/policies/weekly-report.policy';
import { REPORTS_REPOSITORY } from './domain/reports.repository.port';
import { ReportsRepositoryPrisma } from './infra/prisma/reports.repository.prisma';
import { ReportExportsController } from './presentation/controllers/report-exports.controller';
import { ReportsController } from './presentation/controllers/reports.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController, ReportExportsController],
  providers: [
    ExportWeeklyPdfUseCase,
    GetWeeklyReportUseCase,
    UpsertWeeklyReportUseCase,
    WeeklyReportPolicy,
    ReportsRepositoryPrisma,
    {
      provide: REPORTS_REPOSITORY,
      useExisting: ReportsRepositoryPrisma,
    },
  ],
})
export class ReportsModule {}
