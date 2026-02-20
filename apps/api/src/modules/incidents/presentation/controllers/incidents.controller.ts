import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { AddAdjustmentDraftUseCase } from '../../application/use-cases/add-adjustment-draft.usecase';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.usecase';
import { ListIncidentsUseCase } from '../../application/use-cases/list-incidents.usecase';
import { MarkIncidentReviewedUseCase } from '../../application/use-cases/mark-incident-reviewed.usecase';
import { RespondIncidentUseCase } from '../../application/use-cases/respond-incident.usecase';
import { TagIncidentUseCase } from '../../application/use-cases/tag-incident.usecase';
import { AdjustmentDraftDto } from '../dto/adjustment-draft.dto';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { IncidentIdParamDto } from '../dto/incident-id-param.dto';
import { ListIncidentsQueryDto } from '../dto/list-incidents-query.dto';
import { RespondIncidentDto } from '../dto/respond-incident.dto';
import { TagIncidentDto } from '../dto/tag-incident.dto';

@Controller('incidents')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach', 'client')
export class IncidentsController {
  constructor(
    private readonly addAdjustmentDraftUseCase: AddAdjustmentDraftUseCase,
    private readonly createIncidentUseCase: CreateIncidentUseCase,
    private readonly listIncidentsUseCase: ListIncidentsUseCase,
    private readonly markIncidentReviewedUseCase: MarkIncidentReviewedUseCase,
    private readonly respondIncidentUseCase: RespondIncidentUseCase,
    private readonly tagIncidentUseCase: TagIncidentUseCase,
  ) {}

  @Post()
  @Roles('client')
  async create(@Body() body: CreateIncidentDto, @Req() request: HttpAuthRequest) {
    return this.createIncidentUseCase.execute(readAuthContext(request), body);
  }

  @Get()
  async list(@Query() query: ListIncidentsQueryDto, @Req() request: HttpAuthRequest) {
    return this.listIncidentsUseCase.execute(readAuthContext(request), query);
  }

  @Post(':incidentId/review')
  @Roles('coach')
  async review(@Param() params: IncidentIdParamDto, @Req() request: HttpAuthRequest) {
    return this.markIncidentReviewedUseCase.execute(readAuthContext(request), params.incidentId);
  }

  @Post(':incidentId/respond')
  @Roles('coach')
  async respond(
    @Param() params: IncidentIdParamDto,
    @Body() body: RespondIncidentDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    return this.respondIncidentUseCase.execute(auth, params.incidentId, body.response);
  }

  @Post(':incidentId/tag')
  @Roles('coach')
  async tag(
    @Param() params: IncidentIdParamDto,
    @Body() body: TagIncidentDto,
    @Req() request: HttpAuthRequest,
  ) {
    return this.tagIncidentUseCase.execute(readAuthContext(request), params.incidentId, body.tag);
  }

  @Post(':incidentId/adjustment-draft')
  @Roles('coach')
  async adjustmentDraft(
    @Param() params: IncidentIdParamDto,
    @Body() body: AdjustmentDraftDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    return this.addAdjustmentDraftUseCase.execute(auth, params.incidentId, body.draft);
  }
}
