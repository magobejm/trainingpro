import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../common/auth-context/read-auth-context';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../auth/presentation/http-auth-request';
import { CoachTriageService } from './coach-triage.service';

@Controller('coach')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CoachHomeController {
  constructor(private readonly triage: CoachTriageService) {}

  @Get('triage')
  triageToday(@Req() request: HttpAuthRequest) {
    return this.triage.execute(readAuthContext(request));
  }
}
