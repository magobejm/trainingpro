import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { EnsureSessionUseCase } from '../../application/use-cases/ensure-session.usecase';
import { FinishSessionUseCase } from '../../application/use-cases/finish-session.usecase';
import { GetSessionUseCase } from '../../application/use-cases/get-session.usecase';
import { LogIntervalUseCase } from '../../application/use-cases/log-interval.usecase';
import { LogIsometricSetUseCase } from '../../application/use-cases/log-isometric-set.usecase';
import { LogMobilitySetUseCase } from '../../application/use-cases/log-mobility-set.usecase';
import { LogPlioSetUseCase } from '../../application/use-cases/log-plio-set.usecase';
import { LogSetUseCase } from '../../application/use-cases/log-set.usecase';
import { LogSportUseCase } from '../../application/use-cases/log-sport.usecase';
import { StartSessionUseCase } from '../../application/use-cases/start-session.usecase';
import { EnsureSessionDto } from '../dto/ensure-session.dto';
import { FinishSessionDto } from '../dto/finish-session.dto';
import { LogIntervalDto } from '../dto/log-interval.dto';
import { LogIsometricSetDto } from '../dto/log-isometric-set.dto';
import { LogMobilitySetDto } from '../dto/log-mobility-set.dto';
import { LogPlioSetDto } from '../dto/log-plio-set.dto';
import { LogSetDto } from '../dto/log-set.dto';
import { LogSportDto } from '../dto/log-sport.dto';
import { SessionIdParamDto } from '../dto/session-id-param.dto';
import { StartSessionDto } from '../dto/start-session.dto';

@Controller('sessions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class SessionsController {
  constructor(
    private readonly ensureSessionUseCase: EnsureSessionUseCase,
    private readonly finishSessionUseCase: FinishSessionUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly logIntervalUseCase: LogIntervalUseCase,
    private readonly logIsometricSetUseCase: LogIsometricSetUseCase,
    private readonly logMobilitySetUseCase: LogMobilitySetUseCase,
    private readonly logPlioSetUseCase: LogPlioSetUseCase,
    private readonly logSetUseCase: LogSetUseCase,
    private readonly logSportUseCase: LogSportUseCase,
    private readonly startSessionUseCase: StartSessionUseCase,
  ) {}

  @Post('ensure')
  async ensure(@Body() body: EnsureSessionDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.ensureSessionUseCase.execute(auth, {
      clientId: body.clientId,
      sessionDate: new Date(body.sessionDate),
      templateId: body.templateId,
    });
    return mapSession(session);
  }

  @Post(':sessionId/start')
  async start(@Param() params: SessionIdParamDto, @Body() body: StartSessionDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.startSessionUseCase.execute(auth, {
      preFatigue: body.preFatigue,
      preMotivation: body.preMotivation,
      preRecovery: body.preRecovery,
      sessionId: params.sessionId,
      startMode: body.startMode,
    });
    return mapSession(session);
  }

  @Post(':sessionId/log-interval')
  async logInterval(
    @Param() params: SessionIdParamDto,
    @Body() body: LogIntervalDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    return this.logIntervalUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
  }

  @Post(':sessionId/log-plio-set')
  async logPlioSet(
    @Param() params: SessionIdParamDto,
    @Body() body: LogPlioSetDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    return this.logPlioSetUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
  }

  @Post(':sessionId/log-mobility-set')
  async logMobilitySet(
    @Param() params: SessionIdParamDto,
    @Body() body: LogMobilitySetDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    return this.logMobilitySetUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
  }

  @Post(':sessionId/log-isometric-set')
  async logIsometricSet(
    @Param() params: SessionIdParamDto,
    @Body() body: LogIsometricSetDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    return this.logIsometricSetUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
  }

  @Post(':sessionId/log-sport')
  async logSport(
    @Param() params: SessionIdParamDto,
    @Body() body: LogSportDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    return this.logSportUseCase.execute(auth, { ...body, sessionId: params.sessionId }, readOffset(timezoneOffset));
  }

  @Post(':sessionId/log-set')
  async logSet(
    @Param() params: SessionIdParamDto,
    @Body() body: LogSetDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    const entry = await this.logSetUseCase.execute(
      auth,
      { ...body, sessionId: params.sessionId },
      readOffset(timezoneOffset),
    );
    return entry;
  }

  @Post(':sessionId/finish')
  async finish(
    @Param() params: SessionIdParamDto,
    @Body() body: FinishSessionDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    const session = await this.finishSessionUseCase.execute(
      auth,
      {
        comment: body.comment,
        isIncomplete: body.isIncomplete,
        postFatigue: body.postFatigue,
        postMood: body.postMood,
        postPain: body.postPain,
        sessionId: params.sessionId,
      },
      readOffset(timezoneOffset),
    );
    return mapSession(session);
  }

  @Get(':sessionId')
  async getOne(@Param() params: SessionIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.getSessionUseCase.execute(auth, params.sessionId);
    return mapSession(session);
  }
}

function mapSession(session: { finishedAt: Date | null; sessionDate: Date; startedAt: Date | null }) {
  return {
    ...session,
    finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
    sessionDate: session.sessionDate.toISOString().slice(0, 10),
    startedAt: session.startedAt ? session.startedAt.toISOString() : null,
  };
}

function readOffset(raw: string | undefined): number {
  if (!raw) {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
