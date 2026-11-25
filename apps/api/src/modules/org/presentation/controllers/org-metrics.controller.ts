import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { OrgMetricsService } from '../../application/org-metrics.service';

@Controller('org')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class OrgMetricsController {
  constructor(private readonly metrics: OrgMetricsService) {}

  @Get('coaches/metrics')
  coaches(@Req() request: HttpAuthRequest) {
    return this.metrics.coachMetrics(request.user?.subject ?? '');
  }

  @Get('subscription/billing-estimate')
  billing(@Req() request: HttpAuthRequest) {
    return this.metrics.billingEstimate(request.user?.subject ?? '');
  }
}
