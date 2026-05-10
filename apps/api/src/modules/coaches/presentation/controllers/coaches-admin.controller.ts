import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ActivateCoachUseCase } from '../../application/activate-coach.usecase';
import { ArchiveCoachUseCase } from '../../application/archive-coach.usecase';
import { CreateCoachUseCase } from '../../application/create-coach.usecase';
import { DeactivateCoachUseCase } from '../../application/deactivate-coach.usecase';
import { ListArchivedCoachesUseCase } from '../../application/list-archived-coaches.usecase';
import { ListCoachesUseCase } from '../../application/list-coaches.usecase';
import { RestoreCoachUseCase } from '../../application/restore-coach.usecase';
import { CoachIdParamDto } from '../dto/coach-id-param.dto';
import { CreateCoachDto } from '../dto/create-coach.dto';

@Controller('coaches')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class CoachesAdminController {
  constructor(
    private readonly activateCoachUseCase: ActivateCoachUseCase,
    private readonly archiveCoachUseCase: ArchiveCoachUseCase,
    private readonly createCoachUseCase: CreateCoachUseCase,
    private readonly deactivateCoachUseCase: DeactivateCoachUseCase,
    private readonly listArchivedCoachesUseCase: ListArchivedCoachesUseCase,
    private readonly listCoachesUseCase: ListCoachesUseCase,
    private readonly restoreCoachUseCase: RestoreCoachUseCase,
  ) {}

  @Get()
  list(@Query('archived') archived: string | undefined, @Req() request: HttpAuthRequest) {
    const adminUid = readAdminUid(request);
    if (archived === '1' || archived === 'true') {
      return this.listArchivedCoachesUseCase.execute(adminUid);
    }
    return this.listCoachesUseCase.execute(adminUid);
  }

  @Post(':coachMembershipId/restore')
  restore(@Param() params: CoachIdParamDto, @Req() request: HttpAuthRequest) {
    return this.restoreCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
  }

  @Post()
  create(@Body() body: CreateCoachDto, @Req() request: HttpAuthRequest) {
    const parsed = CreateCoachDto.schema.parse(body);
    return this.createCoachUseCase.execute(readAdminUid(request), { email: parsed.email });
  }

  @Patch(':coachMembershipId/activate')
  activate(@Param() params: CoachIdParamDto, @Req() request: HttpAuthRequest) {
    return this.activateCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
  }

  @Patch(':coachMembershipId/deactivate')
  deactivate(@Param() params: CoachIdParamDto, @Req() request: HttpAuthRequest) {
    return this.deactivateCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
  }

  @Delete(':coachMembershipId')
  archive(@Param() params: CoachIdParamDto, @Req() request: HttpAuthRequest) {
    return this.archiveCoachUseCase.execute(readAdminUid(request), params.coachMembershipId);
  }
}

function readAdminUid(request: HttpAuthRequest): string {
  return request.user?.subject ?? '';
}
