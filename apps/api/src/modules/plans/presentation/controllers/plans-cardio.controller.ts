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
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateCardioTemplateUseCase } from '../../application/use-cases/create-cardio-template.usecase';
import { DeleteCardioTemplateUseCase } from '../../application/use-cases/delete-cardio-template.usecase';
import { ListCardioTemplatesUseCase } from '../../application/use-cases/list-cardio-templates.usecase';
import { GetCardioTemplateUseCase } from '../../application/use-cases/get-cardio-template.usecase';
import { UpdateCardioTemplateUseCase } from '../../application/use-cases/update-cardio-template.usecase';
import { PlanTemplateIdParamDto } from '../dto/plan-template-id-param.dto';
import { UpsertCardioTemplateDto } from '../dto/upsert-cardio-template.dto';
import { PlanOwnershipGuard } from '../guards/plan-ownership.guard';

@Controller('plans/templates/cardio')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class PlansCardioController {
  constructor(
    private readonly createUseCase: CreateCardioTemplateUseCase,
    private readonly listUseCase: ListCardioTemplatesUseCase,
    private readonly getUseCase: GetCardioTemplateUseCase,
    private readonly updateUseCase: UpdateCardioTemplateUseCase,
    private readonly deleteUseCase: DeleteCardioTemplateUseCase,
  ) {}

  @Post()
  async create(@Body() body: UpsertCardioTemplateDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const template = await this.createUseCase.execute(auth, body);
    return mapTemplateOutput(template);
  }

  @Get()
  async list(@Req() request: HttpAuthRequest, @Query('summary') summary?: string) {
    const auth = readAuthContext(request);
    const items = await this.listUseCase.execute(auth, { summary: summary === 'true' });
    return { items: items.map(mapTemplateOutput) };
  }

  @Get(':templateId')
  async getOne(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.getUseCase.execute(auth, params.templateId);
    return mapTemplateOutput(item);
  }

  @Patch(':templateId')
  @UseGuards(PlanOwnershipGuard)
  async update(
    @Param() params: PlanTemplateIdParamDto,
    @Body() body: UpsertCardioTemplateDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const template = await this.updateUseCase.execute(auth, params.templateId, body);
    return mapTemplateOutput(template);
  }

  @Delete(':templateId')
  @UseGuards(PlanOwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteUseCase.execute(auth, params.templateId);
  }
}

function mapTemplateOutput(template: {
  createdAt: Date;
  days: unknown[];
  id: string;
  name: string;
  templateVersion: number;
  updatedAt: Date;
}) {
  return {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
