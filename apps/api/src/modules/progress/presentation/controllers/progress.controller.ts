import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { GetProgressOverviewUseCase } from '../../application/use-cases/get-progress-overview.usecase';
import { GetProgressQueryDto } from '../dto/get-progress-query.dto';

@Controller('progress')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class ProgressController {
  constructor(private readonly getProgressOverviewUseCase: GetProgressOverviewUseCase) {}

  @Get('overview')
  async getOverview(@Query() query: GetProgressQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.getProgressOverviewUseCase.execute(auth, {
      clientId: query.clientId,
      from: new Date(query.from),
      to: new Date(query.to),
    });
  }
}
