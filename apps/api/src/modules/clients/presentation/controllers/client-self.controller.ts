import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { FILE_STORAGE, type FileStoragePort } from '../../../files/domain/file-storage.port';
import { EnsureClientSelfSessionUseCase } from '../../application/use-cases/ensure-client-self-session.usecase';
import { GetClientCalendarSummaryUseCase } from '../../application/use-cases/get-client-calendar-summary.usecase';
import { GetClientExerciseHistoryUseCase } from '../../application/use-cases/get-client-exercise-history.usecase';
import { GetClientMeUseCase } from '../../application/use-cases/get-client-me.usecase';
import { GetClientRoutineUseCase } from '../../application/use-cases/get-client-routine.usecase';
import { ListClientCalendarUseCase } from '../../application/use-cases/list-client-calendar.usecase';
import { ListClientSessionsUseCase } from '../../application/use-cases/list-client-sessions.usecase';
import { ListClientWellnessUseCase } from '../../application/use-cases/list-client-wellness.usecase';
import type { ClientRoutine } from '../../domain/client-routine';
import { ClientCalendarQueryDto } from '../dto/client-calendar-query.dto';
import { EnsureClientSelfSessionDto } from '../dto/ensure-client-self-session.dto';
import { mapClientOutput } from './clients.controller.mappers';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientSelfController {
  constructor(
    private readonly ensureClientSelfSessionUseCase: EnsureClientSelfSessionUseCase,
    private readonly getClientCalendarSummaryUseCase: GetClientCalendarSummaryUseCase,
    private readonly getClientExerciseHistoryUseCase: GetClientExerciseHistoryUseCase,
    private readonly getClientMeUseCase: GetClientMeUseCase,
    private readonly getClientRoutineUseCase: GetClientRoutineUseCase,
    private readonly listClientCalendarUseCase: ListClientCalendarUseCase,
    private readonly listClientSessionsUseCase: ListClientSessionsUseCase,
    private readonly listClientWellnessUseCase: ListClientWellnessUseCase,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
  ) {}

  @Get('me')
  async getMe(@Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const client = await this.getClientMeUseCase.execute(context);
    return mapClientOutput(client, this.storage);
  }

  @Get('me/routine')
  async getMyRoutine(@Req() request: HttpAuthRequest): Promise<ClientRoutine> {
    const context = readAuthContext(request);
    return this.getClientRoutineUseCase.execute(context);
  }

  @Get('me/exercises/:sourceExerciseId/history')
  async getExerciseHistory(
    @Param('sourceExerciseId') sourceExerciseId: string,
    @Query('limit') limit: string | undefined,
    @Req() request: HttpAuthRequest,
  ) {
    const context = readAuthContext(request);
    const parsedLimit = limit ? Math.max(1, Math.min(10, Number(limit))) : 3;
    const entries = await this.getClientExerciseHistoryUseCase.execute(context, sourceExerciseId, parsedLimit);
    return entries.map((e) => ({
      ...e,
      sessionDate: e.sessionDate.toISOString().slice(0, 10),
    }));
  }

  @Get('me/calendar')
  async getMyCalendar(@Query() query: ClientCalendarQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const { dateFrom, dateTo } = ClientCalendarQueryDto.schema.parse(query);
    return this.listClientCalendarUseCase.execute(context, { dateFrom: new Date(dateFrom), dateTo: new Date(dateTo) });
  }

  @Get('me/sessions')
  async getMySessions(@Query() query: ClientCalendarQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const { dateFrom, dateTo } = ClientCalendarQueryDto.schema.parse(query);
    const rows = await this.listClientSessionsUseCase.execute(context, {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
    return rows.map((r) => ({ ...r, sessionDate: r.sessionDate.toISOString().slice(0, 10) }));
  }

  @Get('me/calendar-summary')
  async getMyCalendarSummary(@Query() query: ClientCalendarQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const { dateFrom, dateTo } = ClientCalendarQueryDto.schema.parse(query);
    return this.getClientCalendarSummaryUseCase.execute(context, {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
  }

  @Get('me/wellness')
  async getMyWellness(@Query() query: ClientCalendarQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const { dateFrom, dateTo } = ClientCalendarQueryDto.schema.parse(query);
    return this.listClientWellnessUseCase.execute(context, {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
  }

  @Post('me/sessions/ensure')
  async ensureMySession(@Body() body: EnsureClientSelfSessionDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const session = await this.ensureClientSelfSessionUseCase.execute(context, {
      sessionDate: new Date(body.sessionDate),
      planDayId: body.planDayId,
    });
    return {
      ...session,
      finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
      sessionDate: session.sessionDate.toISOString().slice(0, 10),
      startedAt: session.startedAt ? session.startedAt.toISOString() : null,
    };
  }
}
