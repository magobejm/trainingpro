import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { GetExerciseProgressUseCase } from '../../application/use-cases/get-exercise-progress.usecase';
import { GetMicrocycleProgressUseCase } from '../../application/use-cases/get-microcycle-progress.usecase';
import { GetProgressOverviewUseCase } from '../../application/use-cases/get-progress-overview.usecase';
import { GetRecentSessionsUseCase } from '../../application/use-cases/get-recent-sessions.usecase';
import { GetSessionProgressUseCase } from '../../application/use-cases/get-session-progress.usecase';
import { GetExerciseProgressQueryDto } from '../dto/get-exercise-progress-query.dto';
import { GetMicrocycleProgressQueryDto } from '../dto/get-microcycle-progress-query.dto';
import { GetProgressQueryDto } from '../dto/get-progress-query.dto';
import { GetRecentSessionsQueryDto } from '../dto/get-recent-sessions-query.dto';
import { GetSessionProgressQueryDto } from '../dto/get-session-progress-query.dto';

@Controller('progress')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class ProgressController {
  constructor(
    private readonly getProgressOverviewUseCase: GetProgressOverviewUseCase,
    private readonly getExerciseProgressUseCase: GetExerciseProgressUseCase,
    private readonly getSessionProgressUseCase: GetSessionProgressUseCase,
    private readonly getMicrocycleProgressUseCase: GetMicrocycleProgressUseCase,
    private readonly getRecentSessionsUseCase: GetRecentSessionsUseCase,
  ) {}

  @Get('overview')
  async getOverview(@Query() query: GetProgressQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = GetProgressQueryDto.schema.parse(query);
    return this.getProgressOverviewUseCase.execute(auth, {
      clientId: parsed.clientId,
      from: new Date(parsed.from),
      to: new Date(parsed.to),
    });
  }

  @Get('exercise')
  async getExerciseProgress(@Query() query: GetExerciseProgressQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = GetExerciseProgressQueryDto.schema.parse(query);
    return this.getExerciseProgressUseCase.execute(auth, {
      clientId: parsed.clientId,
      exerciseId: parsed.exerciseId,
      from: new Date(parsed.from),
      to: new Date(parsed.to),
    });
  }

  @Get('session')
  async getSessionProgress(@Query() query: GetSessionProgressQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = GetSessionProgressQueryDto.schema.parse(query);
    return this.getSessionProgressUseCase.execute(auth, {
      clientId: parsed.clientId,
      templateId: parsed.templateId,
      dayIndex: parsed.dayIndex,
      from: new Date(parsed.from),
      to: new Date(parsed.to),
    });
  }

  @Get('microcycle')
  async getMicrocycleProgress(@Query() query: GetMicrocycleProgressQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = GetMicrocycleProgressQueryDto.schema.parse(query);
    return this.getMicrocycleProgressUseCase.execute(auth, {
      clientId: parsed.clientId,
      templateId: parsed.templateId,
      from: new Date(parsed.from),
      to: new Date(parsed.to),
    });
  }

  @Get('sessions')
  async getRecentSessions(@Query() query: GetRecentSessionsQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = GetRecentSessionsQueryDto.schema.parse(query);
    return this.getRecentSessionsUseCase.execute(auth, {
      clientId: parsed.clientId,
      exerciseId: parsed.exerciseId,
      templateId: parsed.templateId,
      from: new Date(parsed.from),
      to: new Date(parsed.to),
      limit: parsed.limit ?? 20,
    });
  }
}
