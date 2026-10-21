import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { FirstWorkoutGuideService } from '../../application/services/first-workout-guide.service';

@Controller('clients/me/first-workout-guide')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class FirstWorkoutGuideController {
  constructor(private readonly service: FirstWorkoutGuideService) {}

  @Get()
  get(@Req() request: HttpAuthRequest) {
    return this.service.get(readAuthContext(request));
  }

  @Patch()
  patch(@Req() request: HttpAuthRequest, @Body() body: unknown) {
    return this.service.patch(readAuthContext(request), body);
  }
}
