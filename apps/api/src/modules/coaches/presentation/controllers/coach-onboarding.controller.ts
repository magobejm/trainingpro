import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CoachOnboardingService } from '../../application/coach-onboarding.service';

@Controller('coaches/me/onboarding')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class CoachOnboardingController {
  constructor(private readonly onboarding: CoachOnboardingService) {}

  @Get()
  get(@Req() request: HttpAuthRequest) {
    return this.onboarding.get(readAuthContext(request));
  }

  @Patch()
  patch(@Req() request: HttpAuthRequest, @Body() body: unknown) {
    return this.onboarding.patch(readAuthContext(request), body);
  }
}
