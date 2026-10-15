import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { FILE_STORAGE, type FileStoragePort } from '../../../files/domain/file-storage.port';
import { PrivateMediaUrlSigner } from '../../../files/domain/private-media-url-signer';
import { toStoredFileUrls } from '../../../files/domain/resolve-stored-file-url';
import { EnsureClientSelfSessionUseCase } from '../../application/use-cases/ensure-client-self-session.usecase';
import { GetClientCalendarSummaryUseCase } from '../../application/use-cases/get-client-calendar-summary.usecase';
import { GetClientExerciseHistoryUseCase } from '../../application/use-cases/get-client-exercise-history.usecase';
import { GetClientMeUseCase } from '../../application/use-cases/get-client-me.usecase';
import { GetClientPlanDayUseCase } from '../../application/use-cases/get-client-plan-day.usecase';
import { GetClientRoutineUseCase } from '../../application/use-cases/get-client-routine.usecase';
import { ListClientCalendarUseCase } from '../../application/use-cases/list-client-calendar.usecase';
import { ListClientSessionsUseCase } from '../../application/use-cases/list-client-sessions.usecase';
import {
  SkipClientSessionUseCase,
  UndoClientSessionSkipUseCase,
} from '../../application/use-cases/skip-client-session.usecase';
import { ListClientWellnessUseCase } from '../../application/use-cases/list-client-wellness.usecase';
import { SaveClientDayNoteUseCase } from '../../application/use-cases/save-client-day-note.usecase';
import type { ClientRoutine } from '../../domain/client-routine';
import { ClientCalendarQueryDto, ClientWellnessQueryDto } from '../dto/client-calendar-query.dto';
import { ClientDayNoteParamDto, SaveClientDayNoteDto } from '../dto/save-client-day-note.dto';
import { EnsureClientSelfSessionDto } from '../dto/ensure-client-self-session.dto';
import { SkipClientSessionDto } from '../dto/skip-client-session.dto';
import { SessionIdParamDto } from '../../../sessions/presentation/dto/session-id-param.dto';
import { readTimezoneOffset } from '../../../sessions/presentation/read-timezone-offset';
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
    private readonly getClientPlanDayUseCase: GetClientPlanDayUseCase,
    private readonly getClientRoutineUseCase: GetClientRoutineUseCase,
    private readonly listClientCalendarUseCase: ListClientCalendarUseCase,
    private readonly listClientSessionsUseCase: ListClientSessionsUseCase,
    private readonly listClientWellnessUseCase: ListClientWellnessUseCase,
    private readonly saveClientDayNoteUseCase: SaveClientDayNoteUseCase,
    private readonly skipClientSessionUseCase: SkipClientSessionUseCase,
    private readonly undoClientSessionSkipUseCase: UndoClientSessionSkipUseCase,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
    private readonly mediaUrls: PrivateMediaUrlSigner,
  ) {}

  @Get('me')
  async getMe(@Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const client = await this.getClientMeUseCase.execute(context);
    return mapClientOutput(client, toStoredFileUrls(this.storage, this.mediaUrls));
  }

  @Get('me/routine')
  async getMyRoutine(@Req() request: HttpAuthRequest): Promise<ClientRoutine> {
    const context = readAuthContext(request);
    return this.getClientRoutineUseCase.execute(context);
  }

  @Get('me/plan-days/:planDayId')
  async getMyPlanDay(@Param('planDayId') planDayId: string, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    return this.getClientPlanDayUseCase.execute(context, planDayId);
  }

  @Get('me/exercises/:sourceExerciseId/history')
  async getExerciseHistory(
    @Param('sourceExerciseId') sourceExerciseId: string,
    @Query('limit') limit: string | undefined,
    @Query('excludeSessionId', new ParseUUIDPipe({ optional: true })) excludeSessionId: string | undefined,
    @Req() request: HttpAuthRequest,
  ) {
    const context = readAuthContext(request);
    const value = Number(limit);
    const parsedLimit = Number.isFinite(value) && value > 0 ? Math.max(1, Math.min(10, Math.floor(value))) : 5;
    const entries = await this.getClientExerciseHistoryUseCase.execute(
      context,
      sourceExerciseId,
      parsedLimit,
      excludeSessionId,
    );
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

  @Put('me/calendar/notes/:date')
  async saveMyDayNote(
    @Param() params: ClientDayNoteParamDto,
    @Body() body: SaveClientDayNoteDto,
    @Req() request: HttpAuthRequest,
  ) {
    return this.saveClientDayNoteUseCase.execute(readAuthContext(request), params.date, body.content);
  }

  @Get('me/sessions')
  async getMySessions(@Query() query: ClientCalendarQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const { dateFrom, dateTo } = ClientCalendarQueryDto.schema.parse(query);
    const rows = await this.listClientSessionsUseCase.execute(context, {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
    return rows.map((r) => ({
      ...r,
      sessionDate: r.sessionDate.toISOString().slice(0, 10),
      skippedAt: r.skippedAt ? r.skippedAt.toISOString() : null,
    }));
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
  async getMyWellness(@Query() query: ClientWellnessQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const { dateFrom, dateTo } = ClientWellnessQueryDto.schema.parse(query);
    return this.listClientWellnessUseCase.execute(context, {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
  }

  @Post('me/sessions/skip')
  async skipMySession(
    @Body() body: SkipClientSessionDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    return this.skipClientSessionUseCase.execute(readAuthContext(request), {
      offsetMinutes: readTimezoneOffset(timezoneOffset),
      planDayId: body.planDayId,
      reason: body.reason,
      sessionDate: new Date(body.sessionDate),
    });
  }

  @Delete('me/sessions/:sessionId/skip')
  async undoMySessionSkip(@Param() params: SessionIdParamDto, @Req() request: HttpAuthRequest) {
    return this.undoClientSessionSkipUseCase.execute(readAuthContext(request), params.sessionId);
  }

  @Post('me/sessions/ensure')
  async ensureMySession(@Body() body: EnsureClientSelfSessionDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    const session = await this.ensureClientSelfSessionUseCase.execute(context, {
      confirmDayChange: body.confirmDayChange,
      planDayId: body.planDayId,
      sessionDate: new Date(body.sessionDate),
    });
    return {
      ...session,
      finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
      sessionDate: session.sessionDate.toISOString().slice(0, 10),
      startedAt: session.startedAt ? session.startedAt.toISOString() : null,
    };
  }
}
