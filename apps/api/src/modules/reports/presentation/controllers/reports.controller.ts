import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { GetWeeklyReportUseCase } from '../../application/use-cases/get-weekly-report.usecase';
import { UpsertWeeklyReportUseCase } from '../../application/use-cases/upsert-weekly-report.usecase';
import { GetWeeklyReportQueryDto } from '../dto/get-weekly-report-query.dto';
import { UpsertWeeklyReportDto } from '../dto/upsert-weekly-report.dto';

@Controller('reports/weekly')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ReportsController {
  constructor(
    private readonly getWeeklyReportUseCase: GetWeeklyReportUseCase,
    private readonly upsertWeeklyReportUseCase: UpsertWeeklyReportUseCase,
  ) {}

  @Get()
  async getOne(@Query() query: GetWeeklyReportQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const report = await this.getWeeklyReportUseCase.execute(auth, new Date(query.reportDate));
    return mapWeeklyReport(report);
  }

  @Post()
  async upsert(@Body() body: UpsertWeeklyReportDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const report = await this.upsertWeeklyReportUseCase.execute(auth, {
      adherencePercent: body.adherencePercent,
      energy: body.energy,
      mood: body.mood,
      notes: body.notes,
      reportDate: new Date(body.reportDate),
      sleepHours: body.sleepHours,
      sourceSessionId: body.sourceSessionId,
    });
    return mapWeeklyReport(report);
  }
}

function mapWeeklyReport(report: Awaited<ReturnType<GetWeeklyReportUseCase['execute']>>) {
  if (!report) {
    return null;
  }
  return {
    ...report,
    reportDate: report.reportDate.toISOString().slice(0, 10),
    weekStartDate: report.weekStartDate.toISOString().slice(0, 10),
  };
}
