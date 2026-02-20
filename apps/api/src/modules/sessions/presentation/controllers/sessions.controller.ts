import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { EnsureSessionUseCase } from '../../application/use-cases/ensure-session.usecase';
import { FinishSessionUseCase } from '../../application/use-cases/finish-session.usecase';
import { GetSessionUseCase } from '../../application/use-cases/get-session.usecase';
import { LogSetUseCase } from '../../application/use-cases/log-set.usecase';
import { StartSessionUseCase } from '../../application/use-cases/start-session.usecase';
import { EnsureSessionDto } from '../dto/ensure-session.dto';
import { FinishSessionDto } from '../dto/finish-session.dto';
import { LogSetDto } from '../dto/log-set.dto';
import { SessionIdParamDto } from '../dto/session-id-param.dto';

@Controller('sessions/strength')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class SessionsController {
  constructor(
    private readonly ensureSessionUseCase: EnsureSessionUseCase,
    private readonly finishSessionUseCase: FinishSessionUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly logSetUseCase: LogSetUseCase,
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
  async start(@Param() params: SessionIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const session = await this.startSessionUseCase.execute(auth, params.sessionId);
    return mapSession(session);
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
      { comment: body.comment, isIncomplete: body.isIncomplete, sessionId: params.sessionId },
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
