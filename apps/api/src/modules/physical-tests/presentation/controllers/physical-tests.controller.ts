import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { PhysicalTestsService } from '../../application/physical-tests.service';
import { ClientPhysicalTestParamsDto } from '../dto/client-physical-test-params.dto';
import { RecordPhysicalTestResultDto } from '../dto/record-physical-test-result.dto';
import { SchedulePhysicalTestDto } from '../dto/schedule-physical-test.dto';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class PhysicalTestsController {
  constructor(private readonly physicalTestsService: PhysicalTestsService) {}

  @Get('physical-tests')
  async listCatalog() {
    return this.physicalTestsService.listCatalog();
  }

  @Get('clients/:clientId/physical-tests')
  async listClientAssignments(@Param('clientId') clientId: string, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    return this.physicalTestsService.listClientAssignmentsForCoach(context, clientId);
  }

  @Post('clients/:clientId/physical-tests/:testId')
  async assignTest(@Param() params: ClientPhysicalTestParamsDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    return this.physicalTestsService.assignTestForCoach(context, params.clientId, params.testId);
  }

  @Delete('clients/:clientId/physical-tests/:testId')
  async unassignTest(@Param() params: ClientPhysicalTestParamsDto, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    await this.physicalTestsService.unassignTestForCoach(context, params.clientId, params.testId);
    return { success: true };
  }

  @Get('clients/:clientId/physical-test-schedules')
  async listSchedules(@Param('clientId') clientId: string, @Req() request: HttpAuthRequest) {
    const context = readAuthContext(request);
    return this.physicalTestsService.listSchedulesForCoach(context, clientId);
  }

  @Post('clients/:clientId/physical-test-schedules')
  async scheduleTest(
    @Param('clientId') clientId: string,
    @Body() body: SchedulePhysicalTestDto,
    @Req() request: HttpAuthRequest,
  ) {
    const context = readAuthContext(request);
    return this.physicalTestsService.scheduleTestForCoach(context, clientId, body);
  }

  @Delete('clients/:clientId/physical-test-schedules/:scheduleId')
  async archiveSchedule(
    @Param('clientId') clientId: string,
    @Param('scheduleId') scheduleId: string,
    @Req() request: HttpAuthRequest,
  ) {
    const context = readAuthContext(request);
    await this.physicalTestsService.archiveScheduleForCoach(context, clientId, scheduleId);
    return { success: true };
  }

  @Post('clients/:clientId/physical-tests/:testId/results')
  async recordResult(
    @Param() params: ClientPhysicalTestParamsDto,
    @Body() body: RecordPhysicalTestResultDto,
    @Req() request: HttpAuthRequest,
  ) {
    const context = readAuthContext(request);
    return this.physicalTestsService.recordResultForCoach(context, params.clientId, params.testId, body);
  }
}
