import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ActivateCoachUseCase } from '../../application/activate-coach.usecase';
import { ArchiveCoachUseCase } from '../../application/archive-coach.usecase';
import { CreateCoachUseCase } from '../../application/create-coach.usecase';
import { DeactivateCoachUseCase } from '../../application/deactivate-coach.usecase';
import { ListCoachesUseCase } from '../../application/list-coaches.usecase';
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
    private readonly listCoachesUseCase: ListCoachesUseCase,
  ) {}

  @Get()
  list(@Req() request: HttpAuthRequest) {
    return this.listCoachesUseCase.execute(readAdminUid(request));
  }

  @Post()
  create(@Body() body: CreateCoachDto, @Req() request: HttpAuthRequest) {
    return this.createCoachUseCase.execute(readAdminUid(request), body);
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
