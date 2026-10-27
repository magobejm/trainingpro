import { BadRequestException, Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
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

  @Put('triage/collapsed')
  setCollapsed(@Req() request: HttpAuthRequest, @Body() body: { collapsed?: unknown }) {
    const list = body?.collapsed;
    if (!Array.isArray(list) || list.length > 20 || list.some((id) => typeof id !== 'string')) {
      throw new BadRequestException('collapsed must be a list of category ids');
    }
    return this.triage.setCollapsed(readAuthContext(request), list as string[]);
  }
}
