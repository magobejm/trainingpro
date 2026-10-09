import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { PhysicalTestsService } from '../../application/physical-tests.service';
import { ClientMePhysicalTestParamsDto } from '../dto/client-me-physical-test-params.dto';
import { RecordPhysicalTestResultDto } from '../dto/record-physical-test-result.dto';
import { PhysicalTestScheduleRangeQueryDto } from '../dto/schedule-physical-test.dto';

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

  @Get('me/physical-test-schedules')
  async listMySchedules(@Query() query: PhysicalTestScheduleRangeQueryDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    return this.physicalTestsService.listSchedulesForClient(context, new Date(query.dateFrom), new Date(query.dateTo));
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
