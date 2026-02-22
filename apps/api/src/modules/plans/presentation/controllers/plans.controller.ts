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
import { PlanOwnershipGuard } from '../guards/plan-ownership.guard';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateTemplateUseCase } from '../../application/use-cases/create-template.usecase';
import { ListTemplatesUseCase } from '../../application/use-cases/list-templates.usecase';
import { UpdateTemplateUseCase } from '../../application/use-cases/update-template.usecase';
import { DeleteTemplateUseCase } from '../../application/use-cases/delete-template.usecase';
import { PlanTemplateIdParamDto } from '../dto/plan-template-id-param.dto';
import { UpsertPlanTemplateDto } from '../dto/upsert-plan-template.dto';

@Controller('plans/templates/strength')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class PlansController {
  constructor(
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase,
  ) { }

  @Post()
  async create(@Body() body: UpsertPlanTemplateDto, @Req() request: HttpAuthRequest) {
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
    @Body() body: UpsertPlanTemplateDto,
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
