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
} from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateCardioTemplateUseCase } from '../../application/use-cases/create-cardio-template.usecase';
import { DeleteCardioTemplateUseCase } from '../../application/use-cases/delete-cardio-template.usecase';
import { ListCardioTemplatesUseCase } from '../../application/use-cases/list-cardio-templates.usecase';
import { UpdateCardioTemplateUseCase } from '../../application/use-cases/update-cardio-template.usecase';
import { PlanTemplateIdParamDto } from '../dto/plan-template-id-param.dto';
import { UpsertCardioTemplateDto } from '../dto/upsert-cardio-template.dto';
import { PlanOwnershipGuard } from '../guards/plan-ownership.guard';

@Controller('plans/templates/cardio')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class PlansCardioController {
  constructor(
    private readonly createTemplateUseCase: CreateCardioTemplateUseCase,
    private readonly listTemplatesUseCase: ListCardioTemplatesUseCase,
    private readonly updateTemplateUseCase: UpdateCardioTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteCardioTemplateUseCase,
  ) { }

  @Post()
  async create(@Body() body: UpsertCardioTemplateDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const template = await this.createTemplateUseCase.execute(auth, body);
    return mapTemplateOutput(template);
  }

  @Get()
  async list(@Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listTemplatesUseCase.execute(auth);
    return { items: items.map(mapTemplateOutput) };
  }

  @Patch(':templateId')
  @UseGuards(PlanOwnershipGuard)
  async update(
    @Param() params: PlanTemplateIdParamDto,
    @Body() body: UpsertCardioTemplateDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const template = await this.updateTemplateUseCase.execute(auth, params.templateId, body);
    return mapTemplateOutput(template);
  }

  @Delete(':templateId')
  @UseGuards(PlanOwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteTemplateUseCase.execute(auth, params.templateId);
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
