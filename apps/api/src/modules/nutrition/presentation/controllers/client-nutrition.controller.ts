import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { NutritionService } from '../../application/nutrition.service';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientNutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('me/nutrition')
  async getMyNutrition(@Req() request: HttpAuthRequest) {
    return this.nutritionService.getClientNutrition(readAuthContext(request));
  }
}
