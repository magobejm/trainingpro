import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { EnsureCardioSessionUseCase } from '../../application/use-cases/ensure-cardio-session.usecase';
import { FinishCardioSessionUseCase } from '../../application/use-cases/finish-cardio-session.usecase';
import { GetCardioSessionUseCase } from '../../application/use-cases/get-cardio-session.usecase';
import { LogIntervalUseCase } from '../../application/use-cases/log-interval.usecase';
import { StartCardioSessionUseCase } from '../../application/use-cases/start-cardio-session.usecase';
import { EnsureCardioSessionDto } from '../dto/ensure-cardio-session.dto';
import { FinishSessionDto } from '../dto/finish-session.dto';
import { LogIntervalDto } from '../dto/log-interval.dto';
import { SessionIdParamDto } from '../dto/session-id-param.dto';

@Controller('sessions/cardio')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class SessionsCardioController {
  constructor(
    private readonly ensureCardioSessionUseCase: EnsureCardioSessionUseCase,
    private readonly finishCardioSessionUseCase: FinishCardioSessionUseCase,
    private readonly getCardioSessionUseCase: GetCardioSessionUseCase,
    private readonly logIntervalUseCase: LogIntervalUseCase,
    private readonly startCardioSessionUseCase: StartCardioSessionUseCase,
  ) {}

  @Post('ensure')
  async ensure(@Body() body: EnsureCardioSessionDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.ensureCardioSessionUseCase.execute(auth, {
      clientId: body.clientId,
      sessionDate: new Date(body.sessionDate),
      templateId: body.templateId,
    });
    return mapSession(session);
  }

  @Post(':sessionId/start')
  async start(@Param() params: SessionIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.startCardioSessionUseCase.execute(auth, params.sessionId);
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
    return this.logIntervalUseCase.execute(
      auth,
      { ...body, sessionId: params.sessionId },
      readOffset(timezoneOffset),
    );
  }

  @Post(':sessionId/finish')
  async finish(
    @Param() params: SessionIdParamDto,
    @Body() body: FinishSessionDto,
    @Req() request: HttpAuthRequest,
    @Headers('x-timezone-offset') timezoneOffset?: string,
  ) {
    const auth = readAuthContext(request);
    const session = await this.finishCardioSessionUseCase.execute(
      auth,
      { comment: body.comment, isIncomplete: body.isIncomplete, sessionId: params.sessionId },
      readOffset(timezoneOffset),
    );
    return mapSession(session);
  }

  @Get(':sessionId')
  async getOne(@Param() params: SessionIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.getCardioSessionUseCase.execute(auth, params.sessionId);
    return mapSession(session);
  }
}

function mapSession(session: {
  finishedAt: Date | null;
  sessionDate: Date;
  startedAt: Date | null;
}) {
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
