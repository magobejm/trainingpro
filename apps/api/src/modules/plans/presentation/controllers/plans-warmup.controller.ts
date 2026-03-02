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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { WarmupTemplatesService } from '../../application/services/warmup-templates.service';
import { PlanTemplateIdParamDto } from '../dto/plan-template-id-param.dto';
import { UpsertWarmupTemplateDto } from '../dto/upsert-warmup-template.dto';

@Controller('plans/templates/warmups')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class PlansWarmupController {
  constructor(private readonly service: WarmupTemplatesService) {}

  @Post()
  async create(@Body() body: UpsertWarmupTemplateDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const parsed = UpsertWarmupTemplateDto.schema.parse(body);
    const item = await this.service.create(auth, parsed);
    return mapOutput(item);
  }

  @Get()
  async list(@Req() request: HttpAuthRequest, @Query('summary') summary?: string) {
    const auth = readAuthContext(request);
    const items = await this.service.list(auth, { summary: summary === 'true' });
    return { items: items.map(mapOutput) };
  }

  @Get(':templateId')
  async getOne(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.service.getOne(auth, params.templateId);
    return mapOutput(item);
  }

  @Patch(':templateId')
  async update(
    @Param() params: PlanTemplateIdParamDto,
    @Body() body: UpsertWarmupTemplateDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const parsed = UpsertWarmupTemplateDto.schema.parse(body);
    const item = await this.service.update(auth, params.templateId, parsed);
    return mapOutput(item);
  }

  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: PlanTemplateIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.service.delete(auth, params.templateId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOutput(item: any) {
  return {
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
  };
}
