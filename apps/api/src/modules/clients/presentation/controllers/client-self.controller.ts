import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { EnsureClientSelfSessionUseCase } from '../../application/use-cases/ensure-client-self-session.usecase';
import { GetClientMeUseCase } from '../../application/use-cases/get-client-me.usecase';
import { GetClientRoutineUseCase } from '../../application/use-cases/get-client-routine.usecase';
import type { Client } from '../../domain/client';
import type { ClientRoutine } from '../../domain/client-routine';
import { EnsureClientSelfSessionDto } from '../dto/ensure-client-self-session.dto';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientSelfController {
  constructor(
    private readonly ensureClientSelfSessionUseCase: EnsureClientSelfSessionUseCase,
    private readonly getClientMeUseCase: GetClientMeUseCase,
    private readonly getClientRoutineUseCase: GetClientRoutineUseCase,
  ) {}

  @Get('me')
  async getMe(@Req() request: HttpAuthRequest): Promise<Client> {
    const context = readAuthContext(request);
    return this.getClientMeUseCase.execute(context);
  }

  @Get('me/routine')
  async getMyRoutine(@Req() request: HttpAuthRequest): Promise<ClientRoutine> {
    const context = readAuthContext(request);
    return this.getClientRoutineUseCase.execute(context);
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
