import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { PhysicalTestsService } from '../../application/physical-tests.service';
import { ClientMePhysicalTestParamsDto } from '../dto/client-me-physical-test-params.dto';
import { RecordPhysicalTestResultDto } from '../dto/record-physical-test-result.dto';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientPhysicalTestsController {
  constructor(private readonly physicalTestsService: PhysicalTestsService) {}

  @Get('me/physical-tests')
  async listMyAssignedTests(@Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    return this.physicalTestsService.listAssignedTestsForClient(context);
  }

  @Post('me/physical-tests/:testId/results')
  async recordMyResult(
    @Param() params: ClientMePhysicalTestParamsDto,
    @Body() body: RecordPhysicalTestResultDto,
    @Req() request: HttpAuthRequest,
  ) {
    const context = readAuthContext(request);
    return this.physicalTestsService.recordResultForClient(context, params.testId, body);
  }
}
