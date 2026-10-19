import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ClientOwnershipGuard } from '../guards/client-ownership.guard';
import { ClientIdParamDto } from '../dto/client-id-param.dto';
import { RoutineDayColorParamDto, UpdateRoutineDayColorDto } from '../dto/routine-day-color.dto';
import { ClientRoutineColorsService } from '../../application/services/client-routine-colors.service';

@Controller('clients/:clientId/routine-day-colors')
@UseGuards(AuthGuard, RolesGuard, ClientOwnershipGuard)
@Roles('coach')
export class ClientRoutineColorsController {
  constructor(private readonly colors: ClientRoutineColorsService) {}

  @Get()
  list(@Param() params: ClientIdParamDto) {
    return this.colors.list(params.clientId);
  }

  @Patch(':planDayId')
  save(@Param() params: RoutineDayColorParamDto, @Body() body: UpdateRoutineDayColorDto) {
    return this.colors.save(params.clientId, params.planDayId, body.color);
  }
}
