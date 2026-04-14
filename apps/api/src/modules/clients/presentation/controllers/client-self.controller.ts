import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { GetClientMeUseCase } from '../../application/use-cases/get-client-me.usecase';
import { GetClientRoutineUseCase } from '../../application/use-cases/get-client-routine.usecase';
import type { Client } from '../../domain/client';
import type { ClientRoutine } from '../../domain/client-routine';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientSelfController {
  constructor(
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
}
