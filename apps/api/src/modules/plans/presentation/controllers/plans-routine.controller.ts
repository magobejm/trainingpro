import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PlanOwnershipGuard } from '../guards/plan-ownership.guard';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { pageByName } from '../../../../common/pagination/page-by-name';
import { withNextCursor } from '../../../../common/pagination/page-query';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateRoutineTemplateUseCase } from '../../application/use-cases/create-routine-template.usecase';
import { DeleteRoutineTemplateUseCase } from '../../application/use-cases/delete-routine-template.usecase';
import { ListRoutineObjectivesUseCase } from '../../application/use-cases/list-routine-objectives.usecase';
import { ListRoutineTemplatesUseCase } from '../../application/use-cases/list-routine-templates.usecase';
import { GetRoutineTemplateUseCase } from '../../application/use-cases/get-routine-template.usecase';
import { UpdateRoutineTemplateUseCase } from '../../application/use-cases/update-routine-template.usecase';
import { PlanTemplateIdParamDto } from '../dto/plan-template-id-param.dto';
import { ListPlanTemplatesQueryDto } from '../dto/list-plan-templates-query.dto';
import { UpsertRoutineTemplateDto } from '../dto/upsert-routine-template.dto';

@Controller('plans/templates/routines')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class PlansRoutineController {
  constructor(
    private readonly createUseCase: CreateRoutineTemplateUseCase,
    private readonly listUseCase: ListRoutineTemplatesUseCase,
    private readonly listObjectivesUseCase: ListRoutineObjectivesUseCase,
    private readonly getUseCase: GetRoutineTemplateUseCase,
    private readonly updateUseCase: UpdateRoutineTemplateUseCase,
    private readonly deleteUseCase: DeleteRoutineTemplateUseCase,
  ) {}

  @Get('catalog/objectives')
  async listObjectives() {
    const items = await this.listObjectivesUseCase.execute();
    return { items };
  }

  @Post()
  async create(@Body() body: UpsertRoutineTemplateDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = UpsertRoutineTemplateDto.schema.parse(body);
    const template = await this.createUseCase.execute(auth, parsed);
    return mapOutput(template);
  }

  @Get()
  async list(@Req() request: HttpAuthRequest, @Query() query: ListPlanTemplatesQueryDto) {
    const auth = readAuthContext(request);
    const parsed = ListPlanTemplatesQueryDto.schema.parse(query);
    const items = (await this.listUseCase.execute(auth, { summary: parsed.summary === 'true' })) as Array<{
      createdAt: Date;
      id: string;
      name: string;
      updatedAt: Date;
    }>;
    const page = pageByName(items, parsed);
    return withNextCursor({ items: page.items.map(mapOutput) }, page.nextCursor);
  }

  @Get(':templateId')
  async getOne(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.getUseCase.execute(auth, params.templateId);
    return mapOutput(item);
  }

  @Patch(':templateId')
  @UseGuards(PlanOwnershipGuard)
  async update(
    @Param() params: PlanTemplateIdParamDto,
    @Body() body: UpsertRoutineTemplateDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const parsed = UpsertRoutineTemplateDto.schema.parse(body);
    const template = await this.updateUseCase.execute(auth, params.templateId, parsed);
    return mapOutput(template);
  }

  @Delete(':templateId')
  @UseGuards(PlanOwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteUseCase.execute(auth, params.templateId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOutput(template: any) {
  return {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
