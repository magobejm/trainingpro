import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UpdateClientLimitUseCase } from '../../application/update-client-limit.usecase';
import { GetOrgOccupancyUseCase } from '../../application/get-org-occupancy.usecase';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { UpdateClientLimitDto } from '../dto/update-client-limit.dto';

@Controller('org/subscription')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class OrgAdminController {
  constructor(
    private readonly getOrgOccupancyUseCase: GetOrgOccupancyUseCase,
    private readonly updateClientLimitUseCase: UpdateClientLimitUseCase,
  ) {}

  @Get('occupancy')
  async getOccupancy(@Req() request: HttpAuthRequest) {
    const adminUid = request.user?.subject ?? '';
    return this.getOrgOccupancyUseCase.execute(adminUid);
  }

  @Patch('limit')
  async setClientLimit(
    @Body() body: UpdateClientLimitDto,
    @Req() request: HttpAuthRequest,
  ) {
    const adminUid = request.user?.subject ?? '';
    return this.updateClientLimitUseCase.execute(adminUid, body.clientLimit);
  }
}
